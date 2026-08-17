(() => {
  const routes = {
    F2: '/',
    F3: '/projects/',
    F4: '/#notes',
    F5: '/tools/',
    F6: '/blog/',
    F7: '/#about',
    F8: '/#contacts'
  };

  document.addEventListener('keydown', (event) => {
    if (event.key === 'F10') {
      event.preventDefault();
      document.querySelector('#content')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    if (!routes[event.key]) return;
    event.preventDefault();
    location.assign(routes[event.key]);
  });
})();
