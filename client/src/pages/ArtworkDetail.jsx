import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Heart, Share2, ShoppingCart, ArrowLeft, Tag, MessageCircle, Send } from 'lucide-react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/Avatar';
import PurchaseModal from '../components/PurchaseModal';
import './ArtworkDetail.css';

const STATUS_LABEL = { for_sale: 'Available', not_for_sale: 'Not for sale', sold: 'Sold' };

export default function ArtworkDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [artwork, setArtwork] = useState(null);
  const [liked, setLiked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showPurchase, setShowPurchase] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [postingComment, setPostingComment] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get(`/artworks/${id}`),
      api.get(`/artworks/${id}/comments`).catch(() => []),
      user ? api.get('/users/me/likes').catch(() => []) : Promise.resolve([]),
    ])
      .then(([art, cmts, myLikes]) => {
        setArtwork(art);
        setComments(cmts);
        setLiked(myLikes.includes(art.id));
      })
      .catch(() => navigate('/marketplace'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleLike = async () => {
    if (!user) { navigate('/login'); return; }
    try {
      const data = await api.post(`/artworks/${id}/like`);
      setArtwork(prev => ({ ...prev, likes: data.likes }));
      setLiked(data.liked);
    } catch {}
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!user) { navigate('/login'); return; }
    if (!commentText.trim()) return;
    setPostingComment(true);
    try {
      const c = await api.post(`/artworks/${id}/comments`, { text: commentText.trim() });
      setComments(prev => [...prev, c]);
      setCommentText('');
    } catch {}
    finally { setPostingComment(false); }
  };

  if (loading) return (
    <div className="container" style={{padding:'80px 24px'}}>
      <div className="skeleton" style={{width:'100%',height:'400px',borderRadius:'16px'}} />
    </div>
  );
  if (!artwork) return null;

  const formatLikes = n => n >= 1000 ? `${(n/1000).toFixed(1)}k` : n;
  const isOwnArtwork = user && artwork.artistId === user.id;

  return (
    <div className="artwork-detail-page page-wrapper">
      <div className="container">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> Back
        </button>

        <div className="artwork-detail-grid">
          <div className="artwork-display">
            <div className="artwork-canvas" style={{background: artwork.color || '#EEE'}}>
              {artwork.imageUrl ? (
                <img src={artwork.imageUrl} alt={artwork.title} className="detail-canvas-img" />
              ) : (
                <div className="canvas-overlay">
                  <span>🖼️</span>
                </div>
              )}
            </div>
            <div className="artwork-actions-bar">
              <button className={`like-btn ${liked ? 'liked' : ''}`} onClick={handleLike}>
                <Heart size={18} fill={liked ? 'currentColor' : 'none'} />
                {formatLikes(artwork.likes)} likes
              </button>
              <button className="share-btn btn-ghost">
                <Share2 size={16} /> Share
              </button>
            </div>

            <div className="comments-section card">
              <h4><MessageCircle size={16} /> Comments ({comments.length})</h4>
              <div className="comments-list">
                {comments.length === 0 && <p className="no-comments">No comments yet — be the first to say something.</p>}
                {comments.map(c => (
                  <div key={c.id} className="comment-item">
                    <Avatar seed={c.userName} size={32} />
                    <div>
                      <strong>{c.userName}</strong>
                      <p>{c.text}</p>
                    </div>
                  </div>
                ))}
              </div>
              <form className="comment-form" onSubmit={handleComment}>
                <input
                  placeholder={user ? 'Add a comment...' : 'Sign in to comment'}
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  disabled={!user}
                />
                <button type="submit" className="icon-btn" disabled={postingComment || !user}>
                  <Send size={16} />
                </button>
              </form>
            </div>
          </div>

          <div className="artwork-info-panel">
            <div className="artwork-header">
              <span className="badge">{artwork.category}</span>
              <h1>{artwork.title}</h1>
              {artwork.year && <span className="artwork-year">{artwork.year}</span>}
            </div>

            {artwork.artist && (
              <div className="artists-involved-block">
                <span className="artist-role-label">Lead Artist</span>
                <Link to={`/profile/${artwork.artist.username}`} className="artist-link card">
                  <Avatar seed={(artwork.artist.firstName||'')+(artwork.artist.lastName||'')} size={46} />
                  <div>
                    <strong>{artwork.artist.firstName} {artwork.artist.lastName}</strong>
                    <span>{artwork.artist.role}</span>
                  </div>
                </Link>

                {artwork.collaborators && artwork.collaborators.length > 0 && (
                  <div className="collaborators-detail-section">
                    <span className="artist-role-label">Co-Creators & Collaborators</span>
                    <div className="collaborators-detail-list">
                      {artwork.collaborators.map((c) => (
                        <Link
                          key={c.id}
                          to={`/profile/${c.username}`}
                          className="collab-detail-card card"
                        >
                          <Avatar name={c.name} size={36} />
                          <div className="collab-detail-text">
                            <strong>{c.name}</strong>
                            <span className="collab-role-tag">{c.role}</span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {artwork.description && (
              <div className="artwork-desc">
                <h4>About this artwork</h4>
                <p>{artwork.description}</p>
              </div>
            )}

            <div className="artwork-meta-grid">
              {artwork.medium && <div className="meta-item"><span>Medium</span><strong>{artwork.medium}</strong></div>}
              {artwork.year && <div className="meta-item"><span>Year</span><strong>{artwork.year}</strong></div>}
              <div className="meta-item"><span>Category</span><strong>{artwork.category}</strong></div>
              <div className="meta-item"><span>Status</span><strong>{STATUS_LABEL[artwork.status] || 'Not for sale'}</strong></div>
            </div>

            {artwork.status === 'for_sale' && artwork.price && !isOwnArtwork && (
              <div className="purchase-section">
                <div className="price-display">
                  <Tag size={20} />
                  <span className="big-price">${artwork.price}</span>
                </div>
                <button className="btn-primary buy-btn" onClick={() => user ? setShowPurchase(true) : navigate('/login')}>
                  <ShoppingCart size={18} /> Purchase artwork
                </button>
                <p className="purchase-note">
                  Secure transaction · Artist receives 85% of sale price
                </p>
              </div>
            )}

            {artwork.status === 'sold' && (
              <div className="purchase-section">
                <p className="purchase-note" style={{textAlign:'center'}}>This piece has already been sold.</p>
              </div>
            )}

            {isOwnArtwork && artwork.status === 'for_sale' && (
              <div className="purchase-section">
                <p className="purchase-note" style={{textAlign:'center'}}>This is your own artwork — listed for ${artwork.price}.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {showPurchase && (
        <PurchaseModal
          artwork={artwork}
          onClose={() => setShowPurchase(false)}
          onSuccess={() => setArtwork(prev => ({ ...prev, status: 'sold' }))}
        />
      )}
    </div>
  );
}
