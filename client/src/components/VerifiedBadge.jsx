import './VerifiedBadge.css';

/** The blue tick shown beside verified artists' names. */
export default function VerifiedBadge({ size = 16, className = '' }) {
  return (
    <span className={`verified-badge ${className}`.trim()} title="Verified artist" role="img" aria-label="Verified artist">
      <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <circle cx="12" cy="12" r="11" fill="currentColor" />
        <path d="m7.5 12.4 3 3 6-6.4" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}
