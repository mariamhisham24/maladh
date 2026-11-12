// Service Worker Background Extension for Maladh (مَـلَاذْ)
// Handles Background Notifications, Periodic Sync, and Notification Click Navigation

const SCHEDULE_CACHE_NAME = 'maladh-schedule-cache-v1';
const SCHEDULE_URL = '/maladh-schedule.json';

// 1. Notification Click: Bring Maladh to focus or open it
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetTag = event.notification.tag;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focus existing tab if open
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          if (targetTag && client.postMessage) {
            client.postMessage({ type: 'NOTIFICATION_CLICKED', tag: targetTag });
          }
          return client.focus();
        }
      }
      // Otherwise open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow('/');
      }
    })
  );
});

// 2. Helper: Read saved schedule from CacheStorage (accessible by Service Worker)
async function getStoredSchedule() {
  try {
    const cache = await caches.open(SCHEDULE_CACHE_NAME);
    const response = await cache.match(SCHEDULE_URL);
    if (response) {
      return await response.json();
    }
  } catch (err) {
    console.warn('[SW] Error reading schedule from cache:', err);
  }
  return null;
}

// 3. Helper: Save schedule to CacheStorage
async function saveScheduleToCache(payload) {
  try {
    const cache = await caches.open(SCHEDULE_CACHE_NAME);
    const response = new Response(JSON.stringify(payload), {
      headers: { 'Content-Type': 'application/json' }
    });
    await cache.put(SCHEDULE_URL, response);
  } catch (err) {
    console.warn('[SW] Error saving schedule to cache:', err);
  }
}

// 4. Background Reminder Evaluation (Runs in SW context)
async function evaluateAndDispatchReminders() {
  const schedule = await getStoredSchedule();
  if (!schedule) return;

  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const currentHours = String(now.getHours()).padStart(2, '0');
  const currentMinutes = String(now.getMinutes()).padStart(2, '0');
  const currentTime = `${currentHours}:${currentMinutes}`;

  const defaultOptions = {
    icon: '/pwa-192x192.png',
    badge: '/badge-monochrome.png',
    dir: 'rtl',
    lang: 'ar',
    vibrate: [200, 100, 200]
  };

  const sentCache = await caches.open('maladh-sent-reminders-v1');

  // Helper to check if sent today
  const isAlreadySent = async (key) => {
    const res = await sentCache.match(`/${key}`);
    return !!res;
  };

  // Helper to mark as sent
  const markAsSent = async (key) => {
    await sentCache.put(`/${key}`, new Response('true'));
  };

  // 1. Morning Adhkar
  if (schedule.config?.morning?.enabled && schedule.config.morning.time) {
    const key = `morning_${today}`;
    if (!(await isAlreadySent(key)) && currentTime >= schedule.config.morning.time && now.getHours() < 12) {
      await self.registration.showNotification('حان وقت أذكار الصباح ☀️', {
        ...defaultOptions,
        body: '«أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ» — ابدأ يومك المبارك بورد الصباح والسكينة.',
        tag: 'maladh-morning-adhkar'
      });
      await markAsSent(key);
    }
  }

  // 2. Evening Adhkar
  if (schedule.config?.evening?.enabled && schedule.config.evening.time) {
    const key = `evening_${today}`;
    if (!(await isAlreadySent(key)) && currentTime >= schedule.config.evening.time && now.getHours() < 22) {
      await self.registration.showNotification('حان وقت أذكار المساء 🌙', {
        ...defaultOptions,
        body: 'حصّن نفسك وأهلك بورد المساء وانعم بالطمأنينة وحفظ الله.',
        tag: 'maladh-evening-adhkar'
      });
      await markAsSent(key);
    }
  }

  // 3. Quran Wird
  if (schedule.config?.quran?.enabled && schedule.config.quran.time) {
    const key = `quran_${today}`;
    if (!(await isAlreadySent(key)) && currentTime >= schedule.config.quran.time) {
      await self.registration.showNotification('وردك القرآني اليومي 📖', {
        ...defaultOptions,
        body: '«وَرَتِّلِ الْقُرْآنَ تَرْتِيلًا» — افتح المصحف الشريف وأكمل وردك الهادئ الآن.',
        tag: 'maladh-quran-wird'
      });
      await markAsSent(key);
    }
  }

  // 4. Daily Sunnah
  if (schedule.sunnahEnabled && schedule.todaySunnah) {
    const key = `sunnah_${today}`;
    if (!(await isAlreadySent(key)) && (currentTime >= '09:00' || schedule.forceSendSunnah)) {
      const snippet = schedule.todaySunnah.snippet.length > 110 
        ? schedule.todaySunnah.snippet.slice(0, 107) + '...' 
        : schedule.todaySunnah.snippet;
      await self.registration.showNotification(`سنة اليوم: ${schedule.todaySunnah.title} 🌿`, {
        ...defaultOptions,
        body: snippet,
        tag: 'maladh-daily-sunnah'
      });
      await markAsSent(key);
    }
  }
}

// 5. Client Messages Listener
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'MALADH_SYNC_SCHEDULE') {
    event.waitUntil(
      saveScheduleToCache(event.data.payload).then(() => {
        return evaluateAndDispatchReminders();
      })
    );
  }
});

// 6. Periodic Background Sync Event Listener
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'maladh-periodic-reminders') {
    event.waitUntil(evaluateAndDispatchReminders());
  }
});

// 7. Background Sync Event Listener
self.addEventListener('sync', (event) => {
  if (event.tag === 'maladh-check-reminders') {
    event.waitUntil(evaluateAndDispatchReminders());
  }
});

// 8. Recurring check while SW is alive (e.g. during audio playback or active period)
setInterval(() => {
  evaluateAndDispatchReminders().catch(() => {});
}, 60000);
