const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
test('platform filters use real exact tags and combine with kind/search',async()=>{
 const {matchesResource}=await import('./tools.js');
 const records=JSON.parse(fs.readFileSync(path.join(__dirname,'../../content/posts/index.json'),'utf8')).records.filter(r=>r.resource&&r.state==='published'&&r.indexable!==false);
 assert.equal(records.filter(r=>matchesResource(r,{platform:'cli'})).length,1);
 assert.equal(records.filter(r=>matchesResource(r,{platform:'houdini'})).length,5);
 assert.equal(records.filter(r=>matchesResource(r,{platform:'houdini',kind:'asset'})).length,0);
 assert.equal(records.filter(r=>matchesResource(r,{platform:'houdini',kind:'tool',query:'skeleton'})).length,1);
 assert.equal(records.filter(r=>matchesResource(r,{})).length,14);
 assert.equal(matchesResource({kind:'tool',title:'Houdini-like',summary:'CLI example',tags:['houdini-like']},{platform:'houdini'}),false);
});
