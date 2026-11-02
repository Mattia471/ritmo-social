const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const read = filename => fs.readFileSync(filename, 'utf8');
const sql = read('supabase/migrations/20261103003000_notifications_and_webpush.sql');

test('notifications and device endpoints have private row-level security policies', () => {
  for (const table of ['user_notifications','notification_preferences','push_subscriptions']) {
    assert.match(sql, new RegExp('alter table public\\.' + table + ' enable row level security'));
    assert.match(sql, new RegExp('revoke all on public\\.' + table + ' from public, anon, authenticated'));
  }
  assert.match(sql, /for select to authenticated using \(user_id = \(select auth\.uid\(\)\)\)/);
  assert.match(sql, /grant update \(read_at\) on public\.user_notifications to authenticated/);
});

test('nearby events use coarse profile city, never exact venue or GPS', () => {
  assert.match(sql, /where p\.city=new\.city and p\.id<>new\.host_id and pref\.nearby_events/);
  assert.match(sql, /'\/event\/' \|\| new\.id::text/);
  assert.doesNotMatch(sql, /new\.address|new\.directions|current_setting\('request\.headers'\)/);
});

test('organizers and participants get appropriate join and decision notifications', () => {
  assert.match(sql, /create trigger notify_new_join_request after insert on public\.attendances/);
  assert.match(sql, /create trigger notify_join_decision after update of status on public\.attendances/);
  assert.match(sql, /new\.status in \('approved','rejected'\)/);
  assert.match(sql, /pref\.event_cancellations/);
  assert.match(sql, /on conflict \(user_id,dedupe_key\) do nothing/);
});

test('push worker is protected by secret in Vault, never a public client key', () => {
  const worker = read('supabase/functions/ritmo-web-push/index.ts');
  assert.match(sql, /vault\.create_secret/);
  assert.match(sql, /revoke all on function public\.push_worker_config\(\) from public,anon,authenticated/);
  assert.match(sql, /grant execute on function public\.push_worker_config\(\) to service_role/);
  assert.match(worker, /request\.headers\.get\("x-ritmo-hook"\)/);
  assert.match(worker, /isApprovedPushEndpoint/);
  assert.match(worker, /webpush\.importVapidKeys/);
  assert.doesNotMatch(worker, /VAPID_PRIVATE_KEY\s*=|SERVICE_ROLE_KEY\s*=\s*["']/);
});

test('service worker shows visible notifications and keeps click navigation same-origin', () => {
  const worker = read('public/sw.js');
  assert.match(worker, /addEventListener\('push'/);
  assert.match(worker, /showNotification/);
  assert.match(worker, /addEventListener\('notificationclick'/);
  assert.match(worker, /destination\.origin !== self\.location\.origin/);
});

test('notification settings require explicit permission and accommodate iOS web apps', () => {
  const context = read('src/lib/notifications.tsx');
  const page = read('src/pages/Notifications.tsx');
  assert.match(context, /Notification\.requestPermission\(\)/);
  assert.match(context, /navigator\.serviceWorker\.register\('\/sw\.js'/);
  assert.match(context, /isIos\(\) && !installed\(\)/);
  assert.match(context, /push_subscriptions/);
  assert.match(context, /\.eq\('user_id', userId\)/);
  assert.match(page, /Aggiungi alla schermata Home/);
  assert.match(page, /Notifiche push sul dispositivo/);
  assert.match(page, /Segna tutte come lette/);
});

test('unread bell and deep links exist across mobile and desktop layouts', () => {
  const layout = read('src/components/Layout.tsx');
  const app = read('src/App.tsx');
  const profile = read('src/pages/Profile.tsx');
  assert.match(layout, /notice-header-count/);
  assert.match(layout, /to="\/notifications"/);
  assert.match(app, /Route path="\/notifications"/);
  assert.match(app, /<NotificationsProvider>/);
  assert.match(profile, /Notifiche e preferenze/);
  assert.match(profile, /await disablePush\(\)/);
});


test('push permission is tied to a clear tap and service worker is preloaded', () => {
  const context = read('src/lib/notifications.tsx');
  const page = read('src/pages/Notifications.tsx');
  assert.match(context, /const preparePush = useCallback/);
  assert.match(context, /pushPrerequisites\.current = Promise\.all\(/);
  assert.match(context, /navigator\.serviceWorker\.register\('\/sw\.js'/);
  const enableStart = context.indexOf('const enablePush = useCallback');
  const enableEnd = context.indexOf('const disablePush = useCallback');
  const enable = context.slice(enableStart, enableEnd);
  assert.ok(enable.indexOf('Notification.requestPermission()') < enable.indexOf('pushManager.subscribe('));
  assert.doesNotMatch(enable, /functions\.invoke/);
  assert.match(page, /notice-activation-guide/);
  assert.match(page, /Copia link per Safari/);
  assert.match(page, /Attiva notifiche push/);
  assert.match(page, /capability === 'needs-install'/);
  assert.match(page, /!pushReady/);
});
