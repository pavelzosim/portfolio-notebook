(() => {
  const shelf = document.querySelector('[data-gumroad-shelf]');
  if (!shelf) return;

  const slides = [...shelf.querySelectorAll('.gumroad-shelf__slide')];
  const prevButton = shelf.querySelector('[data-gumroad-prev]');
  const nextButton = shelf.querySelector('[data-gumroad-next]');
  const count = shelf.querySelector('[data-gumroad-count]');
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
})();
