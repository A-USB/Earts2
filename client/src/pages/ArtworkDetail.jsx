import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Heart, Share2, ShoppingCart, ArrowLeft, Tag } from 'lucide-react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/Avatar';
import './ArtworkDetail.css';

export default function ArtworkDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [artwork, setArtwork] = useState(null);
  const [liked, setLiked] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/artworks/${id}`)
      .then(setArtwork)
      .catch(() => navigate('/marketplace'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleLike = async () => {
    if (!user) { navigate('/login'); return; }
    try {
      const data = await api.post(`/artworks/${id}/like`);
      setArtwork(prev => ({ ...prev, likes: data.likes }));
      setLiked(true);
    } catch {}
  };

  if (loading) return (
    <div className="container" style={{padding:'80px 24px'}}>
      <div className="skeleton" style={{width:'100%',height:'400px',borderRadius:'16px'}} />
    </div>
  );
  if (!artwork) return null;

  const formatLikes = n => n >= 1000 ? `${(n/1000).toFixed(1)}k` : n;

  return (
    <div className="artwork-detail-page page-wrapper">
      <div className="container">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> Back
        </button>

        <div className="artwork-detail-grid">
          <div className="artwork-display">
            <div className="artwork-canvas" style={{background: artwork.color || '#EEE'}}>
              <div className="canvas-overlay">
                <span>🖼️</span>
              </div>
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
          </div>

          <div className="artwork-info-panel">
            <div className="artwork-header">
              <span className="badge">{artwork.category}</span>
              <h1>{artwork.title}</h1>
              {artwork.year && <span className="artwork-year">{artwork.year}</span>}
            </div>

            {artwork.artist && (
              <Link to={`/profile/${artwork.artist.username}`} className="artist-link card">
                <Avatar seed={(artwork.artist.firstName||'')+(artwork.artist.lastName||'')} size={46} />
                <div>
                  <strong>{artwork.artist.firstName} {artwork.artist.lastName}</strong>
                  <span>{artwork.artist.role}</span>
                </div>
              </Link>
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
              <div className="meta-item"><span>Status</span><strong>{artwork.status === 'for_sale' ? 'Available' : 'Not for sale'}</strong></div>
            </div>

            {artwork.status === 'for_sale' && artwork.price && (
              <div className="purchase-section">
                <div className="price-display">
                  <Tag size={20} />
                  <span className="big-price">${artwork.price}</span>
                </div>
                <button className="btn-primary buy-btn">
                  <ShoppingCart size={18} /> Purchase artwork
                </button>
                <p className="purchase-note">
                  Secure transaction · Artist receives 85% of sale price
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
