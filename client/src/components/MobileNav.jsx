import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import {
  Rss, ShoppingBag, ImagePlus, User, Search, Bell, MessageSquare,
  Settings as SettingsIcon, LogOut, Moon, Sun, X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Avatar from './Avatar';
import { EartsLogo } from './EartsLogo';
import useUnreadNotificationCount from '../hooks/useUnreadNotificationCount';
import useUnreadMessageCount from '../hooks/useUnreadMessageCount';
import './MobileNav.css';

// Phone navigation: a slim top bar (logo, search, notifications, account) and a bottom tab bar
// for the places people go most. Replaces the desktop sidebar below 768px.
export default function MobileNav() {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const unreadNotifications = useUnreadNotificationCount(user?.id);
  const unreadMessages = useUnreadMessageCount(user?.id);
  const [sheetOpen, setSheetOpen] = useState(false);
  const accountBtnRef = useRef(null);
  const firstItemRef = useRef(null);

  // A chat thread is a focused full screen with its own header and composer
  const inThread = /^\/messages\/[^/]+/.test(location.pathname);
  const isCollector = user?.accountType === 'collector';
  const profilePath = user?.username ? `/profile/${user.username}` : '/login';

  // Close the account sheet on navigation, and let Escape close it
  useEffect(() => { setSheetOpen(false); }, [location.pathname]);
  useEffect(() => {
    if (!sheetOpen) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setSheetOpen(false); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    firstItemRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
      accountBtnRef.current?.focus();
    };
  }, [sheetOpen]);

  const tabs = [
    { to: '/feed', label: 'Feed', Icon: Rss },
    { to: '/marketplace', label: 'Market', Icon: ShoppingBag },
    isCollector
      ? { to: '/search', label: 'Artists', Icon: Search }
      : { to: '/upload', label: 'Upload', Icon: ImagePlus },
    { to: '/messages', label: 'Messages', Icon: MessageSquare, badge: unreadMessages },
    { to: profilePath, label: 'Profile', Icon: User, match: user?.username ? `/profile/${user.username}` : null },
  ];

  const isActive = (tab) => (tab.match ? location.pathname.startsWith(tab.match) : location.pathname.startsWith(tab.to));

  return (
    <>
      {!inThread && (
        <header className="mnav-top">
          <Link to="/feed" className="mnav-logo" aria-label="Earts home"><EartsLogo size={30} /></Link>
          <div className="mnav-top-actions">
            <Link to="/search" className="mnav-icon-btn" aria-label="Search artists"><Search size={22} /></Link>
            <Link to="/notifications" className="mnav-icon-btn" aria-label={unreadNotifications ? `Notifications, ${unreadNotifications} unread` : 'Notifications'}>
              <Bell size={22} />
              {unreadNotifications > 0 && <span className="mnav-badge">{unreadNotifications > 99 ? '99+' : unreadNotifications}</span>}
            </Link>
            <button
              type="button"
              ref={accountBtnRef}
              className="mnav-icon-btn mnav-account"
              onClick={() => setSheetOpen(true)}
              aria-label="Account menu"
              aria-haspopup="dialog"
            >
              <Avatar seed={user?.avatarSeed || (user?.firstName || '') + (user?.lastName || '')} src={user?.avatar} size={34} />
            </button>
          </div>
        </header>
      )}

      {!inThread && (
        <nav className="mnav-tabs" aria-label="Main">
          {tabs.map(tab => {
            const active = isActive(tab);
            return (
              <NavLink key={tab.label} to={tab.to} className={`mnav-tab ${active ? 'active' : ''}`} aria-current={active ? 'page' : undefined}>
                <span className="mnav-tab-icon">
                  <tab.Icon size={22} />
                  {tab.badge > 0 && <span className="mnav-badge">{tab.badge > 99 ? '99+' : tab.badge}</span>}
                </span>
                <span className="mnav-tab-label">{tab.label}</span>
              </NavLink>
            );
          })}
        </nav>
      )}

      {sheetOpen && createPortal(
        <div className="mnav-sheet-overlay" onClick={() => setSheetOpen(false)}>
          <div className="mnav-sheet" role="dialog" aria-modal="true" aria-label="Account menu" onClick={e => e.stopPropagation()}>
            <button type="button" className="mnav-sheet-close" onClick={() => setSheetOpen(false)} aria-label="Close menu"><X size={20} /></button>
            <div className="mnav-sheet-head">
              <Avatar seed={user?.avatarSeed || (user?.firstName || '') + (user?.lastName || '')} src={user?.avatar} size={52} />
              <div>
                <strong>{user?.firstName} {user?.lastName}</strong>
                <span>{user?.email}</span>
              </div>
            </div>
            <Link ref={firstItemRef} to={profilePath} className="mnav-sheet-item"><User size={20} /> My profile</Link>
            <Link to="/settings" className="mnav-sheet-item"><SettingsIcon size={20} /> Settings</Link>
            <button type="button" className="mnav-sheet-item" onClick={toggleTheme}>
              {isDark ? <Sun size={20} /> : <Moon size={20} />} {isDark ? 'Light mode' : 'Dark mode'}
            </button>
            <button type="button" className="mnav-sheet-item danger" onClick={() => { setSheetOpen(false); logout(); navigate('/login'); }}>
              <LogOut size={20} /> Sign out
            </button>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
