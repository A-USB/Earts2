import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Rss, ShoppingBag, ImagePlus, User, Search, Bell, Compass,
  PanelLeftClose, PanelLeftOpen, Settings as SettingsIcon, LogOut
} from 'lucide-react';
import Avatar from './Avatar';
import { EartsIcon } from './EartsLogo';
import './Sidebar.css';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [pinned, setPinned] = useState(false);
  const [hovering, setHovering] = useState(false);
  const expanded = pinned || hovering;
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);

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
    { to: '/notifications', label: 'Notifications', icon: Bell, show: true, hasBadge: true },
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
            <EartsIcon size={34} />
          </div>
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
                {item.hasBadge && <span className="sidebar-notif-dot" />}
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
      </div>

      <div className="sidebar-bottom">
        <button
          className="sidebar-user"
          onClick={() => setDropdownOpen(!dropdownOpen)}
          title={user ? `${user.firstName} ${user.lastName}` : 'Account'}
        >
          <div className="sidebar-user-avatar">
            <Avatar seed={(user?.firstName || '') + (user?.lastName || '')} size={34} />
          </div>
          <div className="sidebar-label sidebar-user-info">
            <strong>{user?.firstName} {user?.lastName}</strong>
            <span>{user?.accountType === 'collector' ? 'Collector' : 'Artist'}</span>
          </div>
        </button>

        {dropdownOpen && (
          <div className="sidebar-dropdown">
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
            <button onClick={() => { logout(); setDropdownOpen(false); navigate('/'); }}>
              <LogOut size={15} /> Sign Out
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
