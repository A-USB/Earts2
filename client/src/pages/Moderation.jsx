import { useCallback, useEffect, useState } from 'react';
import { ExternalLink, ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';
import './Moderation.css';

const STATUS_OPTIONS = [
  ['open', 'Open'],
  ['reviewed', 'Reviewed'],
  ['actioned', 'Action taken'],
  ['dismissed', 'Dismissed'],
];

const REASON_LABELS = {
  copyright: 'Copyright or stolen work',
  harassment: 'Harassment or hateful content',
  inappropriate: 'Inappropriate content',
  spam: 'Spam or misleading content',
  other: 'Something else',
};

export default function Moderation() {
  const [status, setStatus] = useState('open');
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState('');

  const loadReports = useCallback(() => {
    setLoading(true);
    setError('');
    api.get(`/moderation/reports?status=${status}`)
      .then(setReports)
      .catch(requestError => setError(requestError.message || 'Unable to load reports.'))
      .finally(() => setLoading(false));
  }, [status]);

  useEffect(() => { loadReports(); }, [loadReports]);

  const updateStatus = async (reportId, nextStatus) => {
    setUpdatingId(reportId);
    setError('');
    try {
      await api.patch(`/moderation/reports/${reportId}`, { status: nextStatus });
      if (nextStatus !== status) setReports(current => current.filter(report => report.id !== reportId));
      else loadReports();
    } catch (requestError) {
      setError(requestError.message || 'Unable to update the report.');
    } finally {
      setUpdatingId('');
    }
  };

  return (
    <div className="moderation-page page-wrapper">
      <div className="container moderation-container">
        <header className="moderation-header">
          <div>
            <span className="moderation-eyebrow"><ShieldAlert size={15} /> Trust &amp; Safety</span>
            <h1>Report review</h1>
            <p>Review user-submitted reports and record the outcome.</p>
          </div>
          <label className="moderation-filter">
            <span>Show</span>
            <select value={status} onChange={event => setStatus(event.target.value)}>
              {STATUS_OPTIONS.map(([value, label]) => <option value={value} key={value}>{label}</option>)}
            </select>
          </label>
        </header>

        {error && <div className="moderation-error" role="alert">{error}</div>}
        {loading ? (
          <div className="moderation-list" aria-label="Loading reports">
            {[1, 2, 3].map(item => <div className="moderation-skeleton" key={item} />)}
          </div>
        ) : reports.length ? (
          <div className="moderation-list">
            {reports.map(report => {
              const targetUrl = report.targetType === 'artwork'
                ? `/artwork/${report.target?.id || report.targetId}`
                : report.target?.username ? `/profile/${report.target.username}` : null;
              return (
                <article className="moderation-report card" key={report.id}>
                  <div className="moderation-report-heading">
                    <div>
                      <span className="moderation-reason">{REASON_LABELS[report.reason] || report.reason}</span>
                      <p className="moderation-target">
                        Reported {report.targetType}: <strong>{report.target?.label || 'Content unavailable'}</strong>
                        {targetUrl && <Link to={targetUrl} aria-label="Open reported content"><ExternalLink size={14} /></Link>}
                      </p>
                    </div>
                    <span className={`moderation-status status-${report.status}`}>{report.status}</span>
                  </div>
                  <div className="moderation-report-meta">
                    <span>By {report.reporter?.name || 'Former user'} {report.reporter?.username ? `(@${report.reporter.username})` : ''}</span>
                    <time dateTime={new Date(report.createdAt).toISOString()}>{new Date(report.createdAt).toLocaleString()}</time>
                  </div>
                  {report.details && <p className="moderation-details">{report.details}</p>}
                  <label className="moderation-action-label" htmlFor={`report-status-${report.id}`}>Review outcome</label>
                  <select
                    id={`report-status-${report.id}`}
                    value={report.status}
                    disabled={updatingId === report.id}
                    onChange={event => updateStatus(report.id, event.target.value)}
                  >
                    {STATUS_OPTIONS.map(([value, label]) => <option value={value} key={value}>{label}</option>)}
                  </select>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="moderation-empty card">
            <ShieldAlert size={28} />
            <h2>No {status} reports</h2>
            <p>Reports matching this filter will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
