import './IconTile.css';

// A real SVG icon on a rounded tile. Replaces the emoji that used to stand in for icons,
// so every icon follows the theme and renders the same on every device.
//   tone="solid": brand gradient behind a white icon (the dark theme gets its own gradient)
//   tone="soft":  tinted tile with a coloured icon, for empty states and quiet spots
export default function IconTile({ Icon, size = 'md', tone = 'solid', className = '' }) {
  return (
    <span className={`icon-tile icon-tile-${size} icon-tile-${tone} ${className}`.trim()} aria-hidden="true">
      <Icon strokeWidth={2} />
    </span>
  );
}
