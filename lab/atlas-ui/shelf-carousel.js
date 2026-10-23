export function setupShelfCarousels(root){
 root.querySelectorAll('[data-gumroad-shelf],[data-online-tools-shelf]').forEach(shelf=>{
  if(shelf.dataset.carouselReady)return;shelf.dataset.carouselReady='true';
  const slides=[...shelf.querySelectorAll('.gumroad-shelf__slide')];if(!slides.length)return;
  const nav=shelf.querySelector('.gumroad-shelf__nav'),arrows=[...nav.querySelectorAll('button')],count=nav.querySelector('output');
  const interval=shelf.hasAttribute('data-online-tools-shelf')?5000:3000;let index=0,timer,previous=-1;
  const render=()=>{slides.forEach((slide,i)=>{slide.getAnimations().forEach(a=>a.cancel());slide.hidden=i!==index;slide.inert=i!==index;});if(previous>=0&&previous!==index&&!matchMedia('(prefers-reduced-motion: reduce)').matches){const outgoing=slides[previous];outgoing.hidden=false;outgoing.inert=true;const animation=outgoing.animate([{transform:'translateX(0)'},{transform:'translateX(-100%)'}],{duration:450,easing:'ease-in-out'});animation.onfinish=()=>{if(outgoing!==slides[index])outgoing.hidden=true;};slides[index].animate([{transform:'translateX(100%)'},{transform:'translateX(0)'}],{duration:450,easing:'ease-in-out'});}previous=index;if(count){count.textContent=`${index+1} / ${slides.length}`;count.setAttribute('aria-live','off');}};
  const sync=()=>{clearInterval(timer);if(!document.hidden&&!shelf.matches(':hover')&&!shelf.contains(document.activeElement)&&slides.length>1)timer=setInterval(()=>{index=(index+1)%slides.length;render();},interval);};
  arrows.forEach((button,i)=>button.addEventListener('click',()=>{index=(index+(i?1:-1)+slides.length)%slides.length;render();sync();}));
  shelf.addEventListener('mouseenter',sync);shelf.addEventListener('mouseleave',sync);shelf.addEventListener('focusin',sync);shelf.addEventListener('focusout',()=>queueMicrotask(sync));document.addEventListener('visibilitychange',sync);
  render();sync();
 });
}
