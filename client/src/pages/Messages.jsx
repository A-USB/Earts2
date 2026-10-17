import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, MessageSquare, SendHorizontal } from 'lucide-react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/Avatar';
import LoadError from '../components/LoadError';
import { announceMessagesChanged } from '../hooks/useUnreadMessageCount';
import './Messages.css';

const fullName = u => `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.username;

function shortTime(ts) {
  const diff = Date.now() - ts;
  if (diff < 60000) return 'now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
  return `${Math.floor(diff / 86400000)}d`;
}

function stamp(ts) {
  const d = new Date(ts);
  const time = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const sameDay = d.toDateString() === new Date().toDateString();
  return sameDay ? time : `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${time}`;
}

export default function Messages() {
  const { username } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [conversations, setConversations] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState('');

  const [other, setOther] = useState(null);
  const [messages, setMessages] = useState([]);
  const [threadLoading, setThreadLoading] = useState(false);
  const [threadError, setThreadError] = useState('');
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');

  const scrollerRef = useRef(null);
  const stickToBottom = useRef(true);
  const lastTs = useRef(0);

  const loadConversations = useCallback(() => {
    api.get('/messages/conversations')
      .then(list => { setConversations(list); setListError(''); })
      .catch(err => setListError(err.message || 'Unable to load your messages.'))
      .finally(() => setListLoading(false));
  }, []);

  useEffect(() => {
    loadConversations();
    const timer = window.setInterval(() => { if (document.visibilityState === 'visible') loadConversations(); }, 15000);
    return () => window.clearInterval(timer);
  }, [loadConversations]);

  // Open a thread
  useEffect(() => {
    setOther(null);
    setMessages([]);
    setText('');
    setSendError('');
    setThreadError('');
    lastTs.current = 0;
    stickToBottom.current = true;
    if (!username) return undefined;
    let cancelled = false;
    setThreadLoading(true);
    api.get(`/messages/with/${encodeURIComponent(username)}`)
      .then(data => {
        if (cancelled) return;
        setOther(data.user);
        setMessages(data.messages);
        lastTs.current = data.messages.at(-1)?.createdAt || 0;
        announceMessagesChanged();
        loadConversations();
      })
      .catch(err => { if (!cancelled) setThreadError(err.status === 404 ? 'We couldn’t find that person.' : (err.message || 'Unable to open this conversation.')); })
      .finally(() => { if (!cancelled) setThreadLoading(false); });
    return () => { cancelled = true; };
  }, [username, loadConversations]);

  // Pick up new messages while the thread is open
  useEffect(() => {
    if (!username || !other) return undefined;
    const timer = window.setInterval(async () => {
      if (document.visibilityState !== 'visible') return;
      try {
        const data = await api.get(`/messages/with/${encodeURIComponent(username)}?after=${lastTs.current}`);
        if (!data.messages.length) return;
        setMessages(prev => {
          const have = new Set(prev.map(m => m.id));
          return [...prev, ...data.messages.filter(m => !have.has(m.id))];
        });
        lastTs.current = data.messages.at(-1).createdAt;
        announceMessagesChanged();
        loadConversations();
      } catch {}
    }, 5000);
    return () => window.clearInterval(timer);
  }, [username, other, loadConversations]);

  // Keep the newest message in view unless the reader has scrolled up
  useEffect(() => {
    const el = scrollerRef.current;
    if (el && stickToBottom.current) el.scrollTop = el.scrollHeight;
  }, [messages, threadLoading]);

  const onScroll = () => {
    const el = scrollerRef.current;
    if (el) stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  };

  const send = async () => {
    const value = text.trim();
    if (!value || sending || !other) return;
    const tempId = `temp_${Date.now()}`;
    const optimistic = { id: tempId, senderId: user.id, text: value, createdAt: Date.now() };
    setSendError('');
    setMessages(prev => [...prev, optimistic]);
    setText('');
    stickToBottom.current = true;
    setSending(true);
    try {
      const saved = await api.post(`/messages/with/${encodeURIComponent(username)}`, { text: value });
      setMessages(prev => prev.map(m => (m.id === tempId ? saved : m)));
      lastTs.current = Math.max(lastTs.current, saved.createdAt);
      loadConversations();
    } catch (err) {
      setMessages(prev => prev.filter(m => m.id !== tempId));
      setText(prev => prev || value);
      setSendError(err.message || 'Message not sent. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const threadOpen = Boolean(username);

  return (
    <div className="msg-page page-wrapper">
      <div className={`container msg-shell ${threadOpen ? 'thread-open' : ''}`}>
        {/* Conversations */}
        <aside className="msg-list" aria-label="Conversations">
          <div className="msg-list-head">
            <h1>Messages</h1>
          </div>
          <div className="msg-list-body">
            {listLoading ? (
              [1, 2, 3, 4].map(i => (
                <div key={i} className="msg-row" aria-hidden="true">
                  <div className="skeleton" style={{ width: 44, height: 44, borderRadius: '50%', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div className="skeleton" style={{ width: '45%', height: 12, marginBottom: 8 }} />
                    <div className="skeleton" style={{ width: '80%', height: 11 }} />
                  </div>
                </div>
              ))
            ) : listError ? (
              <LoadError title="Messages couldn’t load" message={listError} onRetry={loadConversations} />
            ) : conversations.length === 0 ? (
              <p className="msg-empty-list">
                No conversations yet. Open an artist’s profile and choose <strong>Message</strong> to say hello.
              </p>
            ) : (
              conversations.map(c => (
                <Link
                  key={c.user.id}
                  to={`/messages/${c.user.username}`}
                  className={`msg-row ${c.user.username === username ? 'active' : ''} ${c.unread ? 'unread' : ''}`}
                  aria-current={c.user.username === username ? 'true' : undefined}
                >
                  <Avatar seed={c.user.avatarSeed || fullName(c.user)} src={c.user.avatar} size={44} />
                  <div className="msg-row-main">
                    <div className="msg-row-top">
                      <strong>{fullName(c.user)}</strong>
                      <span>{shortTime(c.lastMessage.createdAt)}</span>
                    </div>
                    <p>{c.lastMessage.fromMe ? 'You: ' : ''}{c.lastMessage.text}</p>
                  </div>
                  {c.unread > 0 && <span className="msg-unread" aria-label={`${c.unread} unread`}>{c.unread}</span>}
                </Link>
              ))
            )}
          </div>
        </aside>

        {/* Thread */}
        <section className="msg-thread" aria-label="Conversation">
          {!threadOpen ? (
            <div className="msg-placeholder">
              <MessageSquare size={34} aria-hidden="true" />
              <h2>Your messages</h2>
              <p>Pick a conversation, or start one from an artist’s profile.</p>
            </div>
          ) : threadError ? (
            <div className="msg-thread-error">
              <button type="button" className="msg-back" onClick={() => navigate('/messages')}><ArrowLeft size={18} /> All messages</button>
              <LoadError title="Can’t open this conversation" message={threadError} onRetry={() => navigate(0)} />
            </div>
          ) : (
            <>
              <header className="msg-thread-head">
                <button type="button" className="msg-back" onClick={() => navigate('/messages')} aria-label="Back to all messages">
                  <ArrowLeft size={20} />
                </button>
                {other ? (
                  <Link to={`/profile/${other.username}`} className="msg-person">
                    <Avatar seed={other.avatarSeed || fullName(other)} src={other.avatar} size={40} />
                    <span><strong>{fullName(other)}</strong><small>{other.role || `@${other.username}`}</small></span>
                  </Link>
                ) : (
                  <div className="skeleton" style={{ width: 180, height: 34 }} />
                )}
              </header>

              <div className="msg-scroll" ref={scrollerRef} onScroll={onScroll}>
                {threadLoading ? (
                  <p className="msg-hint">Loading conversation…</p>
                ) : messages.length === 0 ? (
                  <p className="msg-hint">This is the start of your conversation{other ? ` with ${other.firstName}` : ''}. Say hello.</p>
                ) : (
                  messages.map((m, i) => {
                    const mine = m.senderId === user?.id;
                    const prev = messages[i - 1];
                    const gap = !prev || m.createdAt - prev.createdAt > 30 * 60 * 1000;
                    return (
                      <div key={m.id}>
                        {gap && <div className="msg-stamp">{stamp(m.createdAt)}</div>}
                        <div className={`msg-bubble-row ${mine ? 'mine' : 'theirs'}`}>
                          <div className={`msg-bubble ${m.id.startsWith?.('temp_') ? 'pending' : ''}`}>{m.text}</div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {sendError && <div className="msg-error" role="alert">{sendError}</div>}

              <div className="msg-composer">
                <label htmlFor="msg-input" className="sr-only">Message {other ? fullName(other) : ''}</label>
                <textarea
                  id="msg-input"
                  rows={1}
                  value={text}
                  onChange={e => setText(e.target.value)}
                  onKeyDown={onKeyDown}
                  placeholder="Write a message…"
                  maxLength={1000}
                  disabled={!other}
                />
                <button type="button" className="msg-send" onClick={send} disabled={!text.trim() || sending || !other} aria-label="Send message">
                  <SendHorizontal size={20} />
                </button>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
