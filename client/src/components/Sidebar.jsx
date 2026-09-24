import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Rss, ShoppingBag, ImagePlus, User, Search, Bell,
  PanelLeftClose, PanelLeftOpen, Settings as SettingsIcon, LogOut
} from 'lucide-react';
import Avatar from './Avatar';
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
    { to: user?.username ? `/profile/${user.username}` : '/login', label: 'My Profile', icon: User, show: true, active: isProfileActive },
  ];

  return (
    <aside className={`sidebar ${expanded ? 'expanded' : ''}`}>
      <div className="sidebar-top">
        <button
          className="sidebar-link sidebar-toggle"
          onMouseEnter={() => setHovering(true)}
          onMouseLeave={() => setHovering(false)}
          onClick={() => setPinned(p => !p)}
          title={pinned ? 'Collapse' : 'Expand & pin'}
        >
          {expanded ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
        </button>

        <Link to="/feed" className="sidebar-logo">
          <svg className="sidebar-logo-mark" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="64" height="64" rx="17" fill="#6D4CE0"/>
            <rect x="18" y="16" width="25" height="11" rx="4" fill="#ffffff" fillOpacity="0.35" transform="rotate(-10 18 16)"/>
            <rect x="18" y="26.5" width="25" height="11" rx="4" fill="#ffffff" fillOpacity="0.65" transform="rotate(-5 18 26.5)"/>
            <rect x="18" y="37" width="25" height="11" rx="4" fill="#ffffff"/>
          </svg>
          <span className="sidebar-label sidebar-logo-text">Earts</span>
        </Link>
      </div>

      <nav className="sidebar-nav">
        {navItems.filter(i => i.show).map(item => {
          const Icon = item.icon;
          const active = item.active ?? location.pathname.startsWith(item.to);
          return (
            <Link key={item.to} to={item.to} className={`sidebar-link ${active ? 'active' : ''}`} title={item.label}>
              <Icon size={20} />
              <span className="sidebar-label">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-divider" />

      <div className="sidebar-utility">
        {searchOpen ? (
          <form onSubmit={handleSearch} className="sidebar-search-form">
            <Search size={16} />
            <input
              autoFocus
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search..."
              onBlur={() => !searchQuery && setSearchOpen(false)}
            />
          </form>
        ) : (
          <button className="sidebar-link" onClick={() => { setPinned(true); setSearchOpen(true); }} title="Search">
            <Search size={20} />
            <span className="sidebar-label">Search</span>
          </button>
        )}

        <button className="sidebar-link" title="Notifications">
          <span className="sidebar-icon-wrap">
            <Bell size={20} />
            <span className="sidebar-notif-dot" />
          </span>
          <span className="sidebar-label">Notifications</span>
        </button>
      </div>

      <div className="sidebar-bottom">
        <button className="sidebar-user" onClick={() => setDropdownOpen(!dropdownOpen)}>
          <Avatar seed={(user.firstName||'')+(user.lastName||'')} size={36} />
          <div className="sidebar-label sidebar-user-info">
            <strong>{user.firstName} {user.lastName}</strong>
            <span>{user.accountType === 'collector' ? 'Collector' : 'Artist'}</span>
          </div>
        </button>

        {dropdownOpen && (
          <div className="sidebar-dropdown">
            <div className="dropdown-header">
              <strong>{user.firstName} {user.lastName}</strong>
              <span>{user.email}</span>
            </div>
            <Link to={`/profile/${user.username}`} onClick={() => setDropdownOpen(false)}><User size={15}/> My Profile</Link>
            <Link to="/settings" onClick={() => setDropdownOpen(false)}><SettingsIcon size={15}/> Settings</Link>
            <button onClick={() => { logout(); setDropdownOpen(false); navigate('/'); }}><LogOut size={15}/> Sign Out</button>
          </div>
        )}
      </div>
    </aside>
  );
}
