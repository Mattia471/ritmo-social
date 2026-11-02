const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');

test('demo join deduplicates requests against latest state', () => {
  const store = read('src/lib/store.tsx');
  assert.match(store, /setData\(s => s\.attendances\.some\(a => a\.eventId === eventId && a\.userId === userId\)/);
  assert.match(store, /event\.approvedCount >= event\.maxPeople/);
});
test('organizer approval respects capacity and pending state', () => {
  const store = read('src/lib/store.tsx');
  assert.match(store, /request\.status !== 'pending'/);
  assert.match(store, /event\.hostId !== userId/);
  assert.match(store, /Capienza raggiunta: non puoi approvare altri partecipanti/);
});
test('sample organized event does not use one of two free slots', () => {
  assert.match(read('src/lib/store.tsx'), /e\.id !== 'own-1'/);
  assert.match(read('src/pages/CreateEvent.tsx'), /e\.id !== 'own-1'/);
});
test('sold-out event cannot request participation in detail CTA', () => {
  const source = read('src/pages/EventDetail.tsx');
  assert.match(source, /const soldOut = event\.approvedCount >= event\.maxPeople/);
  assert.match(source, /soldOut \? <button className="btn btn-outline" type="button" disabled>Posti esauriti/);
});
