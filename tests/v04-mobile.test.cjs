const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

test('v0.4 wizard has four steps and checks each stage before publication', () => {
  const source = read('src/pages/CreateEvent.tsx');
  assert.match(source, /Passaggio \{step \+ 1\} di 4/);
  assert.match(source, /step === 0 &&/);
  assert.match(source, /index === 1\)/);
  assert.match(source, /index === 2\)/);
  assert.match(source, /if \(step !== 3 \|\| busy\) return/);
  assert.match(source, /for \(let i = 0; i < 3; i\+\+\)/);
  assert.match(source, /Indirizzo esatto \(riservato\)/);
  assert.match(source, /Visibile solo dopo conferma/);
});

test('v0.4 preserves separate native date/time iPhone controls and pinch zoom', () => {
  const page = read('src/pages/CreateEvent.tsx');
  assert.equal((page.match(/type="date"/g) || []).length, 2);
  assert.equal((page.match(/type="time"/g) || []).length, 2);
  assert.doesNotMatch(page, /type="datetime-local"/);
  assert.doesNotMatch(read('index.html'), /user-scalable=no|maximum-scale=1/);
});

test('v0.4 chat responds to VisualViewport keyboard without scrolling the entire page', () => {
  const page = read('src/pages/Chats.tsx');
  const css = read('src/index.css');
  assert.match(page, /window\.visualViewport/);
  assert.match(page, /viewport\?\.addEventListener\('resize'/);
  assert.match(page, /--ritmo-chat-height/);
  assert.match(page, /scrollRef\.current\.scrollTop = scrollRef\.current\.scrollHeight/);
  assert.doesNotMatch(page, /scrollIntoView\(\{ behavior: 'auto'/);
  assert.match(css, /\.chat-mobile-conversation\) \.topbar\{display:none\}/);
});

test('v0.4 marker grouping is based on pixel distance and every event has a selectable preview', () => {
  const page = read('src/components/ExploreMap.tsx');
  assert.match(page, /latLngToContainerPoint/);
  assert.match(page, /points\[i\]\.distanceTo\(points\[j\]\)/);
  assert.match(page, /onSelect\(grouped\)/);
  assert.match(page, /selected\.map\(event => <Link/);
  assert.doesNotMatch(page, /\.address|\.directions/);
});

test('v0.4 detail CTA sticks on mobile and reflects approval state', () => {
  const detail = read('src/pages/EventDetail.tsx');
  const css = read('src/index.css');
  assert.match(detail, /detail-mobile-action/);
  assert.match(detail, /attendance\?\.status === 'pending'/);
  assert.match(detail, /approved \? <Link className="btn btn-primary"/);
  assert.match(css, /\.detail-mobile-action\{position:fixed/);
});
