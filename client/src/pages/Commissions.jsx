import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Palette, Inbox, Send, Calendar, DollarSign, Clock, ChevronDown } from 'lucide-react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/Avatar';
import LoadError from '../components/LoadError';
import './Commissions.css';

const STATUS_LABEL = {
  requested: 'Requested',
  quoted: 'Quote sent',
  in_progress: 'In progress',
  delivered: 'Delivered',
  completed: 'Completed',
  declined: 'Declined',
  cancelled: 'Cancelled',
};

const FILTERS = [
  { id: 'active', label: 'Active', match: s => ['requested', 'quoted', 'in_progress', 'delivered'].includes(s) },
  { id: 'completed', label: 'Completed', match: s => s === 'completed' },
  { id: 'closed', label: 'Closed', match: s => ['declined', 'cancelled'].includes(s) },
  { id: 'all', label: 'All', match: () => true },
];

const ACTIVITY_LABEL = {
  request: 'sent the request',
  quote: 'sent a quote',
  decline: 'declined the request',
  accept: 'accepted the quote',
  deliver: 'delivered the work',
  revise: 'asked for changes',
  complete: 'approved and completed it',
  cancel: 'cancelled the commission',
};

// Order matters: main actions first, cancel / decline last
const ACTION_ORDER = ['quote', 'accept', 'deliver', 'complete', 'revise', 'decline', 'cancel'];

const ACTION_META = {
  quote: { label: 'Send quote', submit: 'Send quote', fields: ['price', 'days', 'note'], noteLabel: 'Message to the client (optional)' },
  accept: { label: 'Accept quote', submit: 'Accept quote', fields: [], confirm: c => `Accept the quote of ${money(c.quotePrice)} for about ${c.quoteDays} days of work?` },
  deliver: { label: 'Mark as delivered', submit: 'Mark as delivered', fields: ['note'], noteLabel: 'Delivery note (optional): say how you are sharing the final work' },
  complete: { label: 'Approve & complete', submit: 'Complete commission', fields: [], confirm: () => 'Approve the delivered work and complete this commission?' },
  revise: { label: 'Request changes', submit: 'Send request', fields: ['note'], noteLabel: 'What would you like changed?', noteRequired: true },
  decline: { label: 'Decline', submit: 'Yes, decline', fields: ['note'], noteLabel: 'Reason (optional)', confirm: () => 'Decline this request? The client will be told.', danger: true },
  cancel: { label: 'Cancel commission', submit: 'Yes, cancel', fields: ['note'], noteLabel: 'Reason (optional)', confirm: () => 'Cancel this commission? The other person will be told.', danger: true },
};

function money(value) {
  return `$${Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function formatDate(value, withYear = true) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', ...(withYear ? { year: 'numeric' } : {}) });
}

const needsAction = (item) => item.allowedActions?.some(action => action !== 'cancel');

function CommissionCard({ item, onUpdate }) {
  const [openAction, setOpenAction] = useState(null);
  const [price, setPrice] = useState('');
  const [days, setDays] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(false);

  const other = item.role === 'artist' ? item.client : item.artist;
  const roleLabel = item.role === 'artist' ? 'Client' : 'Artist';
  // "Decline" already covers cancelling for the artist, so don't show both
  const actions = ACTION_ORDER.filter(action => item.allowedActions?.includes(action)
    && !(action === 'cancel' && item.allowedActions.includes('decline')));
  const meta = openAction ? ACTION_META[openAction] : null;

  const open = (action) => {
    setError('');
    setNote('');
    setPrice(action === 'quote' ? String(item.quotePrice ?? item.budget ?? '') : '');
    setDays(action === 'quote' ? String(item.quoteDays ?? '') : '');
    setOpenAction(action);
  };
  const close = () => { setOpenAction(null); setError(''); };

  const submit = async (event) => {
    event.preventDefault();
    if (busy || !meta) return;
    if (meta.noteRequired && note.trim().length < 5) { setError('Please add a short note.'); return; }
    setBusy(true);
    setError('');
    try {
      const body = { action: openAction };
      if (meta.fields.includes('note')) body.note = note;
      if (openAction === 'quote') { body.price = Number(price); body.days = Number(days); }
      const updated = await api.patch(`/commissions/${item.id}/action`, body);
      onUpdate(updated);
      close();
    } catch (err) {
      setError(err.message || 'Unable to update this commission.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <li className="cm-item">
      <div className="cm-top">
        <div className="cm-title-block">
          <div className="cm-title-row">
            <h3 className="cm-title">{item.title}</h3>
            <span className={`cm-badge status-${item.status}`}>{STATUS_LABEL[item.status] || item.status}</span>
            {needsAction(item) && <span className="cm-attn">Your turn</span>}
          </div>
          <div className="cm-meta">
            {other && (
              <Link to={`/profile/${other.username}`} className="cm-person">
                <Avatar seed={other.avatarSeed || other.username} src={other.avatar} size={22} />
                <span>{roleLabel}: {other.name}</span>
              </Link>
            )}
            <span><Calendar size={13} /> {formatDate(item.createdAt)}</span>
            {item.budget !== null && item.budget !== undefined && <span><DollarSign size={13} /> Budget {money(item.budget)}</span>}
            {item.deadline && <span><Clock size={13} /> Needed by {formatDate(item.deadline)}</span>}
          </div>
        </div>
      </div>

      <p className={`cm-brief${expanded ? ' open' : ''}`}>{item.brief}</p>
      {item.brief.length > 220 && (
        <button type="button" className="cm-more" onClick={() => setExpanded(v => !v)}>{expanded ? 'Show less' : 'Show more'}</button>
      )}

      {item.quotePrice !== null && item.quotePrice !== undefined && (
        <div className="cm-quote">
          <div><strong>{money(item.quotePrice)}</strong><span>Quoted price</span></div>
          <div><strong>{item.quoteDays} {item.quoteDays === 1 ? 'day' : 'days'}</strong><span>Estimated time</span></div>
          {item.quoteNote && <p>“{item.quoteNote}”</p>}
        </div>
      )}

      {actions.length > 0 && (
        <div className="cm-actions">
          {meta ? (
            <form className="cm-form" onSubmit={submit} noValidate>
              {meta.confirm && <p className="cm-confirm-text">{meta.confirm(item)}</p>}
              {meta.fields.includes('price') && (
                <div className="cm-form-row">
                  <label>Price (USD)
                    <input type="number" min="1" inputMode="decimal" value={price} onChange={e => setPrice(e.target.value)} placeholder="e.g. 120" />
                  </label>
                  <label>Estimated days
                    <input type="number" min="1" max="365" inputMode="numeric" value={days} onChange={e => setDays(e.target.value)} placeholder="e.g. 7" />
                  </label>
                </div>
              )}
              {meta.fields.includes('note') && (
                <label>{meta.noteLabel}
                  <textarea rows={3} maxLength={500} value={note} onChange={e => setNote(e.target.value)} />
                </label>
              )}
              {error && <p className="cm-error" role="alert">{error}</p>}
              <div className="cm-form-buttons">
                <button type="button" className="btn-ghost" onClick={close} disabled={busy}>Back</button>
                <button type="submit" className={meta.danger ? 'cm-danger' : 'btn-primary'} disabled={busy}>{busy ? 'Saving…' : meta.submit}</button>
              </div>
            </form>
          ) : (
            actions.map(action => (
              <button
                key={action}
                type="button"
                className={ACTION_META[action].danger ? 'cm-link-danger' : actions.indexOf(action) === 0 ? 'btn-primary cm-action-btn' : 'btn-outline cm-action-btn'}
                onClick={() => open(action)}
              >
                {action === 'quote' && item.status === 'quoted' ? 'Update quote' : ACTION_META[action].label}
              </button>
            ))
          )}
        </div>
      )}

      <details className="cm-history">
        <summary><ChevronDown size={14} /> History</summary>
        <ul>
          {[...(item.activity || [])].reverse().map((entry, index) => (
            <li key={`${entry.at}-${index}`}>
              <span className="cm-history-date">{formatDate(entry.at, false)}</span>
              <span>
                <strong>{entry.by === item.role ? 'You' : (other?.name || (entry.by === 'client' ? 'Client' : 'Artist'))}</strong>{' '}
                {ACTIVITY_LABEL[entry.action] || entry.action}
                {entry.price ? ` (${money(entry.price)})` : ''}
                {entry.note ? <em>“{entry.note}”</em> : null}
              </span>
            </li>
          ))}
        </ul>
      </details>
    </li>
  );
}

export default function Commissions() {
  const { user } = useAuth();
  const isArtist = user?.accountType === 'artist';
  const [searchParams, setSearchParams] = useSearchParams();
  const [lists, setLists] = useState({ received: [], sent: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('active');

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    Promise.all([
      isArtist ? api.get('/commissions?role=received') : Promise.resolve([]),
      api.get('/commissions?role=sent'),
    ])
      .then(([received, sent]) => setLists({ received, sent }))
      .catch(err => setError(err.message || 'Unable to load your commissions.'))
      .finally(() => setLoading(false));
  }, [isArtist]);

  useEffect(() => { load(); }, [load]);

  const requestedTab = searchParams.get('tab');
  const attention = useMemo(() => ({
    received: lists.received.filter(needsAction).length,
    sent: lists.sent.filter(needsAction).length,
  }), [lists]);

  // Land where something is waiting for you, unless the link says otherwise
  const tab = requestedTab === 'sent' || requestedTab === 'received'
    ? (requestedTab === 'received' && !isArtist ? 'sent' : requestedTab)
    : isArtist && (attention.received > 0 || attention.sent === 0) ? 'received' : 'sent';

  const chooseTab = (next) => setSearchParams({ tab: next }, { replace: true });

  const active = FILTERS.find(f => f.id === filter) || FILTERS[0];
  const items = lists[tab].filter(item => active.match(item.status));

  const replaceItem = (updated) => {
    setLists(prev => ({
      ...prev,
      [tab]: prev[tab].map(item => (item.id === updated.id ? { ...item, ...updated } : item)),
    }));
  };

  return (
    <div className="commissions-page page-wrapper">
      <div className="container commissions-container">
        <div className="commissions-header">
          <div>
            <h1><Palette size={26} /> Commissions</h1>
            <p>{isArtist ? 'Requests from clients, and the custom work you have asked others to make.' : 'Custom work you have requested from artists.'}</p>
          </div>
        </div>

        <p className="commissions-banner">Payments aren’t processed on Earts yet. A quote is a record of what you agreed.</p>

        {isArtist && (
          <div className="cm-tabs" role="tablist" aria-label="Commission direction">
            <button type="button" role="tab" aria-selected={tab === 'received'} className={`cm-tab${tab === 'received' ? ' active' : ''}`} onClick={() => chooseTab('received')}>
              <Inbox size={15} /> Received {attention.received > 0 && <span className="cm-dot">{attention.received}</span>}
            </button>
            <button type="button" role="tab" aria-selected={tab === 'sent'} className={`cm-tab${tab === 'sent' ? ' active' : ''}`} onClick={() => chooseTab('sent')}>
              <Send size={15} /> Sent {attention.sent > 0 && <span className="cm-dot">{attention.sent}</span>}
            </button>
          </div>
        )}

        <div className="cm-filters" role="tablist" aria-label="Filter commissions">
          {FILTERS.map(f => (
            <button key={f.id} type="button" role="tab" aria-selected={filter === f.id} className={`cm-filter${filter === f.id ? ' active' : ''}`} onClick={() => setFilter(f.id)}>
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="cm-loading" role="status">Loading your commissions…</div>
        ) : error ? (
          <LoadError title="Couldn’t load your commissions" message={error} onRetry={load} />
        ) : items.length === 0 ? (
          <div className="cm-empty card">
            <Palette size={32} />
            <h4>{lists[tab].length === 0 ? (tab === 'received' ? 'No requests yet' : 'No commissions yet') : 'Nothing in this view'}</h4>
            <p>
              {lists[tab].length === 0
                ? (tab === 'received'
                    ? 'When someone asks you for custom work, it will show up here. Make sure “Commissions” is ticked under your availability in Settings.'
                    : 'Find an artist who is open to commissions and use the Commission button on their profile.')
                : 'Try another filter to see your other commissions.'}
            </p>
            {lists[tab].length === 0 && tab === 'sent' && <Link to="/search" className="btn-outline">Find artists</Link>}
          </div>
        ) : (
          <ul className="cm-list">
            {items.map(item => <CommissionCard key={item.id} item={item} onUpdate={replaceItem} />)}
          </ul>
        )}
      </div>
    </div>
  );
}
