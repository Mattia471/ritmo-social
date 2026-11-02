const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const source = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');

test('tropical style imported after existing verified base stylesheet', () => {
  const entry=source('src/main.tsx');
  assert.ok(entry.indexOf("import './index.css'") < entry.indexOf("import './tropical.css'"));
  const css=source('src/tropical.css');
  for(const color of ['#071923','#0f3d3e','#2e6f73','#55e4e7','#ffad32']) {
    assert.ok(css.toLowerCase().includes(color),`${color} must appear in tropical theme`);
  }
  assert.match(css,/\.hero-section/);
  assert.match(css,/\.bottom-nav/);
  assert.match(css,/\.chat-mobile-conversation/);
  assert.match(css,/@media\(max-width:680px\)/);
});

test('hero uses actual event cover, public area and event-detail link instead of imaginary private venue', () => {
  const home=source('src/pages/Home.tsx');
  assert.match(home,/spotlight = featured\[0\]/);
  assert.match(home,/spotlight\.cover/);
  assert.match(home,/spotlight\.area/);
  assert.match(home,/spotlight\.city/);
  assert.match(home,/\/event\/\$\{spotlight\.id\}/);
  assert.doesNotMatch(home,/privateAddress|private_address/);
});

test('dance shortcuts navigate to working filters', () => {
  const home=source('src/pages/Home.tsx');
  const explore=source('src/pages/Explore.tsx');
  assert.match(home,/\/explore\?dance=\$\{encodeURIComponent\(dance\)\}/);
  assert.match(explore,/dances\.find\(d => d === params\.get\('dance'\)\)/);
});

test('logo and PWA carry matching new color theme', () => {
  const manifest=JSON.parse(source('public/manifest.webmanifest'));
  assert.equal(manifest.theme_color,'#071923');
  assert.equal(manifest.background_color,'#071923');
  assert.match(source('index.html'),/name="theme-color" content="#071923"/);
  assert.match(source('public/logo-icon.svg'),/#55E5E4/);
  assert.match(source('public/logo-lockup.svg'),/#53E6EA/);
});

test('sponsor stays absent without real data and chats keep fixed keyboard viewport positioning', () => {
  assert.match(source('src/components/SponsorSlot.tsx'),/if \(!sponsorName \|\| !sponsorDescription \|\| !sponsorUrl\) return null/);
  assert.match(source('src/index.css'),/var\(--ritmo-chat-height,100dvh\)/);
  assert.doesNotMatch(source('src/tropical.css'),/position:\s*fixed[^}]*\.chat|adsbygoogle/);
});
