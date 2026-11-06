import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Bookmark, 
  Calendar, 
  RotateCcw, 
  Sparkles, 
  ArrowRight,
  ListFilter,
  BookMarked
} from 'lucide-react';
import { db } from '../../db';
import { QURAN_SURAHS, type SurahMeta } from '../../data/quranSurahs';
import { SurahListView } from './quran/SurahListView';
import { QuranReaderView } from './quran/QuranReaderView';
import { KhatmaModal } from './quran/KhatmaModal';
import { CatchUpModal } from './quran/CatchUpModal';

interface QuranViewProps {
  onBack?: () => void;
  onOpenInStudio?: (text: string, source: string) => void;
}

type QuranSubTab = 'journey' | 'surahs' | 'reader';

export const QuranView: React.FC<QuranViewProps> = ({ onBack, onOpenInStudio }) => {
  const [activeSubTab, setActiveSubTab] = useState<QuranSubTab>('journey');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [targetDays, setTargetDays] = useState<number>(30);
  const [currentDay, setCurrentDay] = useState<number>(1);
  const [hasKhatmaPlan, setHasKhatmaPlan] = useState<boolean>(false);
  const [isKhatmaModalOpen, setIsKhatmaModalOpen] = useState<boolean>(false);
  const [isCatchUpModalOpen, setIsCatchUpModalOpen] = useState<boolean>(false);
  const [bookmarkedPage, setBookmarkedPage] = useState<number | null>(null);

  const totalPages = 604;

  // Load saved bookmark & Khatma plan from Dexie (No fake data)
  useEffect(() => {
    db.bookmarks.get('quran-current-page').then((saved) => {
      if (saved && typeof saved.pageNumber === 'number') {
        setCurrentPage(saved.pageNumber);
        setBookmarkedPage(saved.pageNumber);
      } else {
        setBookmarkedPage(null);
      }
    }).catch(() => {
      setBookmarkedPage(null);
    });

    db.khatma_plans.get('primary-khatma').then((plan) => {
      if (plan && plan.status === 'active') {
        setHasKhatmaPlan(true);
        if (plan.targetDays) setTargetDays(plan.targetDays);
        if (plan.currentPage) setCurrentPage(plan.currentPage);
      } else {
        setHasKhatmaPlan(false);
      }
    }).catch(() => {
      setHasKhatmaPlan(false);
    });
  }, []);

  const remainingPages = Math.max(0, totalPages - currentPage);
  const remainingDays = Math.max(1, targetDays - currentDay);
  const recalculatedDaily = Math.ceil(remainingPages / remainingDays);
  // Real progress: percentage of pages completed
  const progressPercent = Math.min(100, Math.round(((currentPage - 1) / totalPages) * 100));

  // Find active surah based on current page
  const currentSurah = [...QURAN_SURAHS].reverse().find((s) => s.page <= currentPage) || QURAN_SURAHS[0];

  const handleUpdatePage = (newPage: number) => {
    const clamped = Math.min(totalPages, Math.max(1, newPage));
    setCurrentPage(clamped);

    // Save reading position in Dexie
    db.reading_positions.put({
      id: 'active-reading-position',
      edition_id: 'medina-604',
      surah_id: currentSurah.id,
      ayah_number: 1,
      page_number: clamped,
      updated_at: new Date().toISOString()
    }).catch(() => {});

    if (hasKhatmaPlan) {
      db.khatma_plans.update('primary-khatma', {
        currentPage: clamped,
        currentSurah: currentSurah.id,
        currentSurahName: currentSurah.name,
        dailyTargetPages: recalculatedDaily
      }).catch(() => {});
    }
  };

  // Toggle bookmark: if already bookmarked here -> remove it!
  const handleToggleBookmark = (page: number, surah: SurahMeta) => {
    if (bookmarkedPage === page) {
      setBookmarkedPage(null);
      db.bookmarks.delete('quran-current-page').catch(() => {});
    } else {
      setBookmarkedPage(page);
      handleUpdatePage(page);

      db.bookmarks.put({
        id: 'quran-current-page',
        edition_id: 'medina-604',
        title: `فاصلة سورة ${surah.name}`,
        surahNumber: surah.id,
        surahName: surah.name,
        ayahNumber: 1,
        pageNumber: page,
        timestamp: new Date().toISOString()
      }).catch(() => {});
    }
  };

  const handleSelectSurahFromList = (surah: SurahMeta) => {
    handleUpdatePage(surah.page);
    setActiveSubTab('reader');
  };

  const bookmarkSurah = bookmarkedPage 
    ? [...QURAN_SURAHS].reverse().find((s) => s.page <= bookmarkedPage) || QURAN_SURAHS[0]
    : null;

  return (
    <div className="space-y-4 pb-28 md:pb-8 animate-fade-in max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary-light text-primary flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-alexandria font-bold text-2xl text-text">رحلة القرآن والختمة</h1>
            <p className="text-xs text-text-muted mt-0.5">على مهلٍ، صفحةً صفحة، وبلا لوم</p>
          </div>
        </div>

        {onBack && (
          <button 
            onClick={onBack}
            className="w-9 h-9 rounded-full border border-border flex items-center justify-center text-text-muted hover:text-text cursor-pointer transition-colors"
            title="رجوع للرئيسية"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Sub-tab Navigation Pills */}
      <div className="flex bg-surface-elevated border border-border p-1 rounded-2xl gap-1 text-xs font-semibold">
        <button
          onClick={() => setActiveSubTab('journey')}
          className={`flex-1 py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeSubTab === 'journey'
              ? 'bg-primary text-white shadow-xs'
              : 'text-text-muted hover:text-text'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>رحلة الختمة</span>
        </button>

        <button
          onClick={() => setActiveSubTab('reader')}
          className={`flex-1 py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeSubTab === 'reader'
              ? 'bg-primary text-white shadow-xs'
              : 'text-text-muted hover:text-text'
          }`}
        >
          <BookMarked className="w-3.5 h-3.5" />
          <span>المصحف الشريف</span>
        </button>

        <button
          onClick={() => setActiveSubTab('surahs')}
          className={`flex-1 py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeSubTab === 'surahs'
              ? 'bg-primary text-white shadow-xs'
              : 'text-text-muted hover:text-text'
          }`}
        >
          <ListFilter className="w-3.5 h-3.5" />
          <span>فهرس السور</span>
        </button>
      </div>

      {/* View 1: Journey Dashboard */}
      {activeSubTab === 'journey' && (
        <div className="space-y-4 animate-fade-in">
          {/* Primary Khatma Card */}
          {hasKhatmaPlan ? (
            <div className="bg-surface rounded-3xl p-6 border border-border shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-accent flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    ختمتك الحالية
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <h3 className="font-alexandria font-bold text-lg text-text">
                      خطة {targetDays} يوماً
                    </h3>
                    <button
                      onClick={() => setIsKhatmaModalOpen(true)}
                      className="text-xs text-primary hover:underline font-semibold cursor-pointer"
                    >
                      (تعديل)
                    </button>
                  </div>
                </div>
                <div className="w-14 h-14 rounded-full border-4 border-primary/20 border-t-primary flex items-center justify-center font-alexandria font-bold text-primary text-sm shadow-xs">
                  {progressPercent}%
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-border-subtle rounded-full h-2.5 overflow-hidden">
                <div 
                  className="bg-primary h-full rounded-full transition-all duration-500" 
                  style={{ width: `${progressPercent}%` }} 
                />
              </div>

              <div className="flex items-center justify-between text-xs text-text-muted">
                <span>موضعك: صفحة {currentPage} من {totalPages}</span>
                <span>اليوم {currentDay} من {targetDays}</span>
              </div>
            </div>
          ) : (
            <div className="bg-surface rounded-3xl p-6 border border-border shadow-xs space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-accent-light text-accent flex items-center justify-center shrink-0">
                  <Calendar className="w-6 h-6" />
                </div>
                <div className="text-right flex-1">
                  <h3 className="font-alexandria font-bold text-base text-text">
                    خطة الختمة
                  </h3>
                  <p className="text-xs text-text-muted mt-0.5 leading-relaxed">
                    لم تُنشئ خطة ختمة بعد · حدد عدد الأيام لتقسيم وردك تلقائياً وبلا ضغط
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsKhatmaModalOpen(true)}
                className="w-full py-2.5 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary/95 transition-all cursor-pointer shadow-xs"
              >
                إنشاء خطة ختمة
              </button>
            </div>
          )}

          {/* Today's Daily Target Card (Only if plan active, otherwise free reading encourage) */}
          {hasKhatmaPlan ? (
            <div className="bg-surface-elevated rounded-3xl p-6 border border-border flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-accent-light text-accent flex items-center justify-center shrink-0">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold text-accent block">هدف الورد لليوم</span>
                  <h4 className="font-alexandria font-bold text-base text-text mt-0.5 leading-normal">
                    {recalculatedDaily} صفحات اليوم
                  </h4>
                  <p className="text-[11px] text-text-muted mt-0.5 leading-normal">
                    متبقي {remainingPages} صفحة موزعة على {remainingDays} يوماً
                  </p>
                </div>
              </div>

              <button 
                onClick={() => handleUpdatePage(currentPage + 1)}
                className="px-4 py-2.5 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary/95 transition-all cursor-pointer shrink-0 shadow-xs active:scale-95"
              >
                + قرأت صفحة
              </button>
            </div>
          ) : (
            <div className="bg-surface-elevated rounded-3xl p-5 border border-border flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-accent-light text-accent flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold text-accent block">قراءة حرة</span>
                  <h4 className="font-alexandria font-bold text-sm text-text mt-0.5 leading-normal">
                    صفحة {currentPage} من {totalPages}
                  </h4>
                  <p className="text-[11px] text-text-muted mt-0.5">
                    سورة {currentSurah.name} · الجزء {currentSurah.juz}
                  </p>
                </div>
              </div>

              <button 
                onClick={() => setActiveSubTab('reader')}
                className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary/95 transition-all cursor-pointer shrink-0 shadow-xs active:scale-95"
              >
                واصل القراءة
              </button>
            </div>
          )}

          {/* Bookmark Card - 100% Real User Bookmark */}
          <div className="bg-surface rounded-2xl p-5 border border-border shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                <Bookmark className={`w-4 h-4 ${bookmarkedPage !== null ? 'fill-primary' : ''}`} />
                <span>آخر موضع مسجل (الفاصلة)</span>
              </div>
              <span className="text-xs text-text-muted">طبعة مصحف المدينة (٦٠٤ صفحات)</span>
            </div>

            {bookmarkedPage !== null && bookmarkSurah ? (
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-border-subtle/50">
                <div className="text-right">
                  <h4 className="font-alexandria font-bold text-sm text-text leading-normal">
                    سورة {bookmarkSurah.name} · الجزء {bookmarkSurah.juz}
                  </h4>
                  <p className="text-xs text-text-muted mt-0.5 leading-normal">الصفحة رقم {bookmarkedPage}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleBookmark(bookmarkedPage, bookmarkSurah)}
                    className="px-3 py-1.5 rounded-lg border border-red-300 dark:border-red-900/50 text-red-600 dark:text-red-400 text-xs font-semibold hover:bg-red-50 dark:hover:bg-red-950/20 cursor-pointer transition-colors"
                    title="إزالة الفاصلة"
                  >
                    إزالة الفاصلة ✕
                  </button>
                  <button
                    onClick={() => {
                      setCurrentPage(bookmarkedPage);
                      setActiveSubTab('reader');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/95 cursor-pointer mr-1"
                  >
                    افتح المصحف
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-border-subtle/40 border border-dashed border-border">
                <div className="text-right">
                  <h4 className="font-alexandria font-semibold text-sm text-text-muted leading-normal">
                    لم تسجل فاصلة بعد
                  </h4>
                  <p className="text-xs text-text-muted/80 mt-0.5 leading-normal">
                    اضغط زر «ضع فاصلة» في أي صفحة للرجوع إليها متى شئت
                  </p>
                </div>
                <button
                  onClick={() => setActiveSubTab('reader')}
                  className="px-3.5 py-1.5 rounded-lg bg-surface border border-border text-xs font-semibold text-primary hover:border-primary/40 cursor-pointer shrink-0"
                >
                  افتح المصحف
                </button>
              </div>
            )}
          </div>

          {/* Flexible Catch-up Notice & Trigger Button (Only if Khatma plan active) */}
          {hasKhatmaPlan && (
            <div className="bg-primary-light/40 rounded-2xl p-4 border border-primary/20 flex items-center justify-between gap-3">
              <button
                onClick={() => setIsCatchUpModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary/95 transition-all cursor-pointer shrink-0"
              >
                إعادة الجدولة
              </button>
              <div className="text-right">
                <div className="flex items-center justify-end gap-1.5 text-xs font-bold text-primary">
                  <span>مرونة الختمة دون شعور بالذنب</span>
                  <RotateCcw className="w-3.5 h-3.5" />
                </div>
                <p className="text-[11px] text-text-muted mt-0.5 leading-relaxed">
                  انقطعت أو تأخرت؟ أعد توزيع وردك المتبقي بضغطة زر دون ضغط.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* View 2: Interactive Quran Reader */}
      {activeSubTab === 'reader' && (
        <QuranReaderView
          pageNumber={currentPage}
          onPageChange={handleUpdatePage}
          onToggleBookmark={handleToggleBookmark}
          isBookmarked={bookmarkedPage === currentPage}
          onOpenInStudio={onOpenInStudio}
        />
      )}

      {/* View 3: Surah Index */}
      {activeSubTab === 'surahs' && (
        <SurahListView
          onSelectSurah={handleSelectSurahFromList}
          currentPage={currentPage}
        />
      )}

      {/* Modals */}
      <KhatmaModal
        isOpen={isKhatmaModalOpen}
        onClose={() => setIsKhatmaModalOpen(false)}
        onSavePlan={(days) => {
          setTargetDays(days);
          setCurrentDay(1);
          setHasKhatmaPlan(true);
          handleUpdatePage(currentPage);
        }}
        currentDays={targetDays}
      />

      <CatchUpModal
        isOpen={isCatchUpModalOpen}
        onClose={() => setIsCatchUpModalOpen(false)}
        currentPage={currentPage}
        totalDays={targetDays}
        currentDay={currentDay}
        onApplyCatchUp={(newDays) => {
          setTargetDays(newDays);
          handleUpdatePage(currentPage);
        }}
      />
    </div>
  );
};
