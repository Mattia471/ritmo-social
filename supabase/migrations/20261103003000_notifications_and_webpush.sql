
-- Ritmo Social v0.7.1: privacy-first notifications and Web Push infrastructure.
create table public.notification_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  nearby_events boolean not null default true,
  join_requests boolean not null default true,
  request_results boolean not null default true,
  event_cancellations boolean not null default true,
  push_enabled boolean not null default false,
  updated_at timestamptz not null default now()
);
alter table public.notification_preferences enable row level security;
revoke all on public.notification_preferences from public, anon, authenticated;
grant select on public.notification_preferences to authenticated;
grant update (nearby_events, join_requests, request_results, event_cancellations, push_enabled) on public.notification_preferences to authenticated;
create policy notification_preferences_read_own on public.notification_preferences for select to authenticated using (user_id = (select auth.uid()));
create policy notification_preferences_update_own on public.notification_preferences for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create table public.user_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null check (kind in ('nearby_event','join_request','request_approved','request_rejected','event_canceled')),
  title text not null check (char_length(title) between 1 and 150),
  body text not null check (char_length(body) <= 350),
  target_path text not null check (target_path ~ '^/(event|my-events)(/|$)'),
  event_id uuid references public.events(id) on delete set null,
  dedupe_key text not null,
  created_at timestamptz not null default now(),
  read_at timestamptz,
  unique (user_id, dedupe_key)
);
create index user_notifications_user_created_idx on public.user_notifications(user_id, created_at desc);
create index user_notifications_unread_idx on public.user_notifications(user_id, created_at desc) where read_at is null;
create index user_notifications_event_id_idx on public.user_notifications(event_id);
alter table public.user_notifications enable row level security;
revoke all on public.user_notifications from public, anon, authenticated;
grant select on public.user_notifications to authenticated;
grant update (read_at) on public.user_notifications to authenticated;
create policy user_notifications_read_own on public.user_notifications for select to authenticated using (user_id = (select auth.uid()));
create policy user_notifications_mark_own on public.user_notifications for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  endpoint text not null unique check (char_length(endpoint) between 30 and 2048 and endpoint like 'https://%'),
  p256dh text not null check (char_length(p256dh) between 40 and 200),
  auth text not null check (char_length(auth) between 10 and 200),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index push_subscriptions_user_idx on public.push_subscriptions(user_id);
alter table public.push_subscriptions enable row level security;
revoke all on public.push_subscriptions from public, anon, authenticated;
grant select, delete on public.push_subscriptions to authenticated;
grant insert (user_id, endpoint, p256dh, auth) on public.push_subscriptions to authenticated;
grant update (p256dh, auth, updated_at) on public.push_subscriptions to authenticated;
create policy push_subscriptions_read_own on public.push_subscriptions for select to authenticated using (user_id = (select auth.uid()));
create policy push_subscriptions_insert_own on public.push_subscriptions for insert to authenticated with check (user_id = (select auth.uid()));
create policy push_subscriptions_update_own on public.push_subscriptions for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy push_subscriptions_delete_own on public.push_subscriptions for delete to authenticated using (user_id = (select auth.uid()));

create or replace function app_private.create_notification_preferences()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.notification_preferences(user_id) values(new.id)
  on conflict (user_id) do nothing;
  return new;
end $$;
revoke all on function app_private.create_notification_preferences() from public,anon,authenticated;
create trigger profile_init_notification_preferences after insert on public.profiles
for each row execute function app_private.create_notification_preferences();
insert into public.notification_preferences(user_id)
select id from public.profiles on conflict (user_id) do nothing;

create or replace function app_private.notify_event_created()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if new.status = 'published' then
    insert into public.user_notifications(user_id, kind, title, body, target_path, event_id, dedupe_key)
    select p.id, 'nearby_event',
      'Nuova serata a ' || new.city,
      left(new.title,120) || ' · ' || new.area || ' · ' || to_char(new.starts_at at time zone 'Europe/Rome', 'DD/MM HH24:MI'),
      '/event/' || new.id::text, new.id, 'event:' || new.id::text
    from public.profiles p
    join public.notification_preferences pref on pref.user_id=p.id
    where p.city=new.city and p.id<>new.host_id and pref.nearby_events
    on conflict (user_id, dedupe_key) do nothing;
  end if;
  return new;
end $$;
revoke all on function app_private.notify_event_created() from public,anon,authenticated;
create trigger notify_new_social_event after insert on public.events
for each row execute function app_private.notify_event_created();

create or replace function app_private.notify_attendance()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare v_event record; v_guest_name text;
begin
  select id,host_id,title,status into v_event from public.events where id=new.event_id;
  if not found or v_event.status<>'published' then return new; end if;
  if tg_op='INSERT' and new.status='pending' then
    select display_name into v_guest_name from public.profiles where id=new.user_id;
    insert into public.user_notifications(user_id,kind,title,body,target_path,event_id,dedupe_key)
    select v_event.host_id, 'join_request', 'Nuova richiesta di partecipazione',
      left(coalesce(v_guest_name,'Un ballerino'),64) || ' vuole partecipare a ' || left(v_event.title,100),
      '/my-events', new.event_id, 'request:' || new.id::text
    from public.notification_preferences p where p.user_id=v_event.host_id and p.join_requests
    on conflict (user_id,dedupe_key) do nothing;
  elsif tg_op='UPDATE' and old.status is distinct from new.status and new.status in ('approved','rejected') then
    insert into public.user_notifications(user_id,kind,title,body,target_path,event_id,dedupe_key)
    select new.user_id,
      case when new.status='approved' then 'request_approved' else 'request_rejected' end,
      case when new.status='approved' then 'Richiesta accettata! 🎉' else 'Richiesta non accettata' end,
      case when new.status='approved' then
        'Puoi vedere il luogo e accedere alla chat della serata ' || left(v_event.title,100)
      else 'La tua richiesta per ' || left(v_event.title,100) || ' non è stata accettata.' end,
      '/event/' || new.event_id::text, new.event_id,
      'result:' || new.id::text || ':' || new.status
    from public.notification_preferences p where p.user_id=new.user_id and p.request_results
    on conflict (user_id,dedupe_key) do nothing;
  end if;
  return new;
end $$;
revoke all on function app_private.notify_attendance() from public,anon,authenticated;
create trigger notify_new_join_request after insert on public.attendances for each row execute function app_private.notify_attendance();
create trigger notify_join_decision after update of status on public.attendances for each row execute function app_private.notify_attendance();

create or replace function app_private.notify_event_canceled()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if old.status='published' and new.status='canceled' then
    insert into public.user_notifications(user_id,kind,title,body,target_path,event_id,dedupe_key)
    select a.user_id,'event_canceled','Serata annullata',
      'La serata ' || left(new.title,120) || ' è stata annullata. La chat e il luogo sono ora chiusi.',
      '/event/' || new.id::text,new.id,'cancel:' || new.id::text
    from public.attendances a
    join public.notification_preferences pref on pref.user_id=a.user_id
    where a.event_id=new.id and a.status in ('pending','approved') and pref.event_cancellations
    on conflict (user_id,dedupe_key) do nothing;
  end if;
  return new;
end $$;
revoke all on function app_private.notify_event_canceled() from public,anon,authenticated;
create trigger notify_social_event_canceled after update of status on public.events
for each row execute function app_private.notify_event_canceled();

do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='user_notifications') then
    alter publication supabase_realtime add table public.user_notifications;
  end if;
end $$;

-- Background push delivery. Secrets are only in encrypted Supabase Vault.
create extension if not exists pg_net with schema extensions;
select vault.create_secret(encode(gen_random_bytes(32),'hex'), 'ritmo_push_hook_secret', 'Internal authenticated Web Push hook') 
where not exists (select 1 from vault.secrets where name='ritmo_push_hook_secret');

-- An authenticated client can never invoke the secret bootstrap or read the keys.
create or replace function public.push_worker_config()
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare v_hook text; v_keys text;
begin
  select decrypted_secret into v_hook from vault.decrypted_secrets where name='ritmo_push_hook_secret';
  select decrypted_secret into v_keys from vault.decrypted_secrets where name='ritmo_push_vapid_keys';
  return jsonb_build_object('hook',v_hook,'keys',case when v_keys is null then null else v_keys::jsonb end);
end $$;
revoke all on function public.push_worker_config() from public,anon,authenticated;
grant execute on function public.push_worker_config() to service_role;

create or replace function public.initialize_push_vapid(p_keys jsonb)
returns boolean language plpgsql security definer set search_path = ''
as $$
begin
  perform pg_catalog.pg_advisory_xact_lock(11521042);
  if exists (select 1 from vault.secrets where name='ritmo_push_vapid_keys') then return false; end if;
  if p_keys->'privateKey'->>'kty' <> 'EC' or p_keys->'privateKey'->>'crv' <> 'P-256'
    or p_keys->'publicKey'->>'kty' <> 'EC'
    or char_length(coalesce(p_keys->'privateKey'->>'d','')) < 40 then
    raise exception 'Invalid VAPID private keys';
  end if;
  perform vault.create_secret(p_keys::text,'ritmo_push_vapid_keys','Encrypted Web Push private/public JWK');
  return true;
end $$;
revoke all on function public.initialize_push_vapid(jsonb) from public,anon,authenticated;
grant execute on function public.initialize_push_vapid(jsonb) to service_role;

create or replace function app_private.deliver_push_notification()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare v_hook text;
begin
  -- In-app notifications always work, even before push opt-in.
  if not exists (
    select 1 from public.notification_preferences p where p.user_id=new.user_id and p.push_enabled
  ) or not exists (
    select 1 from public.push_subscriptions s where s.user_id=new.user_id
  ) then return new; end if;
  select decrypted_secret into v_hook from vault.decrypted_secrets where name='ritmo_push_hook_secret';
  if v_hook is not null then
    perform net.http_post(
      url := 'https://meocsxgrwcrnwpalodxt.supabase.co/functions/v1/ritmo-web-push',
      headers := jsonb_build_object('Content-Type','application/json','x-ritmo-hook',v_hook),
      body := jsonb_build_object('kind','deliver','notificationId',new.id),
      timeout_milliseconds := 8000
    );
  end if;
  return new;
exception when others then
  raise warning 'Web push queue unavailable: %', sqlerrm;
  return new;
end $$;
revoke all on function app_private.deliver_push_notification() from public,anon,authenticated;
create trigger enqueue_new_web_push after insert on public.user_notifications
for each row execute function app_private.deliver_push_notification();
