import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Droplet, StickyNote, ShoppingBag, ImagePlus, Bookmark } from 'lucide-react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/Avatar';
import CreatePostModal from '../components/CreatePostModal';
import PostCommentsModal from '../components/PostCommentsModal';
import LoadError from '../components/LoadError';
import './Feed.css';

const DAY = 86400000;

function timeAgo(ts) {
  if (!ts) return '';
  const diff = Date.now() - ts;
  const day = Math.floor(diff / DAY);
  if (day >= 1) return `${day}d ago`;
  const hr = Math.floor(diff / 3600000);
  if (hr >= 1) return `${hr}h ago`;
  const min = Math.floor(diff / 60000);
  return min >= 1 ? `${min}m ago` : 'just now';
}

const formatCount = n => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : n);

function statusOf(post) {
  if (post.status === 'for_sale') return { key: 'avail', text: post.price ? `Available · $${post.price}` : 'Available' };
  if (post.status === 'sold') return { key: 'sold', text: 'Sold' };
  return { key: 'off', text: 'Not for sale' };
}

// One column on phones, two staggered columns on larger screens
function useNarrow(query = '(max-width: 760px)') {
  const [narrow, setNarrow] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setNarrow(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [query]);
  return narrow;
}

function Piece({ post, isFollowing, onToggleFollow, liked, onToggleLike, saved, onToggleSave, isSelf, onOpenNotes, noteCount }) {
  const status = statusOf(post);
  const profile = `/profile/${post.artistUsername || ''}`;

  return (
    <article className="wall-piece">
      <Link to={`/artwork/${post.id}`} className="wall-mat" aria-label={`Open ${post.title || 'artwork'}`}>
        {post.imageUrl ? (
          <img src={post.imageUrl} alt={post.title || 'Artwork'} loading="lazy" />
        ) : (
          <div className="wall-mat-empty" style={{ background: post.color || '#C8C8E8' }} />
        )}
      </Link>

      <div className="wall-label">
        <div className="wall-label-top">
          <div className="wall-label-main">
            <h3 className="wall-title">{post.title}</h3>
            <p className="wall-by">
              <Link to={profile} className="wall-artist">
                <Avatar seed={post.artistAvatarSeed || post.artistName} src={post.artistAvatar} size={22} />
                {post.artistName}
              </Link>
              <span>{post.medium ? ` · ${post.medium}` : ''} · {timeAgo(post.createdAt)}</span>
            </p>
          </div>
          <span className="wall-status"><i className={`wall-dot ${status.key}`} aria-hidden="true" />{status.text}</span>
        </div>

        {post.description && <p className="wall-desc">{post.description}</p>}

        <div className="wall-actions">
          <button
            type="button"
            className={`wall-btn ${liked ? 'liked' : ''}`}
            onClick={() => onToggleLike(post)}
            aria-pressed={liked}
            aria-label={liked ? 'Remove your drop' : 'Leave a drop'}
          >
            <Droplet size={20} fill={liked ? 'currentColor' : 'none'} />
            <span>{formatCount(post.likes || 0)}</span>
          </button>
          <button type="button" className="wall-btn" onClick={() => onOpenNotes(post)} aria-label="Read notes">
            <StickyNote size={20} />
            <span>{typeof noteCount === 'number' ? `${noteCount} ${noteCount === 1 ? 'note' : 'notes'}` : 'Notes'}</span>
          </button>
          {!isSelf && (
            <button
              type="button"
              className={`wall-follow ${isFollowing ? 'following' : ''}`}
              onClick={() => onToggleFollow(post)}
              aria-pressed={isFollowing}
            >
              {isFollowing ? 'Following' : '+ Follow'}
            </button>
          )}
          <span className="wall-actions-end">
            {post.status === 'for_sale' && (
              <Link to={`/artwork/${post.id}`} className="wall-btn wall-icon-only" title="View in Marketplace" aria-label="View in Marketplace">
                <ShoppingBag size={20} />
              </Link>
            )}
            <button
              type="button"
              className={`wall-btn wall-icon-only ${saved ? 'saved' : ''}`}
              onClick={() => onToggleSave(post)}
              title={saved ? 'Remove from saved artworks' : 'Save artwork'}
              aria-label={saved ? 'Remove from saved artworks' : 'Save artwork'}
              aria-pressed={saved}
            >
              <Bookmark size={20} fill={saved ? 'currentColor' : 'none'} />
            </button>
          </span>
        </div>
      </div>
    </article>
  );
}

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'new', label: 'New today' },
  { id: 'sale', label: 'Available' },
];

export default function Feed() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const narrow = useNarrow();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [followingIds, setFollowingIds] = useState([]);
  const [likedIds, setLikedIds] = useState([]);
  const [savedIds, setSavedIds] = useState([]);
  const [showComposer, setShowComposer] = useState(false);
  const [commentsPostId, setCommentsPostId] = useState(null);
  const [noteCounts, setNoteCounts] = useState({});
  const [filter, setFilter] = useState('all');

  const loadFeed = () => {
    setLoading(true);
    setLoadError('');
    Promise.all([
      api.get('/feed'),
      api.get('/users/me/following').catch(() => []),
      api.get('/users/me/likes').catch(() => []),
      api.get('/users/me/saved/ids').catch(() => []),
    ])
      .then(([feedPosts, following, likes, saved]) => {
        setPosts(feedPosts);
        setFollowingIds(following);
        setLikedIds(likes);
        setSavedIds(saved);
      })
      .catch(error => setLoadError(error.message || 'Unable to load your feed.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadFeed(); }, []);

  const handleToggleSave = async (post) => {
    if (!user) { navigate('/login'); return; }
    try {
      const data = await api.post(`/artworks/${post.id}/save`);
      setSavedIds(prev => data.saved
        ? (prev.includes(post.id) ? prev : [...prev, post.id])
        : prev.filter(id => id !== post.id));
    } catch {}
  };

  const handleToggleFollow = async (post) => {
    if (!user) { navigate('/login'); return; }
    if (!post.artistUsername) return;
    try {
      const isFollowing = followingIds.includes(post.artistId);
      const data = isFollowing
        ? await api.post(`/users/${post.artistUsername}/unfollow`)
        : await api.post(`/users/${post.artistUsername}/follow`);
      setFollowingIds(prev =>
        data.following ? [...prev, post.artistId] : prev.filter(id => id !== post.artistId)
      );
    } catch {}
  };

  const handleToggleLike = async (post) => {
    if (!user) { navigate('/login'); return; }

    // Optimistic: flip like state + count instantly, reconcile with the server after
    const wasLiked = likedIds.includes(post.id);
    const prevLikes = posts.find(p => p.id === post.id)?.likes || post.likes || 0;
    const nextLikes = wasLiked ? Math.max(0, prevLikes - 1) : prevLikes + 1;

    setPosts(prev => prev.map(p => p.id === post.id ? { ...p, likes: nextLikes } : p));
    setLikedIds(prev => wasLiked ? prev.filter(id => id !== post.id) : [...prev, post.id]);

    try {
      const data = await api.post(`/artworks/${post.id}/like`);
      setPosts(prev => prev.map(p => p.id === post.id ? { ...p, likes: data.likes } : p));
      setLikedIds(prev => data.liked
        ? (prev.includes(post.id) ? prev : [...prev, post.id])
        : prev.filter(id => id !== post.id));
    } catch {
      // Roll back to the pre-click state if the request failed
      setPosts(prev => prev.map(p => p.id === post.id ? { ...p, likes: prevLikes } : p));
      setLikedIds(prev => wasLiked
        ? (prev.includes(post.id) ? prev : [...prev, post.id])
        : prev.filter(id => id !== post.id));
    }
  };

  const activePost = posts.find(p => p.id === commentsPostId) || null;

  const visible = posts.filter(p => {
    if (filter === 'new') return Date.now() - (p.createdAt || 0) < DAY;
    if (filter === 'sale') return p.status === 'for_sale';
    return true;
  });
  const columns = narrow ? [visible] : [visible.filter((_, i) => i % 2 === 0), visible.filter((_, i) => i % 2 === 1)];
  const weekday = new Date().toLocaleDateString(undefined, { weekday: 'long' });

  const renderPiece = post => (
    <Piece
      key={post.id}
      post={post}
      isFollowing={followingIds.includes(post.artistId)}
      onToggleFollow={handleToggleFollow}
      liked={likedIds.includes(post.id)}
      onToggleLike={handleToggleLike}
      saved={savedIds.includes(post.id)}
      onToggleSave={handleToggleSave}
      isSelf={user && post.artistId === user.id}
      onOpenNotes={p => setCommentsPostId(p.id)}
      noteCount={noteCounts[post.id]}
    />
  );

  return (
    <div className="feed-page wall-page page-wrapper">
      <div className="container wall-container">
        <header className="wall-header">
          <div>
            <p className="wall-eyebrow">{weekday}</p>
            <h1>Your wall</h1>
            <p className="wall-sub">Fresh work from the artists around you</p>
          </div>
          <div className="wall-filters" role="group" aria-label="Filter the wall">
            {FILTERS.map(f => (
              <button
                key={f.id}
                type="button"
                className={`wall-chip ${filter === f.id ? 'active' : ''}`}
                aria-pressed={filter === f.id}
                onClick={() => setFilter(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </header>

        {loading ? (
          <div className="wall-columns" aria-hidden="true">
            {(narrow ? [[1, 2]] : [[1, 2], [3, 4]]).map((col, ci) => (
              <div key={ci} className={`wall-column ${ci === 1 ? 'offset' : ''}`}>
                {col.map(i => (
                  <div key={i} className="wall-piece">
                    <div className="wall-mat"><div className="skeleton" style={{ width: '100%', aspectRatio: i % 2 ? '4 / 5' : '4 / 3' }} /></div>
                    <div className="wall-label"><div className="skeleton" style={{ height: 18, width: '60%', marginBottom: 10 }} /><div className="skeleton" style={{ height: 12, width: '40%' }} /></div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : loadError ? (
          <LoadError title="Your feed couldn’t load" message={loadError} onRetry={loadFeed} />
        ) : (
          <div className="wall-columns">
            {columns.map((col, ci) => (
              <div key={ci} className={`wall-column ${ci === 1 ? 'offset' : ''}`}>
                {ci === (narrow ? 0 : 1) && user?.accountType !== 'collector' && (
                  <button type="button" className="wall-hang" onClick={() => setShowComposer(true)}>
                    <ImagePlus size={26} aria-hidden="true" />
                    <strong>Hang something new</strong>
                    <span>Share what you’re working on</span>
                  </button>
                )}
                {col.map(renderPiece)}
              </div>
            ))}
            {visible.length === 0 && (
              <div className="wall-empty">
                <h3>{posts.length === 0 ? 'Your wall is empty' : 'Nothing matches this filter'}</h3>
                <p>
                  {posts.length === 0
                    ? (user?.accountType === 'collector' ? 'Follow artists to see their new work here.' : 'Follow artists or share your own work to get started.')
                    : 'Try another filter to see more work.'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {activePost && (
        <PostCommentsModal
          post={activePost}
          liked={likedIds.includes(activePost.id)}
          onToggleLike={handleToggleLike}
          onCountChange={(id, n) => setNoteCounts(prev => (prev[id] === n ? prev : { ...prev, [id]: n }))}
          onClose={() => setCommentsPostId(null)}
        />
      )}

      {showComposer && user?.accountType !== 'collector' && (
        <CreatePostModal
          onClose={() => setShowComposer(false)}
          onPosted={(newPost) => {
            setShowComposer(false);
            setPosts(prev => [{ ...newPost, artistUsername: user.username }, ...prev]);
          }}
        />
      )}
    </div>
  );
}
