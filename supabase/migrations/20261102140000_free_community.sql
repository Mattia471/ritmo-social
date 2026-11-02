-- Ritmo Social v0.5 | Free community launch. Run after the initial schema migration.
-- Remove the paid-only quota and apply the same modest anti-spam limit to everyone.
drop trigger if exists tr_free_quota on public.events;
drop function if exists public.enforce_free_quota();

create or replace function public.enforce_event_daily_limit()
returns trigger language plpgsql security definer set search_path='' as $$
declare recent_count integer;
begin
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(new.host_id::text, 0));
  select count(*) into recent_count from public.events e
  where e.host_id = new.host_id and e.created_at > pg_catalog.now() - interval '24 hours';
  if recent_count >= 10 then
    raise exception 'Limite anti-spam raggiunto: massimo 10 eventi in 24 ore.';
  end if;
  return new;
end $$;
revoke all on function public.enforce_event_daily_limit() from public, anon, authenticated;
create trigger tr_event_daily_limit before insert on public.events
for each row execute function public.enforce_event_daily_limit();


-- v0.7 onboarding preparation (new dedicated database only)
-- Profiles contain voluntary non-sensitive preferences. Contact number is PRIVATE.
alter table public.profiles
  add column if not exists first_name text not null default '' check (char_length(first_name) <= 40),
  add column if not exists last_name text not null default '' check (char_length(last_name) <= 40),
  add column if not exists dances text[] not null default array[]::text[] check (dances <@ array['Bachata','Salsa','Kizomba','Merengue']::text[] and cardinality(dances) <= 4),
  add column if not exists years_experience integer not null default 0 check (years_experience between 0 and 50);
grant update (dances, years_experience) on public.profiles to authenticated;

create table if not exists public.profile_contacts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  phone text not null check (phone ~ '^\+[1-9][0-9]{6,14}$'),
  created_at timestamptz not null default now()
);
alter table public.profile_contacts enable row level security;
revoke all on public.profile_contacts from anon, authenticated;
grant select on public.profile_contacts to authenticated;
create policy contact_read_own on public.profile_contacts
  for select to authenticated using (user_id = (select auth.uid()));

-- Only the signup trigger writes contacts. Metadata is user-controlled, and is NEVER
-- used for RLS or authorization decisions. Phone is not presented as verified.
create or replace function public.on_auth_signup() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_first text;
  v_last text;
  v_phone text;
  v_city text;
  v_dances text[];
  v_years int;
begin
  v_first := left(btrim(coalesce(new.raw_user_meta_data->>'first_name','')),40);
  v_last := left(btrim(coalesce(new.raw_user_meta_data->>'last_name','')),40);
  v_phone := pg_catalog.regexp_replace(coalesce(new.raw_user_meta_data->>'phone',''), '[ ().-]', '', 'g');
  if v_phone !~ '^\+[1-9][0-9]{6,14}$' then
    raise exception 'Numero di telefono obbligatorio nel formato internazionale.';
  end if;
  v_city := coalesce(new.raw_user_meta_data->>'city','Roma');
  if not exists (select 1 from public.area_centers where city=v_city) then v_city := 'Roma'; end if;
  select coalesce(array_agg(distinct v), array[]::text[]) into v_dances
  from pg_catalog.jsonb_array_elements_text(
     case when pg_catalog.jsonb_typeof(new.raw_user_meta_data->'dances')='array'
          then new.raw_user_meta_data->'dances' else '[]'::jsonb end
  ) as styles(v)
  where v in ('Bachata','Salsa','Kizomba','Merengue');
  if cardinality(v_dances) = 0 then raise exception 'Seleziona almeno un ballo.'; end if;
  v_years := case when (new.raw_user_meta_data->>'years_experience') ~ '^([0-9]|[1-4][0-9]|50)$'
    then (new.raw_user_meta_data->>'years_experience')::integer else 0 end;
  insert into public.profiles(id, display_name, first_name, last_name, city, dances, years_experience)
  values (new.id, left(v_first || ' ' || v_last,64), v_first, v_last, v_city, v_dances, v_years);
  insert into public.profile_contacts(user_id, phone) values (new.id, v_phone);
  insert into public.subscriptions(user_id) values (new.id);
  return new;
end $$;
revoke all on function public.on_auth_signup() from public, anon, authenticated;

-- New area centers used only as approximate public coordinates; never exact venue address.
insert into public.area_centers(city,area,lat,lng) values
('Milano','Città Studi',45.478,9.230),('Milano','Porta Venezia',45.473,9.206),('Milano','Centro',45.464,9.190),
('Napoli','Posillipo',40.813,14.204),('Napoli','Arenella',40.863,14.231),
('Palermo','Centro storico',38.117,13.362),('Palermo','Politeama',38.125,13.355),
('Palermo','Mondello',38.198,13.327),('Palermo','Notarbartolo',38.132,13.342),
('Palermo','Zisa',38.119,13.335),('Palermo','Oreto',38.101,13.365)
on conflict (city,area) do nothing;
