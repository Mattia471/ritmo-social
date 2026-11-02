const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const read = path => fs.readFileSync(path, 'utf8');

test('only an authenticated organizer can cancel a future published event', () => {
  const sql = read('supabase/migrations/20261102210000_cancel_event_lifecycle.sql');
  assert.match(sql, /host_id\s*=\s*\(select auth\.uid\(\)\)/);
  assert.match(sql, /status\s*=\s*'published'\s*and starts_at\s*>\s*now\(\)/);
  assert.match(sql, /language sql security invoker/);
  assert.match(sql, /revoke all on function public\.cancel_social_event\(uuid\) from public, anon/);
});

test('cancelled events are readable only by organizer or existing attendees', () => {
  const sql = read('supabase/migrations/20261102210000_cancel_event_lifecycle.sql');
  assert.match(sql, /app_private\.has_attendance_for_event/);
  assert.match(sql, /a\.user_id\s*=\s*\(select auth\.uid\(\)\)/);
  assert.match(sql, /a\.status in \('pending', 'approved'\)/);
});

test('private venue and event-chat permissions close on cancellation', () => {
  const sql = read('supabase/migrations/20261102210000_cancel_event_lifecycle.sql');
  assert.match(sql, /create policy private_location_read/);
  assert.match(sql, /create policy messages_read/);
  assert.match(sql, /create policy messages_post/);
  assert.match(sql, /e\.status = 'published'/);
});

test('event lists show cancellation to attendees but discovery excludes it', () => {
  const store = read('src/lib/store.tsx');
  const home = read('src/pages/Home.tsx');
  const explore = read('src/pages/Explore.tsx');
  const cards = read('src/components/Shared.tsx');
  assert.match(store, /supabase\.from\('events'\)\.select\('\*'\)\.order/);
  assert.match(store, /supabase\.rpc\('cancel_social_event'/);
  assert.match(home, /e\.status !== 'canceled'/);
  assert.match(explore, /e\.status !== 'canceled'/);
  assert.match(cards, /Serata annullata/);
});

test('organizer cancellation is confirmed inline and attendees see the warning', () => {
  const details = read('src/pages/EventDetail.tsx');
  assert.match(details, /setConfirmCancel/);
  assert.match(details, /Conferma annullamento/);
  assert.match(details, /role="status"/);
  assert.match(details, /isCancelled \?/);
  assert.doesNotMatch(details, /<dialog\b|window\.confirm\(/);
});

test('cancelled event room is closed in UI and cannot be joined', () => {
  const chat = read('src/pages/Chats.tsx');
  assert.match(chat, /e\.status !== 'canceled'/);
  assert.match(chat, /Chat chiusa/);
  const myEvents = read('src/pages/MyEvents.tsx');
  assert.match(myEvents, /e\.status !== 'canceled'/);
});
