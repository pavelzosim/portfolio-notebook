// Shared table panel: title outside, locally scrollable inset table inside.
export function setupTableFrames(root){
 root.querySelectorAll('.atlas-table-frame--solid').forEach(frame=>{
  const table=frame.querySelector(':scope>table');if(!table)return;
  const body=document.createElement('div');body.className='atlas-table-body';table.before(body);body.append(table);
 });
}
