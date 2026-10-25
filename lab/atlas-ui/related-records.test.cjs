const{test}=require('node:test');const assert=require('node:assert/strict');
test('every project and article has two distinct other end records',async()=>{
 const{selectRelatedProjects,selectRelatedArticles}=await import('./related-records.js');
 const projects=require('../../content/projects/index.json').projects;
 const articles=require('../../content/posts/index.json').records.filter(record=>record.state==='published'&&record.indexable!==false);
 for(const [records,select]of [[projects,selectRelatedProjects],[articles,selectRelatedArticles]])for(const record of records){const result=select(record,records);assert.equal(result.length,2,record.slug);assert.equal(new Set(result.map(item=>item.id)).size,2);assert(!result.some(item=>item.id===record.id));}
 const airport=projects.find(record=>record.slug==='airport-interaction-screen');assert.equal(selectRelatedProjects(airport,projects).length,2);
});
