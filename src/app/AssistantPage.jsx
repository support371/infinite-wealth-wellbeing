import { useState } from 'react';
import { Compass, FilePenLine, Send, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { workspacePath } from './workspaceRoutes';

export default function AssistantPage() {
  const auth=useAuth();
  const [prompt,setPrompt]=useState(''); const [drafts,setDrafts]=useState([]);
  const createDraft=(e)=>{e.preventDefault();if(!prompt.trim())return;setDrafts([...drafts,{id:crypto.randomUUID(),prompt:prompt.trim(),response:`Reflection draft: ${prompt.trim()}\n\nWhat feels most important here? What is one realistic next step you control? Record any action as a goal or task when you are ready.`}]);setPrompt('');};
  return <section className="workspace-page"><header className="workspace-heading"><div><span className="workspace-eyebrow">IWW ASSISTANT</span><h1>Reflect, discover, draft</h1><p>Designed for navigation, reflection and drafting—not diagnosis, investment decisions or transactions.</p></div></header><div className="assistant-layout"><div className="assistant-guides"><Link to={workspacePath(auth.organization,'wellbeing')}><Compass/>Find wellbeing tools</Link><Link to={workspacePath(auth.organization,'resources')}><Sparkles/>Discover resources</Link><Link to={workspacePath(auth.organization,'tasks')}><FilePenLine/>Turn a thought into a task</Link></div><div className="assistant-thread">{drafts.length===0&&<div className="empty-state"><Sparkles/><h2>Start a guided reflection</h2><p>Your draft stays within this browser view until you choose to save it elsewhere.</p></div>}{drafts.map(item=><div key={item.id} className="assistant-exchange"><div className="assistant-user">{item.prompt}</div><pre>{item.response}</pre></div>)}<form onSubmit={createDraft} className="assistant-form"><textarea required value={prompt} onChange={(e)=>setPrompt(e.target.value)} placeholder="Draft a reflection, summary or next step…"/><button className="app-button primary">Draft <Send size={16}/></button></form></div></div></section>;
}
