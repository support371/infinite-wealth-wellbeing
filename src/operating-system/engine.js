const DEFAULT_STATE = {
  principles: [
    {
      id: 'p-progress',
      text: 'Make meaningful progress toward the chosen life every day.',
      active: true,
    },
    {
      id: 'p-integrity',
      text: 'Do not damage people, health, or trust to create progress.',
      active: true,
    },
    {
      id: 'p-evidence',
      text: 'Count verified outcomes, not intention, activity, or pressure.',
      active: true,
    },
  ],
  primaryMission: {
    title: 'Primary mission',
    outcome: 'Define the one result that must become real next.',
  },
  queue: [],
  incubator: [],
  evidence: [],
  overrides: [],
  checkIn: {
    energy: 3,
    environment: 3,
    pressure: 3,
    note: '',
  },
};

const STORAGE_KEY = 'iww.daily-command-engine.v1';

export function loadState() {
  if (typeof window === 'undefined') return structuredClone(DEFAULT_STATE);
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(DEFAULT_STATE);
    return { ...structuredClone(DEFAULT_STATE), ...JSON.parse(raw) };
  } catch {
    return structuredClone(DEFAULT_STATE);
  }
}

export function saveState(state) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function id(prefix = 'item') {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function paceFromEnergy(energy) {
  const value = Number(energy || 1);
  if (value <= 1) return { label: 'minimum viable move', maxMinutes: 20, scope: 1 };
  if (value === 2) return { label: 'reduced load', maxMinutes: 45, scope: 1 };
  if (value === 3) return { label: 'standard execution', maxMinutes: 90, scope: 2 };
  if (value === 4) return { label: 'deep work', maxMinutes: 150, scope: 3 };
  return { label: 'high-capacity push', maxMinutes: 210, scope: 4 };
}

export function methodConstraints(checkIn) {
  const environment = Number(checkIn?.environment || 3);
  const pressure = Number(checkIn?.pressure || 3);
  const constraints = [];

  if (environment <= 2) constraints.push('Use a low-disruption method: headphones, quiet room, asynchronous work, or a smaller task slice.');
  if (environment >= 4) constraints.push('Environment is supportive: protect the block from avoidable interruption.');
  if (pressure >= 4) constraints.push('Do not widen scope under pressure. Finish the smallest verifiable slice first.');
  if (pressure <= 2) constraints.push('Use available calm to prepare or close a difficult dependency.');

  return constraints;
}

export function normalizeQueue(queue = []) {
  const rank = { now: 0, next: 1, later: 2 };
  return [...queue]
    .filter((item) => item.status !== 'done')
    .sort((a, b) => {
      const stage = (rank[a.stage] ?? 9) - (rank[b.stage] ?? 9);
      if (stage !== 0) return stage;
      return Number(b.priority || 0) - Number(a.priority || 0);
    });
}

export function getRequiredAction(state) {
  const queue = normalizeQueue(state.queue);
  const active = queue.find((item) => item.stage === 'now') || queue[0];
  const pace = paceFromEnergy(state.checkIn?.energy);
  const constraints = methodConstraints(state.checkIn);

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
    pace,
    constraints,
  };
}

export function canPromoteFromIncubator(state) {
  return !normalizeQueue(state.queue).some((item) => item.stage === 'now');
}

export function addToIncubator(state, title, note = '') {
  return {
    ...state,
    incubator: [
      ...state.incubator,
      { id: id('idea'), title, note, createdAt: new Date().toISOString() },
    ],
  };
}

export function addQueueItem(state, item) {
  const existingNow = normalizeQueue(state.queue).some((q) => q.stage === 'now');
  const stage = item.stage === 'now' && existingNow ? 'next' : (item.stage || 'later');
  return {
    ...state,
    queue: [
      ...state.queue,
      {
        id: id('task'),
        title: item.title,
        outcome: item.outcome || '',
        nextAction: item.nextAction || '',
        stage,
        priority: Number(item.priority || 1),
        status: 'open',
        createdAt: new Date().toISOString(),
      },
    ],
  };
}

export function completeWithEvidence(state, itemId, evidenceText) {
  const item = state.queue.find((q) => q.id === itemId);
  if (!item) return state;
  const completedAt = new Date().toISOString();
  return {
    ...state,
    queue: state.queue.map((q) => q.id === itemId ? { ...q, status: 'done', completedAt } : q),
    evidence: [
      { id: id('evidence'), itemId, title: item.title, text: evidenceText, createdAt: completedAt },
      ...state.evidence,
    ],
  };
}

export function recordOverride(state, itemId, reason) {
  const item = state.queue.find((q) => q.id === itemId);
  return {
    ...state,
    overrides: [
      {
        id: id('override'),
        itemId,
        title: item?.title || 'Required action',
        reason,
        createdAt: new Date().toISOString(),
      },
      ...state.overrides,
    ],
  };
}

export function promoteIncubatorItem(state, ideaId) {
  if (!canPromoteFromIncubator(state)) return state;
  const idea = state.incubator.find((entry) => entry.id === ideaId);
  if (!idea) return state;
  return {
    ...state,
    incubator: state.incubator.filter((entry) => entry.id !== ideaId),
    queue: [
      ...state.queue,
      {
        id: id('task'),
        title: idea.title,
        outcome: idea.note,
        nextAction: '',
        stage: 'now',
        priority: 1,
        status: 'open',
        createdAt: new Date().toISOString(),
      },
    ],
  };
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
  return structuredClone(DEFAULT_STATE);
}
