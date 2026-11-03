import {renderMediaTabs,setupMediaTabs} from './media-tabs.js?v=review-198';
import {setupMemoryPanel} from './memory-panel.js?v=review-198';
import {renderRaymarchStudy} from './raymarch-study-view.js?v=review-199';
import {setupRaymarchStudy} from './raymarch-study-panel.js?v=review-199';
export function setupMemoryWorkspace(root){
 const header=root.querySelector('.document-head'),sections=[...root.querySelectorAll(':scope>.tool-section')];
 const holder=document.createElement('div');holder.innerHTML=renderMediaTabs([{id:'buffer-layout',title:'Buffer layout',html:''},{id:'function-to-pixel',title:'Function → pixel · Raymarch',html:''}],s=>s,{label:'Shader study mode'});
 const host=holder.firstElementChild;header.append(host.querySelector('.media-tabs-list'));host.prepend(header);host.querySelector('#buffer-layout').append(...sections);host.querySelector('#function-to-pixel').innerHTML=renderRaymarchStudy();root.replaceChildren(host);
 const memory=setupMemoryPanel(root);setupMediaTabs(root);
 setupRaymarchStudy(root.querySelector('#function-to-pixel'),{openBuffer:(declarations,field)=>{memory.loadBuffer(declarations,field);root.querySelector('#tab-buffer-layout').click();root.querySelector('#memory-inspection').scrollIntoView({block:'start'});}});
}
