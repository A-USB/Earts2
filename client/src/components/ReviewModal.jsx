import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Star, X } from 'lucide-react';
import { api } from '../utils/api';
import './ReviewModal.css';

const RATING_WORDS = ['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'];

/**
 * Create or edit a review.
 * create: <ReviewModal target={{ source, sourceId, title, artistName }} />   edit: <ReviewModal review={review} />
 */
export default function ReviewModal({ target, review, onClose, onSaved }) {
  const editing = Boolean(review);
  const [rating, setRating] = useState(review?.rating || 0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState(review?.comment || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const cardRef = useRef(null);

  const shown = hover || rating;
  const heading = editing ? 'Edit your review' : `Rate ${target?.artistName || 'this artist'}`;
  const subject = editing ? review.context : target?.title;

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

  const onStarKey = (event) => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowUp') { event.preventDefault(); setRating(r => Math.min(5, (r || 0) + 1)); }
    if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') { event.preventDefault(); setRating(r => Math.max(1, (r || 2) - 1)); }
  };

  const submit = async (event) => {
    event.preventDefault();
    if (busy) return;
    if (!rating) { setError('Choose a star rating first.'); return; }
    setBusy(true);
    setError('');
    try {
      const saved = editing
        ? await api.patch(`/reviews/${review.id}`, { rating, comment })
        : await api.post('/reviews', { source: target.source, sourceId: target.sourceId, rating, comment });
      onSaved?.(saved);
      onClose();
    } catch (err) {
      setError(err.message || 'Unable to save your review.');
    } finally {
      setBusy(false);
    }
  };

  return createPortal(
    <div className="review-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onClose(); }}>
      <form className="review-card" role="dialog" aria-modal="true" aria-labelledby="review-title" tabIndex={-1} ref={cardRef} onSubmit={submit} noValidate>
        <header className="review-head">
          <div>
            <h3 id="review-title">{heading}</h3>
            {subject && <p>{editing ? 'Review of' : 'For'} “{subject}”</p>}
          </div>
          <button type="button" className="review-close" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </header>

        <div className="review-stars" role="radiogroup" aria-label="Rating" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map(value => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={rating === value}
              aria-label={`${value} ${value === 1 ? 'star' : 'stars'}`}
              tabIndex={rating === value || (!rating && value === 1) ? 0 : -1}
              className={`review-star${value <= shown ? ' on' : ''}`}
              onClick={() => setRating(value)}
              onMouseEnter={() => setHover(value)}
              onKeyDown={onStarKey}
            >
              <Star size={34} fill={value <= shown ? 'currentColor' : 'none'} />
            </button>
          ))}
          <span className="review-word" aria-live="polite">{RATING_WORDS[shown]}</span>
        </div>

        <div className="review-field">
          <label htmlFor="review-comment">Your review <span>(optional)</span></label>
          <textarea
            id="review-comment"
            rows={5}
            maxLength={1000}
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="What was it like? Quality, communication, delivery…"
          />
          <span className="review-count">{comment.length}/1000</span>
        </div>

        {error && <p className="review-error" role="alert">{error}</p>}

        <div className="review-actions">
          <button type="button" className="btn-outline" onClick={onClose} disabled={busy}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={busy}>{busy ? 'Saving…' : editing ? 'Save changes' : 'Post review'}</button>
        </div>
      </form>
    </div>,
    document.body
  );
}
