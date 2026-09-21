import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Edit2, Share2, Plus, Heart, ShoppingBag } from 'lucide-react';
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

  // Collector-only data (own profile)
  const [saved, setSaved] = useState([]);
  const [orders, setOrders] = useState([]);
  const [collectorTab, setCollectorTab] = useState('Saved');

  // Follow state (viewing someone else)
  const [isFollowing, setIsFollowing] = useState(false);
  const [followBusy, setFollowBusy] = useState(false);

  const isOwn = me?.username === username;
  const isCollector = profile?.accountType === 'collector';

  useEffect(() => {
    setLoading(true);
    api.get(`/users/${username}`)
      .then(data => { setProfile(data); setArtworks(data.artworks || []); })
      .catch(() => navigate('/404'))
      .finally(() => setLoading(false));
  }, [username]);

  // Load saved/purchases only for your own collector profile
  useEffect(() => {
    if (isOwn && isCollector) {
      api.get('/users/me/saved').then(setSaved).catch(() => {});
      api.get('/users/me/orders').then(setOrders).catch(() => {});
    }
  }, [isOwn, isCollector]);

  // Hydrate follow state when viewing someone else's profile
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

  if (loading) return (
    <div className="profile-loading">
      <div className="skeleton" style={{width:'100%',height:'200px'}} />
    </div>
  );
  if (!profile) return null;

  const filtered = tab === 'All' ? artworks
    : tab === 'For Sale' ? artworks.filter(a => a.status === 'for_sale')
    : artworks.filter(a => a.status === 'sold');

  const formatNum = n => n >= 1000 ? `${(n/1000).toFixed(1)}k` : n;

  const statItems = isCollector
    ? (isOwn
        ? [
            { label: 'Followers', value: formatNum(profile.followers) },
            { label: 'Following', value: profile.following },
            { label: 'Saved', value: saved.length },
            { label: 'Purchases', value: orders.length },
          ]
        : [
            { label: 'Followers', value: formatNum(profile.followers) },
            { label: 'Following', value: profile.following },
          ])
    : [
        { label: 'Artworks made', value: artworks.length },
        { label: 'Followers', value: formatNum(profile.followers) },
        { label: 'Following', value: profile.following },
        { label: 'Artworks sold', value: profile.artworksSold },
      ];

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
              <p className="profile-role">
                {isCollector ? 'Collector' : profile.role} {profile.location ? `~ ${profile.location}` : ''}
              </p>
            </div>
          </div>

          {!isCollector && (
            <div className="profile-tags">
              {profile.tags?.map(t => (
                <span key={t} className="profile-tag">{t}</span>
              ))}
            </div>
          )}

          {isOwn ? (
            <div className="profile-actions">
              <Link to="/settings" className="btn-outline" style={{flex:1, justifyContent:'center'}}>
                <Edit2 size={14}/> Edit profile
              </Link>
              <button className="btn-ghost"><Share2 size={14}/> Share</button>
            </div>
          ) : (
            <div className="profile-actions">
              <button
                className={isFollowing ? 'btn-outline' : 'btn-primary'}
                style={{flex:1, justifyContent:'center'}}
                onClick={handleFollowToggle}
                disabled={followBusy}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </button>
              <button className="btn-outline">Message</button>
            </div>
          )}

          {/* Stats */}
          <div className="profile-stats" style={{ gridTemplateColumns: `repeat(${statItems.length}, 1fr)` }}>
            {statItems.map(s => (
              <div className="stat" key={s.label}><span>{s.value}</span><small>{s.label}</small></div>
            ))}
          </div>

          {/* About */}
          {profile.bio && (
            <div className="sidebar-card">
              <h5>About</h5>
              <p>{profile.bio}</p>
            </div>
          )}

          {/* Tools */}
          {!isCollector && profile.tools?.length > 0 && (
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
          {!isCollector && profile.availableFor?.length > 0 && (
            <div className="sidebar-card">
              <h5>Available for</h5>
              <ul className="avail-list">
                {profile.availableFor.map(a => <li key={a}>{a}</li>)}
              </ul>
            </div>
          )}
        </div>

        <div className="profile-main">
          {isCollector ? (
            isOwn ? (
              <>
                <div className="artwork-section-header">
                  <h3>Collection</h3>
                  <div className="artwork-tabs">
                    {['Saved', 'Purchases'].map(t => (
                      <button key={t} className={`art-tab ${collectorTab===t?'active':''}`} onClick={() => setCollectorTab(t)}>{t}</button>
                    ))}
                  </div>
                </div>

                {collectorTab === 'Saved' ? (
                  saved.length > 0 ? (
                    <div className="profile-artworks-grid">
                      {saved.map(a => (
                        <Link key={a.id} to={`/artwork/${a.id}`} className="profile-art-card">
                          <div className="profile-art-thumb" style={{background: a.color || '#DDD'}} />
                          <div className="profile-art-info">
                            <span>{a.title}</span>
                            {a.status === 'for_sale' ? <strong>${a.price}</strong> : <em>{a.status === 'sold' ? 'Sold' : 'Not for sale'}</em>}
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-collection">
                      <Heart size={28} />
                      <p>Artworks you like will show up here</p>
                      <Link to="/marketplace" className="btn-outline">Browse the Marketplace</Link>
                    </div>
                  )
                ) : (
                  orders.length > 0 ? (
                    <div className="profile-artworks-grid">
                      {orders.map(o => o.artwork && (
                        <Link key={o.id} to={`/artwork/${o.artwork.id}`} className="profile-art-card">
                          <div className="profile-art-thumb" style={{background: o.artwork.color || '#DDD'}} />
                          <div className="profile-art-info">
                            <span>{o.artwork.title}</span>
                            <strong>${o.price}</strong>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-collection">
                      <ShoppingBag size={28} />
                      <p>Pieces you buy will show up here</p>
                      <Link to="/marketplace" className="btn-outline">Browse the Marketplace</Link>
                    </div>
                  )
                )}
              </>
            ) : (
              <div className="empty-collection">
                <p>{profile.firstName} is here to discover and collect art — no artwork to show yet.</p>
              </div>
            )
          ) : (
            <>
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
                      {a.status === 'for_sale' ? <strong>${a.price}</strong> : <em>{a.status === 'sold' ? 'Sold' : 'Not for sale'}</em>}
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
