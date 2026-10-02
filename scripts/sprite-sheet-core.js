/* Browser port of Pavel Zosim's MIT-licensed sprite-sheet assembly algorithms. */
(function (root) {
  'use strict';
  const LIMITS = { frames: 512, bytes: 256 * 1024 * 1024, pixels: 32 * 1024 * 1024, side: 8192 };
  const nextPOT = value => 2 ** Math.ceil(Math.log2(Math.max(1, value)));
  function layout(frames, columns, mode = 'exact', reservedRows = null) {
    if (!frames.length) throw new Error('Add at least one frame.');
    if (!Number.isInteger(columns) || columns < 1 || columns > LIMITS.frames) throw new Error('Columns must be a whole number from 1 to 512.');
    if (!['exact', 'rescale'].includes(mode)) throw new Error('Unknown canvas mode.');
    columns = Math.min(columns, frames.length);
    const minimumRows = Math.ceil(frames.length / columns);
    const rows = reservedRows ?? minimumRows;
    if (!Number.isInteger(rows) || rows < minimumRows) throw new Error('Not enough rows for these frames.');
    const cellWidth = Math.max(...frames.map(f => f.width));
    const cellHeight = Math.max(...frames.map(f => f.height));
    const rawWidth = columns * cellWidth, rawHeight = rows * cellHeight;
    const width = mode === 'rescale' ? nextPOT(rawWidth) : rawWidth;
    const height = mode === 'rescale' ? (columns === rows ? width : nextPOT(rawHeight)) : rawHeight;
    return { columns, rows, cellWidth, cellHeight, rawWidth, rawHeight, width, height, emptySlots: columns * rows - frames.length, scaleX: width / rawWidth, scaleY: height / rawHeight };
  }
  function safeSize(width, height) {
    return width > 0 && height > 0 && width <= LIMITS.side && height <= LIMITS.side && width * height <= LIMITS.pixels;
  }
  function recommendations(frames) {
    if (!frames.length) return [];
    const candidates = Array.from({length:frames.length}, (_, i) => layout(frames, i + 1));
    const potScore = p => [nextPOT(p.rawWidth) * nextPOT(p.rawHeight), p.emptySlots, Math.abs(Math.log2(nextPOT(p.rawWidth) / nextPOT(p.rawHeight)))];
    const compare = (a,b) => { const x=potScore(a),y=potScore(b); return x[0]-y[0] || x[1]-y[1] || x[2]-y[2]; };
    const ranked = [...candidates].sort(compare);
    const side = Math.ceil(Math.sqrt(frames.length));
    const square = layout(frames, side, 'exact', side);
    const balanced = layout(frames, Math.min(frames.length, Math.max(1, Math.ceil(Math.sqrt(frames.length * square.cellHeight / square.cellWidth)))));
    const exact = candidates.filter(p => !p.emptySlots).sort((a,b)=>Math.abs(Math.log(a.rawWidth/a.rawHeight))-Math.abs(Math.log(b.rawWidth/b.rawHeight)))[0];
    const picks = [['Nearest square',square],['Best POT memory',ranked[0]],['Pixel balanced',balanced],['Exact frame fit',exact],...ranked.map(p=>['POT alternative',p])];
    const seen=new Set();
    return picks.filter(([,p])=>{const key=`${p.columns}x${p.rows}`; if(seen.has(key))return false;seen.add(key);return true;}).slice(0,4).map(([label,p])=>({...p,label,potWidth:nextPOT(p.rawWidth),potHeight:nextPOT(p.rawHeight),utilization:100*frames.length*p.cellWidth*p.cellHeight/(nextPOT(p.rawWidth)*nextPOT(p.rawHeight))}));
  }
  function render(frames, p, output, canvasFactory = () => document.createElement('canvas')) {
    if (!safeSize(p.rawWidth,p.rawHeight) || !safeSize(p.width,p.height)) throw new Error('This layout exceeds the browser canvas limit. Use fewer columns, smaller frames, or the desktop tool.');
    const raw=canvasFactory(); raw.width=p.rawWidth; raw.height=p.rawHeight;
    const ctx=raw.getContext('2d'); if(!ctx)throw new Error('Canvas is unavailable.');
    frames.forEach((f,i)=>ctx.drawImage(f.image,(i%p.columns)*p.cellWidth+Math.floor((p.cellWidth-f.width)/2),Math.floor(i/p.columns)*p.cellHeight+Math.floor((p.cellHeight-f.height)/2)));
    output.width=p.width; output.height=p.height;
    const out=output.getContext('2d'); if(!out)throw new Error('Canvas is unavailable.');
    out.imageSmoothingEnabled=false; out.drawImage(raw,0,0,p.width,p.height);
    raw.width=raw.height=1;
  }
  const filename = (count,p,mode) => `sprite_sheet_${String(count).padStart(3,'0')}f_${p.columns}x${p.rows}_${p.width}x${p.height}_${mode==='rescale'?'potfit':'exact'}.png`;
  const api={LIMITS,nextPOT,layout,safeSize,recommendations,render,filename};
  root.SpriteSheetCore=api;
  if(typeof module!=='undefined')module.exports=api;
})(typeof globalThis==='undefined'?window:globalThis);
