import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Plus, Calendar, ImageIcon } from 'lucide-react';
import { api } from '../utils/api';
import LoadError from '../components/LoadError';
import ChallengeFormModal from '../components/ChallengeFormModal';
import { STATUS_LABEL, formatDate, timeLabel } from '../utils/challenges';
import './Challenges.css';

const SECTIONS = [
  { status: 'open', title: 'Open now' },
  { status: 'upcoming', title: 'Coming up' },
  { status: 'closed', title: 'Past challenges' },
];

export default function Challenges() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);

  const load = useCallback(() => {
    setError('');
    api.get('/challenges').then(setData).catch(err => setError(err.message || 'Unable to load challenges.'));
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="challenges-page page-wrapper">
      <div className="container challenges-container">
        <div className="challenges-header">
          <div>
            <h1><Trophy size={26} /> Challenges</h1>
            <p>Make new work around a theme, vote for your favourites, and see who wins.</p>
          </div>
          {data?.canManage && (
            <button type="button" className="btn-primary" onClick={() => setCreating(true)}><Plus size={16} /> New challenge</button>
          )}
        </div>

        {error ? (
          <LoadError title="Couldn’t load challenges" message={error} onRetry={load} />
        ) : !data ? (
          <p className="ch-loading" role="status">Loading challenges…</p>
        ) : data.items.length === 0 ? (
          <div className="ch-empty card">
            <Trophy size={32} />
            <h4>No challenges yet</h4>
            <p>When a challenge opens, you’ll find the theme, the dates and the entries here.</p>
          </div>
        ) : (
          SECTIONS.map(({ status, title }) => {
            const items = data.items.filter(item => item.status === status);
            if (items.length === 0) return null;
            return (
              <section key={status} className="ch-section" aria-label={title}>
                <h2>{title}</h2>
                <ul className="ch-grid">
                  {items.map(item => (
                    <li key={item.id}>
                      <Link to={`/challenges/${item.id}`} className={`ch-card status-${item.status}`}>
                        <div className="ch-card-top">
                          <span className={`ch-badge status-${item.status}`}>{STATUS_LABEL[item.status]}</span>
                          <span className="ch-time">{timeLabel(item)}</span>
                        </div>
                        <h3>{item.title}</h3>
                        <p>{item.description}</p>
                        <div className="ch-meta">
                          <span><Calendar size={13} /> {formatDate(item.startsAt)} – {formatDate(item.endsAt)}</span>
                          <span><ImageIcon size={13} /> {item.entryCount} {item.entryCount === 1 ? 'entry' : 'entries'}</span>
                          <span className="ch-tag">#{item.tag}</span>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })
        )}
      </div>

      {creating && <ChallengeFormModal onClose={() => setCreating(false)} onCreated={() => load()} />}
    </div>
  );
}
