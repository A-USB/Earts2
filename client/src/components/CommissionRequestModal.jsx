import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { X, Palette, CheckCircle2 } from 'lucide-react';
import { api } from '../utils/api';
import './CommissionRequestModal.css';

const tomorrow = () => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

export default function CommissionRequestModal({ artist, onClose }) {
  const [title, setTitle] = useState('');
  const [brief, setBrief] = useState('');
  const [budget, setBudget] = useState('');
  const [deadline, setDeadline] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
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
    setError('');
    if (title.trim().length < 3) { setError('Give your commission a short title.'); return; }
    if (brief.trim().length < 20) { setError('Describe what you would like in at least 20 characters.'); return; }
    setBusy(true);
    try {
      await api.post('/commissions', {
        artistId: artist.id,
        title: title.trim(),
        brief: brief.trim(),
        budget: budget || undefined,
        deadline: deadline || undefined,
      });
      setSent(true);
    } catch (err) {
      setError(err.message || 'Unable to send your request.');
    } finally {
      setBusy(false);
    }
  };

  return createPortal(
    <div className="commission-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onClose(); }}>
      <div className="commission-card" role="dialog" aria-modal="true" aria-labelledby="commission-title" tabIndex={-1} ref={cardRef}>
        <header className="commission-head">
          <div className="commission-head-icon"><Palette size={20} /></div>
          <div>
            <h3 id="commission-title">{sent ? 'Request sent' : `Commission ${artist.firstName || artist.username}`}</h3>
            <p>{sent ? 'They will review it and reply with a quote.' : 'Describe what you have in mind. The artist replies with a quote before anything is agreed.'}</p>
          </div>
          <button type="button" className="commission-close" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </header>

        {sent ? (
          <div className="commission-sent">
            <CheckCircle2 size={40} />
            <p>You can follow the conversation and the status in your commissions.</p>
            <div className="commission-actions">
              <button type="button" className="btn-outline" onClick={onClose}>Close</button>
              <Link to="/commissions?tab=sent" className="btn-primary" onClick={onClose}>View my requests</Link>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} noValidate>
            <div className="commission-field">
              <label htmlFor="cm-title">Title</label>
              <input id="cm-title" type="text" maxLength={100} value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Portrait of my dog in watercolour" autoFocus />
            </div>

            <div className="commission-field">
              <label htmlFor="cm-brief">What would you like?</label>
              <textarea id="cm-brief" rows={5} maxLength={2000} value={brief} onChange={e => setBrief(e.target.value)} placeholder="Subject, style, size, colours, where it will be used, any references…" />
              <span className="commission-count">{brief.length}/2000</span>
            </div>

            <div className="commission-row">
              <div className="commission-field">
                <label htmlFor="cm-budget">Budget (USD, optional)</label>
                <input id="cm-budget" type="number" inputMode="decimal" min="1" value={budget} onChange={e => setBudget(e.target.value)} placeholder="e.g. 150" />
              </div>
              <div className="commission-field">
                <label htmlFor="cm-deadline">Needed by (optional)</label>
                <input id="cm-deadline" type="date" min={tomorrow()} value={deadline} onChange={e => setDeadline(e.target.value)} />
              </div>
            </div>

            <p className="commission-note">Payments aren’t processed on Earts yet. The price you agree is a record between you and the artist.</p>
            {error && <p className="commission-error" role="alert">{error}</p>}

            <div className="commission-actions">
              <button type="button" className="btn-outline" onClick={onClose} disabled={busy}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={busy}>{busy ? 'Sending…' : 'Send request'}</button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
}
