// Notification Engine for Maladh (Daily Sunnah, Adhkar & Wird Reminders)
// Fully compatible with mobile PWAs (Service Worker showNotification) & Desktop

export interface NotificationConfig {
  morning: { enabled: boolean; time: string };
  evening: { enabled: boolean; time: string };
  quran: { enabled: boolean; time: string };
}

export const STORAGE_NOTIF_CONFIG = 'maladh_notifications_config';

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function isNotificationGranted(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted';
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!isNotificationSupported()) {
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch {
      return false;
    }
  }

  return false;
}

/**
 * Universal Mobile & Desktop Notification Dispatcher
 * Uses ServiceWorkerRegistration.showNotification() for mobile PWA compliance
 * (Android Chrome / Chromium throws Illegal Constructor on new Notification())
 */
export async function showAppNotification(title: string, options?: NotificationOptions): Promise<boolean> {
  if (!isNotificationGranted()) {
    const granted = await requestNotificationPermission();
    if (!granted) return false;
  }

  const defaultOptions: NotificationOptions = {
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    dir: 'rtl',
    lang: 'ar',
    ...options
  };

  // 1. Primary path: Service Worker showNotification (Mandatory for Android & mobile PWAs)
  if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;
      if (registration && 'showNotification' in registration) {
        await registration.showNotification(title, defaultOptions);
        return true;
      }
    } catch (swErr) {
      console.warn('ServiceWorker showNotification failed, trying fallback:', swErr);
    }
  }

  // 2. Secondary fallback: Desktop Notification API constructor
  if (typeof window !== 'undefined' && 'Notification' in window) {
    try {
      const notif = new Notification(title, defaultOptions);
      notif.onclick = () => {
        window.focus();
        notif.close();
      };
      return true;
    } catch (notifErr) {
      console.warn('Desktop Notification constructor failed:', notifErr);
    }
  }

  return false;
}

/**
 * Send an immediate test notification to confirm to the user that notifications are working
 */
export async function sendTestNotification(): Promise<boolean> {
  return showAppNotification('مَـلَاذْ · تم تفعيل التنبيهات بنجاح ✨', {
    body: 'سوف نذكرك بأذكار الصباح والمساء وورد القرآن في الأوقات المحددة بهدوء وسكينة.',
    tag: 'maladh-test-notification'
  });
}

/**
 * Send daily sunnah notification
 */
export async function sendDailySunnahNotification(sunnahTitle: string, hadithSnippet: string) {
  await showAppNotification('مَـلَاذْ · سنة اليوم المباركة 🌿', {
    body: `${sunnahTitle}\n${hadithSnippet}`,
    tag: 'maladh-daily-sunnah'
  });
}

/**
 * Check and dispatch any due reminders based on local time
 */
export function checkAndDispatchDueReminders() {
  if (!isNotificationGranted()) return;

  const rawConfig = localStorage.getItem(STORAGE_NOTIF_CONFIG);
  if (!rawConfig) return;

  try {
    const config: NotificationConfig = JSON.parse(rawConfig);
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentHours = String(now.getHours()).padStart(2, '0');
    const currentMinutes = String(now.getMinutes()).padStart(2, '0');
    const currentTime = `${currentHours}:${currentMinutes}`;

    // 1. Morning Adhkar Reminder
    if (config.morning?.enabled && config.morning.time) {
      const sentKey = `maladh_notif_sent_morning_${today}`;
      if (!localStorage.getItem(sentKey) && currentTime >= config.morning.time && now.getHours() < 12) {
        showAppNotification('حان وقت أذكار الصباح ☀️', {
          body: '«أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ» — ابدأ يومك المبارك بورد الصباح والسكينة.',
          tag: 'maladh-morning-adhkar'
        });
        localStorage.setItem(sentKey, 'true');
      }
    }

    // 2. Evening Adhkar Reminder
    if (config.evening?.enabled && config.evening.time) {
      const sentKey = `maladh_notif_sent_evening_${today}`;
      if (!localStorage.getItem(sentKey) && currentTime >= config.evening.time && now.getHours() < 22) {
        showAppNotification('حان وقت أذكار المساء 🌙', {
          body: 'حصّن نفسك وأهلك بورد المساء وانعم بالطمأنينة وحفظ الله.',
          tag: 'maladh-evening-adhkar'
        });
        localStorage.setItem(sentKey, 'true');
      }
    }

    // 3. Quran Wird Reminder
    if (config.quran?.enabled && config.quran.time) {
      const sentKey = `maladh_notif_sent_quran_${today}`;
      if (!localStorage.getItem(sentKey) && currentTime >= config.quran.time) {
        showAppNotification('وردك القرآني اليومي 📖', {
          body: '«وَرَتِّلِ الْقُرْآنَ تَرْتِيلًا» — افتح المصحف الشريف وأكمل وردك الهادئ الآن.',
          tag: 'maladh-quran-wird'
        });
        localStorage.setItem(sentKey, 'true');
      }
    }
  } catch (err) {
    console.warn('Error evaluating reminders:', err);
  }
}

let schedulerTimer: ReturnType<typeof setInterval> | null = null;

/**
 * Start the recurring background checker
 */
export function initNotificationScheduler() {
  if (typeof window === 'undefined') return;

  // Immediate check on boot
  checkAndDispatchDueReminders();

  // Periodic check every 30 seconds
  if (!schedulerTimer) {
    schedulerTimer = setInterval(() => {
      checkAndDispatchDueReminders();
    }, 30000);
  }
}
