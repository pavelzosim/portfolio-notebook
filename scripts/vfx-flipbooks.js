(() => {
  const section = document.querySelector('[data-vfx-section]');
  if (!section) return;

  const items = [...section.querySelectorAll('.vfx-loop')];
  const button = section.querySelector('[data-vfx-more]');
  const count = section.querySelector('[data-vfx-count]');
  const visibleVideos = new Set();
  const manuallyPaused = new WeakSet();
  const initialCount = 8;
  let visibleCount = initialCount;

  const activate = video => {
    video.muted = true;
    video.defaultMuted = true;
    video.loop = true;
    video.playsInline = true;
    if (!video.src) video.src = video.dataset.src;
    if (!document.hidden && !manuallyPaused.has(video)) {
      video.play().catch(() => { video.controls = true; });
    }
  };

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const video = entry.target;
      if (entry.isIntersecting) {
        visibleVideos.add(video);
        activate(video);
      } else {
        visibleVideos.delete(video);
        video.pause();
      }
    });
  }, { threshold: .15 });

  document.addEventListener('visibilitychange', () => {
    visibleVideos.forEach(video => document.hidden ? video.pause() : activate(video));
  });

  items.forEach(item => {
    const video = item.querySelector('video');
    if (!video) return;
    observer.observe(video);
    const toggle = () => {
      if (video.paused) {
        manuallyPaused.delete(video);
        activate(video);
      } else {
        manuallyPaused.add(video);
        video.pause();
      }
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
