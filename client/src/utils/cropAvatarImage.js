/**
 * Helpers for the profile-photo crop card.
 *
 * Crop model: the visible frame is a square of size 1 ("frame units").
 *   zoom 1  = the photo's shorter side exactly fills the frame
 *   pan x/y = how far the photo's centre is moved from the frame's centre, in frame units
 * The same numbers drive the on-screen preview and the exported image, so what you see is what you get.
 */

export const MIN_ZOOM = 1;
export const MAX_ZOOM = 4;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function validateAvatarFile(file) {
  if (!file || !ACCEPTED_TYPES.includes(file.type)) throw new Error('Choose a JPG, PNG, or WebP image.');
  if (file.size > 10 * 1024 * 1024) throw new Error('Choose an image smaller than 10 MB.');
}

/** Reads a chosen file into an <img>. Resolves { image, url }; call URL.revokeObjectURL(url) when done. */
export function loadAvatarSource(file) {
  return new Promise((resolve, reject) => {
    try {
      validateAvatarFile(file);
    } catch (error) {
      reject(error);
      return;
    }
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => resolve({ image, url });
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('This file is not a valid image.'));
    };
    image.src = url;
  });
}

export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

/** Scale (frame units per image pixel) at a given zoom. */
export function frameScale(width, height, zoom) {
  return zoom * Math.max(1 / width, 1 / height);
}

/** Keeps the photo covering the whole frame, so no empty corners can ever end up in the avatar. */
export function clampPan(pan, zoom, width, height) {
  const scale = frameScale(width, height, zoom);
  const maxX = Math.max(0, (width * scale - 1) / 2);
  const maxY = Math.max(0, (height * scale - 1) / 2);
  return { x: clamp(pan.x, -maxX, maxX), y: clamp(pan.y, -maxY, maxY) };
}

/** Draws the framed area and returns a compressed WebP data URL (the API accepts up to ~128 KB). */
export async function renderAvatarCrop(image, { zoom, panX, panY }) {
  const width = image.naturalWidth;
  const height = image.naturalHeight;
  const scale = frameScale(width, height, zoom);
  const sourceSize = 1 / scale;
  const sourceX = width / 2 - (0.5 + panX) / scale;
  const sourceY = height / 2 - (0.5 + panY) / scale;

  for (const dimension of [256, 192, 128]) {
    const canvas = document.createElement('canvas');
    canvas.width = dimension;
    canvas.height = dimension;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Image processing is not available in this browser.');
    context.imageSmoothingQuality = 'high';
    context.drawImage(image, sourceX, sourceY, sourceSize, sourceSize, 0, 0, dimension, dimension);

    for (const quality of [0.86, 0.72, 0.58]) {
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', quality));
      if (blob && blob.size <= 120 * 1024) {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onerror = () => reject(new Error('Unable to process this image.'));
          reader.onload = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        });
      }
    }
  }
  throw new Error('This image could not be compressed enough. Try a smaller photo.');
}
