const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const source = fs.readFileSync(`${__dirname}/analytics.js`, 'utf8');

function page(href, consent = null, blockedStorage = false) {
  const scripts = [], banners = [], listeners = {};
  const element = () => ({ dataset: {}, setAttribute() {}, remove() {},
    querySelector(selector) { return { addEventListener(type, fn) { listeners[selector] = fn; } }; } });
  const document = {
    currentScript: { src: new URL('/scripts/analytics.js', href).href }, readyState: 'complete',
    head: { append(value) { scripts.push(value); } }, body: { append(value) { banners.push(value); } },
    createElement: element,
    querySelector(selector) { return selector.includes('googletagmanager') ? scripts[0] : null; },
    querySelectorAll() { return []; },
    addEventListener(type, fn) { listeners[type] = fn; }
  };
  const window = { location: new URL(href), setTimeout(fn) { fn(); },
    localStorage: { getItem() { if (blockedStorage) throw Error('blocked'); return consent; },
      setItem(key, value) { if (blockedStorage) throw Error('blocked'); consent = value; } } };
  const context = vm.createContext({ window, document, URL, URLSearchParams });
  const run = () => vm.runInContext(source, context);
  run();
  return { window, scripts, banners, listeners, run,
    click(href) { listeners.click?.({ target: { closest() { return { href }; } } }); },
    events() { return Array.from(window.dataLayer || [], args => Array.from(args)).filter(args => args[0] === 'event'); } };
}

test('only the production host may load analytics, including saved consent', () => {
  for (const url of ['http://localhost/', 'https://pavelzosim.github.io/', 'https://pavelzosim.com/',
      'http://www.pavelzosim.com/', 'https://www.pavelzosim.com/blog/style-guide/',
      'https://www.pavelzosim.com/content/templates/project-page.html']) {
    const p = page(url, 'granted');
    assert.equal(p.scripts.length, 0, url);
    assert.equal(p.banners.length, 0, url);
  }
});
test('denial and blocked storage never load Google or emit contact events', () => {
  for (const p of [page('https://www.pavelzosim.com/', 'denied'), page('https://www.pavelzosim.com/', null, true)]) {
    p.listeners['[data-analytics-accept]']?.();
    p.click('mailto:private@example.com');
    assert.equal(p.scripts.length, 0);
    assert.equal(p.events().length, 0);
  }
});
test('consent loads one tag and repeated loader execution does not duplicate handlers', () => {
  const p = page('https://www.pavelzosim.com/');
  assert.equal(p.scripts.length, 0);
  p.listeners['[data-analytics-accept]']();
  p.run();
  assert.equal(p.scripts.length, 1);
  assert.equal(p.window.dataLayer.filter(args => args[0] === 'config').length, 1);
});
test('local banner preview never loads analytics, even with saved consent', () => {
  for (const consent of [null, 'granted']) {
    const p = page('http://localhost/?analytics-preview=1', consent);
    p.listeners['[data-analytics-accept]']?.();
    assert.equal(p.scripts.length, 0);
  }
});
test('contact and CV events contain only intent labels; external PDF is not a CV conversion', () => {
  const p = page('https://www.pavelzosim.com/', 'granted');
  p.click('mailto:private@example.com?subject=secret');
  p.click('https://www.pavelzosim.com/public/documents/pavel-zosim-technical-artist-cv-2026.pdf?email=secret');
  p.click('https://other.example/public/documents/pavel-zosim-cv.pdf');
  assert.deepEqual(p.events().map(args => args[1]), ['contact_click', 'cv_download']);
  assert.doesNotMatch(JSON.stringify(p.events()), /private|secret|mailto|\.pdf/);
});
