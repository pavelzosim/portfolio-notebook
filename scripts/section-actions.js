(() => {
  document.querySelectorAll('.section-split > a, .section-foot > a').forEach(link => {
    if (link.parentElement.classList.contains('section-action')) return;
    const wrapper = document.createElement('span');
    wrapper.className = 'section-action';
    link.parentNode.insertBefore(wrapper, link);
    wrapper.append(link);
  });
})();
