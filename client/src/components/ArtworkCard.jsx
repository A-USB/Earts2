import { Heart, Tag } from 'lucide-react';
import { Link } from 'react-router-dom';
import './ArtworkCard.css';

export default function ArtworkCard({ artwork, onClick }) {
  const formatLikes = (n) => n >= 1000 ? `${(n/1000).toFixed(1)}k` : n;

  return (
    <Link to={`/artwork/${artwork.id}`} className="artwork-card card" onClick={onClick}>
      <div className="artwork-thumb" style={{ background: artwork.color || '#C8C8E8' }}>
        <div className="artwork-overlay">
          <span className="artwork-category badge">{artwork.category}</span>
        </div>
      </div>
      <div className="artwork-info">
        <h3 className="artwork-title">{artwork.title}</h3>
        <span className="artwork-artist">by {artwork.artistName}</span>
        <div className="artwork-meta">
          <div className="artwork-price">
            {artwork.status === 'not_for_sale'
              ? <span className="not-for-sale">Not for sale</span>
              : <><Tag size={13} /> <strong>${artwork.price}</strong></>
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
