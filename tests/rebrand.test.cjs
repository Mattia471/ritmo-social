const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p),'utf8');
test('brand: logo, favicon, PWA e OpenGraph installati', () => {
  const html = read('index.html');
  const manifest = JSON.parse(read('public/manifest.webmanifest'));
  assert.match(read('public/logo-icon.svg'), /<svg/);
  assert.match(read('public/favicon.svg'), /<svg/);
  assert.ok(fs.statSync(path.join(root,'public/icon-192.png')).size>1000);
  assert.ok(fs.statSync(path.join(root,'public/icon-512.png')).size>1000);
  assert.ok(fs.statSync(path.join(root,'public/og-ritmo-social.jpg')).size>10000);
  assert.match(html, /property="og:image"/);
  assert.match(html, /name="twitter:card"/);
  assert.match(html, /rel="manifest"/);
  assert.equal(manifest.theme_color,'#071923');
});
test('geo map: pins are selectable, with preview and styles, and show only public coordinates', () => {
  const map = read('src/components/ExploreMap.tsx');
  assert.match(map, /onSelect\(grouped\)/);
  assert.match(map, /map-selection/);
  assert.match(map, /to=\{`\/event\/\$\{event.id\}`\}/);
  assert.match(map, /Circle center=\{center\} radius=\{radius \* 1000\}/);
  assert.match(map, /event.publicLat/);
  assert.doesNotMatch(map, /\.address|\.directions/);
  for(const style of ['Bachata','Salsa','Kizomba','Merengue']) assert.match(map, new RegExp(style));
});
test('navigation: explore opens map by default but list remains selectable', () => {
  const explore=read('src/pages/Explore.tsx');
  assert.match(explore, /'map'\>\(params.get\('view'\) === 'list' \? 'list' : 'map'\)/);
  assert.match(explore, /setMode\('list'\)/);
  assert.match(explore, /setMode\('map'\)/);
});
test('deployment config is parseable JSON', () => {
  const config=JSON.parse(read('vercel.json'));
  assert.ok(config.rewrites?.length);
});
