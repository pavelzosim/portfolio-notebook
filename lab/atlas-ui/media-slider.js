export function setupMediaSliders(root){
 root.querySelectorAll('.project-slider').forEach(slider=>{
  if(slider.dataset.ready)return;slider.dataset.ready='true';
  const slides=[...slider.querySelectorAll('.project-media')];let active=0;
  if(!slides.length)return;
  slider.setAttribute('aria-label',slider.getAttribute('aria-label')||slider.closest('section').querySelector('h2').textContent+' — image gallery');
  const track=slider.querySelector('.project-slider-track');
  const show=index=>{active=(index+slides.length)%slides.length;slides.forEach((slide,i)=>{slide.hidden=track?false:i!==active;slide.inert=i!==active;slide.setAttribute('aria-hidden',String(i!==active));});if(track)track.style.transform=`translateX(${-active*100}%)`;const caption=slider.querySelector('.project-slider-caption');if(caption)caption.textContent=slides[active].dataset.caption||'';slider.querySelector('output').textContent=`${active+1} / ${slides.length}`;};
  slider.querySelectorAll('[data-prev],[data-next]').forEach(button=>button.disabled=slides.length<2);
  slider.querySelector('[data-prev]').addEventListener('click',()=>show(active-1));slider.querySelector('[data-next]').addEventListener('click',()=>show(active+1));
  slider.addEventListener('keydown',e=>{if(e.altKey||e.ctrlKey||e.metaKey||e.shiftKey)return;if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();show(active+(e.key==='ArrowLeft'?-1:1));}else if(e.key==='Home'||e.key==='End'){e.preventDefault();show(e.key==='Home'?0:slides.length-1);}});show(0);
 });
}
