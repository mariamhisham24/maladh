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
    notifyAll();
  });

  window.addEventListener('appinstalled', () => {
    globalIsInstalled = true;
    globalDeferredPrompt = null;
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

  const installApp = async () => {
    let promptEvent = globalDeferredPrompt || (typeof window !== 'undefined' ? (window as any).__pwa_prompt : null);

    if (!promptEvent && typeof window !== 'undefined') {
      // Check if prompt is firing right now
      promptEvent = await new Promise<BeforeInstallPromptEvent | null>((resolve) => {
        let resolved = false;
        const handler = () => {
          if (!resolved) {
            resolved = true;
            resolve((window as any).__pwa_prompt || globalDeferredPrompt);
          }
        };
        window.addEventListener('pwa-prompt-ready', handler, { once: true });
        window.addEventListener('beforeinstallprompt', handler, { once: true });
        setTimeout(() => {
          if (!resolved) {
            resolved = true;
            resolve((window as any).__pwa_prompt || globalDeferredPrompt);
          }
        }, 800);
      });
    }

    // Trigger native prompt directly with 1 click
    if (promptEvent) {
      try {
        await promptEvent.prompt();
        const choice = await promptEvent.userChoice;
        if (choice && choice.outcome === 'accepted') {
          globalIsInstalled = true;
        }
        globalDeferredPrompt = null;
        if (typeof window !== 'undefined') {
          (window as any).__pwa_prompt = null;
        }
        notifyAll();
      } catch (err) {
        console.warn('Install prompt error:', err);
      }
    }
  };

  return {
    isInstallable: !globalIsInstalled,
    isInstalled: globalIsInstalled,
    installApp,
    hasNativePrompt: !!(globalDeferredPrompt || (typeof window !== 'undefined' && (window as any).__pwa_prompt)),
  };
}
