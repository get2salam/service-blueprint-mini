import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeForDisplay } from '../bin/text-safety.mjs';

const ESC = String.fromCharCode(0x1b);
const CR = String.fromCharCode(0x0d);
const LF = String.fromCharCode(0x0a);
const BEL = String.fromCharCode(0x07);
const DEL = String.fromCharCode(0x7f);

test('strips ANSI escape sequences so terminal styling cannot be forged', () => {
  assert.equal(sanitizeForDisplay(`Discovery${ESC}[31m intake`), 'Discovery [31m intake');
});

test('strips newlines and carriage returns so fake report lines cannot be injected', () => {
  assert.equal(sanitizeForDisplay(`Real stage${LF}  - [fake-rule] Injected: not real${CR}`), 'Real stage   - [fake-rule] Injected: not real');
});

test('strips bell and DEL control bytes', () => {
  assert.equal(sanitizeForDisplay(`Alert${BEL}${DEL}bell`), 'Alert bell');
});

test('collapses a run of control characters into a single space', () => {
  assert.equal(sanitizeForDisplay(`a${LF}${CR}${LF}b`), 'a b');
});

test('trims leading and trailing whitespace after stripping', () => {
  assert.equal(sanitizeForDisplay(`${LF}  padded  ${LF}`), 'padded');
});

test('passes plain text through unchanged', () => {
  assert.equal(sanitizeForDisplay('Discovery call -> scoped summary'), 'Discovery call -> scoped summary');
});

test('coerces non-string values safely', () => {
  assert.equal(sanitizeForDisplay(42), '42');
  assert.equal(sanitizeForDisplay(null), '');
  assert.equal(sanitizeForDisplay(undefined), '');
});
