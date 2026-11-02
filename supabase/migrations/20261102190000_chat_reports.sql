-- First moderation workflow: privacy-preserving reports for messages visible to the reporter.
-- Only the submitting member can see their own report. Moderation takes place
-- manually in the Supabase dashboard until a reviewed admin workflow exists.
create table if not exists public.message_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  message_id uuid not null references public.chat_messages(id) on delete cascade,
  reason text not null check (reason in ('spam', 'harassment', 'hate', 'privacy', 'other')),
  note text not null default '' check (char_length(note) <= 500),
  status text not null default 'open' check (status in ('open', 'reviewed', 'dismissed')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  unique (reporter_id, message_id)
);

alter table public.message_reports enable row level security;
revoke all on table public.message_reports from public, anon, authenticated;
grant select, insert on table public.message_reports to authenticated;

create policy "message_reports_read_own" on public.message_reports
for select to authenticated
using (reporter_id = (select auth.uid()));

create policy "message_reports_submit_visible_other_message" on public.message_reports
for insert to authenticated
with check (
  reporter_id = (select auth.uid())
  and status = 'open' and reviewed_at is null
  and exists (
    select 1 from public.chat_messages m
    where m.id = message_reports.message_id
      and m.user_id <> (select auth.uid())
    -- SELECT on chat_messages is already limited by its own RLS;
    -- viewers cannot report messages from inaccessible private rooms.
  )
);

-- A member may submit at most five reports per rolling 24 hours.
-- Keep the privileged rate-limit counter outside the exposed API schemas.
create or replace function app_private.enforce_message_report_rate()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  new.created_at := now(); -- Never trust client-supplied timestamps for throttling.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext(new.reporter_id::text));
  if (select count(*) from public.message_reports
       where reporter_id = new.reporter_id
         and created_at >= now() - interval '24 hours') >= 5 then
    raise exception 'Hai raggiunto il limite di 5 segnalazioni in 24 ore.';
  end if;
  return new;
end;
$$;
revoke all on function app_private.enforce_message_report_rate() from public, anon, authenticated;

create trigger message_reports_check_daily_limit
before insert on public.message_reports
for each row execute function app_private.enforce_message_report_rate();

create index if not exists idx_message_reports_created_at
on public.message_reports(created_at desc);

comment on table public.message_reports is
'User-submitted abuse reports. Only owners can select; staff reviews via trusted admin database access.';
