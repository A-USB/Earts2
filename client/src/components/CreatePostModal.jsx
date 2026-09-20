import { useState } from 'react';
import { X, ImagePlus } from 'lucide-react';
import { api } from '../utils/api';
import './CreatePostModal.css';

const CATEGORIES = ['Painting','Digital','Illustration','Watercolour','Abstract','Sculpture','Mixed Media','Photography','Printmaking'];
const COLORS = ['#F4D03F','#58D68D','#00BCD4','#9B59B6','#E74C3C','#FF6B9D','#5B4BF5','#F39C12','#1ABC9C','#C0A882','#D4A574','#7D7D7D'];

export default function CreatePostModal({ onClose, onPosted }) {
  const [form, setForm] = useState({
    title: '', description: '', category: 'Digital', color: COLORS[0],
    forSale: false, price: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { setError('Give your post a title'); return; }
    if (form.forSale && (!form.price || Number(form.price) <= 0)) { setError('Enter a price to list it for sale'); return; }
    setLoading(true); setError('');
    try {
      const artwork = await api.post('/artworks', {
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        color: form.color,
        status: form.forSale ? 'for_sale' : 'not_for_sale',
        price: form.forSale ? Number(form.price) : null,
        medium: form.category,
        year: new Date().getFullYear(),
      });
      onPosted?.(artwork);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="post-overlay" onClick={onClose}>
      <div className="post-card" onClick={e => e.stopPropagation()}>
        <button className="purchase-close" onClick={onClose}><X size={18} /></button>
        <h3><ImagePlus size={18} /> Share new artwork</h3>

        <form onSubmit={handleSubmit} className="post-form">
          {error && <div className="auth-error">{error}</div>}

          <div className="color-picker-row">
            {COLORS.map(c => (
              <button
                type="button"
                key={c}
                className={`color-swatch ${form.color === c ? 'active' : ''}`}
                style={{ background: c }}
                onClick={() => setForm(p => ({ ...p, color: c }))}
              />
            ))}
          </div>

          <div className="form-group">
            <label>Title</label>
            <input placeholder="What did you make?" value={form.title} onChange={set('title')} required />
          </div>
          <div className="form-group">
            <label>Caption</label>
            <textarea rows={3} placeholder="Tell the story behind it..." value={form.description} onChange={set('description')} />
          </div>
          <div className="form-group">
            <label>Category</label>
            <select value={form.category} onChange={set('category')}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="for-sale-row">
            <label className="for-sale-toggle">
              <input
                type="checkbox"
                checked={form.forSale}
                onChange={e => setForm(p => ({ ...p, forSale: e.target.checked }))}
              />
              List this for sale in the Marketplace
            </label>
            {form.forSale && (
              <div className="form-group">
                <label>Price ($)</label>
                <input type="number" min="1" step="0.01" placeholder="e.g. 85" value={form.price} onChange={set('price')} required />
              </div>
            )}
          </div>

          <button type="submit" className="btn-primary post-submit" disabled={loading}>
            {loading ? 'Posting...' : 'Post to Feed'}
          </button>
        </form>
      </div>
    </div>
  );
}
