import { useState } from 'react';
import { X, ShoppingBag, CheckCircle2, Info } from 'lucide-react';
import { api } from '../utils/api';
import './PurchaseModal.css';

export default function PurchaseModal({ artwork, onClose }) {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post(`/artworks/${artwork.id}/purchase`, {});
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="purchase-overlay" onClick={onClose}>
      <div className="purchase-card" onClick={e => e.stopPropagation()}>
        <button className="purchase-close" onClick={onClose}><X size={18} /></button>

        {done ? (
          <div className="purchase-success">
            <CheckCircle2 size={48} className="success-icon" />
            <h3>Demo order recorded</h3>
            <p>"{artwork.title}" was added to your demo purchase history. No payment was taken.</p>
            <button className="btn-primary" onClick={onClose}>Done</button>
          </div>
        ) : (
          <>
            <div className="purchase-summary">
              <div className="purchase-thumb" style={{ background: artwork.color || '#C8C8E8' }} />
              <div>
                <h3>{artwork.title}</h3>
                <span>by {artwork.artistName}</span>
              </div>
              <div className="purchase-price">${artwork.price}</div>
            </div>

            <form onSubmit={handleSubmit} className="purchase-form">
              <h4><ShoppingBag size={16} /> Review your demo order</h4>
              {error && <div className="auth-error">{error}</div>}
              <button type="submit" className="btn-primary purchase-submit" disabled={loading}>
                {loading ? 'Recording...' : `Confirm demo order · $${artwork.price}`}
              </button>
              <p className="purchase-note"><Info size={14} /> Demo mode only. No payment is collected or processed.</p>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
