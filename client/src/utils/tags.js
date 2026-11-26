export const MAX_TAGS = 5;
const TAG_PATTERN = /^[\p{L}\p{N}][\p{L}\p{N}-]{1,23}$/u;

/** Same rules as the server: lowercase, no leading #, spaces become hyphens. */
export function normalizeTag(raw) {
  return String(raw ?? '').trim().replace(/^#+/, '').toLowerCase().replace(/\s+/g, '-').replace(/-{2,}/g, '-').replace(/-$/, '');
}

export const isValidTag = (tag) => TAG_PATTERN.test(tag);
