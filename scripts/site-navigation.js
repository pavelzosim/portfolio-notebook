(() => {
  const routes = {
    F2: '/',
    F3: '/projects/',
    F4: '/#notes',
    F5: '/tools/',
    F6: '/blog/',
    F7: '/#about',
    F8: '/#contacts',
    F9: '/online-tools/'
  };

  document.addEventListener('keydown', (event) => {
    if (event.defaultPrevented || event.ctrlKey || event.altKey || event.metaKey || event.shiftKey) return;
    if (event.target?.closest('input, textarea, select, [contenteditable="true"], dialog[open]')) return;
    // Follow the visible command, including any deployment base path.
    const command = [...document.querySelectorAll('.function-bar a')]
      .find((link) => link.querySelector('kbd')?.textContent.trim() === event.key);
    const destination = command?.href || routes[event.key];
    if (!destination) return;
    event.preventDefault();
    location.assign(destination);
  });
})();
