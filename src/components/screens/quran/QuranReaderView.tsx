import React, { useState, useEffect, useRef } from 'react';
import { Bookmark, ChevronRight, ChevronLeft, Loader2, RefreshCw, AlertCircle, Sparkles, Type, Headphones, Volume2, BookOpen, Copy, Check, X } from 'lucide-react';
import { QURAN_SURAHS, type SurahMeta } from '../../../data/quranSurahs';
import { db } from '../../../db';
import { AyahPickerModal } from './AyahPickerModal';
import { AyahActionModal } from './AyahActionModal';
import { SurahAudioPlayerBar } from './SurahAudioPlayerBar';

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

// Immediately purge legacy corrupted IndexedDB cache from prior sessions
const STORAGE_PURGE_KEY = 'maladh_quran_kfqpc_purged_v4';
if (typeof window !== 'undefined' && !localStorage.getItem(STORAGE_PURGE_KEY)) {
  db.quran_ayahs.clear().catch(() => {});
  localStorage.setItem(STORAGE_PURGE_KEY, 'true');
}

let fullQuranCache: Record<number, any[]> | null = null;
let fullQuranPromise: Promise<Record<number, any[]>> | null = null;

async function getFullQuran(): Promise<Record<number, any[]>> {
  if (fullQuranCache) return fullQuranCache;
  if (!fullQuranPromise) {
    fullQuranPromise = fetch('/quran-kfqpc.json?v=20261114_v4')
      .catch(() => fetch('/quran-uthmani.json?v=20261114_v4'))
      .then((res) => {
        if (!res.ok) throw new Error('Local Quran file not found');
        return res.json();
      })
      .then((data) => {
        fullQuranCache = data;
        return data;
      })
      .catch((err) => {
        fullQuranPromise = null;
        throw err;
      });
  }
  return fullQuranPromise;
}

async function loadFromLocalQuranJson(pageNumber: number): Promise<ApiAyah[]> {
  const fullQuran = await getFullQuran();
  const rawAyahs = fullQuran[pageNumber];
  if (!rawAyahs || !Array.isArray(rawAyahs)) return [];

  const mapped: ApiAyah[] = rawAyahs.map((a: any) => {
    const surahMeta = QURAN_SURAHS.find((s) => s.id === a.s) || QURAN_SURAHS[0];
    return {
      number: a.a,
      text: a.t,
      numberInSurah: a.a,
      juz: a.j || surahMeta.juz,
      page: pageNumber,
      surah: {
        number: a.s,
        name: a.sn || surahMeta.name,
        englishName: a.en || surahMeta.nameEn,
        revelationType: a.r || (surahMeta.type === 'Makki' ? 'Meccan' : 'Medinan'),
        numberOfAyahs: surahMeta.ayahCount,
      },
    };
  });

  // Populate Dexie in background
  try {
    const recordsToCache = mapped.map((a) => ({
      id: `local_p${pageNumber}_s${a.surah.number}_a${a.numberInSurah}`,
      edition_id: 'king-fahd-complex-v2',
      surah_id: a.surah.number,
      ayah_number: a.numberInSurah,
      text_uthmani: a.text,
      page_number: pageNumber,
      juz_number: a.juz,
    }));
    db.quran_ayahs.bulkPut(recordsToCache).catch(() => {});
  } catch {}

  return mapped;
}

export const QuranReaderView: React.FC<QuranReaderViewProps> = ({
  pageNumber,
  onPageChange,
  onToggleBookmark,
  isBookmarked,
  onOpenInStudio,
}) => {
  const [fontSizeScale, setFontSizeScale] = useState<number>(24);
  const [fontMode, setFontMode] = useState<'uthmani' | 'clear'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('maladh_quran_font_mode') as 'uthmani' | 'clear') || 'uthmani';
    }
    return 'uthmani';
  });
  const [jumpInput, setJumpInput] = useState<string>('');
  const [showJump, setShowJump] = useState<boolean>(false);
  const [showAyahPicker, setShowAyahPicker] = useState<boolean>(false);
  const [selectedWord, setSelectedWord] = useState<{
    surahNumber: number;
    surahName: string;
    ayahNumber: number;
    wordIndex: number;
    wordText: string;
    fullAyahText: string;
  } | null>(null);
  const [playingWordKey, setPlayingWordKey] = useState<string | null>(null);
  const [selectedAyah, setSelectedAyah] = useState<{
    surahNumber: number;
    surahName: string;
    ayahNumber: number;
    text: string;
  } | null>(null);
  const [popoverPos, setPopoverPos] = useState<{ x: number; y: number; placeAbove: boolean } | null>(null);
  const [showSurahPlayer, setShowSurahPlayer] = useState<boolean>(false);
  const [audioPlayerMode, setAudioPlayerMode] = useState<'page' | 'surah'>('page');
  const [playingSurahAyah, setPlayingSurahAyah] = useState<number | null>(null);
  const [playingAudioSurahId, setPlayingAudioSurahId] = useState<number | null>(null);
  const [showTafseerModal, setShowTafseerModal] = useState<boolean>(false);
  const [copiedAyah, setCopiedAyah] = useState<boolean>(false);
  const [isPlayingSingle, setIsPlayingSingle] = useState<boolean>(false);
  const singleAudioRef = useRef<HTMLAudioElement | null>(null);
  const [ayahs, setAyahs] = useState<ApiAyah[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Find corresponding surah for the current page
  const currentSurah = [...QURAN_SURAHS].reverse().find((s) => s.page <= pageNumber) || QURAN_SURAHS[0];
  // Play single ayah audio from floating pill
  const handlePlaySingleAyah = (sId: number, aNum: number) => {
    if (singleAudioRef.current) {
      singleAudioRef.current.pause();
    }
    const reciterFolder = localStorage.getItem('maladh_quran_reciter') === 'husary'
      ? 'Husary_128kbps'
      : localStorage.getItem('maladh_quran_reciter') === 'minshawi'
      ? 'Minshawy_Murattal_128kbps'
      : localStorage.getItem('maladh_quran_reciter') === 'abdulbasit'
      ? 'Abdul_Basit_Murattal_192kbps'
      : 'Alafasy_128kbps';

    const sStr = String(sId).padStart(3, '0');
    const aStr = String(aNum).padStart(3, '0');
    const audio = new Audio(`https://everyayah.com/data/${reciterFolder}/${sStr}${aStr}.mp3`);
    singleAudioRef.current = audio;
    setIsPlayingSingle(true);
    setPlayingSurahAyah(aNum);

    audio.play().catch(() => {
      const fb = new Audio(`https://verses.quran.com/Alafasy/mp3/${sStr}${aStr}.mp3`);
      singleAudioRef.current = fb;
      fb.play().catch(() => {
        setIsPlayingSingle(false);
        setPlayingSurahAyah(null);
      });
      fb.onended = () => {
        setIsPlayingSingle(false);
        setPlayingSurahAyah(null);
      };
    });

    audio.onended = () => {
      setIsPlayingSingle(false);
      setPlayingSurahAyah(null);
    };
  };

  const handleCopyAyah = (text: string, surahName: string, aNum: number) => {
    const formatted = `﴿ ${text.trim()} ﴾
[سورة ${surahName} - الآية ${toArabicNumber(aNum)}]`;
    navigator.clipboard.writeText(formatted).then(() => {
      setCopiedAyah(true);
      setTimeout(() => setCopiedAyah(false), 2000);
    });
  };

  // Word Click Handler: Immediately plays word audio & selects ONLY this word!
  const handleWordClick = (
    sId: number, 
    sName: string, 
    aNum: number, 
    wIdx: number, 
    word: string, 
    fullText: string,
    targetEl?: HTMLElement
  ) => {
    setSelectedAyah(null); // Clear full ayah selection so only this word is highlighted!
    setSelectedWord({
      surahNumber: sId,
      surahName: sName,
      ayahNumber: aNum,
      wordIndex: wIdx,
      wordText: word,
      fullAyahText: fullText,
    });

    if (targetEl) {
      const rect = targetEl.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const placeAbove = rect.top >= 70;
      const targetY = placeAbove ? rect.top - 8 : rect.bottom + 8;
      const margin = 140;
      const clampedX = Math.max(margin, Math.min(window.innerWidth - margin, centerX));
      setPopoverPos({ x: clampedX, y: targetY, placeAbove });
    }

    // Immediately listen to this word!
    handlePlaySingleWord(sId, aNum, wIdx);
  };

  // Ayah Click Handler: Selects the entire Ayah!
  const handleAyahClick = (
    sId: number, 
    sName: string, 
    aNum: number, 
    fullText: string,
    targetEl?: HTMLElement
  ) => {
    setSelectedWord(null); // Clear single word selection
    if (selectedAyah?.surahNumber === sId && selectedAyah?.ayahNumber === aNum) {
      setSelectedAyah(null);
      setPopoverPos(null);
    } else {
      setSelectedAyah({
        surahNumber: sId,
        surahName: sName,
        ayahNumber: aNum,
        text: fullText,
      });

      if (targetEl) {
        const rect = targetEl.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const placeAbove = rect.top >= 70;
        const targetY = placeAbove ? rect.top - 8 : rect.bottom + 8;
        const margin = 140;
        const clampedX = Math.max(margin, Math.min(window.innerWidth - margin, centerX));
        setPopoverPos({ x: clampedX, y: targetY, placeAbove });
      }
    }
  };

  // Play Single Word Audio
  const handlePlaySingleWord = (sId: number, aNum: number, wIdx: number) => {
    if (singleAudioRef.current) {
      singleAudioRef.current.pause();
    }
    const sStr = String(sId).padStart(3, '0');
    const aStr = String(aNum).padStart(3, '0');
    const wStr = String(wIdx + 1).padStart(3, '0');
    const wordUrl = `https://audio.qurancdn.com/wbw/${sStr}_${aStr}_${wStr}.mp3`;
    const audio = new Audio(wordUrl);
    singleAudioRef.current = audio;
    const key = `${sId}_${aNum}_${wIdx}`;
    setPlayingWordKey(key);

    audio.play().catch(() => {
      setPlayingWordKey(null);
    });
    audio.onended = () => {
      setPlayingWordKey(null);
    };
    audio.onerror = () => {
      setPlayingWordKey(null);
    };
  };

  // Dismiss Floating Action Menu when clicking anywhere outside, scrolling, or pressing Escape
  useEffect(() => {
    if (!selectedWord && !selectedAyah) return;

    const handleDismiss = (e?: MouseEvent | TouchEvent) => {
      if (e) {
        const target = e.target as HTMLElement | null;
        if (!target) return;
        if (target.closest('#floating-quran-action-menu')) {
          return;
        }
        if (target.closest('[role="dialog"]') || target.closest('.ayah-action-modal')) {
          return;
        }
      }
      setSelectedAyah(null);
      setSelectedWord(null);
      setPopoverPos(null);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedAyah(null);
        setSelectedWord(null);
        setPopoverPos(null);
      }
    };

    const timer = setTimeout(() => {
      window.addEventListener('click', handleDismiss);
      window.addEventListener('touchend', handleDismiss);
      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('scroll', () => handleDismiss(), { passive: true });
    }, 50);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('click', handleDismiss);
      window.removeEventListener('touchend', handleDismiss);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedWord, selectedAyah]);


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

      // 2. Check Dexie IndexedDB cache (Only accept verified king-fahd-complex-v1 edition)
      try {
        const cachedInDb = await db.quran_ayahs.where('page_number').equals(pageNumber).toArray();
        if (cachedInDb && cachedInDb.length > 0) {
          if (cachedInDb[0].edition_id !== 'king-fahd-complex-v2') {
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
        // Continue to local bundled JSON
      }

      // 3. Instant Bundled Offline Quran JSON (/quran-uthmani.json)
      try {
        const localPageAyahs = await loadFromLocalQuranJson(pageNumber);
        if (localPageAyahs && localPageAyahs.length > 0) {
          if (isMounted) {
            memoryCache.set(pageNumber, localPageAyahs);
            setAyahs(localPageAyahs);
            setIsLoading(false);
            prefetchNeighbors(pageNumber);
            return;
          }
        }
      } catch (localErr) {
        console.warn('Local offline Quran fetch failed, falling back to online API:', localErr);
      }

      // 4. Online Network Fetch fallback (if local json was somehow unavailable)
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
          const localAyahs = await loadFromLocalQuranJson(p);
          if (localAyahs && localAyahs.length > 0) {
            memoryCache.set(p, localAyahs);
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

  // Helper to clean and normalize Ayah text (remove duplicated Basmala and attach waqf marks to preceding words)
  const cleanAyahText = (text: string, numberInSurah: number, surahNumber: number): string => {
    let cleaned = text;
    if (numberInSurah === 1 && surahNumber !== 1) {
      cleaned = cleaned.replace(/^[\uFEFF\s]*بِسْمِ\s+ٱللَّهِ\s+ٱلرَّحْمَ[ٰـ]نِ\s+ٱلرَّحِيمِ\s*/, '');
    }
    // Safeguard: Attach Quranic waqf marks (ۖ ۗ ۘ ۙ ۚ ۛ ۜ ۩) to preceding word so they are never treated as separate words
    cleaned = cleaned.replace(/\s+([ۖۗۘۙۚۛۜ۩])/g, '$1');
    cleaned = cleaned.replace(/([۞])\s+/g, '$1');
    return cleaned;
  };

  const currentJuz = ayahs.length > 0 ? ayahs[0].juz : currentSurah.juz;

  return (
    <div 
      ref={containerRef} 
      onClick={() => {
        if (selectedWord || selectedAyah) {
          setSelectedAyah(null);
          setSelectedWord(null);
          setPopoverPos(null);
        }
      }}
      className="space-y-4 animate-fade-in text-right select-text"
    >
      {/* Reader Controls Top Bar */}
      <div className="bg-surface rounded-2xl p-2.5 sm:p-3 border border-border flex flex-col md:flex-row md:items-center justify-between gap-2.5 text-xs shadow-xs">
        {/* Actions Group with Smooth Scrolling */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-0.5">
          {/* Bookmark Button */}
          <button
            onClick={() => onToggleBookmark(pageNumber, currentSurah)}
            className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
              isBookmarked
                ? 'bg-accent text-white border-accent shadow-xs'
                : 'bg-surface-elevated border-border text-text hover:border-accent/40'
            }`}
            title={isBookmarked ? 'إزالة الفاصلة' : 'حفظ فاصلة هنا'}
          >
            <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-white' : ''}`} />
            <span>{isBookmarked ? 'فاصلة ✓' : 'حفظ فاصلة'}</span>
          </button>

          {/* Font scaler */}
          <div className="flex items-center gap-1 bg-surface-elevated border border-border px-2 py-1 rounded-xl shrink-0">
            <button
              onClick={() => setFontSizeScale((prev) => Math.max(18, prev - 2))}
              className="text-xs text-primary font-bold hover:opacity-75 cursor-pointer px-1"
              title="تصغير الخط"
            >
              −
            </button>
            <span className="text-[11px] text-text-muted font-mono px-0.5">{fontSizeScale}</span>
            <button
              onClick={() => setFontSizeScale((prev) => Math.min(36, prev + 2))}
              className="text-xs text-primary font-bold hover:opacity-75 cursor-pointer px-1"
              title="تكبير الخط"
            >
              ＋
            </button>
          </div>

          {/* Font Mode Switcher: خط عثمان طه vs خط النسخ */}
          <button
            onClick={() => {
              const next = fontMode === 'uthmani' ? 'clear' : 'uthmani';
              setFontMode(next);
              localStorage.setItem('maladh_quran_font_mode', next);
            }}
            className="px-2.5 py-1.5 rounded-xl bg-surface-elevated border border-border text-xs text-primary font-semibold hover:border-primary/40 cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-all shadow-xs"
            title="تبديل نوع الخط القرآني"
          >
            <Type className="w-3.5 h-3.5 text-accent" />
            <span>{fontMode === 'clear' ? 'خط النسخ' : 'خط عثمان طه'}</span>
          </button>

          {/* Page Audio Recitation Button: استماع للصفحة */}
          <button
            onClick={() => {
              setAudioPlayerMode('page');
              setShowSurahPlayer(true);
              if (ayahs.length > 0) {
                const first = ayahs[0];
                setPlayingSurahAyah(first.numberInSurah);
                setPlayingAudioSurahId(first.surah.number);
              }
            }}
            className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer transition-all shadow-xs ${
              showSurahPlayer && audioPlayerMode === 'page'
                ? 'bg-primary text-white border-primary shadow-sm'
                : 'bg-primary/10 border-primary/30 text-primary hover:bg-primary/20'
            }`}
            title="الاستماع لتلاوة الصفحة الحالية كاملة بالترتيب مع التظليل الحي"
          >
            <Headphones className="w-3.5 h-3.5" />
            <span>استماع للصفحة</span>
          </button>

          {/* Surah Audio Recitation Button: تلاوة السورة */}
          <button
            onClick={() => {
              setAudioPlayerMode('surah');
              setShowSurahPlayer(true);
              setPlayingSurahAyah(1);
              setPlayingAudioSurahId(currentSurah.id);
            }}
            className={`px-2.5 py-1.5 rounded-xl border flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer transition-all shadow-xs ${
              showSurahPlayer && audioPlayerMode === 'surah'
                ? 'bg-accent text-white border-accent shadow-sm'
                : 'bg-surface-elevated border-border text-text hover:border-accent/40'
            }`}
            title="الاستماع لتلاوة السورة كاملة"
          >
            <BookOpen className="w-3.5 h-3.5 text-accent" />
            <span>تلاوة السورة</span>
          </button>

          {/* Studio Card Shortcut */}
          {onOpenInStudio && ayahs.length > 0 && (
            <button
              onClick={() => setShowAyahPicker(true)}
              className="px-2.5 py-1.5 rounded-xl bg-accent-light/70 border border-accent/30 text-accent font-semibold text-xs hover:bg-accent hover:text-white whitespace-nowrap shrink-0 transition-all cursor-pointer flex items-center gap-1 shadow-xs"
              title="تصميم بطاقة في الاستوديو"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>بطاقة</span>
            </button>
          )}
        </div>

        {/* Surah info and jump trigger */}
        <div className="flex items-center justify-between md:justify-end gap-2 shrink-0 border-t md:border-t-0 border-border/60 pt-2 md:pt-0">
          <button
            onClick={() => setShowJump(!showJump)}
            className="text-primary hover:underline font-mono text-xs font-semibold cursor-pointer px-2 py-1 rounded-lg hover:bg-primary/5 transition-colors whitespace-nowrap"
          >
            صفحة {toArabicNumber(pageNumber)} من ٦٠٤ ▾
          </button>
          <span className="font-alexandria font-bold text-xs text-text bg-surface-elevated px-2.5 py-1 rounded-xl border border-border whitespace-nowrap">
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
        className="relative overflow-hidden bg-[#FAF7F0] dark:bg-[#131920] border-2 border-[#D9CAAF]/80 dark:border-[#2C3540] rounded-3xl p-5 md:p-8 min-h-[500px] flex flex-col justify-between shadow-md transition-colors"
        style={{
          boxShadow: 'inset 0 0 0 6px rgba(198, 166, 107, 0.15), 0 12px 32px rgba(0,0,0,0.06)'
        }}
      >
        {/* Top Page Header in Mushaf */}
        <div className="flex justify-between items-center text-xs text-accent border-b border-[#D9CAAF]/40 dark:border-[#2C3540] pb-2.5 font-sans">
          <span>الجزء {currentJuz}</span>
          <span className="font-alexandria font-bold text-[#14120E] dark:text-[#F5F2EA]">سورة {currentSurah.name}</span>
          <span className="font-mono text-accent">ص {pageNumber}</span>
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
                      <div className="relative py-2.5 px-6 rounded-2xl border-2 border-accent/40 bg-accent-light/50 dark:bg-[#1C2530] text-center max-w-sm mx-auto shadow-xs">
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
                    className={`${fontMode === 'clear' ? 'font-quran-clear' : 'font-quran'} text-[#14120E] dark:text-[#F5F2EA] select-text text-center`}
                    style={{ fontSize: `${fontSizeScale}px` }}
                  >
                    {block.ayahs.map((ayah, aIdx) => {
                      const displayText = cleanAyahText(ayah.text, ayah.numberInSurah, ayah.surah.number);
                      const words = displayText.trim().split(/\s+/).filter(Boolean);
                      const isPlayingInSurah = playingSurahAyah === ayah.numberInSurah && 
                        (playingAudioSurahId ? playingAudioSurahId === block.surahNumber : currentSurah.id === block.surahNumber);
                      const isAyahSelected = (selectedAyah?.surahNumber === block.surahNumber && selectedAyah?.ayahNumber === ayah.numberInSurah) || isPlayingInSurah;

                      return (
                        <span key={`ayah_${block.surahNumber}_${ayah.numberInSurah}_${aIdx}`} className="inline">
                          {words.map((word, wIdx) => {
                            const wordKey = `${block.surahNumber}_${ayah.numberInSurah}_${wIdx}`;
                            const isWordPlaying = playingWordKey === wordKey;
                            const isWordSelected = selectedWord?.surahNumber === block.surahNumber &&
                                                   selectedWord?.ayahNumber === ayah.numberInSurah &&
                                                   selectedWord?.wordIndex === wIdx;

                            return (
                              <span
                                key={`w_${wordKey}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleWordClick(block.surahNumber, block.surahName, ayah.numberInSurah, wIdx, word, displayText, e.currentTarget);
                                }}
                                className={`inline cursor-pointer transition-colors duration-150 select-text ${
                                  isWordSelected || isWordPlaying
                                    ? 'text-[#1B7E6B] dark:text-[#34E7B7] font-bold underline decoration-2 decoration-[#1B7E6B]/60 dark:decoration-[#34E7B7]/70'
                                    : isAyahSelected
                                    ? 'text-[#1B7E6B] dark:text-[#34E7B7] font-semibold'
                                    : 'text-[#14120E] dark:text-[#F5F2EA] hover:text-[#1B7E6B] dark:hover:text-[#34E7B7]'
                                }`}
                                title={`اضغط للاستماع لكلمة «${word}»`}
                              >
                                {word}{' '}
                              </span>
                            );
                          })}

                          {/* Ayah End Bracket: Clicking it selects whole Ayah */}
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAyahClick(block.surahNumber, block.surahName, ayah.numberInSurah, displayText, e.currentTarget);
                            }}
                            className={`inline-flex items-center justify-center mx-1 font-sans font-bold text-xs select-none align-middle cursor-pointer transition-all ${
                              isAyahSelected
                                ? 'text-[#1B7E6B] dark:text-[#34E7B7] scale-110 drop-shadow-xs'
                                : 'text-accent hover:text-[#1B7E6B] dark:hover:text-[#34E7B7]'
                            }`}
                            title="اضغط لتحديد الآية كاملة واستماعها"
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
        <div className="border-t border-[#D9CAAF]/40 dark:border-[#2C3540] pt-2.5 flex items-center justify-between text-[11px] text-[#777F7A] dark:text-[#A1A8A7] px-2 select-none">
          <span className="text-[10px] text-text-muted hidden sm:inline">مجمع الملك فهد لطباعة المصحف الشريف</span>
          <span className="font-mono font-bold text-xs">— {pageNumber} —</span>
          <span className="text-[10px] text-accent font-medium">مصحف المدينة المنورة</span>
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

      
      {/* Mini Floating Action Popover Menu (Near clicked word/ayah) */}
      {(selectedWord || selectedAyah) && !showTafseerModal && (
        <div 
          id="floating-quran-action-menu"
          onClick={(e) => e.stopPropagation()}
          style={
            popoverPos
              ? {
                  position: 'fixed',
                  left: `${popoverPos.x}px`,
                  top: `${popoverPos.y}px`,
                  transform: `translate(-50%, ${popoverPos.placeAbove ? '-100%' : '0'})`,
                }
              : undefined
          }
          className={`z-50 bg-[#151D24]/95 dark:bg-[#0D141C]/95 backdrop-blur-md text-white rounded-full px-3.5 py-2 shadow-2xl flex items-center gap-2 sm:gap-3 border border-emerald-500/30 animate-fade-in max-w-[95vw] overflow-x-auto no-scrollbar whitespace-nowrap transition-all duration-150 ${
            !popoverPos ? 'fixed bottom-24 sm:bottom-28 left-1/2 -translate-x-1/2' : ''
          }`}
          dir="rtl"
        >
          {selectedWord ? (
            /* When a Single Word is selected: Immediate Word Pronunciation & Action */
            <>
              {/* Play Word */}
              <button
                onClick={() => handlePlaySingleWord(selectedWord.surahNumber, selectedWord.ayahNumber, selectedWord.wordIndex)}
                className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 dark:text-emerald-300 hover:text-emerald-200 cursor-pointer transition-colors whitespace-nowrap"
                title={`إعادة نطق كلمة «${selectedWord.wordText}»`}
              >
                <Volume2 className={`w-3.5 h-3.5 ${playingWordKey ? 'animate-bounce text-emerald-300' : ''}`} />
                <span>نطق «{selectedWord.wordText.replace(/[ۖۗۘۙۚۛۜ۩]/g, '').trim()}»</span>
              </button>

              <div className="w-[1px] h-3.5 bg-white/20 shrink-0" />

              {/* Expand to Full Ayah Button */}
              <button
                onClick={() => {
                  setSelectedAyah({
                    surahNumber: selectedWord.surahNumber,
                    surahName: selectedWord.surahName,
                    ayahNumber: selectedWord.ayahNumber,
                    text: selectedWord.fullAyahText,
                  });
                  setSelectedWord(null);
                }}
                className="flex items-center gap-1 text-xs font-semibold text-sky-400 hover:text-sky-300 cursor-pointer transition-colors whitespace-nowrap"
                title="تحديد الآية كاملة"
              >
                <span>الآية كاملة</span>
              </button>

              <div className="w-[1px] h-3.5 bg-white/20 shrink-0" />

              {/* Open التفسير الميسر */}
              <button
                onClick={() => {
                  setSelectedAyah({
                    surahNumber: selectedWord.surahNumber,
                    surahName: selectedWord.surahName,
                    ayahNumber: selectedWord.ayahNumber,
                    text: selectedWord.fullAyahText,
                  });
                  setShowTafseerModal(true);
                }}
                className="flex items-center gap-1.5 text-xs font-semibold hover:text-amber-400 cursor-pointer transition-colors whitespace-nowrap"
                title="التفسير الميسر لمعنى الآية"
              >
                <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                <span>التفسير الميسر</span>
              </button>
            </>
          ) : selectedAyah ? (
            /* When Full Ayah is selected */
            <>
              {/* Play Full Ayah */}
              <button
                onClick={() => handlePlaySingleAyah(selectedAyah.surahNumber, selectedAyah.ayahNumber)}
                className="flex items-center gap-1.5 text-xs font-semibold hover:text-emerald-400 dark:hover:text-emerald-300 cursor-pointer transition-colors whitespace-nowrap"
                title="الاستماع لتلاوة الآية كاملة"
              >
                <Volume2 className={`w-3.5 h-3.5 ${isPlayingSingle ? 'text-emerald-400 animate-pulse' : 'text-emerald-400 dark:text-emerald-300'}`} />
                <span>{isPlayingSingle ? 'جارٍ التلاوة' : 'استماع للآية'}</span>
              </button>

              <div className="w-[1px] h-3.5 bg-white/20 shrink-0" />

              {/* Play Page from here */}
              <button
                onClick={() => {
                  setAudioPlayerMode('page');
                  setPlayingSurahAyah(selectedAyah.ayahNumber);
                  setPlayingAudioSurahId(selectedAyah.surahNumber);
                  setShowSurahPlayer(true);
                }}
                className="flex items-center gap-1 text-xs font-semibold text-emerald-300 hover:text-emerald-200 cursor-pointer transition-colors whitespace-nowrap"
                title="الاستماع للصفحة كاملة بدءاً من هذه الآية"
              >
                <Headphones className="w-3.5 h-3.5" />
                <span>الصفحة كاملة</span>
              </button>

              <div className="w-[1px] h-3.5 bg-white/20 shrink-0" />

              {/* Open التفسير الميسر */}
              <button
                onClick={() => setShowTafseerModal(true)}
                className="flex items-center gap-1.5 text-xs font-semibold hover:text-amber-400 cursor-pointer transition-colors whitespace-nowrap"
                title="التفسير الميسر لمعاني الآية وكلماتها"
              >
                <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                <span>التفسير الميسر</span>
              </button>

              <div className="w-[1px] h-3.5 bg-white/20 shrink-0" />

              {/* Copy */}
              <button
                onClick={() => handleCopyAyah(selectedAyah.text, selectedAyah.surahName, selectedAyah.ayahNumber)}
                className="flex items-center gap-1 text-xs font-semibold hover:text-emerald-400 cursor-pointer transition-colors whitespace-nowrap"
                title="نسخ نص الآية"
              >
                {copiedAyah ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedAyah ? 'تم' : 'نسخ'}</span>
              </button>
            </>
          ) : null}

          <div className="w-[1px] h-3.5 bg-white/20 shrink-0" />

          {/* Dismiss */}
          <button
            onClick={() => {
              setSelectedAyah(null);
              setSelectedWord(null);
              setPopoverPos(null);
            }}
            className="text-white/60 hover:text-white cursor-pointer transition-colors shrink-0"
            title="إلغاء التحديد"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Full Tafseer & Word Meanings Modal */}
      {selectedAyah && showTafseerModal && (
        <AyahActionModal
          isOpen={showTafseerModal}
          onClose={() => setShowTafseerModal(false)}
          surahNumber={selectedAyah.surahNumber}
          surahName={selectedAyah.surahName}
          ayahNumber={selectedAyah.ayahNumber}
          ayahText={selectedAyah.text}
          onOpenInStudio={onOpenInStudio}
        />
      )}

      {/* Quran Audio Player with Page & Surah modes, Offline Download & Auto-Tracking */}
      {showSurahPlayer && (
        <SurahAudioPlayerBar
          mode={audioPlayerMode}
          onModeChange={(m) => setAudioPlayerMode(m)}
          pageNumber={pageNumber}
          pageAyahs={ayahs}
          surah={currentSurah}
          activeAyahNumber={playingSurahAyah || (ayahs.length > 0 ? ayahs[0].numberInSurah : 1)}
          activeSurahNumber={playingAudioSurahId || (ayahs.length > 0 ? ayahs[0].surah.number : currentSurah.id)}
          onAyahChange={(ayahNum, sId) => {
            setPlayingSurahAyah(ayahNum);
            if (sId) setPlayingAudioSurahId(sId);

            if (audioPlayerMode === 'surah') {
              const targetSurahId = sId || currentSurah.id;
              const existsOnPage = ayahs.some((a) => a.surah.number === targetSurahId && a.numberInSurah === ayahNum);
              if (!existsOnPage) {
                getFullQuran().then((fq) => {
                  for (const [pStr, pageAyahsList] of Object.entries(fq)) {
                    if (pageAyahsList.some((a: any) => a.s === targetSurahId && a.a === ayahNum)) {
                      const p = parseInt(pStr, 10);
                      if (p !== pageNumber) {
                        onPageChange(p);
                      }
                      break;
                    }
                  }
                }).catch(() => {});
              }
            }
          }}
          onPageAdvance={() => {
            if (pageNumber < 604) {
              onPageChange(pageNumber + 1);
            }
          }}
          onClose={() => {
            setShowSurahPlayer(false);
            setPlayingSurahAyah(null);
            setPlayingAudioSurahId(null);
          }}
        />
      )}
    </div>
  );
};
