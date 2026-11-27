const DAY = 86400000;

export const STATUS_LABEL = { upcoming: 'Starts soon', open: 'Open', closed: 'Ended' };

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

export function formatDate(value) {
  return new Date(value).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
}

/** "Ends in 3 days", "Starts tomorrow", "Ended 12 Dec 2026" */
export function timeLabel(challenge) {
  const now = Date.now();
  if (challenge.status === 'upcoming') {
    const days = Math.ceil((challenge.startsAt - now) / DAY);
    return days <= 1 ? 'Starts tomorrow' : `Starts in ${plural(days, 'day')}`;
  }
  if (challenge.status === 'open') {
    const hours = Math.ceil((challenge.endsAt - now) / 3600000);
    if (hours <= 24) return `Ends in ${plural(Math.max(1, hours), 'hour')}`;
    return `Ends in ${plural(Math.ceil(hours / 24), 'day')}`;
  }
  return `Ended ${formatDate(challenge.endsAt)}`;
}
