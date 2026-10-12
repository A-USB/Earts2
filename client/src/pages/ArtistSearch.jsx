import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { MapPin, Palette, Search, Users } from 'lucide-react';
import { api } from '../utils/api';
import Avatar from '../components/Avatar';
import LoadError from '../components/LoadError';
import './ArtistSearch.css';

export default function ArtistSearch() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('query') || '';
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    const timeout = window.setTimeout(() => {
      api.get(`/users/search?q=${encodeURIComponent(query)}`)
        .then(results => { if (!cancelled) setArtists(results); })
        .catch(err => { if (!cancelled) setError(err.message || 'Unable to search artists.'); })
        .finally(() => { if (!cancelled) setLoading(false); });
    }, query ? 250 : 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [query]);

  const updateQuery = value => setSearchParams(value ? { query: value } : {}, { replace: true });

  return (
    <div className="artist-search-page page-wrapper">
      <section className="artist-search-hero">
        <div className="container">
          <span className="eyebrow"><Users size={15} /> Discover the community</span>
          <h1>Find artists</h1>
          <p>Explore creators on Earts and visit their profiles to see more of their work.</p>
          <label className="artist-search-input-wrap">
            <Search size={20} />
            <input
              type="search"
              value={query}
              onChange={event => updateQuery(event.target.value.slice(0, 100))}
              placeholder="Search by artist name, username, style, or location..."
              maxLength={100}
              aria-label="Search artists"
            />
          </label>
        </div>
      </section>

      <section className="container artist-search-results">
        <div className="artist-search-heading">
          <div>
            <h2>{query ? 'Search results' : 'Artists to discover'}</h2>
            <p>{query ? `Artists matching “${query}”` : 'Browse creators from across the Earts community.'}</p>
          </div>
          {!loading && !error && <span className="artist-result-count">{artists.length}{artists.length === 40 ? '+' : ''} artists</span>}
        </div>

        {error && <LoadError message={error} />}
        {loading ? (
          <div className="artist-search-grid" aria-label="Loading artists">
            {Array.from({ length: 6 }, (_, index) => <div className="artist-result-skeleton" key={index} />)}
          </div>
        ) : !error && artists.length > 0 ? (
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
                    <span><Users size={14} />{artist.followers || 0} followers</span>
                  </div>
                  {artist.tags?.length > 0 && (
                    <div className="artist-result-tags"><Palette size={14} />{artist.tags.slice(0, 3).join(' · ')}</div>
                  )}
                </div>
                <span className="artist-result-cta">View profile</span>
              </Link>
            ))}
          </div>
        ) : !error ? (
          <div className="artist-search-empty">
            <Users size={30} />
            <h3>No artists found</h3>
            <p>Try a different name, username, style, or location.</p>
          </div>
        ) : null}
      </section>
    </div>
  );
}
