import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, ImageIcon, Plus, Trash2, ThumbsUp, Medal, Info } from 'lucide-react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/Avatar';
import LoadError from '../components/LoadError';
import VerifiedBadge from '../components/VerifiedBadge';
import ChallengeEntryPicker from '../components/ChallengeEntryPicker';
import { STATUS_LABEL, formatDate, timeLabel } from '../utils/challenges';
import './ChallengeDetail.css';

const MEDALS = ['#F5B544', '#B8C0CC', '#C98A5A'];

function EntryCard({ entry, status, voted, canVote, busy, onVote, onWithdraw, confirming, setConfirming, rank }) {
  return (
    <li className="cd-entry">
      <Link to={`/artwork/${entry.artwork.id}`} className="cd-entry-image" style={{ background: entry.artwork.color || 'var(--primary-light)' }}>
        {entry.artwork.imageUrl && <img src={entry.artwork.imageUrl} alt={entry.artwork.title} loading="lazy" />}
        {rank && <span className="cd-rank" style={{ '--medal': MEDALS[rank - 1] }}><Medal size={14} /> {rank === 1 ? '1st' : rank === 2 ? '2nd' : '3rd'}</span>}
      </Link>
      <div className="cd-entry-body">
        <Link to={`/artwork/${entry.artwork.id}`} className="cd-entry-title">{entry.artwork.title}</Link>
        {entry.artist && (
          <Link to={`/profile/${entry.artist.username}`} className="cd-entry-artist">
            <Avatar seed={entry.artist.avatarSeed || entry.artist.username} src={entry.artist.avatar} size={20} />
            <span>{entry.artist.name}{entry.artist.verified && <VerifiedBadge size={12} />}</span>
          </Link>
        )}
        <div className="cd-entry-foot">
          <span className="cd-votes"><ThumbsUp size={13} /> {entry.votes} {entry.votes === 1 ? 'vote' : 'votes'}</span>
          {status === 'open' && !entry.mine && (
            <button type="button" className={`cd-vote${voted ? ' voted' : ''}`} onClick={() => onVote(entry)} disabled={busy} aria-pressed={voted}>
              {voted ? 'Voted' : canVote ? 'Vote' : 'Sign in to vote'}
            </button>
          )}
          {entry.mine && <span className="cd-mine">Your entry</span>}
        </div>
        {entry.mine && status === 'open' && (
          confirming === entry.id ? (
            <div className="cd-confirm">
              <span>Withdraw this entry?</span>
              <button type="button" onClick={() => setConfirming('')} disabled={busy}>Keep</button>
              <button type="button" className="danger" onClick={() => onWithdraw(entry)} disabled={busy}>{busy ? 'Removing…' : 'Withdraw'}</button>
            </div>
          ) : (
            <button type="button" className="cd-withdraw" onClick={() => setConfirming(entry.id)}><Trash2 size={13} /> Withdraw</button>
          )
        )}
      </div>
    </li>
  );
}

export default function ChallengeDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [picking, setPicking] = useState(false);
  const [busyId, setBusyId] = useState('');
  const [confirming, setConfirming] = useState('');
  const [actionError, setActionError] = useState('');

  const load = useCallback(() => {
    setError('');
    api.get(`/challenges/${id}`).then(setData).catch(err => setError(err.status === 404 ? 'This challenge could not be found.' : (err.message || 'Unable to load this challenge.')));
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const enteredArtworkIds = useMemo(() => (data ? data.entries.map(entry => entry.artwork.id) : []), [data]);

  const vote = async (entry) => {
    if (!user) { navigate('/login'); return; }
    setBusyId(entry.id);
    setActionError('');
    try {
      const result = await api.post(`/challenges/${id}/vote`, { entryId: entry.id });
      setData(prev => {
        const previous = prev.myVoteEntryId;
        const next = result.votedEntryId;
        return {
          ...prev,
          myVoteEntryId: next,
          entries: prev.entries.map(item => ({
            ...item,
            votes: item.votes + (item.id === next ? 1 : 0) - (item.id === previous ? 1 : 0),
          })),
        };
      });
    } catch (err) {
      setActionError(err.message || 'Unable to record your vote.');
    } finally {
      setBusyId('');
    }
  };

  const withdraw = async (entry) => {
    setBusyId(entry.id);
    setActionError('');
    try {
      await api.delete(`/challenges/${id}/entries/${entry.id}`);
      setConfirming('');
      load();
    } catch (err) {
      setActionError(err.message || 'Unable to withdraw this entry.');
    } finally {
      setBusyId('');
    }
  };

  const removeChallenge = async () => {
    if (!window.confirm('Delete this challenge? This cannot be undone.')) return;
    try {
      await api.delete(`/challenges/${id}`);
      navigate('/challenges');
    } catch (err) {
      setActionError(err.message || 'Unable to delete this challenge.');
    }
  };

  if (error) return <div className="challenge-detail page-wrapper"><div className="container cd-container"><LoadError title="Couldn’t load this challenge" message={error} onRetry={load} /><Link to="/challenges" className="cd-back"><ArrowLeft size={15} /> All challenges</Link></div></div>;
  if (!data) return <div className="challenge-detail page-wrapper"><div className="container cd-container"><p className="cd-loading" role="status">Loading challenge…</p></div></div>;

  const { challenge, entries, winners } = data;
  const status = challenge.status;
  const isArtist = user?.accountType === 'artist';
  const canEnter = status === 'open' && isArtist && data.myEntryCount < data.maxEntries;
  const winnerEntryIds = new Set(winners.map(winner => String(winner.entryId)));

  return (
    <div className="challenge-detail page-wrapper">
      <div className="container cd-container">
        <Link to="/challenges" className="cd-back"><ArrowLeft size={15} /> All challenges</Link>

        <header className="cd-header card">
          <div className="cd-header-top">
            <span className={`cd-badge status-${status}`}>{STATUS_LABEL[status]}</span>
            <span className="cd-time">{timeLabel(challenge)}</span>
          </div>
          <h1>{challenge.title}</h1>
          <p className="cd-description">{challenge.description}</p>
          <div className="cd-meta">
            <span><Calendar size={14} /> {formatDate(challenge.startsAt)} – {formatDate(challenge.endsAt)}</span>
            <span><ImageIcon size={14} /> {entries.length} {entries.length === 1 ? 'entry' : 'entries'}</span>
            <Link to={`/marketplace?mode=all&tag=${encodeURIComponent(challenge.tag)}`} className="cd-tag">#{challenge.tag}</Link>
          </div>

          <div className="cd-actions">
            {status === 'open' && (
              user ? (
                isArtist ? (
                  <button type="button" className="btn-primary" onClick={() => setPicking(true)} disabled={!canEnter}>
                    <Plus size={16} /> {canEnter ? 'Enter this challenge' : `You’ve used all ${data.maxEntries} entries`}
                  </button>
                ) : <span className="cd-hint">Artists can enter. Everyone can vote.</span>
              ) : (
                <Link to="/login" className="btn-primary">Sign in to enter or vote</Link>
              )
            )}
            {data.canManage && entries.length === 0 && (
              <button type="button" className="cd-delete" onClick={removeChallenge}><Trash2 size={14} /> Delete challenge</button>
            )}
          </div>
        </header>

        {actionError && <p className="cd-error" role="alert">{actionError}</p>}

        {status === 'closed' && (
          <section className="cd-winners" aria-label="Winners">
            <h2>Winners</h2>
            {winners.length === 0 ? (
              <p className="cd-muted">No votes were cast, so there are no winners this time.</p>
            ) : (
              <ul className="cd-grid">
                {winners.filter(winner => winner.entry).map(winner => (
                  <EntryCard key={winner.entryId} entry={winner.entry} status="closed" rank={winner.rank} />
                ))}
              </ul>
            )}
          </section>
        )}

        <section aria-label="Entries">
          <h2>{status === 'closed' ? 'All entries' : 'Entries'}</h2>
          {entries.length === 0 ? (
            <div className="cd-empty card">
              <ImageIcon size={30} />
              <h4>No entries yet</h4>
              <p>{status === 'upcoming' ? 'Entries open when the challenge starts.' : 'Be the first to enter.'}</p>
            </div>
          ) : (
            <ul className="cd-grid">
              {entries.filter(entry => status !== 'closed' || !winnerEntryIds.has(String(entry.id))).map(entry => (
                <EntryCard
                  key={entry.id}
                  entry={entry}
                  status={status}
                  voted={data.myVoteEntryId === entry.id}
                  canVote={Boolean(user)}
                  busy={busyId === entry.id}
                  onVote={vote}
                  onWithdraw={withdraw}
                  confirming={confirming}
                  setConfirming={setConfirming}
                />
              ))}
            </ul>
          )}
        </section>

        <p className="cd-note"><Info size={14} /> Entries must be new work uploaded after the challenge starts, up to {data.maxEntries} per artist. Everyone gets one vote, which can be moved until the challenge ends, and you can’t vote for your own work. The three most-voted entries win.</p>
      </div>

      {picking && (
        <ChallengeEntryPicker
          challenge={challenge}
          enteredArtworkIds={enteredArtworkIds}
          onClose={() => setPicking(false)}
          onEntered={load}
        />
      )}
    </div>
  );
}
