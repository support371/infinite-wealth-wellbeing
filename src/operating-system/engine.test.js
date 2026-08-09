import test from 'node:test';
import assert from 'node:assert/strict';
import {
  addQueueItem,
  addToIncubator,
  canPromoteFromIncubator,
  closeDay,
  completeWithEvidence,
  deferWithOverride,
  getRequiredAction,
  importState,
  isDayOpen,
  nextStageAfterCompletion,
  normalizeQueue,
  openDay,
  paceFromEnergy,
  promoteIncubatorItem,
  resetState,
  reviewPrinciple,
} from './engine.js';

const fixedDate = new Date('2026-08-09T08:00:00.000Z');

test('energy changes method pace without changing direction', () => {
  assert.equal(paceFromEnergy(1).label, 'minimum viable move');
  assert.equal(paceFromEnergy(3).label, 'standard execution');
  assert.equal(paceFromEnergy(5).label, 'high-capacity push');
});

test('only one NOW item can exist', () => {
  let state = resetState();
  state = addQueueItem(state, { title: 'First', stage: 'now', priority: 3 });
  state = addQueueItem(state, { title: 'Second', stage: 'now', priority: 5 });
  const open = normalizeQueue(state.queue);
  assert.equal(open.filter((item) => item.stage === 'now').length, 1);
  assert.equal(open.find((item) => item.title === 'Second').stage, 'next');
});

test('the daily gate must open before execution is presented', () => {
  let state = resetState();
  state = addQueueItem(state, { title: 'Ship release', stage: 'now' });
  assert.equal(getRequiredAction(state, fixedDate).kind, 'open-day');
  state = openDay(state, 'Protect the mission', fixedDate);
  assert.equal(isDayOpen(state, fixedDate), true);
  assert.equal(getRequiredAction(state, fixedDate).kind, 'execute');
});

test('completion requires evidence and promotes next work', () => {
  let state = resetState();
  state = addQueueItem(state, { title: 'First', stage: 'now' });
  state = addQueueItem(state, { title: 'Second', stage: 'next' });
  const first = normalizeQueue(state.queue)[0];
  const unchanged = completeWithEvidence(state, first.id, '');
  assert.equal(unchanged.evidence.length, 0);

  state = nextStageAfterCompletion(completeWithEvidence(state, first.id, 'tests passed'));
  assert.equal(state.evidence.length, 1);
  assert.equal(normalizeQueue(state.queue)[0].title, 'Second');
  assert.equal(normalizeQueue(state.queue)[0].stage, 'now');
});

test('override defers active work, records reason, and advances the queue', () => {
  let state = resetState();
  state = addQueueItem(state, { title: 'Primary', stage: 'now' });
  state = addQueueItem(state, { title: 'Secondary', stage: 'next' });
  const primary = normalizeQueue(state.queue)[0];

  state = deferWithOverride(state, primary.id, 'Environment became unsafe for this work');
  assert.equal(state.overrides.length, 1);
  assert.equal(state.overrides[0].reason, 'Environment became unsafe for this work');
  assert.equal(state.queue.find((item) => item.id === primary.id).stage, 'later');
  assert.equal(normalizeQueue(state.queue)[0].title, 'Secondary');
  assert.equal(normalizeQueue(state.queue)[0].stage, 'now');
});

test('exploration cannot jump an active mission', () => {
  let state = resetState();
  state = addQueueItem(state, { title: 'Active mission', stage: 'now' });
  state = addToIncubator(state, 'New shiny idea', 'Potential future value');
  const idea = state.incubator[0];
  assert.equal(canPromoteFromIncubator(state), false);
  const blocked = promoteIncubatorItem(state, idea.id);
  assert.equal(blocked.incubator.length, 1);
  assert.equal(normalizeQueue(blocked.queue).length, 1);
});

test('closing a day creates continuity history', () => {
  let state = resetState();
  state = openDay(state, 'Do the required thing', fixedDate);
  state = closeDay(state, 'Direction preserved', new Date('2026-08-09T18:00:00.000Z'));
  assert.equal(state.currentSession, null);
  assert.equal(state.dailySessions.length, 1);
  assert.equal(state.dailySessions[0].closingNote, 'Direction preserved');
});

test('principles cannot be edited without reason and evidence', () => {
  let state = resetState();
  const principle = state.principles[0];
  const blocked = reviewPrinciple(state, principle.id, 'Changed text', '', 'evidence');
  assert.equal(blocked.principles[0].text, principle.text);

  state = reviewPrinciple(state, principle.id, 'Changed with governance', 'Observed repeated conflict', 'Seven-day review log');
  assert.equal(state.principles[0].text, 'Changed with governance');
  assert.equal(state.principleReviews.length, 1);
});

test('import repairs a corrupted queue with multiple NOW items', () => {
  const state = resetState();
  state.queue = [
    { id: 'a', title: 'A', stage: 'now', status: 'open', priority: 3, createdAt: '2026-08-01T00:00:00Z' },
    { id: 'b', title: 'B', stage: 'now', status: 'open', priority: 2, createdAt: '2026-08-02T00:00:00Z' },
  ];
  const restored = importState(JSON.stringify(state));
  assert.equal(normalizeQueue(restored.queue).filter((item) => item.stage === 'now').length, 1);
});
