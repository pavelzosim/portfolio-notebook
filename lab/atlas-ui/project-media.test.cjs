const {test}=require('node:test');
const assert=require('node:assert/strict');
const projects=require('../../content/projects/index.json').projects;
test('every original project gallery image survives thematic grouping',async()=>{
 const {projectMediaThemes}=await import('./project-media.js');
 for(const record of projects){
  const original=[...(record.media||[]),...(record.locationMedia||[]),...(record.mediaGalleries||[]).flatMap(group=>group.media||[])];
  const rendered=projectMediaThemes(record).flatMap(([, ,items])=>items).map(item=>item.src);
  for(const image of original)assert(rendered.includes(image.src),record.slug+' missing '+image.src);
 }
 assert.equal(projectMediaThemes(projects.find(r=>r.slug==='airport-interaction-screen')).flatMap(([, ,items])=>items).length,17);
 assert.equal(projectMediaThemes(projects.find(r=>r.slug==='deloitte-virtual-factory')).flatMap(([, ,items])=>items).length,35);
});
