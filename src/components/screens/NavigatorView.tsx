import React, { useState } from 'react';
import type { EmotionalMood } from '../../types';
import { SPIRITUAL_CONTENT } from '../../data/seedData';
import { ArrowRight, MoreHorizontal, Sparkles } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface NavigatorViewProps {
  onNavigateToTasbeeh?: (dhikrText: string, targetCount: number) => void;
  onBack: () => void;
  onOpenInStudio?: (text: string, source: string) => void;
}

export const NavigatorView: React.FC<NavigatorViewProps> = ({ 
  onNavigateToTasbeeh, 
  onBack,
  onOpenInStudio
}) => {
  const { effectiveTheme } = useTheme();
  const [selectedMood, setSelectedMood] = useState<EmotionalMood>('anxious');

  const moods: { key: EmotionalMood; label: string }[] = [
    { key: 'anxious', label: 'قلق وتوتر' },
    { key: 'sad', label: 'حزن وضيق' },
    { key: 'fear', label: 'خوف وتشتت' },
    { key: 'guilt', label: 'ذنب وتقصير' },
    { key: 'grateful', label: 'شكر ورضا' },
  ];

  const content = SPIRITUAL_CONTENT[selectedMood];

  return (
    <div className="space-y-4 pb-28 md:pb-8 animate-fade-in max-w-lg mx-auto">
      {/* Top Bar with circular buttons */}
      <div className="flex items-center justify-between pt-1">
        <button 
          onClick={onBack}
          className="w-9 h-9 rounded-full border border-border flex items-center justify-center text-text-muted hover:text-text cursor-pointer transition-colors"
          title="رجوع"
        >
          <ArrowRight className="w-4 h-4" />
        </button>

        <div className="font-alexandria font-bold text-lg text-text">
          مساحة لك
        </div>

        <div className="w-9 h-9 rounded-full border border-border flex items-center justify-center text-text-muted hover:text-text cursor-pointer transition-colors">
          <MoreHorizontal className="w-4 h-4" />
        </div>
      </div>

      {/* Greeting & Hint */}
      <div className="text-right pt-2 pb-1">
        <span className="text-xs text-text-muted font-medium">خذ وقتك</span>
        <h1 className="font-alexandria font-bold text-2xl md:text-3xl text-text mt-0.5 leading-tight">
          ماذا يثقل صدرك الآن؟
        </h1>
        <p className="text-xs text-text-muted mt-1 leading-relaxed">
          اختر ما يصف لحظتك. هذا ليس تشخيصًا، ويمكنك تغيير اختيارك متى شئت.
        </p>
      </div>

      {/* Mood Selector Chips (Pills) */}
      <div className="flex flex-wrap gap-2 pt-1 pb-2">
        {moods.map((m) => {
          const isSelected = selectedMood === m.key;
          return (
            <button
              key={m.key}
              onClick={() => setSelectedMood(m.key)}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                isSelected
                  ? 'border-2 border-primary bg-primary-light/50 text-primary shadow-xs'
                  : 'bg-surface border border-border text-text hover:border-primary/40'
              }`}
            >
              {m.label}
            </button>
          );
        })}
      </div>

      {/* Card 1: آية موثّقة */}
      <div className="bg-surface rounded-[24px] p-5 border border-border shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-primary bg-primary-light px-3 py-1 rounded-full">
            من القرآن الكريم
          </span>
          <h3 className="font-alexandria font-bold text-sm text-text">
            آية موثّقة
          </h3>
        </div>

        {/* Quote Placeholder box with golden top border */}
        <div 
          className="rounded-[14px] p-4 text-center my-3 border-t-2 border-accent"
          style={{
            background: effectiveTheme === 'dark'
              ? 'linear-gradient(115deg, #22251e, #171c20)'
              : 'linear-gradient(115deg, #f4eddd, #fbf8ef)'
          }}
        >
          <p className="font-quran text-xl md:text-2xl text-text leading-[2.1] py-1 select-text">
            «{content.ayah.text}»
          </p>
        </div>

        {/* Source info & Card Maker button */}
        <div className="flex justify-between items-center text-[11px] text-text-muted pt-1">
          <span>{content.ayah.surahName} · آية {content.ayah.ayahNumber}</span>
          {onOpenInStudio && (
            <button
              onClick={() => onOpenInStudio(content.ayah.text, `سورة ${content.ayah.surahName} · آية ${content.ayah.ayahNumber}`)}
              className="px-2.5 py-1 rounded-xl bg-accent text-white font-semibold text-xs hover:bg-accent/90 transition-all cursor-pointer flex items-center gap-1 shadow-xs"
              title="اصنع بطاقة لهذه الآية"
            >
              <Sparkles className="w-3 h-3" />
              <span>اصنع بطاقة</span>
            </button>
          )}
        </div>
      </div>

      {/* Card 2: تأمل لطيف (With start accent border) */}
      <div 
        className="bg-surface rounded-[24px] p-5 border border-border shadow-xs space-y-2"
        style={{ borderInlineStart: '4px solid var(--accent)' }}
      >
        <h3 className="font-alexandria font-bold text-sm text-text">
          تأمل لطيف
        </h3>
        <p className="text-xs text-text-muted leading-relaxed">
          {content.reflection}
        </p>
      </div>

      {/* Card 3: دعاء مأثور */}
      <div className="bg-surface rounded-[24px] p-5 border border-border shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-primary bg-primary-light px-3 py-1 rounded-full">
            مصدر وتخريج
          </span>
          <h3 className="font-alexandria font-bold text-sm text-text">
            دعاء مأثور
          </h3>
        </div>

        {/* Supplication quote box */}
        <div 
          className="rounded-[14px] p-4 text-center my-3 border-t-2 border-accent"
          style={{
            background: effectiveTheme === 'dark'
              ? 'linear-gradient(115deg, #22251e, #171c20)'
              : 'linear-gradient(115deg, #f4eddd, #fbf8ef)'
          }}
        >
          <p className="font-sans text-sm md:text-base text-text leading-relaxed py-1">
            «{content.supplication.text}»
          </p>
        </div>

        {/* Source link & Card Maker button */}
        <div className="flex justify-between items-center text-[11px] text-text-muted pt-1">
          <span className="text-primary font-semibold">{content.supplication.source}</span>
          {onOpenInStudio && (
            <button
              onClick={() => onOpenInStudio(content.supplication.text, `${content.supplication.source} (${content.supplication.grade})`)}
              className="px-2.5 py-1 rounded-xl bg-accent-light text-accent border border-accent/30 font-semibold text-xs hover:bg-accent hover:text-white transition-all cursor-pointer flex items-center gap-1"
              title="اصنع بطاقة لهذا الدعاء"
            >
              <Sparkles className="w-3 h-3" />
              <span>اصنع بطاقة</span>
            </button>
          )}
        </div>
      </div>

      {/* Primary Action Button */}
      <button
        onClick={() => {
          if (onNavigateToTasbeeh) {
            onNavigateToTasbeeh(content.suggestedDhikr.text, content.suggestedDhikr.targetCount);
          }
        }}
        className="w-full py-4 rounded-[16px] bg-primary text-white font-alexandria font-bold text-sm flex items-center justify-center gap-2 hover:bg-primary/95 transition-all shadow-sm cursor-pointer active:scale-[0.99]"
      >
        <span>انتقل إلى الذكر المقترح</span>
      </button>

      {/* Bottom Hint */}
      <div className="text-center text-xs text-text-muted pt-1">
        يمكنك العودة واختيار حالة أخرى في أي وقت.
      </div>
    </div>
  );
};
