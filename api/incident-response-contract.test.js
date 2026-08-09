import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const runbook = readFileSync(
  new URL('../ops/INCIDENT_RESPONSE_RUNBOOK.md', import.meta.url),
  'utf8',
);

test('incident response refuses invented statutory or contractual timelines', () => {
  assert.match(runbook, /does not invent statutory notification deadlines, contractual response SLAs/i);
  assert.match(runbook, /do not invent statutory notification deadlines/i);
});

test('credential compromise response requires rotation and old-key rejection evidence', () => {
  assert.match(runbook, /revoke\/rotate the affected provider credential or application secret/i);
  assert.match(runbook, /verify the previous value is rejected/i);
  assert.match(runbook, /Never create a temporary `VITE_\*` copy of a server secret/i);
});

test('data integrity response never redirects writes into GEM or GemAssist databases', () => {
  assert.match(runbook, /do not redirect writes into an unrelated GEM\/GemAssist database/i);
  assert.match(runbook, /restore_acceptance\.sql/i);
});

test('delivery incidents cannot be silenced by fabricating delivered state', () => {
  assert.match(runbook, /do not manually mark an outbox row delivered to silence the alert/i);
  assert.match(runbook, /never mark the email outbox delivered without the matching durable email delivery record/i);
});

test('incident evidence guidance minimizes unnecessary personal data duplication', () => {
  assert.match(runbook, /Avoid duplicating submission content or personal data into incident artifacts/i);
  assert.match(runbook, /stable submission\/reference ID is sufficient/i);
});

test('recovery requires readiness plus independent authorization routing and recovery checks', () => {
  assert.match(runbook, /A readiness 200 is supporting evidence, not the sole recovery decision/i);
  assert.match(runbook, /ordinary users cannot access staff APIs/i);
  assert.match(runbook, /public routing still gates unreviewed claims/i);
});
