import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Check, ChevronRight, Plus, RefreshCcw, X } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { requireSupabase } from '../lib/supabase';
import { canAccessModule, canWriteModule, modules } from './moduleConfig';

function friendly(value) {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'object') return Array.isArray(value) ? value.join(', ') : JSON.stringify(value);
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return String(value).replace('T', ' ').replace(/\.\d{3}Z$/, '');
}

export default function EntityWorkspace({ moduleKey }) {
  const module = modules[moduleKey];
  const auth = useAuth();
  const [activeTab, setActiveTab] = useState(module.tabs[0].key);
  const tab = useMemo(() => module.tabs.find((item) => item.key === activeTab) || module.tabs[0], [module, activeTab]);
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState({ loading: true, error: '' });
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');

  const allowed = canAccessModule(module, auth.role);
  const writable = allowed && canWriteModule(module, auth.role) && !tab.readOnly;

  const load = useCallback(async () => {
    if (!allowed || !auth.organization?.id) return;
    setStatus({ loading: true, error: '' });
    const { data, error } = await requireSupabase()
      .from(tab.table)
      .select('*')
      .eq('organization_id', auth.organization.id)
      .order('created_at', { ascending: false })
      .limit(100);
    setRows(data || []);
    setStatus({ loading: false, error: error?.message || '' });
  }, [allowed, auth.organization?.id, tab.table]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setForm(tab.defaults || {}); setShowForm(false); setNotice(''); }, [tab]);

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true); setStatus((current) => ({ ...current, error: '' }));
    const payload = { ...tab.defaults, ...form, organization_id: auth.organization.id };
    for (const field of tab.fields) {
      if (field.type === 'number' && payload[field.key] !== '' && payload[field.key] !== undefined) payload[field.key] = Number(payload[field.key]);
      if (field.type === 'datetime-local' && payload[field.key]) payload[field.key] = new Date(payload[field.key]).toISOString();
    }
    if (tab.memberScoped) payload.member_id = auth.user.id;
    if (!['memberships','notifications'].includes(tab.table)) payload.created_by = auth.user.id;
    if (tab.table === 'documents') payload.owner_id = auth.user.id;
    if (tab.table === 'community_posts') {
      payload.author_id = auth.user.id;
      delete payload.created_by;
    }
    if (tab.table === 'invitations') {
      payload.invited_by = auth.user.id;
      payload.token_hash = crypto.randomUUID().replaceAll('-', '');
      payload.expires_at = new Date(`${payload.expires_at}T23:59:59Z`).toISOString();
      delete payload.created_by;
    }
    if (tab.table === 'workflow_approvals') {
      payload.requested_by = auth.user.id;
      delete payload.created_by;
    }
    const { error } = await requireSupabase().from(tab.table).insert(payload);
    if (error) setStatus({ loading: false, error: error.message });
    else {
      setNotice(`${tab.label} record created.`);
      setForm(tab.defaults || {});
      setShowForm(false);
      await load();
    }
    setSaving(false);
  };

  if (!allowed) return <div className="app-state denied"><AlertTriangle/><h2>Permission denied</h2><p>Your IWW role does not grant access to this organization module.</p></div>;

  return <section className="workspace-page">
    <header className="workspace-heading"><div><span className="workspace-eyebrow">{auth.organization.name}</span><h1>{module.title}</h1><p>{module.description}</p></div>{writable && <button className="app-button primary" onClick={() => setShowForm(true)}><Plus size={17}/> Add record</button>}</header>
    <nav className="workspace-tabs" aria-label={`${module.title} sections`}>{module.tabs.map((item)=><button key={item.key} className={item.key === tab.key ? 'active' : ''} onClick={()=>setActiveTab(item.key)}>{item.label}</button>)}</nav>
    {notice && <div className="form-alert success"><Check size={16}/>{notice}</div>}
    {showForm && <form className="entity-form" onSubmit={submit}><div className="entity-form-head"><div><h2>Add {tab.label.toLowerCase()}</h2><p>Saved securely to the active IWW organization.</p></div><button type="button" aria-label="Close" onClick={()=>setShowForm(false)}><X/></button></div><div className="entity-form-grid">{tab.fields.map((field)=><label key={field.key}>{field.label}{field.type === 'textarea' ? <textarea required={field.required} value={form[field.key] || ''} onChange={(e)=>setForm({...form,[field.key]:e.target.value})}/> : field.type === 'select' ? <select required value={form[field.key] || field.options[0]} onChange={(e)=>setForm({...form,[field.key]:e.target.value})}>{field.options.map(option=><option key={option}>{option}</option>)}</select> : <input required={field.required} type={field.type} value={form[field.key] || ''} onChange={(e)=>setForm({...form,[field.key]:e.target.value})}/>}</label>)}</div><div className="entity-form-actions"><button type="button" className="app-button secondary" onClick={()=>setShowForm(false)}>Cancel</button><button className="app-button primary" disabled={saving}>{saving ? 'Saving…' : 'Save record'}</button></div></form>}
    {status.error && <div className="app-state error"><AlertTriangle/><h2>We could not load this module</h2><p>{status.error}</p><button className="app-button secondary" onClick={load}><RefreshCcw size={16}/> Retry</button></div>}
    {status.loading ? <div className="app-state app-loading"><span className="spinner"/>Loading {tab.label.toLowerCase()}…</div> : !status.error && rows.length === 0 ? <div className="empty-state"><div><Plus/></div><h2>No {tab.label.toLowerCase()} yet</h2><p>{writable ? 'Create the first record when you are ready.' : 'There are no records available for your authorized scope.'}</p>{writable && <button className="app-button primary" onClick={()=>setShowForm(true)}>Add first record</button>}</div> : !status.error && <div className="data-table-wrap"><table className="data-table"><thead><tr><th>{tab.label}</th><th>Status / details</th><th>Updated</th><th><span className="sr-only">Open</span></th></tr></thead><tbody>{rows.map((row)=><tr key={row.id}><td><strong>{friendly(row[tab.titleField] || row.name || row.title || row.id)}</strong><small>{friendly(row.description || row.summary || row.email || row.category)}</small></td><td><span className={`status-pill ${row.status || 'active'}`}>{friendly(row.status || row.role || row.domain || 'active')}</span></td><td>{friendly(row.updated_at || row.created_at)}</td><td><ChevronRight size={17}/></td></tr>)}</tbody></table></div>}
  </section>;
}
