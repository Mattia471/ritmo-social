const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const os = require('node:os');
const fs = require('node:fs');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'ritmo-smoke-'));
function compile(source, target) {
  const input = fs.readFileSync(path.join(root, source), 'utf8');
  const output = ts.transpileModule(input, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } });
  const destination = path.join(temp, target);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, output.outputText);
}
compile('src/types.ts', 'types.js');
compile('src/data/demo.ts', 'data/demo.js');
compile('src/lib/geo.ts', 'lib/geo.js');
const { CITY_AREAS } = require(path.join(temp, 'types.js'));
const { initialDemo } = require(path.join(temp, 'data/demo.js'));
const { distanceKm, cityCenter } = require(path.join(temp, 'lib/geo.js'));

test('demo: eventi, prenotazioni e messaggi di esempio', () => {
  const s = initialDemo();
  assert.ok(s.events.length >= 6);
  assert.ok(s.attendances.some(a => a.userId === 'me' && a.status === 'approved'));
  assert.ok(s.attendances.some(a => a.userId === 'me' && a.status === 'pending'));
  assert.ok(s.messages.some(m => m.eventId === null));
});

test('privacy: la tabella pubblica non contiene indirizzi di evento', () => {
  const s = initialDemo();
  for (const e of s.events) {
    assert.ok(!Object.hasOwn(e, 'address'));
    assert.ok(!Object.hasOwn(e, 'directions'));
    assert.ok(s.venues.some(v => v.eventId === e.id));
  }
  const sql = fs.readFileSync(path.join(root, 'supabase/migrations/20261101120000_initial.sql'), 'utf8');
  assert.match(sql, /create policy private_location_read[\s\S]*status='approved'/);
  assert.match(sql, /create policy messages_read[\s\S]*status='approved'/);
  assert.match(sql, /create policy attendances_request[\s\S]*status='pending'/);
});

test('raggio geografico: distanza città e centri area', () => {
  assert.equal(distanceKm(cityCenter('Roma'), cityCenter('Roma')),0);
  assert.ok(distanceKm(cityCenter('Roma'),cityCenter('Napoli')) > 100);
  for (const e of initialDemo().events) {
    const a = CITY_AREAS[e.city].find(a => a.name === e.area);
    assert.ok(a);
    assert.equal(e.publicLat,a.lat);
    assert.equal(e.publicLng,a.lng);
  }
});

test('flusso demo: i membri in attesa non hanno accesso al luogo via logica UI', () => {
  const s = initialDemo();
  const own = s.attendances.find(a => a.userId === 'me' && a.status === 'pending');
  assert.ok(own);
  const canViewAddress = (a) => a.status === 'approved' || s.events.find(e => e.id === a.eventId).hostId === a.userId;
  assert.equal(canViewAddress(own),false);
  assert.equal(canViewAddress({...own,status:'approved'}),true);
});

test('schema SQL: coordinate pubbliche ricavate da una whitelist di zone', () => {
  const sql = fs.readFileSync(path.join(root,'supabase/migrations/20261101120000_initial.sql'),'utf8');
  assert.match(sql,/select lat,lng into v_lat,v_lng from public\.area_centers/);
  assert.match(sql,/p_city,p_area,v_lat,v_lng,p_starts_at/);
  assert.match(sql,/pg_advisory_xact_lock/);
  assert.match(sql,/grant execute on function public\.resolve_join_request/);
});
