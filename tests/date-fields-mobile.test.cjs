const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {join}=require('node:path');
const root=join(__dirname,'..');
const page=readFileSync(join(root,'src/pages/CreateEvent.tsx'),'utf8');
const css=readFileSync(join(root,'src/index.css'),'utf8');
test('date and time use separate native controls, no datetime-local',()=>{
  assert.doesNotMatch(page,/type="datetime-local"/);
  assert.equal((page.match(/type="date"/g)||[]).length,2);
  assert.equal((page.match(/type="time"/g)||[]).length,2);
});
test('date and time fields retain the existing combined timestamps',()=>{
  for (const part of ['startsAt.slice(0,10)','startsAt.slice(11,16)','endsAt.slice(0,10)','endsAt.slice(11,16)']) assert.ok(page.includes(part));
  assert.match(page,/new Date\(startsAt\)\.toISOString\(\)/);
  assert.match(page,/new Date\(endsAt\)\.toISOString\(\)/);
});
test('iPhone controls constrained to form width and one-column groups',()=>{
  assert.match(css,/\.create-form input\.event-date-control\s*\{[^}]*min-width:\s*0;[^}]*max-width:\s*100%;[^}]*box-sizing:\s*border-box/s);
  assert.match(css,/@media \(max-width: 680px\)\s*\{\s*\.create-form \.event-date-pair\s*\{\s*grid-template-columns:\s*minmax\(0, 1fr\)/s);
  assert.match(css, /::-webkit-date-and-time-value/);
});
