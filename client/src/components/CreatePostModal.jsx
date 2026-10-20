import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ImagePlus, SlidersHorizontal } from 'lucide-react';
import { api } from '../utils/api';
import { CATEGORIES, buildArtworkPayload, emptyArtworkForm, validateArtwork } from '../utils/artwork';
import ImageDropzone from './ImageDropzone';
import './CreatePostModal.css';

// "Hang something new": the quick way to put a piece on the wall. It runs on the same
// image processing, rules and payload as the full Upload page, and can hand its draft over to it.
export default function CreatePostModal({ onClose, onPosted }) {
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyArtworkForm());
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleImage = (next) => {
    setImage(next);
    // The backdrop colour now comes from the artwork itself
    if (next) setForm(p => ({ ...p, color: next.color }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const problem = validateArtwork(form, image?.dataUrl);
    if (problem) { setError(problem); return; }
    setLoading(true);
    setError('');
    try {
      const artwork = await api.post('/artworks', buildArtworkPayload(form, image.dataUrl));
      onPosted?.(artwork);
    } catch (err) {
      setError(err.message || 'Unable to post right now. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Carry everything over so nothing has to be typed twice
  const openFullEditor = () => {
    navigate('/upload', { state: { draft: { form, image } } });
  };

  return (
    <div className="post-overlay" onClick={onClose}>
      <div className="create-modal-card" role="dialog" aria-modal="true" aria-label="Hang something new" onClick={e => e.stopPropagation()}>
        <button type="button" className="purchase-close" onClick={onClose} aria-label="Close"><X size={18} /></button>
        <h3><ImagePlus size={18} aria-hidden="true" /> Hang something new</h3>

        <form onSubmit={handleSubmit} className="post-form">
          {error && <div className="auth-error" role="alert">{error}</div>}

          <ImageDropzone image={image} onChange={handleImage} />

          <div className="form-group">
            <label htmlFor="cp-title">Title</label>
            <input id="cp-title" placeholder="What did you make?" value={form.title} onChange={set('title')} maxLength={120} />
          </div>
          <div className="form-group">
            <label htmlFor="cp-caption">Caption</label>
            <textarea id="cp-caption" rows={3} placeholder="Tell the story behind it..." value={form.description} onChange={set('description')} maxLength={3000} />
          </div>
          <div className="form-group">
            <label htmlFor="cp-category">Category</label>
            <select id="cp-category" value={form.category} onChange={set('category')}>
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
                <label htmlFor="cp-price">Price ($)</label>
                <input id="cp-price" type="number" min="0.01" max="1000000000" step="0.01" placeholder="e.g. 85" value={form.price} onChange={set('price')} />
              </div>
            )}
          </div>

          <button type="submit" className="btn-primary post-submit" disabled={loading}>
            {loading ? 'Hanging it up…' : 'Hang it on the wall'}
          </button>
          <button type="button" className="post-more-btn" onClick={openFullEditor}>
            <SlidersHorizontal size={15} aria-hidden="true" /> Add more details: medium, year, co-creators, backdrop
          </button>
        </form>
      </div>
    </div>
  );
}
