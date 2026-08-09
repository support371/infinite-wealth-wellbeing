import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Archive,
  ArrowRight,
  CheckCircle,
  Download,
  Gauge,
  Lock,
  Plus,
  RefreshCw,
  Shield,
  Sparkles,
  Target,
  Upload,
} from 'lucide-react';
import {
  activateQueueItem,
  addQueueItem,
  addToIncubator,
  archiveIncubatorItem,
  blockedItems,
  blockWithReason,
  canPromoteFromIncubator,
  closeDay,
  completeWithEvidence,
  deferWithOverride,
  exportState,
  getRequiredAction,
  importState,
  isDayOpen,
  loadState,
  nextStageAfterCompletion,
  normalizeQueue,
  openDay,
  promoteIncubatorItem,
  reviewPrinciple,
  saveState,
  setPrimaryMission,
  unblockItem,
} from './engine.js';
import './operatingSystem.css';

function FieldMeter({ label, value, onChange, low, high }) {
  return (
    <label className="os-meter">
      <span>{label}</span>
      <input type="range" min="1" max="5" step="1" value={value} onChange={(e) => onChange(Number(e.target.value))} />
      <small>{low} · {value}/5 · {high}</small>
    </label>
  );
}

function QueueCard({ item, canActivate, onActivate }) {
  return (
    <div className="os-queue-card">
      <span className={`os-stage os-stage-${item.stage}`}>{item.stage}</span>
      <div>
        <strong>{item.title}</strong>
        {item.nextAction && <p>{item.nextAction}</p>}
        {!item.nextAction && item.outcome && <p>{item.outcome}</p>}
        {item.acceptanceCriteria && <small className="os-acceptance">Done when: {item.acceptanceCriteria}</small>}
        {item.stage !== 'now' && canActivate && (
          <button className="os-text-button" onClick={() => onActivate(item.id)}>Make NOW</button>
        )}
      </div>
    </div>
  );
}

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString();
}

export default function OperatingSystemPage() {
  const [state, setState] = useState(loadState);
  const [openingIntent, setOpeningIntent] = useState('');
  const [closingNote, setClosingNote] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskAction, setTaskAction] = useState('');
  const [taskAcceptance, setTaskAcceptance] = useState('');
  const [ideaTitle, setIdeaTitle] = useState('');
  const [ideaNote, setIdeaNote] = useState('');
  const [evidence, setEvidence] = useState('');
  const [overrideReason, setOverrideReason] = useState('');
  const [blockReason, setBlockReason] = useState('');
  const [missionTitle, setMissionTitle] = useState(state.primaryMission.title);
  const [missionOutcome, setMissionOutcome] = useState(state.primaryMission.outcome);
  const [principleId, setPrincipleId] = useState(state.principles[0]?.id || '');
  const [principleText, setPrincipleText] = useState(state.principles[0]?.text || '');
  const [principleReason, setPrincipleReason] = useState('');
  const [principleEvidence, setPrincipleEvidence] = useState('');
  const [backupMessage, setBackupMessage] = useState('');
  const importRef = useRef(null);

  useEffect(() => saveState(state), [state]);

  const command = useMemo(() => getRequiredAction(state), [state]);
  const openQueue = useMemo(() => normalizeQueue(state.queue), [state.queue]);
  const blocked = useMemo(() => blockedItems(state.queue), [state.queue]);
  const activeItem = openQueue.find((item) => item.stage === 'now');
  const dayOpen = isDayOpen(state);

  function updateCheckIn(key, value) {
    setState((current) => ({
      ...current,
      checkIn: { ...current.checkIn, [key]: value },
    }));
  }

  function submitTask(event) {
    event.preventDefault();
    if (!taskTitle.trim()) return;
    setState((current) => addQueueItem(current, {
      title: taskTitle.trim(),
      nextAction: taskAction.trim(),
      acceptanceCriteria: taskAcceptance.trim(),
      stage: 'now',
      priority: 3,
    }));
    setTaskTitle('');
    setTaskAction('');
    setTaskAcceptance('');
  }

  function submitIdea(event) {
    event.preventDefault();
    if (!ideaTitle.trim()) return;
    setState((current) => addToIncubator(current, ideaTitle.trim(), ideaNote.trim()));
    setIdeaTitle('');
    setIdeaNote('');
  }

  function finishActive() {
    if (!activeItem || !evidence.trim()) return;
    setState((current) => nextStageAfterCompletion(completeWithEvidence(current, activeItem.id, evidence.trim())));
    setEvidence('');
  }

  function overrideActive() {
    if (!activeItem || !overrideReason.trim()) return;
    setState((current) => deferWithOverride(current, activeItem.id, overrideReason.trim()));
    setOverrideReason('');
  }

  function blockActive() {
    if (!activeItem || !blockReason.trim()) return;
    setState((current) => blockWithReason(current, activeItem.id, blockReason.trim()));
    setBlockReason('');
  }

  function submitMission(event) {
    event.preventDefault();
    setState((current) => setPrimaryMission(current, { title: missionTitle, outcome: missionOutcome }));
  }

  function selectPrinciple(nextId) {
    setPrincipleId(nextId);
    setPrincipleText(state.principles.find((entry) => entry.id === nextId)?.text || '');
    setPrincipleReason('');
    setPrincipleEvidence('');
  }

  function submitPrincipleReview(event) {
    event.preventDefault();
    if (!principleId || !principleText.trim() || !principleReason.trim() || !principleEvidence.trim()) return;
    setState((current) => reviewPrinciple(
      current,
      principleId,
      principleText,
      principleReason,
      principleEvidence,
    ));
    setPrincipleReason('');
    setPrincipleEvidence('');
  }

  function downloadBackup() {
    const blob = new Blob([exportState(state)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `daily-command-backup-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setBackupMessage('Backup exported.');
  }

  async function restoreBackup(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const restored = importState(await file.text());
      setState(restored);
      setMissionTitle(restored.primaryMission.title);
      setMissionOutcome(restored.primaryMission.outcome);
      setBackupMessage('Backup restored and queue repaired.');
    } catch (error) {
      setBackupMessage(`Restore failed: ${error.message}`);
    } finally {
      event.target.value = '';
    }
  }

  return (
    <main className="os-shell">
      <section className="os-hero">
        <div>
          <span className="os-kicker"><Shield size={15} /> Daily Command Engine</span>
          <h1>Principle chooses the direction. Reality chooses the method.</h1>
          <p>The system does not ask what feels attractive next. It presents the required action, adapts its method to current capacity, and requires evidence or a deliberate override.</p>
        </div>
        <div className="os-law">
          <Lock size={20} />
          <div><strong>Operating law</strong><span>Change the method before changing the principle.</span></div>
        </div>
      </section>

      <section className="os-gatebar">
        <div>
          <span className={`os-status ${dayOpen ? 'is-open' : 'is-closed'}`}>{dayOpen ? 'DAY OPEN' : 'DAY CLOSED'}</span>
          <strong>{state.primaryMission.title}</strong>
          <small>{state.primaryMission.outcome}</small>
        </div>
        {!dayOpen ? (
          <div className="os-inline-action">
            <input className="os-input" placeholder="What must remain true today?" value={openingIntent} onChange={(e) => setOpeningIntent(e.target.value)} />
            <button className="os-primary" onClick={() => {
              setState((current) => openDay(current, openingIntent));
              setOpeningIntent('');
            }}><ArrowRight size={16}/> Open today</button>
          </div>
        ) : (
          <div className="os-inline-action">
            <input className="os-input" placeholder="Closing note: what remains true?" value={closingNote} onChange={(e) => setClosingNote(e.target.value)} />
            <button className="os-secondary" onClick={() => {
              setState((current) => closeDay(current, closingNote));
              setClosingNote('');
            }}>Close day</button>
          </div>
        )}
      </section>

      <section className="os-grid os-grid-3">
        <article className="os-panel">
          <div className="os-panel-title"><Gauge size={18}/><h2>Current reality</h2></div>
          <FieldMeter label="Energy" value={state.checkIn.energy} onChange={(v) => updateCheckIn('energy', v)} low="empty" high="strong" />
          <FieldMeter label="Environment" value={state.checkIn.environment} onChange={(v) => updateCheckIn('environment', v)} low="difficult" high="supportive" />
          <FieldMeter label="Pressure" value={state.checkIn.pressure} onChange={(v) => updateCheckIn('pressure', v)} low="calm" high="high" />
          <textarea className="os-input" placeholder="What is true about the environment today?" value={state.checkIn.note} onChange={(e) => updateCheckIn('note', e.target.value)} />
        </article>

        <article className="os-panel os-command-panel">
          <div className="os-panel-title"><Target size={18}/><h2>Required action</h2></div>
          <span className="os-command-mode">{command.kind.replace('-', ' ').toUpperCase()}</span>
          <h3>{command.title}</h3>
          <p className="os-command-instruction">{command.instruction}</p>
          {command.acceptanceCriteria && <p className="os-definition"><strong>Done when:</strong> {command.acceptanceCriteria}</p>}
          <div className="os-pace"><strong>Method:</strong> {command.pace.label}, up to {command.pace.maxMinutes} minutes.</div>
          {command.constraints.map((constraint) => <p className="os-constraint" key={constraint}>{constraint}</p>)}
        </article>

        <article className="os-panel">
          <div className="os-panel-title"><Shield size={18}/><h2>Principles</h2></div>
          <ol className="os-principles">
            {state.principles.filter((p) => p.active).map((p) => <li key={p.id}>{p.text}</li>)}
          </ol>
          <p className="os-muted os-small">A principle can change only through a review with a reason and evidence.</p>
        </article>
      </section>

      <section className="os-grid os-grid-2">
        <article className="os-panel">
          <div className="os-panel-title"><CheckCircle size={18}/><h2>Resolve the active command</h2></div>
          {activeItem ? (
            <>
              <p>Do not mark <strong>{activeItem.title}</strong> complete until you can point to what became real.</p>
              {activeItem.acceptanceCriteria && <p className="os-definition"><strong>Acceptance:</strong> {activeItem.acceptanceCriteria}</p>}
              <textarea className="os-input" placeholder="Evidence: deployed URL, test result, document completed, decision recorded..." value={evidence} onChange={(e) => setEvidence(e.target.value)} />
              <button className="os-primary" onClick={finishActive} disabled={!evidence.trim()}><CheckCircle size={16}/> Complete with evidence</button>

              <div className="os-resolution-grid">
                <div>
                  <input className="os-input" placeholder="To defer, record the reason" value={overrideReason} onChange={(e) => setOverrideReason(e.target.value)} />
                  <button className="os-secondary" onClick={overrideActive} disabled={!overrideReason.trim()}>Defer with override</button>
                </div>
                <div>
                  <input className="os-input" placeholder="External dependency / blocking reason" value={blockReason} onChange={(e) => setBlockReason(e.target.value)} />
                  <button className="os-secondary" onClick={blockActive} disabled={!blockReason.trim()}>Mark BLOCKED</button>
                </div>
              </div>
              <p className="os-muted os-small">Defer is a deliberate choice. Blocked is reserved for a real dependency that prevents valid execution. Both are audited.</p>
            </>
          ) : <p>No `NOW` item is active. Activate a queued result or define the next required result.</p>}
        </article>

        <article className="os-panel">
          <div className="os-panel-title"><ArrowRight size={18}/><h2>Now · Next · Later</h2></div>
          <div className="os-queue">
            {openQueue.length ? openQueue.map((item) => (
              <QueueCard
                item={item}
                key={item.id}
                canActivate={!activeItem}
                onActivate={(itemId) => setState((current) => activateQueueItem(current, itemId))}
              />
            )) : <p className="os-muted">No open work yet.</p>}
          </div>
          <form className="os-form" onSubmit={submitTask}>
            <input className="os-input" placeholder="Required result" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} />
            <input className="os-input" placeholder="Next physical action" value={taskAction} onChange={(e) => setTaskAction(e.target.value)} />
            <input className="os-input" placeholder="Definition of done / acceptance evidence" value={taskAcceptance} onChange={(e) => setTaskAcceptance(e.target.value)} />
            <button className="os-primary" type="submit"><Plus size={16}/> Add required work</button>
          </form>

          {blocked.length > 0 && (
            <div className="os-blocked-list">
              <strong>Blocked dependencies</strong>
              {blocked.map((item) => (
                <div className="os-blocked-row" key={item.id}>
                  <div><span>{item.title}</span><small>{item.blockReason}</small></div>
                  <button className="os-secondary" onClick={() => setState((current) => unblockItem(current, item.id))}>Unblock</button>
                </div>
              ))}
            </div>
          )}
        </article>
      </section>

      <section className="os-grid os-grid-2">
        <article className="os-panel">
          <div className="os-panel-title"><Sparkles size={18}/><h2>Exploration barrier</h2></div>
          <p>New possibilities are preserved without being allowed to replace the active mission.</p>
          <form className="os-form" onSubmit={submitIdea}>
            <input className="os-input" placeholder="New idea" value={ideaTitle} onChange={(e) => setIdeaTitle(e.target.value)} />
            <input className="os-input" placeholder="Why it may matter later" value={ideaNote} onChange={(e) => setIdeaNote(e.target.value)} />
            <button className="os-secondary" type="submit"><Plus size={16}/> Send to incubator</button>
          </form>
          <div className="os-incubator">
            {state.incubator.map((idea) => (
              <div className="os-idea" key={idea.id}>
                <div><strong>{idea.title}</strong>{idea.note && <small>{idea.note}</small>}</div>
                <div className="os-idea-actions">
                  <button disabled={!canPromoteFromIncubator(state)} onClick={() => setState((current) => promoteIncubatorItem(current, idea.id))}>Promote</button>
                  <button aria-label={`Archive ${idea.title}`} onClick={() => setState((current) => archiveIncubatorItem(current, idea.id))}><Archive size={14}/></button>
                </div>
              </div>
            ))}
          </div>
          {!canPromoteFromIncubator(state) && state.incubator.length > 0 && <p className="os-warning">Promotion is locked while a NOW item is active.</p>}
        </article>

        <article className="os-panel">
          <div className="os-panel-title"><CheckCircle size={18}/><h2>Evidence & override ledger</h2></div>
          <div className="os-ledger">
            {state.evidence.slice(0, 8).map((entry) => (
              <div className="os-ledger-row" key={entry.id}>
                <strong>{entry.title}</strong>
                <span>{entry.text}</span>
                <small>{formatDate(entry.createdAt)}</small>
              </div>
            ))}
            {!state.evidence.length && <p className="os-muted">Completed work will appear here as evidence, not as memory.</p>}
          </div>
          {state.overrides.length > 0 && (
            <div className="os-audit-list">
              <strong>Recent non-standard resolutions</strong>
              {state.overrides.slice(0, 5).map((entry) => (
                <div key={entry.id}><span>{entry.title} · {entry.disposition}</span><small>{entry.reason} · {formatDate(entry.createdAt)}</small></div>
              ))}
            </div>
          )}
        </article>
      </section>

      <section className="os-grid os-grid-2">
        <article className="os-panel">
          <div className="os-panel-title"><Target size={18}/><h2>Mission governance</h2></div>
          <form className="os-form" onSubmit={submitMission}>
            <input className="os-input" value={missionTitle} onChange={(e) => setMissionTitle(e.target.value)} placeholder="Mission title" />
            <textarea className="os-input" value={missionOutcome} onChange={(e) => setMissionOutcome(e.target.value)} placeholder="What must become real?" />
            <button className="os-primary" type="submit"><RefreshCw size={16}/> Update mission</button>
          </form>
        </article>

        <article className="os-panel">
          <div className="os-panel-title"><Lock size={18}/><h2>Principle review gate</h2></div>
          <form className="os-form" onSubmit={submitPrincipleReview}>
            <select className="os-input" value={principleId} onChange={(e) => selectPrinciple(e.target.value)}>
              {state.principles.map((entry) => <option key={entry.id} value={entry.id}>{entry.text}</option>)}
            </select>
            <textarea className="os-input" value={principleText} onChange={(e) => setPrincipleText(e.target.value)} placeholder="Revised principle" />
            <input className="os-input" value={principleReason} onChange={(e) => setPrincipleReason(e.target.value)} placeholder="Why must the principle change?" />
            <input className="os-input" value={principleEvidence} onChange={(e) => setPrincipleEvidence(e.target.value)} placeholder="What evidence supports the change?" />
            <button className="os-secondary" type="submit" disabled={!principleReason.trim() || !principleEvidence.trim()}>Record governed change</button>
          </form>
        </article>
      </section>

      <section className="os-grid os-grid-2">
        <article className="os-panel">
          <div className="os-panel-title"><Shield size={18}/><h2>Daily continuity</h2></div>
          {state.dailySessions.length ? (
            <div className="os-ledger">
              {state.dailySessions.slice(0, 7).map((session) => (
                <div className="os-ledger-row" key={session.id}>
                  <strong>{session.date} · {session.status}</strong>
                  <span>{session.openingIntent || 'No opening statement recorded.'}</span>
                  {session.closingNote && <span>Close: {session.closingNote}</span>}
                  <small>{session.openWorkAtClose?.length || 0} open · {session.blockedWorkAtClose?.length || 0} blocked at close</small>
                </div>
              ))}
            </div>
          ) : <p className="os-muted">Closed or interrupted days will form the continuity journal here.</p>}
        </article>

        <article className="os-panel">
          <div className="os-panel-title"><Download size={18}/><h2>Recovery & portability</h2></div>
          <p>Your command state is stored in this browser. Export backups before major browser/device changes.</p>
          <div className="os-backup-actions">
            <button className="os-primary" onClick={downloadBackup}><Download size={16}/> Export JSON backup</button>
            <button className="os-secondary" onClick={() => importRef.current?.click()}><Upload size={16}/> Restore backup</button>
            <input ref={importRef} className="os-hidden" type="file" accept="application/json,.json" onChange={restoreBackup} />
          </div>
          {backupMessage && <p className="os-warning">{backupMessage}</p>}
          <p className="os-muted os-small">Remote sync, authenticated multi-device state, calendar ingestion, and external notification delivery remain outside this local-first kernel.</p>
        </article>
      </section>
    </main>
  );
}
