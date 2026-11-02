const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const base = path.resolve(__dirname, '..');
const main = fs.readFileSync(path.join(base, 'src/main.tsx'), 'utf8');
const css = fs.readFileSync(path.join(base, 'src/tropical.css'), 'utf8');
const html = fs.readFileSync(path.join(base, 'index.html'), 'utf8');
const chat = fs.readFileSync(path.join(base, 'src/index.css'), 'utf8');

test('detects installed iOS PWA using navigator.standalone and display-mode', () => {
  assert.match(main, /navigator as Navigator & \{ standalone\?: boolean \}/);
  assert.match(main, /display-mode: standalone/);
  assert.match(main, /classList\.add\('ritmo-ios-standalone'\)/);
});
test('reserves the real iPhone status-bar safe inset without changing Safari layout', () => {
  assert.match(html, /viewport-fit=cover/);
  assert.match(html, /apple-mobile-web-app-status-bar-style.*black-translucent/);
  assert.match(css, /html\.ritmo-ios-standalone \{[\s\S]*?--ritmo-ios-safe-top: max\(20px, env\(safe-area-inset-top, 0px\)\)/);
  assert.match(css, /html\.ritmo-ios-standalone \.app-shell,[\s\S]*?padding-top: var\(--ritmo-ios-safe-top\)/);
});
test('fixed chat pane is inset while preserving keyboard visualViewport geometry', () => {
  assert.match(css, /html\.ritmo-ios-standalone \.app-shell:has\(\.chat-mobile-conversation\) \.main-area \{\s*padding-top: var\(--ritmo-ios-safe-top\)/);
  assert.match(chat, /--ritmo-chat-height/);
  assert.match(chat, /--ritmo-chat-top/);
});
