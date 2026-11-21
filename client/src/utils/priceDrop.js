const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

/** Returns { previous, percent } when the artist lowered the price in the last 30 days, otherwise null. */
export function getPriceDrop(artwork) {
  if (!artwork || artwork.status !== 'for_sale') return null;
  const price = Number(artwork.price);
  const previous = Number(artwork.previousPrice);
  if (!Number.isFinite(price) || !Number.isFinite(previous) || previous <= price || price < 0) return null;
  if (!artwork.priceDroppedAt || Date.now() - Number(artwork.priceDroppedAt) > THIRTY_DAYS) return null;
  return { previous, percent: Math.max(1, Math.round((1 - price / previous) * 100)) };
}
