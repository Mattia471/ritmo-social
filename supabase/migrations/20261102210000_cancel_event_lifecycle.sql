-- Ritmo Social v0.7: secure cancellation lifecycle.
-- Keep cancelled events visible only to their organizer and existing participants.
-- Revoke venue address and event-chat access after cancellation.
begin;

create or replace function app_private.has_attendance_for_event(p_event_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1 from public.attendances a
      where a.event_id = p_event_id
        and a.user_id = (select auth.uid())
        and a.status in ('pending', 'approved')
    )
$$;
revoke all on function app_private.has_attendance_for_event(uuid) from public, anon;
grant execute on function app_private.has_attendance_for_event(uuid) to authenticated;

drop policy if exists events_read on public.events;
create policy events_read on public.events for select to authenticated
using (
  status = 'published'
  or host_id = (select auth.uid())
  or (status = 'canceled' and (select app_private.has_attendance_for_event(events.id)))
);

drop policy if exists private_location_read on public.event_private;
create policy private_location_read on public.event_private for select to authenticated
using (
  exists (
    select 1 from public.events e
    where e.id = event_private.event_id
      and e.host_id = (select auth.uid())
  )
  or (
    exists (
      select 1 from public.events e
      where e.id = event_private.event_id
        and e.status = 'published'
    )
    and exists (
      select 1 from public.attendances a
      where a.event_id = event_private.event_id
        and a.user_id = (select auth.uid())
        and a.status = 'approved'
    )
  )
);

drop policy if exists messages_read on public.chat_messages;
create policy messages_read on public.chat_messages for select to authenticated
using (
  (
    event_id is null
    or (
      exists (select 1 from public.events e
        where e.id = chat_messages.event_id and e.status = 'published'
      )
      and (
        exists (select 1 from public.events e
          where e.id = chat_messages.event_id
            and e.host_id = (select auth.uid())
        )
        or exists (select 1 from public.attendances a
          where a.event_id = chat_messages.event_id
            and a.user_id = (select auth.uid()) and a.status = 'approved'
        )
      )
    )
  )
  and not exists (
    select 1 from public.user_blocks b
    where b.blocker_id = (select auth.uid())
      and b.blocked_id = chat_messages.user_id
  )
);

drop policy if exists messages_post on public.chat_messages;
create policy messages_post on public.chat_messages for insert to authenticated
with check (
  user_id = (select auth.uid())
  and (
    event_id is null
    or (
      exists (select 1 from public.events e
        where e.id = chat_messages.event_id and e.status = 'published'
      )
      and (
        exists (select 1 from public.events e
          where e.id = chat_messages.event_id
            and e.host_id = (select auth.uid())
        )
        or exists (select 1 from public.attendances a
          where a.event_id = chat_messages.event_id
            and a.user_id = (select auth.uid()) and a.status = 'approved'
        )
      )
    )
  )
);

create or replace function app_private.cancel_social_event(p_event_id uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
declare v_id uuid;
begin
  if (select auth.uid()) is null then
    raise exception 'Devi accedere per annullare una serata.';
  end if;
  update public.events
  set status = 'canceled'
  where id = p_event_id
    and host_id = (select auth.uid())
    and status = 'published'
    and starts_at > now()
  returning id into v_id;
  if v_id is null then
    raise exception 'Puoi annullare solo le tue serate future ancora pubblicate.';
  end if;
end
$$;
revoke all on function app_private.cancel_social_event(uuid) from public, anon;
grant execute on function app_private.cancel_social_event(uuid) to authenticated;

create or replace function public.cancel_social_event(p_event_id uuid)
returns void
language sql security invoker set search_path = ''
as $$ select app_private.cancel_social_event(p_event_id) $$;
revoke all on function public.cancel_social_event(uuid) from public, anon;
grant execute on function public.cancel_social_event(uuid) to authenticated;

commit;
