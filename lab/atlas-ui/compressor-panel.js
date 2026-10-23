/* Layout adapter only: retain original controls, IDs and processing handlers. */
import {createControlDisclosure} from './control-disclosure.js?v=review-84';
export function setupCompressorPanel(main){
 const settings=main.querySelector('#settings'),original=settings.querySelector('.compress-settings');
 const panel=document.createElement('div');panel.className='control-panel control-panel--columns';
 const groups=[['Workflow & encoding',['preset','format','quality']],['Dimensions',['max-edge','filter','pot']],['Transparency',['alpha','matte']]];
 for(const [title,ids]of groups){
  const group=document.createElement('fieldset');group.className='control-group control-group--stack';const legend=document.createElement('legend');legend.textContent=title;group.append(legend);
  for(const id of ids)group.append(main.querySelector('#'+id).closest('label'));
  panel.append(group);
 }
 original.replaceWith(panel);
 main.querySelectorAll('#preview>p,#export>p:not(#summary)').forEach(p=>{if(p.id==='loupe-help'){p.hidden=true;return;}const note=document.createElement('aside');note.className='atlas-callout atlas-callout--note';p.before(note);note.append(p);});
 const notes=[...settings.querySelectorAll(':scope>p')];
 if(notes.length){const note=document.createElement('aside');note.className='atlas-callout atlas-callout--note';note.setAttribute('aria-label','Settings notes');notes[0].before(note);note.append(...notes);}
 const hint=(id,text)=>{const p=document.createElement('small');p.id=id+'-hint';p.className='control-hint';p.textContent=text;const input=main.querySelector('#'+id);input.setAttribute('aria-describedby',p.id);input.closest('label').append(p);return p;};
 const qualityHint=hint('quality',''),matteHint=hint('matte','');
 hint('max-edge','Longest output edge; smaller images are not enlarged.');
 hint('pot','Optional: snaps each axis separately and may change proportions.');
 const potLabel=main.querySelector('#pot').closest('label');potLabel.classList.add('control-check');
 const caption=document.createElement('span');for(const node of [...potLabel.childNodes])if(node.nodeType===Node.TEXT_NODE){caption.append(node);}potLabel.insertBefore(caption,potLabel.querySelector('.control-hint'));
 const preview=main.querySelector('#preview'),views=[...preview.querySelectorAll(':scope>label.compress-view')];
 const toolbar=document.createElement('div');toolbar.className='control-toolbar';toolbar.setAttribute('role','group');toolbar.setAttribute('aria-label','Preview display');preview.querySelector('.compress-compare').after(toolbar);toolbar.append(...views);
 const action=settings.querySelector('.tool-actions');action.classList.add('control-action');
 main.querySelector('#process').textContent='Process batch';
 const status=main.querySelector('#status');action.prepend(status);action.classList.add('control-status-row');
 const details=createControlDisclosure('Texture settings');
 const heading=settings.querySelector('.section-label h2');heading.textContent='Texture settings';panel.before(details);details.append(panel);const note=settings.querySelector(':scope>.atlas-callout');if(note)details.append(note);
 const presetLabels={visual:'Colour / albedo — WebP',data:'Data maps — PNG, original size',pixel:'Pixel art — PNG, nearest',custom:'Custom texture settings'};
 for(const option of main.querySelector('#preset').options)option.textContent=presetLabels[option.value]||option.textContent;
 const filterLabels={high:'Smooth — colour textures',low:'Smooth — fast preview',nearest:'Nearest — pixel art / hard edges'};
 for(const option of main.querySelector('#filter').options)option.textContent=filterLabels[option.value]||option.textContent;
 const update=()=>{
  qualityHint.textContent=main.querySelector('#format').value==='image/png'?'Lossless PNG: quality does not apply.':'Lower quality makes smaller files; compare the result below.';
  matteHint.textContent=main.querySelector('#matte').disabled?'Used only for JPEG or flattened alpha.':'Transparent pixels are composited onto this colour.';
 };
 const observer=new MutationObserver(update);observer.observe(main.querySelector('#process'),{attributes:true,attributeFilter:['disabled']});observer.observe(main.querySelector('#matte'),{attributes:true,attributeFilter:['disabled']});
 settings.addEventListener('input',()=>queueMicrotask(update));settings.addEventListener('change',()=>queueMicrotask(update));update();
 const boundaries=[...main.querySelectorAll('.tool-section')].find(s=>s.querySelector('h2')?.textContent.trim()==='Technical boundaries');
 if(boundaries){const feedback=document.createElement('p');feedback.innerHTML='Have a suggestion for improving this tool? Write to <a href="mailto:pavel.zosim@protonmail.com">pavel.zosim@protonmail.com</a>.';boundaries.append(feedback);}
}
