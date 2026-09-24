import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Search, Bell, Menu, X, ChevronDown } from 'lucide-react';
import Avatar from './Avatar';
import './Navbar.css';

const HOME_SECTIONS = [
  { id: 'home', label: 'Home' },
  { id: 'about', label: 'About Us' },
  { id: 'products', label: 'Our Products' },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');

  const onHome = location.pathname === '/';

  // Scroll-spy: track which section of the one-page Home is in view
  useEffect(() => {
    if (!onHome) return;
    const els = HOME_SECTIONS.map(s => document.getElementById(s.id)).filter(Boolean);
    if (!els.length) return;
    const obs = new IntersectionObserver(
      entries => {
        const visible = entries.filter(e => e.isIntersecting);
        if (visible.length) {
          const top = visible.reduce((a, b) => (a.intersectionRatio > b.intersectionRatio ? a : b));
          setActiveSection(top.target.id);
        }
      },
      { rootMargin: '-45% 0px -45% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] }
    );
    els.forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, [onHome]);

  const goToSection = (id) => {
    setMenuOpen(false);
    if (onHome) {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
      window.history.replaceState(null, '', `#${id}`);
      setActiveSection(id);
    } else {
      navigate(`/#${id}`);
    }
  };

  const isProfileActive = user?.username ? location.pathname.startsWith(`/profile/${user.username}`) : false;

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/marketplace?search=${encodeURIComponent(searchQuery)}`);
      setSearchOpen(false);
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to={user ? '/feed' : '/'} className="navbar-logo">Earts</Link>

        <div className={`navbar-links ${menuOpen ? 'open' : ''}`}>
          {!user && HOME_SECTIONS.map(s => (
            <button
              key={s.id}
              className={`nav-link nav-link-tab ${onHome && activeSection === s.id ? 'active' : ''}`}
              onClick={() => goToSection(s.id)}
            >
              {s.label}
            </button>
          ))}
          {user && (
            <>
              <Link
                to="/feed"
                className={`nav-link ${location.pathname.startsWith('/feed') ? 'active' : ''}`}
                onClick={() => setMenuOpen(false)}
              >
                Feed
              </Link>
              <Link
                to="/marketplace"
                className={`nav-link ${location.pathname.startsWith('/marketplace') ? 'active' : ''}`}
                onClick={() => setMenuOpen(false)}
              >
                Marketplace
              </Link>
              {user.accountType !== 'collector' && (
                <Link
                  to="/upload"
                  className={`nav-link ${location.pathname.startsWith('/upload') ? 'active' : ''}`}
                  onClick={() => setMenuOpen(false)}
                >
                  Upload
                </Link>
              )}
              <Link
                to={user?.username ? `/profile/${user.username}` : '/login'}
                className={`nav-link ${isProfileActive ? 'active' : ''}`}
                onClick={() => setMenuOpen(false)}
              >
                My Profile
              </Link>
            </>
          )}
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
                        <Link to="/settings" onClick={() => setDropdownOpen(false)}>Settings</Link>
                        <button onClick={() => { logout(); setDropdownOpen(false); navigate('/'); }}>Sign Out</button>
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
