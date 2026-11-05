const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = name => fs.readFileSync(path.join(__dirname, '..', name), 'utf8');
test('no subscription route, checkout or Plus calls-to-action', () => {
  assert.match(read('src/App.tsx'), /path="\/plus" element={<RequireAuth><Navigate to="\/create" replace\/><\/RequireAuth>}/);
  for(const source of ['src/components/Layout.tsx','src/pages/Profile.tsx','src/pages/CreateEvent.tsx']) {
    assert.doesNotMatch(read(source), /to="\/plus"|Passa a Plus|Organizzatore Plus|Scegli Ritmo Plus/);
  }
  assert.doesNotMatch(read('src/lib/store.tsx'), /functions\.invoke\('create-checkout'/);
});
test('free event creation has a neutral anti-spam limit in both UI and store', () => {
  assert.match(read('src/lib/store.tsx'), /createdToday >= 10/);
  assert.match(read('src/pages/CreateEvent.tsx'), /myEventsToday >= 10/);
  assert.match(read('supabase/migrations/20261102140000_free_community.sql'), /recent_count >= 10/);
});
test('sponsors never load external scripts and are disabled without configured sponsor', () => {
  const slot=read('src/components/SponsorSlot.tsx');
  assert.match(slot, /if \(!sponsorName \|\| !sponsorDescription \|\| !sponsorUrl\) return null/);
  assert.match(slot, /parsed\.protocol === 'https:'/);
  assert.match(slot, /Sponsorizzato/);
  assert.doesNotMatch(slot, /<script|adsbygoogle|googletag|track\(/);
  assert.doesNotMatch(read('src/pages/Chats.tsx'), /SponsorSlot/);
  assert.doesNotMatch(read('src/pages/EventDetail.tsx'), /SponsorSlot/);
});
