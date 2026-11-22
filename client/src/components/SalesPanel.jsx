import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Inbox, Package, CheckCircle2, DollarSign, Truck, XCircle, Check, ShoppingBag } from 'lucide-react';
import { api } from '../utils/api';
import Avatar from './Avatar';
import LoadError from './LoadError';
import './SalesPanel.css';

const STATUS_LABEL = {
  demo: 'New',
  confirmed: 'Confirmed',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

const ACTION_LABEL = {
  confirmed: 'Confirm order',
  shipped: 'Mark as shipped',
  delivered: 'Mark as delivered',
  cancelled: 'Cancel order',
};

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'open', label: 'Open', match: s => ['demo', 'confirmed', 'shipped'].includes(s) },
  { id: 'delivered', label: 'Delivered', match: s => s === 'delivered' },
  { id: 'cancelled', label: 'Cancelled', match: s => s === 'cancelled' },
];

const formatDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
};

const formatMoney = (value) => `$${Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

function ActionIcon({ status }) {
  if (status === 'shipped') return <Truck size={14} />;
  if (status === 'delivered') return <CheckCircle2 size={14} />;
  if (status === 'cancelled') return <XCircle size={14} />;
  return <Check size={14} />;
}

export default function SalesPanel() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [busyId, setBusyId] = useState('');
  const [pending, setPending] = useState(null); // { id, status } while a confirm / note step is open
  const [note, setNote] = useState('');
  const [actionError, setActionError] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    api.get('/users/me/sales')
      .then(data => setItems(Array.isArray(data?.items) ? data.items : []))
      .catch(err => setError(err.message || 'Unable to load your orders.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const summary = useMemo(() => {
    const counted = items.filter(o => o.status !== 'cancelled');
    return {
      total: items.length,
      open: items.filter(o => ['demo', 'confirmed', 'shipped'].includes(o.status)).length,
      delivered: items.filter(o => o.status === 'delivered').length,
      revenue: counted.reduce((sum, o) => sum + (Number(o.price) || 0), 0),
    };
  }, [items]);

  const visible = useMemo(() => {
    const active = FILTERS.find(f => f.id === filter);
    return active?.match ? items.filter(o => active.match(o.status)) : items;
  }, [items, filter]);

  const closePending = () => { setPending(null); setNote(''); };

  const updateStatus = async (order, status, trackingNote) => {
    setBusyId(order.id);
    setActionError('');
    try {
      const body = { status };
      if (trackingNote !== undefined) body.trackingNote = trackingNote;
      const data = await api.patch(`/orders/${order.id}/status`, body);
      setItems(prev => prev.map(o => (o.id === order.id ? { ...o, ...data.order } : o)));
      closePending();
    } catch (err) {
      setActionError(err.message || 'Unable to update this order.');
    } finally {
      setBusyId('');
    }
  };

  const startAction = (order, status) => {
    setActionError('');
    if (status === 'shipped' || status === 'cancelled') {
      setPending({ id: order.id, status });
      setNote(status === 'shipped' ? order.trackingNote || '' : '');
      return;
    }
    updateStatus(order, status);
  };

  if (loading) {
    return <div className="sales-loading" role="status" aria-live="polite">Loading your orders…</div>;
  }
  if (error) return <LoadError title="Couldn’t load your orders" message={error} onRetry={load} />;

  return (
    <section className="sales-panel" aria-label="Orders received">
      <div className="sales-stats">
        <div className="sales-stat"><Inbox size={18} /><div><strong>{summary.total}</strong><span>Orders</span></div></div>
        <div className="sales-stat"><Package size={18} /><div><strong>{summary.open}</strong><span>Open</span></div></div>
        <div className="sales-stat"><CheckCircle2 size={18} /><div><strong>{summary.delivered}</strong><span>Delivered</span></div></div>
        <div className="sales-stat"><DollarSign size={18} /><div><strong>{formatMoney(summary.revenue)}</strong><span>Your share</span></div></div>
      </div>

      <div className="sales-filters" role="tablist" aria-label="Filter orders">
        {FILTERS.map(f => (
          <button
            key={f.id}
            type="button"
            role="tab"
            aria-selected={filter === f.id}
            className={`sales-filter${filter === f.id ? ' active' : ''}`}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {actionError && <p className="sales-error" role="alert">{actionError}</p>}

      {visible.length === 0 ? (
        <div className="sales-empty card">
          <ShoppingBag size={32} />
          <h4>{items.length === 0 ? 'No orders yet' : 'Nothing in this view'}</h4>
          <p>
            {items.length === 0
              ? 'When someone orders one of your pieces, it will show up here so you can confirm and ship it.'
              : 'Try another filter to see your other orders.'}
          </p>
        </div>
      ) : (
        <ul className="sales-list">
          {visible.map(order => {
            const buyerName = order.buyer ? `${order.buyer.firstName || ''} ${order.buyer.lastName || ''}`.trim() || order.buyer.username : 'Unknown buyer';
            const busy = busyId === order.id;
            const isPending = pending?.id === order.id;
            return (
              <li key={order.id} className="sales-item">
                <div className="sales-item-main">
                  <div
                    className="sales-thumb"
                    style={{ background: order.artwork?.color || 'var(--primary-light)' }}
                  >
                    {order.artwork?.imageUrl && <img src={order.artwork.imageUrl} alt="" loading="lazy" />}
                  </div>

                  <div className="sales-info">
                    <div className="sales-title-row">
                      {order.artwork
                        ? <Link to={`/artwork/${order.artwork.id}`} className="sales-title">{order.artwork.title}</Link>
                        : <span className="sales-title">Removed artwork</span>}
                      <span className={`sales-badge status-${order.status}`}>{STATUS_LABEL[order.status] || order.status}</span>
                      {order.viewerRole === 'collaborator' && <span className="sales-co-badge">Co-creator share</span>}
                    </div>
                    <div className="sales-meta">
                      {order.buyer ? (
                        <Link to={`/profile/${order.buyer.username}`} className="sales-buyer">
                          <Avatar seed={order.buyer.avatarSeed || order.buyer.username} src={order.buyer.avatar} size={22} />
                          {buyerName}
                        </Link>
                      ) : <span>{buyerName}</span>}
                      <span aria-hidden="true">·</span>
                      <span>{formatDate(order.createdAt)}</span>
                    </div>
                    {order.split?.length > 1 && (
                      <p className="sales-split">
                        Split: {order.split.map(entry => `${entry.name || entry.username} ${entry.percent}%`).join(' · ')}
                      </p>
                    )}
                    {order.trackingNote && <p className="sales-note">Note to buyer: {order.trackingNote}</p>}
                  </div>

                  <div className="sales-price">
                    {formatMoney(order.myAmount ?? order.price)}
                    {order.split?.length > 1 && <small>of {formatMoney(order.price)}</small>}
                  </div>
                </div>

                {order.allowedStatuses?.length > 0 && (
                  <div className="sales-actions">
                    {isPending && pending.status === 'shipped' ? (
                      <div className="sales-confirm">
                        <label htmlFor={`note-${order.id}`}>Delivery or tracking note (optional)</label>
                        <input
                          id={`note-${order.id}`}
                          type="text"
                          maxLength={200}
                          value={note}
                          placeholder="e.g. Sent via courier, arrives in 3–5 days"
                          onChange={e => setNote(e.target.value)}
                        />
                        <div className="sales-confirm-buttons">
                          <button type="button" className="btn-ghost" onClick={closePending} disabled={busy}>Back</button>
                          <button type="button" className="btn-primary" onClick={() => updateStatus(order, 'shipped', note)} disabled={busy}>
                            <Truck size={14} /> {busy ? 'Saving…' : 'Mark as shipped'}
                          </button>
                        </div>
                      </div>
                    ) : isPending && pending.status === 'cancelled' ? (
                      <div className="sales-confirm">
                        <p className="sales-confirm-text">Cancel this order? The buyer will be notified.</p>
                        <div className="sales-confirm-buttons">
                          <button type="button" className="btn-ghost" onClick={closePending} disabled={busy}>Keep order</button>
                          <button type="button" className="sales-danger" onClick={() => updateStatus(order, 'cancelled')} disabled={busy}>
                            <XCircle size={14} /> {busy ? 'Cancelling…' : 'Yes, cancel'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      order.allowedStatuses.map(status => (
                        <button
                          key={status}
                          type="button"
                          className={status === 'cancelled' ? 'sales-link-danger' : 'btn-outline sales-action-btn'}
                          onClick={() => startAction(order, status)}
                          disabled={busy}
                        >
                          <ActionIcon status={status} /> {ACTION_LABEL[status]}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
