// Translate authored legacy diagrams into existing canonical schematic/media faces.
// No source scripts or inline stylesheet is executed or imported.
export function adaptArticleStructures(body){
 const doc=body.ownerDocument,ns='http://www.w3.org/2000/svg';
 body.querySelectorAll('.align-row').forEach(row=>{
  const host=row.parentElement;host.classList.add('alignment-diagram');host.firstElementChild.classList.add('alignment-title');host.lastElementChild.classList.add('alignment-total');
  row.querySelectorAll('.align-field').forEach(field=>{field.dataset.quarters=String(Math.round((parseFloat(field.style.width)||25)/25));field.parentElement.classList.add('alignment-track');});
 });
 body.querySelectorAll('.mem-bars .mb-track').forEach(track=>{
  const fill=track.querySelector('.mb-fill');if(!fill)return;
  const width=Math.min(100,Math.max(0,parseFloat(fill.style.width)||0));
  const svg=doc.createElementNS(ns,'svg');svg.setAttribute('viewBox','0 0 100 5');svg.setAttribute('preserveAspectRatio','none');svg.setAttribute('aria-hidden','true');
  for(const [size,cls]of [[100,'memory-track'],[width,'memory-fill']]){const rect=doc.createElementNS(ns,'rect');rect.setAttribute('width',size);rect.setAttribute('height','5');rect.setAttribute('class',cls);svg.append(rect);}track.replaceChildren(svg);
 });
 body.querySelectorAll('.mem-bars').forEach(bars=>{
  const heading=bars.previousElementSibling,description=bars.nextElementSibling;
  const frame=doc.createElement('div');frame.className='atlas-table-frame atlas-table-frame--solid';
  const inner=doc.createElement('div');inner.className='atlas-table-body';bars.before(frame);
  if(heading?.matches('h3')){heading.classList.add('atlas-table-header-solid');frame.append(heading);}
  frame.append(inner);inner.append(bars);if(description?.matches('p'))inner.append(description);
 });
 body.querySelectorAll('.atlas-uml-diag__widget').forEach(widget=>{
  widget.classList.add('diagram-widget');
  widget.setAttribute('role','group');widget.setAttribute('aria-label','CPU ownership → GPU compute → HLSL material assembly');
  for(const child of widget.children){
   if(!child.classList.contains('atlas-uml-diag__scope')){child.classList.add('diagram-connector');continue;}
   child.firstElementChild.classList.add('diagram-scope-title');
   const grid=child.children[1];if(!grid)continue;grid.classList.add('diagram-node-grid');
   for(const node of grid.children){
    if(node.classList.contains('atlas-uml-diag__node')){
     if(node.style.gridColumn.replaceAll(' ','')==='1/-1')node.classList.add('diagram-node-wide');
    }else node.classList.add('diagram-flow-label');
   }
  }
 });
 body.querySelectorAll('svg').forEach(svg=>{
  // SVG label sizes are diagram coordinates, not article typography. Preserve
  // authored numeric sizes as presentation attributes before removing styles.
  svg.querySelectorAll('[style]').forEach(node=>{const size=node.style.fontSize;if(/^\d+(?:\.\d+)?px$/.test(size))node.setAttribute('font-size',size);});
  // Semantic SVG paint attributes survive sanitization; translate their token names.
  const tokens={'--atlas-ink':'--ink','--atlas-bg':'--surface','--atlas-crit':'--ink','--atlas-border':'--border-color','--atlas-ink-muted':'--muted'};
  for(const el of [svg,...svg.querySelectorAll('*')])for(const attr of [...el.attributes])if(attr.value.includes('var(--atlas-'))el.setAttribute(attr.name,attr.value.replace(/--atlas-[\w-]+/g,name=>tokens[name]||'--ink'));
  if(svg.closest('.atlas-schematic,.atlas-uml-diag'))return;
  const canvas=svg.parentElement,host=canvas?.parentElement;
  const legend=host?.children[1];
  if(!host||canvas.children.length!==1||!host.hasAttribute('style')||!legend||legend.children.length!==3||![...legend.children].every(row=>row.children.length===2)||!svg.querySelector('circle'))return;
  const figure=doc.createElement('figure');figure.className='atlas-schematic';
  const header=doc.createElement('div');header.className='atlas-schematic__header';header.textContent='[ GEOMETRY // CROSS-SECTION ]';
  canvas.className='atlas-schematic__canvas';
  svg.setAttribute('role','img');svg.setAttribute('aria-label',[...legend.children].map(row=>row.firstElementChild.textContent.trim()).join(' / '));
  const caption=doc.createElement('figcaption');caption.className='atlas-schematic__note';const content=doc.createElement('div');caption.append(content);
  for(const row of [...legend.children]){const p=doc.createElement('p');const [name,description]=row.children;if(name&&description){const strong=doc.createElement('strong');strong.textContent=name.textContent;p.append(strong,doc.createElement('br'),description.textContent);content.append(p);}}
  const sync=host.lastElementChild;if(sync&&sync!==legend){const note=doc.createElement('aside');note.className='atlas-callout atlas-callout--note';note.append(...sync.childNodes);content.append(note);}
  figure.append(header,canvas,caption);host.replaceWith(figure);
 });
 body.querySelectorAll('.atlas-interactive-frame').forEach(frame=>{frame.classList.add('media-frame');const iframe=frame.querySelector('iframe');if(iframe&&!iframe.title)iframe.title='Interactive shader preview';});
}
