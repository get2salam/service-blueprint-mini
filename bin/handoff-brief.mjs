#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { argv, exit, stdout } from 'node:process';

const PLACEHOLDER_OWNERS = new Set(['', 'Owner']);
const PLACEHOLDER_HANDOFFS = new Set(['', 'Current handoff or transition', 'Stage handoff']);
const STATE_RISK = new Map([
  ['Fragile', 12],
  ['Improving', 7],
  ['Reliable', 3],
  ['Signature', 1],
]);

function isPlaceholder(value, placeholders) {
  return placeholders.has(String(value ?? '').trim());
}

function actionFor(item) {
  if (isPlaceholder(item.owner, PLACEHOLDER_OWNERS)) return 'Assign a named owner';
  if (isPlaceholder(item.handoff, PLACEHOLDER_HANDOFFS)) return 'Write the real handoff';
  if (item.health <= 4) return 'Repair reliability before scaling';
  if (item.state === 'Fragile') return 'Stabilize this fragile step';
  if (item.ttv > 120) return 'Shorten the time-to-value path';
  return 'Protect and document the working pattern';
}

function riskScore(item) {
  const health = Number.isFinite(item.health) ? item.health : 5;
  const effort = Number.isFinite(item.effort) ? item.effort : 3;
  const ttv = Number.isFinite(item.ttv) ? item.ttv : 60;
  const placeholderPenalty =
    (isPlaceholder(item.owner, PLACEHOLDER_OWNERS) ? 8 : 0) +
    (isPlaceholder(item.handoff, PLACEHOLDER_HANDOFFS) ? 8 : 0);

  return Math.round(
    (11 - health) * 4 +
    effort * 2 +
    (STATE_RISK.get(item.state) ?? 6) +
    Math.max(0, ttv - 30) / 15 +
    placeholderPenalty,
  );
}

export function createHandoffBrief(items, limit = 3) {
  const stages = Array.isArray(items) ? items.filter((item) => item && typeof item === 'object') : [];
  if (!stages.length) return ['No service stages found. Export a blueprint with at least one item.'];

  return stages
    .map((item, index) => ({
      title: item.title || `Stage #${index + 1}`,
      owner: item.owner || 'Owner missing',
      handoff: item.handoff || 'Handoff missing',
      action: actionFor(item),
      risk: riskScore(item),
    }))
    .sort((a, b) => b.risk - a.risk || a.title.localeCompare(b.title))
    .slice(0, limit)
    .map((stage, index) => `${index + 1}. ${stage.title} — ${stage.action} (risk ${stage.risk}; owner: ${stage.owner}; handoff: ${stage.handoff})`);
}

export function formatHandoffBrief(lines, total) {
  return [`Handoff readiness brief (${Math.min(lines.length, total)} of ${total} stage(s))`, ...lines].join('\n');
}

async function main() {
  const path = argv[2];
  if (!path) {
    stdout.write('usage: handoff-brief.mjs <backup.json>\n');
    exit(2);
  }
  const raw = await readFile(path, 'utf8');
  const parsed = JSON.parse(raw);
  const items = Array.isArray(parsed?.items) ? parsed.items : [];
  stdout.write(`${formatHandoffBrief(createHandoffBrief(items), items.length)}\n`);
}

if (import.meta.url === `file://${argv[1]}`) {
  main().catch((error) => {
    stdout.write(`handoff-brief failed: ${error.message}\n`);
    exit(2);
  });
}
