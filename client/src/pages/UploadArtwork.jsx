import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, ImagePlus } from 'lucide-react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import './UploadArtwork.css';

const CATEGORIES = ['Painting','Digital','Illustration','Watercolour','Abstract','Sculpture','Mixed Media','Photography','Printmaking'];
const COLORS = ['#F4D03F','#58D68D','#00BCD4','#9B59B6','#E74C3C','#FF6B9D','#5B4BF5','#F39C12','#1ABC9C','#C0A882','#D4A574','#7D7D7D'];

export default function UploadArtwork() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Collector accounts don't sell art — send them back to the feed
  useEffect(() => {
    if (user && user.accountType === 'collector') navigate('/feed', { replace: true });
  }, [user, navigate]);

  const [form, setForm] = useState({
    title:'', description:'', category:'Digital', price:'',
    forSale: true, medium:'', year: new Date().getFullYear(), color: '#5B4BF5'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = k => e => setForm(p => ({...p, [k]: e.target.value}));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title) { setError('Title is required'); return; }
    if (form.forSale && (!form.price || Number(form.price) <= 0)) { setError('Enter a price to list it for sale'); return; }
    setLoading(true); setError('');
    try {
      const payload = {
        title: form.title, description: form.description, category: form.category,
        medium: form.medium, year: form.year, color: form.color,
        status: form.forSale ? 'for_sale' : 'not_for_sale',
        price: form.forSale ? parseFloat(form.price) || null : null,
      };
      const artwork = await api.post('/artworks', payload);
      navigate(`/artwork/${artwork.id}`);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  if (!user) { navigate('/login'); return null; }

  return (
    <div className="upload-page page-wrapper">
      <div className="container">
        <div className="upload-header">
          <h1>Upload artwork</h1>
          <p>This always posts to your Feed. Optionally list it for sale in the Marketplace too.</p>
        </div>

        <div className="upload-grid">
          <div className="upload-preview card">
            <div className="preview-area" style={{background: form.color}}>
              <div className="preview-placeholder">
                <ImagePlus size={40} />
                <span>Artwork preview</span>
                <small>Image upload coming soon</small>
              </div>
            </div>
            <div className="color-picker">
              <label>Choose a color for your artwork card</label>
              <div className="color-swatches">
                {COLORS.map(c => (
                  <button
                    key={c}
                    className={`swatch ${form.color === c ? 'active' : ''}`}
                    style={{background: c}}
                    onClick={() => setForm(p => ({...p, color: c}))}
                    type="button"
                  />
                ))}
              </div>
            </div>
          </div>

          <form className="upload-form" onSubmit={handleSubmit}>
            {error && <div className="auth-error">{error}</div>}

            <div className="form-group">
              <label>Title *</label>
              <input placeholder="e.g. Bloom Series IV" value={form.title} onChange={set('title')} required />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea rows={4} placeholder="Tell the story of this artwork..." value={form.description} onChange={set('description')} />
            </div>

            <div className="form-row2">
              <div className="form-group">
                <label>Category</label>
                <select value={form.category} onChange={set('category')}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Medium</label>
                <input placeholder="e.g. Watercolour, Procreate..." value={form.medium} onChange={set('medium')} />
              </div>
            </div>

            <div className="form-group">
              <label>Year</label>
              <input type="number" min="1900" max="2030" value={form.year} onChange={set('year')} />
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
                  <label>Price (USD)</label>
                  <input type="number" min="0" step="0.01" placeholder="e.g. 49.99" value={form.price} onChange={set('price')} />
                </div>
              )}
            </div>

            <div className="upload-actions">
              <button type="button" className="btn-ghost" onClick={() => navigate(-1)}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={loading}>
                <Upload size={16} /> {loading ? 'Uploading...' : 'Publish artwork'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
