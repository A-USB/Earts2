import { useId } from 'react';
import { EartsLogo } from './EartsLogo';
import './FeedTransition.css';

export default function FeedTransition() {
  const reactId = useId().replace(/:/g, '');
  const gradientId = `feed-transition-gradient-${reactId}`;
  const handleGradientId = `feed-transition-handle-${reactId}`;
  const bristleGradientId = `feed-transition-bristles-${reactId}`;
  const clipId = `feed-transition-clip-${reactId}`;

  return (
    <div className="feed-transition" role="status" aria-label="Opening your Earts feed">
      <div className="feed-transition-content">
        <EartsLogo size={72} className="feed-transition-logo" />
        <div className="feed-transition-stage" aria-hidden="true">
          <svg className="feed-transition-art" viewBox="0 0 520 170" preserveAspectRatio="xMidYMid meet">
            <defs>
              <linearGradient id={gradientId} gradientUnits="userSpaceOnUse" x1="30" y1="0" x2="505" y2="0">
                <stop offset="0" stopColor="#6D4AE8" />
                <stop offset="0.6" stopColor="#9A55DC" />
                <stop offset="1" stopColor="#E85FA8" />
              </linearGradient>
              <linearGradient id={handleGradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#D9977A" />
                <stop offset="0.5" stopColor="#B87555" />
                <stop offset="1" stopColor="#8F5640" />
              </linearGradient>
              <linearGradient id={bristleGradientId} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="#6D4AE8" />
                <stop offset="1" stopColor="#E85FA8" />
              </linearGradient>
              <clipPath id={clipId}>
                <path d="M150 24 L196 18 Q216 20 218 30 L218 60 Q216 70 196 72 L150 66 Z" />
              </clipPath>
            </defs>
            <path className="feed-transition-stroke" pathLength="1" d="M30 135 C130 62 300 22 505 54" stroke={`url(#${gradientId})`} />
            <g className="feed-transition-brush">
              <animateMotion dur="760ms" begin="80ms" fill="freeze" rotate="auto" path="M30 135 C130 62 300 22 505 54" />
              <g transform="translate(-218 -45)">
              <path d="M10 34 C4 34 2 40 2 45 C2 50 4 56 10 56 C40 56 60 52 80 54 L114 58 L114 32 L80 36 C60 38 40 34 10 34 Z" fill="#286B4B" />
              <path d="M14 37 C40 38 60 41 112 36" stroke="#4FA77C" strokeOpacity=".5" strokeWidth="2.5" fill="none" strokeLinecap="round" />
              <circle cx="15" cy="45" r="3.4" fill="var(--bg-card, #fff)" />
              <rect x="112" y="22" width="40" height="46" rx="3" fill={`url(#${handleGradientId})`} />
              <path d="M118 22 V68 M146 22 V68" stroke="#7A4633" strokeOpacity=".45" strokeWidth="1.5" />
              <circle cx="125" cy="62" r="1.8" fill="#6B3D2C" />
              <circle cx="140" cy="62" r="1.8" fill="#6B3D2C" />
              <g clipPath={`url(#${clipId})`}>
                <rect x="150" y="14" width="70" height="62" fill="#252334" />
                <path d="M152 30 H218 M152 38 H218 M152 46 H218 M152 54 H218 M152 62 H218" stroke="#565268" strokeWidth="1.4" />
                <rect x="188" y="14" width="32" height="62" fill={`url(#${bristleGradientId})`} opacity=".95" />
              </g>
              </g>
            </g>
          </svg>
        </div>
        <span className="feed-transition-caption">Your creative space is ready</span>
      </div>
    </div>
  );
}
