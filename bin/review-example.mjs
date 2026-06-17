#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { stdout } from 'node:process';
import { findIssues, formatReport } from './sanity-check.mjs';

const fixtureUrl = new URL('../examples/at-risk-blueprint.json', import.meta.url);
const raw = await readFile(fixtureUrl, 'utf8');
const parsed = JSON.parse(raw);
const items = Array.isArray(parsed.items) ? parsed.items : [];
const issues = findIssues(items);

stdout.write('Reviewing examples/at-risk-blueprint.json\n');
stdout.write(`${formatReport(issues, items.length)}\n`);

if (issues.length !== 4) {
  throw new Error(`Expected the at-risk example to demonstrate 4 issues, found ${issues.length}.`);
}
