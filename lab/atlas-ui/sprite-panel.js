export function setupSpritePanel(main){
 for(const p of main.querySelectorAll('#layout>p:first-of-type,#export>p')){const note=document.createElement('aside');note.className='atlas-callout atlas-callout--note';p.before(note);note.append(p);}
 const status=main.querySelector('#status'),count=main.querySelector('#count'),actions=count.parentElement;
 const row=document.createElement('div');row.className='tool-actions control-status-row';status.before(row);
 const bar=document.createElement('div');bar.className='notice control-status-bar';row.append(bar,actions);bar.append(status,count);
 const filename=main.querySelector('#filename');filename.classList.add('notice');filename.setAttribute('role','status');
 main.querySelector('.tool-export-row').classList.add('control-status-row');
}
