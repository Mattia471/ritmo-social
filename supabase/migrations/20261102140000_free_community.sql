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
