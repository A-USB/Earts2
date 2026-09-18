import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import ArtworkCard from '../components/ArtworkCard';
import './Dashboard.css';

const CATEGORIES = ['All', 'Painting', 'Digital', 'Illustration', 'Watercolour', 'Abstract', 'Sculpture', 'Mixed Media', 'Photography'];
const SORT_OPTIONS = ['Latest', 'Most Liked', 'Price: Low to High', 'Price: High to Low'];

export default function Dashboard() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [artworks, setArtworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [sort, setSort] = useState('Latest');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [priceRange, setPriceRange] = useState([0, 1000]);

  useEffect(() => {
    setLoading(true);
    const q = category !== 'All' ? `?category=${category}` : '';
    api.get(`/artworks${q}`)
      .then(data => {
        let filtered = data;
        if (search) filtered = filtered.filter(a =>
          a.title.toLowerCase().includes(search.toLowerCase()) ||
          a.artistName.toLowerCase().includes(search.toLowerCase())
        );
        filtered = filtered.filter(a => !a.price || (a.price >= priceRange[0] && a.price <= priceRange[1]));
        if (sort === 'Most Liked') filtered.sort((a,b) => b.likes - a.likes);
        if (sort === 'Price: Low to High') filtered.sort((a,b) => (a.price||0)-(b.price||0));
        if (sort === 'Price: High to Low') filtered.sort((a,b) => (b.price||0)-(a.price||0));
        setArtworks(filtered);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [category, search, sort, priceRange]);

  return (
    <div className="dashboard-page page-wrapper">
      <div className="dashboard-hero">
        <div className="container">
          <span className="eyebrow">Your Feed</span>
          <h1>Welcome back{user?.firstName ? `, ${user.firstName}` : ''}</h1>
          <p>Discover new artworks from artists across the Earts community</p>
          <div className="dashboard-search">
            <Search size={18} />
            <input
              placeholder="Search artworks, artists, styles..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && <button onClick={() => setSearch('')} className="clear-search"><X size={16}/></button>}
          </div>
        </div>
      </div>

      <div className="container dashboard-body">
        <div className="dashboard-controls">
          <div className="category-tabs">
            {CATEGORIES.map(c => (
              <button
                key={c}
                className={`cat-tab ${category === c ? 'active' : ''}`}
                onClick={() => setCategory(c)}
              >{c}</button>
            ))}
          </div>
          <div className="dashboard-right-controls">
            <span className="results-count">{artworks.length} artworks</span>
            <select value={sort} onChange={e => setSort(e.target.value)} className="sort-select">
              {SORT_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <button className="filter-btn btn-outline" onClick={() => setFiltersOpen(!filtersOpen)}>
              <SlidersHorizontal size={16} /> Filters
            </button>
          </div>
        </div>

        {filtersOpen && (
          <div className="filters-panel card">
            <div className="filter-group">
              <label>Price Range: ${priceRange[0]} – ${priceRange[1]}</label>
              <input type="range" min="0" max="1000" value={priceRange[1]}
                onChange={e => setPriceRange([priceRange[0], Number(e.target.value)])} />
            </div>
            <div className="filter-group">
              <label>Status</label>
              <div className="filter-tags">
                {['For Sale', 'Not for Sale'].map(s => (
                  <button key={s} className="badge filter-tag">{s}</button>
                ))}
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="dashboard-grid">
            {[...Array(8)].map((_,i) => (
              <div key={i} className="artwork-card-skeleton">
                <div className="skeleton" style={{width:'100%',aspectRatio:'1',borderRadius:'12px'}} />
                <div style={{padding:'12px 14px'}}>
                  <div className="skeleton" style={{width:'70%',height:'16px',marginBottom:'6px'}} />
                  <div className="skeleton" style={{width:'40%',height:'12px'}} />
                </div>
              </div>
            ))}
          </div>
        ) : artworks.length > 0 ? (
          <div className="dashboard-grid">
            {artworks.map(a => <ArtworkCard key={a.id} artwork={a} />)}
          </div>
        ) : (
          <div className="empty-state">
            <span>🎨</span>
            <h3>No artworks found</h3>
            <p>Try adjusting your search or filters</p>
            <button className="btn-primary" onClick={() => { setSearch(''); setCategory('All'); }}>
              Clear filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
