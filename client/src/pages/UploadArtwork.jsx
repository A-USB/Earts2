import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload, ImagePlus, X, Users, Sparkles, Check,
  AlertCircle, FileImage, ShieldCheck, Eye
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

const COLORS = [
  '#6025EA', '#FF6B9D', '#58D68D', '#00BCD4', '#9B59B6',
  '#E74C3C', '#F39C12', '#1ABC9C', '#C0A882', '#2D3436', '#4F46E5', '#7D7D7D'
];

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
                    style={{ backgroundColor: form.color }}
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

              {/* Accent Color Picker for Card Background */}
              <div className="color-picker-section">
                <div className="color-picker-header">
                  <label>Background Accent</label>
                  <span className="color-hex">{form.color}</span>
                </div>
                <div className="color-swatches-grid">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className={`swatch-btn ${form.color === c ? 'active' : ''}`}
                      style={{ background: c }}
                      onClick={() => setForm((p) => ({ ...p, color: c }))}
                    >
                      {form.color === c && <Check size={13} color="#fff" />}
                    </button>
                  ))}
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
