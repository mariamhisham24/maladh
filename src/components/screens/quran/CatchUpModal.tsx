import React, { useState } from 'react';
import { RotateCcw, Check, X } from 'lucide-react';

interface CatchUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPage: number;
  totalDays: number;
  currentDay: number;
  onApplyCatchUp: (newDays: number) => void;
}

export const CatchUpModal: React.FC<CatchUpModalProps> = ({
  isOpen,
  onClose,
  currentPage,
  totalDays,
  currentDay,
  onApplyCatchUp,
}) => {
  const [adjustedDays, setAdjustedDays] = useState<number>(totalDays);

  if (!isOpen) return null;

  const totalPages = 604;
  const remainingPages = Math.max(0, totalPages - currentPage);
  const remainingDays = Math.max(1, adjustedDays - currentDay);
  const newDailyTarget = Math.ceil(remainingPages / remainingDays);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div 
        className="bg-surface border border-border rounded-3xl max-w-md w-full p-6 shadow-2xl relative animate-scale-in text-right space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-subtle pb-3">
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-text-muted hover:text-text cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2">
            <h3 className="font-alexandria font-bold text-base text-text">
              الاستدراك المرن دون شعور بالذنب
            </h3>
            <div className="w-8 h-8 rounded-xl bg-primary-light text-primary flex items-center justify-center">
              <RotateCcw className="w-4 h-4" />
            </div>
          </div>
        </div>

        <div className="bg-primary-light/40 border border-primary/20 rounded-2xl p-4 text-xs text-text leading-relaxed">
          انشغالك أو انقطاعك أياماً عن الورد أمر طبيعي في الحياة. في مَلَاذْ لا يوجد تصفير للتقدم أو ضغط؛ نقوم فقط بإعادة قسمة ما تبقى عليك بالوتيرة التي تلائمك.
        </div>

        {/* Current Status Box */}
        <div className="bg-surface-elevated rounded-2xl p-4 border border-border space-y-2.5">
          <div className="flex justify-between items-center text-xs">
            <span className="font-mono text-primary font-bold">{currentPage} من {totalPages} صفحة</span>
            <span className="text-text-muted">موضعك الحالي المحفوظ</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="font-mono text-accent font-bold">{remainingPages} صفحة</span>
            <span className="text-text-muted">المتبقي لإتمام الختمة</span>
          </div>
        </div>

        {/* Target Rebalance Result */}
        <div className="p-4 rounded-2xl border-2 border-accent/40 bg-accent-light/30 flex items-center justify-between">
          <div className="text-left font-mono">
            <span className="text-xl font-bold text-accent block leading-none">{newDailyTarget}</span>
            <span className="text-[10px] text-text-muted mt-1 block">صفحات يومياً</span>
          </div>

          <div className="text-right">
            <strong className="text-xs font-bold text-text block leading-normal">
              المقترح الجديد المتوازن
            </strong>
            <span className="text-[11px] text-text-muted block mt-0.5 leading-normal">
              موزعة على {remainingDays} يوماً متبقية
            </span>
          </div>
        </div>

        {/* Quick extension slider/buttons */}
        <div className="space-y-1.5 pt-1">
          <span className="text-xs text-text-muted block">هل ترغب في زيادة مهلة الأيام للتخفيف؟</span>
          <div className="grid grid-cols-3 gap-2">
            {[totalDays, totalDays + 15, totalDays + 30].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setAdjustedDays(d)}
                className={`py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  adjustedDays === d
                    ? 'bg-primary text-white border-primary shadow-xs'
                    : 'bg-surface border-border text-text hover:border-primary/40'
                }`}
              >
                {d} يوماً
              </button>
            ))}
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={() => {
            onApplyCatchUp(adjustedDays);
            onClose();
          }}
          className="w-full py-3.5 rounded-2xl bg-primary text-white font-alexandria font-bold text-xs flex items-center justify-center gap-2 hover:bg-primary/95 transition-all shadow-sm cursor-pointer mt-2"
        >
          <Check className="w-4 h-4" />
          <span>اعتماد الجدول الجديد الميسر</span>
        </button>
      </div>
    </div>
  );
};
