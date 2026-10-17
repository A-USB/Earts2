import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Pin } from 'lucide-react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Avatar from './Avatar';
import './PostCommentsModal.css';

function timeAgo(ts) {
  if (!ts) return '';
  const diff = Date.now() - ts;
  const day = Math.floor(diff / 86400000);
  if (day >= 1) return `${day}d`;
  const hr = Math.floor(diff / 3600000);
  if (hr >= 1) return `${hr}h`;
  const min = Math.floor(diff / 60000);
  return min >= 1 ? `${min}m` : 'now';
}

const clamp = n => Math.min(100, Math.max(0, n));
const hasPin = c => typeof c.pinX === 'number' && typeof c.pinY === 'number';

export default function PostCommentsModal({ post, onClose, onCountChange }) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState('');
  const [tab, setTab] = useState('all');
  const [activeId, setActiveId] = useState(null);
  const [pinMode, setPinMode] = useState(false);
  const [draftPin, setDraftPin] = useState(null);
  const listRef = useRef(null);
  const noteRefs = useRef({});
  const canvasRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.get(`/artworks/${post.id}/comments`)
      .then(data => { if (!cancelled) setComments(data); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [post.id]);

  // Let the feed show the note count on the piece's label
  useEffect(() => {
    if (!loading) onCountChange?.(post.id, comments.length);
  }, [loading, comments.length, post.id, onCountChange]);

  // Close on Escape + lock background scroll while open
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  // Pin numbers follow the order notes were left in
  const pinNumbers = useMemo(() => {
    const map = {};
    comments.filter(hasPin).forEach((c, i) => { map[c.id] = i + 1; });
    return map;
  }, [comments]);
  const pinned = comments.filter(hasPin);
  const shown = tab === 'pinned' ? pinned : comments;

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      const el = listRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    });
  };

  const selectNote = (id, { scroll = false } = {}) => {
    setActiveId(prev => (prev === id ? null : id));
    if (scroll) {
      setTab('all');
      requestAnimationFrame(() => noteRefs.current[id]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }));
    }
  };

  const placePin = (e) => {
    if (!pinMode) return;
    const rect = e.currentTarget.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    setDraftPin({
      x: clamp(((e.clientX - rect.left) / rect.width) * 100),
      y: clamp(((e.clientY - rect.top) / rect.height) * 100),
    });
    setPinMode(false);
  };

  // Keyboard route for placing a pin: arrows move it, Enter confirms
  const onCanvasKey = (e) => {
    if (!pinMode) return;
    const step = 3;
    const moves = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    if (moves[e.key]) {
      e.preventDefault();
      const [dx, dy] = moves[e.key];
      setDraftPin(p => ({ x: clamp((p?.x ?? 50) + dx), y: clamp((p?.y ?? 50) + dy) }));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      setDraftPin(p => p || { x: 50, y: 50 });
      setPinMode(false);
    }
  };

  const togglePinMode = () => {
    if (!user) return;
    if (pinMode) { setPinMode(false); return; }
    setPinMode(true);
    canvasRef.current?.focus();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const value = text.trim();
    if (!value || posting) return;

    const pin = draftPin ? { pinX: Math.round(draftPin.x * 10) / 10, pinY: Math.round(draftPin.y * 10) / 10 } : {};

    // Optimistic: show the note immediately, swap in the server copy after
    const tempId = `temp_${Date.now()}`;
    setPostError('');
    setComments(prev => [...prev, {
      id: tempId,
      artworkId: post.id,
      userId: user?.id,
      userName: user ? `${user.firstName} ${user.lastName}` : 'You',
      text: value,
      createdAt: Date.now(),
      ...pin,
    }]);
    setText('');
    setDraftPin(null);
    setPinMode(false);
    setPosting(true);
    scrollToBottom();

    try {
      const c = await api.post(`/artworks/${post.id}/comments`, { text: value, ...pin });
      setComments(prev => prev.map(x => x.id === tempId ? c : x));
    } catch {
      // Roll back: remove the optimistic note, restore the draft, explain why
      setComments(prev => prev.filter(x => x.id !== tempId));
      setText(prev => prev || value);
      if (draftPin) setDraftPin(draftPin);
      setPostError("Couldn't post your note — please try again.");
    } finally {
      setPosting(false);
    }
  };

  const profile = `/profile/${post.artistUsername || ''}`;

  return (
    <div className="pcm-overlay" onClick={onClose}>
      <button type="button" className="pcm-back" onClick={onClose}>
        <ArrowLeft size={18} aria-hidden="true" /> Back to the wall
      </button>

      <div className="pcm-modal" role="dialog" aria-modal="true" aria-label={`Notes on ${post.title || 'this artwork'}`} onClick={e => e.stopPropagation()}>
        {/* Left: the piece, brought forward off the wall */}
        <div className="pcm-stage">
          <div className="pcm-frame">
            <div
              ref={canvasRef}
              className={`pcm-canvas ${pinMode ? 'placing' : ''}`}
              onClick={placePin}
              onKeyDown={onCanvasKey}
              tabIndex={pinMode ? 0 : -1}
              aria-label={pinMode ? 'Placing a pin. Use the arrow keys to move it and Enter to confirm.' : undefined}
            >
              {post.imageUrl ? (
                <img src={post.imageUrl} alt={post.title || 'Artwork'} draggable="false" />
              ) : (
                <div className="pcm-media-empty" style={{ background: post.color || '#C8C8E8' }} />
              )}

              {pinned.map(c => (
                <button
                  key={c.id}
                  type="button"
                  className={`pcm-pin ${activeId === c.id ? 'active' : ''}`}
                  style={{ left: `${c.pinX}%`, top: `${c.pinY}%` }}
                  onClick={(e) => { e.stopPropagation(); if (!pinMode) selectNote(c.id, { scroll: true }); }}
                  aria-label={`Note ${pinNumbers[c.id]} by ${c.userName}`}
                >
                  {pinNumbers[c.id]}
                </button>
              ))}

              {draftPin && (
                <span className="pcm-pin draft" style={{ left: `${draftPin.x}%`, top: `${draftPin.y}%` }} aria-hidden="true">+</span>
              )}
            </div>
          </div>

          <div className="pcm-caption">
            <h2>{post.title}</h2>
            <p>
              <Link to={profile} onClick={onClose}>{post.artistName}</Link>
              {post.medium ? ` · ${post.medium}` : ''}
              {post.status === 'for_sale' && post.price ? ` · Available · $${post.price}` : ''}
            </p>
            <p className="pcm-hint" aria-live="polite">
              {pinMode
                ? 'Click the piece to place your pin.'
                : 'Use “Pin to a spot” to point a note at part of the piece.'}
            </p>
          </div>
        </div>

        {/* Right: the notes, on paper */}
        <div className="pcm-panel">
          <div className="pcm-head">
            <h2>{loading ? 'Notes' : `${comments.length} ${comments.length === 1 ? 'note' : 'notes'}`}</h2>
            <div className="pcm-tabs" role="group" aria-label="Filter notes">
              <button type="button" className={`pcm-tab ${tab === 'all' ? 'active' : ''}`} aria-pressed={tab === 'all'} onClick={() => setTab('all')}>All</button>
              <button type="button" className={`pcm-tab ${tab === 'pinned' ? 'active' : ''}`} aria-pressed={tab === 'pinned'} onClick={() => setTab('pinned')}>
                Pinned to the piece · {pinned.length}
              </button>
            </div>
          </div>

          <div className="pcm-notes" ref={listRef}>
            {loading ? (
              [1, 2, 3].map(i => (
                <div key={i} className="pcm-note">
                  <div className="skeleton" style={{ width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div className="skeleton" style={{ width: '38%', height: '11px', marginBottom: '7px' }} />
                    <div className="skeleton" style={{ width: '82%', height: '11px' }} />
                  </div>
                </div>
              ))
            ) : shown.length === 0 ? (
              <p className="pcm-empty">
                {tab === 'pinned' ? 'No pinned notes yet.' : 'No notes yet. Be the first to say something.'}
              </p>
            ) : (
              shown.map(c => (
                <div
                  key={c.id}
                  ref={el => { noteRefs.current[c.id] = el; }}
                  className={`pcm-note ${activeId === c.id ? 'active' : ''} ${hasPin(c) ? 'has-pin' : ''}`}
                  onClick={() => hasPin(c) && selectNote(c.id)}
                >
                  <Avatar seed={c.userName} size={36} />
                  <div className="pcm-note-body">
                    <div className="pcm-note-meta">
                      {hasPin(c) && <span className="pcm-badge" aria-label={`Pinned note ${pinNumbers[c.id]}`}>{pinNumbers[c.id]}</span>}
                      <strong>{c.userName}</strong>
                      <span>· {timeAgo(c.createdAt)}</span>
                    </div>
                    <p>{c.text}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          {postError && <div className="pcm-error" role="alert">{postError}</div>}

          <form className="pcm-composer" onSubmit={handleSubmit}>
            <label htmlFor="pcm-note-input">Leave a note</label>
            <input
              id="pcm-note-input"
              placeholder={user ? 'What stands out to you?' : 'Sign in to leave a note'}
              value={text}
              onChange={e => setText(e.target.value)}
              disabled={!user}
              maxLength={600}
            />
            <div className="pcm-composer-row">
              <div className="pcm-pin-controls">
                <button
                  type="button"
                  className={`pcm-pin-toggle ${pinMode || draftPin ? 'on' : ''}`}
                  onClick={togglePinMode}
                  aria-pressed={pinMode}
                  disabled={!user}
                >
                  <Pin size={16} aria-hidden="true" />
                  {draftPin ? 'Pin placed' : pinMode ? 'Placing…' : 'Pin to a spot'}
                </button>
                {draftPin && (
                  <button type="button" className="pcm-link-btn" onClick={() => setDraftPin(null)}>Remove pin</button>
                )}
              </div>
              <button type="submit" className="pcm-post-btn" disabled={!user || posting || !text.trim()}>
                Post note
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
