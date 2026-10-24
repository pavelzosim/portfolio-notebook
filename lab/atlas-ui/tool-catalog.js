const routes={'sprite-sheet-assembly':'tool','image-compressor':'compressor','noise-generator':'noise'};
export function setupToolCatalog(root,records,{prefix='catalog'}={}){
 const cards=[...root.querySelectorAll('.tool-catalog-card')];
 if(cards.length!==records.length)throw Error('Catalog source and registry have different live-tool counts.');
 for(const card of cards){const url=new URL(card.getAttribute('href'),location.href),slug=url.pathname.split('/').filter(Boolean).at(-1);const record=records.find(r=>r.slug===slug);if(!record)throw Error('Catalog card is missing its registry record.');const title=card.querySelector('h3');title.id=`${prefix}-${slug}`;card.setAttribute('aria-labelledby',title.id);card.href=`?page=${routes[slug]}`;}
}
