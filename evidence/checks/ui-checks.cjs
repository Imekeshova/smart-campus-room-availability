const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM, VirtualConsole } = require(process.argv[3] || 'jsdom');

const root = path.resolve(process.argv[2] || 'final/dist');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const errors = [];
const consoleCapture = new VirtualConsole();
consoleCapture.on('jsdomError', err => errors.push(err.message));
const dom = new JSDOM(html, { url: 'http://localhost/', pretendToBeVisual: true,
  runScripts: 'outside-only', virtualConsole: consoleCapture });
const win = dom.window;
const doc = win.document;
const script = doc.querySelector('script[type="module"]').getAttribute('src');
win.eval(fs.readFileSync(path.join(root, script), 'utf8'));
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const textOf = element => element.textContent.trim().replace(/\s+/g, ' ');
const all = (root, selector) => Array.from(root.querySelectorAll(selector));
async function until(read) {
  const end = Date.now() + 3000;
  do {
    const value = read();
    if (value) return value;
    await delay(12);
  } while (Date.now() < end);
  throw new Error('DOM condition did not become true');
}

async function main() {
  const orion = await until(() => all(doc, 'button').find(b => textOf(b).includes('Orion Computer Lab')));
  orion.click();
  const section = await until(() => doc.querySelector('form')?.closest('section'));
  const findText = s => all(section, 'p').some(e => textOf(e) === s);
  const button = name => all(section, 'button').find(b => textOf(b) === name);
  const setter = Object.getOwnPropertyDescriptor(win.HTMLInputElement.prototype, 'value').set;
  async function fill(label, value) {
    const field = all(section, 'label').find(e => textOf(e.querySelector('span')) === label).querySelector('input');
    setter.call(field, value);
    field.dispatchEvent(new win.Event('input', { bubbles: true }));
    field.dispatchEvent(new win.Event('change', { bubbles: true }));
    await delay(15);
  }
  const cases = [
    ['overlap', '11:30', '12:30', '09:00', 'Unavailable',
      'Orion Computer Lab O-202 is booked during part of 11:30–12:30.'],
    ['touching endpoints', '12:00', '13:00', '09:00', 'Available',
      'Orion Computer Lab O-202 is free from 12:00–13:00.'],
    ['missing testing clock', '11:30', '12:30', '', 'Unavailable',
      'Orion Computer Lab O-202 cannot be checked because the current time is missing or invalid.'],
  ];
  const results = [];
  for (const [name, start, end, clock, verdict, reply] of cases) {
    await fill('Start time', start);
    await fill('End time', end);
    await fill('Current time (for testing)', clock);
    button('Check Availability').click();
    await until(() => findText(verdict));
    button('Explain availability').click();
    await until(() => findText(reply));
    assert.ok(findText(verdict));
    assert.equal(section.textContent.includes('Rule-based explanation:'), false);
    results.push({ name, start, end, clock, verdict, observedReply: reply });
    console.log(name + ': ' + verdict);
  }
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({
    actor: 'Codex', environment: 'jsdom 26.1.0, built React bundle, synthetic DOM',
    results, errors,
  }, null, 2));
}

main().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => win.close());
