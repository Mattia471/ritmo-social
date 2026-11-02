const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {join}=require('node:path');
const root=join(__dirname,'..');
const read=p=>readFileSync(join(root,p),'utf8');
test('iOS mobile focus: every editable field uses at least 16px instead of autozooming',()=>{
  const css=read('src/index.css');
  const mobile=css.slice(css.indexOf('/* B05-F07 | iOS Safari:'));
  assert.match(mobile,/@media\s*\(max-width:\s*1024px\)/);
  assert.match(mobile,/input:not\(\[type="checkbox"\]\)/);
  assert.match(mobile,/select,\s*textarea\s*\{\s*font-size:\s*16px\s*!important;/);
});
test('form editing: mobile date fields stack and bottom nav disappears on focus',()=>{
  const css=read('src/index.css');
  const mobile=css.slice(css.indexOf('/* B05-F07 | iOS Safari:'));
  assert.match(mobile,/\.create-form\s+\.form-row\s*\{\s*grid-template-columns:\s*minmax\(0,\s*1fr\)/);
  assert.match(mobile,/\.app-shell:has\(\.create-form/);
  assert.match(mobile,/visibility:\s*hidden/);
  assert.match(mobile,/scroll-margin-bottom:/);
});
test('accessibility: users can still pinch-zoom manually',()=>{
  const html=read('index.html');
  assert.match(html,/name="viewport"/);
  assert.doesNotMatch(html,/user-scalable\s*=\s*no|maximum-scale\s*=\s*1/i);
});
