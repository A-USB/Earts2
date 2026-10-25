// 69502 -> "69.5K", 1250000 -> "1.3M", 999 -> "999". One format for followers, likes and drops everywhere.
const compact = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 });

export function formatCompact(n) {
  return compact.format(Number(n) || 0);
}
