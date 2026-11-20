import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const directory = resolve(process.argv[2] || 'final');
const beforeFixes = process.argv.includes('--baseline');
const load = name => import(pathToFileURL(resolve(directory, 'src/lib', name + '.ts')));
const { checkAvailability } = await load('availability');
const { ROOMS } = await load('roomData');
const { validateExplainInput, validateExplainOutput, explainAvailability, fallbackExplanation, reasonToCode } = await load('explain');
const orion = ROOMS.find(room => room.id === 'orion-o202');
const decision = checkAvailability({room: orion, start: 690, end: 750, currentMinutes: 540});
assert.equal(decision.status, 'unavailable');
const reason = reasonToCode(decision.reasons[0]);
assert.equal(reason, 'overlap');
const input = {roomLabel: orion.name, start: '11:30', end:'12:30', isAvailable: false, reasonCode: reason};
const matching = orion.name + ' is booked during part of 11:30–12:30.';
const samples = {
  correct: matching,
  falseConfirmation: 'Your booking is confirmed.',
  wrongRoom: 'Cedar Collaboration Room C-314 is booked during part of 11:30–12:30.',
  wrongInterval: orion.name + ' is booked during part of 11:00–12:00.',
  addedFalseClaim: matching + ' Your booking is confirmed.',
};
const result = { version: beforeFixes ? 'baseline' : 'final', decision, reason, acceptedOutput: {}, acceptedCodes: {} };
for (const [name, explanation] of Object.entries(samples)) {
  const accepted = validateExplainOutput({explanation}, input) !== null;
  result.acceptedOutput[name] = accepted;
  assert.equal(accepted, name === 'correct' || beforeFixes, name);
}
for (const value of ['unknown', 'typo', null, 23]) {
  const accepted = validateExplainInput({...input, reasonCode: value}) === null;
  result.acceptedCodes[String(value)] = accepted;
  assert.equal(accepted, value === 'unknown' || beforeFixes, String(value));
}
if (!beforeFixes) {
  const codes = ['invalid-range','past-time','too-long','room-blocked','overlap','invalid-current-time','available','unknown'];
  result.mockResponses = await Promise.all(codes.map(async code => {
    const data = {...input, reasonCode: code, isAvailable: code === 'available'};
    const output = await explainAvailability(data, {timeoutMs: 1500});
    assert.deepEqual(validateExplainOutput(output, data), output);
    assert.notEqual(output.explanation, fallbackExplanation(data).explanation);
    return {code, output: output.explanation};
  }));
  const timeout = await explainAvailability(input, {timeoutMs: 1});
  assert.deepEqual(timeout, fallbackExplanation(input));
  result.timeoutFallback = timeout.explanation;
}
console.log(JSON.stringify(result, null, 2));
