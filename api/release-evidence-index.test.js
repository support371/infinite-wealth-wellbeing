import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const evidence = readFileSync(
  new URL('../ops/RELEASE_EVIDENCE_INDEX.md', import.meta.url),
  'utf8',
);

test('release evidence index covers every high-risk operating domain', () => {
  for (const heading of [
    'Safe public routing',
    'Public intake validation and durable acceptance',
    'Dedicated IWW database/Auth boundary',
    'Staff workflow notification reliability',
    'Transactional email',
    'Staff authentication, MFA, roles, and review governance',
    'Operational readiness and monitoring',
    'Abuse protection',
    'Backup, restore, retention, and deletion',
    'Incident response',
    'Legal, privacy, agreements, disclaimers, and public claims',
    'Payments',
    'Dependency/build/deployment reproducibility',
    'Accessibility, mobile, performance, and end-to-end release validation',
  ]) {
    assert.match(evidence, new RegExp(heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));
  }
});

test('evidence index never treats repository files alone as live verification', () => {
  assert.match(evidence, /Code or documentation alone is not launch evidence/i);
  assert.match(evidence, /A gate is not verified because a file exists/i);
});

test('evidence index preserves non-payment initial release boundary', () => {
  assert.match(evidence, /Payments[\s\S]*intentionally disabled/i);
  assert.match(evidence, /not required for the initial non-payment release candidate/i);
});

test('evidence index explicitly retains dependency reproducibility as unresolved work', () => {
  assert.match(evidence, /deterministic dependency resolution\/lockfile evidence/i);
  assert.match(evidence, /floating `latest` dependencies/i);
});
