import {readSourceDocument} from './source-document.js';
export function setupIntroSearch(root,{records=[]}={}){
 const form=root.querySelector('#searchForm'),input=root.querySelector('#siteSearch'),output=root.querySelector('#searchResult');if(!form)return;
 const candidates=[...root.querySelectorAll('.highlight-card,.home-records>a')];
 const update=()=>{const query=input.value.trim().toLocaleLowerCase();let visible=0;for(const card of candidates){card.hidden=!!query&&!card.textContent.toLocaleLowerCase().includes(query);if(!card.hidden)visible++;}output.textContent=candidates.length?`${visible} records`:'Enter to search notebook';};
 form.addEventListener('submit',event=>{event.preventDefault();const query=input.value.trim();location.assign('/blog/'+(query?'?q='+encodeURIComponent(query):''));});input.addEventListener('input',update);input.setAttribute('aria-label',candidates.length?'Filter homepage records':'Search notebook');output.setAttribute('aria-live','polite');output.title=`${records.length} records in the complete catalog`;update();
}
export async function createIntroSpecimen(){
 const source=await readSourceDocument('/');const intro=source.querySelector('#overview');
 intro.querySelectorAll('script,style,link').forEach(el=>el.remove());intro.querySelectorAll('[style]').forEach(el=>el.removeAttribute('style'));intro.removeAttribute('id');intro.className='document-section intro-profile';
 const title=intro.querySelector('h1'),heading=document.createElement('h3');heading.className='intro-heading';heading.append(...title.childNodes);title.replaceWith(heading);
 intro.querySelectorAll('video').forEach(video=>{video.muted=true;video.defaultMuted=true;video.setAttribute('muted','');});
 setupIntroSearch(intro);return intro;
}
