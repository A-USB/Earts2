import { useState } from 'react';
import { X, CreditCard, Lock, CheckCircle2 } from 'lucide-react';
import { api } from '../utils/api';
import './PurchaseModal.css';

function formatCardNumber(v) {
  return v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
}
function formatExpiry(v) {
  const digits = v.replace(/\D/g, '').slice(0, 4);
  if (digits.length < 3) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

export default function PurchaseModal({ artwork, onClose, onSuccess }) {
  const [form, setForm] = useState({ cardName: '', cardNumber: '', expiry: '', cvv: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const set = (k, formatter) => (e) => {
    const v = formatter ? formatter(e.target.value) : e.target.value;
    setForm(p => ({ ...p, [k]: v }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.cardNumber.replace(/\s/g, '').length < 12) { setError('Enter a valid card number'); return; }
    if (form.expiry.length < 5) { setError('Enter a valid expiry date'); return; }
    if (form.cvv.length < 3) { setError('Enter a valid CVV'); return; }
    setLoading(true);
    try {
      await api.post(`/artworks/${artwork.id}/purchase`, form);
      setDone(true);
      onSuccess?.();
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
            <h3>Purchase complete!</h3>
            <p>"{artwork.title}" is officially yours. The artist has been notified.</p>
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
              <h4><CreditCard size={16} /> Payment details</h4>
              {error && <div className="auth-error">{error}</div>}
              <div className="form-group">
                <label>Cardholder name</label>
                <input placeholder="Name on card" value={form.cardName} onChange={set('cardName')} required />
              </div>
              <div className="form-group">
                <label>Card number</label>
                <input
                  placeholder="1234 5678 9012 3456"
                  value={form.cardNumber}
                  onChange={set('cardNumber', formatCardNumber)}
                  inputMode="numeric"
                  required
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Expiry</label>
                  <input placeholder="MM/YY" value={form.expiry} onChange={set('expiry', formatExpiry)} inputMode="numeric" required />
                </div>
                <div className="form-group">
                  <label>CVV</label>
                  <input placeholder="123" value={form.cvv} onChange={set('cvv', v => v.replace(/\D/g,'').slice(0,4))} inputMode="numeric" required />
                </div>
              </div>
              <button type="submit" className="btn-primary purchase-submit" disabled={loading}>
                {loading ? 'Processing...' : `Pay $${artwork.price}`}
              </button>
              <p className="purchase-note"><Lock size={12} /> This is a demo checkout — no real payment is processed.</p>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
