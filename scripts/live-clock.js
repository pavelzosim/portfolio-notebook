(() => {
  const update = () => {
    const clocks = document.querySelectorAll('[data-clock]');
    if (!clocks.length) return;
    const utc3 = new Date(Date.now() + 3 * 3600000);
    const hh = String(utc3.getUTCHours()).padStart(2, '0');
    const mm = String(utc3.getUTCMinutes()).padStart(2, '0');
    const text = `${hh}:${mm}`;
    clocks.forEach((clock) => { clock.textContent = text; });
  };

  update();
  setInterval(update, 1000);
})();
