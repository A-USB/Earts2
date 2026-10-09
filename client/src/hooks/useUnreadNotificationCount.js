import { useCallback, useEffect, useState } from 'react';
import { api } from '../utils/api';

export function announceNotificationsChanged() {
  window.dispatchEvent(new Event('earts-notifications-changed'));
}

export default function useUnreadNotificationCount(userId) {
  const [count, setCount] = useState(0);

  const refresh = useCallback(() => {
    if (!userId) {
      setCount(0);
      return;
    }
    api.get('/notifications')
      .then(items => setCount(Array.isArray(items) ? items.filter(item => !item.read).length : 0))
      .catch(() => {});
  }, [userId]);

  useEffect(() => {
    refresh();
    const interval = window.setInterval(refresh, 30000);
    window.addEventListener('earts-notifications-changed', refresh);
    window.addEventListener('focus', refresh);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('earts-notifications-changed', refresh);
      window.removeEventListener('focus', refresh);
    };
  }, [refresh]);

  return count;
}
