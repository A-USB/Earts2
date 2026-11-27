import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { X, Check } from 'lucide-react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import './ChallengeEntryPicker.css';

/** Choose one of your artworks made after the challenge started. */
export default function ChallengeEntryPicker({ challenge, enteredArtworkIds, onClose, onEntered }) {
  const { user } = useAuth();
  const [artworks, setArtworks] = useState(null);
  const [selected, setSelected] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const cardRef = useRef(null);

  useEffect(() => {
    const previouslyFocused = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    cardRef.current?.focus();
    const onKey = (event) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
    };
  }, [onClose]);

  useEffect(() => {
    let cancelled = false;
    api.get(`/artworks?artistId=${encodeURIComponent(user.id)}&sort=latest`)
      .then(list => {
        if (cancelled) return;
        setArtworks(list.filter(item => Number(item.createdAt) >= challenge.startsAt && !enteredArtworkIds.includes(item.id)));
      })
      .catch(err => { if (!cancelled) { setArtworks([]); setError(err.message || 'Unable to load your artworks.'); } });
    return () => { cancelled = true; };
  }, [user.id, challenge.startsAt, enteredArtworkIds]);

  const submit = async () => {
    if (!selected || busy) return;
    setBusy(true);
    setError('');
    try {
      await api.post(`/challenges/${challenge.id}/entries`, { artworkId: selected });
      onEntered?.();
      onClose();
    } catch (err) {
      setError(err.message || 'Unable to enter this challenge.');
      setBusy(false);
    }
  };

  return createPortal(
    <div className="cep-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onClose(); }}>
      <div className="cep-card" role="dialog" aria-modal="true" aria-labelledby="cep-title" tabIndex={-1} ref={cardRef}>
        <header className="cep-head">
          <div>
            <h3 id="cep-title">Enter “{challenge.title}”</h3>
            <p>Choose new work you uploaded after the challenge started.</p>
          </div>
          <button type="button" className="cep-close" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </header>

        {error && <div className="cep-error" role="alert">{error}</div>}

        {!artworks ? (
          <p className="cep-muted" role="status">Loading your artworks…</p>
        ) : artworks.length === 0 ? (
          <div className="cep-empty">
            <p>You don’t have an eligible artwork yet. Upload something new for this theme, then come back to enter it.</p>
            <Link to="/upload" className="btn-primary" onClick={onClose}>Upload new work</Link>
          </div>
        ) : (
          <ul className="cep-grid" role="radiogroup" aria-label="Your artworks">
            {artworks.map(item => (
              <li key={item.id}>
                <button
                  type="button"
                  role="radio"
                  aria-checked={selected === item.id}
                  className={`cep-item${selected === item.id ? ' selected' : ''}`}
                  onClick={() => setSelected(item.id)}
                >
                  <span className="cep-thumb" style={{ background: item.color || 'var(--primary-light)' }}>
                    {item.imageUrl && <img src={item.imageUrl} alt="" loading="lazy" />}
                    {selected === item.id && <span className="cep-check"><Check size={16} /></span>}
                  </span>
                  <span className="cep-title">{item.title}</span>
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="cep-actions">
          <button type="button" className="btn-outline" onClick={onClose} disabled={busy}>Cancel</button>
          <button type="button" className="btn-primary" onClick={submit} disabled={!selected || busy}>{busy ? 'Entering…' : 'Enter challenge'}</button>
        </div>
      </div>
    </div>,
    document.body
  );
}
