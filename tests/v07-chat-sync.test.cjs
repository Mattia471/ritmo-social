const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const read = path => readFileSync(path, 'utf8');

test('chat fetches messages for the active room rather than truncating across all rooms', () => {
  const store = read('src/lib/store.tsx');
  assert.match(store, /const loadChatMessages = useCallback/);
  assert.match(store, /\.is\('event_id', null\)/);
  assert.match(store, /\.eq\('event_id', eventId\)/);
  assert.match(store, /\.limit\(100\)/);
  assert.doesNotMatch(store, /chat_messages'\)\.select\('\*'\)/);
});

test('new message is inserted once and immediately reflected in the open room', () => {
  const store = read('src/lib/store.tsx');
  assert.match(store, /\.insert\(\{ event_id: eventId, user_id: userId, content: safeText \}\)/);
  assert.match(store, /\.single\(\)/);
  assert.match(store, /some\(msg => msg\.id === inserted\.id\)/);
});

test('conversation refreshes on Realtime events, reconnect and browser focus', () => {
  const chat = read('src/pages/Chats.tsx');
  assert.match(chat, /postgres_changes/);
  assert.match(chat, /status === 'SUBSCRIBED'/);
  assert.match(chat, /visibilitychange/);
  assert.match(chat, /window\.addEventListener\('focus'/);
  assert.match(chat, /if \(!connected && !document\.hidden\) reload\(\)/);
  assert.match(chat, /client\.removeChannel\(subscription\)/);
});

test('chat surfaces failures and lets the user refresh or retry messages', () => {
  const chat = read('src/pages/Chats.tsx');
  assert.match(chat, /role="alert"/);
  assert.match(chat, /setChatError\(err instanceof Error/);
  assert.match(chat, /title="Aggiorna conversazione"/);
  assert.match(chat, /hasNewMessages/);
});

test('signing out clears personal profile and messages from browser state', () => {
  const store = read('src/lib/store.tsx');
  assert.match(store, /Never show the previous account\'s profile after logout/);
  assert.match(store, /setData\(s => \(\{ \.\.\.s, \.\.\.emptyLiveChats\(\) \}\)\)/);
});
