// The shared engineering-diagram face; all colors come from Atlas tokens.
const safe=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function occupancy(used,capacity){
 const ratio=capacity?used/capacity:0;
 return {used,capacity,percent:Math.round(ratio*1000)/10,band:ratio>=.75?'dense':ratio>=.5?'mixed':'sparse'};
}
const tint={dense:'var(--note-success)',mixed:'var(--note-warning)',sparse:'var(--note-important)'};
export function memoryRowOccupancy(layout,{startRow=0,rowCount=16}={}){
 const count=Math.min(rowCount,Math.ceil(layout.span/16)-startRow),result=[];let index=0;
 while(index<layout.segments.length&&layout.segments[index].offset+layout.segments[index].size<=startRow*16)index++;
 for(let row=0;row<count;row++){
  const start=(startRow+row)*16,end=Math.min(start+16,layout.span);let used=0;
  while(index<layout.segments.length&&layout.segments[index].offset+layout.segments[index].size<=start)index++;
  for(let i=index;i<layout.segments.length&&layout.segments[i].offset<end;i++)used+=Math.max(0,Math.min(end,layout.segments[i].offset+layout.segments[i].size)-Math.max(start,layout.segments[i].offset));
  result.push({offset:start,...occupancy(used,end-start)});
 }
 return result;
}
export function memoryDiagram(layout,{startRow=0,rowCount=16,selected='',id='memory'}={}){
 const usage=memoryRowOccupancy(layout,{startRow,rowCount}),rows=usage.length,w=760,h=84+rows*36,total=occupancy(layout.payload,layout.span);
 const parts=[`<div class="atlas-uml-diag" data-occupancy="${total.percent}" data-density="${total.band}"><div class="atlas-uml-diag__header">[ BYTE MAP / 16 BYTES PER DISPLAY ROW · ${total.percent}% DATA ]</div><svg viewBox="0 0 ${w} ${h}" role="img" aria-label="Byte layout from offset ${startRow*16}; ${total.percent}% of the whole layout contains data. Row tints: green dense at least 75%, yellow mixed 50 to below 75%, red sparse below 50%. Hatched cells are padding. Colors describe occupancy, not removable padding or shader speed. Inspect exact byte offsets with the controls below."><defs><pattern id="${safe(id)}-padding" width="6" height="6" patternUnits="userSpaceOnUse"><path d="M-1 1L1-1M0 6L6 0M5 7L7 5" stroke="var(--line)" fill="none"/></pattern></defs>`];
 for(let b=0;b<16;b++)parts.push(`<text x="${100+b*40}" y="20" text-anchor="middle">+${b}</text>`);
 let segmentIndex=0;while(segmentIndex<layout.segments.length&&layout.segments[segmentIndex].offset+layout.segments[segmentIndex].size<=startRow*16)segmentIndex++;
 for(let row=0;row<rows;row++){
  const base=(startRow+row)*16,y=32+row*36,density=usage[row],color=tint[density.band];parts.push(`<g data-memory-row="${base}" data-density="${density.band}" data-occupancy="${density.percent}"><title>Row ${base}: ${density.used} of ${density.capacity} bytes contain data · ${density.percent}% · ${density.band}. Padding may be required by layout rules.</title><rect x="8" y="${y}" width="64" height="28" fill="${color}"/><text x="68" y="${y+19}" text-anchor="end">${base}</text>`);
  for(let b=0;b<16;b++){
   const offset=base+b;if(offset>=layout.span)continue;
   while(segmentIndex<layout.segments.length&&layout.segments[segmentIndex].offset+layout.segments[segmentIndex].size<=offset)segmentIndex++;
   const candidate=layout.segments[segmentIndex],segment=candidate?.offset<=offset?candidate:null,active=segment&&segment.root===selected;
   const fill=segment?(active?'var(--selected)':color):`url(#${safe(id)}-padding)`;
   const title=(segment?`Byte ${offset}: ${segment.path} · ${segment.type} · component ${segment.size} B at ${segment.offset}`:`Byte ${offset}: padding`)+` · row ${density.percent}% data (${density.band})`;
   const index=segment?layout.rows.findIndex(f=>f.name===segment.root):-1,letter=index>=0?String(index+1):'·';
   parts.push(`<g data-byte="${offset}"><title>${safe(title)}</title><rect x="${80+b*40}" y="${y}" width="40" height="28" fill="${fill}" stroke="${active?'var(--blue)':'var(--line)'}"/><text x="${100+b*40}" y="${y+19}" text-anchor="middle">${segment?letter:'·'}</text></g>`);
  }
  parts.push('</g>');
 }
 const legendY=rows*36+42;
 for(const [i,[band,label]]of [['dense','Dense ≥75%'],['mixed','Mixed 50–<75%'],['sparse','Sparse <50%']].entries())parts.push(`<rect x="${80+i*220}" y="${legendY}" width="14" height="14" fill="${tint[band]}" stroke="var(--line)"/><text x="${102+i*220}" y="${legendY+12}">${safe(label)}</text>`);
 parts.push('</svg></div>');return parts.join('');
}
