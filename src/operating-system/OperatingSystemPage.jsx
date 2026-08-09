import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, CheckCircle, Gauge, Lock, Plus, Shield, Sparkles, Target } from 'lucide-react';
import {
  addQueueItem,
  addToIncubator,
  canPromoteFromIncubator,
  completeWithEvidence,
  getRequiredAction,
  loadState,
  nextStageAfterCompletion,
  promoteIncubatorItem,
  recordOverride,
  saveState,
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

function QueueCard({ item }) {
  return (
    <div className="os-queue-card">
      <span className={`os-stage os-stage-${item.stage}`}>{item.stage}</span>
      <div>
        <strong>{item.title}</strong>
        {item.nextAction && <p>{item.nextAction}</p>}
        {!item.nextAction && item.outcome && <p>{item.outcome}</p>}
      </div>
    </div>
  );
}

export default function OperatingSystemPage() {
  const [state, setState] = useState(loadState);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskAction, setTaskAction] = useState('');
  const [ideaTitle, setIdeaTitle] = useState('');
  const [ideaNote, setIdeaNote] = useState('');
  const [evidence, setEvidence] = useState('');
  const [overrideReason, setOverrideReason] = useState('');

  useEffect(() => saveState(state), [state]);

  const command = useMemo(() => getRequiredAction(state), [state]);
  const activeItem = command.item;
  const openQueue = state.queue.filter((item) => item.status !== 'done');

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
      stage: 'now',
      priority: 3,
    }));
    setTaskTitle('');
    setTaskAction('');
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
    setState((current) => recordOverride(current, activeItem.id, overrideReason.trim()));
    setOverrideReason('');
  }

  return (
    <main className="os-shell">
      <section className="os-hero">
        <div>
          <span className="os-kicker"><Shield size={15} /> Daily Command Engine</span>
          <h1>Principle chooses the direction. Reality chooses the method.</h1>
          <p>The system does not ask what feels attractive next. It presents the required action, adapts its method to current capacity, and requires evidence or an explicit override.</p>
        </div>
        <div className="os-law">
          <Lock size={20} />
          <div><strong>Operating law</strong><span>Change the method before changing the principle.</span></div>
        </div>
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
          <span className="os-command-mode">{command.kind === 'execute' ? 'EXECUTE' : 'DEFINE'}</span>
          <h3>{command.title}</h3>
          <p className="os-command-instruction">{command.instruction}</p>
          <div className="os-pace"><strong>Method:</strong> {command.pace.label}, up to {command.pace.maxMinutes} minutes.</div>
          {command.constraints.map((constraint) => <p className="os-constraint" key={constraint}>{constraint}</p>)}
        </article>

        <article className="os-panel">
          <div className="os-panel-title"><Shield size={18}/><h2>Principles</h2></div>
          <ol className="os-principles">
            {state.principles.filter((p) => p.active).map((p) => <li key={p.id}>{p.text}</li>)}
          </ol>
        </article>
      </section>

      <section className="os-grid os-grid-2">
        <article className="os-panel">
          <div className="os-panel-title"><CheckCircle size={18}/><h2>Close with evidence</h2></div>
          {activeItem ? (
            <>
              <p>Do not mark <strong>{activeItem.title}</strong> complete until you can point to what became real.</p>
              <textarea className="os-input" placeholder="Evidence: deployed URL, test result, document completed, decision recorded..." value={evidence} onChange={(e) => setEvidence(e.target.value)} />
              <button className="os-primary" onClick={finishActive} disabled={!evidence.trim()}><CheckCircle size={16}/> Complete with evidence</button>
              <div className="os-override">
                <input className="os-input" placeholder="If overriding, state the reason explicitly" value={overrideReason} onChange={(e) => setOverrideReason(e.target.value)} />
                <button className="os-secondary" onClick={overrideActive} disabled={!overrideReason.trim()}>Record override</button>
              </div>
            </>
          ) : <p>Add the next required result. The system will make it the active command.</p>}
        </article>

        <article className="os-panel">
          <div className="os-panel-title"><ArrowRight size={18}/><h2>Now · Next · Later</h2></div>
          <div className="os-queue">
            {openQueue.length ? openQueue.map((item) => <QueueCard item={item} key={item.id}/>) : <p className="os-muted">No open work yet.</p>}
          </div>
          <form className="os-form" onSubmit={submitTask}>
            <input className="os-input" placeholder="Required result" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} />
            <input className="os-input" placeholder="Next physical action" value={taskAction} onChange={(e) => setTaskAction(e.target.value)} />
            <button className="os-primary" type="submit"><Plus size={16}/> Add required work</button>
          </form>
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
                <button disabled={!canPromoteFromIncubator(state)} onClick={() => setState((current) => promoteIncubatorItem(current, idea.id))}>Promote</button>
              </div>
            ))}
          </div>
          {!canPromoteFromIncubator(state) && state.incubator.length > 0 && <p className="os-warning">Promotion is locked while a NOW item is active.</p>}
        </article>

        <article className="os-panel">
          <div className="os-panel-title"><CheckCircle size={18}/><h2>Evidence ledger</h2></div>
          <div className="os-ledger">
            {state.evidence.slice(0, 8).map((entry) => (
              <div className="os-ledger-row" key={entry.id}>
                <strong>{entry.title}</strong>
                <span>{entry.text}</span>
                <small>{new Date(entry.createdAt).toLocaleString()}</small>
              </div>
            ))}
            {!state.evidence.length && <p className="os-muted">Completed work will appear here as evidence, not as memory.</p>}
          </div>
          {state.overrides.length > 0 && <p className="os-warning">Overrides recorded: {state.overrides.length}. Review repeated reasons before changing a principle.</p>}
        </article>
      </section>
    </main>
  );
}
