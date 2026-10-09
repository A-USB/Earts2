import { useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { useAuth } from '../context/AuthContext';
import {
  Rss, ShoppingBag, ImagePlus, User, Search, Bell,
  PanelLeftClose, PanelLeftOpen, Settings as SettingsIcon, LogOut
} from 'lucide-react';
import Avatar from './Avatar';
import { EartsIcon } from './EartsLogo';
import ThemeToggle from './ThemeToggle';
import useUnreadNotificationCount from '../hooks/useUnreadNotificationCount';
import './Sidebar.css';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const unreadCount = useUnreadNotificationCount(user?.id);
  const location = useLocation();
  const navigate = useNavigate();
  const [pinned, setPinned] = useState(false);
  const [hovering, setHovering] = useState(false);
  const expanded = pinned || hovering;
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState(null);
  const userButtonRef = useRef(null);

  const isProfileActive = user?.username ? location.pathname.startsWith(`/profile/${user.username}`) : false;

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/marketplace?search=${encodeURIComponent(searchQuery)}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  const navItems = [
    { to: '/feed', label: 'Feed', icon: Rss, show: true },
    { to: '/marketplace', label: 'Marketplace', icon: ShoppingBag, show: true },
    { to: '/upload', label: 'Upload', icon: ImagePlus, show: user?.accountType !== 'collector' },
    { to: '/notifications', label: 'Notifications', icon: Bell, show: true },
    { to: user?.username ? `/profile/${user.username}` : '/login', label: 'My Profile', icon: User, show: true, active: isProfileActive },
    { to: '/settings', label: 'Settings', icon: SettingsIcon, show: true },
  ];

  return (
    <aside className={`sidebar ${expanded ? 'expanded' : ''}`}>
      <div className="sidebar-top">
        <button
          className="sidebar-toggle-btn"
          onMouseEnter={() => setHovering(true)}
          onMouseLeave={() => setHovering(false)}
          onClick={() => setPinned(p => !p)}
          title={pinned ? 'Collapse sidebar' : 'Expand & pin sidebar'}
        >
          {expanded ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
        </button>

        <Link to="/feed" className="sidebar-logo-wrap" title="Earts">
          <div className="sidebar-logo-icon">
            <EartsIcon size={28} />
          </div>
          <span className="sidebar-label sidebar-logo-text">Earts</span>
        </Link>
      </div>

      <nav className="sidebar-nav">
        {navItems.filter(i => i.show).map(item => {
          const Icon = item.icon;
          const active = item.active ?? location.pathname.startsWith(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`sidebar-link ${active ? 'active' : ''}`}
              title={item.label}
            >
              <span className="sidebar-icon-box">
                <Icon size={20} />
                {item.to === '/notifications' && unreadCount > 0 && <span className="sidebar-notif-dot">{unreadCount > 99 ? '99+' : unreadCount}</span>}
              </span>
              <span className="sidebar-label">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-divider" />

      <div className="sidebar-utility">
        {searchOpen ? (
          <form onSubmit={handleSearch} className="sidebar-search-form">
            <Search size={18} />
            <input
              autoFocus
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search..."
              maxLength={100}
              onBlur={() => !searchQuery && setSearchOpen(false)}
            />
          </form>
        ) : (
          <button
            className="sidebar-link"
            onClick={() => { setPinned(true); setSearchOpen(true); }}
            title="Search artworks"
          >
            <span className="sidebar-icon-box">
              <Search size={20} />
            </span>
            <span className="sidebar-label">Search</span>
          </button>
        )}

        <ThemeToggle variant="sidebar" />

        <button
          className="sidebar-link sidebar-logout-btn"
          onClick={() => { logout(); navigate('/login'); }}
          title="Sign Out"
        >
          <span className="sidebar-icon-box">
            <LogOut size={20} />
          </span>
          <span className="sidebar-label">Sign Out</span>
        </button>
      </div>

      <div className="sidebar-bottom">
        <button
          ref={userButtonRef}
          className="sidebar-user"
          onClick={() => {
            if (dropdownOpen) {
              setDropdownOpen(false);
              return;
            }
            const bounds = userButtonRef.current.getBoundingClientRect();
            setDropdownPosition({
              left: bounds.left,
              bottom: window.innerHeight - bounds.top + 8,
            });
            setDropdownOpen(true);
          }}
          title={user ? `${user.firstName} ${user.lastName}` : 'Account'}
        >
          <div className="sidebar-user-avatar">
            <Avatar seed={(user?.firstName || '') + (user?.lastName || '')} size={34} />
          </div>
          <div className="sidebar-label sidebar-user-info">
            <strong>{user?.firstName} {user?.lastName}</strong>
            <span>{user?.accountType === 'collector' ? 'Explorer' : 'Artist'}</span>
          </div>
        </button>

        {dropdownOpen && dropdownPosition && createPortal(
          <div className="sidebar-dropdown" style={dropdownPosition}>
            <div className="dropdown-header">
              <strong>{user?.firstName} {user?.lastName}</strong>
              <span>{user?.email}</span>
            </div>
            <Link to={user?.username ? `/profile/${user.username}` : '/login'} onClick={() => setDropdownOpen(false)}>
              <User size={15} /> My Profile
            </Link>
            <Link to="/settings" onClick={() => setDropdownOpen(false)}>
              <SettingsIcon size={15} /> Settings
            </Link>
            <button onClick={() => { logout(); setDropdownOpen(false); navigate('/login'); }}>
              <LogOut size={15} /> Sign Out
            </button>
          </div>,
          document.body
        )}
      </div>
    </aside>
  );
}
