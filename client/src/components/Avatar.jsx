/**
 * Avatar component — renders an illustrated SVG avatar based on a seed string.
 * No letters, no photos needed. Each seed produces a unique face + color combo.
 */

const SKIN_TONES = ['#FDBCB4','#F1A070','#C68642','#8D5524','#4A2912','#FDDBB4','#E8B89A'];
const HAIR_COLORS = ['#1a1a1a','#4a2c2a','#b5651d','#d4a017','#c0392b','#8B5E3C','#2C3E50','#7D3C98'];
const SHIRT_COLORS = ['#5B4BF5','#FF6B9D','#00BCD4','#FF6B35','#27AE60','#8E44AD','#E74C3C','#2980B9'];
const HAIR_STYLES = ['short','medium','long','curly','afro','bun'];
const BG_GRADIENTS = [
  ['#F093FB','#C44FD8'],['#4facfe','#00f2fe'],['#f6d365','#fda085'],
  ['#a29bfe','#6c5ce7'],['#fd79a8','#e17055'],['#55efc4','#00b894'],
  ['#fdcb6e','#e17055'],['#74b9ff','#0984e3'],
];

function hashStr(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function pick(arr, seed) { return arr[seed % arr.length]; }

export default function Avatar({ seed = 'default', size = 72, className = '', src = null }) {
  if (src) {
    return (
      <img
        src={src}
        alt={seed}
        width={size}
        height={size}
        className={className}
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', display: 'block' }}
        onError={(e) => { e.currentTarget.style.display = 'none'; }}
      />
    );
  }
  const h = hashStr(seed);
  const skin = pick(SKIN_TONES, h);
  const hair = pick(HAIR_COLORS, h >> 3);
  const shirt = pick(SHIRT_COLORS, h >> 6);
  const hairStyle = pick(HAIR_STYLES, h >> 9);
  const [bg1, bg2] = pick(BG_GRADIENTS, h >> 12);
  const eyeSpacing = 8 + (h % 4);
  const eyeSize = 3 + (h % 2);
  const smileY = 38 + (h % 4);
  const gradId = `ag-${seed.replace(/[^a-z0-9]/gi,'')}-${size}`;

  // Hair paths per style
  const hairPath = {
    short:  `M${36-eyeSpacing} 14 Q36 6 ${36+eyeSpacing} 14 Q48 10 50 20 Q48 12 36 11 Q24 12 22 20 Q24 10 ${36-eyeSpacing} 14Z`,
    medium: `M22 22 Q20 8 36 6 Q52 8 50 22 Q50 10 36 8 Q22 10 22 22Z`,
    long:   `M22 24 Q18 6 36 5 Q54 6 50 24 Q52 8 36 7 Q20 8 22 24Z`,
    curly:  `M22 20 Q20 6 30 5 Q26 4 36 5 Q46 4 42 5 Q52 6 50 20 Q48 8 36 7 Q24 8 22 20Z`,
    afro:   `M14 26 Q12 2 36 2 Q60 2 58 26 Q56 8 36 8 Q16 8 14 26Z`,
    bun:    `M28 14 Q22 8 36 6 Q50 8 44 14 Q42 6 36 6 Q30 6 28 14Z`,
  }[hairStyle];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 72 72"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display:'block', borderRadius:'50%' }}
    >
      <defs>
        <radialGradient id={gradId} cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor={bg1}/>
          <stop offset="100%" stopColor={bg2}/>
        </radialGradient>
      </defs>

      {/* Background circle */}
      <circle cx="36" cy="36" r="36" fill={`url(#${gradId})`}/>

      {/* Shirt / body */}
      <path d="M12 68 Q12 52 36 50 Q60 52 60 68Z" fill={shirt}/>
      <path d="M22 50 Q36 58 50 50 Q60 52 60 68 L12 68 Q12 52 22 50Z" fill={shirt} opacity="0.7"/>

      {/* Neck */}
      <rect x="31" y="42" width="10" height="10" rx="3" fill={skin}/>

      {/* Head */}
      <ellipse cx="36" cy="28" rx="16" ry="18" fill={skin}/>

      {/* Hair */}
      <path d={hairPath} fill={hair}/>
      {hairStyle === 'bun' && <circle cx="36" cy="7" r="5" fill={hair}/>}

      {/* Eyes */}
      <ellipse cx={36-eyeSpacing} cy="27" rx={eyeSize} ry={eyeSize+0.5} fill="#1a1a2e"/>
      <ellipse cx={36+eyeSpacing} cy="27" rx={eyeSize} ry={eyeSize+0.5} fill="#1a1a2e"/>
      <circle cx={36-eyeSpacing+1} cy="26" r="1" fill="white"/>
      <circle cx={36+eyeSpacing+1} cy="26" r="1" fill="white"/>

      {/* Eyebrows */}
      <path d={`M${36-eyeSpacing-3} 22 Q${36-eyeSpacing} 21 ${36-eyeSpacing+3} 22`} stroke={hair} strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      <path d={`M${36+eyeSpacing-3} 22 Q${36+eyeSpacing} 21 ${36+eyeSpacing+3} 22`} stroke={hair} strokeWidth="1.5" fill="none" strokeLinecap="round"/>

      {/* Nose */}
      <path d="M35 30 Q34 34 35.5 35 Q37 35 36.5 34 Q36 33 36 30" stroke={skin} strokeWidth="1" fill="none" opacity="0.5"/>

      {/* Mouth */}
      <path d={`M${36-5} ${smileY} Q36 ${smileY+4} ${36+5} ${smileY}`} stroke="#c0392b" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.7"/>

      {/* Ears */}
      <ellipse cx="20" cy="28" rx="3" ry="4" fill={skin}/>
      <ellipse cx="52" cy="28" rx="3" ry="4" fill={skin}/>
    </svg>
  );
}
