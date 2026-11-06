import React, { useState } from 'react';
import { Calendar, Check, X, Sparkles } from 'lucide-react';

interface KhatmaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSavePlan: (days: number) => void;
  currentDays: number;
}

export const KhatmaModal: React.FC<KhatmaModalProps> = ({
  isOpen,
  onClose,
  onSavePlan,
  currentDays,
}) => {
  const [selectedDuration, setSelectedDuration] = useState<number>(currentDays || 30);

  if (!isOpen) return null;

  const options = [
    { days: 7, label: 'أسبوع (٧ أيام)', daily: Math.ceil(604 / 7), desc: 'ختمة مكثفة' },
    { days: 14, label: 'أسبوعان (١٤ يوماً)', daily: Math.ceil(604 / 14), desc: 'ختمة معتدلة' },
    { days: 30, label: 'شهر (٣٠ يوماً)', daily: Math.ceil(604 / 30), desc: 'جزء يومياً (الوتيرة الهادئة)' },
    { days: 60, label: 'شهران (٦٠ يوماً)', daily: Math.ceil(604 / 60), desc: 'نصف جزء يومياً على مهل' },
  ];

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
              تحديد مدة الختمة
            </h3>
            <div className="w-8 h-8 rounded-xl bg-accent-light text-accent flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
        </div>

        <p className="text-xs text-text-muted leading-relaxed">
          اختر الوتيرة التي تريحك وتناسب ظروفك اليومية. خطتك مرنة دائماً ويمكن تعديلها في أي وقت دون ضغط.
        </p>

        {/* Options List */}
        <div className="space-y-2.5 pt-1">
          {options.map((opt) => {
            const isSelected = selectedDuration === opt.days;
            return (
              <div
                key={opt.days}
                onClick={() => setSelectedDuration(opt.days)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group ${
                  isSelected
                    ? 'bg-primary-light/60 border-primary text-primary font-bold shadow-xs'
                    : 'bg-surface-elevated border-border text-text hover:border-primary/40'
                }`}
              >
                <div className="flex items-center gap-2 font-mono text-xs text-primary font-semibold">
                  <span className="px-2 py-0.5 rounded-lg bg-surface border border-border">
                    {opt.daily} صفحات/يوم
                  </span>
                </div>

                <div className="text-right">
                  <strong className="font-alexandria text-xs block leading-normal">
                    {opt.label}
                  </strong>
                  <span className="text-[11px] text-text-muted block mt-0.5 leading-normal">
                    {opt.desc}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Button */}
        <button
          onClick={() => {
            onSavePlan(selectedDuration);
            onClose();
          }}
          className="w-full py-3.5 rounded-2xl bg-primary text-white font-alexandria font-bold text-xs flex items-center justify-center gap-2 hover:bg-primary/95 transition-all shadow-sm cursor-pointer mt-2"
        >
          <Check className="w-4 h-4" />
          <span>اعتماد خطة {selectedDuration} يوماً</span>
        </button>

        {/* Guilt-free note */}
        <div className="flex items-center gap-1.5 justify-center text-[11px] text-text-muted pt-1">
          <Sparkles className="w-3.5 h-3.5 text-accent" />
          <span>لا لوم عند الانقطاع أو التأخر، التقدم يوزع دائماً بالمعروف</span>
        </div>
      </div>
    </div>
  );
};
