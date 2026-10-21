import { Link } from 'react-router-dom';
import { Bookmark, Droplet, ShoppingCart, Users } from 'lucide-react';
import './ArtworkCard.css';

const formatCount = n => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : (n || 0));

// The wall card in its compact form: a framed piece with a gallery label hanging below it.
// Used by the Marketplace, Gallery, Home, Dashboard and Profile so artwork looks the same everywhere.
export default function ArtworkCard({
  artwork,
  onClick,
  onBuyClick,
  saved = false,
  onToggleSave,
  actions = null,      // extra controls shown on the frame (e.g. the owner's pin button)
  showArtist = true,
  className = '',
}) {
  const collabs = artwork.collaborators?.length
    ? artwork.collaborators.map(c => c.name || c.username).join(', ')
    : null;
  const hasImage = Boolean(artwork.imageUrl);

  const status = artwork.status === 'for_sale'
    ? { key: 'avail', text: `$${artwork.price}` }
    : artwork.status === 'sold'
      ? { key: 'sold', text: 'Sold' }
      : { key: 'off', text: 'Not for sale' };

  return (
    <article className={`wc ${className}`.trim()}>
      <div className="wc-mat">
        <div className={`wc-frame ${hasImage ? '' : 'flat'}`} style={hasImage ? undefined : { background: artwork.color || '#C8C8E8' }}>
          {hasImage && <img src={artwork.imageUrl} alt="" loading="lazy" decoding="async" />}
        </div>
      </div>

      {actions && <div className="wc-actions">{actions}</div>}

      <div className="wc-label">
        <h3 className="wc-title">
          <Link to={`/artwork/${artwork.id}`} onClick={onClick} title={artwork.title}>{artwork.title}</Link>
        </h3>

        {(showArtist || collabs) && (
          <p className="wc-by">
            {showArtist && <span>by {artwork.artistName}</span>}
            {collabs && (
              <span className="wc-collab" title={`Collaboration with ${collabs}`}>
                <Users size={12} aria-hidden="true" /> × {collabs}
              </span>
            )}
          </p>
        )}

        <div className="wc-row">
          <span className="wc-status"><i className={`wc-dot ${status.key}`} aria-hidden="true" />{status.text}</span>
          {onBuyClick && artwork.status === 'for_sale' && (
            <button type="button" className="wc-buy" onClick={() => onBuyClick(artwork)}>
              <ShoppingCart size={14} aria-hidden="true" /> Buy
            </button>
          )}
          <span className="wc-likes" aria-label={`${artwork.likes || 0} drops`}>
            <Droplet size={13} aria-hidden="true" /> {formatCount(artwork.likes)}
          </span>
          {onToggleSave && (
            <button
              type="button"
              className={`wc-save ${saved ? 'saved' : ''}`}
              onClick={() => onToggleSave(artwork)}
              title={saved ? 'Remove from saved artworks' : 'Save artwork'}
              aria-label={saved ? 'Remove from saved artworks' : 'Save artwork'}
              aria-pressed={saved}
            >
              <Bookmark size={18} fill={saved ? 'currentColor' : 'none'} />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
