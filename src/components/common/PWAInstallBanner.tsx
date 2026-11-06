import React from 'react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { Download, Smartphone, Share, PlusSquare, X, CheckCircle2 } from 'lucide-react';

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

export const InstallAppButton: React.FC<{ className?: string; compact?: boolean }> = ({ 
  className = '', 
  compact = false 
}) => {
  const { isInstalled, installApp } = usePWAInstall();

  if (isInstalled) return null;

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
    <button
      type="button"
      onClick={installApp}
      className={`w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-primary to-primary-hover text-white flex items-center justify-between shadow-md hover:shadow-lg transition-all cursor-pointer active:scale-[0.99] ${className}`}
    >
      <div className="flex items-center gap-2">
        <Download className="w-4 h-4 text-white" />
        <span className="text-xs font-bold font-alexandria">تثبيت الآن</span>
      </div>

      <div className="text-right">
        <span className="text-xs font-alexandria font-bold block">
          ثبّت «مَلَاذْ» على هاتفك أو حاسوبك
        </span>
        <span className="text-[10px] text-white/80 block mt-0.5">
          بضغطة زر واحدة • يعمل بدون إنترنت وسريع جداً
        </span>
      </div>
    </button>
  );
};
