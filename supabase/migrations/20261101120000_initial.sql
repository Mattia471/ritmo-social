-- Ritmo Social · primo schema protetto
-- Applicare al proprio progetto Supabase (prima in staging).
-- L'indirizzo esatto NON compare mai nella tabella pubblica degli eventi.
create extension if not exists pgcrypto with schema extensions;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 64),
  city text not null default 'Roma',
  bio text not null default '' check (char_length(bio) <= 280),
  created_at timestamptz not null default now()
);

create table public.subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan text not null default 'free' check (plan in ('free','organizer_plus')),
  status text not null default 'inactive' check (status in ('inactive','active','trialing','past_due','canceled','unpaid')),
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  current_period_end timestamptz,
  updated_at timestamptz not null default now()
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 3 and 90),
  description text not null default '' check (char_length(description) <= 2000),
  city text not null,
  area text not null,
  -- Coordinate solo indicative del quartiere, selezionate da un elenco predefinito.
  public_lat double precision not null check (public_lat between -90 and 90),
  public_lng double precision not null check (public_lng between -180 and 180),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  cover_url text not null default '',
  dances text[] not null default array['Bachata'],
  price numeric(8,2) not null default 0 check (price between 0 and 500),
  max_people integer not null default 30 check (max_people between 2 and 500),
  approved_count integer not null default 0 check (approved_count >= 0),
  featured boolean not null default false,
  status text not null default 'published' check (status in ('published','canceled')),
  created_at timestamptz not null default now(),
  constraint correct_duration check (ends_at > starts_at),
  constraint dance_styles_valid check (cardinality(dances) between 1 and 4 and dances <@ array['Bachata','Salsa','Kizomba','Merengue']::text[])
);

-- Dataset di centri di zona gestito dal server. Le coordinate pubbliche NON vengono
-- mai prese dall'indirizzo preciso né da una coordinata scelta dal client.
create table public.area_centers (
  city text not null,
  area text not null,
  lat double precision not null,
  lng double precision not null,
  primary key (city,area)
);
insert into public.area_centers(city,area,lat,lng) values
('Roma','Trastevere',41.889,12.469),('Roma','San Lorenzo',41.898,12.516),
('Roma','Ostiense',41.862,12.481),('Roma','Pigneto',41.889,12.533),
('Roma','Monte Mario',41.941,12.442),('Roma','Eur',41.831,12.469),
('Roma','Tiburtina',41.911,12.540),('Roma','Centro',41.900,12.490),
('Napoli','Vomero',40.844,14.228),('Napoli','Chiaia',40.831,14.232),
('Napoli','Centro storico',40.850,14.257),('Napoli','Fuorigrotta',40.823,14.191),
('Milano','Navigli',45.451,9.174),('Milano','Isola',45.489,9.186),
('Milano','Porta Romana',45.452,9.200),
('Bologna','Centro',44.494,11.342),('Bologna','Bolognina',44.511,11.348),
('Firenze','Centro',43.771,11.255),('Firenze','Novoli',43.790,11.226);

create table public.event_private (
  event_id uuid primary key references public.events(id) on delete cascade,
  address text not null check (char_length(address) between 5 and 250),
  directions text not null default '' check (char_length(directions) <= 400)
);

create table public.attendances (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now(),
  unique (event_id,user_id)
);

create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (char_length(btrim(content)) between 1 and 1200),
  created_at timestamptz not null default now()
);

create index idx_events_start on public.events (starts_at) where status='published';
create index idx_events_city on public.events (city, area);
create index idx_attendances_event_status on public.attendances (event_id,status);
create index idx_attendances_user on public.attendances (user_id);
create index idx_messages_room_time on public.chat_messages (event_id,created_at desc);

-- Protezione anche su tabelle esposte al Data API.
alter table public.profiles enable row level security;
alter table public.subscriptions enable row level security;
alter table public.events enable row level security;
alter table public.event_private enable row level security;
alter table public.area_centers enable row level security;
alter table public.attendances enable row level security;
alter table public.chat_messages enable row level security;

-- GRANT a privilegi minimi, senza scrittura nelle tabelle sensibili.
revoke all on table public.profiles,public.subscriptions,public.events,public.event_private,public.attendances,public.chat_messages,public.area_centers from anon,authenticated;
grant select on table public.profiles,public.subscriptions,public.events,public.event_private,public.attendances,public.chat_messages,public.area_centers to authenticated;
grant update (display_name,city,bio) on public.profiles to authenticated;
grant insert (event_id,user_id,status) on public.attendances to authenticated;
grant delete on public.attendances to authenticated;
grant insert (event_id,user_id,content) on public.chat_messages to authenticated;

create policy area_centers_read on public.area_centers for select to authenticated using (true);
create policy profiles_read on public.profiles for select to authenticated using (true);
create policy profiles_edit_self on public.profiles for update to authenticated
  using (id=(select auth.uid())) with check (id=(select auth.uid()));
create policy subscriptions_read_self on public.subscriptions for select to authenticated using (user_id=(select auth.uid()));
create policy events_read on public.events for select to authenticated
  using (status='published' or host_id=(select auth.uid()));

-- Solo l'organizzatore o un iscritto approvato possono leggere l'indirizzo.
create policy private_location_read on public.event_private for select to authenticated using (
  exists (select 1 from public.events e where e.id=event_id and e.host_id=(select auth.uid()))
  or exists (select 1 from public.attendances a where a.event_id=event_private.event_id and a.user_id=(select auth.uid()) and a.status='approved')
);

-- Partecipanti: leggi solo le tue iscrizioni o le richieste rivolte agli eventi che organizzi.
create policy attendances_read on public.attendances for select to authenticated using (
  user_id=(select auth.uid()) or exists (select 1 from public.events e where e.id=event_id and e.host_id=(select auth.uid()))
);
create policy attendances_request on public.attendances for insert to authenticated with check (
  user_id=(select auth.uid()) and status='pending'
  and exists (select 1 from public.events e where e.id=event_id and e.host_id<>(select auth.uid()) and e.status='published' and e.starts_at>now())
);
create policy attendances_cancel on public.attendances for delete to authenticated using (user_id=(select auth.uid()));

-- Chat globale a tutti gli iscritti, chat evento solo a host o iscritti APPROVATI.
create policy messages_read on public.chat_messages for select to authenticated using (
  event_id is null
  or exists (select 1 from public.events e where e.id=event_id and e.host_id=(select auth.uid()))
  or exists (select 1 from public.attendances a where a.event_id=chat_messages.event_id and a.user_id=(select auth.uid()) and a.status='approved')
);
create policy messages_post on public.chat_messages for insert to authenticated with check (
  user_id=(select auth.uid())
  and (event_id is null
    or exists (select 1 from public.events e where e.id=event_id and e.host_id=(select auth.uid()))
    or exists (select 1 from public.attendances a where a.event_id=chat_messages.event_id and a.user_id=(select auth.uid()) and a.status='approved'))
);

-- I profili nascono dal server, senza affidarsi a campi client arbitrari.
create or replace function public.on_auth_signup() returns trigger language plpgsql security definer set search_path='' as $$
begin
  insert into public.profiles(id,display_name) values (new.id, left(coalesce(nullif(split_part(new.email,'@',1),''),'Ballerino'),64));
  insert into public.subscriptions(user_id) values (new.id);
  return new;
end $$;
revoke all on function public.on_auth_signup() from public,anon,authenticated;
create trigger tr_auth_signup after insert on auth.users for each row execute function public.on_auth_signup();

-- Il limite Free è verificato transazionalmente dal database, non dal frontend.
create or replace function public.enforce_free_quota() returns trigger language plpgsql security definer set search_path='' as $$
declare cnt integer; paid boolean;
begin
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(new.host_id::text,0));
  select exists (select 1 from public.subscriptions s where s.user_id=new.host_id and s.plan='organizer_plus' and s.status in ('active','trialing')) into paid;
  if not paid then
    select count(*) from public.events e where e.host_id=new.host_id
      and e.created_at>=date_trunc('month',now()) and e.created_at<date_trunc('month',now())+interval '1 month' into cnt;
    if cnt>=2 then raise exception 'Limite Free raggiunto (2 eventi creati al mese).'; end if;
  end if;
  return new;
end $$;
revoke all on function public.enforce_free_quota() from public,anon,authenticated;
create trigger tr_free_quota before insert on public.events for each row execute function public.enforce_free_quota();

-- Creazione atomica: evento pubblico + location privata in un'unica transazione.
create or replace function public.create_social_event(
  p_title text,p_description text,p_city text,p_area text,p_public_lat double precision,p_public_lng double precision,
  p_starts_at timestamptz,p_ends_at timestamptz,p_cover_url text,p_dances text[],p_price numeric,
  p_max_people integer,p_address text,p_directions text
) returns uuid language plpgsql security definer set search_path='' as $$
declare v_uid uuid; v_id uuid; v_lat double precision; v_lng double precision;
begin
  v_uid := (select auth.uid());
  if v_uid is null then raise exception 'Devi effettuare l''accesso.'; end if;
  if p_starts_at<=now() or p_ends_at<=p_starts_at then raise exception 'Date e orari non validi.'; end if;
  if char_length(btrim(p_address))<5 then raise exception 'Indirizzo non valido.'; end if;
  select lat,lng into v_lat,v_lng from public.area_centers where city=p_city and area=p_area;
  if not found then raise exception 'Seleziona una città e una zona disponibili.'; end if;
  insert into public.events (host_id,title,description,city,area,public_lat,public_lng,starts_at,ends_at,cover_url,dances,price,max_people)
  values (v_uid,btrim(p_title),coalesce(p_description,''),p_city,p_area,v_lat,v_lng,p_starts_at,p_ends_at,coalesce(p_cover_url,''),p_dances,p_price,p_max_people)
  returning id into v_id;
  insert into public.event_private(event_id,address,directions) values (v_id,btrim(p_address),coalesce(p_directions,''));
  return v_id;
end $$;
revoke all on function public.create_social_event(text,text,text,text,double precision,double precision,timestamptz,timestamptz,text,text[],numeric,integer,text,text) from public,anon;
grant execute on function public.create_social_event(text,text,text,text,double precision,double precision,timestamptz,timestamptz,text,text[],numeric,integer,text,text) to authenticated;

-- Conteggi mantenuti dal server, non modificabili direttamente dal client.
create or replace function public.sync_attendance_count() returns trigger language plpgsql security definer set search_path='' as $$
begin
  if tg_op='DELETE' then
    if old.status='approved' then update public.events set approved_count=greatest(0,approved_count-1) where id=old.event_id; end if;
    return old;
  elsif tg_op='UPDATE' then
    if old.status<>'approved' and new.status='approved' then
      update public.events set approved_count=approved_count+1 where id=new.event_id;
    elsif old.status='approved' and new.status<>'approved' then
      update public.events set approved_count=greatest(0,approved_count-1) where id=new.event_id;
    end if;
  end if;
  return new;
end $$;
revoke all on function public.sync_attendance_count() from public,anon,authenticated;
create trigger tr_approved_count after update or delete on public.attendances for each row execute function public.sync_attendance_count();

-- Approvazione solo host, con lock sulla capienza, ed esclusivamente da 'pending'.
create or replace function public.resolve_join_request(p_attendance_id uuid,p_status text)
returns void language plpgsql security definer set search_path='' as $$
declare v_event_id uuid; v_host uuid; v_count integer; v_max integer;
begin
  if (select auth.uid()) is null then raise exception 'Accesso richiesto.'; end if;
  if p_status not in ('approved','rejected') then raise exception 'Stato non valido.'; end if;
  select event_id into v_event_id from public.attendances where id=p_attendance_id;
  if v_event_id is null then raise exception 'Richiesta non trovata.'; end if;
  select host_id,approved_count,max_people into v_host,v_count,v_max from public.events where id=v_event_id for update;
  if v_host is distinct from (select auth.uid()) then raise exception 'Solo l''organizzatore può approvare.'; end if;
  if p_status='approved' and v_count>=v_max then raise exception 'Tutti i posti sono occupati.'; end if;
  update public.attendances set status=p_status where id=p_attendance_id and event_id=v_event_id and status='pending';
  if not found then raise exception 'Richiesta già gestita.'; end if;
end $$;
revoke all on function public.resolve_join_request(uuid,text) from public,anon;
grant execute on function public.resolve_join_request(uuid,text) to authenticated;

-- Realtime Postgres Changes segue le regole RLS delle tabelle.
do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='attendances') then
    alter publication supabase_realtime add table public.attendances;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='chat_messages') then
    alter publication supabase_realtime add table public.chat_messages;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='events') then
    alter publication supabase_realtime add table public.events;
  end if;
end $$;
