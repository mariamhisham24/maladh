import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Download, 
  Check, 
  X, 
  Loader2, 
  Volume2, 
  ChevronDown,
  Repeat,
  FileText,
  BookOpen
} from 'lucide-react';
import { type SurahMeta } from '../../../data/quranSurahs';

export interface ApiAyah {
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

export interface SurahAudioPlayerBarProps {
  mode?: 'page' | 'surah';
  onModeChange?: (mode: 'page' | 'surah') => void;
  pageNumber?: number;
  pageAyahs?: ApiAyah[];
  surah: SurahMeta;
  activeAyahNumber: number;
  activeSurahNumber?: number;
  onAyahChange: (ayahNumber: number, surahNumber?: number) => void;
  onPageAdvance?: () => void;
  onClose: () => void;
}

export const QURAN_RECITERS = [
  { id: 'alafasy', name: 'مشاري العفاسي', folder: 'Alafasy_128kbps' },
  { id: 'husary', name: 'محمود خليل الحصري', folder: 'Husary_128kbps' },
  { id: 'minshawi', name: 'محمد صديق المنشاوي', folder: 'Minshawy_Murattal_128kbps' },
  { id: 'abdulbasit', name: 'عبد الباسط عبد الصمد', folder: 'Abdul_Basit_Murattal_192kbps' },
];

const toArabicNumber = (num: number): string => {
  return num.toLocaleString('ar-EG');
};

export const getAyahAudioUrl = (surahId: number, ayahNumber: number, reciterFolder: string): string => {
  const sStr = String(surahId).padStart(3, '0');
  const aStr = String(ayahNumber).padStart(3, '0');
  return `https://everyayah.com/data/${reciterFolder}/${sStr}${aStr}.mp3`;
};

export const SurahAudioPlayerBar: React.FC<SurahAudioPlayerBarProps> = ({
  mode = 'page',
  onModeChange,
  pageNumber = 1,
  pageAyahs = [],
  surah,
  activeAyahNumber,
  activeSurahNumber,
  onAyahChange,
  onPageAdvance,
  onClose,
}) => {
  const [currentMode, setCurrentMode] = useState<'page' | 'surah'>(mode);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Page mode state: index in pageAyahs (0 to pageAyahs.length - 1)
  const [pageAyahIndex, setPageAyahIndex] = useState(() => {
    if (pageAyahs.length > 0 && activeAyahNumber) {
      const idx = pageAyahs.findIndex(
        (a) => a.numberInSurah === activeAyahNumber && (!activeSurahNumber || a.surah.number === activeSurahNumber)
      );
      return idx >= 0 ? idx : 0;
    }
    return 0;
  });

  // Surah mode state: ayah number (1 to surah.ayahCount)
  const [currentSurahAyah, setCurrentSurahAyah] = useState(activeAyahNumber || 1);

  const [reciterId, setReciterId] = useState(() => {
    return localStorage.getItem('maladh_quran_reciter') || 'alafasy';
  });
  const [repeatMode, setRepeatMode] = useState<'none' | 'ayah' | 'all'>('none');
  const [autoAdvancePage, setAutoAdvancePage] = useState(true);

  // Offline download states
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentReciter = QURAN_RECITERS.find((r) => r.id === reciterId) || QURAN_RECITERS[0];

  // Keep internal mode in sync with prop
  useEffect(() => {
    if (mode && mode !== currentMode) {
      setCurrentMode(mode);
    }
  }, [mode]);

  // When activeAyahNumber changes externally, update internal index
  useEffect(() => {
    if (currentMode === 'page' && pageAyahs.length > 0) {
      const idx = pageAyahs.findIndex(
        (a) => a.numberInSurah === activeAyahNumber && (!activeSurahNumber || a.surah.number === activeSurahNumber)
      );
      if (idx >= 0 && idx !== pageAyahIndex) {
        setPageAyahIndex(idx);
      }
    } else if (currentMode === 'surah') {
      if (activeAyahNumber && activeAyahNumber !== currentSurahAyah) {
        setCurrentSurahAyah(activeAyahNumber);
      }
    }
  }, [activeAyahNumber, activeSurahNumber, currentMode, pageAyahs]);

  // Check if current target (page or surah) is cached offline
  useEffect(() => {
    const checkOfflineCache = async () => {
      if (typeof window === 'undefined' || !('caches' in window)) return;
      try {
        const cache = await caches.open('maladh-quran-audio-cache');
        if (currentMode === 'page' && pageAyahs.length > 0) {
          const first = pageAyahs[0];
          const match = await cache.match(getAyahAudioUrl(first.surah.number, first.numberInSurah, currentReciter.folder));
          setIsDownloaded(Boolean(match));
        } else {
          const firstAyahUrl = getAyahAudioUrl(surah.id, 1, currentReciter.folder);
          const match = await cache.match(firstAyahUrl);
          setIsDownloaded(Boolean(match));
        }
      } catch {
        setIsDownloaded(false);
      }
    };
    checkOfflineCache();
  }, [currentMode, surah.id, pageAyahs, currentReciter.folder]);

  // Play audio for a specific surah & ayah
  const playAyahAudio = (sId: number, aNum: number) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audioUrl = getAyahAudioUrl(sId, aNum, currentReciter.folder);
    setIsLoading(true);

    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    audio.oncanplay = () => {
      setIsLoading(false);
      audio.play().catch(() => {
        setIsLoading(false);
        setIsPlaying(false);
      });
      setIsPlaying(true);
    };

    audio.onended = () => {
      handleAudioEnded(sId, aNum);
    };

    audio.onerror = () => {
      // Fallback url
      const sStr = String(sId).padStart(3, '0');
      const aStr = String(aNum).padStart(3, '0');
      const fallbackUrl = `https://verses.quran.com/Alafasy/mp3/${sStr}${aStr}.mp3`;
      const fallbackAudio = new Audio(fallbackUrl);
      audioRef.current = fallbackAudio;

      fallbackAudio.play().then(() => {
        setIsPlaying(true);
        setIsLoading(false);
      }).catch(() => {
        setIsPlaying(false);
        setIsLoading(false);
      });

      fallbackAudio.onended = () => {
        handleAudioEnded(sId, aNum);
      };
    };
  };

  const handleAudioEnded = (sId: number, aNum: number) => {
    if (repeatMode === 'ayah') {
      playAyahAudio(sId, aNum);
      return;
    }

    if (currentMode === 'page') {
      // PAGE MODE SEQUENCING
      if (pageAyahIndex < pageAyahs.length - 1) {
        const nextIdx = pageAyahIndex + 1;
        setPageAyahIndex(nextIdx);
        const nextAyah = pageAyahs[nextIdx];
        onAyahChange(nextAyah.numberInSurah, nextAyah.surah.number);
        playAyahAudio(nextAyah.surah.number, nextAyah.numberInSurah);
      } else {
        // Reached end of page!
        if (repeatMode === 'all') {
          // Loop current page
          setPageAyahIndex(0);
          const first = pageAyahs[0];
          onAyahChange(first.numberInSurah, first.surah.number);
          playAyahAudio(first.surah.number, first.numberInSurah);
        } else if (autoAdvancePage && onPageAdvance) {
          // Advance to next page automatically!
          onPageAdvance();
        } else {
          setIsPlaying(false);
        }
      }
    } else {
      // SURAH MODE SEQUENCING
      if (currentSurahAyah < surah.ayahCount) {
        const nextAyah = currentSurahAyah + 1;
        setCurrentSurahAyah(nextAyah);
        onAyahChange(nextAyah, surah.id);
        playAyahAudio(surah.id, nextAyah);
      } else {
        if (repeatMode === 'all') {
          setCurrentSurahAyah(1);
          onAyahChange(1, surah.id);
          playAyahAudio(surah.id, 1);
        } else {
          setIsPlaying(false);
        }
      }
    }
  };

  // Toggle Play / Pause
  const handleTogglePlay = () => {
    if (isPlaying) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setIsPlaying(false);
    } else {
      if (currentMode === 'page') {
        const currentAyah = pageAyahs[pageAyahIndex] || pageAyahs[0];
        if (currentAyah) {
          onAyahChange(currentAyah.numberInSurah, currentAyah.surah.number);
          playAyahAudio(currentAyah.surah.number, currentAyah.numberInSurah);
        }
      } else {
        onAyahChange(currentSurahAyah, surah.id);
        playAyahAudio(surah.id, currentSurahAyah);
      }
    }
  };

  // Skip Forward (Next Ayah)
  const handleNextAyah = () => {
    if (currentMode === 'page') {
      if (pageAyahIndex < pageAyahs.length - 1) {
        const nextIdx = pageAyahIndex + 1;
        setPageAyahIndex(nextIdx);
        const next = pageAyahs[nextIdx];
        onAyahChange(next.numberInSurah, next.surah.number);
        if (isPlaying) {
          playAyahAudio(next.surah.number, next.numberInSurah);
        }
      } else if (onPageAdvance) {
        onPageAdvance();
      }
    } else {
      if (currentSurahAyah < surah.ayahCount) {
        const next = currentSurahAyah + 1;
        setCurrentSurahAyah(next);
        onAyahChange(next, surah.id);
        if (isPlaying) {
          playAyahAudio(surah.id, next);
        }
      }
    }
  };

  // Skip Backward (Previous Ayah)
  const handlePrevAyah = () => {
    if (currentMode === 'page') {
      if (pageAyahIndex > 0) {
        const prevIdx = pageAyahIndex - 1;
        setPageAyahIndex(prevIdx);
        const prev = pageAyahs[prevIdx];
        onAyahChange(prev.numberInSurah, prev.surah.number);
        if (isPlaying) {
          playAyahAudio(prev.surah.number, prev.numberInSurah);
        }
      }
    } else {
      if (currentSurahAyah > 1) {
        const prev = currentSurahAyah - 1;
        setCurrentSurahAyah(prev);
        onAyahChange(prev, surah.id);
        if (isPlaying) {
          playAyahAudio(surah.id, prev);
        }
      }
    }
  };

  // Switch between Page mode and Surah mode
  const handleSwitchMode = (targetMode: 'page' | 'surah') => {
    if (targetMode === currentMode) return;
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlaying(false);
    setCurrentMode(targetMode);
    onModeChange?.(targetMode);
  };

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Download entire current Page or Surah for offline playback
  const handleDownloadOffline = async () => {
    if (isDownloading || isDownloaded) return;
    if (typeof window === 'undefined' || !('caches' in window)) {
      alert('ميزة التخزين بدون إنترنت مدعومة في المتصفحات الحديثة وتطبيق PWA.');
      return;
    }

    setIsDownloading(true);
    setDownloadProgress(0);

    try {
      const cache = await caches.open('maladh-quran-audio-cache');

      if (currentMode === 'page') {
        const total = pageAyahs.length;
        for (let i = 0; i < total; i++) {
          const item = pageAyahs[i];
          const url = getAyahAudioUrl(item.surah.number, item.numberInSurah, currentReciter.folder);
          const matched = await cache.match(url);
          if (!matched) {
            try {
              const resp = await fetch(url);
              if (resp.ok) await cache.put(url, resp);
            } catch {}
          }
          setDownloadProgress(Math.round(((i + 1) / total) * 100));
        }
      } else {
        const total = surah.ayahCount;
        for (let i = 1; i <= total; i++) {
          const url = getAyahAudioUrl(surah.id, i, currentReciter.folder);
          const matched = await cache.match(url);
          if (!matched) {
            try {
              const resp = await fetch(url);
              if (resp.ok) await cache.put(url, resp);
            } catch {}
          }
          setDownloadProgress(Math.round((i / total) * 100));
        }
      }

      setIsDownloaded(true);
      setIsDownloading(false);
    } catch (err) {
      console.error('Audio download failed:', err);
      setIsDownloading(false);
    }
  };

  const currentDisplayAyah = currentMode === 'page' 
    ? (pageAyahs[pageAyahIndex] || pageAyahs[0])
    : null;

  return (
    <div 
      className="fixed bottom-3 sm:bottom-6 left-3 right-3 sm:left-auto sm:right-6 sm:w-[500px] z-40 bg-surface/95 dark:bg-surface-elevated/95 backdrop-blur-md border-2 border-primary/30 rounded-2xl p-3 sm:p-3.5 shadow-2xl animate-slide-up"
      dir="rtl"
    >
      {/* Top Header: Mode Switcher & Title */}
      <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-2 mb-2">
        {/* Mode Switcher Tabs */}
        <div className="flex items-center gap-1 bg-surface-elevated dark:bg-surface border border-border/70 p-0.5 rounded-xl">
          <button
            onClick={() => handleSwitchMode('page')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
              currentMode === 'page'
                ? 'bg-primary text-white shadow-xs'
                : 'text-text-muted hover:text-text'
            }`}
          >
            <FileText className="w-3 h-3" />
            <span>الصفحة ({toArabicNumber(pageNumber)})</span>
          </button>
          <button
            onClick={() => handleSwitchMode('surah')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
              currentMode === 'surah'
                ? 'bg-primary text-white shadow-xs'
                : 'text-text-muted hover:text-text'
            }`}
          >
            <BookOpen className="w-3 h-3" />
            <span>السورة</span>
          </button>
        </div>

        {/* Right side controls: Offline Download & Close */}
        <div className="flex items-center gap-1.5">
          {/* Download for offline button */}
          <button
            onClick={handleDownloadOffline}
            disabled={isDownloading}
            className={`px-2 py-1 rounded-xl text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer ${
              isDownloaded
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                : isDownloading
                ? 'bg-primary/10 text-primary border border-primary/30'
                : 'bg-surface border border-border text-text hover:border-primary/50'
            }`}
            title={isDownloaded ? 'المقطع الصوتي محفوظ أوفلاين' : 'تحميل المقطع للاستماع بدون إنترنت'}
          >
            {isDownloading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                <span>{downloadProgress}%</span>
              </>
            ) : isDownloaded ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>أوفلاين ✓</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">تحميل أوفلاين</span>
              </>
            )}
          </button>

          {/* Close button */}
          <button
            onClick={() => {
              if (audioRef.current) {
                audioRef.current.pause();
              }
              setIsPlaying(false);
              onClose();
            }}
            className="w-7 h-7 rounded-full bg-surface border border-border text-text-muted hover:text-text flex items-center justify-center cursor-pointer transition-colors"
            title="إغلاق المشغل"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Track Info Banner */}
      <div className="flex items-center gap-2 mb-2.5 px-0.5">
        <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <Volume2 className={`w-4 h-4 ${isPlaying ? 'animate-pulse text-emerald-600 dark:text-emerald-400' : ''}`} />
        </div>
        <div className="min-w-0 flex-1">
          {currentMode === 'page' && currentDisplayAyah ? (
            <>
              <h4 className="font-alexandria font-bold text-xs sm:text-sm text-text truncate">
                صفحة {toArabicNumber(pageNumber)} · سورة {currentDisplayAyah.surah.name} • آية {toArabicNumber(currentDisplayAyah.numberInSurah)}
              </h4>
              <span className="text-[10px] text-text-muted">
                الآية {toArabicNumber(pageAyahIndex + 1)} من {toArabicNumber(pageAyahs.length)} بالصفحة
              </span>
            </>
          ) : (
            <>
              <h4 className="font-alexandria font-bold text-xs sm:text-sm text-text truncate">
                سورة {surah.name} • الآية {toArabicNumber(currentSurahAyah)}
              </h4>
              <span className="text-[10px] text-text-muted">
                من {toArabicNumber(surah.ayahCount)} آية
              </span>
            </>
          )}
        </div>

        {/* Auto Page Advance indicator in page mode */}
        {currentMode === 'page' && onPageAdvance && (
          <button
            onClick={() => setAutoAdvancePage((prev) => !prev)}
            className={`text-[10px] px-2 py-1 rounded-lg border font-sans transition-all cursor-pointer ${
              autoAdvancePage
                ? 'bg-primary/10 border-primary/30 text-primary font-semibold'
                : 'bg-surface border-border text-text-muted'
            }`}
            title="الانتقال التلقائي للصفحة التالية عند انتهاء تلاوة الصفحة"
          >
            <span>التالي تلقائياً: {autoAdvancePage ? 'مفعل' : 'معطل'}</span>
          </button>
        )}
      </div>

      {/* Main Playback Bar Controls */}
      <div className="flex items-center justify-between gap-2">
        {/* Reciter Selector */}
        <div className="relative">
          <select
            value={reciterId}
            onChange={(e) => {
              const newRec = e.target.value;
              setReciterId(newRec);
              localStorage.setItem('maladh_quran_reciter', newRec);
              if (isPlaying) {
                if (currentMode === 'page') {
                  const curr = pageAyahs[pageAyahIndex];
                  if (curr) playAyahAudio(curr.surah.number, curr.numberInSurah);
                } else {
                  playAyahAudio(surah.id, currentSurahAyah);
                }
              }
            }}
            className="appearance-none bg-surface border border-border rounded-xl px-2 py-1.5 pr-2 pl-6 text-[11px] font-sans text-text cursor-pointer focus:outline-none focus:border-primary"
          >
            {QURAN_RECITERS.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3 h-3 text-text-muted absolute left-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Playback Buttons: Prev, Play/Pause, Next */}
        <div className="flex items-center gap-1.5">
          {/* Previous Ayah */}
          <button
            onClick={handlePrevAyah}
            disabled={currentMode === 'page' ? pageAyahIndex <= 0 : currentSurahAyah <= 1}
            className="w-8 h-8 rounded-xl bg-surface border border-border text-text disabled:opacity-30 disabled:pointer-events-none hover:border-primary/50 flex items-center justify-center cursor-pointer transition-all"
            title="الآية السابقة"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          {/* Play / Pause Toggle */}
          <button
            onClick={handleTogglePlay}
            disabled={isLoading}
            className="w-10 h-10 rounded-xl bg-primary text-white hover:bg-primary/95 flex items-center justify-center cursor-pointer shadow-md active:scale-95 transition-all"
            title={isPlaying ? 'إيقاف مؤقت' : 'بدء التلاوة'}
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : isPlaying ? (
              <Pause className="w-5 h-5 fill-white" />
            ) : (
              <Play className="w-5 h-5 fill-white" />
            )}
          </button>

          {/* Next Ayah */}
          <button
            onClick={handleNextAyah}
            disabled={currentMode === 'page' ? (pageAyahIndex >= pageAyahs.length - 1 && !onPageAdvance) : currentSurahAyah >= surah.ayahCount}
            className="w-8 h-8 rounded-xl bg-surface border border-border text-text disabled:opacity-30 disabled:pointer-events-none hover:border-primary/50 flex items-center justify-center cursor-pointer transition-all"
            title="الآية التالية"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        {/* Repeat Mode Toggle */}
        <button
          onClick={() => {
            const next = repeatMode === 'none' ? 'ayah' : repeatMode === 'ayah' ? 'all' : 'none';
            setRepeatMode(next);
          }}
          className={`px-2 py-1 rounded-xl text-[10px] font-semibold flex items-center gap-1 border transition-all cursor-pointer ${
            repeatMode !== 'none'
              ? 'bg-accent/15 border-accent text-accent'
              : 'bg-surface border-border text-text-muted hover:text-text'
          }`}
          title={
            repeatMode === 'ayah' 
              ? 'تكرار الآية الحالية' 
              : repeatMode === 'all' 
              ? (currentMode === 'page' ? 'تكرار الصفحة كاملة' : 'تكرار السورة كاملة') 
              : 'بدون تكرار'
          }
        >
          <Repeat className="w-3 h-3" />
          <span>{repeatMode === 'ayah' ? 'الآية' : repeatMode === 'all' ? (currentMode === 'page' ? 'الصفحة' : 'السورة') : 'تكرار'}</span>
        </button>
      </div>
    </div>
  );
};
