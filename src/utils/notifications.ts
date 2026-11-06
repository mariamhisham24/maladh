// Notification Helper for Maladh (Daily Sunnah & Adhkar Reminders)

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}

export function isNotificationSupported(): boolean {
  return 'Notification' in window;
}

export function isNotificationGranted(): boolean {
  return 'Notification' in window && Notification.permission === 'granted';
}

export function sendDailySunnahNotification(sunnahTitle: string, hadithSnippet: string) {
  if (!isNotificationGranted()) return;

  try {
    const notification = new Notification('مَـلَاذْ · سنة اليوم المباركة', {
      body: `${sunnahTitle}\n${hadithSnippet}`,
      icon: '/maladh-logo-icon.png',
      badge: '/maladh-logo-icon.png',
      dir: 'rtl',
      lang: 'ar',
      tag: 'maladh-daily-sunnah',
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  } catch (err) {
    console.warn('Failed to dispatch notification:', err);
  }
}
