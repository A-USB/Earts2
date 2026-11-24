import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import { api } from '../utils/api';
import Avatar from './Avatar';
import './VerificationQueue.css';

const STATUSES = [['pending', 'Pending'], ['approved', 'Approved'], ['rejected', 'Rejected'], ['revoked', 'Revoked']];
const formatDate = (value) => new Date(value).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

function RequestCard({ item, onDone }) {
  const [mode, setMode] = useState(null); // 'reject' | 'revoke' while a reason is being typed
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const decide = async (decision, text = '') => {
    setBusy(true);
    setError('');
    try {
      await api.patch(`/moderation/verifications/${item.id}`, { decision, note: text });
      onDone(item.id);
    } catch (err) {
      setError(err.message || 'Unable to save this decision.');
      setBusy(false);
    }
  };

  const user = item.user;
  return (
    <article className="vq-card card">
      <header className="vq-head">
        {user ? (
          <Link to={`/profile/${user.username}`} className="vq-person">
            <Avatar seed={user.avatarSeed || user.username} src={user.avatar} size={46} />
            <span><strong>{user.name}</strong><small>@{user.username} · {user.role}{user.location ? ` · ${user.location}` : ''}</small></span>
          </Link>
        ) : <span className="vq-person"><strong>Account removed</strong></span>}
        <span className={`vq-status status-${item.status}`}>{item.status}</span>
      </header>

      {user && (
        <dl className="vq-stats">
          <div><dt>Joined</dt><dd>{formatDate(user.joinedAt)}</dd></div>
          <div><dt>Artworks</dt><dd>{user.artworkCount}</dd></div>
          <div><dt>Followers</dt><dd>{user.followers}</dd></div>
          <div><dt>Sold</dt><dd>{user.artworksSold}</dd></div>
        </dl>
      )}

      <p className="vq-statement">{item.statement}</p>
      {item.links?.length > 0 && (
        <ul className="vq-links">
          {item.links.map(link => (
            <li key={link}><a href={link} target="_blank" rel="noopener noreferrer nofollow"><ExternalLink size={13} /> {link}</a></li>
          ))}
        </ul>
      )}
      <p className="vq-meta">Submitted {formatDate(item.createdAt)}{item.reviewerNote ? ` · Note: ${item.reviewerNote}` : ''}</p>

      {error && <p className="vq-error" role="alert">{error}</p>}

      {(item.status === 'pending' || item.status === 'approved') && (
        mode ? (
          <div className="vq-reason">
            <label htmlFor={`vq-note-${item.id}`}>{mode === 'reject' ? 'Reason for the artist (required)' : 'Reason for removing the badge (optional)'}</label>
            <textarea id={`vq-note-${item.id}`} rows={3} maxLength={300} value={note} onChange={e => setNote(e.target.value)} autoFocus />
            <div className="vq-buttons">
              <button type="button" className="btn-ghost" onClick={() => { setMode(null); setNote(''); }} disabled={busy}>Back</button>
              <button type="button" className="vq-danger" onClick={() => decide(mode, note)} disabled={busy}>{busy ? 'Saving…' : mode === 'reject' ? 'Reject request' : 'Remove badge'}</button>
            </div>
          </div>
        ) : (
          <div className="vq-buttons">
            {item.status === 'pending' ? (
              <>
                <button type="button" className="btn-outline" onClick={() => setMode('reject')} disabled={busy}>Reject</button>
                <button type="button" className="btn-primary" onClick={() => decide('approve')} disabled={busy}>{busy ? 'Saving…' : 'Approve'}</button>
              </>
            ) : (
              <button type="button" className="btn-outline" onClick={() => setMode('revoke')} disabled={busy}>Revoke badge</button>
            )}
          </div>
        )
      )}
    </article>
  );
}

export default function VerificationQueue() {
  const [status, setStatus] = useState('pending');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    api.get(`/moderation/verifications?status=${status}`)
      .then(setItems)
      .catch(err => setError(err.message || 'Unable to load requests.'))
      .finally(() => setLoading(false));
  }, [status]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="vq">
      <div className="vq-filters" role="tablist" aria-label="Request status">
        {STATUSES.map(([value, label]) => (
          <button key={value} type="button" role="tab" aria-selected={status === value} className={`vq-filter${status === value ? ' active' : ''}`} onClick={() => setStatus(value)}>{label}</button>
        ))}
      </div>
      {error && <div className="moderation-error" role="alert">{error}</div>}
      {loading ? (
        <p className="vq-loading" role="status">Loading requests…</p>
      ) : items.length === 0 ? (
        <div className="vq-empty card"><p>No {status} verification requests.</p></div>
      ) : (
        <div className="vq-list">
          {items.map(item => <RequestCard key={item.id} item={item} onDone={(id) => setItems(current => current.filter(entry => entry.id !== id))} />)}
        </div>
      )}
    </div>
  );
}
