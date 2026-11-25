import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Heart, UserPlus, DollarSign, TrendingUp, TrendingDown, Minus, BarChart3, Star, Info } from 'lucide-react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import LoadError from '../components/LoadError';
import StarRating from '../components/StarRating';
import TrendChart from '../components/TrendChart';
import './Analytics.css';

const RANGES = [7, 30, 90];

const METRICS = [
  { id: 'views', label: 'Views', icon: Eye, format: n => Number(n).toLocaleString() },
  { id: 'likes', label: 'Likes', icon: Heart, format: n => Number(n).toLocaleString() },
  { id: 'followers', label: 'New followers', icon: UserPlus, format: n => Number(n).toLocaleString() },
  { id: 'revenue', label: 'Sales', icon: DollarSign, format: n => `$${Number(n).toLocaleString(undefined, { maximumFractionDigits: 2 })}` },
];

function Change({ now, before }) {
  if (before === 0 && now === 0) return <span className="an-change flat"><Minus size={13} /> No change</span>;
  if (before === 0) return <span className="an-change up"><TrendingUp size={13} /> New</span>;
  const percent = Math.round(((now - before) / before) * 100);
  if (percent === 0) return <span className="an-change flat"><Minus size={13} /> No change</span>;
  return (
    <span className={`an-change ${percent > 0 ? 'up' : 'down'}`}>
      {percent > 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />} {percent > 0 ? '+' : ''}{percent}%
    </span>
  );
}

export default function Analytics() {
  const { user } = useAuth();
  const [days, setDays] = useState(30);
  const [metric, setMetric] = useState('views');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    api.get(`/analytics?days=${days}`)
      .then(setData)
      .catch(err => setError(err.message || 'Unable to load your insights.'))
      .finally(() => setLoading(false));
  }, [days]);

  useEffect(() => { load(); }, [load]);

  const active = METRICS.find(m => m.id === metric);
  const chartData = useMemo(
    () => (data ? data.series.map(point => ({ date: point.date, value: point[metric] })) : []),
    [data, metric]
  );

  if (user && user.accountType !== 'artist') {
    return (
      <div className="analytics-page page-wrapper">
        <div className="container analytics-container">
          <div className="an-empty card"><BarChart3 size={32} /><h4>Insights are for artist accounts</h4><p>Artists see how their work performs here.</p></div>
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-page page-wrapper">
      <div className="container analytics-container">
        <div className="analytics-header">
          <div>
            <h1><BarChart3 size={26} /> Insights</h1>
            <p>How your work is doing, compared with the {days} days before.</p>
          </div>
          <div className="an-ranges" role="tablist" aria-label="Time range">
            {RANGES.map(range => (
              <button key={range} type="button" role="tab" aria-selected={days === range} className={`an-range${days === range ? ' active' : ''}`} onClick={() => setDays(range)}>
                {range} days
              </button>
            ))}
          </div>
        </div>

        {error ? (
          <LoadError title="Couldn’t load your insights" message={error} onRetry={load} />
        ) : !data ? (
          <div className="an-loading" role="status">Loading your insights…</div>
        ) : (
          <div className={loading ? 'an-body refreshing' : 'an-body'}>
            <div className="an-kpis">
              {METRICS.map(({ id, label, icon: Icon, format }) => (
                <button
                  key={id}
                  type="button"
                  className={`an-kpi${metric === id ? ' active' : ''}`}
                  onClick={() => setMetric(id)}
                  aria-pressed={metric === id}
                >
                  <span className="an-kpi-label"><Icon size={15} /> {label}</span>
                  <strong>{format(data.current[id])}</strong>
                  <Change now={data.current[id]} before={data.previous[id]} />
                </button>
              ))}
            </div>

            <section className="an-chart card" aria-label={`${active.label} over time`}>
              <div className="an-chart-head">
                <h3>{active.label} per day</h3>
                <span>{active.format(data.current[metric])} in the last {days} days</span>
              </div>
              <TrendChart data={chartData} format={active.format} label={active.label} />
            </section>

            <div className="an-grid">
              <section className="an-top card" aria-label="Top artworks">
                <h3>Top artworks</h3>
                {data.topArtworks.length === 0 ? (
                  <p className="an-muted">Once people view, like or buy your work it will be ranked here.</p>
                ) : (
                  <ul>
                    {data.topArtworks.map((item, index) => (
                      <li key={item.id}>
                        <span className="an-rank">{index + 1}</span>
                        <div className="an-thumb" style={{ background: item.color || 'var(--primary-light)' }}>
                          {item.imageUrl && <img src={item.imageUrl} alt="" loading="lazy" />}
                        </div>
                        <div className="an-top-main">
                          <Link to={`/artwork/${item.id}`}>{item.title}</Link>
                          <span><Eye size={12} /> {item.views} · <Heart size={12} /> {item.likes} · {item.orders} {item.orders === 1 ? 'order' : 'orders'}</span>
                        </div>
                        {item.revenue > 0 && <strong className="an-top-revenue">${item.revenue.toLocaleString()}</strong>}
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="an-side">
                <div className="an-stat card">
                  <h3>Reputation</h3>
                  {data.rating.count > 0 ? (
                    <Link to={`/profile/${user.username}?tab=Reviews`} className="an-rating">
                      <strong>{data.rating.average}</strong>
                      <StarRating value={data.rating.average} size={16} />
                      <span>{data.rating.count} {data.rating.count === 1 ? 'review' : 'reviews'}</span>
                    </Link>
                  ) : (
                    <p className="an-muted"><Star size={14} /> No reviews yet.</p>
                  )}
                </div>
                <div className="an-stat card">
                  <h3>All time</h3>
                  <dl>
                    <div><dt>Artworks</dt><dd>{data.totals.artworks}</dd></div>
                    <div><dt>Followers</dt><dd>{Number(data.totals.followers).toLocaleString()}</dd></div>
                    <div><dt>Sold</dt><dd>{data.totals.sold}</dd></div>
                  </dl>
                </div>
              </section>
            </div>

            <p className="an-note"><Info size={14} /> Views count visitors to an artwork’s page, not including your own visits, and are tracked from the day this feature launched. Sales show your share after any co-creator split.</p>
          </div>
        )}
      </div>
    </div>
  );
}
