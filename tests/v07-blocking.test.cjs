const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const read = path => fs.readFileSync(path, 'utf8');

test('a member can only read, create and delete their own blocks', () => {
  const sql = read('supabase/migrations/20261102203000_member_blocking_and_chat_limits.sql');
  assert.match(sql, /user_blocks enable row level security/);
  assert.match(sql, /revoke all on table public\.user_blocks from public, anon, authenticated/);
  assert.match(sql, /grant insert \(blocker_id, blocked_id\) on table public\.user_blocks/);
  assert.match(sql, /for select to authenticated\s+using \(blocker_id = \(select auth\.uid\(\)\)\)/);
  assert.match(sql, /for delete to authenticated\s+using \(blocker_id = \(select auth\.uid\(\)\)\)/);
  assert.match(sql, /constraint user_blocks_not_self check \(blocker_id <> blocked_id\)/);
});

test('RLS hides blocked authors, retaining event-room membership checks', () => {
  const sql = read('supabase/migrations/20261102203000_member_blocking_and_chat_limits.sql');
  assert.match(sql, /drop policy if exists messages_read/);
  assert.match(sql, /event_id is null/);
  assert.match(sql, /a\.status='approved'/);
  assert.match(sql, /not exists \(\s*select 1 from public\.user_blocks b/);
  assert.match(sql, /b\.blocked_id=chat_messages\.user_id/);
});

test('message throttle prevents spam while leaving normal chat enabled', () => {
  const sql = read('supabase/migrations/20261102203000_member_blocking_and_chat_limits.sql');
  assert.match(sql, /pg_advisory_xact_lock/);
  assert.match(sql, /interval '1 minute'\) >= 15/);
  assert.match(sql, /interval '24 hours'\) >= 300/);
  assert.match(sql, /before insert on public\.chat_messages/);
});

test('chat has reversible inline blocking without hiding all users messages', () => {
  const chat = read('src/pages/Chats.tsx');
  assert.match(chat, /blockedUsers\.some\(block => block\.id === m\.userId\)/);
  assert.match(chat, /setBlockCandidate\(\{ id: msg\.userId, name: msg\.userName, messageId: msg\.id \}\)/);
  assert.match(chat, /await blockUser\(blockCandidate\.id\)/);
  assert.match(chat, /Conferma blocco/);
  assert.match(chat, /Potreste comunque partecipare alla stessa serata/);
});

test('blocked members can be reviewed and unblocked from the profile', () => {
  const store = read('src/lib/store.tsx');
  const profile = read('src/pages/Profile.tsx');
  assert.match(store, /from\('user_blocks'\)\.select\('blocked_id'\)/);
  assert.match(store, /setData\(s => \(\{ \.\.\.s, messages: s\.messages\.filter\(message => message\.userId !== memberId\) \}\)\)/);
  assert.match(store, /\.delete\(\)\.eq\('blocker_id', userId\)\.eq\('blocked_id', memberId\)/);
  assert.match(profile, /Persone bloccate/);
  assert.match(profile, /void unblockUser\(block\.id\)/);
  assert.doesNotMatch(profile, /<dialog/i);
});
