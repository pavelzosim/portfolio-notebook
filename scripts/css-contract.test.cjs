const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..', 'styles');
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
