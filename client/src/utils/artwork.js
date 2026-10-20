// Shared artwork rules so the quick modal and the full Upload page can never drift apart.

export const CATEGORIES = [
  'Painting', 'Digital', 'Illustration', 'Watercolour',
  'Abstract', 'Sculpture', 'Mixed Media', 'Photography', 'Printmaking',
];

export const emptyArtworkForm = () => ({
  title: '',
  description: '',
  category: 'Digital',
  medium: '',
  year: new Date().getFullYear(),
  forSale: false,
  price: '',
  color: '#6025EA',
});

// Returns an error message, or '' when the artwork is ready to publish
export function validateArtwork(form, imageData) {
  if (!imageData) return 'Add an image of your artwork to continue.';
  if (!form.title || !form.title.trim()) return 'Give your artwork a title.';
  if (form.forSale && (!form.price || Number(form.price) <= 0)) return 'Enter a price to list it for sale.';
  return '';
}

export function buildArtworkPayload(form, imageData, collaborators = []) {
  return {
    title: form.title.trim(),
    description: (form.description || '').trim(),
    category: form.category,
    medium: (form.medium || '').trim() || form.category,
    year: Number(form.year) || new Date().getFullYear(),
    color: form.color,
    imageUrl: imageData,
    status: form.forSale ? 'for_sale' : 'not_for_sale',
    price: form.forSale ? Number(form.price) : null,
    collaborators,
  };
}
