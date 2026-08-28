import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, MessageSquarePlus, Send } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { requireSupabase } from '../lib/supabase';

export default function MessagesPage() {
  const auth = useAuth();
  const [conversations, setConversations] = useState([]);
  const [active, setActive] = useState(null);
  const [messages, setMessages] = useState([]);
  const [body, setBody] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const loadConversations = useCallback(async () => {
    setLoading(true); const { data, error: queryError } = await requireSupabase().from('conversations').select('*').eq('organization_id',auth.organization.id).order('updated_at',{ascending:false});
    if (queryError) setError(queryError.message); else { setConversations(data || []); setActive((current)=>current || data?.[0] || null); }
    setLoading(false);
  },[auth.organization.id]);
  const loadMessages = useCallback(async () => {
    if (!active) { setMessages([]); return; }
    const { data, error: queryError } = await requireSupabase().from('messages').select('*').eq('conversation_id',active.id).order('created_at');
    if (queryError) setError(queryError.message); else setMessages(data || []);
  },[active]);
  useEffect(()=>{ loadConversations(); },[loadConversations]);
  useEffect(()=>{ loadMessages(); },[loadMessages]);

  const send = async (event) => {
    event.preventDefault(); if (!body.trim() || !active) return;
    const { error: sendError } = await requireSupabase().from('messages').insert({organization_id:auth.organization.id,conversation_id:active.id,sender_id:auth.user.id,body:body.trim()});
    if (sendError) setError(sendError.message); else { setBody(''); await loadMessages(); }
  };

  return <section className="workspace-page"><header className="workspace-heading"><div><span className="workspace-eyebrow">SECURE COLLABORATION</span><h1>Messages</h1><p>Only explicit conversation participants can read or send messages.</p></div></header>{error && <div className="form-alert error"><AlertTriangle size={16}/>{error}</div>}<div className="message-layout"><aside className="conversation-list">{loading ? <div className="app-state app-loading"><span className="spinner"/></div> : conversations.length ? conversations.map(item=><button key={item.id} className={active?.id===item.id?'active':''} onClick={()=>setActive(item)}><span>{item.subject || 'Secure conversation'}</span><small>{item.conversation_type.replaceAll('_',' ')}</small></button>) : <div className="mini-empty"><MessageSquarePlus/><strong>No conversations</strong><span>A care-team or organization administrator can initiate a secure thread.</span></div>}</aside><div className="message-thread">{!active ? <div className="empty-state"><MessageSquarePlus/><h2>Select a conversation</h2></div> : <><div className="thread-heading"><strong>{active.subject || 'Secure conversation'}</strong><span>{active.participant_ids.length} participants</span></div><div className="thread-messages">{messages.map(message=><div key={message.id} className={`message-bubble ${message.sender_id===auth.user.id?'mine':''}`}><p>{message.body}</p><span>{new Date(message.created_at).toLocaleString()}</span></div>)}{!messages.length && <div className="mini-empty">No messages yet.</div>}</div><form className="message-composer" onSubmit={send}><label className="sr-only" htmlFor="message-body">Message</label><textarea id="message-body" required value={body} onChange={(e)=>setBody(e.target.value)} placeholder="Write a secure message…"/><button aria-label="Send message"><Send/></button></form></>}</div></div></section>;
}
