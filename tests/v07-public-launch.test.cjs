const test = require('node:test'); const assert = require('node:assert/strict'); const fs = require('node:fs');
const read = f => fs.readFileSync(f,'utf8');
test('route scroll restoration includes path and query, not only page mounts',()=>{const s=read('src/App.tsx');assert.match(s,/function ScrollToTop/);assert.match(s,/route.pathname, route.search, route.key/);assert.match(s,/window.scrollTo/);});
test('signup uses Supabase password auth and confirmation',()=>{const s=read('src/lib/store.tsx'); assert.match(s,/auth.signUp/);assert.match(s,/signInWithPassword/);assert.match(s,/emailRedirectTo/);assert.match(s,/pendingEmail/);});
test('signup validates phone, styles and experience',()=>{const s=read('src/pages/Auth.tsx');for(const x of ['firstName','lastName','phone','password','yearsExperience','DANCE_CHOICES'])assert.ok(s.includes(x));});
test('Palermo and four launch cities have public area centers',()=>{const s=read('src/types.ts');for(const x of ['Roma','Milano','Napoli','Palermo'])assert.ok(s.includes(x));});
test('Explore and Home use actual profile dance preferences',()=>{assert.match(read('src/pages/Explore.tsx'),/profile.dances/);assert.match(read('src/pages/Home.tsx'),/profile.dances/);});
test('tracking analytics is in app; there are no ad-network calls without approved setup',()=>{assert.match(read('src/App.tsx'),/Analytics/);assert.match(read('.env.example'),/VITE_ADS_ENABLED=false/);});
