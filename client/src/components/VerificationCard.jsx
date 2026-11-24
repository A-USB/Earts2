import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, Circle, Clock, XCircle, Plus, X } from 'lucide-react';
import { api } from '../utils/api';
import LoadError from './LoadError';
import VerifiedBadge from './VerifiedBadge';
import './VerificationCard.css';

const formatDate = (value) => new Date(value).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

/** Settings → Verification: status, requirements and the application form (artists only). */
export default function VerificationCard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [statement, setStatement] = useState('');
  const [links, setLinks] = useState(['']);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState('');

  const load = useCallback(() => {
    setError('');
    api.get('/verification/me').then(setData).catch(err => setError(err.message || 'Unable to load verification.'));
  }, []);

  useEffect(() => { load(); }, [load]);

  const updateLink = (index, value) => setLinks(prev => prev.map((link, i) => (i === index ? value : link)));

  const submit = async (event) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setFormError('');
    try {
      await api.post('/verification', { statement, links: links.map(link => link.trim()).filter(Boolean) });
      setStatement('');
      setLinks(['']);
      load();
    } catch (err) {
      setFormError(err.message || 'Unable to send your request.');
    } finally {
      setBusy(false);
    }
  };

  if (error) return <LoadError title="Couldn’t load verification" message={error} onRetry={load} />;
  if (!data) return <p className="vf-loading" role="status">Loading…</p>;

  const request = data.request;

  return (
    <div className="vf-card">
      {data.verified ? (
        <div className="vf-status ok">
          <VerifiedBadge size={28} />
          <div>
            <h4>You’re verified</h4>
            <p>The blue tick now shows beside your name{data.verifiedAt ? ` (since ${formatDate(data.verifiedAt)})` : ''}, on your profile, artworks and search results.</p>
          </div>
        </div>
      ) : request?.status === 'pending' ? (
        <div className="vf-status pending">
          <Clock size={26} />
          <div>
            <h4>Request sent</h4>
            <p>Submitted {formatDate(request.createdAt)}. A moderator will review it and you’ll get a notification with the decision.</p>
          </div>
        </div>
      ) : (
        <>
          {request?.status === 'rejected' && (
            <div className="vf-status rejected">
              <XCircle size={26} />
              <div>
                <h4>Your last request wasn’t approved</h4>
                <p>{request.reviewerNote || 'No reason was given.'}</p>
                {data.retryAfter && <p className="vf-retry">You can apply again from {formatDate(data.retryAfter)}.</p>}
              </div>
            </div>
          )}
          {request?.status === 'revoked' && (
            <div className="vf-status rejected">
              <XCircle size={26} />
              <div>
                <h4>Your verified badge was removed</h4>
                <p>{request.reviewerNote || 'No reason was given.'}</p>
              </div>
            </div>
          )}

          <p className="vf-intro">Verified artists get a blue tick so buyers and collaborators know the profile is genuine. A moderator reviews each request.</p>

          <ul className="vf-checks" aria-label="Requirements">
            {data.checks.map(check => (
              <li key={check.id} className={check.met ? 'met' : ''}>
                {check.met ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                <span>{check.label}</span>
              </li>
            ))}
          </ul>

          {data.canApply ? (
            <form className="vf-form" onSubmit={submit} noValidate>
              <label htmlFor="vf-statement">Tell us about your work</label>
              <textarea id="vf-statement" rows={4} maxLength={600} value={statement} onChange={e => setStatement(e.target.value)} placeholder="Who you are, what you make, where your work has been shown or published…" />
              <span className="vf-count">{statement.length}/600</span>

              <label>Links that show it’s really you <span>(optional, up to 3)</span></label>
              {links.map((link, index) => (
                <div className="vf-link-row" key={index}>
                  <input type="url" value={link} onChange={e => updateLink(index, e.target.value)} placeholder="https://your-portfolio.com" aria-label={`Link ${index + 1}`} />
                  {links.length > 1 && (
                    <button type="button" className="vf-icon-btn" onClick={() => setLinks(prev => prev.filter((_, i) => i !== index))} aria-label="Remove link"><X size={15} /></button>
                  )}
                </div>
              ))}
              {links.length < 3 && (
                <button type="button" className="vf-add-link" onClick={() => setLinks(prev => [...prev, ''])}><Plus size={14} /> Add another link</button>
              )}

              {formError && <p className="vf-error" role="alert">{formError}</p>}
              <button type="submit" className="btn-primary" disabled={busy}>{busy ? 'Sending…' : 'Request verification'}</button>
            </form>
          ) : (
            !data.retryAfter && <p className="vf-hint">Complete every requirement above to unlock the request form.</p>
          )}
        </>
      )}
    </div>
  );
}
