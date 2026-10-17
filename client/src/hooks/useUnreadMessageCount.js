import { useCallback, useEffect, useState } from 'react';
import { api } from '../utils/api';

export function announceMessagesChanged() {
  window.dispatchEvent(new Event('earts-messages-changed'));
}

export default function useUnreadMessageCount(userId) {
  const [count, setCount] = useState(0);

  const refresh = useCallback(() => {
    if (!userId || document.visibilityState === 'hidden') return;
    api.get('/messages/unread-count')
      .then(data => setCount(data?.count || 0))
      .catch(() => {});
  }, [userId]);

  useEffect(() => {
    if (!userId) { setCount(0); return undefined; }
    refresh();
    const interval = window.setInterval(refresh, 20000);
    window.addEventListener('earts-messages-changed', refresh);
    window.addEventListener('focus', refresh);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('earts-messages-changed', refresh);
      window.removeEventListener('focus', refresh);
    };
  }, [userId, refresh]);

  return count;
}
