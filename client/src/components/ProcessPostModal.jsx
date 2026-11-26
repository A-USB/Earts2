import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { api } from '../utils/api';
import ImageDropzone from './ImageDropzone';
import './ProcessPostModal.css';

const STAGES = ['Idea', 'Sketch', 'Linework', 'Underpainting', 'Colour blocking', 'Details', 'Final touches', 'Studio'];

/** Share a work-in-progress update, optionally linked to one of your artworks. */
export default function ProcessPostModal({ artworks = [], defaultArtworkId = '', onClose, onPosted }) {
  const [image, setImage] = useState(null);
  const [caption, setCaption] = useState('');
  const [stage, setStage] = useState('');
  const [artworkId, setArtworkId] = useState(defaultArtworkId);
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
    if (!image) { setError('Add an image of your work in progress.'); return; }
    setBusy(true);
    setError('');
    try {
      const post = await api.post('/process', {
        imageUrl: image.dataUrl,
        color: image.color,
        caption: caption.trim(),
        stage: stage.trim(),
        artworkId: artworkId || undefined,
      });
      onPosted?.(post);
      onClose();
    } catch (err) {
      setError(err.message || 'Unable to share this update.');
    } finally {
      setBusy(false);
    }
  };

  return createPortal(
    <div className="pp-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onClose(); }}>
      <form className="pp-card" role="dialog" aria-modal="true" aria-labelledby="pp-title" tabIndex={-1} ref={cardRef} onSubmit={submit} noValidate>
        <header className="pp-head">
          <div>
            <h3 id="pp-title">Share a process update</h3>
            <p>Show how a piece comes together, from the first sketch to the last touch.</p>
          </div>
          <button type="button" className="pp-close" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </header>

        {error && <div className="pp-error" role="alert">{error}</div>}

        <ImageDropzone image={image} onChange={setImage} />

        <div className="pp-row">
          <div className="pp-field">
            <label htmlFor="pp-stage">Stage <span>(optional)</span></label>
            <input id="pp-stage" list="pp-stages" value={stage} maxLength={40} onChange={e => setStage(e.target.value)} placeholder="e.g. Sketch" />
            <datalist id="pp-stages">{STAGES.map(item => <option key={item} value={item} />)}</datalist>
          </div>
          {artworks.length > 0 && (
            <div className="pp-field">
              <label htmlFor="pp-artwork">Belongs to <span>(optional)</span></label>
              <select id="pp-artwork" value={artworkId} onChange={e => setArtworkId(e.target.value)}>
                <option value="">Not linked to a finished piece</option>
                {artworks.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}
              </select>
            </div>
          )}
        </div>

        <div className="pp-field">
          <label htmlFor="pp-caption">Caption <span>(optional)</span></label>
          <textarea id="pp-caption" rows={3} maxLength={500} value={caption} onChange={e => setCaption(e.target.value)} placeholder="What are you working on? What was tricky?" />
          <span className="pp-count">{caption.length}/500</span>
        </div>

        <div className="pp-actions">
          <button type="button" className="btn-outline" onClick={onClose} disabled={busy}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={busy}>{busy ? 'Sharing…' : 'Share update'}</button>
        </div>
      </form>
    </div>,
    document.body
  );
}
