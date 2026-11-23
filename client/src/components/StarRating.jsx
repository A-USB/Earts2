import { Star } from 'lucide-react';
import './StarRating.css';

/** Read-only stars. value can be fractional (4.3 fills 86% of the row). */
export default function StarRating({ value = 0, size = 16, label }) {
  const safe = Math.max(0, Math.min(5, Number(value) || 0));
  const stars = [0, 1, 2, 3, 4];
  return (
    <span className="star-rating" role="img" aria-label={label || `Rated ${safe} out of 5`}>
      <span className="star-rating-base" aria-hidden="true">
        {stars.map(i => <Star key={i} size={size} />)}
      </span>
      <span className="star-rating-fill" aria-hidden="true" style={{ width: `${(safe / 5) * 100}%` }}>
        {stars.map(i => <Star key={i} size={size} fill="currentColor" />)}
      </span>
    </span>
  );
}
