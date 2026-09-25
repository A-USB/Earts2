import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Search, SlidersHorizontal, X, Compass, Sparkles,
  TrendingUp, Users, ArrowRight, Heart, Tag
} from 'lucide-react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import ArtworkCard from '../components/ArtworkCard';
import Avatar from '../components/Avatar';
import './Gallery.css';

const CATEGORIES = [
  'All', 'Painting', 'Digital', 'Illustration',
  'Watercolour', 'Abstract', 'Sculpture', 'Mixed Media', 'Photography'
];

const SORT_OPTIONS = [
  'Latest', 'Most Liked', 'Price: Low to High', 'Price: High to Low'
];

export default function Gallery() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [artworks, setArtworks] = useState([]);
  const [featuredArtists, setFeaturedArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState(searchParams.get('category') || 'All');
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [sort, setSort] = useState('Latest');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [statusFilter, setStatusFilter] = useState('All'); // 'All' | 'for_sale' | 'not_for_sale'

  // Fetch Artworks and Featured Artists
  useEffect(() => {
    setLoading(true);
    const q = category !== 'All' ? `?category=${category}` : '';
    
    Promise.all([
      api.get(`/artworks${q}`),
      api.get('/users').catch(() => [])
    ])
      .then(([artworksData, usersData]) => {
        let filtered = artworksData;

        if (search) {
          filtered = filtered.filter(a =>
            a.title.toLowerCase().includes(search.toLowerCase()) ||
            a.artistName.toLowerCase().includes(search.toLowerCase()) ||
            (a.medium && a.medium.toLowerCase().includes(search.toLowerCase()))
          );
        }

        if (statusFilter !== 'All') {
          filtered = filtered.filter(a => a.status === statusFilter);
        }

        filtered = filtered.filter(a =>
          !a.price || (a.price >= priceRange[0] && a.price <= priceRange[1])
        );

        if (sort === 'Most Liked') filtered.sort((a, b) => b.likes - a.likes);
        if (sort === 'Price: Low to High') filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
        if (sort === 'Price: High to Low') filtered.sort((a, b) => (b.price || 0) - (a.price || 0));

        setArtworks(filtered);

        // Featured artists (artists with bio and tags)
        const artists = usersData.filter(u => u.accountType === 'artist').slice(0, 5);
        setFeaturedArtists(artists);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [category, search, sort, priceRange, statusFilter]);

  return (
    <div className="gallery-page page-wrapper">
      {/* 1. Curated Spotlight Banner */}
      <div className="explore-hero-banner">
        <div className="container">
          <div className="explore-hero-content">
            <span className="explore-hero-tag">
              <Sparkles size={14} /> Public Arts Portal & Explorer
            </span>
            <h1>Discover. Collect. Experience Art.</h1>
            <p>
              Explore thousands of original artworks, physical sculptures, and digital illustrations from visionary creators around the world.
            </p>

            {/* Quick search */}
            <div className="explore-search-box">
              <Search size={18} className="search-icon" />
              <input
                placeholder="Search by title, artist name, medium, or style..."
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
      </div>

      <div className="container gallery-body">
        {/* 2. Featured Artists Spotlight Carousel */}
        {featuredArtists.length > 0 && !search && category === 'All' && (
          <div className="featured-artists-strip">
            <div className="strip-header">
              <div className="strip-title">
                <Users size={18} className="strip-icon" />
                <h3>Featured Creators & Studios</h3>
              </div>
              <span className="strip-subtitle">Discover artists shaping modern culture</span>
            </div>

            <div className="featured-artists-grid">
              {featuredArtists.map(artist => (
                <Link
                  key={artist.id}
                  to={`/profile/${artist.username}`}
                  className="featured-artist-pill card"
                >
                  <Avatar name={`${artist.firstName} ${artist.lastName}`} size={42} />
                  <div className="artist-pill-info">
                    <strong>{artist.firstName} {artist.lastName}</strong>
                    <span>{artist.role} • {artist.location || 'Global'}</span>
                  </div>
                  <ArrowRight size={16} className="artist-pill-arrow" />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* 3. Filter and Control Bar */}
        <div className="gallery-controls-bar">
          <div className="category-scroll-pills">
            {CATEGORIES.map(c => (
              <button
                key={c}
                className={`category-pill ${category === c ? 'active' : ''}`}
                onClick={() => {
                  setCategory(c);
                  setSearchParams(c !== 'All' ? { category: c } : {});
                }}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="gallery-right-actions">
            <span className="results-count-badge">
              <strong>{artworks.length}</strong> {artworks.length === 1 ? 'artwork' : 'artworks'}
            </span>

            <select
              value={sort}
              onChange={e => setSort(e.target.value)}
              className="gallery-sort-select"
            >
              {SORT_OPTIONS.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            <button
              className={`filter-toggle-btn ${filtersOpen ? 'active' : ''}`}
              onClick={() => setFiltersOpen(!filtersOpen)}
            >
              <SlidersHorizontal size={15} /> Filters
            </button>
          </div>
        </div>

        {/* 4. Expandable Filter Panel */}
        {filtersOpen && (
          <div className="explore-filter-panel card">
            <div className="filter-panel-row">
              <div className="filter-group">
                <label>Listing Status</label>
                <div className="filter-chips-row">
                  {[
                    { id: 'All', label: 'All Works' },
                    { id: 'for_sale', label: 'For Sale' },
                    { id: 'not_for_sale', label: 'Exhibition Only' },
                  ].map(s => (
                    <button
                      key={s.id}
                      type="button"
                      className={`filter-chip ${statusFilter === s.id ? 'active' : ''}`}
                      onClick={() => setStatusFilter(s.id)}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="filter-group">
                <label>Price Range: ${priceRange[0]} – ${priceRange[1]}</label>
                <input
                  type="range"
                  min="0"
                  max="1000"
                  step="10"
                  value={priceRange[1]}
                  onChange={e => setPriceRange([priceRange[0], Number(e.target.value)])}
                  className="price-range-slider"
                />
              </div>
            </div>
          </div>
        )}

        {/* 5. Artworks Showcase Grid */}
        {loading ? (
          <div className="gallery-grid">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="artwork-card-skeleton">
                <div className="skeleton" style={{ width: '100%', aspectRatio: '1', borderRadius: '14px' }} />
                <div style={{ padding: '14px' }}>
                  <div className="skeleton" style={{ width: '70%', height: '18px', marginBottom: '8px' }} />
                  <div className="skeleton" style={{ width: '40%', height: '14px' }} />
                </div>
              </div>
            ))}
          </div>
        ) : artworks.length > 0 ? (
          <div className="gallery-grid">
            {artworks.map(a => (
              <ArtworkCard key={a.id} artwork={a} />
            ))}
          </div>
        ) : (
          <div className="empty-explore-state card">
            <div className="empty-state-icon">🎨</div>
            <h3>No artworks found matching your criteria</h3>
            <p>Try resetting your search query or selecting a different category filter.</p>
            <button
              className="btn-primary"
              onClick={() => {
                setSearch('');
                setCategory('All');
                setStatusFilter('All');
                setPriceRange([0, 1000]);
              }}
            >
              Reset All Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
