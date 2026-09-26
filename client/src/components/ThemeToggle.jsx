import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import './ThemeToggle.css';

export default function ThemeToggle({ className = '', variant = 'icon', showLabel = false }) {
  const { isDark, toggleTheme } = useTheme();

  if (variant === 'sidebar') {
    return (
      <button
        type="button"
        className={`sidebar-link theme-toggle-sidebar ${className}`}
        onClick={toggleTheme}
        title={isDark ? 'Switch to Light mode' : 'Switch to Dark mode'}
        aria-label="Toggle theme"
      >
        <span className="sidebar-icon-box theme-toggle-icon-box">
          {isDark ? <Sun size={20} className="theme-icon sun-icon" /> : <Moon size={20} className="theme-icon moon-icon" />}
        </span>
        <span className="sidebar-label">
          {isDark ? 'Light Mode' : 'Dark Mode'}
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      className={`theme-toggle-btn ${className}`}
      onClick={toggleTheme}
      title={isDark ? 'Switch to Light mode' : 'Switch to Dark mode'}
      aria-label="Toggle theme"
    >
      <span className="theme-toggle-icon-wrap">
        {isDark ? <Sun size={18} className="theme-icon sun-icon" /> : <Moon size={18} className="theme-icon moon-icon" />}
      </span>
      {showLabel && (
        <span className="theme-toggle-label">{isDark ? 'Light' : 'Dark'}</span>
      )}
    </button>
  );
}
