#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { argv, exit, stdout } from 'node:process';
import { sanitizeForDisplay } from './text-safety.mjs';

const PLACEHOLDER_OWNERS = new Set(['', 'Owner']);
const PLACEHOLDER_HANDOFFS = new Set(['', 'Current handoff or transition', 'Stage handoff']);

export const RULES = [
  {
    id: 'state-health-fragile-but-healthy',
    describe: (item) => `state "Fragile" but health ${item.health}/10 — pick one signal`,
    test: (item) => item.state === 'Fragile' && item.health >= 8,
  },
  {
    id: 'state-health-signature-but-weak',
    describe: (item) => `state "Signature" but health ${item.health}/10 — flagship stage looks shaky`,
    test: (item) => item.state === 'Signature' && item.health <= 5,
  },
  {
    id: 'placeholder-owner',
    describe: () => 'owner still set to the default placeholder',
    test: (item) => PLACEHOLDER_OWNERS.has(String(item.owner ?? '').trim()),
  },
  {
    id: 'placeholder-handoff',
    describe: () => 'handoff still set to the default placeholder',
    test: (item) => PLACEHOLDER_HANDOFFS.has(String(item.handoff ?? '').trim()),
  },
  {
    id: 'ttv-out-of-range',
    describe: (item) => `time-to-value ${item.ttv} min is outside the plausible 5..480 window`,
    test: (item) => Number.isFinite(item.ttv) && (item.ttv < 5 || item.ttv > 480),
  },
];

export function findIssues(items, rules = RULES) {
  const list = Array.isArray(items) ? items : [];
  const issues = [];
  list.forEach((item, index) => {
    if (!item || typeof item !== 'object') return;
    const title = sanitizeForDisplay(item.title) || `Stage #${index + 1}`;
    for (const rule of rules) {
      if (rule.test(item)) {
        issues.push({ index, title, rule: rule.id, message: rule.describe(item) });
      }
    }
  });
  return issues;
}

export function formatReport(issues, total) {
  if (!issues.length) return `OK — checked ${total} stage(s), no calibration conflicts found.`;
  const lines = [`Found ${issues.length} calibration issue(s) across ${total} stage(s):`];
  for (const issue of issues) lines.push(`  - [${issue.rule}] ${issue.title}: ${issue.message}`);
  return lines.join('\n');
}

async function main() {
  const path = argv[2];
  if (!path) {
    stdout.write('usage: sanity-check.mjs <backup.json>\n');
    exit(2);
  }
  const raw = await readFile(path, 'utf8');
  const parsed = JSON.parse(raw);
  const items = Array.isArray(parsed?.items) ? parsed.items : [];
  const issues = findIssues(items);
  stdout.write(`${formatReport(issues, items.length)}\n`);
  exit(issues.length ? 1 : 0);
}

if (import.meta.url === `file://${argv[1]}`) {
  main().catch((error) => {
    stdout.write(`sanity-check failed: ${error.message}\n`);
    exit(2);
  });
}
