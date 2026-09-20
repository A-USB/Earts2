import { Heart, Tag, ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';
import './ArtworkCard.css';

export default function ArtworkCard({ artwork, onClick, onBuyClick }) {
  const formatLikes = (n) => n >= 1000 ? `${(n/1000).toFixed(1)}k` : n;

  return (
    <Link to={`/artwork/${artwork.id}`} className="artwork-card card" onClick={onClick}>
      <div className="artwork-thumb" style={{ background: artwork.color || '#C8C8E8' }}>
        <div className="artwork-overlay">
          <span className="artwork-category badge">{artwork.category}</span>
        </div>
        {onBuyClick && artwork.status === 'for_sale' && (
          <button
            className="quick-buy-btn"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onBuyClick(artwork); }}
          >
            <ShoppingCart size={14} /> Buy
          </button>
        )}
      </div>
      <div className="artwork-info">
        <h3 className="artwork-title">{artwork.title}</h3>
        <span className="artwork-artist">by {artwork.artistName}</span>
        <div className="artwork-meta">
          <div className="artwork-price">
            {artwork.status === 'for_sale'
              ? <><Tag size={13} /> <strong>${artwork.price}</strong></>
              : <span className="not-for-sale">{artwork.status === 'sold' ? 'Sold' : 'Not for sale'}</span>
            }
          </div>
          <div className="artwork-likes">
            <Heart size={13} />
            <span>{formatLikes(artwork.likes)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
