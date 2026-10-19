const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..', 'styles');
test('supporting controls exclude disabled buttons from interactive states', () => {
  const css = fs.readFileSync(path.join(root, 'framework', 'quiet-controls.css'), 'utf8');
  for (const selector of css.matchAll(/([^{}]+)\{/g)) {
    if (/:(hover|focus-visible|active)\b/.test(selector[1])) {
      assert.match(selector[1], /:not\(:disabled\)/);
    }
  }
});
function files(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? files(file) : file.endsWith('.css') ? [file] : [];
  });
}
test('shared CSS does not use forced declarations', () => {
  for (const file of files(root)) {
    const css = fs.readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    assert.doesNotMatch(css, /!\s*important\b/i, path.relative(root, file));
  }
});
test('visually-hidden heading has one canonical definition', () => {
  const definitions = files(root).filter(file => /\.seo-heading\s*\{/.test(fs.readFileSync(file, 'utf8')));
  assert.deepEqual(definitions, [path.join(root, 'framework', 'accessibility.css')]);
});
test('all page entry points load the canonical navigation tokens', () => {
  function imports(file, seen = new Set()) {
    if (seen.has(file)) return seen;
    seen.add(file);
    const css = fs.readFileSync(file, 'utf8');
    for (const match of css.matchAll(/@import\s+url\(["']([^"']+)["']\)/g)) {
      if (/^https?:/.test(match[1])) continue;
      imports(path.resolve(path.dirname(file), match[1].split('?')[0]), seen);
    }
    return seen;
  }
  const tokens = path.join(root, 'theme', 'navigation-tokens.css');
  for (const entry of ['atlas.css', 'indexes.css', 'projects.css', 'posts.css', 'legacy-posts.css']) {
    assert.ok(imports(path.join(root, entry)).has(tokens), entry);
  }
  const definitions = files(root).filter(file => /--atlas-nav-hover\s*:/.test(fs.readFileSync(file, 'utf8')));
  assert.deepEqual(definitions, [tokens]);
});
