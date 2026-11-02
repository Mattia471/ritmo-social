-- Support deleting reported messages without scanning every report.
create index if not exists idx_message_reports_message_id on public.message_reports(message_id);
