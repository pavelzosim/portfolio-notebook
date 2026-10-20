const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=name=>fs.readFileSync(path.join(__dirname,name),'utf8');
test('preview is noindex, outside deployment allowlist, and loads only candidate CSS',()=>{
 const html=read('index.html');
 assert.match(html,/<meta name="robots" content="noindex,nofollow">/);
 const sheets=[...html.matchAll(/rel="stylesheet" href="([^"]+)"/g)].map(m=>m[1]);
 assert.deepEqual(sheets.map(s=>s.split('?')[0]),['./tokens.css','./shell.css','./components.css','./fixtures.css']);
 assert(sheets.every(s=>/\?v=review-\d+$/.test(s)));
 const builder=fs.readFileSync(path.join(__dirname,'../../scripts/build_github_pages.py'),'utf8');
 assert(!builder.match(/SITE_DIRECTORIES\s*=\s*\([^\n]*["']lab["']/));
 assert(!html.includes('analytics'));
});
test('candidate modules do not import legacy CSS or force declarations',()=>{
 for(const file of ['tokens.css','shell.css','components.css','fixtures.css']){
  const css=read(file);assert(!css.includes('!important'),file);
  assert(!/@import(?![^;]*fonts\.googleapis\.com)/.test(css),file);
 }
});
test('shell geometry and interaction faces have separate single owners',()=>{
 const shell=read('shell.css'),components=read('components.css'),fixtures=read('fixtures.css');
 assert.match(shell,/\.workspace\{/);assert.match(components,/\.atlas-btn,\.button\{/);
 assert(!/\.workspace\s*\{|\.shell\s*\{|\.commander\s*\{|\.atlas-btn\s*\{/.test(fixtures));
 assert.match(shell,/prefers-reduced-motion/);
 assert.match(read('tokens.css'),/--left:220px;--right:200px/);
});
