export const AVATAR_PRESETS = Array.from({ length: 12 }, (_, index) => {
  const seed = `earts-avatar-${String(index + 1).padStart(2, '0')}`;
  return { id: seed, seed };
});
