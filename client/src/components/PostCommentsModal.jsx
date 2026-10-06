import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { X, Heart, MessageCircle } from 'lucide-react';
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

const formatLikes = n => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : n);

export default function PostCommentsModal({ post, liked, onToggleLike, onClose }) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState('');
  const listRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.get(`/artworks/${post.id}/comments`)
      .then(data => { if (!cancelled) setComments(data); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [post.id]);

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

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      const el = listRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const value = text.trim();
    if (!value || posting) return;

    // Optimistic: show the comment immediately, swap in the server copy after
    const tempId = `temp_${Date.now()}`;
    setPostError('');
    setComments(prev => [...prev, {
      id: tempId,
      artworkId: post.id,
      userId: user?.id,
      userName: user ? `${user.firstName} ${user.lastName}` : 'You',
      text: value,
      createdAt: Date.now(),
    }]);
    setText('');
    setPosting(true);
    scrollToBottom();

    try {
      const c = await api.post(`/artworks/${post.id}/comments`, { text: value });
      setComments(prev => prev.map(x => x.id === tempId ? c : x));
    } catch {
      // Roll back: remove the optimistic comment, restore the draft, explain why
      setComments(prev => prev.filter(x => x.id !== tempId));
      setText(prev => prev || value);
      setPostError("Couldn't post your comment — please try again.");
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="pcm-overlay" onClick={onClose}>
      <button className="pcm-close-btn" onClick={onClose} aria-label="Close comments">
        <X size={20} />
      </button>

      <div className="pcm-modal" onClick={e => e.stopPropagation()}>
        {/* Left: artwork */}
        <div className="pcm-media" style={{ background: post.color || '#C8C8E8' }}>
          {post.imageUrl ? (
            <img src={post.imageUrl} alt={post.title || 'Artwork'} />
          ) : (
            <span className="pcm-media-emoji">🖼️</span>
          )}
        </div>

        {/* Right: comments panel */}
        <div className="pcm-panel">
          <div className="pcm-header">
            <Link to={`/profile/${post.artistUsername || ''}`} className="pcm-author" onClick={onClose}>
              <Avatar seed={post.artistName} size={34} />
              <strong>{post.artistName}</strong>
            </Link>
            <span className="pcm-time">{timeAgo(post.createdAt)}</span>
          </div>

          <div className="pcm-caption">
            <Avatar seed={post.artistName} size={34} />
            <p>
              <Link
                to={`/profile/${post.artistUsername || ''}`}
                className="pcm-caption-author"
                onClick={onClose}
              >
                {post.artistName}
              </Link>
              <strong>{post.title}</strong>
              {post.description && <span className="pcm-caption-desc">{post.description}</span>}
            </p>
          </div>

          <div className="pcm-comments" ref={listRef}>
            {loading ? (
              [1, 2, 3].map(i => (
                <div key={i} className="pcm-comment">
                  <div className="skeleton" style={{ width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div className="skeleton" style={{ width: '38%', height: '11px', marginBottom: '7px' }} />
                    <div className="skeleton" style={{ width: '82%', height: '11px' }} />
                  </div>
                </div>
              ))
            ) : comments.length === 0 ? (
              <p className="pcm-empty">No comments yet — be the first to say something.</p>
            ) : (
              comments.map(c => (
                <div key={c.id} className="pcm-comment">
                  <Avatar seed={c.userName} size={34} />
                  <div className="pcm-comment-body">
                    <p><strong>{c.userName}</strong> {c.text}</p>
                    <span className="pcm-comment-meta">{timeAgo(c.createdAt)}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="pcm-actions">
            <button
              className={`pcm-icon-btn ${liked ? 'liked' : ''}`}
              onClick={() => onToggleLike(post)}
              aria-label={liked ? 'Unlike' : 'Like'}
            >
              <Heart size={20} fill={liked ? 'currentColor' : 'none'} />
            </button>
            <span className="pcm-like-count">{formatLikes(post.likes || 0)} likes</span>
            <MessageCircle size={20} className="pcm-muted-icon" />
          </div>

          {postError && <div className="pcm-composer-error">{postError}</div>}

          <form className="pcm-composer" onSubmit={handleSubmit}>
            <input
              placeholder={user ? 'Add a comment...' : 'Sign in to comment'}
              value={text}
              onChange={e => setText(e.target.value)}
              disabled={!user}
              maxLength={600}
            />
            <button
              type="submit"
              className="pcm-post-btn"
              disabled={!user || posting || !text.trim()}
            >
              Post
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
