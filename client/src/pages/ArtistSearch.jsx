import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ImageIcon, MapPin, Palette, Search, Users } from 'lucide-react';
import { api } from '../utils/api';
import Avatar from '../components/Avatar';
import ArtworkCard from '../components/ArtworkCard';
import StarRating from '../components/StarRating';
import LoadError from '../components/LoadError';
import './ArtistSearch.css';
import { formatCompact } from '../utils/formatCount';

const ARTWORK_LIMIT = 48;

export default function ArtistSearch() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('query') || '';
  const typeParam = searchParams.get('type'); // 'artworks' | 'artists' | null (pick automatically)
  const [artists, setArtists] = useState([]);
  const [artworks, setArtworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    const term = query.trim();
    const timeout = window.setTimeout(() => {
      Promise.all([
        api.get(`/users/search?q=${encodeURIComponent(term)}`),
        term ? api.get(`/artworks?sort=latest&search=${encodeURIComponent(term)}`) : Promise.resolve([]),
      ])
        .then(([artistResults, artworkResults]) => {
          if (cancelled) return;
          setArtists(artistResults);
          setArtworks(Array.isArray(artworkResults) ? artworkResults : []);
        })
        .catch(err => { if (!cancelled) setError(err.message || 'Unable to search right now.'); })
        .finally(() => { if (!cancelled) setLoading(false); });
    }, query ? 250 : 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [query]);

  const hasQuery = Boolean(query.trim());
  // With no explicit choice: show artworks when there are some, otherwise artists
  const autoTab = hasQuery && (artworks.length > 0 || artists.length === 0) ? 'artworks' : 'artists';
  const activeTab = typeParam === 'artworks' || typeParam === 'artists' ? typeParam : autoTab;

  const updateParams = (nextQuery, nextType) => {
    const next = {};
    if (nextQuery) next.query = nextQuery;
    if (nextType) next.type = nextType;
    setSearchParams(next, { replace: true });
  };
  const updateQuery = value => updateParams(value, typeParam);
  const chooseTab = tab => updateParams(query, tab);

  const shownArtworks = artworks.slice(0, ARTWORK_LIMIT);

  return (
    <div className="artist-search-page page-wrapper">
      <section className="artist-search-hero">
        <div className="container">
          <span className="eyebrow"><Search size={15} /> Search Earts</span>
          <h1>Find artworks &amp; artists</h1>
          <p>Search by title, medium, style, artist name, or location. Every word you type has to match.</p>
          <label className="artist-search-input-wrap">
            <Search size={20} />
            <input
              type="search"
              value={query}
              onChange={event => updateQuery(event.target.value.slice(0, 100))}
              placeholder="Try “oil abstract”, an artist name, or a city..."
              maxLength={100}
              aria-label="Search artworks and artists"
            />
          </label>
        </div>
      </section>

      <section className="container artist-search-results">
        <div className="search-tabs" role="tablist" aria-label="Search results">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'artworks'}
            className={`search-tab${activeTab === 'artworks' ? ' active' : ''}`}
            onClick={() => chooseTab('artworks')}
          >
            <ImageIcon size={15} /> Artworks{hasQuery && !loading && !error ? ` (${artworks.length})` : ''}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'artists'}
            className={`search-tab${activeTab === 'artists' ? ' active' : ''}`}
            onClick={() => chooseTab('artists')}
          >
            <Users size={15} /> Artists{!loading && !error ? ` (${artists.length}${artists.length === 40 ? '+' : ''})` : ''}
          </button>
        </div>

        {error && <LoadError message={error} />}

        {!error && activeTab === 'artworks' && (
          <>
            <div className="artist-search-heading">
              <div>
                <h2>{hasQuery ? 'Artwork results' : 'Search artworks'}</h2>
                <p>{hasQuery ? `Artworks matching “${query.trim()}”` : 'Type a title, medium, style, or artist to find artworks.'}</p>
              </div>
            </div>

            {loading ? (
              <div className="search-artworks-grid" aria-label="Loading artworks">
                {Array.from({ length: 6 }, (_, index) => <div className="artist-result-skeleton" key={index} />)}
              </div>
            ) : !hasQuery ? (
              <div className="artist-search-empty">
                <ImageIcon size={30} />
                <h3>What are you looking for?</h3>
                <p>Start typing above, or <Link to="/marketplace">browse the marketplace</Link>.</p>
              </div>
            ) : shownArtworks.length > 0 ? (
              <>
                <div className="search-artworks-grid">
                  {shownArtworks.map(artwork => <ArtworkCard key={artwork.id} artwork={artwork} />)}
                </div>
                {artworks.length > ARTWORK_LIMIT && (
                  <p className="search-more">
                    Showing the first {ARTWORK_LIMIT} of {artworks.length}.{' '}
                    <Link to={`/marketplace?mode=all&search=${encodeURIComponent(query.trim())}`}>Refine in the marketplace</Link>
                  </p>
                )}
              </>
            ) : (
              <div className="artist-search-empty">
                <ImageIcon size={30} />
                <h3>No artworks found</h3>
                <p>Try fewer words, or check the spelling. {artists.length > 0 && <button type="button" className="search-switch" onClick={() => chooseTab('artists')}>See {artists.length} matching {artists.length === 1 ? 'artist' : 'artists'}</button>}</p>
              </div>
            )}
          </>
        )}

        {!error && activeTab === 'artists' && (
          <>
            <div className="artist-search-heading">
              <div>
                <h2>{query ? 'Artist results' : 'Artists to discover'}</h2>
                <p>{query ? `Artists matching “${query}”` : 'Browse creators from across the Earts community.'}</p>
              </div>
              {!loading && <span className="artist-result-count">{artists.length}{artists.length === 40 ? '+' : ''} artists</span>}
            </div>

            {loading ? (
              <div className="artist-search-grid" aria-label="Loading artists">
                {Array.from({ length: 6 }, (_, index) => <div className="artist-result-skeleton" key={index} />)}
              </div>
            ) : artists.length > 0 ? (
              <div className="artist-search-grid">
                {artists.map(artist => (
                  <Link to={`/profile/${artist.username}`} className="artist-result-card" key={artist.id}>
                    <Avatar seed={artist.avatarSeed || `${artist.firstName}${artist.lastName}`} src={artist.avatar} size={64} />
                    <div className="artist-result-info">
                      <h3>{artist.firstName} {artist.lastName}</h3>
                      <span className="artist-result-username">@{artist.username}</span>
                      <p>{artist.bio || artist.role || 'Earts artist'}</p>
                      <div className="artist-result-meta">
                        {artist.location && <span><MapPin size={14} />{artist.location}</span>}
                        <span><Users size={14} />{formatCompact(artist.followers)} followers</span>
                        {artist.ratingCount > 0 && (
                          <span className="artist-result-rating">
                            <StarRating value={artist.ratingAverage} size={13} />
                            {artist.ratingAverage} ({artist.ratingCount})
                          </span>
                        )}
                      </div>
                      {artist.tags?.length > 0 && (
                        <div className="artist-result-tags"><Palette size={14} />{artist.tags.slice(0, 3).join(' · ')}</div>
                      )}
                    </div>
                    <span className="artist-result-cta">View profile</span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="artist-search-empty">
                <Users size={30} />
                <h3>No artists found</h3>
                <p>Try a different name, username, style, or location.</p>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
