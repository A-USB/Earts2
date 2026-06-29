import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Edit2, Share2, Tag, Heart, Plus } from 'lucide-react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/Avatar';
import './Profile.css';

export default function Profile() {
  const { username } = useParams();
  const { user: me } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [artworks, setArtworks] = useState([]);
  const [tab, setTab] = useState('All');
  const [loading, setLoading] = useState(true);

  const isOwn = me?.username === username;

  useEffect(() => {
    setLoading(true);
    api.get(`/users/${username}`)
      .then(data => { setProfile(data); setArtworks(data.artworks || []); })
      .catch(() => navigate('/404'))
      .finally(() => setLoading(false));
  }, [username]);

  if (loading) return (
    <div className="profile-loading">
      <div className="skeleton" style={{width:'100%',height:'200px'}} />
    </div>
  );
  if (!profile) return null;

  const filtered = tab === 'All' ? artworks
    : tab === 'For Sale' ? artworks.filter(a => a.status === 'for_sale')
    : artworks.filter(a => a.status === 'not_for_sale');

  const formatNum = n => n >= 1000 ? `${(n/1000).toFixed(1)}k` : n;

  return (
    <div className="profile-page page-wrapper">
      {/* Cover */}
      <div className="profile-cover" style={{ background: profile.coverColor }}>
        <div className="cover-shapes">
          <div className="cover-shape cs1" />
          <div className="cover-shape cs2" />
          <div className="cover-shape cs3" />
        </div>
      </div>

      <div className="container profile-inner">
        <div className="profile-sidebar">
          {/* Avatar & Info */}
          <div className="profile-id">
            <Avatar seed={profile.firstName + profile.lastName} size={80} className="profile-avatar-img" />
            <div>
              <h2>{profile.firstName} {profile.lastName}</h2>
              <p className="profile-role">{profile.role} {profile.location ? `~ ${profile.location}` : ''}</p>
            </div>
          </div>

          <div className="profile-tags">
            {profile.tags?.map(t => (
              <span key={t} className="profile-tag">{t}</span>
            ))}
          </div>

          {isOwn ? (
            <div className="profile-actions">
              <Link to="/settings" className="btn-outline" style={{flex:1, justifyContent:'center'}}>
                <Edit2 size={14}/> Edit profile
              </Link>
              <button className="btn-ghost"><Share2 size={14}/> Share</button>
            </div>
          ) : (
            <div className="profile-actions">
              <button className="btn-primary" style={{flex:1, justifyContent:'center'}}>Follow</button>
              <button className="btn-outline">Message</button>
            </div>
          )}

          {/* Stats */}
          <div className="profile-stats">
            <div className="stat"><span>{artworks.length}</span><small>Artworks made</small></div>
            <div className="stat"><span>{formatNum(profile.followers)}</span><small>Followers</small></div>
            <div className="stat"><span>{profile.following}</span><small>Following</small></div>
            <div className="stat"><span>{profile.artworksSold}</span><small>Artworks sold</small></div>
          </div>

          {/* About */}
          {profile.bio && (
            <div className="sidebar-card">
              <h5>About</h5>
              <p>{profile.bio}</p>
            </div>
          )}

          {/* Tools */}
          {profile.tools?.length > 0 && (
            <div className="sidebar-card">
              <h5>Tools and Media</h5>
              <div className="profile-tools">
                {profile.tools.map(t => (
                  <span key={t} className="tool-tag">{t}</span>
                ))}
              </div>
            </div>
          )}

          {/* Available for */}
          {profile.availableFor?.length > 0 && (
            <div className="sidebar-card">
              <h5>Available for</h5>
              <ul className="avail-list">
                {profile.availableFor.map(a => <li key={a}>{a}</li>)}
              </ul>
            </div>
          )}
        </div>

        <div className="profile-main">
          <div className="artwork-section-header">
            <h3>My artwork</h3>
            <div className="artwork-tabs">
              {['All', 'For Sale', 'Sold'].map(t => (
                <button key={t} className={`art-tab ${tab===t?'active':''}`} onClick={() => setTab(t)}>{t}</button>
              ))}
            </div>
          </div>

          <div className="profile-artworks-grid">
            {filtered.map(a => (
              <Link key={a.id} to={`/artwork/${a.id}`} className="profile-art-card">
                <div className="profile-art-thumb" style={{background: a.color || '#DDD'}} />
                <div className="profile-art-info">
                  <span>{a.title}</span>
                  {a.price ? <strong>${a.price}</strong> : <em>Not for sale</em>}
                </div>
              </Link>
            ))}
            {isOwn && (
              <Link to="/upload" className="add-artwork-card">
                <Plus size={24} />
                <span>Add a new artwork</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
