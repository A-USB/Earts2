// One place that turns a picked file into the image Earts stores, used by both the quick
// "Hang something new" modal and the full Upload page so they behave identically.
//  - big photos are resized (longest side 2048px) and re-encoded, so a 12 MB phone photo becomes a few hundred KB
//  - images that are already small are kept exactly as they are (no needless quality loss)
//  - animated GIFs are never re-encoded (that would flatten the animation)
//  - an average colour is read from the image, so we no longer ask people to pick one by hand

export const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
export const ACCEPT_ATTR = ACCEPTED_TYPES.join(',');
export const MAX_FILE_BYTES = 25 * 1024 * 1024;     // what a person may pick
const MAX_STORED_BYTES = 2.8 * 1024 * 1024;         // what we send (the server accepts up to 3 MB)
const KEEP_ORIGINAL_BYTES = 1.5 * 1024 * 1024;
const MAX_EDGE = 2048;

export function formatBytes(bytes) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

const readAsDataUrl = (blob) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onerror = () => reject(new Error('Unable to read this image.'));
  reader.onload = () => resolve(reader.result);
  reader.readAsDataURL(blob);
});

const loadImage = (src) => new Promise((resolve, reject) => {
  const image = new Image();
  image.onerror = () => reject(new Error('This file is not a valid image.'));
  image.onload = () => resolve(image);
  image.src = src;
});

const toBlob = (canvas, type, quality) => new Promise(resolve => canvas.toBlob(resolve, type, quality));

function averageColor(image) {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 16;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(image, 0, 0, 16, 16);
    const { data } = ctx.getImageData(0, 0, 16, 16);
    let r = 0, g = 0, b = 0, n = 0;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] < 40) continue;
      r += data[i]; g += data[i + 1]; b += data[i + 2]; n += 1;
    }
    if (!n) return '#6025EA';
    const hex = v => Math.round(v / n).toString(16).padStart(2, '0');
    return `#${hex(r)}${hex(g)}${hex(b)}`.toUpperCase();
  } catch {
    return '#6025EA';
  }
}

export async function processArtworkFile(file) {
  if (!file) throw new Error('Choose an image to upload.');
  if (!ACCEPTED_TYPES.includes(file.type)) throw new Error('Please choose a PNG, JPG, WEBP, or GIF image.');
  if (file.size > MAX_FILE_BYTES) throw new Error('That file is over 25 MB. Please choose a smaller image.');

  const originalUrl = await readAsDataUrl(file);
  const image = await loadImage(originalUrl);
  const width = image.naturalWidth;
  const height = image.naturalHeight;
  const color = averageColor(image);
  const base = { name: file.name, color };

  const keepOriginal = () => ({ ...base, dataUrl: originalUrl, width, height, sizeBytes: file.size, resized: false });

  if (file.type === 'image/gif') {
    if (file.size > MAX_STORED_BYTES) throw new Error('Animated GIFs must be under 2.8 MB. Try a still image or a smaller GIF.');
    return keepOriginal();
  }

  const fit = Math.min(1, MAX_EDGE / Math.max(width, height));
  if (fit === 1 && file.size <= KEEP_ORIGINAL_BYTES) return keepOriginal();

  for (const shrink of [1, 0.85, 0.7, 0.55]) {
    const scale = fit * shrink;
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Image processing is not available in this browser.');
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    for (const quality of [0.86, 0.76, 0.64]) {
      let blob = await toBlob(canvas, 'image/webp', quality);
      if (!blob || blob.type !== 'image/webp') {
        // Older browsers can't encode WebP: fall back to JPEG on a white background (JPEG has no transparency)
        const flat = document.createElement('canvas');
        flat.width = canvas.width;
        flat.height = canvas.height;
        const flatCtx = flat.getContext('2d');
        flatCtx.fillStyle = '#fff';
        flatCtx.fillRect(0, 0, flat.width, flat.height);
        flatCtx.drawImage(canvas, 0, 0);
        blob = await toBlob(flat, 'image/jpeg', quality);
      }
      if (!blob) continue;
      if (blob.size <= MAX_STORED_BYTES) {
        // If re-encoding didn't help and the original is acceptable, keep the original
        if (fit === 1 && shrink === 1 && blob.size >= file.size && file.size <= MAX_STORED_BYTES) return keepOriginal();
        return {
          ...base,
          dataUrl: await readAsDataUrl(blob),
          width: canvas.width,
          height: canvas.height,
          sizeBytes: blob.size,
          resized: true,
        };
      }
    }
  }
  throw new Error('This image is too detailed to shrink enough. Try exporting it at a smaller size.');
}
