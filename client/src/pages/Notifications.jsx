import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MessageCircle, ShoppingBag, UserPlus, Sparkles, CheckCheck, Trash2, Tag, ArrowRight, Bell, BellOff, TrendingDown, Palette, Users } from 'lucide-react';
import { api } from '../utils/api';
import Avatar from '../components/Avatar';
import { useAuth } from '../context/AuthContext';
import { announceNotificationsChanged } from '../hooks/useUnreadNotificationCount';
import './Notifications.css';
import IconTile from '../components/IconTile';

const FILTER_TABS = [
  { id: 'all', label: 'All' },
  { id: 'interactions', label: 'Likes & Comments' },
  { id: 'sales', label: 'Sales & Orders' },
  { id: 'network', label: 'Followers' },
  { id: 'saved', label: 'Saved pieces' },
  { id: 'commissions', label: 'Commissions' },
  { id: 'collabs', label: 'Collaborations' },
];

function formatTimeAgo(timestamp) {
  const time = typeof timestamp === 'number' ? timestamp : new Date(timestamp).getTime();
  const elapsed = Date.now() - time;
  if (!timestamp || Number.isNaN(elapsed) || elapsed < 0) return '';
  if (elapsed < 60000) return 'just now';
  if (elapsed < 3600000) return `${Math.floor(elapsed / 60000)}m ago`;
  if (elapsed < 86400000) return `${Math.floor(elapsed / 3600000)}h ago`;
  return `${Math.floor(elapsed / 86400000)}d ago`;
}

export default function Notifications() {
  const { user } = useAuth();
  const isExplorer = user?.accountType === 'collector';
  const [notifications, setNotifications] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const tabs = isExplorer
    ? [{ id: 'all', label: 'All' }, { id: 'purchases', label: 'Demo orders' }, { id: 'artists', label: 'Artists you follow' }, { id: 'saved', label: 'Saved pieces' }, { id: 'commissions', label: 'Commissions' }]
    : FILTER_TABS;

  useEffect(() => {
    api.get('/notifications')
      .then(data => {
        setNotifications(Array.isArray(data) ? data : []);
      })
      .catch(() => {});
  }, [user?.id]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllAsRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      announceNotificationsChanged();
    } catch {}
  };

  // Accepting or declining a co-creation invite straight from the notification
  const [inviteStatuses, setInviteStatuses] = useState({});
  const [inviteErrors, setInviteErrors] = useState({});
  const [inviteBusy, setInviteBusy] = useState('');

  const respondToInvite = async (e, item, accept) => {
    e.stopPropagation();
    e.preventDefault();
    setInviteBusy(item.id);
    setInviteErrors(prev => ({ ...prev, [item.id]: '' }));
    try {
      const result = await api.post(`/artworks/${item.targetId}/collab/respond`, { accept });
      setInviteStatuses(prev => ({ ...prev, [item.id]: result.status }));
    } catch (err) {
      setInviteErrors(prev => ({ ...prev, [item.id]: err.message || 'Unable to respond right now.' }));
    } finally {
      setInviteBusy('');
    }
  };

  const markAsRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
      announceNotificationsChanged();
    } catch {}
  };

  const deleteNotification = (e, id) => {
    e.stopPropagation();
    e.preventDefault();
    api.delete(`/notifications/${id}`)
      .then(() => {
        setNotifications(prev => prev.filter(n => n.id !== id));
        announceNotificationsChanged();
      })
      .catch(() => {});
  };

  const filtered = notifications.filter(n => {
    if (activeTab === 'purchases') return n.type === 'purchase';
    if (activeTab === 'artists') return n.type === 'new_artwork';
    if (activeTab === 'interactions') return n.type === 'like' || n.type === 'comment' || n.type === 'reply';
    if (activeTab === 'sales') return n.type === 'sale';
    if (activeTab === 'network') return n.type === 'follow';
    if (activeTab === 'commissions') return n.type === 'commission';
    if (activeTab === 'collabs') return n.type === 'collab_invite' || n.type === 'collab_response';
    if (activeTab === 'saved') return n.type === 'price_drop' || n.type === 'now_available';
    return true;
  });

  const getIcon = (type) => {
    switch (type) {
      case 'like':
        return <Heart size={16} fill="#FF6B9D" color="#FF6B9D" />;
      case 'comment':
      case 'reply':
        return <MessageCircle size={16} color="#5B4BF5" />;
      case 'sale':
      case 'purchase':
        return <ShoppingBag size={16} color="#10B981" />;
      case 'new_artwork':
        return <Sparkles size={16} color="#5B4BF5" />;
      case 'collab_invite':
      case 'collab_response':
        return <Users size={16} color="#8B5CF6" />;
      case 'commission':
        return <Palette size={16} color="#8B5CF6" />;
      case 'price_drop':
        return <TrendingDown size={16} color="#10B981" />;
      case 'now_available':
        return <Tag size={16} color="#F59E0B" />;
      case 'follow':
        return <UserPlus size={16} color="#8B5CF6" />;
      case 'feature':
        return <Sparkles size={16} color="#F59E0B" />;
      default:
        return <Bell size={16} color="var(--primary)" />;
    }
  };

  return (
    <div className="notifications-page page-wrapper">
      <div className="container notifications-container">
        
        {/* Header */}
        <div className="notifications-header">
          <div>
            <div className="notif-title-row">
              <h1>Notifications</h1>
              {unreadCount > 0 && (
                <span className="notif-unread-badge">{unreadCount} new</span>
              )}
            </div>
            <p className="notif-subtitle">{isExplorer ? 'Updates from artists you follow and demo order records' : 'Activity and interactions across your art'}</p>
          </div>

          {unreadCount > 0 && (
            <button className="btn-outline mark-read-btn" onClick={markAllAsRead}>
              <CheckCheck size={16} /> Mark all read
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="notifications-tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`notif-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Notification List */}
        <div className="notifications-list card">
          {filtered.length > 0 ? (
            filtered.map(item => (
              <div
                key={item.id}
                className={`notif-item ${!item.read ? 'unread' : ''}`}
                onClick={() => markAsRead(item.id)}
              >
                {/* Left Type Icon */}
                <div className={`notif-icon-badge notif-type-${item.type}`}>
                  {getIcon(item.type)}
                </div>

                {/* Avatar */}
                <div className="notif-avatar-wrap">
                  <Avatar seed={item.actorName} size={42} />
                </div>

                {/* Text Content */}
                <div className="notif-content">
                  <p className="notif-text">
                    {item.actorUsername ? (
                      <Link
                        to={`/profile/${item.actorUsername}`}
                        className="notif-actor"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {item.actorName}
                      </Link>
                    ) : (
                      <strong className="notif-actor">{item.actorName}</strong>
                    )}{' '}
                    <span>{item.text}</span>{' '}
                    {item.targetTitle && item.targetId && (
                      <Link
                        to={`/artwork/${item.targetId}`}
                        className="notif-target-title"
                        onClick={(e) => e.stopPropagation()}
                      >
                        "{item.targetTitle}"
                      </Link>
                    )}
                    {item.targetTitle && !item.targetId && item.type === 'commission' && (
                      <Link to="/commissions" className="notif-target-title" onClick={(e) => e.stopPropagation()}>
                        "{item.targetTitle}"
                      </Link>
                    )}
                  </p>

                  <div className="notif-meta-row">
                    <span className="notif-time">{item.time || formatTimeAgo(item.createdAt)}</span>
                    {(item.type === 'sale' || item.type === 'purchase') && (
                      <span className="notif-sale-tag">
                        <Tag size={12} /> Demo · ${item.targetPrice}
                      </span>
                    )}
                    {item.type === 'commission' && item.targetPrice !== undefined && item.targetPrice !== null && (
                      <span className="notif-sale-tag">
                        <Tag size={12} /> ${item.targetPrice}
                      </span>
                    )}
                    {item.type === 'collab_invite' && (() => {
                      const inviteStatus = inviteStatuses[item.id] || item.inviteStatus;
                      return (
                        <div className="notif-collab">
                          <span className="notif-sale-tag">
                            <Users size={12} /> {item.collabRole}{item.sharePercent > 0 ? ` · ${item.sharePercent}% of sales` : ' · no revenue share'}
                          </span>
                          {inviteStatus === 'pending' ? (
                            <div className="notif-collab-actions">
                              <button type="button" className="btn-primary" disabled={inviteBusy === item.id} onClick={(e) => respondToInvite(e, item, true)}>Accept</button>
                              <button type="button" className="btn-outline" disabled={inviteBusy === item.id} onClick={(e) => respondToInvite(e, item, false)}>Decline</button>
                            </div>
                          ) : (
                            <span className={`notif-collab-status status-${inviteStatus}`}>
                              {inviteStatus === 'accepted' ? 'You accepted' : inviteStatus === 'declined' ? 'You declined' : 'No longer available'}
                            </span>
                          )}
                          {inviteErrors[item.id] && <span className="notif-collab-error" role="alert">{inviteErrors[item.id]}</span>}
                        </div>
                      );
                    })()}
                    {item.type === 'price_drop' && item.targetPrice !== undefined && (
                      <span className="notif-sale-tag">
                        <TrendingDown size={12} /> {item.previousPrice !== undefined && <s>${item.previousPrice}</s>} ${item.targetPrice}
                      </span>
                    )}
                    {item.type === 'now_available' && item.targetPrice !== undefined && (
                      <span className="notif-sale-tag">
                        <Tag size={12} /> Now ${item.targetPrice}
                      </span>
                    )}
                  </div>
                </div>

                {/* Target Artwork Thumbnail or Action */}
                {item.type === 'commission' ? (
                  <Link
                    to="/commissions"
                    className="btn-outline notif-action-pill"
                    onClick={(e) => e.stopPropagation()}
                  >
                    View <ArrowRight size={13} />
                  </Link>
                ) : item.targetId ? (
                  <Link
                    to={`/artwork/${item.targetId}`}
                    className="notif-thumb-link"
                    style={{ background: item.targetColor || '#DDD' }}
                    onClick={(e) => e.stopPropagation()}
                    title={item.targetTitle}
                  />
                ) : item.type === 'follow' && item.actorUsername ? (
                  <Link
                    to={`/profile/${item.actorUsername}`}
                    className="btn-outline notif-action-pill"
                    onClick={(e) => e.stopPropagation()}
                  >
                    View profile <ArrowRight size={13} />
                  </Link>
                ) : null}

                {/* Dismiss Button */}
                <button
                  className="notif-dismiss-btn"
                  onClick={(e) => deleteNotification(e, item.id)}
                  title="Dismiss notification"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))
          ) : (
            <div className="notifications-empty">
              <span className="empty-bell-icon"><IconTile Icon={BellOff} size="lg" tone="soft" /></span>
              <h3>No notifications in this filter</h3>
              <p>{isExplorer ? 'New work from followed artists and demo order records will appear here.' : 'When people interact with your artwork, the updates will appear here.'}</p>
              {activeTab !== 'all' && (
                <button className="btn-outline" onClick={() => setActiveTab('all')}>
                  Show all notifications
                </button>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
