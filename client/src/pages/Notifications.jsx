import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Heart, MessageCircle, ShoppingBag, UserPlus, Sparkles,
  CheckCheck, Trash2, Tag, ArrowRight, Bell
} from 'lucide-react';
import Avatar from '../components/Avatar';
import './Notifications.css';

const INITIAL_NOTIFICATIONS = [
  {
    id: '1',
    type: 'sale',
    actorName: 'Nadia Reyes',
    actorUsername: 'nadia_reyes',
    text: 'purchased your artwork',
    targetTitle: 'Sun 2',
    targetId: '15',
    targetPrice: 79.99,
    targetColor: '#FF6B9D',
    time: '5m ago',
    read: false,
  },
  {
    id: '2',
    type: 'like',
    actorName: 'Jane Murungi',
    actorUsername: 'jane_murungi',
    text: 'liked your piece',
    targetTitle: 'Form & Shadow',
    targetId: '16',
    targetColor: '#5B4BF5',
    time: '24m ago',
    read: false,
  },
  {
    id: '3',
    type: 'comment',
    actorName: 'Ara Hibris',
    actorUsername: 'arahibris2011',
    text: 'commented: "The balance and texture on this piece are extraordinary!" on',
    targetTitle: 'Sun 2',
    targetId: '15',
    targetColor: '#FF6B9D',
    time: '1h ago',
    read: false,
  },
  {
    id: '4',
    type: 'follow',
    actorName: 'Hussina Patel',
    actorUsername: 'hussina_patel',
    text: 'started following your creative portfolio',
    time: '3h ago',
    read: true,
  },
  {
    id: '5',
    type: 'feature',
    actorName: 'Earts Editorial',
    text: 'selected your piece for the Homepage Curated Showcase!',
    targetTitle: 'Golden Ochre',
    targetId: '17',
    targetColor: '#E59866',
    time: '1d ago',
    read: true,
  },
  {
    id: '6',
    type: 'like',
    actorName: 'Nadia Reyes',
    actorUsername: 'nadia_reyes',
    text: 'liked your piece',
    targetTitle: 'Golden Ochre',
    targetId: '17',
    targetColor: '#E59866',
    time: '2d ago',
    read: true,
  },
];

const FILTER_TABS = [
  { id: 'all', label: 'All' },
  { id: 'interactions', label: 'Likes & Comments' },
  { id: 'sales', label: 'Sales & Orders' },
  { id: 'network', label: 'Followers' },
];

export default function Notifications() {
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [activeTab, setActiveTab] = useState('all');

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const markAsRead = (id) => {
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
  };

  const deleteNotification = (e, id) => {
    e.stopPropagation();
    e.preventDefault();
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const filtered = notifications.filter(n => {
    if (activeTab === 'interactions') return n.type === 'like' || n.type === 'comment';
    if (activeTab === 'sales') return n.type === 'sale';
    if (activeTab === 'network') return n.type === 'follow';
    return true;
  });

  const getIcon = (type) => {
    switch (type) {
      case 'like':
        return <Heart size={16} fill="#FF6B9D" color="#FF6B9D" />;
      case 'comment':
        return <MessageCircle size={16} color="#5B4BF5" />;
      case 'sale':
        return <ShoppingBag size={16} color="#10B981" />;
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
            <p className="notif-subtitle">Activity, sales, and interactions across your art</p>
          </div>

          {unreadCount > 0 && (
            <button className="btn-outline mark-read-btn" onClick={markAllAsRead}>
              <CheckCheck size={16} /> Mark all read
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="notifications-tabs">
          {FILTER_TABS.map(tab => (
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
                  </p>

                  <div className="notif-meta-row">
                    <span className="notif-time">{item.time}</span>
                    {item.type === 'sale' && (
                      <span className="notif-sale-tag">
                        <Tag size={12} /> +${item.targetPrice} earned
                      </span>
                    )}
                  </div>
                </div>

                {/* Target Artwork Thumbnail or Action */}
                {item.targetId ? (
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
              <span className="empty-bell-icon">🔔</span>
              <h3>No notifications in this filter</h3>
              <p>When artists and collectors interact with your pieces, they'll show up here.</p>
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
