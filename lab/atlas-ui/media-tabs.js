// Candidate composition: thematic tabs around the existing independent sliders.
export function setupMediaTabs(root){
 root.querySelectorAll('.media-tabs').forEach(host=>{
  const tabs=[...host.querySelectorAll('[role=tab]')],panels=tabs.map(tab=>host.querySelector('#'+tab.getAttribute('aria-controls')));
  const select=(index,focus=false)=>{tabs.forEach((tab,i)=>{tab.setAttribute('aria-selected',String(i===index));tab.tabIndex=i===index?0:-1;panels[i].hidden=i!==index;panels[i].inert=i!==index;});if(focus)tabs[index].focus();};
  tabs.forEach((tab,i)=>{tab.addEventListener('click',()=>select(i));tab.addEventListener('keydown',event=>{let next;if(event.key==='ArrowRight')next=(i+1)%tabs.length;else if(event.key==='ArrowLeft')next=(i+tabs.length-1)%tabs.length;else if(event.key==='Home')next=0;else if(event.key==='End')next=tabs.length-1;if(next!==undefined){event.preventDefault();select(next,true);}});});
  const followHash=()=>{const index=panels.findIndex(panel=>'#'+panel.id===location.hash);if(index>=0)select(index);};
  select(0);followHash();window.addEventListener('hashchange',followHash);
 });
}
