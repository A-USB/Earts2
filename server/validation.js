const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CATEGORIES = new Set([
  'Painting', 'Digital', 'Illustration', 'Watercolour', 'Abstract',
  'Sculpture', 'Mixed Media', 'Photography', 'Printmaking'
]);
const ROLES = new Set([
  'Painter', 'Digital Artist', 'Illustrator', 'Sculptor', 'Concept Artist',
  'Photographer', '3D & VFX Artist', 'Printmaker', 'Ceramicist', 'Mixed Media', 'Other', 'Collector', 'Artist'
]);
const CONTROL_CHARACTERS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;

function text(value, label, maxLength, { required = false, minLength = 0, multiline = false } = {}) {
  if (typeof value !== 'string') return `${label} must be text`;
  const normalized = value.trim();
  if (required && !normalized) return `${label} is required`;
  if (normalized.length < minLength) return `${label} must be at least ${minLength} characters`;
  if (normalized.length > maxLength) return `${label} must be ${maxLength} characters or fewer`;
  if (CONTROL_CHARACTERS.test(normalized) || (!multiline && /[\r\n]/.test(normalized))) {
    return `${label} contains unsupported characters`;
  }
  return null;
}

function email(value, maxLength = 254) {
  if (typeof value !== 'string') return 'Enter a valid email address';
  const normalized = value.trim().toLowerCase();
  return normalized.length <= maxLength && EMAIL_PATTERN.test(normalized)
    ? null
    : `Enter a valid email address (max ${maxLength} characters)`;
}

function signupPassword(value) {
  if (typeof value !== 'string' || value.length < 7) return 'Password must be at least 7 characters';
  if (value.length > 17) return 'Password must be 17 characters or fewer';
  if (!/\d/.test(value)) return 'Password must include at least one number';
  if (!/[^A-Za-z0-9\s]/.test(value)) return 'Password must include at least one special character';
  return null;
}

function enumValue(value, choices, label) {
  return choices.has(value) ? null : `Choose a valid ${label}`;
}

function stringArray(value, label, { maxItems = 20, itemLength = 40 } = {}) {
  if (!Array.isArray(value) || value.length > maxItems) return `${label} must contain at most ${maxItems} items`;
  for (const item of value) {
    const error = text(item, label, itemLength, { required: true });
    if (error) return error;
  }
  return null;
}

function safeImage(value) {
  if (value == null || value === '') return null;
  if (typeof value !== 'string' || value.length > 4.1 * 1024 * 1024) return 'Image must be 3 MB or smaller';
  const match = value.match(/^data:image\/(png|jpeg|webp|gif);base64,([a-z\d+/]+=*)$/i);
  if (!match) return 'Use a PNG, JPG, WEBP, or GIF image';
  const bytes = Buffer.from(match[2], 'base64');
  if (bytes.length > 3 * 1024 * 1024) return 'Image must be 3 MB or smaller';
  const type = match[1].toLowerCase();
  const signatureMatches = type === 'png'
    ? bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
    : type === 'jpeg'
      ? bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
      : type === 'gif'
        ? bytes.length >= 6 && ['GIF87a', 'GIF89a'].includes(bytes.subarray(0, 6).toString('ascii'))
        : bytes.length >= 12 && bytes.subarray(0, 4).toString('ascii') === 'RIFF' && bytes.subarray(8, 12).toString('ascii') === 'WEBP';
  if (!signatureMatches) return 'The uploaded file does not match its image type';
  return null;
}

function price(value, { required = false } = {}) {
  if (value == null || value === '') return required ? 'Enter a price' : null;
  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0 && amount <= 1000000000
    ? null
    : 'Price must be greater than 0 and no more than 1,000,000,000';
}

module.exports = { CATEGORIES, ROLES, text, email, signupPassword, enumValue, stringArray, safeImage, price };
