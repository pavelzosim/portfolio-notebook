import {setupMemoryPanel} from './memory-panel.js?v=review-200';
import {FUNCTION_PRESETS} from './memory-presets.js';
import {renderRaymarchStudy} from './raymarch-study-view.js?v=review-199';
import {setupRaymarchStudy} from './raymarch-study-panel.js?v=review-199';
import {renderFunctionStudy,setupFunctionStudy} from './function-study-panel.js';
export function setupMemoryWorkspace(root){
 const requestedHash=location.hash,header=root.querySelector('.document-head'),sections=[...root.querySelectorAll(':scope>.tool-section')],selector=root.querySelector('#layout-examples'),selectorRow=selector.closest('.control-toolbar');
 selector.parentElement.firstChild.textContent='Example';header.append(selectorRow);
 const buffer=document.createElement('div');buffer.id='buffer-layout';buffer.append(...sections);
 const functionSection=document.createElement('section');functionSection.id='function-study';functionSection.className='tool-section';functionSection.hidden=true;functionSection.innerHTML=renderFunctionStudy();functionSection.querySelector('#function-preset-info').append(buffer.querySelector('#layout-function'));buffer.prepend(functionSection);
 const ray=document.createElement('div');ray.id='function-to-pixel';ray.hidden=true;ray.innerHTML=renderRaymarchStudy();root.replaceChildren(header,buffer,ray);
 const study=setupFunctionStudy(functionSection);
 const present=key=>{const isRay=key==='raymarch';buffer.hidden=isRay;ray.hidden=!isRay;study.show(FUNCTION_PRESETS[key]?key:null);let n=0;for(const section of buffer.querySelectorAll(':scope>.tool-section'))if(!section.hidden)section.querySelector('.section-label>span').textContent='§ '+String(++n).padStart(2,'0');};
 const memory=setupMemoryPanel(root,{onExampleChange:present});
 setupRaymarchStudy(ray,{openBuffer:(declarations,field)=>{memory.loadBuffer(declarations,field);history.replaceState(null,'',location.pathname+location.search);root.querySelector('#memory-inspection').scrollIntoView({block:'start'});}});
 const followHash=()=>{if(location.hash==='#function-to-pixel'){selector.value='raymarch';selector.dispatchEvent(new Event('change'));}};
 selector.addEventListener('change',()=>history.replaceState(null,'',location.pathname+location.search+(selector.value==='raymarch'?'#function-to-pixel':'')));
 window.addEventListener('hashchange',followHash);if(requestedHash==='#function-to-pixel')followHash();
}
