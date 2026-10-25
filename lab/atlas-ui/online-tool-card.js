export function setupOnlineToolCards(root){
 root.querySelectorAll('[data-home-tools-slider]').forEach(slider=>{
  if(slider.dataset.ready)return;slider.dataset.ready='true';
  const cards=[...slider.querySelectorAll('.browser-tool-feature')];let index=0;
  const render=()=>{cards.forEach((card,i)=>{card.hidden=i!==index;card.inert=i!==index;});const output=slider.querySelector('output');output.textContent=`${index+1} / ${cards.length}`;output.setAttribute('aria-live','polite');};
  for(const [selector,step]of [['[data-home-tools-prev]',-1],['[data-home-tools-next]',1]]){const button=slider.querySelector(selector);button.classList.add('button','button--quiet');button.addEventListener('click',()=>{index=(index+step+cards.length)%cards.length;render();});}
  render();
 });
}
