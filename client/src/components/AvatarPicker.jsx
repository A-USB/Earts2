import Avatar from './Avatar';
import { AVATAR_PRESETS } from '../utils/avatarPresets';
import './AvatarPicker.css';

export default function AvatarPicker({ value, onChange, label = 'Choose an illustrated avatar', disabled = false }) {
  return (
    <div className="avatar-picker" role="group" aria-label={label}>
      {AVATAR_PRESETS.map((preset, index) => (
        <button
          type="button"
          className={`avatar-picker-option${value === preset.id ? ' selected' : ''}`}
          key={preset.id}
          onClick={() => onChange(preset.id)}
          disabled={disabled}
          aria-label={`Choose avatar ${index + 1}`}
          aria-pressed={value === preset.id}
        >
          <Avatar seed={preset.seed} size={64} />
        </button>
      ))}
    </div>
  );
}
