import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Search, SlidersHorizontal, X, ShoppingBag, Sparkles, Users, ArrowRight, Eye, SearchX, Hash, Plus, Check } from 'lucide-react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import ArtworkCard from '../components/ArtworkCard';
import PurchaseModal from '../components/PurchaseModal';
import Avatar from '../components/Avatar';
import LoadError from '../components/LoadError';
import { normalizeTag, isValidTag } from '../utils/tags';
import './Marketplace.css';
import IconTile from '../components/IconTile';

const CATEGORIES = [
  'All', 'Painting', 'Digital', 'Illustration',
  'Watercolour', 'Abstract', 'Sculpture', 'Mixed Media', 'Photography'
];

const SORTS = [
  { id: 'latest', label: 'Latest' },
  { id: 'liked', label: 'Most Liked' },
  { id: 'price_asc', label: 'Price: Low to High' },
  { id: 'price_desc', label: 'Price: High to Low' },
];

const STATUS_OPTIONS = [
  { id: '', label: 'Any' },
  { id: 'for_sale', label: 'For sale' },
  { id: 'not_for_sale', label: 'Exhibition only' },
  { id: 'sold', label: 'Sold' },
];

const PRICE_PRESETS = [
  { label: 'Under $100', min: '', max: '100' },
  { label: '$100 – $500', min: '100', max: '500' },
  { label: '$500 – $1,000', min: '500', max: '1000' },
  { label: 'Over $1,000', min: '1000', max: '' },
];

const money = (value) => `$${Number(value).toLocaleString()}`;

export default function Marketplace() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [artworks, setArtworks] = useState([]);
  const [featuredArtists, setFeaturedArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  // Filter Modes: 'for_sale' (Marketplace shop) | 'all' (Full Exhibition & Discovery)
  // Everything below is mirrored in the URL, so a search can be shared or reopened with the back button.
  const [viewMode, setViewMode] = useState(searchParams.get('mode') === 'all' ? 'all' : 'for_sale');
  const [category, setCategory] = useState(CATEGORIES.includes(searchParams.get('category')) ? searchParams.get('category') : 'All');
  const [search, setSearch] = useState((searchParams.get('search') || '').slice(0, 100));
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [sort, setSort] = useState(SORTS.some(s => s.id === searchParams.get('sort')) ? searchParams.get('sort') : 'latest');
  const [status, setStatus] = useState(STATUS_OPTIONS.some(s => s.id && s.id === searchParams.get('status')) ? searchParams.get('status') : '');
  const [tag, setTag] = useState(() => {
    const fromUrl = normalizeTag(searchParams.get('tag') || '');
    return isValidTag(fromUrl) ? fromUrl : '';
  });
  const [popularTags, setPopularTags] = useState([]);
  const [tagFollowing, setTagFollowing] = useState(false);
  const [tagBusy, setTagBusy] = useState(false);
  const [minPrice, setMinPrice] = useState(searchParams.get('min') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('max') || '');
  const [filtersOpen, setFiltersOpen] = useState(Boolean(searchParams.get('min') || searchParams.get('max') || searchParams.get('status')));
  const [buyTarget, setBuyTarget] = useState(null);
  const [savedIds, setSavedIds] = useState([]);

  const priceError = minPrice !== '' && maxPrice !== '' && Number(minPrice) > Number(maxPrice)
    ? 'The minimum price can’t be higher than the maximum.'
    : '';

  // Wait for a pause in typing before asking the server
  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  // Keep the address bar in step with the filters
  useEffect(() => {
    const next = new URLSearchParams();
    if (debouncedSearch.trim()) next.set('search', debouncedSearch.trim());
    if (category !== 'All') next.set('category', category);
    if (viewMode !== 'for_sale') next.set('mode', viewMode);
    if (sort !== 'latest') next.set('sort', sort);
    if (status && viewMode === 'all') next.set('status', status);
    if (tag) next.set('tag', tag);
    if (minPrice) next.set('min', minPrice);
    if (maxPrice) next.set('max', maxPrice);
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, category, viewMode, sort, status, minPrice, maxPrice, tag]);

  // Popular tags for discovery, loaded once
  useEffect(() => {
    let cancelled = false;
    api.get('/tags/popular?limit=10').then(list => { if (!cancelled) setPopularTags(list); }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  // Whether the signed-in person follows the tag being browsed
  useEffect(() => {
    if (!tag || !user) { setTagFollowing(false); return undefined; }
    let cancelled = false;
    api.get(`/tags/${encodeURIComponent(tag)}`).then(info => { if (!cancelled) setTagFollowing(Boolean(info.following)); }).catch(() => {});
    return () => { cancelled = true; };
  }, [tag, user]);

  const toggleTagFollow = async () => {
    if (!user) { navigate('/login'); return; }
    setTagBusy(true);
    try {
      const result = await api.post(`/tags/${encodeURIComponent(tag)}/follow`);
      setTagFollowing(result.following);
    } catch (error) {
      console.error('Failed to follow tag:', error);
    } finally {
      setTagBusy(false);
    }
  };

  useEffect(() => {
    if (!user) { setSavedIds([]); return; }
    api.get('/users/me/saved/ids').then(setSavedIds).catch(() => setSavedIds([]));
  }, [user]);

  const handleToggleSave = async (artwork) => {
    if (!user) { navigate('/login'); return; }
    try {
      const result = await api.post(`/artworks/${artwork.id}/save`);
      setSavedIds(current => result.saved
        ? (current.includes(artwork.id) ? current : [...current, artwork.id])
        : current.filter(id => id !== artwork.id));
    } catch (error) {
      console.error('Failed to save artwork:', error);
    }
  };

  // Featured creators only need loading once
  useEffect(() => {
    let cancelled = false;
    api.get('/users')
      .then(users => { if (!cancelled) setFeaturedArtists(users.filter(u => u.accountType === 'artist').slice(0, 5)); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  // Artworks are searched, filtered and sorted by the server
  useEffect(() => {
    if (priceError) { setLoading(false); return undefined; }
    let cancelled = false;
    setLoading(true);
    setLoadError('');

    const params = new URLSearchParams({ sort });
    if (category !== 'All') params.set('category', category);
    if (tag) params.set('tag', tag);
    if (debouncedSearch.trim()) params.set('search', debouncedSearch.trim());
    const effectiveStatus = viewMode === 'for_sale' ? 'for_sale' : status;
    if (effectiveStatus) params.set('status', effectiveStatus);
    if (minPrice) params.set('minPrice', minPrice);
    if (maxPrice) params.set('maxPrice', maxPrice);

    api.get(`/artworks?${params.toString()}`)
      .then(data => { if (!cancelled) setArtworks(Array.isArray(data) ? data : []); })
      .catch(error => { if (!cancelled) setLoadError(error.message || 'Unable to load the marketplace.'); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [category, debouncedSearch, sort, status, viewMode, minPrice, maxPrice, tag, priceError, refreshKey]);

  const cleanPrice = (value) => value.replace(/[^0-9.]/g, '').slice(0, 10);

  const activeFilters = useMemo(() => {
    const list = [];
    if (debouncedSearch.trim()) list.push({ key: 'search', label: `“${debouncedSearch.trim()}”`, clear: () => setSearch('') });
    if (category !== 'All') list.push({ key: 'category', label: category, clear: () => setCategory('All') });
    if (tag) list.push({ key: 'tag', label: `#${tag}`, clear: () => setTag('') });
    if (viewMode === 'all' && status) list.push({ key: 'status', label: STATUS_OPTIONS.find(s => s.id === status)?.label, clear: () => setStatus('') });
    if (minPrice || maxPrice) {
      const label = minPrice && maxPrice ? `${money(minPrice)} – ${money(maxPrice)}` : minPrice ? `From ${money(minPrice)}` : `Up to ${money(maxPrice)}`;
      list.push({ key: 'price', label, clear: () => { setMinPrice(''); setMaxPrice(''); } });
    }
    return list;
  }, [debouncedSearch, category, viewMode, status, minPrice, maxPrice, tag]);

  const panelFilterCount = (minPrice || maxPrice ? 1 : 0) + (viewMode === 'all' && status ? 1 : 0);

  const resetFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setCategory('All');
    setTag('');
    setStatus('');
    setMinPrice('');
    setMaxPrice('');
  };

  return (
    <div className="marketplace-page page-wrapper">
      {/* 1. Curated Hero Banner */}
      <div className="marketplace-hero">
        <div className="container">
          <span className="eyebrow">
            <Sparkles size={14} /> Earts Marketplace & Gallery
          </span>
          <h1>Buy Original Art & Explore Creations</h1>
          <p>
            Discover thousands of unique artworks directly from independent artists, or shop original pieces for your collection.
          </p>

          <div className="marketplace-search-box">
            <Search size={18} className="search-icon" />
            <input
              placeholder="Search artworks, artists, mediums..."
              aria-label="Search artworks"
              value={search}
              onChange={e => setSearch(e.target.value)}
              maxLength={100}
            />
            {search && (
              <button type="button" onClick={() => setSearch('')} className="clear-search-btn" aria-label="Clear search">
                <X size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="container marketplace-body">
        {/* 2. Featured Creators Strip */}
        {featuredArtists.length > 0 && activeFilters.length === 0 && !search && (
          <div className="featured-creators-strip">
            <div className="creators-strip-header">
              <div className="creators-title">
                <Users size={18} className="creators-icon" />
                <h3>Featured Creators & Studios</h3>
              </div>
              <span className="creators-sub">Independent artists selling and showcasing on Earts</span>
            </div>

            <div className="creators-grid">
              {featuredArtists.map(artist => (
                <Link
                  key={artist.id}
                  to={`/profile/${artist.username}`}
                  className="creator-card card"
                >
                  <Avatar seed={artist.avatarSeed || `${artist.firstName}${artist.lastName}`} src={artist.avatar} size={40} />
                  <div className="creator-card-info">
                    <strong>{artist.firstName} {artist.lastName}</strong>
                    <span>{artist.role} • {artist.location || 'Global'}</span>
                  </div>
                  <ArrowRight size={15} className="creator-arrow" />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* 3. View Mode Toggle + Category Pills */}
        <div className="marketplace-controls-bar">
          <div className="mode-toggle-group">
            <button
              className={`mode-toggle-btn ${viewMode === 'for_sale' ? 'active' : ''}`}
              onClick={() => setViewMode('for_sale')}
            >
              <ShoppingBag size={15} /> For Sale
            </button>
            <button
              className={`mode-toggle-btn ${viewMode === 'all' ? 'active' : ''}`}
              onClick={() => setViewMode('all')}
            >
              <Eye size={15} /> All Artworks & Exhibition
            </button>
          </div>

          <div className="category-tabs">
            {CATEGORIES.map(c => (
              <button
                key={c}
                className={`cat-tab ${category === c ? 'active' : ''}`}
                onClick={() => setCategory(c)}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="marketplace-right-actions">
            <select
              value={sort}
              onChange={e => setSort(e.target.value)}
              className="sort-select"
              aria-label="Sort artworks"
            >
              {SORTS.map(s => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
            <button
              className={`filter-btn btn-outline ${filtersOpen ? 'active' : ''}`}
              onClick={() => setFiltersOpen(open => !open)}
              aria-expanded={filtersOpen}
            >
              <SlidersHorizontal size={15} /> Filters
              {panelFilterCount > 0 && <span className="filter-badge">{panelFilterCount}</span>}
            </button>
          </div>
        </div>

        {popularTags.length > 0 && (
          <div className="tag-strip" aria-label="Popular tags">
            <span className="tag-strip-label"><Hash size={13} /> Popular tags</span>
            {popularTags.map(item => (
              <button
                key={item.tag}
                type="button"
                className={`tag-strip-chip${tag === item.tag ? ' active' : ''}`}
                aria-pressed={tag === item.tag}
                onClick={() => { setTag(tag === item.tag ? '' : item.tag); setViewMode('all'); }}
              >
                #{item.tag} <small>{item.count}</small>
              </button>
            ))}
          </div>
        )}

        {/* 4. Filter Panel */}
        {filtersOpen && (
          <div className="filters-panel card">
            <div className="filters-panel-grid">
              <div className="filter-group">
                <label htmlFor="mk-min-price">Price range (USD)</label>
                <div className="price-inputs">
                  <div className="price-field">
                    <span aria-hidden="true">$</span>
                    <input
                      id="mk-min-price"
                      type="number"
                      inputMode="decimal"
                      min="0"
                      placeholder="Min"
                      value={minPrice}
                      onChange={e => setMinPrice(cleanPrice(e.target.value))}
                      aria-label="Minimum price"
                    />
                  </div>
                  <span className="price-dash" aria-hidden="true">–</span>
                  <div className="price-field">
                    <span aria-hidden="true">$</span>
                    <input
                      type="number"
                      inputMode="decimal"
                      min="0"
                      placeholder="Max"
                      value={maxPrice}
                      onChange={e => setMaxPrice(cleanPrice(e.target.value))}
                      aria-label="Maximum price"
                    />
                  </div>
                </div>
                {priceError && <p className="filter-error" role="alert">{priceError}</p>}
                <div className="price-presets">
                  {PRICE_PRESETS.map(p => (
                    <button
                      key={p.label}
                      type="button"
                      className={`preset-chip ${minPrice === p.min && maxPrice === p.max ? 'active' : ''}`}
                      onClick={() => { setMinPrice(p.min); setMaxPrice(p.max); }}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {viewMode === 'all' && (
                <div className="filter-group">
                  <label>Availability</label>
                  <div className="price-presets">
                    {STATUS_OPTIONS.map(s => (
                      <button
                        key={s.id || 'any'}
                        type="button"
                        className={`preset-chip ${status === s.id ? 'active' : ''}`}
                        onClick={() => setStatus(s.id)}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <p className="filter-hint">Price filters only match pieces that have a listed price.</p>
          </div>
        )}

        {/* Results summary + active filters */}
        <div className="results-line" aria-live="polite">
          <span>
            {loading ? 'Searching…' : (
              <><strong>{artworks.length}</strong> {artworks.length === 1 ? 'artwork' : 'artworks'}</>
            )}
          </span>
          {activeFilters.map(f => (
            <button key={f.key} type="button" className="active-chip" onClick={f.clear} aria-label={`Remove filter ${f.label}`}>
              {f.label} <X size={12} />
            </button>
          ))}
          {tag && (
            <button
              type="button"
              className={`tag-follow-btn${tagFollowing ? ' following' : ''}`}
              onClick={toggleTagFollow}
              disabled={tagBusy}
              aria-pressed={tagFollowing}
            >
              {tagFollowing ? <><Check size={13} /> Following #{tag}</> : <><Plus size={13} /> Follow #{tag}</>}
            </button>
          )}
          {activeFilters.length > 1 && (
            <button type="button" className="clear-all-link" onClick={resetFilters}>Clear all</button>
          )}
        </div>

        {/* 5. Artworks Grid */}
        {loading ? (
          <div className="marketplace-grid">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="artwork-card-skeleton">
                <div className="skeleton" style={{ width: '100%', aspectRatio: '1', borderRadius: '12px' }} />
                <div style={{ padding: '12px 14px' }}>
                  <div className="skeleton" style={{ width: '70%', height: '16px', marginBottom: '6px' }} />
                  <div className="skeleton" style={{ width: '40%', height: '12px' }} />
                </div>
              </div>
            ))}
          </div>
        ) : loadError ? (
          <LoadError title="Marketplace couldn’t load" message={loadError} onRetry={() => setRefreshKey(key => key + 1)} />
        ) : artworks.length > 0 ? (
          <div className="marketplace-grid">
            {artworks.map(a => (
              <ArtworkCard
                key={a.id}
                artwork={a}
                onBuyClick={setBuyTarget}
                saved={savedIds.includes(a.id)}
                onToggleSave={handleToggleSave}
              />
            ))}
          </div>
        ) : (
          <div className="empty-state card">
            <div className="empty-icon"><IconTile Icon={SearchX} size="lg" tone="soft" /></div>
            <h3>No artworks found</h3>
            <p>
              {priceError
                ? priceError
                : activeFilters.length > 0 || viewMode === 'for_sale'
                  ? 'Try a different word, widen the price range, or clear your filters.'
                  : 'Nothing has been shared yet. Check back soon.'}
            </p>
            {(activeFilters.length > 0 || viewMode === 'for_sale') && (
              <button
                className="btn-primary"
                onClick={() => { resetFilters(); setViewMode('all'); }}
              >
                Clear filters & view all artworks
              </button>
            )}
          </div>
        )}
      </div>

      {buyTarget && (
        <PurchaseModal
          artwork={buyTarget}
          onClose={() => setBuyTarget(null)}
        />
      )}
    </div>
  );
}
