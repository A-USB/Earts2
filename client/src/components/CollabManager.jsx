import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, X } from 'lucide-react';
import { api } from '../utils/api';
import Avatar from './Avatar';
import './CollabManager.css';

const STATUS_LABEL = { pending: 'Waiting for reply', accepted: 'Accepted', declined: 'Declined' };

/** Owner-only panel on the artwork page: who was invited, who accepted, and how sales are split. */
export default function CollabManager({ artworkId, isOwner, onChange }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [confirmId, setConfirmId] = useState('');
  const [busyId, setBusyId] = useState('');

  const load = useCallback(() => {
    api.get(`/artworks/${artworkId}/collab`)
      .then(setData)
      .catch(() => setData({ invites: [] }));
  }, [artworkId]);

  useEffect(() => {
    if (isOwner) load();
  }, [isOwner, load]);

  const remove = async (invite) => {
    setBusyId(invite.userId);
    setError('');
    try {
      await api.delete(`/artworks/${artworkId}/collab/${invite.userId}`);
      setConfirmId('');
      load();
      onChange?.();
    } catch (err) {
      setError(err.message || 'Unable to remove this co-creator.');
    } finally {
      setBusyId('');
    }
  };

  if (!isOwner || !data || !data.invites || data.invites.length === 0) return null;

  return (
    <section className="collab-manager card" aria-label="Collaboration and revenue split">
      <div className="collab-manager-head">
        <Users size={18} />
        <div>
          <h4>Collaboration &amp; revenue split</h4>
          <p>Co-creators only appear on this artwork, and earn their share of a sale, once they accept.</p>
        </div>
      </div>

      <ul className="collab-manager-list">
        <li className="collab-manager-row owner">
          <div className="collab-manager-person"><strong>You</strong><span>Owner · keeps the rest</span></div>
          <div className="collab-manager-share">
            <strong>{data.ownerPercent}%</strong>
            {data.plannedOwnerPercent !== data.ownerPercent && <small>{data.plannedOwnerPercent}% once all accept</small>}
          </div>
        </li>

        {data.invites.map(invite => (
          <li key={invite.id} className="collab-manager-row">
            <Link to={`/profile/${invite.username}`} className="collab-manager-person">
              <Avatar name={invite.name} size={30} />
              <span className="collab-manager-name">
                <strong>{invite.name}</strong>
                <span>{invite.role}</span>
              </span>
            </Link>
            <span className={`collab-manager-status status-${invite.status}`}>{STATUS_LABEL[invite.status] || invite.status}</span>
            <div className="collab-manager-share"><strong>{invite.sharePercent}%</strong></div>
            {confirmId === invite.userId ? (
              <span className="collab-manager-confirm">
                <button type="button" className="btn-ghost" onClick={() => setConfirmId('')} disabled={busyId === invite.userId}>Keep</button>
                <button type="button" className="collab-manager-remove-yes" onClick={() => remove(invite)} disabled={busyId === invite.userId}>
                  {busyId === invite.userId ? 'Removing…' : 'Remove'}
                </button>
              </span>
            ) : (
              <button type="button" className="collab-manager-remove" onClick={() => setConfirmId(invite.userId)} aria-label={`Remove ${invite.name}`}>
                <X size={15} />
              </button>
            )}
          </li>
        ))}
      </ul>

      {error && <p className="collab-manager-error" role="alert">{error}</p>}
    </section>
  );
}
