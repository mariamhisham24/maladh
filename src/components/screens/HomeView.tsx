import React, { useState, useEffect } from 'react';
import type { TabKey } from '../layout/BottomNav';
import type { AdhkarCategory } from '../../types';
import { 
  HeartHandshake,
  Clock,
  Sparkles
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { SEED_ADHKAR, getDailySunnah } from '../../data/seedData';
import { db } from '../../db';
import { InstallAppButton } from '../common/PWAInstallBanner';

interface HomeViewProps {
  onNavigate: (tab: TabKey, adhkarCategory?: AdhkarCategory) => void;
  onOpenInStudio?: (text: string, source: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ onNavigate, onOpenInStudio }) => {
  const { effectiveTheme } = useTheme();
  
  // Dynamic Wird based on exact local time
  const currentHour = new Date().getHours();
  let currentCategory: AdhkarCategory = 'morning';
  let currentWirdTitle = 'أذكار الصباح';

  if (currentHour >= 4 && currentHour < 15) {
    currentCategory = 'morning';
    currentWirdTitle = 'أذكار الصباح';
  } else if (currentHour >= 15 && currentHour < 21) {
    currentCategory = 'evening';
    currentWirdTitle = 'أذكار المساء';
  } else {
    currentCategory = 'sleep';
    currentWirdTitle = 'أذكار النوم';
  }

  // Today's dynamic Sunnah
  const dailySunnah = getDailySunnah();

  // Synchronized Hijri & Gregorian Dates
  const now = new Date();
  const hijriFormatted = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(now);

  const gregorianFormatted = new Intl.DateTimeFormat('ar-EG', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(now);

  // Real data state
  const [wirdProgress, setWirdProgress] = useState<{ completed: number; total: number }>({
    completed: 0,
    total: 0
  });
  const [quranStatus, setQuranStatus] = useState<string>('ابدأ القراءة');
  const [tasbeehStatus, setTasbeehStatus] = useState<string>('ابدأ ذكرًا');

  useEffect(() => {
    // 1. Real Wird Adhkar Progress
    const today = new Date().toISOString().split('T')[0];
    const key = `maladh_adhkar_${currentCategory}_${today}`;
    const categoryItems = SEED_ADHKAR.filter((item) => item.category === currentCategory);
    const total = categoryItems.length;
    let completed = 0;

    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        const counts = JSON.parse(saved);
        completed = categoryItems.filter(
          (item) => (counts[item.id] || 0) >= item.count
        ).length;
      } catch {
        completed = 0;
      }
    }
    setWirdProgress({ completed, total });

    // 2. Real Quran Bookmark / Position
    db.bookmarks.get('quran-current-page').then((saved) => {
      if (saved && saved.pageNumber) {
        setQuranStatus(`ص ${saved.pageNumber} · ${saved.surahName}`);
      } else {
        db.reading_positions.get('active-reading-position').then((pos) => {
          if (pos && pos.page_number && pos.page_number > 1) {
            setQuranStatus(`صفحة ${pos.page_number}`);
          } else {
            setQuranStatus('ابدأ القراءة');
          }
        }).catch(() => setQuranStatus('ابدأ القراءة'));
      }
    }).catch(() => setQuranStatus('ابدأ القراءة'));

    // 3. Real Tasbeeh Count
    db.tasbeeh_sessions.orderBy('id').last().then((last) => {
      if (last && typeof last.cumulativeTotal === 'number' && last.cumulativeTotal > 0) {
        setTasbeehStatus(`${last.cumulativeTotal} تسبيحة`);
      } else {
        setTasbeehStatus('ابدأ ذكرًا');
      }
    }).catch(() => setTasbeehStatus('ابدأ ذكرًا'));
  }, [currentCategory]);

  const wirdPercent = wirdProgress.total > 0 
    ? Math.round((wirdProgress.completed / wirdProgress.total) * 100) 
    : 0;

  return (
    <div className="space-y-5 pb-28 md:pb-8 animate-fade-in max-w-lg mx-auto">
      {/* Install App First-Visit Banner */}
      <InstallAppButton dismissible={true} />

      {/* Day Greeting with Synchronized Hijri & Gregorian Date */}
      <div className="text-right">
        <span className="text-xs text-text-muted inline-flex items-center gap-1.5 font-medium">
          <Clock className="w-3.5 h-3.5 text-accent shrink-0" />
          <span>{hijriFormatted} · {gregorianFormatted} م</span>
        </span>
        <h1 className="font-alexandria text-2xl font-bold text-text mt-1.5 leading-normal">
          أهلًا بك
        </h1>
        <p className="text-xs md:text-sm text-text-muted mt-0.5 leading-relaxed">
          خذ لحظة لنفسك، وابدأ من حيث أنت.
        </p>
      </div>

      {/* Sanctuary Hero Card ("ماذا يثقل صدرك الآن؟") - Pixel-matched to Maladh Design Kit */}
      <div 
        onClick={() => onNavigate('navigator')}
        className="relative overflow-hidden cursor-pointer group transition-all duration-300 hover:shadow-xl text-[#F3F0E8] p-[22px_20px_20px]"
        style={{
          border: '1px solid rgba(179, 142, 80, 0.47)',
          borderRadius: '26px 26px 82px 26px',
          background: 'radial-gradient(ellipse at 12% 0%, #31504a 0%, transparent 50%), linear-gradient(145deg, #17231f 0%, #0A0D14 75%)',
          boxShadow: '0 16px 34px rgba(10, 13, 20, 0.28)',
          isolation: 'isolate'
        }}
      >
        {/* Botanical watermark branch on bottom left */}
        <div 
          className="absolute -left-[10px] -bottom-[27px] w-[145px] h-[145px] pointer-events-none transition-transform duration-700 group-hover:scale-105 -rotate-[14deg]"
          style={{
            backgroundImage: `url(${effectiveTheme === 'dark' ? '/botanical-night.png' : '/botanical-ivory.png'})`,
            backgroundSize: 'contain',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            opacity: 0.35,
            zIndex: -1
          }}
        />

        {/* Gold vertical bar on the left edge */}
        <div 
          className="absolute left-0 top-[22px] w-[3px] h-[56px] bg-[#C6A66B]"
          style={{ borderRadius: '0 3px 3px 0' }}
        />

        {/* Content */}
        <div className="relative z-10 text-right">
          <div className="text-[11px] text-[#d1bc8d] tracking-wide mb-2 font-medium">
            مساحة لك
          </div>

          <h2 className="font-quran text-[25px] md:text-[27px] font-bold leading-normal text-[#F3F0E8] mb-1.5 max-w-[85%] select-none">
            ماذا يثقل صدرك الآن؟
          </h2>

          <p className="text-xs text-[#d4d6cf] leading-relaxed mb-4 max-w-[85%]">
            اختر حالتك لاستكشاف محتوى موثّق يناسبها.
          </p>

          <button 
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onNavigate('navigator');
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#F3F0E8] text-[#14211C] font-semibold text-xs shadow-none group-hover:bg-[#C6A66B] group-hover:text-white transition-all cursor-pointer"
          >
            <span>استكشف بهدوء</span>
            <span className="text-sm font-bold">←</span>
          </button>
        </div>
      </div>

      {/* "وردك اليوم" Section Head */}
      <div className="flex items-center justify-between pt-1">
        <h3 className="font-alexandria font-bold text-base md:text-lg text-text">
          وردك اليوم
        </h3>
        <button 
          onClick={() => onNavigate('adhkar', currentCategory)}
          className="text-xs font-semibold text-primary hover:underline cursor-pointer"
        >
          عرض الكل
        </button>
      </div>

      {/* Wird Card - 100% Real User Progress */}
      <div 
        onClick={() => onNavigate('adhkar', currentCategory)}
        className="bg-surface rounded-[20px] p-5 border border-border shadow-xs hover:border-primary/40 cursor-pointer transition-all space-y-3"
      >
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-alexandria font-bold text-sm md:text-base text-text leading-normal">
              {currentWirdTitle}
            </h4>
            <p className="text-[11px] text-text-muted mt-1 leading-normal">
              {wirdProgress.completed === 0 
                ? 'لم تبدأ بعد · اضغط للمتابعة' 
                : (wirdProgress.completed === wirdProgress.total ? 'أكملت وردك بحمد الله' : 'تقدّم محفوظ على جهازك')}
            </p>
          </div>

          <div className="w-9 h-9 rounded-full bg-soft/80 flex items-center justify-center text-primary border border-border/60 shrink-0">
            <Clock className="w-4 h-4 stroke-[1.7]" />
          </div>
        </div>

        {/* Progress Bar (RTL: fill on right) */}
        <div className="w-full bg-[#E8E5DC] dark:bg-border rounded-full h-[6px] overflow-hidden">
          <div 
            className="bg-primary h-full rounded-full transition-all duration-500" 
            style={{ width: `${wirdPercent}%` }} 
          />
        </div>

        <div className="flex justify-between items-center text-[11px] text-text-muted pt-0.5">
          <span>{wirdProgress.completed} من {wirdProgress.total}</span>
          <span>{wirdProgress.completed === wirdProgress.total ? 'مكتمل' : 'واصل عندما يناسبك'}</span>
        </div>
      </div>

      {/* Grid2: Quran (Right, Dark) & Tasbeeh (Left, Warm) */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        {/* Right Card: رحلة القرآن (Dark) */}
        <div 
          onClick={() => onNavigate('quran')}
          className="rounded-[20px] p-4 cursor-pointer transition-all hover:scale-[1.01] flex flex-col justify-between min-h-[105px] border border-border/30 shadow-xs"
          style={{
            background: effectiveTheme === 'dark' 
              ? 'linear-gradient(140deg, #1b3933, #14211f)' 
              : 'linear-gradient(140deg, #18302b, #10201d)',
            color: '#F3F0E8'
          }}
        >
          <div className="flex justify-end">
            <div className="text-accent text-lg leading-none">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-accent">
                <circle cx="12" cy="12" r="8" />
                <circle cx="12" cy="12" r="3" fill="currentColor" />
              </svg>
            </div>
          </div>
          <div>
            <strong className="font-alexandria font-bold text-sm block leading-normal text-white">
              رحلة القرآن
            </strong>
            <span className="text-[11px] text-[#c7d0c8] block mt-1 leading-normal truncate">
              {quranStatus}
            </span>
          </div>
        </div>

        {/* Left Card: السبحة (Warm Light) */}
        <div 
          onClick={() => onNavigate('tasbeeh')}
          className="rounded-[20px] p-4 cursor-pointer transition-all hover:scale-[1.01] flex flex-col justify-between min-h-[105px] border shadow-xs"
          style={{
            background: effectiveTheme === 'dark'
              ? 'linear-gradient(140deg, #2c2518, #1b2020)'
              : 'linear-gradient(140deg, #eee5d2, #f9f5eb)',
            borderColor: effectiveTheme === 'dark' ? '#5b4c31' : '#e4d5b8',
            color: effectiveTheme === 'dark' ? '#F3F0E8' : '#202722'
          }}
        >
          <div className="flex justify-end">
            <div className="text-accent text-lg leading-none">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="3 3" className="w-5 h-5 text-accent">
                <circle cx="12" cy="12" r="8" />
              </svg>
            </div>
          </div>
          <div>
            <strong className="font-alexandria font-bold text-sm block leading-normal">
              السبحة
            </strong>
            <span className="text-[11px] text-text-muted block mt-1 leading-normal">
              {tasbeehStatus}
            </span>
          </div>
        </div>
      </div>

      {/* Sunnah of the Day Snippet - 100% Dynamic & Card Maker shortcut */}
      <div 
        onClick={() => onNavigate('sunnah')}
        className="bg-surface rounded-[20px] p-4 md:p-5 border border-border shadow-xs flex items-center justify-between gap-4 cursor-pointer hover:border-primary/40 transition-all"
      >
        <div className="flex items-center gap-3.5 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-accent-light text-accent flex items-center justify-center shrink-0 border border-border-subtle">
            <HeartHandshake className="w-5 h-5" />
          </div>
          <div className="text-right min-w-0">
            <span className="text-[11px] font-semibold text-accent block">سنة اليوم المتجددة</span>
            <h4 className="font-alexandria font-bold text-sm text-text mt-0.5 leading-normal truncate">
              {dailySunnah.title}
            </h4>
            <p className="text-[11px] text-text-muted mt-0.5 line-clamp-1 leading-normal">
              {dailySunnah.hadithText} — {dailySunnah.source}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onOpenInStudio && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenInStudio(dailySunnah.hadithText, `${dailySunnah.title} · ${dailySunnah.source}`);
              }}
              className="px-2.5 py-1.5 rounded-xl bg-accent-light border border-accent/30 text-accent font-semibold text-[11px] hover:bg-accent hover:text-white transition-all cursor-pointer flex items-center gap-1"
              title="اصنع بطاقة لسنة اليوم"
            >
              <Sparkles className="w-3 h-3" />
              <span>بطاقة</span>
            </button>
          )}
          <span className="text-xs text-primary font-semibold">اقرأ ←</span>
        </div>
      </div>
    </div>
  );
};
