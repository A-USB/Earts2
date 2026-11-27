import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Trophy } from 'lucide-react';
import { api } from '../utils/api';
import { normalizeTag } from '../utils/tags';
import './ChallengeFormModal.css';

const todayKey = () => new Date().toISOString().slice(0, 10);

/** Moderators: open a new challenge. */
export default function ChallengeFormModal({ onClose, onCreated }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tag, setTag] = useState('');
  const [startDate, setStartDate] = useState(todayKey());
  const [endDate, setEndDate] = useState('');
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

  const submit = async (event) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      const created = await api.post('/challenges', { title, description, tag: tag || undefined, startDate, endDate });
      onCreated?.(created);
      onClose();
    } catch (err) {
      setError(err.message || 'Unable to create this challenge.');
    } finally {
      setBusy(false);
    }
  };

  return createPortal(
    <div className="cf-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onClose(); }}>
      <form className="cf-card" role="dialog" aria-modal="true" aria-labelledby="cf-title" tabIndex={-1} ref={cardRef} onSubmit={submit} noValidate>
        <header className="cf-head">
          <div className="cf-icon"><Trophy size={20} /></div>
          <div>
            <h3 id="cf-title">New challenge</h3>
            <p>Artists enter new work made after the start date. Everyone votes, and the top three win.</p>
          </div>
          <button type="button" className="cf-close" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </header>

        {error && <div className="cf-error" role="alert">{error}</div>}

        <div className="cf-field">
          <label htmlFor="cf-name">Title</label>
          <input id="cf-name" value={title} maxLength={80} onChange={e => setTitle(e.target.value)} placeholder="e.g. Winter Light" autoFocus />
        </div>
        <div className="cf-field">
          <label htmlFor="cf-desc">Theme and rules</label>
          <textarea id="cf-desc" rows={5} maxLength={2000} value={description} onChange={e => setDescription(e.target.value)} placeholder="What should artists make? Any rules about medium, size or content?" />
          <span className="cf-count">{description.length}/2000</span>
        </div>
        <div className="cf-field">
          <label htmlFor="cf-tag">Tag <span>(optional)</span></label>
          <input id="cf-tag" value={tag} maxLength={30} onChange={e => setTag(e.target.value)} placeholder={normalizeTag(title) || 'winter-light'} />
          <small>Added to every entry so the work is easy to browse. Leave blank to use the title.</small>
        </div>
        <div className="cf-row">
          <div className="cf-field">
            <label htmlFor="cf-start">Starts</label>
            <input id="cf-start" type="date" min={todayKey()} value={startDate} onChange={e => setStartDate(e.target.value)} />
          </div>
          <div className="cf-field">
            <label htmlFor="cf-end">Ends (end of day, UTC)</label>
            <input id="cf-end" type="date" min={startDate || todayKey()} value={endDate} onChange={e => setEndDate(e.target.value)} />
          </div>
        </div>

        <div className="cf-actions">
          <button type="button" className="btn-outline" onClick={onClose} disabled={busy}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={busy}>{busy ? 'Creating…' : 'Create challenge'}</button>
        </div>
      </form>
    </div>,
    document.body
  );
}
