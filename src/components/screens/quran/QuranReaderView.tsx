import React, { useState, useEffect, useRef } from 'react';
import { Bookmark, ChevronRight, ChevronLeft, Loader2, RefreshCw, AlertCircle, Sparkles } from 'lucide-react';
import { QURAN_SURAHS, type SurahMeta } from '../../../data/quranSurahs';
import { db } from '../../../db';
import { AyahPickerModal } from './AyahPickerModal';

interface ApiAyah {
  number: number;
  text: string;
  numberInSurah: number;
  juz: number;
  page: number;
  surah: {
    number: number;
    name: string;
    englishName: string;
    revelationType: string;
    numberOfAyahs: number;
  };
}

interface QuranReaderViewProps {
  pageNumber: number;
  onPageChange: (newPage: number) => void;
  onToggleBookmark: (page: number, surah: SurahMeta) => void;
  isBookmarked: boolean;
  onOpenInStudio?: (text: string, source: string) => void;
}

// Convert numbers to Arabic numerals (١, ٢, ٣...)
const toArabicNumber = (num: number): string => {
  return num.toLocaleString('ar-EG');
};

// In-memory cache across component re-renders
const memoryCache = new Map<number, ApiAyah[]>();

export const QuranReaderView: React.FC<QuranReaderViewProps> = ({
  pageNumber,
  onPageChange,
  onToggleBookmark,
  isBookmarked,
  onOpenInStudio,
}) => {
  const [fontSizeScale, setFontSizeScale] = useState<number>(24);
  const [jumpInput, setJumpInput] = useState<string>('');
  const [showJump, setShowJump] = useState<boolean>(false);
  const [showAyahPicker, setShowAyahPicker] = useState<boolean>(false);
  const [ayahs, setAyahs] = useState<ApiAyah[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Find corresponding surah for the current page
  const currentSurah = [...QURAN_SURAHS].reverse().find((s) => s.page <= pageNumber) || QURAN_SURAHS[0];

  // Fetch page data with Dexie caching & memory cache
  useEffect(() => {
    let isMounted = true;

    const loadPageData = async () => {
      setLoadError(null);

      // 1. Check in-memory cache
      if (memoryCache.has(pageNumber)) {
        setAyahs(memoryCache.get(pageNumber)!);
        setIsLoading(false);
        prefetchNeighbors(pageNumber);
        return;
      }

      // 2. Check Dexie IndexedDB cache (Only accept verified quran.com-v4 edition)
      try {
        const cachedInDb = await db.quran_ayahs.where('page_number').equals(pageNumber).toArray();
        if (cachedInDb && cachedInDb.length > 0) {
          if (cachedInDb[0].edition_id !== 'quran.com-v4') {
            // Purge legacy corrupted cache
            await db.quran_ayahs.where('page_number').equals(pageNumber).delete();
          } else {
            const mapped: ApiAyah[] = cachedInDb.map((c) => {
              const surahMeta = QURAN_SURAHS.find((s) => s.id === c.surah_id) || QURAN_SURAHS[0];
              return {
                number: c.ayah_number,
                text: c.text_uthmani,
                numberInSurah: c.ayah_number,
                juz: c.juz_number,
                page: c.page_number,
                surah: {
                  number: c.surah_id,
                  name: surahMeta.name,
                  englishName: surahMeta.nameEn,
                  revelationType: surahMeta.type === 'Makki' ? 'Meccan' : 'Medinan',
                  numberOfAyahs: surahMeta.ayahCount,
                },
              };
            });

            if (isMounted) {
              memoryCache.set(pageNumber, mapped);
              setAyahs(mapped);
              setIsLoading(false);
              prefetchNeighbors(pageNumber);
              return;
            }
          }
        }
      } catch {
        // Continue to network fetch
      }

      // 3. Network Fetch from Official Quran.com API (Verified King Fahd Complex Text)
      if (isMounted) setIsLoading(true);

      try {
        const response = await fetch(`https://api.quran.com/api/v4/quran/verses/uthmani?page_number=${pageNumber}`);
        if (!response.ok) throw new Error('فشل جلب الصفحة');

        const json = await response.json();
        if (json.verses && Array.isArray(json.verses)) {
          const fetchedAyahs: ApiAyah[] = json.verses.map((v: { id: number; verse_key: string; text_uthmani: string }) => {
            const [surahStr, ayahStr] = v.verse_key.split(':');
            const sId = parseInt(surahStr, 10);
            const aNum = parseInt(ayahStr, 10);
            const surahMeta = QURAN_SURAHS.find((s) => s.id === sId) || QURAN_SURAHS[0];

            return {
              number: v.id,
              text: v.text_uthmani.trim(),
              numberInSurah: aNum,
              juz: surahMeta.juz,
              page: pageNumber,
              surah: {
                number: sId,
                name: surahMeta.name,
                englishName: surahMeta.nameEn,
                revelationType: surahMeta.type === 'Makki' ? 'Meccan' : 'Medinan',
                numberOfAyahs: surahMeta.ayahCount,
              },
            };
          });

          if (isMounted) {
            memoryCache.set(pageNumber, fetchedAyahs);
            setAyahs(fetchedAyahs);
            setIsLoading(false);
          }

          // Cache in Dexie for offline use with verified edition tag
          const recordsToCache = fetchedAyahs.map((a) => ({
            id: `qcom_p${pageNumber}_s${a.surah.number}_a${a.numberInSurah}`,
            edition_id: 'quran.com-v4',
            surah_id: a.surah.number,
            ayah_number: a.numberInSurah,
            text_uthmani: a.text,
            page_number: pageNumber,
            juz_number: a.juz,
          }));

          db.quran_ayahs.bulkPut(recordsToCache).catch(() => {});

          // Prefetch neighboring pages silently
          prefetchNeighbors(pageNumber);
        } else {
          throw new Error('بيانات الصفحة غير صالحة');
        }
      } catch (err: any) {
        if (isMounted) {
          setIsLoading(false);
          setLoadError(err.message || 'تعذر تحميل الصفحة. يرجى التأكد من الاتصال بالإنترنت.');
        }
      }
    };

    loadPageData();

    // Scroll to top of page container smoothly on page turn
    if (containerRef.current) {
      containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    return () => {
      isMounted = false;
    };
  }, [pageNumber]);

  // Silent prefetch for instant forward / backward flipping
  const prefetchNeighbors = (curr: number) => {
    [curr + 1, curr - 1].forEach(async (p) => {
      if (p >= 1 && p <= 604 && !memoryCache.has(p)) {
        try {
          const res = await fetch(`https://api.quran.com/api/v4/quran/verses/uthmani?page_number=${p}`);
          const d = await res.json();
          if (d.verses && Array.isArray(d.verses)) {
            const prefetched: ApiAyah[] = d.verses.map((v: { id: number; verse_key: string; text_uthmani: string }) => {
              const [surahStr, ayahStr] = v.verse_key.split(':');
              const sId = parseInt(surahStr, 10);
              const aNum = parseInt(ayahStr, 10);
              const surahMeta = QURAN_SURAHS.find((s) => s.id === sId) || QURAN_SURAHS[0];

              return {
                number: v.id,
                text: v.text_uthmani.trim(),
                numberInSurah: aNum,
                juz: surahMeta.juz,
                page: p,
                surah: {
                  number: sId,
                  name: surahMeta.name,
                  englishName: surahMeta.nameEn,
                  revelationType: surahMeta.type === 'Makki' ? 'Meccan' : 'Medinan',
                  numberOfAyahs: surahMeta.ayahCount,
                },
              };
            });

            memoryCache.set(p, prefetched);
            const records = prefetched.map((a) => ({
              id: `qcom_p${p}_s${a.surah.number}_a${a.numberInSurah}`,
              edition_id: 'quran.com-v4',
              surah_id: a.surah.number,
              ayah_number: a.numberInSurah,
              text_uthmani: a.text,
              page_number: p,
              juz_number: a.juz,
            }));
            db.quran_ayahs.bulkPut(records).catch(() => {});
          }
        } catch {
          // ignore background prefetch errors
        }
      }
    });
  };

  // Keyboard navigation (ArrowLeft: next, ArrowRight: prev in RTL)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showJump) return;
      if (e.key === 'ArrowLeft' && pageNumber < 604) {
        onPageChange(pageNumber + 1);
      } else if (e.key === 'ArrowRight' && pageNumber > 1) {
        onPageChange(pageNumber - 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pageNumber, showJump, onPageChange]);

  const handlePrevPage = () => {
    if (pageNumber > 1) {
      onPageChange(pageNumber - 1);
    }
  };

  const handleNextPage = () => {
    if (pageNumber < 604) {
      onPageChange(pageNumber + 1);
    }
  };

  const handleJumpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const p = parseInt(jumpInput, 10);
    if (!isNaN(p) && p >= 1 && p <= 604) {
      onPageChange(p);
      setShowJump(false);
      setJumpInput('');
    }
  };

  // Helper to remove duplicated Basmala from text_uthmani if surah header handles it
  const cleanAyahText = (text: string, numberInSurah: number, surahNumber: number): string => {
    if (numberInSurah === 1 && surahNumber !== 1) {
      return text.replace(/^بِسْمِ\s+ٱللَّهِ\s+ٱلرَّحْمَ[ٰـ]نِ\s+ٱلرَّحِيمِ\s*/, '');
    }
    return text;
  };

  const currentJuz = ayahs.length > 0 ? ayahs[0].juz : currentSurah.juz;

  return (
    <div ref={containerRef} className="space-y-4 animate-fade-in text-right select-text">
      {/* Reader Controls Top Bar */}
      <div className="bg-surface rounded-2xl p-3 border border-border flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          {/* Bookmark Button (Toggle On / Off) */}
          <button
            onClick={() => onToggleBookmark(pageNumber, currentSurah)}
            className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition-all cursor-pointer ${
              isBookmarked
                ? 'bg-accent text-white border-accent font-semibold shadow-xs hover:bg-accent/90'
                : 'bg-surface-elevated border-border text-text hover:border-accent/40'
            }`}
            title={isBookmarked ? 'إزالة الفاصلة من هذه الصفحة' : 'حفظ الفاصلة في هذه الصفحة'}
          >
            <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-white' : ''}`} />
            <span>{isBookmarked ? 'إزالة الفاصلة ✕' : 'ضع فاصلة'}</span>
          </button>

          {/* Font scaler */}
          <div className="flex items-center gap-1 bg-surface-elevated border border-border px-2 py-1 rounded-xl">
            <button
              onClick={() => setFontSizeScale((prev) => Math.max(18, prev - 2))}
              className="text-xs text-primary font-bold hover:opacity-75 cursor-pointer px-1.5"
              title="تصغير الخط"
            >
              −
            </button>
            <span className="text-[10px] text-text-muted font-mono">{fontSizeScale}</span>
            <button
              onClick={() => setFontSizeScale((prev) => Math.min(36, prev + 2))}
              className="text-xs text-primary font-bold hover:opacity-75 cursor-pointer px-1.5"
              title="تكبير الخط"
            >
              ＋
            </button>
          </div>

          {/* Studio Card Shortcut - Opens Ayah Selector Modal */}
          {onOpenInStudio && ayahs.length > 0 && (
            <button
              onClick={() => setShowAyahPicker(true)}
              className="px-2.5 py-1.5 rounded-xl bg-accent-light/70 border border-accent/30 text-accent font-semibold text-xs hover:bg-accent hover:text-white transition-all cursor-pointer flex items-center gap-1 shadow-xs"
              title="تحديد آيات وتحويلها إلى بطاقة في الاستوديو"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>بطاقة</span>
            </button>
          )}
        </div>

        {/* Surah info and jump trigger */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowJump(!showJump)}
            className="text-primary hover:underline font-mono text-xs font-semibold cursor-pointer"
          >
            صفحة {pageNumber} من ٦٠٤ ▾
          </button>
          <span className="font-alexandria font-bold text-xs text-text">
            سورة {currentSurah.name}
          </span>
        </div>
      </div>

      {/* Jump to Page Popover */}
      {showJump && (
        <form onSubmit={handleJumpSubmit} className="bg-surface-elevated rounded-2xl p-3 border border-border flex items-center gap-2 animate-fade-in">
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary/95 cursor-pointer shrink-0"
          >
            انتقل
          </button>
          <input
            type="number"
            min={1}
            max={604}
            value={jumpInput}
            onChange={(e) => setJumpInput(e.target.value)}
            placeholder="أدخل رقم الصفحة (١ - ٦٠٤)..."
            className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-xs text-text focus:outline-none focus:border-primary text-right"
            autoFocus
          />
        </form>
      )}

      {/* Primary Mushaf Frame Page */}
      <div 
        className="relative overflow-hidden bg-[#FAF7F0] dark:bg-[#151C22] border-2 border-[#D9CAAF]/80 dark:border-[#384350] rounded-3xl p-5 md:p-8 min-h-[500px] flex flex-col justify-between shadow-md transition-colors"
        style={{
          boxShadow: 'inset 0 0 0 6px rgba(198, 166, 107, 0.15), 0 12px 32px rgba(0,0,0,0.06)'
        }}
      >
        {/* Top Page Header in Mushaf */}
        <div className="flex justify-between items-center text-xs text-accent border-b border-[#D9CAAF]/40 dark:border-border pb-2.5 font-sans">
          <span>الجزء {currentJuz}</span>
          <span className="font-alexandria font-bold text-text">سورة {currentSurah.name}</span>
          <span className="font-mono">ص {pageNumber}</span>
        </div>

        {/* Center Quran Page Content with Authentic Medina Uthmani Verses */}
        <div className="py-6 my-auto text-center">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-text-muted">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <span className="text-xs font-sans">جاري فتح الصفحة رقم {pageNumber}...</span>
            </div>
          ) : loadError ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3 text-center px-4">
              <AlertCircle className="w-10 h-10 text-accent" />
              <p className="text-xs text-text-muted font-sans leading-relaxed max-w-xs">
                {loadError}
              </p>
              <button
                onClick={() => onPageChange(pageNumber)}
                className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white text-xs font-semibold cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>إعادة المحاولة</span>
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {ayahs.reduce((blocks, ayah) => {
                const last = blocks[blocks.length - 1];
                if (last && last.surahNumber === ayah.surah.number) {
                  last.ayahs.push(ayah);
                } else {
                  blocks.push({
                    surahNumber: ayah.surah.number,
                    surahName: ayah.surah.name,
                    revelationType: ayah.surah.revelationType,
                    numberOfAyahs: ayah.surah.numberOfAyahs,
                    hasSurahStart: ayah.numberInSurah === 1,
                    ayahs: [ayah],
                  });
                }
                return blocks;
              }, [] as Array<{
                surahNumber: number;
                surahName: string;
                revelationType: string;
                numberOfAyahs: number;
                hasSurahStart: boolean;
                ayahs: ApiAyah[];
              }>).map((block, bIdx) => (
                <div key={`block_${block.surahNumber}_${bIdx}`} className="space-y-4">
                  {/* Ornate Surah Header Banner when a Surah begins on this page */}
                  {block.hasSurahStart && (
                    <div className="my-5 pt-2 select-none">
                      <div className="relative py-2.5 px-6 rounded-2xl border-2 border-accent/40 bg-accent-light/35 text-center max-w-sm mx-auto shadow-xs">
                        <div className="font-alexandria font-bold text-accent text-sm md:text-base">
                          سُورَةُ {block.surahName.replace(/^سُورَةُ\s*/, '')}
                        </div>
                        <div className="text-[10px] text-text-muted mt-0.5 font-sans">
                          {block.revelationType === 'Meccan' ? 'مَكِّيَّةٌ' : 'مَدَنِيَّةٌ'} · آيَاتُهَا {toArabicNumber(block.numberOfAyahs)}
                        </div>
                      </div>

                      {block.surahNumber !== 1 && block.surahNumber !== 9 && (
                        <div className="text-center font-quran text-xl md:text-2xl text-accent/90 mt-4 mb-2 select-none">
                          بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
                        </div>
                      )}
                    </div>
                  )}

                  {/* Flowing Quran Text for the Surah Block */}
                  <p
                    className="font-quran leading-[2.6] md:leading-[2.9] text-text select-text"
                    style={{ fontSize: `${fontSizeScale}px` }}
                  >
                    {block.ayahs.map((ayah, aIdx) => {
                      const displayText = cleanAyahText(ayah.text, ayah.numberInSurah, ayah.surah.number);
                      return (
                        <span key={`ayah_${block.surahNumber}_${ayah.numberInSurah}_${aIdx}`}>
                          {displayText}
                          <span 
                            className="inline-flex items-center justify-center mx-1.5 text-accent font-sans font-bold text-xs select-none align-middle"
                          >
                            ﴿{toArabicNumber(ayah.numberInSurah)}﴾
                          </span>{' '}
                        </span>
                      );
                    })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bottom Page Number in Mushaf */}
        <div className="border-t border-[#D9CAAF]/40 dark:border-border pt-2 text-center text-xs font-mono text-text-muted">
          — {pageNumber} —
        </div>
      </div>

      {/* Bottom Paging Controls (Large Touch Targets) */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <button
          onClick={handlePrevPage}
          disabled={pageNumber <= 1}
          className="flex-1 py-3.5 rounded-2xl bg-surface border border-border flex items-center justify-center gap-2 text-xs font-semibold text-text hover:border-primary/50 disabled:opacity-30 disabled:pointer-events-none cursor-pointer shadow-xs active:scale-[0.99] transition-all"
        >
          <ChevronRight className="w-4 h-4" />
          <span>الصفحة السابقة ({pageNumber - 1})</span>
        </button>

        <button
          onClick={handleNextPage}
          disabled={pageNumber >= 604}
          className="flex-1 py-3.5 rounded-2xl bg-primary text-white flex items-center justify-center gap-2 text-xs font-semibold hover:bg-primary/95 disabled:opacity-30 disabled:pointer-events-none cursor-pointer shadow-xs active:scale-[0.99] transition-all"
        >
          <span>الصفحة التالية ({pageNumber + 1})</span>
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Ayah Selection Modal for Studio Cards */}
      <AyahPickerModal
        isOpen={showAyahPicker}
        onClose={() => setShowAyahPicker(false)}
        ayahs={ayahs}
        pageNumber={pageNumber}
        onConfirm={(text, source) => {
          onOpenInStudio?.(text, source);
        }}
      />
    </div>
  );
};
