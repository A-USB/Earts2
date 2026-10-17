import { useId } from 'react';
import { EartsLogo } from './EartsLogo';
import { STROKE_BODY, STROKE_FLYAWAYS, STROKE_GAPS } from './welcomeStroke';
import './FeedTransition.css';

// One pass of the welcome animation (seconds). App.jsx waits a little longer than this before opening the feed.
const DUR = '2.2s';
// Timeline as fractions of DUR: brush appears, swings along the arc, lifts off.
const MOTION_PATH = 'M40 336C170 210 330 135 500 123S680 120 745 131L800 138';
const SPLINES = '0 0 1 1;.35 .1 .25 1;0 0 1 1';
const DRAW_TIMES = '0;.08;.62;1';

export default function FeedTransition() {
  const id = useId().replace(/:/g, '');
  const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const dark = typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'dark';

  const violet = dark ? '#7C6EFA' : '#5B4BF5';
  const mid = dark ? '#9B7BFF' : '#8B5CF6';
  const pink = dark ? '#FF7FA9' : '#FF6B9D';
  const paper = dark ? '#0B0B16' : '#F8FAFC';

  const paintId = `ft-paint-${id}`;
  const tipId = `ft-tip-${id}`;
  const ferruleId = `ft-ferrule-${id}`;
  const handleId = `ft-handle-${id}`;
  const maskId = `ft-mask-${id}`;

  // SMIL animations are skipped for reduced motion so the stroke simply shows, finished.
  const anim = (props) => (reduced ? null : <animate dur={DUR} fill="freeze" {...props} />);

  return (
    <div className="feed-transition" role="status" aria-label="Opening your Earts feed">
      <div className="feed-transition-content">
        <EartsLogo size={64} className="feed-transition-logo" />

        <div className="feed-transition-stage" aria-hidden="true">
          <svg className="feed-transition-art" viewBox="0 0 1200 560" preserveAspectRatio="xMidYMid meet">
            <defs>
              <linearGradient id={paintId} gradientUnits="userSpaceOnUse" x1="50" y1="0" x2="780" y2="0">
                <stop offset="0" stopColor={violet} />
                <stop offset=".55" stopColor={mid} />
                <stop offset="1" stopColor={pink} />
              </linearGradient>

              {/* Paint on the brush tip shifts from violet to pink in step with the stroke */}
              <linearGradient id={tipId} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="-72" y2="0">
                <stop offset="0" stopColor={reduced ? pink : violet}>
                  {anim({ attributeName: 'stop-color', values: `${violet};${violet};${pink};${pink}`, keyTimes: DRAW_TIMES })}
                </stop>
                <stop offset=".38" stopColor={mid} />
                <stop offset=".56" stopColor="#C9C2F8" />
                <stop offset="1" stopColor="#EDE9FE" />
              </linearGradient>

              <linearGradient id={ferruleId} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="#E4E1FA" />
                <stop offset=".3" stopColor="#A9A5CC" />
                <stop offset=".65" stopColor="#F6F5FF" />
                <stop offset="1" stopColor="#8582A8" />
              </linearGradient>
              <linearGradient id={handleId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#7A6BFF" />
                <stop offset=".5" stopColor="#5B4BF5" />
                <stop offset="1" stopColor="#4338CA" />
              </linearGradient>

              {/* The mask reveals the stroke along the brush's path */}
              <mask id={maskId} maskUnits="userSpaceOnUse" x="-100" y="-50" width="1100" height="600">
                <path
                  d={MOTION_PATH}
                  pathLength="1"
                  fill="none"
                  stroke="#fff"
                  strokeWidth="190"
                  strokeDasharray="1"
                  strokeDashoffset={reduced ? 0 : 1}
                >
                  {anim({ attributeName: 'stroke-dashoffset', values: '1;1;0;0', keyTimes: DRAW_TIMES, calcMode: 'spline', keySplines: SPLINES })}
                </path>
              </mask>
            </defs>

            <g transform="translate(220 90)">
              <g mask={`url(#${maskId})`}>
                <path d={STROKE_BODY} fill={`url(#${paintId})`} />
                <g fill="none" strokeLinecap="round" stroke={`url(#${paintId})`}>
                  {STROKE_FLYAWAYS.map((s, i) => <path key={i} d={s.d} strokeWidth={s.w} />)}
                </g>
                <g fill="none" strokeLinecap="round" stroke={paper}>
                  {STROKE_GAPS.map((s, i) => <path key={i} d={s.d} strokeWidth={s.w} />)}
                </g>
              </g>

              {!reduced && (
                <>
                  {/* Spatter as the brush lifts away */}
                  <g fill={pink} opacity="0">
                    <animate attributeName="opacity" values="0;0;1;1" keyTimes="0;.62;.7;1" dur={DUR} fill="freeze" />
                    <circle cx="772" cy="104" r="3.4" />
                    <circle cx="792" cy="152" r="2.4" />
                    <circle cx="752" cy="92" r="2" />
                    <circle cx="806" cy="124" r="3" />
                  </g>

                  {/* A flat brush: pale bristles, metal ferrule, violet handle with a hang hole */}
                  <g opacity="0">
                    <animate attributeName="opacity" values="0;1;1;0;0" keyTimes="0;.06;.64;.74;1" dur={DUR} fill="freeze" />
                    <g>
                      <animateMotion dur={DUR} fill="freeze" rotate="auto" calcMode="spline" keyPoints="0;0;1;1" keyTimes={DRAW_TIMES} keySplines={SPLINES} path={MOTION_PATH} />
                      <g transform="rotate(45)">
                        <path d="M0 -42L-2 -30L1 -18L-1 -6L2 6L-1 18L1 30L-1 42L-72 36L-72 -36Z" fill={`url(#${tipId})`} />
                        <path d="M-6 -30H-66M-6 -16H-66M-6 0H-66M-6 16H-66M-6 30H-66" stroke="#fff" strokeOpacity=".35" strokeWidth="1.2" />
                        <path d="M-72 -37L-112 -33L-112 33L-72 37Z" fill={`url(#${ferruleId})`} />
                        <path d="M-84 -36V36M-100 -34V34" stroke="#5f5c86" strokeWidth="1.2" />
                        <path d="M-112 -26C-140 -24 -165 -16 -200 -14C-235 -12 -255 -17 -268 -17Q-278 -17 -278 0Q-278 17 -268 17C-255 17 -235 12 -200 14C-165 16 -140 24 -112 26Z" fill={`url(#${handleId})`} />
                        <path d="M-118 -20C-150 -19 -175 -12 -205 -9" stroke="#fff" strokeOpacity=".4" strokeWidth="2" fill="none" strokeLinecap="round" />
                        <circle cx="-264" cy="0" r="5.5" fill="#1A1A3E" />
                      </g>
                    </g>
                  </g>
                </>
              )}
            </g>
          </svg>
        </div>

        <span className="feed-transition-caption">Your creative space is ready</span>
      </div>
    </div>
  );
}
