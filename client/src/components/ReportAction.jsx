import { useEffect, useState } from 'react';
import { Flag, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import './ReportAction.css';

const REASONS = [
  ['copyright', 'Copyright or stolen work'],
  ['harassment', 'Harassment or hateful content'],
  ['inappropriate', 'Inappropriate content'],
  ['spam', 'Spam or misleading content'],
  ['other', 'Something else'],
];

export default function ReportAction({ targetType, targetId }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (!open) return undefined;
    const closeOnEscape = event => {
      if (event.key === 'Escape' && !busy) setOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [busy, open]);

  const submit = async event => {
    event.preventDefault();
    setError('');
    if (!reason) {
      setError('Choose a reason for your report.');
      return;
    }
    setBusy(true);
    try {
      await api.post('/reports', { targetType, targetId, reason, details: details.trim() });
      setSent(true);
    } catch (requestError) {
      setError(requestError.message || 'Unable to submit this report right now.');
    } finally {
      setBusy(false);
    }
  };

  const showReportForm = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setError('');
    setSent(false);
    setOpen(true);
  };

  return (
    <>
      <button type="button" className="report-action" onClick={showReportForm} aria-label={`Report ${targetType}`}>
        <Flag size={15} /> Report
      </button>
      {open && (
        <div className="report-overlay" onMouseDown={event => { if (event.target === event.currentTarget && !busy) setOpen(false); }}>
          <section className="report-dialog" role="dialog" aria-modal="true" aria-labelledby="report-title">
            <button type="button" className="report-close" onClick={() => setOpen(false)} aria-label="Close report" disabled={busy}>
              <X size={18} />
            </button>
            {sent ? (
              <div className="report-confirmation">
                <Flag size={28} />
                <h2 id="report-title">Report received</h2>
                <p>Thanks for helping keep Earts safe. Our team will review it.</p>
                <button type="button" className="btn-primary" onClick={() => setOpen(false)}>Done</button>
              </div>
            ) : (
              <form onSubmit={submit}>
                <h2 id="report-title">Report {targetType === 'artwork' ? 'artwork' : 'profile'}</h2>
                <p className="report-intro">Choose the reason that best describes the issue. Reports are private.</p>
                {error && <p className="report-error" role="alert">{error}</p>}
                <label htmlFor="report-reason">Reason</label>
                <select id="report-reason" value={reason} onChange={event => setReason(event.target.value)} required>
                  <option value="">Select a reason</option>
                  {REASONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
                <label htmlFor="report-details">Additional details <span>(optional)</span></label>
                <textarea
                  id="report-details"
                  value={details}
                  onChange={event => setDetails(event.target.value)}
                  maxLength={1000}
                  rows={4}
                  placeholder="Share context that could help our review."
                />
                <div className="report-actions">
                  <button type="button" className="btn-outline" onClick={() => setOpen(false)} disabled={busy}>Cancel</button>
                  <button type="submit" className="btn-primary" disabled={busy}>{busy ? 'Sending…' : 'Send report'}</button>
                </div>
              </form>
            )}
          </section>
        </div>
      )}
    </>
  );
}
