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
  Repeat
} from 'lucide-react';
import { type SurahMeta } from '../../../data/quranSurahs';

interface SurahAudioPlayerBarProps {
  surah: SurahMeta;
  activeAyahNumber: number;
  onAyahChange: (ayahNumber: number) => void;
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
  surah,
  activeAyahNumber,
  onAyahChange,
  onClose,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentAyah, setCurrentAyah] = useState(activeAyahNumber || 1);
  const [reciterId, setReciterId] = useState(() => {
    return localStorage.getItem('maladh_quran_reciter') || 'alafasy';
  });
  const [repeatMode, setRepeatMode] = useState<'none' | 'ayah' | 'surah'>('none');

  // Offline download states
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const currentReciter = QURAN_RECITERS.find((r) => r.id === reciterId) || QURAN_RECITERS[0];

  // Sync currentAyah with activeAyahNumber when changed by parent
  useEffect(() => {
    if (activeAyahNumber && activeAyahNumber !== currentAyah) {
      setCurrentAyah(activeAyahNumber);
    }
  }, [activeAyahNumber]);

  // Check if current surah is already cached offline
  useEffect(() => {
    const checkOfflineCache = async () => {
      if (typeof window === 'undefined' || !('caches' in window)) return;
      try {
        const cache = await caches.open('maladh-quran-audio-cache');
        const firstAyahUrl = getAyahAudioUrl(surah.id, 1, currentReciter.folder);
        const match = await cache.match(firstAyahUrl);
        if (match) {
          setIsDownloaded(true);
        } else {
          setIsDownloaded(false);
        }
      } catch {
        setIsDownloaded(false);
      }
    };
    checkOfflineCache();
  }, [surah.id, currentReciter.folder]);

  // Play audio for currentAyah
  const playCurrentAyah = (ayahNum: number) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audioUrl = getAyahAudioUrl(surah.id, ayahNum, currentReciter.folder);
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
      handleAyahEnded(ayahNum);
    };

    audio.onerror = () => {
      // Fallback url
      const sStr = String(surah.id).padStart(3, '0');
      const aStr = String(ayahNum).padStart(3, '0');
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
        handleAyahEnded(ayahNum);
      };
    };
  };

  const handleAyahEnded = (finishedAyah: number) => {
    if (repeatMode === 'ayah') {
      playCurrentAyah(finishedAyah);
      return;
    }

    if (finishedAyah < surah.ayahCount) {
      const nextAyah = finishedAyah + 1;
      setCurrentAyah(nextAyah);
      onAyahChange(nextAyah);
      playCurrentAyah(nextAyah);
    } else {
      if (repeatMode === 'surah') {
        setCurrentAyah(1);
        onAyahChange(1);
        playCurrentAyah(1);
      } else {
        setIsPlaying(false);
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
      playCurrentAyah(currentAyah);
    }
  };

  // Skip Forward (Next Ayah)
  const handleNextAyah = () => {
    if (currentAyah < surah.ayahCount) {
      const next = currentAyah + 1;
      setCurrentAyah(next);
      onAyahChange(next);
      if (isPlaying) {
        playCurrentAyah(next);
      }
    }
  };

  // Skip Backward (Previous Ayah)
  const handlePrevAyah = () => {
    if (currentAyah > 1) {
      const prev = currentAyah - 1;
      setCurrentAyah(prev);
      onAyahChange(prev);
      if (isPlaying) {
        playCurrentAyah(prev);
      }
    }
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

  // Download entire Surah for 100% offline playback
  const handleDownloadSurahOffline = async () => {
    if (isDownloading || isDownloaded) return;
    if (typeof window === 'undefined' || !('caches' in window)) {
      alert('ميزة التخزين بدون إنترنت مدعومة في المتصفحات الحديثة وتطبيق PWA.');
      return;
    }

    setIsDownloading(true);
    setDownloadProgress(0);

    try {
      const cache = await caches.open('maladh-quran-audio-cache');
      const total = surah.ayahCount;

      for (let i = 1; i <= total; i++) {
        const url = getAyahAudioUrl(surah.id, i, currentReciter.folder);
        // Only fetch if not already cached
        const matched = await cache.match(url);
        if (!matched) {
          try {
            const resp = await fetch(url);
            if (resp.ok) {
              await cache.put(url, resp);
            }
          } catch (e) {
            console.warn(`Failed caching ayah ${i}:`, e);
          }
        }
        setDownloadProgress(Math.round((i / total) * 100));
      }

      setIsDownloaded(true);
      setIsDownloading(false);
    } catch (err) {
      console.error('Surah download failed:', err);
      setIsDownloading(false);
    }
  };

  return (
    <div 
      className="fixed bottom-3 sm:bottom-6 left-3 right-3 sm:left-auto sm:right-6 sm:w-[480px] z-40 bg-surface/95 dark:bg-surface-elevated/95 backdrop-blur-md border-2 border-primary/30 rounded-2xl p-3 sm:p-3.5 shadow-2xl animate-slide-up"
      dir="rtl"
    >
      <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-2 mb-2">
        {/* Surah & Ayah Status */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
            <Volume2 className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h4 className="font-alexandria font-bold text-xs sm:text-sm text-text">
              سورة {surah.name} • الآية {toArabicNumber(currentAyah)}
            </h4>
            <span className="text-[10px] text-text-muted">
              من {toArabicNumber(surah.ayahCount)} آية
            </span>
          </div>
        </div>

        {/* Right side controls: Offline Download & Close */}
        <div className="flex items-center gap-1.5">
          {/* Download for offline button */}
          <button
            onClick={handleDownloadSurahOffline}
            disabled={isDownloading}
            className={`px-2.5 py-1.5 rounded-xl text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer ${
              isDownloaded
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                : isDownloading
                ? 'bg-primary/10 text-primary border border-primary/30'
                : 'bg-surface border border-border text-text hover:border-primary/50'
            }`}
            title={isDownloaded ? 'السورة محفوظة أوفلاين بالكامل' : 'تحميل السورة كاملة للاستماع بدون إنترنت'}
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
                <span>تحميل أوفلاين</span>
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
                playCurrentAyah(currentAyah);
              }
            }}
            className="appearance-none bg-surface border border-border rounded-xl px-2 py-1 pr-1.5 pl-5 text-[11px] font-sans text-text cursor-pointer focus:outline-none focus:border-primary"
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
            disabled={currentAyah <= 1}
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
            title={isPlaying ? 'إيقاف مؤقت' : 'تشغيل السورة'}
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
            disabled={currentAyah >= surah.ayahCount}
            className="w-8 h-8 rounded-xl bg-surface border border-border text-text disabled:opacity-30 disabled:pointer-events-none hover:border-primary/50 flex items-center justify-center cursor-pointer transition-all"
            title="الآية التالية"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        {/* Repeat Mode Toggle */}
        <button
          onClick={() => {
            const next = repeatMode === 'none' ? 'ayah' : repeatMode === 'ayah' ? 'surah' : 'none';
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
              : repeatMode === 'surah' 
              ? 'تكرار السورة كاملة' 
              : 'بدون تكرار'
          }
        >
          <Repeat className="w-3 h-3" />
          <span>{repeatMode === 'ayah' ? 'الآية' : repeatMode === 'surah' ? 'السورة' : 'تكرار'}</span>
        </button>
      </div>
    </div>
  );
};
