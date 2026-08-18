(() => {
  const parameterPanel = document.querySelector('.atlas-shader-panel');
  const exposure = parameterPanel?.querySelector('.atlas-sp-slider');
  const exposureValue = parameterPanel?.querySelector('.atlas-sp-value');

  if (exposure && exposureValue) {
    const syncExposure = () => {
      exposureValue.value = Number(exposure.value).toFixed(2);
      parameterPanel.style.setProperty('--guide-exposure', exposure.value);
    };
    exposure.addEventListener('input', syncExposure);
    syncExposure();
  }

  document.querySelectorAll('[data-image-slider]').forEach((slider) => {
    const slides = [...slider.querySelectorAll('[data-slider-slide]')];
    const previous = slider.querySelector('[data-slider-prev]');
    const next = slider.querySelector('[data-slider-next]');
    const status = slider.querySelector('[data-slider-status]');
    let index = 0;

    const render = () => {
      slides.forEach((slide, slideIndex) => {
        slide.hidden = slideIndex !== index;
      });
      if (status) {
        status.value = `${String(index + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')}`;
      }
    };

    previous?.addEventListener('click', () => {
      index = (index - 1 + slides.length) % slides.length;
      render();
    });
    next?.addEventListener('click', () => {
      index = (index + 1) % slides.length;
      render();
    });
    render();
  });

  if (window.Prism) {
    document.querySelectorAll('pre.atlas-code-block code[class*="language-"]').forEach((code) => {
      window.Prism.highlightElement(code);
    });
  }
})();
