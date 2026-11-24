import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquareQuote, Pencil, Trash2, Reply } from 'lucide-react';
import { api } from '../utils/api';
import Avatar from './Avatar';
import LoadError from './LoadError';
import StarRating from './StarRating';
import ReviewModal from './ReviewModal';
import './ReviewsPanel.css';

const formatDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
};

function ReviewItem({ review, isArtistOwner, meId, onEdit, onChanged }) {
  const [replying, setReplying] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const mine = Boolean(meId) && meId === review.reviewerId;

  const run = async (task) => {
    setBusy(true);
    setError('');
    try { await task(); } catch (err) { setError(err.message || 'Something went wrong.'); } finally { setBusy(false); }
  };

  const saveReply = (event) => {
    event.preventDefault();
    run(async () => {
      const updated = await api.put(`/reviews/${review.id}/reply`, { reply: replyText });
      onChanged({ type: 'update', review: { ...review, ...updated } });
      setReplying(false);
    });
  };

  const removeReply = () => run(async () => {
    const updated = await api.delete(`/reviews/${review.id}/reply`);
    onChanged({ type: 'update', review: { ...review, ...updated } });
  });

  const deleteReview = () => run(async () => {
    await api.delete(`/reviews/${review.id}`);
    onChanged({ type: 'delete', id: review.id });
  });

  const reviewer = review.reviewer;

  return (
    <li className="rv-item">
      <div className="rv-top">
        {reviewer ? (
          <Link to={`/profile/${reviewer.username}`} className="rv-person">
            <Avatar seed={reviewer.avatarSeed || reviewer.username} src={reviewer.avatar} size={36} />
            <span><strong>{reviewer.name}</strong><small>{formatDate(review.createdAt)}{review.edited ? ' · edited' : ''}</small></span>
          </Link>
        ) : (
          <div className="rv-person"><Avatar seed="former" size={36} /><span><strong>Former member</strong><small>{formatDate(review.createdAt)}</small></span></div>
        )}
        <StarRating value={review.rating} size={16} />
      </div>

      <p className="rv-context">{review.source === 'commission' ? 'Commission' : 'Purchased'}: {review.context}</p>
      {review.comment && <p className="rv-comment">{review.comment}</p>}

      {review.reply && !replying && (
        <div className="rv-reply">
          <strong>Reply from the artist</strong>
          <p>{review.reply}</p>
        </div>
      )}

      {replying && (
        <form className="rv-reply-form" onSubmit={saveReply}>
          <label htmlFor={`reply-${review.id}`}>Your public reply</label>
          <textarea id={`reply-${review.id}`} rows={3} maxLength={500} value={replyText} onChange={e => setReplyText(e.target.value)} autoFocus />
          <div className="rv-row-buttons">
            <button type="button" className="btn-ghost" onClick={() => setReplying(false)} disabled={busy}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Post reply'}</button>
          </div>
        </form>
      )}

      {error && <p className="rv-error" role="alert">{error}</p>}

      {!replying && (mine || isArtistOwner) && (
        <div className="rv-actions">
          {isArtistOwner && (
            <>
              <button type="button" onClick={() => { setReplyText(review.reply || ''); setReplying(true); }}>
                <Reply size={14} /> {review.reply ? 'Edit reply' : 'Reply'}
              </button>
              {review.reply && <button type="button" onClick={removeReply} disabled={busy}>Remove reply</button>}
            </>
          )}
          {mine && (
            <>
              <button type="button" onClick={() => onEdit(review)}><Pencil size={14} /> Edit</button>
              {confirmDelete ? (
                <span className="rv-confirm">
                  Delete this review?
                  <button type="button" onClick={() => setConfirmDelete(false)} disabled={busy}>Keep</button>
                  <button type="button" className="danger" onClick={deleteReview} disabled={busy}>{busy ? 'Deleting…' : 'Delete'}</button>
                </span>
              ) : (
                <button type="button" className="danger" onClick={() => setConfirmDelete(true)}><Trash2 size={14} /> Delete</button>
              )}
            </>
          )}
        </div>
      )}
    </li>
  );
}

/** Reviews tab on an artist's profile */
export default function ReviewsPanel({ username, isOwn, meId, onSummaryChange }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);

  const load = useCallback(() => {
    setError('');
    api.get(`/users/${encodeURIComponent(username)}/reviews`)
      .then(result => { setData(result); onSummaryChange?.(result); })
      .catch(err => setError(err.message || 'Unable to load reviews.'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username]);

  useEffect(() => { load(); }, [load]);

  if (error) return <LoadError title="Couldn’t load reviews" message={error} onRetry={load} />;
  if (!data) return <div className="rv-loading" role="status">Loading reviews…</div>;

  const handleChanged = (change) => {
    if (change.type === 'update') setData(prev => ({ ...prev, items: prev.items.map(item => (item.id === change.review.id ? change.review : item)) }));
    else load(); // deleting changes the average and counts, so reload them
  };

  return (
    <section className="rv-panel" aria-label="Reviews">
      {data.count === 0 ? (
        <div className="rv-empty card">
          <MessageSquareQuote size={32} />
          <h4>No reviews yet</h4>
          <p>Reviews appear here after a buyer’s order is delivered or a commission is completed.</p>
        </div>
      ) : (
        <>
          <div className="rv-summary card">
            <div className="rv-score">
              <strong>{data.average}</strong>
              <StarRating value={data.average} size={18} />
              <span>{data.count} {data.count === 1 ? 'review' : 'reviews'}</span>
            </div>
            <div className="rv-bars">
              {[5, 4, 3, 2, 1].map(stars => (
                <div className="rv-bar-row" key={stars}>
                  <span>{stars}★</span>
                  <div className="rv-bar"><div style={{ width: `${(data.distribution[stars] / data.count) * 100}%` }} /></div>
                  <span className="rv-bar-count">{data.distribution[stars]}</span>
                </div>
              ))}
            </div>
          </div>

          <ul className="rv-list">
            {data.items.map(review => (
              <ReviewItem key={review.id} review={review} isArtistOwner={isOwn} meId={meId} onEdit={setEditing} onChanged={handleChanged} />
            ))}
          </ul>
        </>
      )}

      {editing && (
        <ReviewModal
          review={editing}
          onClose={() => setEditing(null)}
          onSaved={() => load()}
        />
      )}
    </section>
  );
}
