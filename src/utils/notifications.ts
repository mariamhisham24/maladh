// Notification Engine for Maladh (Daily Sunnah, Adhkar & Wird Reminders)
// Fully compatible with mobile PWAs (Service Worker showNotification, Background Sync & Triggers) & Desktop

export interface NotificationConfig {
  morning: { enabled: boolean; time: string };
  evening: { enabled: boolean; time: string };
  quran: { enabled: boolean; time: string };
}

export const STORAGE_NOTIF_CONFIG = 'maladh_notifications_config';
export const STORAGE_SUNNAH_NOTIF = 'maladh_sunnah_notif_enabled';

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

  const defaultOptions: NotificationOptions & { vibrate?: number[] } = {
    icon: '/pwa-192x192.png',
    badge: '/badge-monochrome.png',
    dir: 'rtl',
    lang: 'ar',
    vibrate: [200, 100, 200],
    ...options
  };

  // 1. Primary path: Service Worker showNotification (Mandatory for Android & mobile PWAs)
  if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
    try {
      const registration = await Promise.race([
        navigator.serviceWorker.ready,
        new Promise<undefined>((resolve) => setTimeout(() => resolve(undefined), 1200))
      ]);
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
export async function sendDailySunnahNotification(sunnahTitle: string, hadithSnippet: string): Promise<boolean> {
  const snippet = hadithSnippet.length > 110 ? hadithSnippet.slice(0, 107) + '...' : hadithSnippet;
  return showAppNotification(`سنة اليوم: ${sunnahTitle} 🌿`, {
    body: snippet,
    tag: 'maladh-daily-sunnah'
  });
}

function getNextTriggerDate(timeStr: string): Date {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const target = new Date();
  target.setHours(hours, minutes, 0, 0);
  if (target.getTime() <= Date.now()) {
    target.setDate(target.getDate() + 1);
  }
  return target;
}

/**
 * Schedule future notifications ahead of time using Notification Triggers API
 * This registers notifications directly into Android OS Alarm Manager so they fire
 * even if the browser/app is completely closed and device is in background!
 */
export async function scheduleUpcomingTriggers(
  reg: ServiceWorkerRegistration,
  config: NotificationConfig | null,
  sunnahEnabled: boolean,
  todaySunnah: { title: string; snippet: string } | null
) {
  if (typeof window === 'undefined') return;
  const TimestampTrigger = (window as any).TimestampTrigger;
  if (!TimestampTrigger) return;

  const defaultOptions: NotificationOptions = {
    icon: '/pwa-192x192.png',
    badge: '/badge-monochrome.png',
    dir: 'rtl',
    lang: 'ar'
  };

  try {
    // 1. Morning Adhkar
    if (config?.morning?.enabled && config.morning.time) {
      const nextMorning = getNextTriggerDate(config.morning.time);
      await (reg as any).showNotification('حان وقت أذكار الصباح ☀️', {
        ...defaultOptions,
        body: '«أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ» — ابدأ يومك المبارك بورد الصباح والسكينة.',
        tag: 'maladh-morning-adhkar-scheduled',
        showTrigger: new TimestampTrigger(nextMorning.getTime())
      });
    }

    // 2. Evening Adhkar
    if (config?.evening?.enabled && config.evening.time) {
      const nextEvening = getNextTriggerDate(config.evening.time);
      await (reg as any).showNotification('حان وقت أذكار المساء 🌙', {
        ...defaultOptions,
        body: 'حصّن نفسك وأهلك بورد المساء وانعم بالطمأنينة وحفظ الله.',
        tag: 'maladh-evening-adhkar-scheduled',
        showTrigger: new TimestampTrigger(nextEvening.getTime())
      });
    }

    // 3. Quran Wird
    if (config?.quran?.enabled && config.quran.time) {
      const nextQuran = getNextTriggerDate(config.quran.time);
      await (reg as any).showNotification('وردك القرآني اليومي 📖', {
        ...defaultOptions,
        body: '«وَرَتِّلِ الْقُرْآنَ تَرْتِيلًا» — افتح المصحف الشريف وأكمل وردك الهادئ الآن.',
        tag: 'maladh-quran-wird-scheduled',
        showTrigger: new TimestampTrigger(nextQuran.getTime())
      });
    }

    // 4. Daily Sunnah
    if (sunnahEnabled && todaySunnah) {
      const nextSunnah = getNextTriggerDate('09:00');
      const snippet = todaySunnah.snippet.length > 110 
        ? todaySunnah.snippet.slice(0, 107) + '...' 
        : todaySunnah.snippet;
      await (reg as any).showNotification(`سنة اليوم: ${todaySunnah.title} 🌿`, {
        ...defaultOptions,
        body: snippet,
        tag: 'maladh-daily-sunnah-scheduled',
        showTrigger: new TimestampTrigger(nextSunnah.getTime())
      });
    }
  } catch (triggerErr) {
    console.warn('TimestampTrigger scheduling fallback:', triggerErr);
  }
}

/**
 * Sync user schedule and background worker triggers with Service Worker
 */
export async function syncScheduleToServiceWorker() {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
  try {
    const reg = await navigator.serviceWorker.ready;
    const rawConfig = localStorage.getItem(STORAGE_NOTIF_CONFIG);
    const config: NotificationConfig | null = rawConfig ? JSON.parse(rawConfig) : null;
    const sunnahEnabled = localStorage.getItem(STORAGE_SUNNAH_NOTIF) === 'true';
    
    let todaySunnah: { title: string; snippet: string } | null = null;
    try {
      const { getDailySunnah } = await import('../data/seedData');
      const daily = getDailySunnah();
      if (daily) {
        todaySunnah = { title: daily.title, snippet: daily.hadithText };
      }
    } catch {}

    const payload = {
      config,
      sunnahEnabled,
      todaySunnah
    };

    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'MALADH_SYNC_SCHEDULE',
        payload
      });
    }

    // Register Periodic Sync if supported by mobile Chrome
    if ('periodicSync' in reg) {
      try {
        const status = await (navigator.permissions as any)?.query({ name: 'periodic-background-sync' });
        if (!status || status.state === 'granted') {
          await (reg as any).periodicSync.register('maladh-periodic-reminders', {
            minInterval: 15 * 60 * 1000
          });
        }
      } catch {}
    }

    // Register OS TimestampTriggers if supported
    await scheduleUpcomingTriggers(reg, config, sunnahEnabled, todaySunnah);
  } catch (err) {
    console.warn('Error syncing schedule to SW:', err);
  }
}

/**
 * Check and dispatch any due reminders based on local time
 */
export async function checkAndDispatchDueReminders() {
  if (!isNotificationGranted()) return;

  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const currentHours = String(now.getHours()).padStart(2, '0');
  const currentMinutes = String(now.getMinutes()).padStart(2, '0');
  const currentTime = `${currentHours}:${currentMinutes}`;

  // 0. Daily Sunnah Reminder (if enabled)
  const isSunnahEnabled = localStorage.getItem(STORAGE_SUNNAH_NOTIF) === 'true';
  if (isSunnahEnabled) {
    const sunnahSentKey = `maladh_sunnah_sent_${today}`;
    if (!localStorage.getItem(sunnahSentKey)) {
      try {
        const { getDailySunnah } = await import('../data/seedData');
        const todaySunnah = getDailySunnah();
        if (todaySunnah) {
          const sent = await sendDailySunnahNotification(todaySunnah.title, todaySunnah.hadithText);
          if (sent) {
            localStorage.setItem(sunnahSentKey, 'true');
          }
        }
      } catch (err) {
        console.warn('Error sending daily sunnah reminder:', err);
      }
    }
  }

  // 1-3. Adhkar & Wird Reminders
  const rawConfig = localStorage.getItem(STORAGE_NOTIF_CONFIG);
  if (!rawConfig) return;

  try {
    const config: NotificationConfig = JSON.parse(rawConfig);

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
  syncScheduleToServiceWorker();

  // Periodic check every 30 seconds
  if (!schedulerTimer) {
    schedulerTimer = setInterval(() => {
      checkAndDispatchDueReminders();
    }, 30000);
  }
}
