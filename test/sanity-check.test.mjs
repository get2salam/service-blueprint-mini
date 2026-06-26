import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { RULES, findIssues, formatReport } from '../bin/sanity-check.mjs';
import { createHandoffBrief, formatHandoffBrief } from '../bin/handoff-brief.mjs';

const baseline = {
  title: 'Discovery intake',
  state: 'Reliable',
  health: 7,
  owner: 'Founder',
  handoff: 'Discovery call -> scoped summary',
  ttv: 30,
};

test('clean blueprint reports no issues', () => {
  const issues = findIssues([baseline, { ...baseline, title: 'Second stage' }]);
  assert.equal(issues.length, 0);
  assert.match(formatReport(issues, 2), /OK — checked 2 stage\(s\)/);
});

test('fragile state with high health is flagged', () => {
  const issues = findIssues([{ ...baseline, state: 'Fragile', health: 9 }]);
  assert.deepEqual(issues.map((i) => i.rule), ['state-health-fragile-but-healthy']);
});

test('signature stage with low health is flagged', () => {
  const issues = findIssues([{ ...baseline, state: 'Signature', health: 4 }]);
  assert.deepEqual(issues.map((i) => i.rule), ['state-health-signature-but-weak']);
});

test('default owner and handoff placeholders are flagged together', () => {
  const issues = findIssues([{ ...baseline, owner: 'Owner', handoff: 'Stage handoff' }]);
  assert.deepEqual(issues.map((i) => i.rule).sort(), ['placeholder-handoff', 'placeholder-owner']);
});

test('time-to-value below 5 or above 480 minutes is flagged', () => {
  const issues = findIssues([{ ...baseline, ttv: 2 }, { ...baseline, ttv: 720 }]);
  assert.equal(issues.length, 2);
  assert.ok(issues.every((i) => i.rule === 'ttv-out-of-range'));
});

test('non-array input returns no issues without throwing', () => {
  assert.deepEqual(findIssues(null), []);
  assert.deepEqual(findIssues(undefined), []);
});

test('report lists every issue line', () => {
  const issues = findIssues([{ ...baseline, state: 'Fragile', health: 10, owner: 'Owner' }]);
  const report = formatReport(issues, 1);
  assert.match(report, /Found 2 calibration issue\(s\)/);
  assert.match(report, /state-health-fragile-but-healthy/);
  assert.match(report, /placeholder-owner/);
});

test('rule ids are unique', () => {
  const ids = RULES.map((rule) => rule.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('documented at-risk example demonstrates all expected review findings', async () => {
  const raw = await readFile(new URL('../examples/at-risk-blueprint.json', import.meta.url), 'utf8');
  const parsed = JSON.parse(raw);
  const issues = findIssues(parsed.items);

  assert.deepEqual(issues.map((issue) => issue.rule), [
    'state-health-fragile-but-healthy',
    'placeholder-owner',
    'placeholder-handoff',
    'ttv-out-of-range',
  ]);
});

test('handoff brief ranks risky delivery stages with concrete next actions', () => {
  const brief = createHandoffBrief([
    baseline,
    { ...baseline, title: 'Launch handoff', state: 'Fragile', health: 3, effort: 7, ttv: 180 },
    { ...baseline, title: 'Ownerless review', owner: 'Owner', health: 8 },
  ]);

  assert.equal(brief.length, 3);
  assert.match(brief[0], /^1\. Launch handoff — Repair reliability before scaling/);
  assert.match(brief[1], /Assign a named owner/);
});

test('handoff brief formatter labels the reviewed stage count', () => {
  const report = formatHandoffBrief(createHandoffBrief([baseline], 1), 1);
  assert.match(report, /Handoff readiness brief \(1 of 1 stage\(s\)\)/);
  assert.match(report, /Discovery intake/);
});
