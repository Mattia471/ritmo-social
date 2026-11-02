-- Ritmo Social: member-controlled message hiding and basic chat anti-spam.
-- A block hides that person's chat messages from the blocker only. It does not
-- remove event memberships, prevent offline encounters, or notify the target.

create table public.user_blocks (
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  constraint user_blocks_not_self check (blocker_id <> blocked_id)
);

alter table public.user_blocks enable row level security;
revoke all on table public.user_blocks from public, anon, authenticated;
grant select, delete on table public.user_blocks to authenticated;
grant insert (blocker_id, blocked_id) on table public.user_blocks to authenticated;

create policy user_blocks_read_own on public.user_blocks
  for select to authenticated
  using (blocker_id = (select auth.uid()));
create policy user_blocks_add_own on public.user_blocks
  for insert to authenticated
  with check (blocker_id = (select auth.uid()) and blocked_id <> (select auth.uid()));
create policy user_blocks_remove_own on public.user_blocks
  for delete to authenticated
  using (blocker_id = (select auth.uid()));

create index idx_user_blocks_blocked_id on public.user_blocks(blocked_id);

-- Preserve existing event-room permissions while excluding the author's
-- messages from the blocker at the database level, including Realtime SELECT.
drop policy if exists messages_read on public.chat_messages;
create policy messages_read on public.chat_messages
  for select to authenticated
  using (
    (
      event_id is null
      or exists (
        select 1 from public.events e
        where e.id=chat_messages.event_id and e.host_id=(select auth.uid())
      )
      or exists (
        select 1 from public.attendances a
        where a.event_id=chat_messages.event_id
          and a.user_id=(select auth.uid()) and a.status='approved'
      )
    )
    and not exists (
      select 1 from public.user_blocks b
      where b.blocker_id=(select auth.uid()) and b.blocked_id=chat_messages.user_id
    )
  );

-- Stop high-frequency spam in global or event chats. The advisory lock
-- prevents simultaneous requests from circumventing the time-window limit.
create or replace function app_private.enforce_chat_message_rate()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  perform pg_catalog.pg_advisory_xact_lock(713, pg_catalog.hashtext(new.user_id::text));
  if (select count(*) from public.chat_messages m
      where m.user_id = new.user_id
        and m.created_at >= now() - interval '1 minute') >= 15 then
    raise exception 'Hai inviato troppi messaggi. Riprova tra un minuto.';
  end if;
  if (select count(*) from public.chat_messages m
      where m.user_id = new.user_id
        and m.created_at >= now() - interval '24 hours') >= 300 then
    raise exception 'Limite giornaliero dei messaggi raggiunto. Riprova domani.';
  end if;
  return new;
end;
$$;
revoke all on function app_private.enforce_chat_message_rate() from public, anon, authenticated;
create trigger chat_messages_rate_limit
before insert on public.chat_messages
for each row execute function app_private.enforce_chat_message_rate();
create index idx_chat_messages_user_created on public.chat_messages(user_id, created_at desc);
drop index if exists public.idx_chat_messages_user_id;

comment on table public.user_blocks is
  'A block hides another member chat messages from the blocker; no direct-contact protection is implied.';
