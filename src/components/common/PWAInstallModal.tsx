import React, { useState } from 'react';
import { 
  Download, 
  X, 
  Share, 
  PlusSquare, 
  MoreVertical, 
  Copy, 
  Check, 
  Laptop, 
  Sparkles,
  AlertTriangle
} from 'lucide-react';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTriggerNativePrompt?: () => void;
  hasNativePrompt?: boolean;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({
  isOpen,
  onClose,
  onTriggerNativePrompt,
  hasNativePrompt = false,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const userAgent = typeof window !== 'undefined' ? window.navigator.userAgent.toLowerCase() : '';
  const isIOS = /iphone|ipad|ipod/.test(userAgent) || (typeof navigator !== 'undefined' && navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isSafari = isIOS && /safari/.test(userAgent) && !/crios|fxios|optios|edgios/i.test(userAgent);
  const isInAppBrowser = /fban|fbav|instagram|threads|line|micromessenger|wechat|snapchat|musical_ly|tiktok|telegram|twitter|byte-dance/i.test(userAgent);
  const isAndroid = /android/.test(userAgent);

  const handleCopyLink = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
      dir="rtl"
    >
      <div 
        className="bg-surface dark:bg-[#131920] border border-border w-full max-w-md rounded-3xl p-5 sm:p-6 shadow-2xl relative text-right space-y-4 max-h-[90vh] overflow-y-auto animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 w-8 h-8 rounded-full bg-surface-elevated border border-border flex items-center justify-center text-text-muted hover:text-text cursor-pointer transition-colors"
          title="إغلاق"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 pr-1">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary shrink-0 shadow-inner">
            <Download className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="font-alexandria font-bold text-base text-text flex items-center gap-1.5">
              <span>تثبيت «مَلَاذْ» على جهازك</span>
              <Sparkles className="w-4 h-4 text-accent" />
            </h3>
            <p className="text-xs text-text-muted font-sans mt-0.5">
              يعمل كتطبيق كامل بدون نت وخالٍ من الإعلانات
            </p>
          </div>
        </div>

        {/* Case 1: Native Prompt Available */}
        {hasNativePrompt && onTriggerNativePrompt && (
          <div className="p-3.5 rounded-2xl bg-primary/10 border border-primary/25 space-y-2">
            <p className="text-xs text-text font-medium leading-relaxed">
              متصفحك يدعم التثبيت الفوري بضغطة زر واحدة:
            </p>
            <button
              onClick={() => {
                onTriggerNativePrompt();
                onClose();
              }}
              className="w-full py-2.5 rounded-xl bg-primary text-white font-alexandria font-bold text-xs flex items-center justify-center gap-2 shadow-md hover:bg-primary/95 cursor-pointer transition-all active:scale-[0.99]"
            >
              <Download className="w-4 h-4" />
              <span>تثبيت التطبيق الآن</span>
            </button>
          </div>
        )}

        {/* Case 2: In-App Browser (Facebook, Instagram, WhatsApp, etc.) */}
        {isInAppBrowser ? (
          <div className="space-y-3">
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-amber-600 dark:text-amber-400">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>متصفح داخلي (فيسبوك / واتساب)</span>
              </div>
              <p className="leading-relaxed font-semibold text-text">
                يرجى الضغط على الثلاث نقاط (⋮) وفتح الموقع في متصفح خارجي (Chrome / Safari) لتتمكن من تثبيته.
              </p>
            </div>

            <div className="space-y-2 text-xs text-text">
              <strong className="block text-primary font-bold">الخطوات:</strong>
              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-surface-elevated border border-border">
                <span className="w-6 h-6 rounded-full bg-primary text-white font-mono text-xs font-bold flex items-center justify-center shrink-0">1</span>
                <span>اضغط على الثلاث نقاط <strong>(⋮)</strong> في أعلى أو أسفل الشاشة.</span>
              </div>
              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-surface-elevated border border-border">
                <span className="w-6 h-6 rounded-full bg-primary text-white font-mono text-xs font-bold flex items-center justify-center shrink-0">2</span>
                <span>اختر <strong>«فتح في المتصفح / Open in Chrome / Safari»</strong>.</span>
              </div>
            </div>

            <button
              onClick={handleCopyLink}
              className="w-full py-3 rounded-xl bg-primary/10 border border-primary/30 text-xs font-bold text-primary hover:bg-primary/15 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99]"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-primary" />}
              <span>{copied ? 'تم نسخ الرابط! افتحه الآن في متصفحك' : 'نسخ رابط الموقع لفتحه في المتصفح'}</span>
            </button>
          </div>
        ) : isIOS ? (
          /* Case 3: iOS (iPhone / iPad) */
          <div className="space-y-3.5">
            {!isSafari && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                تشترط Apple فتح الرابط في متصفح <strong>Safari</strong> لتثبيت التطبيق على الآيفون.
              </div>
            )}

            <div className="space-y-2.5 text-xs text-text">
              <strong className="block text-primary font-bold text-sm">خطوات التثبيت على الآيفون:</strong>
              
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-surface-elevated border border-border/80">
                <span className="w-7 h-7 rounded-full bg-primary text-white font-mono text-xs font-bold flex items-center justify-center shrink-0">1</span>
                <div className="flex-1 leading-relaxed">
                  <span>اضغط على زر المشاركة </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-primary/15 border border-primary/25 text-primary font-bold mx-1">
                    <Share className="w-3.5 h-3.5" /> ⎋
                  </span>
                  <span>أسفل شاشة Safari.</span>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-2xl bg-surface-elevated border border-border/80">
                <span className="w-7 h-7 rounded-full bg-primary text-white font-mono text-xs font-bold flex items-center justify-center shrink-0">2</span>
                <div className="flex-1 leading-relaxed">
                  <span>اختر من القائمة: </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-primary/15 border border-primary/25 text-primary font-bold mx-1">
                    <PlusSquare className="w-3.5 h-3.5" /> إضافة إلى الشاشة الرئيسية ➕
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-2xl bg-surface-elevated border border-border/80">
                <span className="w-7 h-7 rounded-full bg-primary text-white font-mono text-xs font-bold flex items-center justify-center shrink-0">3</span>
                <div className="flex-1 leading-relaxed">
                  <span>اضغط على <strong>«إضافة (Add)»</strong> في أعلى زاوية الشاشة.</span>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-text-muted text-center pt-1">
              ✨ سيظهر أيقونة «مَلَاذْ» فوراً على شاشتك الرئيسية ويعمل بدون إنترنت كأي تطبيق عادي.
            </p>
          </div>
        ) : isAndroid ? (
          /* Case 4: Android (Chrome / Samsung Internet) */
          <div className="space-y-3.5">
            <div className="space-y-2.5 text-xs text-text">
              <strong className="block text-primary font-bold text-sm">خطوات التثبيت من قائمة المتصفح:</strong>
              
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-surface-elevated border border-border">
                <span className="w-7 h-7 rounded-full bg-primary text-white font-mono text-xs font-bold flex items-center justify-center shrink-0">1</span>
                <div className="flex-1 leading-relaxed">
                  <span>اضغط على قائمة المتصفح </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-primary/15 border border-primary/25 text-primary font-bold mx-1">
                    <MoreVertical className="w-3.5 h-3.5 inline ml-0.5" /> الثلاث نقاط (⋮)
                  </span>
                  <span>في أعلى أو أسفل الشاشة.</span>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-2xl bg-surface-elevated border border-border">
                <span className="w-7 h-7 rounded-full bg-primary text-white font-mono text-xs font-bold flex items-center justify-center shrink-0">2</span>
                <div className="flex-1 leading-relaxed">
                  <span>اختر </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-primary/15 border border-primary/25 text-primary font-bold mx-1">
                    <Download className="w-3.5 h-3.5 inline ml-0.5" /> تثبيت التطبيق
                  </span>
                  <span>أو «إضافة إلى الشاشة الرئيسية».</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Case 5: Desktop (Chrome / Edge / Windows / Mac) */
          <div className="space-y-3 text-xs text-text">
            <strong className="block text-primary font-bold text-sm">خطوات التثبيت على الكمبيوتر:</strong>
            <div className="p-3.5 rounded-2xl bg-surface-elevated border border-border space-y-2.5">
              <div className="flex items-center gap-2">
                <Laptop className="w-4 h-4 text-primary shrink-0" />
                <span>ابحث عن أيقونة التثبيت <strong>(🖥️ أو ➕)</strong> في شريط عنوان المتصفح (URL) بأعلى الصفحة.</span>
              </div>
              <p className="text-[11px] text-text-muted leading-relaxed">
                أو اضغط على قائمة المتصفح <strong>(⋮)</strong> ➔ ثم اختر <strong>«تثبيت مَلَاذْ / Install Maladh»</strong>.
              </p>
            </div>
          </div>
        )}

        {/* Footer Features Summary */}
        <div className="border-t border-border/60 pt-3 flex items-center justify-between text-[11px] text-text-muted">
          <span>✓ يعمل بدون إنترنت</span>
          <span>✓ بدون إعلانات</span>
          <span>✓ حجم خفيف وسريع</span>
        </div>
      </div>
    </div>
  );
};
