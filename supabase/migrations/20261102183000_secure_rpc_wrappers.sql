-- Ritmo Social v0.7 security hardening.
-- Keep the public RPC signatures unchanged for the React client, while moving
-- privileged implementations outside the schemas exposed by PostgREST.
-- Executed atomically to avoid exposing partially migrated RPC endpoints.
begin;

create schema if not exists app_private;
revoke all on schema app_private from public, anon, authenticated;
grant usage on schema app_private to authenticated;

-- Existing implementations already validate auth.uid(), event ownership,
-- event area, capacity, and allowed transitions.
alter function public.create_social_event(
  text, text, text, text, double precision, double precision,
  timestamptz, timestamptz, text, text[], numeric, integer, text, text
) set schema app_private;

alter function public.resolve_join_request(uuid, text) set schema app_private;

revoke all on function app_private.create_social_event(
  text, text, text, text, double precision, double precision,
  timestamptz, timestamptz, text, text[], numeric, integer, text, text
) from public, anon;
grant execute on function app_private.create_social_event(
  text, text, text, text, double precision, double precision,
  timestamptz, timestamptz, text, text[], numeric, integer, text, text
) to authenticated;

revoke all on function app_private.resolve_join_request(uuid, text) from public, anon;
grant execute on function app_private.resolve_join_request(uuid, text) to authenticated;

-- The exposed API functions use the caller's permissions. They only delegate
-- to carefully scoped privileged implementations in app_private.
create function public.create_social_event(
  p_title text,
  p_description text,
  p_city text,
  p_area text,
  p_public_lat double precision,
  p_public_lng double precision,
  p_starts_at timestamptz,
  p_ends_at timestamptz,
  p_cover_url text,
  p_dances text[],
  p_price numeric,
  p_max_people integer,
  p_address text,
  p_directions text
) returns uuid
language sql security invoker set search_path = ''
as $$
  select app_private.create_social_event(
    p_title, p_description, p_city, p_area, p_public_lat, p_public_lng,
    p_starts_at, p_ends_at, p_cover_url, p_dances, p_price,
    p_max_people, p_address, p_directions
  )
$$;
revoke all on function public.create_social_event(
  text, text, text, text, double precision, double precision,
  timestamptz, timestamptz, text, text[], numeric, integer, text, text
) from public, anon;
grant execute on function public.create_social_event(
  text, text, text, text, double precision, double precision,
  timestamptz, timestamptz, text, text[], numeric, integer, text, text
) to authenticated;

create function public.resolve_join_request(
  p_attendance_id uuid,
  p_status text
) returns void
language sql security invoker set search_path = ''
as $$
  select app_private.resolve_join_request(p_attendance_id, p_status)
$$;
revoke all on function public.resolve_join_request(uuid, text) from public, anon;
grant execute on function public.resolve_join_request(uuid, text) to authenticated;

-- Foreign key support for host event queries and message ownership checks.
create index if not exists idx_events_host_id on public.events(host_id);
create index if not exists idx_chat_messages_user_id on public.chat_messages(user_id);

commit;
