import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Edit2, Share2, Plus, Heart, ShoppingBag, Pin, PinOff, FolderPlus,
  X, Camera, MapPin, Sparkles, Palette, MessageSquare, Check, Layers
} from 'lucide-react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/Avatar';
import './Profile.css';
import '../components/PurchaseModal.css';
import '../components/CreatePostModal.css';

// Deterministic pseudo-random aspect ratio per artwork, so the grid reads as masonry
const HEIGHT_VARIANTS = [1, 1.3, 0.8, 1.15, 0.9, 1.4, 1.05];
function heightRatio(id) {
  const n = String(id).split('').reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  return HEIGHT_VARIANTS[n % HEIGHT_VARIANTS.length];
}

function ArtCard({ artwork, isOwn, onTogglePin }) {
  return (
    <div className="profile-art-card-wrap">
      <Link to={`/artwork/${artwork.id}`} className="profile-art-card">
        <div
          className="profile-art-thumb"
          style={{ background: artwork.color || '#DDD', aspectRatio: `1 / ${heightRatio(artwork.id)}` }}
        />
        <div className="profile-art-info">
          <span>{artwork.title}</span>
          {artwork.status === 'for_sale' ? <strong>${artwork.price}</strong> : <em>{artwork.status === 'sold' ? 'Sold' : 'Not for sale'}</em>}
        </div>
      </Link>
      {isOwn && onTogglePin && (
        <button
          className={`pin-toggle-btn ${artwork.pinned ? 'active' : ''}`}
          title={artwork.pinned ? 'Unpin from profile' : 'Pin to profile'}
          onClick={(e) => { e.preventDefault(); onTogglePin(artwork); }}
        >
          {artwork.pinned ? <PinOff size={14} /> : <Pin size={14} />}
        </button>
      )}
    </div>
  );
}

function NewCollectionModal({ artworks, onClose, onCreated }) {
  const [name, setName] = useState('');
  const [selected, setSelected] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const toggle = (id) => setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim()) { setError('Give the collection a name'); return; }
    if (selected.length === 0) { setError('Pick at least one artwork'); return; }
    setLoading(true); setError('');
    try {
      const collection = await api.post('/collections', { name: name.trim(), artworkIds: selected });
      onCreated({ ...collection, artworks: artworks.filter(a => selected.includes(a.id)) });
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="purchase-overlay" onClick={onClose}>
      <div className="post-card" onClick={e => e.stopPropagation()}>
        <button className="purchase-close" onClick={onClose}><X size={18} /></button>
        <h3><FolderPlus size={18} /> New collection</h3>
        <form onSubmit={submit} className="post-form">
          {error && <div className="auth-error">{error}</div>}
          <div className="form-group">
            <label>Collection name</label>
            <input placeholder="e.g. Cityscapes, Early work..." value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Pick artworks ({selected.length} selected)</label>
            <div className="collection-picker">
              {artworks.map(a => (
                <button
                  type="button"
                  key={a.id}
                  className={`collection-pick-item ${selected.includes(a.id) ? 'selected' : ''}`}
                  style={{ background: a.color }}
                  onClick={() => toggle(a.id)}
                >
                  {selected.includes(a.id) && <span className="pick-check">✓</span>}
                </button>
              ))}
            </div>
          </div>
          <button type="submit" className="btn-primary post-submit" disabled={loading}>
            {loading ? 'Creating...' : 'Create collection'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function Profile() {
  const { username } = useParams();
  const { user: me } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [artworks, setArtworks] = useState([]);
  const [tab, setTab] = useState('All');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // Collector-only data (own profile)
  const [saved, setSaved] = useState([]);
  const [orders, setOrders] = useState([]);
  const [collectorTab, setCollectorTab] = useState('Saved');

  // Artist-only extras
  const [collections, setCollections] = useState([]);
  const [showNewCollection, setShowNewCollection] = useState(false);

  // Follow state (viewing someone else)
  const [isFollowing, setIsFollowing] = useState(false);
  const [followBusy, setFollowBusy] = useState(false);

  const isOwn = Boolean(me && (me.username === username || (profile && me.id === profile.id)));
  const isCollector = profile?.accountType === 'collector';

  useEffect(() => {
    if (!username || username === 'undefined') {
      if (me?.username) {
        navigate(`/profile/${me.username}`, { replace: true });
      }
      return;
    }
    setLoading(true);
    api.get(`/users/${username}`)
      .then(data => { setProfile(data); setArtworks(data.artworks || []); })
      .catch((err) => {
        console.error('Failed to load user profile:', username, err);
        setProfile(null);
      })
      .finally(() => setLoading(false));
  }, [username, me]);

  useEffect(() => {
    if (isOwn && isCollector) {
      api.get('/users/me/saved').then(setSaved).catch(() => {});
      api.get('/users/me/orders').then(setOrders).catch(() => {});
    }
  }, [isOwn, isCollector]);

  useEffect(() => {
    if (profile && !isCollector) {
      api.get(`/users/${username}/collections`).then(setCollections).catch(() => {});
    }
  }, [profile, isCollector, username]);

  useEffect(() => {
    if (me && profile && !isOwn) {
      api.get('/users/me/following')
        .then(ids => setIsFollowing(ids.includes(profile.id)))
        .catch(() => {});
    }
  }, [me, profile, isOwn]);

  const handleFollowToggle = async () => {
    if (!me) { navigate('/login'); return; }
    setFollowBusy(true);
    try {
      const data = isFollowing
        ? await api.post(`/users/${username}/unfollow`)
        : await api.post(`/users/${username}/follow`);
      setIsFollowing(data.following);
      setProfile(prev => ({ ...prev, followers: data.followers }));
    } catch {}
    finally { setFollowBusy(false); }
  };

  const handleTogglePin = async (artwork) => {
    try {
      const data = await api.post(`/artworks/${artwork.id}/pin`);
      setArtworks(prev => prev.map(a => ({
        ...a,
        pinned: a.id === artwork.id ? data.pinned : false
      })));
    } catch {}
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  if (loading) return (
    <div className="profile-loading container">
      <div className="skeleton" style={{ width: '100%', height: '260px', borderRadius: '16px', marginBottom: '24px' }} />
      <div className="skeleton" style={{ width: '100%', height: '400px', borderRadius: '16px' }} />
    </div>
  );

  if (!profile) {
    return (
      <div className="profile-page page-wrapper">
        <div className="container profile-container">
          <div className="empty-collection card" style={{ padding: '60px 24px', margin: '40px auto', maxWidth: '520px', textAlign: 'center' }}>
            <span style={{ fontSize: '48px', display: 'block', marginBottom: '12px' }}>🎨</span>
            <h3 style={{ fontSize: '22px', color: 'var(--navy)', marginBottom: '8px' }}>Artist not found</h3>
            <p style={{ color: 'var(--text-mid)', fontSize: '14px', marginBottom: '24px', lineHeight: '1.6' }}>
              The profile for <strong>@{username || 'unknown'}</strong> could not be found. The server data may have restarted or the username is different.
            </p>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
              {me?.username && (
                <Link to={`/profile/${me.username}`} className="btn-primary">
                  Go to My Profile
                </Link>
              )}
              <Link to="/marketplace" className="btn-outline">
                Browse Marketplace
              </Link>
              <Link to="/feed" className="btn-ghost">
                Explore Feed
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const pinnedArtwork = artworks.find(a => a.pinned);
  const filtered = tab === 'All' ? artworks
    : tab === 'For Sale' ? artworks.filter(a => a.status === 'for_sale')
    : tab === 'Sold' ? artworks.filter(a => a.status === 'sold')
    : [];

  const formatNum = n => (n >= 1000 ? `${(n/1000).toFixed(1)}k` : n);

  const statItems = isCollector
    ? (isOwn
        ? [
            { label: 'Followers', value: formatNum(profile.followers) },
            { label: 'Following', value: profile.following },
            { label: 'Saved Pieces', value: saved.length },
            { label: 'Purchases', value: orders.length },
          ]
        : [
            { label: 'Followers', value: formatNum(profile.followers) },
            { label: 'Following', value: profile.following },
          ])
    : [
        { label: 'Artworks', value: artworks.length },
        { label: 'Followers', value: formatNum(profile.followers) },
        { label: 'Following', value: profile.following },
        { label: 'Artworks Sold', value: profile.artworksSold },
      ];

  // Cover mosaic: built from the artist's own artwork colors when available
  const mosaicColors = !isCollector && artworks.length > 0
    ? Array.from({ length: 10 }, (_, i) => artworks[i % artworks.length].color || '#8878E8')
    : null;

  return (
    <div className="profile-page page-wrapper">
      <div className="container profile-container">
        
        {/* ================= 1. LINKEDIN-INSPIRED HERO CARD ================= */}
        <div className="profile-hero-card card">
          {/* Cover Banner */}
          <div
            className="profile-cover"
            style={!mosaicColors ? { background: profile.coverColor || 'linear-gradient(135deg, #5B4BF5 0%, #FF6B9D 100%)' } : undefined}
          >
            {mosaicColors ? (
              <div className="profile-cover-mosaic">
                {mosaicColors.map((c, i) => <div key={i} className="mosaic-tile" style={{ background: c }} />)}
                <div className="mosaic-scrim" />
              </div>
            ) : (
              <div className="cover-shapes">
                <div className="cover-shape cs1" />
                <div className="cover-shape cs2" />
                <div className="cover-shape cs3" />
              </div>
            )}

            {isOwn && (
              <Link to="/settings" className="cover-edit-btn" title="Customize banner & theme in Settings">
                <Camera size={14} />
                <span>Edit cover</span>
              </Link>
            )}
          </div>

          {/* Profile Header Body */}
          <div className="profile-header-body">
            {/* Top row: Overlapping Avatar on left, Action Buttons on right */}
            <div className="profile-avatar-row">
              <div className="profile-avatar-wrapper">
                <Avatar
                  seed={profile.firstName + profile.lastName}
                  src={profile.avatar}
                  size={128}
                  className="profile-avatar-img"
                />
                {isOwn && (
                  <Link to="/settings" className="avatar-edit-badge" title="Change avatar in settings">
                    <Camera size={15} />
                  </Link>
                )}
              </div>

              <div className="profile-header-actions">
                {isOwn ? (
                  <>
                    <Link to="/settings" className="btn-primary profile-action-btn">
                      <Edit2 size={15} /> Edit profile
                    </Link>
                    {!isCollector && (
                      <Link to="/upload" className="btn-outline profile-action-btn">
                        <Plus size={15} /> Upload piece
                      </Link>
                    )}
                    <button className="btn-ghost profile-action-icon" onClick={handleShare} title="Share profile link">
                      {copied ? <Check size={16} color="#27AE60" /> : <Share2 size={16} />}
                      {copied && <span className="copied-tooltip">Copied!</span>}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className={isFollowing ? 'btn-outline profile-action-btn' : 'btn-primary profile-action-btn'}
                      onClick={handleFollowToggle}
                      disabled={followBusy}
                    >
                      {isFollowing ? 'Following' : 'Follow'}
                    </button>
                    <button
                      className="btn-outline profile-action-btn"
                      onClick={() => alert(`Direct messaging with ${profile.firstName} is coming soon!`)}
                    >
                      <MessageSquare size={15} /> Message
                    </button>
                    <button className="btn-ghost profile-action-icon" onClick={handleShare} title="Share profile link">
                      {copied ? <Check size={16} color="#27AE60" /> : <Share2 size={16} />}
                      {copied && <span className="copied-tooltip">Copied!</span>}
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Profile Identity (Name below avatar, headline, location, tags, stats) */}
            <div className="profile-identity">
              <div className="profile-name-row">
                <h1 className="profile-fullname">{profile.firstName} {profile.lastName}</h1>
                <span className={`profile-badge-pill ${isCollector ? 'collector-pill' : 'artist-pill'}`}>
                  {isCollector ? <Sparkles size={12} /> : <Palette size={12} />}
                  {isCollector ? 'Collector' : profile.role || 'Artist'}
                </span>
              </div>

              <div className="profile-headline-row">
                <span className="profile-handle">@{profile.username}</span>
                {profile.location && (
                  <span className="profile-location">
                    <MapPin size={14} /> {profile.location}
                  </span>
                )}
              </div>

              {profile.bio && (
                <p className="profile-headline-bio">{profile.bio}</p>
              )}

              {/* LinkedIn-style Quick Stats Strip */}
              <div className="profile-stats-strip">
                {statItems.map(s => (
                  <div key={s.label} className="stat-strip-item">
                    <span className="stat-strip-val">{s.value}</span>
                    <span className="stat-strip-lbl">{s.label}</span>
                  </div>
                ))}
              </div>

              {/* Tags row */}
              {!isCollector && profile.tags?.length > 0 && (
                <div className="profile-tags-row">
                  {profile.tags.map(t => (
                    <span key={t} className="profile-tag-pill">{t}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ================= 2. LOWER CONTENT (2-COLUMN LAYOUT) ================= */}
        <div className="profile-main-grid">
          
          {/* Left Column: Details & Capabilities */}
          <aside className="profile-sidebar-col">
            {/* About Card */}
            {profile.bio && (
              <div className="profile-info-card card">
                <h4 className="info-card-title">About</h4>
                <p className="info-card-text">{profile.bio}</p>
              </div>
            )}

            {/* Tools & Media */}
            {!isCollector && profile.tools?.length > 0 && (
              <div className="profile-info-card card">
                <h4 className="info-card-title">Tools &amp; Mediums</h4>
                <div className="profile-tools-wrap">
                  {profile.tools.map(t => (
                    <span key={t} className="tool-pill">{t}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Available For */}
            {!isCollector && profile.availableFor?.length > 0 && (
              <div className="profile-info-card card">
                <h4 className="info-card-title">Available For</h4>
                <ul className="avail-check-list">
                  {profile.availableFor.map(a => <li key={a}>{a}</li>)}
                </ul>
              </div>
            )}
          </aside>

          {/* Right Column: Main Showcase & Portfolio */}
          <div className="profile-content-col">
            {isCollector ? (
              isOwn ? (
                <>
                  <div className="artwork-section-header">
                    <h3>Collection</h3>
                    <div className="artwork-tabs">
                      {['Saved', 'Purchases'].map(t => (
                        <button
                          key={t}
                          className={`art-tab ${collectorTab === t ? 'active' : ''}`}
                          onClick={() => setCollectorTab(t)}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  {collectorTab === 'Saved' ? (
                    saved.length > 0 ? (
                      <div className="profile-artworks-grid">
                        {saved.map(a => <ArtCard key={a.id} artwork={a} />)}
                      </div>
                    ) : (
                      <div className="empty-collection card">
                        <Heart size={32} />
                        <h4>No saved artworks yet</h4>
                        <p>Artworks you save or like while browsing will appear here.</p>
                        <Link to="/marketplace" className="btn-outline">Explore Marketplace</Link>
                      </div>
                    )
                  ) : (
                    orders.length > 0 ? (
                      <div className="profile-artworks-grid">
                        {orders.map(o => o.artwork && <ArtCard key={o.id} artwork={{ ...o.artwork, price: o.price }} />)}
                      </div>
                    ) : (
                      <div className="empty-collection card">
                        <ShoppingBag size={32} />
                        <h4>No purchases yet</h4>
                        <p>Original art pieces you acquire from artists will be securely recorded here.</p>
                        <Link to="/marketplace" className="btn-outline">Explore Marketplace</Link>
                      </div>
                    )
                  )}
                </>
              ) : (
                <div className="empty-collection card">
                  <Sparkles size={32} />
                  <p>{profile.firstName} is here to discover and collect original art.</p>
                </div>
              )
            ) : (
              <>
                {/* Pinned Showcase Piece */}
                {pinnedArtwork && (
                  <div className="pinned-showcase card">
                    <span className="pinned-badge"><Pin size={12} /> Featured Showcase</span>
                    <Link to={`/artwork/${pinnedArtwork.id}`} className="pinned-card">
                      <div className="pinned-thumb" style={{ background: pinnedArtwork.color }} />
                      <div className="pinned-info">
                        <div>
                          <h4>{pinnedArtwork.title}</h4>
                          <span className="pinned-sub">{pinnedArtwork.medium || pinnedArtwork.category}</span>
                        </div>
                        {pinnedArtwork.status === 'for_sale' && <span className="pinned-price">${pinnedArtwork.price}</span>}
                      </div>
                    </Link>
                    {isOwn && (
                      <button className="btn-outline unpin-btn" onClick={() => handleTogglePin(pinnedArtwork)}>
                        <PinOff size={14} /> Unpin
                      </button>
                    )}
                  </div>
                )}

                {/* Portfolio Navigation Tabs */}
                <div className="artwork-section-header">
                  <h3>Portfolio</h3>
                  <div className="artwork-tabs">
                    {['All', 'For Sale', 'Sold', 'Collections'].map(t => (
                      <button
                        key={t}
                        className={`art-tab ${tab === t ? 'active' : ''}`}
                        onClick={() => setTab(t)}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {tab === 'Collections' ? (
                  <>
                    {isOwn && (
                      <button className="btn-outline new-collection-btn" onClick={() => setShowNewCollection(true)}>
                        <FolderPlus size={16} /> New collection
                      </button>
                    )}
                    {collections.length === 0 ? (
                      <div className="empty-collection card">
                        <Layers size={32} />
                        <h4>No collections yet</h4>
                        <p>{isOwn ? 'Organize your portfolio into curated themed series or exhibitions.' : `${profile.firstName} hasn't published any collections yet.`}</p>
                        {isOwn && (
                          <button className="btn-primary" onClick={() => setShowNewCollection(true)}>
                            <Plus size={16} /> Create your first collection
                          </button>
                        )}
                      </div>
                    ) : (
                      collections.map(c => (
                        <div key={c.id} className="collection-block">
                          <div className="collection-header">
                            <h4>{c.name}</h4>
                            <span className="collection-count">{c.artworks?.length || 0} pieces</span>
                          </div>
                          <div className="profile-artworks-grid">
                            {c.artworks?.map(a => <ArtCard key={a.id} artwork={a} />)}
                          </div>
                        </div>
                      ))
                    )}
                  </>
                ) : (
                  <div className="profile-artworks-grid">
                    {filtered.map(a => (
                      <ArtCard key={a.id} artwork={a} isOwn={isOwn} onTogglePin={handleTogglePin} />
                    ))}
                    {isOwn && (
                      <Link to="/upload" className="add-artwork-card">
                        <Plus size={28} />
                        <span>Upload new piece</span>
                      </Link>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

      </div>

      {showNewCollection && (
        <NewCollectionModal
          artworks={artworks}
          onClose={() => setShowNewCollection(false)}
          onCreated={(c) => { setCollections(prev => [...prev, c]); setShowNewCollection(false); }}
        />
      )}
    </div>
  );
}
