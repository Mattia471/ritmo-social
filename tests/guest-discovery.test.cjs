const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

test('guest discovery keeps public pages open and protects personal actions', () => {
  const app = read('src/App.tsx');
  const detail = read('src/pages/EventDetail.tsx');
  const home = read('src/pages/Home.tsx');

  assert.doesNotMatch(app, /if \(!userId\) return <Auth\/>/);
  assert.match(app, /function RequireAuth/);
  assert.match(app, /path="\/explore" element={<Explore\/>}/);
  assert.match(app, /path="\/event\/:id" element={<EventDetail\/>}/);
  assert.match(app, /path="\/chats" element={<RequireAuth>/);
  assert.match(detail, /Accedi per partecipare/);
  assert.match(home, /Esplora Ritmo senza registrarti/);
});

test('anonymous database access is read-only and limited to public discovery data', () => {
  const migration = read('supabase/migrations/20261105110622_guest_public_discovery.sql');
  assert.match(migration, /grant select on table public\.events to anon/);
  assert.match(migration, /grant select \(id, display_name\) on table public\.profiles to anon/);
  assert.match(migration, /to anon\s+using \(status = 'published'\)/);
  assert.doesNotMatch(migration, /grant .*event_private.*anon/i);
  assert.doesNotMatch(migration, /grant .*chat_messages.*anon/i);
  assert.doesNotMatch(migration, /grant .*attendances.*anon/i);
});
