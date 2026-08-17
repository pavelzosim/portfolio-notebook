(() => {
  const section = document.querySelector('[data-vfx-section]');
  if (!section) return;

  const items = [...section.querySelectorAll('.vfx-loop')];
  const button = section.querySelector('[data-vfx-more]');
  const count = section.querySelector('[data-vfx-count]');
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const initialCount = 8;
  let visibleCount = initialCount;

  const activate = video => {
    if (!video.src) video.src = video.dataset.src;
    if (!reduceMotion) video.play().catch(() => {});
  };

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const video = entry.target;
      if (entry.isIntersecting) activate(video);
      else video.pause();
    });
  }, { rootMargin: '160px 0px', threshold: .15 });

  items.forEach(item => {
    const video = item.querySelector('video');
    observer.observe(video);
    const toggle = () => {
      if (!video.src) activate(video);
      else if (video.paused) video.play().catch(() => {});
      else video.pause();
    };
    video.addEventListener('click', toggle);
    video.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        toggle();
      }
    });
  });

  const render = () => {
    items.forEach((item, index) => { item.hidden = index >= visibleCount; });
    const shown = Math.min(visibleCount, items.length);
    count.textContent = `${String(shown).padStart(2, '0')} / ${String(items.length).padStart(2, '0')} loops visible`;
    button.hidden = shown >= items.length;
  };

  button.addEventListener('click', () => {
    visibleCount = items.length;
    render();
  });

  render();
})();
