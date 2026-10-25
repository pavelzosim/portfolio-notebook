/* One native disclosure behavior for tool settings. */
export function createControlDisclosure(title,{open=true}={}){
 const details=document.createElement('details');details.className='control-disclosure';details.open=open;
 const summary=document.createElement('summary'),label=document.createElement('span'),action=document.createElement('span');label.textContent=title;action.className='control-disclosure-action';summary.append(label,action);summary.setAttribute('aria-label',`Expand or collapse ${title.toLowerCase()}`);
 const sync=()=>{action.textContent=details.open?'[Collapse]':'[Expand]';};details.addEventListener('toggle',sync);sync();details.append(summary);return details;
}
