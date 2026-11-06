import React, { useState } from 'react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { Download, Smartphone, Share, PlusSquare, X, CheckCircle2, Sparkles } from 'lucide-react';

const STORAGE_HOME_DISMISSED = 'maladh_home_pwa_dismissed';

export const PWAInstallBanner: React.FC = () => {
  const {
    isInstalled,
    isIOS,
    showIOSModal,
    setShowIOSModal
  } = usePWAInstall();

  if (isInstalled) return null;

  return (
    <>
      {/* iOS & Manual Install Modal Guide */}
      {showIOSModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in text-right"
          onClick={() => setShowIOSModal(false)}
        >
          <div 
            className="bg-surface border border-border rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border pb-3">
              <button
                onClick={() => setShowIOSModal(false)}
                className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-text-muted hover:text-text cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="text-right">
                <h3 className="font-alexandria font-bold text-sm text-text flex items-center gap-1.5 justify-end">
                  <span>تثبيت «مَلَاذْ» على هاتفك</span>
                  <Smartphone className="w-4 h-4 text-primary" />
                </h3>
                <p className="text-[11px] text-text-muted mt-0.5">
                  يعمل كتطبيق أصلي خفيف وبدون إنترنت
                </p>
              </div>
            </div>

            {/* Steps */}
            <div className="space-y-3 py-1">
              {isIOS ? (
                <>
                  <div className="flex items-start gap-3 p-3 rounded-2xl bg-surface-elevated border border-border text-xs">
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0">1</span>
                    <div className="leading-relaxed">
                      اضغط على زر <strong>المشاركة (Share)</strong>{' '}
                      <Share className="w-3.5 h-3.5 inline text-accent mx-0.5" /> في شريط المتصفح أسفل سفاري.
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-2xl bg-surface-elevated border border-border text-xs">
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0">2</span>
                    <div className="leading-relaxed">
                      مرر للأسفل واضغط على{' '}
                      <strong>«إضافة إلى الشاشة الرئيسية»</strong>{' '}
                      <PlusSquare className="w-3.5 h-3.5 inline text-primary mx-0.5" />.
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-2xl bg-surface-elevated border border-border text-xs">
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0">3</span>
                    <div className="leading-relaxed">
                      اضغط <strong>«إضافة (Add)»</strong> في الزاوية العلوية، وستظهر أيقونة مَلَاذْ على هاتفك فوراً!
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-start gap-3 p-3 rounded-2xl bg-surface-elevated border border-border text-xs">
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0">1</span>
                    <div className="leading-relaxed">
                      من قائمة المتصفح (⋮) أو علامة التثبيت في شريط العنوان، اختر <strong>«تثبيت مَلَاذْ»</strong> أو <strong>«Install App»</strong>.
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-2xl bg-surface-elevated border border-border text-xs">
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0">2</span>
                    <div className="leading-relaxed">
                      وافق على التثبيت وسيعمل التطبيق في نافذة مستقلة وسريعة على سطح المكتب أو الشاشة الرئيسية.
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Confirm button */}
            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full py-2.5 rounded-xl bg-primary text-white font-alexandria font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-primary/95 transition-all cursor-pointer shadow-sm"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>فهمت، شكراً</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
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
        title="تثبيت مَلَاذْ كتطبيق أصلي"
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

        {/* CTA Button */}
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
