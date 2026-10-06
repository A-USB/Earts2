import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload, ImagePlus, X, Users, Sparkles, Check,
  AlertCircle, FileImage, ShieldCheck, Eye, Palette, Pipette,
  Copy, CheckCheck, Sliders
} from 'lucide-react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/Avatar';
import './UploadArtwork.css';

const CATEGORIES = [
  'Painting', 'Digital', 'Illustration', 'Watercolour',
  'Abstract', 'Sculpture', 'Mixed Media', 'Photography', 'Printmaking'
];

const COLLAB_ROLES = [
  'Co-Creator', 'Illustrator', 'Colorist', 'Line Artist',
  '3D Sculptor', 'Art Director', 'Concept Artist', 'Visual Designer'
];

const COLOR_CATEGORIES = {
  vibrant: {
    label: 'Vibrant & Bold',
    colors: [
      '#6025EA', '#7C3AED', '#8B5CF6', '#A855F7', '#C026D3',
      '#EC4899', '#FF6B9D', '#F43F5E', '#EF4444', '#FF6B35',
      '#F97316', '#F59E0B', '#F1C40F', '#84CC16', '#10B981',
      '#1ABC9C', '#00BCD4', '#0EA5E9', '#3B82F6', '#4F46E5',
      '#6366F1', '#D946EF', '#FB7185', '#E11D48'
    ]
  },
  pastels: {
    label: 'Pastels & Neutrals',
    colors: [
      '#FFFFFF', '#F8FAFC', '#F1F5F9', '#E2E8F0', '#94A3B8', '#64748B',
      '#475569', '#334155', '#1E293B', '#0F172A', '#0B0B16', '#16162C',
      '#FEE2E2', '#FFEDD5', '#FEF08A', '#ECFCCB', '#D1FAE5', '#CFFAFE',
      '#E0E7FF', '#EDE9FE', '#FAE8FF', '#FFE4E6', '#C0A882', '#A39171'
    ]
  },
  gradients: {
    label: 'Gradients & Glow',
    colors: [
      'linear-gradient(135deg, #6025EA 0%, #FF6B9D 100%)',
      'linear-gradient(135deg, #FF6B35 0%, #F59E0B 100%)',
      'linear-gradient(135deg, #00BCD4 0%, #3B82F6 100%)',
      'linear-gradient(135deg, #10B981 0%, #06B6D4 100%)',
      'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
      'linear-gradient(135deg, #F43F5E 0%, #F97316 100%)',
      'linear-gradient(135deg, #5B4BF5 0%, #00BCD4 100%)',
      'linear-gradient(135deg, #111827 0%, #374151 100%)',
      'linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)',
      'linear-gradient(135deg, #06B6D4 0%, #10B981 100%)',
      'linear-gradient(135deg, #6366F1 0%, #A855F7 100%)',
      'linear-gradient(135deg, #FB7185 0%, #818CF8 100%)'
    ]
  }
};

const QUICK_ACCENTS = [
  { name: 'Cosmic Violet', value: '#6025EA' },
  { name: 'Electric Pink', value: '#FF6B9D' },
  { name: 'Neon Flame', value: '#FF6B35' },
  { name: 'Cyber Cyan', value: '#00BCD4' },
  { name: 'Emerald', value: '#10B981' },
  { name: 'Deep Onyx', value: '#0B0B16' },
  { name: 'Studio Slate', value: '#1E293B' },
  { name: 'Pure White', value: '#FFFFFF' },
];

function hslToHex(h, s, l) {
  l /= 100;
  const a = (s * Math.min(l, 1 - l)) / 100;
  const f = (n) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`.toUpperCase();
}

export default function UploadArtwork() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // Collector accounts don't sell art — send them back to the feed
  useEffect(() => {
    if (user && user.accountType === 'collector') {
      navigate('/feed', { replace: true });
    }
  }, [user, navigate]);

  // Form State
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'Digital',
    price: '',
    forSale: true,
    medium: '',
    year: new Date().getFullYear(),
    color: '#6025EA',
  });

  // Image Upload State
  const [imageData, setImageData] = useState(null);
  const [imageMeta, setImageMeta] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [previewFit, setPreviewFit] = useState('contain'); // 'contain' | 'cover'

  // Collaborator Search & Tagging State
  const [allUsers, setAllUsers] = useState([]);
  const [collabSearch, setCollabSearch] = useState('');
  const [collaborators, setCollaborators] = useState([]);
  const [selectedRole, setSelectedRole] = useState('Co-Creator');
  const [showCollabDropdown, setShowCollabDropdown] = useState(false);

  const [colorTab, setColorTab] = useState('vibrant');
  const [spectrumHue, setSpectrumHue] = useState(260);
  const [copiedHex, setCopiedHex] = useState(false);

  const hasEyeDropper = typeof window !== 'undefined' && 'EyeDropper' in window;

  const handleEyeDropper = async () => {
    if (hasEyeDropper) {
      try {
        const eyeDropper = new window.EyeDropper();
        const result = await eyeDropper.open();
        if (result?.sRGBHex) {
          setForm((p) => ({ ...p, color: result.sRGBHex.toUpperCase() }));
        }
      } catch {
        // User cancelled picker
      }
    }
  };

  const handleCopyHex = () => {
    if (form.color) {
      navigator.clipboard.writeText(form.color);
      setCopiedHex(true);
      setTimeout(() => setCopiedHex(false), 1600);
    }
  };

  const handleHueSliderChange = (e) => {
    const val = Number(e.target.value);
    setSpectrumHue(val);
    const newHex = hslToHex(val, 85, 55);
    setForm((p) => ({ ...p, color: newHex }));
  };

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch registered users for collaborator tagging
  useEffect(() => {
    api.get('/users')
      .then(users => {
        // Exclude current logged in user from co-creator list
        const others = users.filter(u => u.id !== user?.id && u.accountType === 'artist');
        setAllUsers(others);
      })
      .catch(() => {});
  }, [user?.id]);

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  // Handle File Selection (Drag & Drop or Picker)
  const processFile = (file) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file (PNG, JPG, WEBP, GIF, SVG).');
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setError('Image size exceeds 25MB limit. Please upload a smaller file.');
      return;
    }

    setError('');
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      setImageData(dataUrl);

      // Extract image dimensions
      const img = new Image();
      img.onload = () => {
        setImageMeta({
          name: file.name,
          size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
          width: img.width,
          height: img.height,
          aspectRatio: (img.width / img.height).toFixed(2),
        });
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const removeImage = () => {
    setImageData(null);
    setImageMeta(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Add Collaborator
  const addCollaborator = (targetUser) => {
    if (collaborators.some(c => c.id === targetUser.id)) return;
    setCollaborators(prev => [
      ...prev,
      {
        id: targetUser.id,
        username: targetUser.username,
        name: `${targetUser.firstName} ${targetUser.lastName}`,
        avatar: targetUser.avatar,
        role: selectedRole,
      }
    ]);
    setCollabSearch('');
    setShowCollabDropdown(false);
  };

  const removeCollaborator = (id) => {
    setCollaborators(prev => prev.filter(c => c.id !== id));
  };

  const filteredUsers = allUsers.filter(u => {
    const query = collabSearch.toLowerCase();
    const matchesQuery =
      u.username.toLowerCase().includes(query) ||
      `${u.firstName} ${u.lastName}`.toLowerCase().includes(query);
    const notAlreadyAdded = !collaborators.some(c => c.id === u.id);
    return matchesQuery && notAlreadyAdded;
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title) {
      setError('Artwork title is required.');
      return;
    }
    if (form.forSale && (!form.price || Number(form.price) <= 0)) {
      setError('Please enter a valid price to list your artwork for sale.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        title: form.title,
        description: form.description,
        category: form.category,
        medium: form.medium,
        year: form.year,
        color: form.color,
        imageUrl: imageData || null,
        status: form.forSale ? 'for_sale' : 'not_for_sale',
        price: form.forSale ? parseFloat(form.price) || null : null,
        collaborators: collaborators,
      };

      const artwork = await api.post('/artworks', payload);
      navigate(`/artwork/${artwork.id}`);
    } catch (err) {
      setError(err.message || 'Failed to publish artwork');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="upload-page page-wrapper">
      <div className="container">
        <div className="upload-header">
          <div>
            <h1>Create & Upload Artwork</h1>
            <p>Publish your high-resolution artwork to the community feed, collaborate with fellow artists, and list in the marketplace.</p>
          </div>
        </div>

        <div className="upload-grid">
          {/* LEFT: Image Dropzone & Preview */}
          <div className="upload-media-column">
            <div className="upload-media-card card">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png, image/jpeg, image/webp, image/gif, image/svg+xml"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />

              {!imageData ? (
                <div
                  className={`dropzone-box ${isDragging ? 'dragging' : ''}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="dropzone-content">
                    <div className="dropzone-icon-wrap">
                      <ImagePlus size={38} className="dropzone-icon" />
                    </div>
                    <h3>Drag and drop your artwork</h3>
                    <p>High-resolution PNG, JPG, WEBP, or SVG (up to 25MB)</p>
                    <button type="button" className="btn-secondary dropzone-browse-btn">
                      Browse Files
                    </button>
                  </div>
                </div>
              ) : (
                <div className="preview-container">
                  <div
                    className="preview-viewport"
                    style={{ background: form.color }}
                  >
                    <img
                      src={imageData}
                      alt="Artwork upload preview"
                      className={`uploaded-image fit-${previewFit}`}
                    />
                    <div className="preview-overlay-controls">
                      <button
                        type="button"
                        className="preview-toggle-fit"
                        onClick={() => setPreviewFit(p => p === 'contain' ? 'cover' : 'contain')}
                        title={`Switch to ${previewFit === 'contain' ? 'Cover' : 'Fit'} mode`}
                      >
                        <Eye size={14} /> {previewFit === 'contain' ? 'Fill Frame' : 'Fit Frame'}
                      </button>
                      <button
                        type="button"
                        className="preview-remove-btn"
                        onClick={removeImage}
                        title="Remove artwork image"
                      >
                        <X size={15} /> Remove
                      </button>
                    </div>
                  </div>

                  {imageMeta && (
                    <div className="image-meta-bar">
                      <div className="meta-item">
                        <FileImage size={14} />
                        <span>{imageMeta.name}</span>
                      </div>
                      <div className="meta-badges">
                        <span className="meta-badge">{imageMeta.width} × {imageMeta.height} px</span>
                        <span className="meta-badge">{imageMeta.size}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Multi-Category Accent Color Palette & Interactive Spectrum Studio */}
              <div className="color-picker-section">
                <div className="color-picker-header">
                  <div className="color-picker-title-wrap">
                    <div className="color-picker-icon-badge">
                      <Palette size={16} />
                    </div>
                    <div>
                      <label className="color-section-label">Backdrop Accent & Spectrum</label>
                      <span className="color-section-desc">Frames your art with ambient backlighting</span>
                    </div>
                  </div>

                  {/* Active Color Pill Badge with 1-click copy */}
                  <button
                    type="button"
                    className="color-status-pill"
                    title="Click to copy color code"
                    onClick={handleCopyHex}
                  >
                    <span className="color-status-preview" style={{ background: form.color }} />
                    <span className="color-status-text">
                      {form.color.startsWith('linear') ? 'Gradient Aura' : form.color.toUpperCase()}
                    </span>
                    <span className="color-copy-btn">
                      {copiedHex ? <CheckCheck size={12} className="copy-success-icon" /> : <Copy size={12} />}
                    </span>
                  </button>
                </div>

                {/* Interactive Continuous Rainbow Hue Spectrum Slider */}
                <div className="spectrum-slider-card">
                  <div className="spectrum-slider-header">
                    <span className="spectrum-slider-title">
                      <Sliders size={13} /> Continuous Hue Spectrum
                    </span>
                    <span className="spectrum-slider-degree">{spectrumHue}° Hue</span>
                  </div>
                  <div className="spectrum-track-wrap">
                    <input
                      type="range"
                      min="0"
                      max="360"
                      value={spectrumHue}
                      onChange={handleHueSliderChange}
                      className="spectrum-range-slider"
                      aria-label="Spectrum Hue Slider"
                    />
                    <div
                      className="spectrum-active-glow"
                      style={{
                        background: form.color.startsWith('linear')
                          ? 'var(--primary)'
                          : form.color
                      }}
                    />
                  </div>
                </div>

                {/* Palette Category Switcher Tabs */}
                <div className="color-tabs">
                  {Object.entries(COLOR_CATEGORIES).map(([key, cat]) => (
                    <button
                      key={key}
                      type="button"
                      className={`color-tab-btn ${colorTab === key ? 'active' : ''}`}
                      onClick={() => setColorTab(key)}
                    >
                      <span>{cat.label}</span>
                      <span className="color-tab-count">{cat.colors.length}</span>
                    </button>
                  ))}
                </div>

                {/* Active Category Swatches */}
                <div className="color-swatches-grid">
                  {COLOR_CATEGORIES[colorTab].colors.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className={`swatch-btn ${form.color === c ? 'active' : ''} ${c.startsWith('linear') ? 'is-gradient' : ''}`}
                      style={{ background: c }}
                      title={c}
                      onClick={() => setForm((p) => ({ ...p, color: c }))}
                    >
                      {form.color === c && <Check size={13} className="swatch-check-icon" />}
                    </button>
                  ))}
                </div>

                {/* Quick Theme Accents Strip */}
                <div className="quick-accents-strip">
                  <span className="quick-accents-label">Quick Presets:</span>
                  <div className="quick-accents-list">
                    {QUICK_ACCENTS.map((item) => (
                      <button
                        key={item.value}
                        type="button"
                        className={`quick-accent-chip ${form.color.toLowerCase() === item.value.toLowerCase() ? 'active' : ''}`}
                        onClick={() => setForm((p) => ({ ...p, color: item.value }))}
                        title={item.name}
                      >
                        <span className="quick-accent-dot" style={{ background: item.value }} />
                        <span>{item.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Eyedropper & Hex Studio */}
                <div className="custom-color-studio">
                  <div className="custom-actions-left">
                    {hasEyeDropper && (
                      <button
                        type="button"
                        className="eyedropper-tool-btn"
                        onClick={handleEyeDropper}
                        title="Sample color directly from uploaded image or screen"
                      >
                        <Pipette size={14} />
                        <span>Eyedropper</span>
                      </button>
                    )}
                  </div>

                  <div className="hex-input-studio">
                    <div className="hex-input-box">
                      <span className="hex-prefix">#</span>
                      <input
                        type="text"
                        maxLength={6}
                        placeholder="RRGGBB"
                        value={form.color.startsWith('#') ? form.color.replace('#', '') : ''}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9a-fA-F]/g, '').slice(0, 6);
                          setForm((p) => ({ ...p, color: `#${val}` }));
                        }}
                        className="hex-text-input"
                      />
                      {form.color.startsWith('#') && form.color.length === 7 && (
                        <span className="hex-valid-dot" style={{ background: form.color }} />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Artwork Metadata & Collaboration Form */}
          <div className="upload-form-column">
            <form className="upload-details-form card" onSubmit={handleSubmit}>
              {error && (
                <div className="upload-error-banner">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              {/* Section 1: Artwork Basics */}
              <div className="form-section">
                <h3 className="form-section-title">Artwork Information</h3>

                <div className="form-group">
                  <label>Title *</label>
                  <input
                    type="text"
                    placeholder="e.g. Celestial Symphony No. 3"
                    value={form.title}
                    onChange={set('title')}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    rows={4}
                    placeholder="Tell the story, inspiration, and techniques behind this piece..."
                    value={form.description}
                    onChange={set('description')}
                  />
                </div>

                <div className="form-row-2">
                  <div className="form-group">
                    <label>Category</label>
                    <select value={form.category} onChange={set('category')}>
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Medium / Tools</label>
                    <input
                      type="text"
                      placeholder="e.g. Oil on Linen, Blender, Procreate"
                      value={form.medium}
                      onChange={set('medium')}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Year Created</label>
                  <input
                    type="number"
                    min="1900"
                    max="2035"
                    value={form.year}
                    onChange={set('year')}
                  />
                </div>
              </div>

              {/* Section 2: Artist Collaboration (Co-Creation) */}
              <div className="form-section collab-section">
                <div className="collab-section-header">
                  <div className="collab-title-wrap">
                    <Users size={18} className="collab-icon" />
                    <div>
                      <h4>Co-Creators & Artist Collaboration</h4>
                      <p>Credit multiple artists who worked on this piece with you.</p>
                    </div>
                  </div>
                </div>

                {/* Selected Collaborator Chips */}
                {collaborators.length > 0 && (
                  <div className="collab-chips-list">
                    {collaborators.map((c) => (
                      <div key={c.id} className="collab-chip">
                        <Avatar name={c.name} size={24} />
                        <div className="collab-chip-info">
                          <span className="collab-chip-name">{c.name}</span>
                          <span className="collab-chip-role">{c.role}</span>
                        </div>
                        <button
                          type="button"
                          className="collab-chip-remove"
                          onClick={() => removeCollaborator(c.id)}
                          title="Remove collaborator"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Search & Tag Collaborators */}
                <div className="collab-search-container">
                  <div className="collab-inputs-row">
                    <div className="collab-search-input-wrap">
                      <input
                        type="text"
                        placeholder="Search artist by name or @username..."
                        value={collabSearch}
                        onChange={(e) => {
                          setCollabSearch(e.target.value);
                          setShowCollabDropdown(true);
                        }}
                        onFocus={() => setShowCollabDropdown(true)}
                      />
                    </div>
                    <select
                      className="collab-role-select"
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value)}
                    >
                      {COLLAB_ROLES.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Dropdown search results */}
                  {showCollabDropdown && collabSearch.trim() && (
                    <div className="collab-results-dropdown">
                      {filteredUsers.length > 0 ? (
                        filteredUsers.map((u) => (
                          <button
                            key={u.id}
                            type="button"
                            className="collab-user-result"
                            onClick={() => addCollaborator(u)}
                          >
                            <Avatar name={`${u.firstName} ${u.lastName}`} size={28} />
                            <div className="collab-result-text">
                              <span className="collab-result-name">{u.firstName} {u.lastName}</span>
                              <span className="collab-result-handle">@{u.username} • {u.role}</span>
                            </div>
                            <span className="collab-add-btn">+ Add</span>
                          </button>
                        ))
                      ) : (
                        <div className="collab-no-results">
                          No matching artists found
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Section 3: Marketplace & Sales */}
              <div className="form-section">
                <h3 className="form-section-title">Marketplace & Pricing</h3>

                <div className="for-sale-card">
                  <label className="for-sale-toggle-label">
                    <input
                      type="checkbox"
                      checked={form.forSale}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, forSale: e.target.checked }))
                      }
                    />
                    <div className="for-sale-text">
                      <strong>List for Sale in Marketplace</strong>
                      <p>Collectors and buyers can purchase this artwork directly from your profile & marketplace.</p>
                    </div>
                  </label>

                  {form.forSale && (
                    <div className="price-input-container">
                      <label>Listing Price (USD) *</label>
                      <div className="price-input-wrap">
                        <span className="currency-prefix">$</span>
                        <input
                          type="number"
                          min="1"
                          step="0.01"
                          placeholder="e.g. 150.00"
                          value={form.price}
                          onChange={set('price')}
                          required={form.forSale}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Publish Action Buttons */}
              <div className="upload-actions-bar">
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => navigate(-1)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary publish-btn"
                  disabled={loading}
                >
                  <Upload size={16} />
                  {loading ? 'Publishing Artwork...' : 'Publish Artwork'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
