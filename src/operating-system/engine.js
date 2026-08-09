const SCHEMA_VERSION = 2;
const STORAGE_KEY = 'iww.daily-command-engine.v2';
const LEGACY_STORAGE_KEY = 'iww.daily-command-engine.v1';

const DEFAULT_STATE = {
  schemaVersion: SCHEMA_VERSION,
  principles: [
    {
      id: 'p-progress',
      text: 'Make meaningful progress toward the chosen life every day.',
      active: true,
      updatedAt: null,
    },
    {
      id: 'p-integrity',
      text: 'Do not damage people, health, or trust to create progress.',
      active: true,
      updatedAt: null,
    },
    {
      id: 'p-evidence',
      text: 'Count verified outcomes, not intention, activity, or pressure.',
      active: true,
      updatedAt: null,
    },
  ],
  principleReviews: [],
  primaryMission: {
    title: 'Primary mission',
    outcome: 'Define the one result that must become real next.',
    updatedAt: null,
  },
  queue: [],
  incubator: [],
  evidence: [],
  overrides: [],
  dailySessions: [],
  currentSession: null,
  checkIn: {
    energy: 3,
    environment: 3,
    pressure: 3,
    note: '',
  },
};

function clone(value) {
  return typeof structuredClone === 'function'
    ? structuredClone(value)
    : JSON.parse(JSON.stringify(value));
}

function todayKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function mergeState(candidate = {}) {
  const base = clone(DEFAULT_STATE);
  return {
    ...base,
    ...candidate,
    schemaVersion: SCHEMA_VERSION,
    primaryMission: { ...base.primaryMission, ...(candidate.primaryMission || {}) },
    checkIn: { ...base.checkIn, ...(candidate.checkIn || {}) },
    principles: Array.isArray(candidate.principles) && candidate.principles.length
      ? candidate.principles.map((principle) => ({ updatedAt: null, ...principle }))
      : base.principles,
    principleReviews: Array.isArray(candidate.principleReviews) ? candidate.principleReviews : [],
    queue: Array.isArray(candidate.queue) ? candidate.queue : [],
    incubator: Array.isArray(candidate.incubator) ? candidate.incubator : [],
    evidence: Array.isArray(candidate.evidence) ? candidate.evidence : [],
    overrides: Array.isArray(candidate.overrides) ? candidate.overrides : [],
    dailySessions: Array.isArray(candidate.dailySessions) ? candidate.dailySessions : [],
    currentSession: candidate.currentSession || null,
  };
}

export function loadState() {
  if (typeof window === 'undefined') return clone(DEFAULT_STATE);
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
      || window.localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return clone(DEFAULT_STATE);
    return mergeState(JSON.parse(raw));
  } catch {
    return clone(DEFAULT_STATE);
  }
}

export function saveState(state) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(mergeState(state)));
}

export function exportState(state) {
  return JSON.stringify(mergeState(state), null, 2);
}

export function importState(raw) {
  const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Backup must contain a JSON object.');
  }
  return repairQueueState(mergeState(parsed));
}

export function id(prefix = 'item') {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function paceFromEnergy(energy) {
  const value = Math.max(1, Math.min(5, Number(energy || 1)));
  if (value <= 1) return { label: 'minimum viable move', maxMinutes: 20, scope: 1 };
  if (value === 2) return { label: 'reduced load', maxMinutes: 45, scope: 1 };
  if (value === 3) return { label: 'standard execution', maxMinutes: 90, scope: 2 };
  if (value === 4) return { label: 'deep work', maxMinutes: 150, scope: 3 };
  return { label: 'high-capacity push', maxMinutes: 210, scope: 4 };
}

export function methodConstraints(checkIn) {
  const environment = Number(checkIn?.environment || 3);
  const pressure = Number(checkIn?.pressure || 3);
  const energy = Number(checkIn?.energy || 3);
  const constraints = [];

  if (energy <= 2) constraints.push('Reduce scope, not direction. Produce the smallest valid evidence-bearing result.');
  if (environment <= 2) constraints.push('Use a low-disruption method: quiet location, asynchronous work, headphones, or a smaller task slice.');
  if (environment >= 4) constraints.push('Environment is supportive: protect the block from avoidable interruption.');
  if (pressure >= 4) constraints.push('Do not widen scope under pressure. Finish the smallest verifiable slice first.');
  if (pressure <= 2) constraints.push('Use available calm to prepare or close a difficult dependency.');

  return constraints;
}

export function normalizeQueue(queue = []) {
  const rank = { now: 0, next: 1, later: 2 };
  return [...queue]
    .filter((item) => item.status !== 'done' && item.status !== 'archived')
    .sort((a, b) => {
      const stage = (rank[a.stage] ?? 9) - (rank[b.stage] ?? 9);
      if (stage !== 0) return stage;
      const priority = Number(b.priority || 0) - Number(a.priority || 0);
      if (priority !== 0) return priority;
      return String(a.createdAt || '').localeCompare(String(b.createdAt || ''));
    });
}

export function repairQueueState(state) {
  const open = normalizeQueue(state.queue);
  const nowItems = open.filter((item) => item.stage === 'now');
  if (nowItems.length <= 1) return state;
  const keep = nowItems[0].id;
  return {
    ...state,
    queue: state.queue.map((item) => (
      item.stage === 'now' && item.id !== keep && item.status === 'open'
        ? { ...item, stage: 'next' }
        : item
    )),
  };
}

export function isDayOpen(state, date = new Date()) {
  return Boolean(
    state.currentSession
    && state.currentSession.status === 'open'
    && state.currentSession.date === todayKey(date)
  );
}

export function openDay(state, openingIntent = '', date = new Date()) {
  if (isDayOpen(state, date)) return state;
  const openedAt = date.toISOString();
  return {
    ...state,
    currentSession: {
      id: id('day'),
      date: todayKey(date),
      status: 'open',
      openedAt,
      openingIntent: openingIntent.trim(),
      closingNote: '',
      closedAt: null,
      checkInAtOpen: { ...state.checkIn },
    },
  };
}

export function closeDay(state, closingNote = '', date = new Date()) {
  if (!state.currentSession || state.currentSession.status !== 'open') return state;
  const closed = {
    ...state.currentSession,
    status: 'closed',
    closedAt: date.toISOString(),
    closingNote: closingNote.trim(),
    openWorkAtClose: normalizeQueue(state.queue).map((item) => item.id),
    evidenceCountAtClose: state.evidence.length,
  };
  return {
    ...state,
    currentSession: null,
    dailySessions: [closed, ...state.dailySessions].slice(0, 90),
  };
}

export function setPrimaryMission(state, mission) {
  const title = String(mission?.title || '').trim();
  const outcome = String(mission?.outcome || '').trim();
  if (!title || !outcome) return state;
  return {
    ...state,
    primaryMission: {
      title,
      outcome,
      updatedAt: new Date().toISOString(),
    },
  };
}

export function reviewPrinciple(state, principleId, newText, reason, evidenceText) {
  const nextText = String(newText || '').trim();
  const why = String(reason || '').trim();
  const evidence = String(evidenceText || '').trim();
  if (!nextText || !why || !evidence) return state;
  const principle = state.principles.find((entry) => entry.id === principleId);
  if (!principle) return state;
  const createdAt = new Date().toISOString();
  return {
    ...state,
    principles: state.principles.map((entry) => (
      entry.id === principleId ? { ...entry, text: nextText, updatedAt: createdAt } : entry
    )),
    principleReviews: [
      {
        id: id('principle-review'),
        principleId,
        before: principle.text,
        after: nextText,
        reason: why,
        evidence,
        createdAt,
      },
      ...state.principleReviews,
    ],
  };
}

export function getRequiredAction(state, date = new Date()) {
  const queue = normalizeQueue(state.queue);
  const active = queue.find((item) => item.stage === 'now') || queue[0];
  const pace = paceFromEnergy(state.checkIn?.energy);
  const constraints = methodConstraints(state.checkIn);

  if (!isDayOpen(state, date)) {
    return {
      kind: 'open-day',
      title: 'Open today’s command gate',
      instruction: 'State what must remain true today, then begin from the active mission instead of from incoming demands.',
      pace,
      constraints,
    };
  }

  if (!active) {
    return {
      kind: 'define',
      title: 'Define the next required result',
      instruction: state.primaryMission?.outcome || 'Define one result that must become real next.',
      pace,
      constraints,
    };
  }

  return {
    kind: 'execute',
    item: active,
    title: active.title,
    instruction: active.nextAction || active.outcome || active.title,
    acceptanceCriteria: active.acceptanceCriteria || '',
    pace,
    constraints,
  };
}

export function canPromoteFromIncubator(state) {
  return !normalizeQueue(state.queue).some((item) => item.stage === 'now');
}

export function addToIncubator(state, title, note = '') {
  const cleanTitle = String(title || '').trim();
  if (!cleanTitle) return state;
  return {
    ...state,
    incubator: [
      ...state.incubator,
      { id: id('idea'), title: cleanTitle, note: String(note || '').trim(), createdAt: new Date().toISOString() },
    ],
  };
}

export function archiveIncubatorItem(state, ideaId) {
  return {
    ...state,
    incubator: state.incubator.filter((entry) => entry.id !== ideaId),
  };
}

export function addQueueItem(state, item) {
  const title = String(item?.title || '').trim();
  if (!title) return state;
  const existingNow = normalizeQueue(state.queue).some((q) => q.stage === 'now');
  const requestedStage = item.stage || 'later';
  const stage = requestedStage === 'now' && existingNow ? 'next' : requestedStage;
  const next = {
    ...state,
    queue: [
      ...state.queue,
      {
        id: id('task'),
        title,
        outcome: String(item.outcome || '').trim(),
        nextAction: String(item.nextAction || '').trim(),
        acceptanceCriteria: String(item.acceptanceCriteria || '').trim(),
        stage,
        priority: Math.max(1, Math.min(5, Number(item.priority || 1))),
        status: 'open',
        createdAt: new Date().toISOString(),
      },
    ],
  };
  return repairQueueState(next);
}

export function completeWithEvidence(state, itemId, evidenceText) {
  const evidence = String(evidenceText || '').trim();
  if (!evidence) return state;
  const item = state.queue.find((q) => q.id === itemId);
  if (!item || item.status !== 'open') return state;
  const completedAt = new Date().toISOString();
  return {
    ...state,
    queue: state.queue.map((q) => q.id === itemId ? { ...q, status: 'done', completedAt } : q),
    evidence: [
      {
        id: id('evidence'),
        itemId,
        title: item.title,
        text: evidence,
        acceptanceCriteria: item.acceptanceCriteria || '',
        createdAt: completedAt,
      },
      ...state.evidence,
    ],
  };
}

export function deferWithOverride(state, itemId, reason) {
  const cleanReason = String(reason || '').trim();
  if (!cleanReason) return state;
  const item = state.queue.find((q) => q.id === itemId);
  if (!item || item.status !== 'open') return state;
  const createdAt = new Date().toISOString();
  const deferred = {
    ...state,
    queue: state.queue.map((q) => q.id === itemId ? { ...q, stage: 'later', deferredAt: createdAt } : q),
    overrides: [
      {
        id: id('override'),
        itemId,
        title: item.title,
        reason: cleanReason,
        disposition: 'deferred',
        createdAt,
      },
      ...state.overrides,
    ],
  };
  return nextStageAfterCompletion(deferred);
}

export function promoteIncubatorItem(state, ideaId) {
  if (!canPromoteFromIncubator(state)) return state;
  const idea = state.incubator.find((entry) => entry.id === ideaId);
  if (!idea) return state;
  return addQueueItem(
    { ...state, incubator: state.incubator.filter((entry) => entry.id !== ideaId) },
    {
      title: idea.title,
      outcome: idea.note,
      nextAction: '',
      acceptanceCriteria: '',
      stage: 'now',
      priority: 1,
    }
  );
}

export function nextStageAfterCompletion(state) {
  const open = normalizeQueue(state.queue);
  if (!open.length || open.some((item) => item.stage === 'now')) return state;
  const next = open[0];
  return {
    ...state,
    queue: state.queue.map((item) => item.id === next.id ? { ...item, stage: 'now' } : item),
  };
}

export function resetState() {
  return clone(DEFAULT_STATE);
}
