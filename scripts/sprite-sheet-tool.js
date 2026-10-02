/* Image files are only decoded locally; no file data is sent to any endpoint. */
(() => {
  'use strict';
  const core=window.SpriteSheetCore, $=id=>document.getElementById(id);
  let frames=[], reservedRows=null, current=null, timer=null, animationIndex=0, busy=false, exporting=false, nextId=0;
  const status=message=>{$('status').textContent=message;};
  const natural=new Intl.Collator(undefined,{numeric:true,sensitivity:'base'});
  const canvasImage=(canvas)=>canvas;
  function stop(){clearInterval(timer);timer=null;$('play').textContent='play animation';}
  function paintAnimation(){
    if(!frames.length)return;
    const f=frames[animationIndex%frames.length],c=$('animation');
    c.width=current?.cellWidth??f.width;c.height=current?.cellHeight??f.height;
    const ctx=c.getContext('2d');ctx.imageSmoothingEnabled=false;
    ctx.drawImage(f.image,Math.floor((c.width-f.width)/2),Math.floor((c.height-f.height)/2));
    $('animation-caption').textContent=`Frame ${animationIndex+1} / ${frames.length}: ${f.name}`;
  }
  function lock(){
    ['files','folder','demo','sort','clear','columns','mode','delay'].forEach(id=>$(id).disabled=busy||exporting);
    ['sort','clear'].forEach(id=>$(id).disabled=busy||exporting||!frames.length);
    $('play').disabled=busy||exporting||!current;
    $('download').disabled=busy||exporting||!current;
    $('frames').querySelectorAll('button').forEach(b=>b.disabled=busy||exporting||b.dataset.boundary==='true');
    $('presets').querySelectorAll('button').forEach(b=>b.disabled=busy||exporting);
  }
  function move(from,to){
    if(busy||exporting||to<0||to>=frames.length)return;
    frames.splice(to,0,frames.splice(from,1)[0]); update();
    $('frames').children[to]?.querySelector('button')?.focus();
  }
  function showFrames(){
    const list=$('frames');list.replaceChildren();
    frames.forEach((f,i)=>{
      const li=document.createElement('li');li.draggable=true;li.dataset.id=f.id;
      const thumbnail=document.createElement('canvas');thumbnail.width=64;thumbnail.height=64;thumbnail.setAttribute('aria-hidden','true');
      const scale=Math.min(64/f.width,64/f.height);const ctx=thumbnail.getContext('2d');ctx.imageSmoothingEnabled=false;ctx.drawImage(f.image,(64-f.width*scale)/2,(64-f.height*scale)/2,f.width*scale,f.height*scale);
      const text=document.createElement('span');text.textContent=`${String(i+1).padStart(3,'0')} · ${f.name} · ${f.width} × ${f.height}${f.empty?' · EMPTY FRAME':''}`;
      const actions=document.createElement('div');actions.className='frame-actions';
      [['↑','Move up',()=>move(i,i-1),i===0],['↓','Move down',()=>move(i,i+1),i===frames.length-1],['×','Remove',()=>{if(busy||exporting)return;release(f);frames.splice(i,1);reservedRows=null;update();status('Frame removed.');},false]].forEach(([label,title,action,boundary])=>{
        const b=document.createElement('button');b.type='button';b.textContent=label;b.setAttribute('aria-label',`${title}: ${f.name}`);b.dataset.boundary=String(boundary);b.addEventListener('click',action);actions.append(b);
      });
      li.append(thumbnail,text,actions);
      li.addEventListener('dragstart',e=>{if(busy||exporting){e.preventDefault();return;}e.dataTransfer.setData('text/plain',f.id);});
      li.addEventListener('dragover',e=>e.preventDefault());
      li.addEventListener('drop',e=>{e.preventDefault();e.stopPropagation();const from=frames.findIndex(x=>String(x.id)===e.dataTransfer.getData('text/plain'));if(from>=0)move(from,i);});
      list.append(li);
    });
  }
  function release(f){if(f.image?.close)f.image.close();else if(f.image instanceof HTMLImageElement)f.image.src='';else f.image.width=f.image.height=1;}
  function update(){
    stop();animationIndex=0;current=null;
    $('count').textContent=`${frames.length} frames`;showFrames();$('presets').replaceChildren();$('warning').textContent='';
    if(!frames.length){$('sheet').width=$('sheet').height=$('animation').width=$('animation').height=1;$('dimensions').textContent='No frames loaded.';$('filename').textContent='Add frames to generate a filename.';$('animation-caption').textContent='Animation / paused';lock();return;}
    core.recommendations(frames).forEach(p=>{
      const b=document.createElement('button');b.type='button';b.className='atlas-btn atlas-btn--quiet';b.textContent=`${p.label}: ${p.columns} × ${p.rows}`;
      b.classList.toggle('preset-selected',Number($('columns').value)===p.columns && (reservedRows??Math.ceil(frames.length/p.columns))===p.rows);
      b.title=`${p.emptySlots} empty slots; POT allocation ${p.potWidth} × ${p.potHeight}; ${p.utilization.toFixed(1)}% utilization`;
      b.addEventListener('click',()=>{$('columns').value=p.columns;reservedRows=p.rows;update();});$('presets').append(b);
    });
    try{
      const p=core.layout(frames,Number($('columns').value),$('mode').value,reservedRows);
      core.render(frames,p,$('sheet'));current=p;
      $('dimensions').textContent=`${frames.length} frames · ${p.columns} × ${p.rows} grid · ${p.cellWidth} × ${p.cellHeight} cells · ${p.emptySlots} unused slots. RAW ${p.rawWidth} × ${p.rawHeight} → OUTPUT ${p.width} × ${p.height}`;
      $('sheet-caption').textContent=`Sheet / ${p.width} × ${p.height} pixels`;
      $('filename').textContent=core.filename(frames.length,p,$('mode').value);
      if($('mode').value==='rescale')$('warning').textContent=`Artwork rescaled: X ${(p.scaleX*100).toFixed(1)}%, Y ${(p.scaleY*100).toFixed(1)}%. ${Math.abs(p.scaleX-p.scaleY)>0.00001?'Distortion: X and Y scales differ.':'Source pixel dimensions may change.'}`;
    }catch(e){$('warning').textContent=e.message;$('dimensions').textContent='Choose a valid, smaller layout to export.';$('filename').textContent='Export unavailable.';$('sheet').width=$('sheet').height=1;}
    paintAnimation();lock();
  }
  async function decode(file){
    const url=URL.createObjectURL(file);
    try{
      const img=new Image();img.src=url;await img.decode();
      if(!core.safeSize(img.naturalWidth,img.naturalHeight))throw new Error('image dimensions exceed the browser limit');
      const f={id:String(++nextId),name:file.name,width:img.naturalWidth,height:img.naturalHeight,image:img,bytes:file.size};
      const totalPixels=frames.reduce((n,x)=>n+x.width*x.height,0)+f.width*f.height;
      if(totalPixels>core.LIMITS.pixels)throw new Error('decoded image memory limit reached');
      const scratch=document.createElement('canvas');scratch.width=f.width;scratch.height=f.height;
      const ctx=scratch.getContext('2d',{willReadFrequently:true});ctx.drawImage(img,0,0);const pixels=ctx.getImageData(0,0,f.width,f.height).data;
      f.empty=true;for(let i=3;i<pixels.length;i+=4)if(pixels[i]){f.empty=false;break;}
      scratch.width=scratch.height=1;return f;
    }finally{URL.revokeObjectURL(url);}
  }
  async function addFiles(files){
    if(busy||exporting)return;busy=true;stop();lock();const rejected=[];let added=0;
    const ordered=[...files].sort((a,b)=>natural.compare(a.webkitRelativePath||a.name,b.webkitRelativePath||b.name));
    try{
      for(const file of ordered){
        if(!/\.(png|jpe?g)$/i.test(file.name)){rejected.push(`${file.name}: PNG/JPEG only`);continue;}
        if(frames.length>=core.LIMITS.frames||frames.reduce((n,f)=>n+(f.bytes||0),0)+file.size>core.LIMITS.bytes){rejected.push(`${file.name}: source limit reached`);continue;}
        status(`Reading ${file.name} locally…`);
        try{frames.push(await decode(file));added++;}catch(e){rejected.push(`${file.name}: ${e.message}`);}
      }
      if(added){reservedRows=null;$('columns').value=Math.ceil(Math.sqrt(frames.length));}
    }finally{busy=false;update();status(`${added} frames added.${rejected.length?' Skipped '+rejected.length+': '+rejected.slice(0,4).join('; '):''}`);}
  }
  ['files','folder'].forEach(id=>$(id).addEventListener('change',async e=>{await addFiles(e.target.files);e.target.value='';}));
  $('dropzone').addEventListener('dragover',e=>{e.preventDefault();$('dropzone').classList.add('is-dragging');});
  $('dropzone').addEventListener('dragleave',()=>$('dropzone').classList.remove('is-dragging'));
  $('dropzone').addEventListener('drop',e=>{e.preventDefault();$('dropzone').classList.remove('is-dragging');addFiles(e.dataTransfer.files);});
  $('sort').addEventListener('click',()=>{frames.sort((a,b)=>natural.compare(a.name,b.name));update();status('Frames sorted by natural filename order.');});
  $('clear').addEventListener('click',()=>{stop();frames.forEach(release);frames=[];reservedRows=null;update();status('All frames cleared.');});
  $('columns').addEventListener('input',()=>{reservedRows=null;update();});$('mode').addEventListener('change',update);
  $('play').addEventListener('click',()=>{
    if(timer){stop();return;}const delay=Number($('delay').value);
    if(!Number.isInteger(delay)||delay<40||delay>2000){status('Frame delay must be a whole number from 40 to 2000 ms.');return;}
    $('play').textContent='pause animation';timer=setInterval(()=>{animationIndex=(animationIndex+1)%frames.length;paintAnimation();},delay);
  });
  $('delay').addEventListener('input',stop);document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
  $('demo').addEventListener('click',()=>{
    frames.forEach(release);frames=[];
    for(let i=0;i<8;i++){
      const c=document.createElement('canvas');c.width=c.height=64;const ctx=c.getContext('2d');
      // A pixel-art burst makes the example useful for inspecting animation and alpha.
      const radius=4+i*3, size=Math.max(2,8-i);ctx.fillStyle='#0000aa';ctx.globalAlpha=1-i/10;
      for(let ray=0;ray<8;ray++){const angle=ray*Math.PI/4;const x=Math.round(32+Math.cos(angle)*radius-size/2),y=Math.round(32+Math.sin(angle)*radius-size/2);ctx.fillRect(x,y,size,size);}
      ctx.globalAlpha=1;ctx.fillStyle='#008181';const center=Math.max(0,12-i*2);ctx.fillRect(32-center/2,32-center/2,center,center);
      frames.push({id:String(++nextId),name:`demo_${String(i+1).padStart(2,'0')}.png`,width:64,height:64,image:canvasImage(c),empty:false,bytes:0});
    }
    $('columns').value=3;reservedRows=3;update();status('Demo loaded. Replace it by clearing frames, then add your own sequence.');
  });
  $('download').addEventListener('click',()=>{
    if(!current||busy||exporting)return;exporting=true;stop();lock();const name=core.filename(frames.length,current,$('mode').value);
    try{$('sheet').toBlob(blob=>{
      try{if(!blob)throw new Error('Browser could not encode the PNG. Try a smaller sheet.');const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);status(`PNG download ready: ${name}`);}
      catch(e){status(e.message);}finally{exporting=false;lock();}
    },'image/png');}catch(e){exporting=false;lock();status(e.message);}
  });
  update();
})();
