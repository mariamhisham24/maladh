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

  // Check early captured prompt from index.html
  if ((window as any).__pwa_prompt) {
    globalDeferredPrompt = (window as any).__pwa_prompt;
  }

  window.addEventListener('pwa-prompt-ready', () => {
    if ((window as any).__pwa_prompt) {
      globalDeferredPrompt = (window as any).__pwa_prompt;
      notifyAll();
    }
  });

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    (window as any).__pwa_prompt = e;
    globalDeferredPrompt = e as BeforeInstallPromptEvent;
    notifyAll();
  });

  window.addEventListener('pwa-installed', () => {
    globalIsInstalled = true;
    globalDeferredPrompt = null;
    globalShowModal = false;
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

      // Check if prompt was captured while component was unmounted
      if (!globalDeferredPrompt && (window as any).__pwa_prompt) {
        globalDeferredPrompt = (window as any).__pwa_prompt;
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
    const promptEvent = globalDeferredPrompt || (typeof window !== 'undefined' ? (window as any).__pwa_prompt : null);

    if (promptEvent) {
      try {
        await promptEvent.prompt();
        const choice = await promptEvent.userChoice;
        if (choice && choice.outcome === 'accepted') {
          globalIsInstalled = true;
          globalShowModal = false;
        }
        globalDeferredPrompt = null;
        if (typeof window !== 'undefined') {
          (window as any).__pwa_prompt = null;
        }
        notifyAll();
        return;
      } catch (err) {
        console.warn('Install prompt error:', err);
      }
    }

    // If native prompt is not available or dismissed, open guidance modal
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
    hasNativePrompt: !!(globalDeferredPrompt || (typeof window !== 'undefined' && (window as any).__pwa_prompt)),
  };
}
