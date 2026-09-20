import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, ShoppingBag, ImagePlus, Tag } from 'lucide-react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/Avatar';
import CreatePostModal from '../components/CreatePostModal';
import './Feed.css';

function timeAgo(ts) {
  if (!ts) return '';
  const diff = Date.now() - ts;
  const day = Math.floor(diff / 86400000);
  if (day >= 1) return `${day}d ago`;
  const hr = Math.floor(diff / 3600000);
  if (hr >= 1) return `${hr}h ago`;
  const min = Math.floor(diff / 60000);
  return min >= 1 ? `${min}m ago` : 'just now';
}

function Post({ post, isFollowing, onToggleFollow, liked, onToggleLike, isSelf }) {
  const formatLikes = n => n >= 1000 ? `${(n/1000).toFixed(1)}k` : n;

  return (
    <article className="post-card card">
      <div className="post-header">
        <Link to={`/profile/${post.artistUsername || ''}`} className="post-author">
          <Avatar seed={post.artistName} size={38} />
          <div>
            <strong>{post.artistName}</strong>
            <span>{timeAgo(post.createdAt)}</span>
          </div>
        </Link>
        {!isSelf && (
          <button
            className={`follow-pill ${isFollowing ? 'following' : ''}`}
            onClick={() => onToggleFollow(post)}
          >
            {isFollowing ? 'Following' : 'Follow'}
          </button>
        )}
      </div>

      <Link to={`/artwork/${post.id}`} className="post-media" style={{ background: post.color || '#C8C8E8' }}>
        {post.status === 'for_sale' && post.price && (
          <span className="post-price-tag"><Tag size={12} /> ${post.price}</span>
        )}
      </Link>

      <div className="post-actions">
        <button className={`post-icon-btn ${liked ? 'liked' : ''}`} onClick={() => onToggleLike(post)}>
          <Heart size={22} fill={liked ? 'currentColor' : 'none'} />
        </button>
        <Link to={`/artwork/${post.id}`} className="post-icon-btn">
          <MessageCircle size={22} />
        </Link>
        {post.status === 'for_sale' && (
          <Link to={`/artwork/${post.id}`} className="post-icon-btn post-marketplace-btn" title="View in Marketplace">
            <ShoppingBag size={22} />
          </Link>
        )}
      </div>

      <div className="post-meta">
        <strong>{formatLikes(post.likes)} likes</strong>
        <p><Link to={`/profile/${post.artistUsername || ''}`} className="post-caption-author">{post.artistName}</Link> {post.title}</p>
        {post.description && <p className="post-caption">{post.description}</p>}
        <Link to={`/artwork/${post.id}`} className="post-view-comments">View details &amp; comments</Link>
      </div>
    </article>
  );
}

export default function Feed() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [followingIds, setFollowingIds] = useState([]);
  const [likedIds, setLikedIds] = useState([]);
  const [showComposer, setShowComposer] = useState(false);

  const loadFeed = () => {
    setLoading(true);
    Promise.all([
      api.get('/feed'),
      api.get('/users/me/following').catch(() => []),
      api.get('/users/me/likes').catch(() => []),
    ])
      .then(([feedPosts, following, likes]) => {
        setPosts(feedPosts);
        setFollowingIds(following);
        setLikedIds(likes);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadFeed(); }, []);

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
    try {
      const data = await api.post(`/artworks/${post.id}/like`);
      setPosts(prev => prev.map(p => p.id === post.id ? { ...p, likes: data.likes } : p));
      setLikedIds(prev => data.liked ? [...prev, post.id] : prev.filter(id => id !== post.id));
    } catch {}
  };

  return (
    <div className="feed-page page-wrapper">
      <div className="container feed-container">
        <div className="composer-bar card" onClick={() => setShowComposer(true)}>
          <Avatar seed={(user?.firstName||'')+(user?.lastName||'')} size={40} />
          <span>Share what you're working on...</span>
          <button className="btn-primary composer-btn" onClick={(e) => { e.stopPropagation(); setShowComposer(true); }}>
            <ImagePlus size={16} /> Post
          </button>
        </div>

        {loading ? (
          <div className="feed-skeletons">
            {[1,2,3].map(i => (
              <div key={i} className="post-card card post-skeleton">
                <div className="skeleton" style={{width:'38px',height:'38px',borderRadius:'50%',margin:'16px'}} />
                <div className="skeleton" style={{width:'100%',aspectRatio:'1'}} />
              </div>
            ))}
          </div>
        ) : posts.length > 0 ? (
          <div className="posts-list">
            {posts.map(post => (
              <Post
                key={post.id}
                post={post}
                isFollowing={followingIds.includes(post.artistId)}
                onToggleFollow={handleToggleFollow}
                liked={likedIds.includes(post.id)}
                onToggleLike={handleToggleLike}
                isSelf={user && post.artistId === user.id}
              />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <span>🎨</span>
            <h3>Your feed is empty</h3>
            <p>Follow some artists or share your own work to get started</p>
          </div>
        )}
      </div>

      {showComposer && (
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
