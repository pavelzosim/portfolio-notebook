(() => {
  document.querySelectorAll('[data-gumroad-shelf], [data-online-tools-shelf]').forEach(shelf => {

  const slides = [...shelf.querySelectorAll('.gumroad-shelf__slide')];
  const prevButton = shelf.querySelector('[data-gumroad-prev], [data-online-prev]');
  const nextButton = shelf.querySelector('[data-gumroad-next], [data-online-next]');
  const count = shelf.querySelector('[data-gumroad-count], [data-online-count]');
  if (!slides.length || !prevButton || !nextButton || !count) return;

  let index = 0;

  const render = () => {
    slides.forEach((slide, slideIndex) => { slide.hidden = slideIndex !== index; });
    count.textContent = `${String(index + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')}`;
  };

  prevButton.addEventListener('click', () => {
    index = (index - 1 + slides.length) % slides.length;
    render();
  });

  nextButton.addEventListener('click', () => {
    index = (index + 1) % slides.length;
    render();
  });

  render();
  });
  const carousel = document.querySelector('[data-home-tools-slider]');
  if (!carousel) return;
  const cards = [...carousel.querySelectorAll('.browser-tool-feature')];
  if (!cards.length) return;
  let current = 0;
  let timer = null;
  const count = carousel.querySelector("[data-home-tools-count]");
  const show = () => { cards.forEach((card, i) => {
    card.hidden = i !== current;
    card.inert = i !== current;
  });
    if (count) count.textContent = `${String(current + 1).padStart(2, "0")} / ${String(cards.length).padStart(2, "0")}`;
  };
  const stop = () => { if (timer !== null) clearInterval(timer); timer = null; };
  const start = () => {
    stop();
    if (document.hidden || cards.length < 2) return;
    timer = setInterval(() => {
      // Keep a keyboard-focused link available until the visitor leaves it.
      if (cards[current].contains(document.activeElement)) return;
      current = (current + 1) % cards.length;
      show();
    }, 5000);
  };
  const move = direction => { current = (current + direction + cards.length) % cards.length; show(); start(); };
  carousel.querySelector('[data-home-tools-prev]')?.addEventListener('click', () => move(-1));
  carousel.querySelector('[data-home-tools-next]')?.addEventListener('click', () => move(1));
  show();
  start();
  document.addEventListener('visibilitychange', start);
  window.addEventListener('pagehide', stop);
  window.addEventListener('pageshow', start);
})();
