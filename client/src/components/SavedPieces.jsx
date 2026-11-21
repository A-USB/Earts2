import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, TrendingDown } from 'lucide-react';
import { api } from '../utils/api';
import { getPriceDrop } from '../utils/priceDrop';
import ArtworkCard from './ArtworkCard';
import './SavedPieces.css';

/** The signed-in person's saved artworks, with a "price drops" filter and one-click removal. */
export default function SavedPieces({ items, onChange }) {
  const [dropsOnly, setDropsOnly] = useState(false);
  const [error, setError] = useState('');

  const dropCount = useMemo(() => items.filter(item => getPriceDrop(item)).length, [items]);
  const shown = dropsOnly ? items.filter(item => getPriceDrop(item)) : items;

  const unsave = async (artwork) => {
    setError('');
    try {
      const result = await api.post(`/artworks/${artwork.id}/save`);
      if (!result.saved) onChange(items.filter(item => item.id !== artwork.id));
    } catch (err) {
      setError(err.message || 'Unable to update your saved pieces.');
    }
  };

  if (items.length === 0) {
    return (
      <div className="empty-collection card">
        <Heart size={32} />
        <h4>No saved artworks yet</h4>
        <p>Save pieces you love and we’ll tell you when their price drops or they become available.</p>
        <Link to="/marketplace" className="btn-outline">Explore Marketplace</Link>
      </div>
    );
  }

  return (
    <div className="saved-pieces">
      <div className="saved-toolbar">
        <span className="saved-count"><strong>{shown.length}</strong> saved {shown.length === 1 ? 'piece' : 'pieces'}</span>
        <button
          type="button"
          className={`saved-chip${dropsOnly ? ' active' : ''}`}
          onClick={() => setDropsOnly(value => !value)}
          aria-pressed={dropsOnly}
          disabled={dropCount === 0 && !dropsOnly}
        >
          <TrendingDown size={14} /> Price drops{dropCount > 0 ? ` (${dropCount})` : ''}
        </button>
      </div>

      {error && <p className="saved-error" role="alert">{error}</p>}

      {shown.length > 0 ? (
        <div className="profile-artworks-grid">
          {shown.map(artwork => (
            <ArtworkCard
              key={artwork.id}
              artwork={artwork}
              className="profile-art-card-wrap"
              saved
              onToggleSave={unsave}
            />
          ))}
        </div>
      ) : (
        <div className="empty-collection card">
          <TrendingDown size={32} />
          <h4>No price drops right now</h4>
          <p>When an artist lowers the price of something you saved, it will show up here.</p>
          <button type="button" className="btn-outline" onClick={() => setDropsOnly(false)}>Show all saved pieces</button>
        </div>
      )}
    </div>
  );
}
