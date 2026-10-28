/* Shared sidebar disclosure policy for every Online Tool. Native keyboard behaviour. */
export function setupToolSidebar(root){
 for(const block of [...root.querySelectorAll(':scope>.meta-block')]){
  if(block.matches('details')){block.classList.add('control-disclosure');block.open=false;continue;}
  const heading=block.querySelector(':scope>p');if(!heading)continue;
  if(['[HOW TO USE]','[SUPPORT]'].includes(heading.textContent.trim()))continue;
  const details=document.createElement('details'),summary=document.createElement('summary');
  details.className=block.className+' control-disclosure';if(block.id)details.id=block.id;
  summary.textContent=heading.textContent;heading.remove();details.append(summary,...block.childNodes);block.replaceWith(details);
 }
}
