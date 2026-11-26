import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { api } from '../utils/api';
import { MAX_TAGS, isValidTag, normalizeTag } from '../utils/tags';
import './TagInput.css';

/** Chip input for artwork tags. Enter, comma or space adds a tag; Backspace removes the last one. */
export default function TagInput({ value, onChange, max = MAX_TAGS, id = 'tag-input' }) {
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const [popular, setPopular] = useState([]);

  useEffect(() => {
    let cancelled = false;
    api.get('/tags/popular?limit=10').then(list => { if (!cancelled) setPopular(list.map(item => item.tag)); }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const add = (raw) => {
    const tag = normalizeTag(raw);
    if (!tag) { setDraft(''); return; }
    if (!isValidTag(tag)) { setError('Use 2 to 24 letters, numbers or hyphens.'); return; }
    if (value.includes(tag)) { setDraft(''); setError(''); return; }
    if (value.length >= max) { setError(`You can add up to ${max} tags.`); return; }
    onChange([...value, tag]);
    setDraft('');
    setError('');
  };

  const onKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ',' || event.key === ' ') {
      if (draft.trim()) { event.preventDefault(); add(draft); }
      else if (event.key === 'Enter') event.preventDefault();
    } else if (event.key === 'Backspace' && !draft && value.length) {
      onChange(value.slice(0, -1));
    }
  };

  const suggestions = popular.filter(tag => !value.includes(tag)).slice(0, 8);

  return (
    <div className="tag-input">
      <div className="tag-input-box" onClick={() => document.getElementById(id)?.focus()}>
        {value.map(tag => (
          <span className="tag-chip" key={tag}>
            #{tag}
            <button type="button" onClick={() => onChange(value.filter(item => item !== tag))} aria-label={`Remove tag ${tag}`}><X size={12} /></button>
          </span>
        ))}
        {value.length < max && (
          <input
            id={id}
            type="text"
            value={draft}
            maxLength={30}
            placeholder={value.length ? 'Add another…' : 'e.g. watercolour, landscape'}
            onChange={e => { setDraft(e.target.value); setError(''); }}
            onKeyDown={onKeyDown}
            onBlur={() => { if (draft.trim()) add(draft); }}
            aria-describedby={`${id}-hint`}
          />
        )}
      </div>
      <p className="tag-input-hint" id={`${id}-hint`}>
        {error ? <span className="tag-input-error" role="alert">{error}</span> : `Up to ${max} tags. Press Enter or comma to add. People can follow tags to see more of this kind of work.`}
      </p>
      {suggestions.length > 0 && value.length < max && (
        <div className="tag-suggestions" aria-label="Popular tags">
          <span>Popular:</span>
          {suggestions.map(tag => (
            <button type="button" key={tag} onClick={() => add(tag)}>#{tag}</button>
          ))}
        </div>
      )}
    </div>
  );
}
