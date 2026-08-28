import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const guard = readFileSync(
  new URL('../supabase/migrations/20260809065000_iww_outbox_delivery_guard.sql', import.meta.url),
  'utf8',
);

test('outbox completion checks durable successful delivery evidence', () => {
  assert.match(guard, /from public\.iww_notification_deliveries d/i);
  assert.match(guard, /d\.submission_kind = v_submission_kind/i);
  assert.match(guard, /d\.submission_id = v_submission_id/i);
  assert.match(guard, /d\.channel = 'webhook'/i);
  assert.match(guard, /d\.status in \('sent', 'delivered'\)/i);
});

test('requested delivery without evidence requeues instead of claiming success', () => {
  assert.match(guard, /v_effective_delivered := p_delivered and v_delivery_evidence;/i);
  assert.match(guard, /when p_delivered and not v_delivery_evidence then 'delivery_evidence_missing'/i);
  assert.match(guard, /set status = 'queued'/i);
});

test('outbox completion audit records both requested and evidenced delivery state', () => {
  assert.match(guard, /'requestedDelivered', p_delivered/i);
  assert.match(guard, /'deliveryEvidence', v_delivery_evidence/i);
  assert.match(guard, /notification\.outbox_delivered/i);
  assert.match(guard, /notification\.outbox_retry/i);
});

test('delivery guard RPC remains service-role only', () => {
  assert.match(guard, /revoke all on function public\.iww_finish_notification_attempt[\s\S]*from public, anon, authenticated;/i);
  assert.match(guard, /grant execute on function public\.iww_finish_notification_attempt[\s\S]*to service_role;/i);
});
