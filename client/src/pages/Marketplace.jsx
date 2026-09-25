import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Search, SlidersHorizontal, X, ShoppingBag,
  Sparkles, Users, ArrowRight, Tag, Eye
} from 'lucide-react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import ArtworkCard from '../components/ArtworkCard';
import PurchaseModal from '../components/PurchaseModal';
import Avatar from '../components/Avatar';
import './Marketplace.css';

const CATEGORIES = [
  'All', 'Painting', 'Digital', 'Illustration',
  'Watercolour', 'Abstract', 'Sculpture', 'Mixed Media', 'Photography'
];

const SORT_OPTIONS = [
  'Latest', 'Most Liked', 'Price: Low to High', 'Price: High to Low'
];

export default function Marketplace() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [artworks, setArtworks] = useState([]);
  const [featuredArtists, setFeaturedArtists] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter Modes: 'for_sale' (Marketplace shop) | 'all' (Full Exhibition & Discovery)
  const [viewMode, setViewMode] = useState(searchParams.get('mode') || 'for_sale');
  const [category, setCategory] = useState(searchParams.get('category') || 'All');
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [sort, setSort] = useState('Latest');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [buyTarget, setBuyTarget] = useState(null);

  useEffect(() => {
    setLoading(true);
    const q = category !== 'All' ? `?category=${category}` : '';

    Promise.all([
      api.get(`/artworks${q}`),
      api.get('/users').catch(() => [])
    ])
      .then(([artworksData, usersData]) => {
        let filtered = artworksData;

        // View mode filter
        if (viewMode === 'for_sale') {
          filtered = filtered.filter(a => a.status === 'for_sale');
        }

        if (search) {
          filtered = filtered.filter(a =>
            a.title.toLowerCase().includes(search.toLowerCase()) ||
            a.artistName.toLowerCase().includes(search.toLowerCase()) ||
            (a.medium && a.medium.toLowerCase().includes(search.toLowerCase()))
          );
        }

        if (viewMode === 'for_sale') {
          filtered = filtered.filter(a =>
            !a.price || (a.price >= priceRange[0] && a.price <= priceRange[1])
          );
        }

        if (sort === 'Most Liked') filtered.sort((a, b) => b.likes - a.likes);
        if (sort === 'Price: Low to High') filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
        if (sort === 'Price: High to Low') filtered.sort((a, b) => (b.price || 0) - (a.price || 0));

        setArtworks(filtered);

        // Featured artists
        const artists = usersData.filter(u => u.accountType === 'artist').slice(0, 5);
        setFeaturedArtists(artists);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [category, search, sort, priceRange, viewMode]);

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
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button onClick={() => setSearch('')} className="clear-search-btn">
                <X size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="container marketplace-body">
        {/* 2. Featured Creators Strip */}
        {featuredArtists.length > 0 && !search && category === 'All' && (
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
                  <Avatar name={`${artist.firstName} ${artist.lastName}`} size={40} />
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
              onClick={() => {
                setViewMode('for_sale');
                setSearchParams(p => { p.set('mode', 'for_sale'); return p; });
              }}
            >
              <ShoppingBag size={15} /> For Sale ({artworks.length})
            </button>
            <button
              className={`mode-toggle-btn ${viewMode === 'all' ? 'active' : ''}`}
              onClick={() => {
                setViewMode('all');
                setSearchParams(p => { p.set('mode', 'all'); return p; });
              }}
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
            >
              {SORT_OPTIONS.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            {viewMode === 'for_sale' && (
              <button
                className={`filter-btn btn-outline ${filtersOpen ? 'active' : ''}`}
                onClick={() => setFiltersOpen(!filtersOpen)}
              >
                <SlidersHorizontal size={15} /> Filters
              </button>
            )}
          </div>
        </div>

        {/* 4. Filter Panel (Price slider when in For Sale mode) */}
        {filtersOpen && viewMode === 'for_sale' && (
          <div className="filters-panel card">
            <div className="filter-group">
              <label>Price Range: ${priceRange[0]} – ${priceRange[1]}</label>
              <input
                type="range"
                min="0"
                max="1000"
                step="10"
                value={priceRange[1]}
                onChange={e => setPriceRange([priceRange[0], Number(e.target.value)])}
                className="price-slider"
              />
            </div>
          </div>
        )}

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
        ) : artworks.length > 0 ? (
          <div className="marketplace-grid">
            {artworks.map(a => (
              <ArtworkCard
                key={a.id}
                artwork={a}
                onBuyClick={setBuyTarget}
              />
            ))}
          </div>
        ) : (
          <div className="empty-state card">
            <div className="empty-icon">🎨</div>
            <h3>No artworks found</h3>
            <p>Try adjusting your search query, price filter, or switch to All Artworks mode.</p>
            <button
              className="btn-primary"
              onClick={() => {
                setSearch('');
                setCategory('All');
                setViewMode('all');
                setPriceRange([0, 1000]);
              }}
            >
              View All Artworks
            </button>
          </div>
        )}
      </div>

      {buyTarget && (
        <PurchaseModal
          artwork={buyTarget}
          onClose={() => setBuyTarget(null)}
          onSuccess={() => setArtworks(prev => prev.filter(a => a.id !== buyTarget.id))}
        />
      )}
    </div>
  );
}
