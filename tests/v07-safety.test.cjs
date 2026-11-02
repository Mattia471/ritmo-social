const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const read = file => fs.readFileSync(file, 'utf8');

test('reporting is limited to signed-in users and supported message IDs', () => {
  const store = read('src/lib/store.tsx');
  assert.match(store, /reportMessage: \(messageId:/);
  assert.match(store, /supabase\.from\('message_reports'\)/);
  assert.match(store, /reporter_id: userId, message_id: messageId/);
});

test('reporting UI is inline, human-readable, and only offered on others messages', () => {
  const chat = read('src/pages/Chats.tsx');
  assert.match(chat, /!mine && supabase/);
  assert.match(chat, /setReportMessageId/);
  assert.match(chat, /sendReport\(e, msg\.id\)/);
  for (const reason of ['spam', 'harassment', 'hate', 'privacy', 'other']) {
    assert.ok(chat.includes(`value="${reason}"`), `reason ${reason}`);
  }
  assert.match(chat, /maxLength=\{500\}/);
});

test('message reports are private with row-level checks and a per-day throttle', () => {
  const sql = read('supabase/migrations/20261102190000_chat_reports.sql');
  assert.match(sql, /message_reports enable row level security/);
  assert.match(sql, /reporter_id = \(select auth\.uid\(\)\)/);
  assert.match(sql, /m\.user_id <> \(select auth\.uid\(\)\)/);
  assert.match(sql, /from public\.chat_messages m/);
  assert.match(sql, /new\.created_at := now\(\)/i);
  assert.match(sql, />= 5 then/);
  assert.match(sql, /revoke all on table public\.message_reports from public, anon, authenticated/);
});

test('profile errors are visible and false support mailbox is gone', () => {
  const profile = read('src/pages/Profile.tsx');
  assert.match(profile, /setSaveError\(err instanceof Error/);
  assert.match(profile, /role="alert"/);
  assert.doesNotMatch(profile, /mailto:hello@ritmo\.social/);
});

test('same-major dependency security updates remain pinned', () => {
  const pkg = JSON.parse(read('package.json'));
  assert.equal(pkg.dependencies['react-router-dom'], '6.30.6');
  assert.equal(pkg.devDependencies.vite, '6.4.5');
  assert.equal(pkg.devDependencies.postcss, '8.5.32');
});
