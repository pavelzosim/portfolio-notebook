document.querySelectorAll('.address-hero[data-slider]').forEach((slider) => {
  const slides = [...slider.querySelectorAll('[data-slide]')];
  const label = slider.querySelector('[data-slider-label]');
  let index = 0;
  const render = () => {
    slides.forEach((slide, i) => { slide.hidden = i !== index; });
    label.textContent = `${index + 1} / ${slides.length} — ${slides[index].dataset.caption}`;
  };
  slider.querySelector('[data-slider-prev]').addEventListener('click', () => {
    index = (index - 1 + slides.length) % slides.length;
    render();
  });
  slider.querySelector('[data-slider-next]').addEventListener('click', () => {
    index = (index + 1) % slides.length;
    render();
  });
  render();
});
