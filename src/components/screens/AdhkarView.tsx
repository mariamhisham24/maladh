import React, { useState, useEffect } from 'react';
import type { AdhkarCategory } from '../../types';
import { SEED_ADHKAR } from '../../data/seedData';
import { ArrowRight, RotateCcw, Sparkles } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface AdhkarViewProps {
  initialCategory?: AdhkarCategory;
  onBack?: () => void;
  onOpenInStudio?: (text: string, source: string) => void;
}

const getCategoryByTime = (): AdhkarCategory => {
  const currentHour = new Date().getHours();
  if (currentHour >= 4 && currentHour < 15) {
    return 'morning';
  } else if (currentHour >= 15 && currentHour < 21) {
    return 'evening';
  } else {
    return 'sleep';
  }
};

export const AdhkarView: React.FC<AdhkarViewProps> = ({ initialCategory, onBack, onOpenInStudio }) => {
  const { effectiveTheme } = useTheme();
  const [activeCategory, setActiveCategory] = useState<AdhkarCategory>(
    initialCategory || getCategoryByTime()
  );
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  
  // Track how many times user pressed count for each item
  const [pressedCounts, setPressedCounts] = useState<Record<string, number>>({});

  // Helper to determine the best resume index for a category:
  // 1) First check if there is an explicit saved position for today
  // 2) If that position is already completed, advance to the first uncompleted dhikr
  // 3) If no saved position, find the first uncompleted dhikr
  // 4) If all are completed, start at 0
  const getResumeIndex = (category: AdhkarCategory, counts: Record<string, number>): number => {
    const items = SEED_ADHKAR.filter((item) => item.category === category);
    if (!items.length) return 0;

    const today = new Date().toISOString().split('T')[0];
    const posKey = `maladh_adhkar_pos_${category}_${today}`;
    const savedPos = localStorage.getItem(posKey);

    let targetIdx = 0;
    if (savedPos !== null) {
      const parsed = parseInt(savedPos, 10);
      if (!isNaN(parsed) && parsed >= 0 && parsed < items.length) {
        targetIdx = parsed;
      }
    }

    // Check if the item at targetIdx is already completed
    const targetItem = items[targetIdx];
    const isTargetDone = targetItem && (counts[targetItem.id] || 0) >= targetItem.count;

    if (isTargetDone) {
      // Find the first uncompleted dhikr in this category
      const firstUncompleted = items.findIndex((item) => (counts[item.id] || 0) < item.count);
      if (firstUncompleted !== -1) {
        return firstUncompleted;
      }
    } else if (savedPos !== null) {
      return targetIdx;
    } else {
      // If no saved position, start at the first uncompleted item if any
      const firstUncompleted = items.findIndex((item) => (counts[item.id] || 0) < item.count);
      if (firstUncompleted > 0) {
        return firstUncompleted;
      }
    }

    return targetIdx;
  };

  const updateCurrentIndex = (newIdx: number | ((prev: number) => number)) => {
    setCurrentIndex((prev) => {
      const nextIdx = typeof newIdx === 'function' ? newIdx(prev) : newIdx;
      const today = new Date().toISOString().split('T')[0];
      const posKey = `maladh_adhkar_pos_${activeCategory}_${today}`;
      localStorage.setItem(posKey, String(nextIdx));
      return nextIdx;
    });
  };

  // Synchronize when initialCategory changes from outside
  useEffect(() => {
    if (initialCategory && initialCategory !== activeCategory) {
      setActiveCategory(initialCategory);
    }
  }, [initialCategory]);

  // Load saved counts & resume position from localStorage on mount and category switch
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const key = `maladh_adhkar_${activeCategory}_${today}`;
    const saved = localStorage.getItem(key);
    let counts: Record<string, number> = {};
    if (saved) {
      try {
        counts = JSON.parse(saved);
        setPressedCounts(counts);
      } catch {
        setPressedCounts({});
      }
    } else {
      setPressedCounts({});
    }

    // Restore user's last reading position for this category
    const resumeIdx = getResumeIndex(activeCategory, counts);
    setCurrentIndex(resumeIdx);
  }, [activeCategory]);

  const categoryItems = SEED_ADHKAR.filter((item) => item.category === activeCategory);
  const currentItem = categoryItems[currentIndex] || categoryItems[0];

  const categories: { key: AdhkarCategory; label: string }[] = [
    { key: 'morning', label: 'الصباح' },
    { key: 'evening', label: 'المساء' },
    { key: 'sleep', label: 'النوم' },
    { key: 'wakeup', label: 'الاستيقاظ' },
    { key: 'post_prayer', label: 'بعد الصلاة' },
  ];

  const requiredCount = currentItem?.count || 1;
  const currentDone = pressedCounts[currentItem?.id] || 0;
  const isItemCompleted = currentDone >= requiredCount;

  const handleCount = () => {
    if (currentDone < requiredCount) {
      const nextDone = currentDone + 1;
      const nextCounts = {
        ...pressedCounts,
        [currentItem.id]: nextDone
      };
      setPressedCounts(nextCounts);

      // Save real progress to localStorage for today
      const today = new Date().toISOString().split('T')[0];
      const key = `maladh_adhkar_${activeCategory}_${today}`;
      localStorage.setItem(key, JSON.stringify(nextCounts));

      // Vibration feedback if supported and enabled
      if ('vibrate' in navigator && localStorage.getItem('maladh_vibration') !== 'false') {
        try {
          navigator.vibrate(45);
        } catch {
          // ignore
        }
      }

      // Auto advance to next if finished and not last
      if (nextDone >= requiredCount && currentIndex < categoryItems.length - 1) {
        setTimeout(() => {
          updateCurrentIndex((idx) => idx + 1);
        }, 400);
      }
    }
  };

  const handleResetCurrent = () => {
    const nextCounts = {
      ...pressedCounts,
      [currentItem.id]: 0
    };
    setPressedCounts(nextCounts);
    const today = new Date().toISOString().split('T')[0];
    const key = `maladh_adhkar_${activeCategory}_${today}`;
    localStorage.setItem(key, JSON.stringify(nextCounts));
  };

  // Category Title
  const categoryTitle = categories.find((c) => c.key === activeCategory)?.label || 'المساء';

  // Calculate overall category progress
  const completedCount = categoryItems.filter(
    (item) => (pressedCounts[item.id] || 0) >= item.count
  ).length;
  const progressPercent = Math.round((completedCount / (categoryItems.length || 1)) * 100);

  return (
    <div className="space-y-4 pb-28 md:pb-8 animate-fade-in max-w-lg mx-auto">
      {/* Top Bar */}
      <div className="flex items-center justify-between pt-1">
        {onBack ? (
          <button 
            onClick={onBack}
            className="w-9 h-9 rounded-full border border-border flex items-center justify-center text-text-muted hover:text-text cursor-pointer transition-colors"
            title="رجوع للرئيسية"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <div className="w-9 h-9" />
        )}

        <div className="font-alexandria font-bold text-lg text-text">
          الأذكار
        </div>

        {/* Empty placeholder to keep title centered */}
        <div className="w-9 h-9" />
      </div>

      {/* Greeting & Hint */}
      <div className="text-right pt-2 pb-1">
        <h1 className="font-alexandria font-bold text-2xl md:text-3xl text-text leading-tight">
          أذكار {categoryTitle}
        </h1>
        <p className="text-xs text-text-muted mt-1 leading-normal">
          وردك محفوظ محليًا على هذا الجهاز.
        </p>
      </div>

      {/* Horizontal Category Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none">
        {categories.map((c) => {
          const isSelected = activeCategory === c.key;
          return (
            <button
              key={c.key}
              onClick={() => {
                setActiveCategory(c.key);
              }}
              className={`px-4 py-2 rounded-[14px] text-xs transition-all shrink-0 cursor-pointer ${
                isSelected
                  ? 'border-2 border-primary bg-primary-light/50 text-primary font-bold shadow-xs'
                  : 'bg-surface border border-border text-text font-medium hover:border-primary/40'
              }`}
            >
              {c.label}
            </button>
          );
        })}
      </div>

      {/* Main Dhikr Card */}
      {currentItem && (
        <div className="bg-surface rounded-[26px] p-6 border border-border shadow-xs space-y-4">
          {/* Card Header */}
          <div className="flex items-center justify-between pb-1">
            <span className="text-[11px] font-semibold text-primary bg-primary-light px-3 py-1 rounded-full">
              موثّق
            </span>
            <span className="text-xs text-text-muted">
              الذكر {currentIndex + 1} من {categoryItems.length}
            </span>
          </div>

          {/* Central Dhikr Text with Subtle Radial Halo */}
          <div 
            className="rounded-[20px] p-6 text-center select-text my-2"
            style={{
              background: effectiveTheme === 'dark' 
                ? 'radial-gradient(ellipse at center, rgba(37, 48, 42, 0.8) 0%, transparent 75%)' 
                : 'radial-gradient(ellipse at center, rgba(255, 248, 231, 0.9) 0%, transparent 75%)'
            }}
          >
            <p className="font-quran text-2xl md:text-[26px] text-text text-center leading-[2.2] py-2 whitespace-pre-line">
              {currentItem.text}
            </p>
          </div>

          {/* Source Line & Verified Reward */}
          <div className="border-t border-border pt-3 mt-3 space-y-2 text-right">
            <div className="flex justify-between items-center text-[11px] text-text-muted leading-normal">
              <span className="font-semibold text-text/90">{currentItem.source}</span>
              <span className="text-[10px] bg-primary-light/60 text-primary px-2 py-0.5 rounded-full font-medium">حديث صحيح وموثق</span>
            </div>
            {currentItem.reward && (
              <div className="bg-accent-light/40 dark:bg-accent-light/15 border border-accent/20 rounded-xl p-2.5 text-xs text-accent leading-relaxed">
                ✨ <span className="font-bold">الفضل والبركة:</span> {currentItem.reward}
              </div>
            )}
          </div>

          {/* Counter Line: Circular Badge + Repetitions text */}
          <div className="flex items-center justify-center gap-5 py-2">
            <div 
              onClick={handleCount}
              className="w-[74px] h-[74px] rounded-full border-2 border-accent flex items-center justify-center font-alexandria font-bold text-2xl text-text cursor-pointer select-none transition-transform active:scale-95 shadow-sm"
              style={{
                background: effectiveTheme === 'dark'
                  ? 'linear-gradient(145deg, #25291f, #171c20)'
                  : 'linear-gradient(145deg, #ffffff, #f2eddf)',
                boxShadow: effectiveTheme === 'dark'
                  ? 'inset 0 0 0 5px rgba(255, 255, 255, 0.04)'
                  : 'inset 0 0 0 5px rgba(255, 255, 255, 0.6)'
              }}
            >
              {currentDone}
            </div>

            <div className="text-right">
              <div className="font-alexandria font-bold text-sm text-text leading-normal">
                مرات التكرار
              </div>
              <div className="text-xs text-text-muted mt-0.5 leading-normal">
                العدد المطلوب: {requiredCount}
              </div>
            </div>
          </div>

          {/* Full Action Button */}
          <button
            onClick={handleCount}
            disabled={isItemCompleted}
            className={`w-full py-4 rounded-[16px] font-alexandria font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm active:scale-[0.99] ${
              isItemCompleted
                ? 'bg-primary-light text-primary border border-primary/20 cursor-default'
                : 'bg-primary text-white hover:bg-primary/95'
            }`}
          >
            {isItemCompleted ? (
              <span>اكتمل هذا الذكر بحمد الله</span>
            ) : (
              <span>تسبيح — {currentDone} / {requiredCount}</span>
            )}
          </button>

          {/* Prev / Next Navigation Row & Card Action */}
          <div className="flex items-center justify-between pt-1 text-xs font-semibold">
            <button
              onClick={() => updateCurrentIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              className="text-text-muted hover:text-text disabled:opacity-30 disabled:pointer-events-none cursor-pointer flex items-center gap-1"
            >
              <span>‹ السابق</span>
            </button>

            <div className="flex items-center gap-2">
              {onOpenInStudio && (
                <button
                  onClick={() => onOpenInStudio(currentItem.text, `${currentItem.category === 'morning' ? 'أذكار الصباح' : currentItem.category === 'evening' ? 'أذكار المساء' : 'أذكار'} · ${currentItem.source}`)}
                  className="px-2.5 py-1 rounded-xl bg-accent-light/70 border border-accent/30 text-accent font-semibold text-[11px] hover:bg-accent hover:text-white transition-all cursor-pointer flex items-center gap-1"
                  title="اصنع بطاقة لمشاركتها"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>اصنع بطاقة</span>
                </button>
              )}

              <button
                onClick={handleResetCurrent}
                className="text-[11px] text-text-muted hover:text-accent flex items-center gap-1 cursor-pointer"
                title="إعادة ضبط هذا الذكر"
              >
                <RotateCcw className="w-3 h-3" />
                <span>إعادة</span>
              </button>
            </div>

            <button
              onClick={() => updateCurrentIndex((prev) => Math.min(categoryItems.length - 1, prev + 1))}
              disabled={currentIndex === categoryItems.length - 1}
              className="text-primary hover:underline disabled:opacity-30 disabled:pointer-events-none cursor-pointer flex items-center gap-1"
            >
              <span>التالي ›</span>
            </button>
          </div>
        </div>
      )}

      {/* Progress Bar below card */}
      <div className="pt-2">
        <div className="w-full bg-[#E8E5DC] dark:bg-border rounded-full h-[6px] overflow-hidden my-2">
          <div 
            className="bg-primary h-full rounded-full transition-all duration-500" 
            style={{ width: `${progressPercent}%` }} 
          />
        </div>

        <div className="flex justify-between items-center text-xs text-text-muted pt-0.5">
          <span>اكتمل {completedCount} من {categoryItems.length}</span>
          <span>{progressPercent}٪</span>
        </div>
      </div>

      {/* Gentle Notice Box */}
      <div className="bg-primary-light/40 border border-primary/10 rounded-[14px] p-3.5 text-xs text-text-muted text-center leading-relaxed">
        عند اكتمال الورد تظهر حالة إنجاز هادئة، ويمكنك التوقف والعودة لاحقًا دون فقدان التقدم.
      </div>
    </div>
  );
};
