const {test}=require('node:test');
const assert=require('node:assert/strict');
const core=require('./sprite-sheet-core.js');
const frames=(count,width,height)=>Array.from({length:count},()=>({width,height}));
test('desktop reference: 35 frames reserve a 6 by 6 grid',()=>{
 const p=core.recommendations(frames(35,64,64))[0];
 assert.equal(p.columns,6);assert.equal(p.rows,6);assert.equal(p.emptySlots,1);
 assert.equal(p.rawWidth,384);assert.equal(p.potWidth,512);
 assert.equal(core.layout(frames(35,64,64),6).rows,6);
 // 5 frames distinguish reserved square rows from manual automatic rows.
 const square=core.recommendations(frames(5,4,6))[0];
 assert.equal(square.rows,3);assert.equal(core.layout(frames(5,4,6),3).rows,2);
});
test('mixed dimensions define shared cells independently',()=>{
 const p=core.layout([{width:10,height:4},{width:2,height:9},{width:4,height:4}],2);
 assert.deepEqual([p.cellWidth,p.cellHeight,p.rawWidth,p.rawHeight,p.emptySlots],[10,9,20,18,1]);
});
test('desktop reference: square POT rescale uses width-derived square',()=>{
 const p=core.layout(frames(3,3,5),2,'rescale',2);
 assert.deepEqual([p.rawWidth,p.rawHeight,p.width,p.height],[6,10,8,8]);
 assert.notEqual(p.scaleX,p.scaleY);
 const rectangular=core.layout(frames(6,3,5),3,'rescale');
 assert.deepEqual([rectangular.width,rectangular.height],[16,16]);
});
test('invalid settings and oversized canvases are refused',()=>{
 for(const value of [0,-1,1.5,NaN,513])assert.throws(()=>core.layout(frames(3,1,1),value));
 assert.throws(()=>core.layout([],1));assert.throws(()=>core.layout(frames(3,1,1),2,'unknown'));
 assert.throws(()=>core.layout(frames(3,1,1),2,'exact',1));
 assert.equal(core.safeSize(8193,1),false);assert.equal(core.safeSize(8192,8192),false);
 assert.equal(core.safeSize(4096,4096),true);
});
test('export names match desktop convention',()=>{
 const p=core.layout(frames(24,100,60),6,'rescale');
 assert.equal(core.filename(24,p,'rescale'),'sprite_sheet_024f_6x4_1024x256_potfit.png');
});
