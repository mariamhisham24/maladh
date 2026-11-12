import React, { useState } from 'react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { Download, X, Sparkles } from 'lucide-react';

const STORAGE_HOME_DISMISSED = 'maladh_home_pwa_dismissed';

// Global banner wrapper (no instructions modal)
export const PWAInstallBanner: React.FC = () => {
  return null;
};

export interface InstallAppBannerProps {
  className?: string;
  compact?: boolean;
  dismissible?: boolean;
}

export const InstallAppButton: React.FC<InstallAppBannerProps> = ({ 
  className = '', 
  compact = false,
  dismissible = false
}) => {
  const { isInstalled, installApp } = usePWAInstall();
  const [isDismissed, setIsDismissed] = useState<boolean>(() => {
    if (!dismissible) return false;
    return localStorage.getItem(STORAGE_HOME_DISMISSED) === 'true';
  });

  if (isInstalled) return null;
  if (dismissible && isDismissed) return null;

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDismissed(true);
    localStorage.setItem(STORAGE_HOME_DISMISSED, 'true');
  };

  if (compact) {
    return (
      <button
        type="button"
        onClick={installApp}
        title="تثبيت مَلَاذْ"
        aria-label="تثبيت التطبيق"
        className={`px-2.5 py-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 flex items-center gap-1.5 text-xs font-semibold cursor-pointer transition-all active:scale-95 ${className}`}
      >
        <Download className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">تثبيت التطبيق</span>
      </button>
    );
  }

  return (
    <div 
      className={`relative rounded-3xl p-4 md:p-5 text-right transition-all duration-300 overflow-hidden shadow-lg border border-accent/40 ${className}`}
      style={{
        background: 'linear-gradient(135deg, #13332D 0%, #0E2420 100%)',
      }}
    >
      {/* Decorative Islamic Pattern Glow */}
      <div 
        className="absolute -left-10 -top-10 w-36 h-36 rounded-full bg-accent/15 blur-2xl pointer-events-none" 
      />

      {/* Dismiss Button (for Home Screen) */}
      {dismissible && (
        <button
          type="button"
          onClick={handleDismiss}
          title="إغلاق التنبيه"
          className="absolute top-3 left-3 w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white flex items-center justify-center transition-all cursor-pointer z-10"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Main Content Layout */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-0">
        {/* Right Info in RTL */}
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-accent/20 border border-accent/50 flex items-center justify-center text-accent shrink-0 shadow-inner">
            <Download className="w-5 h-5 text-accent" />
          </div>

          <div className="text-right">
            <h4 className="font-alexandria font-bold text-sm text-white flex items-center gap-1.5 leading-snug">
              <span>ثبّت «مَلَاذْ» على هاتفك أو حاسوبك</span>
              <Sparkles className="w-3.5 h-3.5 text-accent shrink-0" />
            </h4>
            <p className="text-xs text-[#DFD7C7] mt-1 leading-normal font-sans">
              بضغطة زر واحدة • يعمل بدون إنترنت وسريع جداً
            </p>
          </div>
        </div>

        {/* CTA Button: 1-click install */}
        <button
          type="button"
          onClick={installApp}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-accent text-[#0A0D14] hover:bg-accent/90 font-alexandria font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md active:scale-95 shrink-0"
        >
          <Download className="w-4 h-4 text-[#0A0D14]" />
          <span>تثبيت الآن</span>
        </button>
      </div>
    </div>
  );
};
