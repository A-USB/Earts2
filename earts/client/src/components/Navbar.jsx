import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Search, Bell, Menu, X, ChevronDown } from 'lucide-react';
import Avatar from './Avatar';
import './Navbar.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/gallery', label: 'Gallery' },
    { to: '/about', label: 'About Us' },
    { to: '/products', label: 'Our Products' },
    ...(user ? [{ to: `/profile/${user.username}`, label: 'My Profile' }] : []),
  ];

  const isActive = (to) => {
    if (to === '/') return location.pathname === '/';
    return location.pathname.startsWith(to);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/gallery?search=${encodeURIComponent(searchQuery)}`);
      setSearchOpen(false);
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-logo">Earts</Link>

        <div className={`navbar-links ${menuOpen ? 'open' : ''}`}>
          {navLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className={`nav-link ${isActive(link.to) ? 'active' : ''}`}
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="navbar-actions">
          {searchOpen ? (
            <form onSubmit={handleSearch} className="navbar-search-form">
              <input
                autoFocus
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search artworks, artists..."
              />
              <button type="button" onClick={() => setSearchOpen(false)} className="icon-btn">
                <X size={16} />
              </button>
            </form>
          ) : (
            <>
              {user && (
                <button className="icon-btn" onClick={() => setSearchOpen(true)}>
                  <Search size={18} />
                </button>
              )}
              {user ? (
                <>
                  <button className="icon-btn notif-btn">
                    <Bell size={18} />
                    <span className="notif-dot" />
                  </button>
                  <div className="avatar-menu" onClick={() => setDropdownOpen(!dropdownOpen)}>
                    <Avatar seed={(user.firstName||'') + (user.lastName||'')} size={34} />
                    <ChevronDown size={14} />
                    {dropdownOpen && (
                      <div className="avatar-dropdown">
                        <div className="dropdown-header">
                          <strong>{user.firstName} {user.lastName}</strong>
                          <span>{user.email}</span>
                        </div>
                        <Link to={`/profile/${user.username}`} onClick={() => setDropdownOpen(false)}>My Profile</Link>
                        <Link to="/upload" onClick={() => setDropdownOpen(false)}>Upload Artwork</Link>
                        <Link to="/settings" onClick={() => setDropdownOpen(false)}>Settings</Link>
                        <button onClick={() => { logout(); setDropdownOpen(false); }}>Sign Out</button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <Link to="/login" className="btn-outline" style={{ padding: '8px 20px' }}>Login</Link>
                  <Link to="/signup" className="btn-primary" style={{ padding: '8px 20px' }}>Sign Up</Link>
                </>
              )}
            </>
          )}
          <button className="mobile-menu-btn" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
    </nav>
  );
}
