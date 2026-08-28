import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const migration = readFileSync(
  new URL('../supabase/migrations/20260809071000_iww_terminal_review_reason_guard.sql', import.meta.url),
  'utf8',
);

test('terminal review statuses require a non-empty reason in the database RPC', () => {
  assert.match(migration, /p_to_status in \('approved', 'rejected', 'spam', 'closed'\) and v_reason is null/i);
  assert.match(migration, /raise exception 'status_reason_required'/i);
});

test('review rationale is bounded before it is written to status and audit evidence', () => {
  assert.match(migration, /char_length\(v_reason\) > 1000/i);
  assert.match(migration, /raise exception 'status_reason_too_long'/i);
  assert.match(migration, /insert into public\.iww_submission_status_events[\s\S]*v_reason/i);
  assert.match(migration, /'reason', v_reason/i);
});

test('terminal reason guard preserves the explicit review state machine', () => {
  assert.match(migration, /received' and p_to_status in \('triaged', 'spam', 'closed'\)/i);
  assert.match(migration, /triaged' and p_to_status in \('in_review', 'spam', 'closed'\)/i);
  assert.match(migration, /in_review' and p_to_status in \('approved', 'rejected', 'closed'\)/i);
  assert.match(migration, /raise exception 'invalid_status_transition'/i);
});

test('transition RPC remains inaccessible to browser roles', () => {
  assert.match(
    migration,
    /revoke all on function public\.iww_transition_submission\(text, uuid, public\.iww_submission_status, uuid, text\) from public, anon, authenticated;/i,
  );
  assert.match(
    migration,
    /grant execute on function public\.iww_transition_submission\(text, uuid, public\.iww_submission_status, uuid, text\) to service_role;/i,
  );
});
