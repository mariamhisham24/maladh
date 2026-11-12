import { useState, useEffect } from 'react';

// Interface for BeforeInstallPromptEvent
export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

// Module-level singleton state so all components stay 100% in sync
let globalDeferredPrompt: BeforeInstallPromptEvent | null = null;
let globalIsInstalled = false;
let globalShowModal = false;
const subscribers = new Set<() => void>();

function notifyAll() {
  subscribers.forEach((fn) => {
    try {
      fn();
    } catch (e) {
      console.warn('PWA subscriber error:', e);
    }
  });
}

// Listen at the window level immediately on module import
if (typeof window !== 'undefined') {
  const checkStandalone = () => {
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
      document.referrer.includes('android-app://')
    );
  };

  globalIsInstalled = checkStandalone();

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    globalDeferredPrompt = e as BeforeInstallPromptEvent;
    notifyAll();
  });

  window.addEventListener('appinstalled', () => {
    globalIsInstalled = true;
    globalDeferredPrompt = null;
    globalShowModal = false;
    notifyAll();
  });
}

export function usePWAInstall() {
  const [, setTick] = useState(0);

  useEffect(() => {
    const onUpdate = () => setTick((v) => v + 1);
    subscribers.add(onUpdate);

    // Recheck standalone mode on mount
    if (typeof window !== 'undefined') {
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
        document.referrer.includes('android-app://');

      if (isStandalone !== globalIsInstalled) {
        globalIsInstalled = isStandalone;
        onUpdate();
      }
    }

    return () => {
      subscribers.delete(onUpdate);
    };
  }, []);

  const userAgent = typeof window !== 'undefined' ? window.navigator.userAgent.toLowerCase() : '';
  const isIOS = /iphone|ipad|ipod/.test(userAgent);
  const isAndroid = /android/.test(userAgent);

  const installApp = async () => {
    if (globalDeferredPrompt) {
      try {
        await globalDeferredPrompt.prompt();
        const choice = await globalDeferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          globalIsInstalled = true;
          globalShowModal = false;
        }
        globalDeferredPrompt = null;
        notifyAll();
        return;
      } catch (err) {
        console.warn('Install prompt error:', err);
      }
    }

    // If native prompt is not directly available or dismissed, open guidance modal
    globalShowModal = true;
    notifyAll();
  };

  const setShowInstallModal = (show: boolean) => {
    globalShowModal = show;
    notifyAll();
  };

  return {
    isInstallable: !globalIsInstalled,
    isInstalled: globalIsInstalled,
    isIOS,
    isAndroid,
    showIOSModal: globalShowModal,
    setShowIOSModal: setShowInstallModal,
    showInstallModal: globalShowModal,
    setShowInstallModal,
    installApp,
    hasNativePrompt: !!globalDeferredPrompt,
  };
}
