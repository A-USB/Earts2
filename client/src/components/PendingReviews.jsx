import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import ReviewModal from './ReviewModal';
import './PendingReviews.css';

/** "Rate your purchases": delivered orders and completed commissions that have no review yet. Hidden when there are none. */
export default function PendingReviews() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [target, setTarget] = useState(null);

  useEffect(() => {
    if (!user) return undefined;
    let cancelled = false;
    api.get('/reviews/pending')
      .then(data => { if (!cancelled) setItems(Array.isArray(data) ? data : []); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [user]);

  if (items.length === 0 && !target) return null;

  return (
    <>
      {items.length > 0 && (
        <section className="pending-reviews" aria-label="Purchases waiting for a review">
          <div className="pending-reviews-head">
            <Star size={18} />
            <div>
              <h4>How did it go?</h4>
              <p>Rate {items.length === 1 ? 'this artist' : 'these artists'} to help others choose.</p>
            </div>
          </div>
          <ul>
            {items.map(item => (
              <li key={`${item.source}-${item.sourceId}`}>
                <div className="pending-reviews-text">
                  <strong>{item.title}</strong>
                  <span>
                    {item.source === 'commission' ? 'Commission' : 'Purchase'} from{' '}
                    <Link to={`/profile/${item.artist.username}`}>{item.artist.name}</Link>
                  </span>
                </div>
                <button
                  type="button"
                  className="btn-outline"
                  onClick={() => setTarget({ source: item.source, sourceId: item.sourceId, title: item.title, artistName: item.artist.name })}
                >
                  Write a review
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
      {target && (
        <ReviewModal
          target={target}
          onClose={() => setTarget(null)}
          onSaved={() => setItems(current => current.filter(item => !(item.source === target.source && item.sourceId === target.sourceId)))}
        />
      )}
    </>
  );
}
