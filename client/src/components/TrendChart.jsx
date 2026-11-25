import { useId, useMemo, useRef, useState } from 'react';
import './TrendChart.css';

const W = 720;
const H = 260;
const PAD = { top: 16, right: 16, bottom: 30, left: 46 };

// Rounds the top of the scale up to a tidy number so gridlines read well
function niceMax(value) {
  if (value <= 0) return 4;
  const exp = 10 ** Math.floor(Math.log10(value));
  for (const step of [1, 2, 2.5, 5, 10]) {
    if (value <= step * exp) return step * exp;
  }
  return 10 * exp;
}

const parseDay = (key) => new Date(`${key}T12:00:00Z`);
const shortDate = (key) => parseDay(key).toLocaleDateString(undefined, { day: 'numeric', month: 'short', timeZone: 'UTC' });
const longDate = (key) => parseDay(key).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

/**
 * Responsive area/line chart drawn with SVG.
 * data: [{ date: 'YYYY-MM-DD', value: number }]   format: (n) => string
 */
export default function TrendChart({ data, format = (n) => String(n), label = 'Trend' }) {
  const gradientId = useId().replace(/:/g, '');
  const [active, setActive] = useState(null);
  const svgRef = useRef(null);

  const geometry = useMemo(() => {
    const max = niceMax(Math.max(0, ...data.map(d => d.value)));
    const innerW = W - PAD.left - PAD.right;
    const innerH = H - PAD.top - PAD.bottom;
    const x = (i) => PAD.left + (data.length <= 1 ? innerW / 2 : (i / (data.length - 1)) * innerW);
    const y = (v) => PAD.top + innerH - (v / max) * innerH;
    const points = data.map((d, i) => [x(i), y(d.value)]);
    const line = points.map(([px, py], i) => `${i === 0 ? 'M' : 'L'}${px.toFixed(1)},${py.toFixed(1)}`).join(' ');
    const area = points.length ? `${line} L${points[points.length - 1][0].toFixed(1)},${PAD.top + innerH} L${points[0][0].toFixed(1)},${PAD.top + innerH} Z` : '';
    const ticks = [0, 0.25, 0.5, 0.75, 1].map(t => ({ value: max * t, y: y(max * t) }));
    return { max, points, line, area, ticks, innerW, innerH };
  }, [data]);

  const total = data.reduce((sum, d) => sum + d.value, 0);

  const indexFromPointer = (event) => {
    const rect = svgRef.current.getBoundingClientRect();
    const px = ((event.clientX - rect.left) / rect.width) * W;
    const ratio = (px - PAD.left) / geometry.innerW;
    return Math.max(0, Math.min(data.length - 1, Math.round(ratio * (data.length - 1))));
  };

  const onKeyDown = (event) => {
    if (event.key === 'ArrowRight') { event.preventDefault(); setActive(i => Math.min(data.length - 1, (i ?? -1) + 1)); }
    if (event.key === 'ArrowLeft') { event.preventDefault(); setActive(i => Math.max(0, (i ?? data.length) - 1)); }
    if (event.key === 'Escape') setActive(null);
  };

  const labelIdx = data.length > 1 ? [0, Math.floor((data.length - 1) / 2), data.length - 1] : [0];
  const hovered = active !== null ? data[active] : null;

  return (
    <div className="trend-chart">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`${label}: ${format(total)} in total over ${data.length} days. Use the left and right arrow keys to read each day.`}
        tabIndex={0}
        onPointerMove={(e) => setActive(indexFromPointer(e))}
        onPointerLeave={() => setActive(null)}
        onBlur={() => setActive(null)}
        onKeyDown={onKeyDown}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {geometry.ticks.map(tick => (
          <g key={tick.value}>
            <line x1={PAD.left} x2={W - PAD.right} y1={tick.y} y2={tick.y} className="tc-grid" />
            <text x={PAD.left - 8} y={tick.y + 4} textAnchor="end" className="tc-axis">{format(Math.round(tick.value * 100) / 100)}</text>
          </g>
        ))}

        {labelIdx.map(i => (
          <text key={i} x={geometry.points[i]?.[0]} y={H - 8} textAnchor={i === 0 ? 'start' : i === data.length - 1 ? 'end' : 'middle'} className="tc-axis">
            {shortDate(data[i].date)}
          </text>
        ))}

        <path d={geometry.area} fill={`url(#${gradientId})`} />
        <path d={geometry.line} className="tc-line" />

        {hovered && (
          <g>
            <line x1={geometry.points[active][0]} x2={geometry.points[active][0]} y1={PAD.top} y2={H - PAD.bottom} className="tc-cursor" />
            <circle cx={geometry.points[active][0]} cy={geometry.points[active][1]} r="5" className="tc-dot" />
          </g>
        )}
      </svg>

      {hovered && (
        <div
          className="tc-tooltip"
          style={{ left: `${(geometry.points[active][0] / W) * 100}%`, top: `${(geometry.points[active][1] / H) * 100}%` }}
          role="status"
        >
          <strong>{format(hovered.value)}</strong>
          <span>{longDate(hovered.date)}</span>
        </div>
      )}
    </div>
  );
}
