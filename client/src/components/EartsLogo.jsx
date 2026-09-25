import React from 'react';

/**
 * High-Precision Earts Brushstroke "E" Logo Component
 * Handcrafted vector paths traced 1:1 from the official high-resolution brand asset.
 *
 * @param {Object} props
 * @param {'full' | 'icon' | 'badge'} [props.variant='full']
 * @param {number} [props.size=36]
 * @param {string} [props.className]
 * @param {string} [props.color='#6025EA']
 */
export const EartsBrushIcon = ({ size = 36, className = '', color = '#6025EA' }) => (
  <svg
    width={size}
    height={size}
    viewBox="255 240 475 530"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`earts-brush-icon ${className}`}
    style={{ display: 'block', flexShrink: 0 }}
  >
    {/* 1. TOP STROKE */}
    <path
      d="M 284 472 C 275 450 290 410 332 370 C 390 315 482 268 596 252 C 648 245 680 250 684 251 C 674 268 656 281 678 285 C 696 288 710 286 714 286 C 700 300 682 316 722 316 C 690 338 650 354 624 354 C 520 355 422 400 348 450 C 314 472 292 485 284 472 Z"
      fill={color}
    />

    {/* 2. MIDDLE STROKE & SPINE */}
    <path
      d="M 266 714 C 262 650 286 575 330 514 C 382 444 476 430 592 432 C 632 433 646 436 646 436 C 632 452 604 466 636 476 C 622 490 600 500 574 502 C 484 510 398 572 322 666 C 298 696 280 718 266 714 Z"
      fill={color}
    />

    {/* 3. BOTTOM STROKE */}
    <path
      d="M 312 734 C 310 716 332 688 382 648 C 452 594 546 592 638 594 C 662 595 670 596 668 596 C 654 608 638 616 672 622 C 702 627 686 648 658 668 C 586 720 488 764 402 764 C 342 764 314 752 312 734 Z"
      fill={color}
    />
  </svg>
);

export const EartsBadgeIcon = ({ size = 36, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 1000 1000"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`earts-badge-icon ${className}`}
    style={{ display: 'block', flexShrink: 0 }}
  >
    <defs>
      <linearGradient id="eartsBadgeBg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#672CF6" />
        <stop offset="100%" stopColor="#4F46E5" />
      </linearGradient>
    </defs>

    {/* Squircle Badge Background */}
    <rect width="1000" height="1000" rx="260" fill="url(#eartsBadgeBg)" />

    {/* Solid White High-Res Brushstroke "E" */}
    <g transform="translate(15, 5)">
      {/* 1. TOP STROKE */}
      <path
        d="M 284 472 C 275 450 290 410 332 370 C 390 315 482 268 596 252 C 648 245 680 250 684 251 C 674 268 656 281 678 285 C 696 288 710 286 714 286 C 700 300 682 316 722 316 C 690 338 650 354 624 354 C 520 355 422 400 348 450 C 314 472 292 485 284 472 Z"
        fill="#FFFFFF"
      />

      {/* 2. MIDDLE STROKE & SPINE */}
      <path
        d="M 266 714 C 262 650 286 575 330 514 C 382 444 476 430 592 432 C 632 433 646 436 646 436 C 632 452 604 466 636 476 C 622 490 600 500 574 502 C 484 510 398 572 322 666 C 298 696 280 718 266 714 Z"
        fill="#FFFFFF"
      />

      {/* 3. BOTTOM STROKE */}
      <path
        d="M 312 734 C 310 716 332 688 382 648 C 452 594 546 592 638 594 C 662 595 670 596 668 596 C 654 608 638 616 672 622 C 702 627 686 648 658 668 C 586 720 488 764 402 764 C 342 764 314 752 312 734 Z"
        fill="#FFFFFF"
      />
    </g>
  </svg>
);

export const EartsLogo = ({
  variant = 'full',
  size = 36,
  className = '',
  textColor = '#6025EA',
  withBadge = false,
}) => {
  const IconComponent = withBadge ? EartsBadgeIcon : EartsBrushIcon;

  if (variant === 'icon') {
    return <IconComponent size={size} className={className} color={textColor} />;
  }

  return (
    <div
      className={`earts-full-logo ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: `${Math.max(10, Math.round(size * 0.28))}px`,
        textDecoration: 'none',
      }}
    >
      <IconComponent size={size} color={textColor} />
      <span
        className="earts-logo-wordmark"
        style={{
          fontFamily: "'Plus Jakarta Sans', 'Inter', system-ui, -apple-system, sans-serif",
          fontSize: `${Math.round(size * 0.72)}px`,
          fontWeight: 800,
          color: textColor,
          letterSpacing: '-0.035em',
          lineHeight: 1,
          userSelect: 'none',
        }}
      >
        Earts
      </span>
    </div>
  );
};

export const EartsIcon = EartsBrushIcon;
export default EartsLogo;
