const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const vm = require('node:vm');

function run(event, commands = []) {
  let handler;
  let destination;
  vm.runInNewContext(readFileSync(`${__dirname}/site-navigation.js`, 'utf8'), {
    document: {
      addEventListener: (_, callback) => { handler = callback; },
      querySelectorAll: () => commands.map(([key, href]) => ({ href, querySelector: () => ({ textContent: key }) }))
    },
    location: { assign: (value) => { destination = value; } }
  });
  handler({ preventDefault() {}, ...event });
  return destination;
}

test('keyboard follows visible footer destination including preview prefix', () => {
  assert.equal(run({ key: 'F3' }, [['F3', '/portfolio-notebook/projects/']]), '/portfolio-notebook/projects/');
  assert.equal(run({ key: 'F10' }, [['F10', '#top']]), '#top');
});
test('modified shortcuts and editing do not trigger navigation', () => {
  for (const modifier of ['ctrlKey', 'altKey', 'metaKey', 'shiftKey', 'defaultPrevented']) {
    assert.equal(run({ key: 'F3', [modifier]: true }), undefined);
  }
  assert.equal(run({ key: 'F3', target: { closest: () => ({}) } }), undefined);
});
test('unmapped keys are left to the browser', () => {
  assert.equal(run({ key: 'a' }), undefined);
});
