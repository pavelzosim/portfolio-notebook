// Translate authored legacy diagrams into existing canonical schematic/media faces.
// No source scripts or inline stylesheet is executed or imported.
export function adaptArticleStructures(body){
 const doc=body.ownerDocument,ns='http://www.w3.org/2000/svg';
 const svgNode=(tag,attrs={})=>{const el=doc.createElementNS(ns,tag);for(const [key,value] of Object.entries(attrs))el.setAttribute(key,value);return el;};
 body.querySelectorAll('.atlas-uml-diag__widget').forEach(widget=>{
  const scopes=[...widget.querySelectorAll('.atlas-uml-diag__scope')];if(!scopes.length)return;
  const frame=doc.createElement('div');frame.className='atlas-uml-diag';
  const header=doc.createElement('div');header.className='atlas-uml-diag__header';header.textContent='// DATA_FLOW // '+scopes.map(scope=>scope.firstElementChild.textContent.trim()).join(' → ');frame.append(header);
  const svg=svgNode('svg',{viewBox:`0 0 720 ${scopes.length*340}`,role:'img','aria-label':widget.textContent.replace(/\s+/g,' ').trim()});
  const text=(x,y,lines)=>{const label=svgNode('text',{x,y});lines.forEach((line,i)=>{const span=svgNode('tspan',{x,dy:i?20:0});span.textContent=line;label.append(span);});svg.append(label);};
  scopes.forEach((scope,index)=>{
   const top=index*340;svg.append(svgNode('rect',{x:16,y:top+12,width:688,height:310,class:'diagram-scope'}));
   text(30,top+38,[scope.firstElementChild.textContent.trim()]);
   const nodes=[...scope.querySelectorAll('.atlas-uml-diag__node')],wideFirst=nodes[0]?.style.gridColumn==='1 / -1'||nodes[0]?.getAttribute('style')?.includes('grid-column:1/-1');
   nodes.forEach((node,i)=>{
    const full=wideFirst?i===0:i===2,secondRow=wideFirst?i>0:i===2;
    const x=full?30:30+(wideFirst?i-1:i)*340,y=top+(secondRow?194:56),width=full?660:320;
    const group=svgNode('g',{class:'diagram-node'});group.append(svgNode('rect',{x,y,width,height:112}));svg.append(group);
    const title=node.querySelector('.atlas-uml-diag__node-title').textContent.trim();
    const clone=node.querySelector('.atlas-uml-diag__node-body').cloneNode(true);clone.querySelectorAll('br').forEach(br=>br.replaceWith('\n'));
    text(x+12,y+22,[title,...clone.textContent.trim().split('\n').map(s=>s.trim()).filter(Boolean)]);
   });
   const flow=[...scope.querySelectorAll('div')].find(el=>el.children.length===0&&el.textContent.trim().startsWith('//'));
   if(flow)text(30,top+185,[flow.textContent.trim()]);
   if(index<scopes.length-1)text(350,top+337,['↓']);
  });frame.append(svg);widget.replaceWith(frame);
 });
 body.querySelectorAll('svg').forEach(svg=>{
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
