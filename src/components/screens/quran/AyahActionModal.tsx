import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Volume2, 
  BookOpen, 
  Sparkles, 
  Copy, 
  Check, 
  Loader2, 
  Play, 
  Square, 
  ChevronDown
} from 'lucide-react';

interface AyahActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  surahNumber: number;
  surahName: string;
  ayahNumber: number;
  ayahText: string;
  onOpenInStudio?: (text: string, source: string) => void;
}

export const RECITERS = [
  { id: 'alafasy', name: 'مشاري راشد العفاسي', folder: 'Alafasy_128kbps' },
  { id: 'husary', name: 'محمود خليل الحصري', folder: 'Husary_128kbps' },
  { id: 'minshawi', name: 'محمد صديق المنشاوي', folder: 'Minshawy_Murattal_128kbps' },
  { id: 'abdulbasit', name: 'عبد الباسط عبد الصمد', folder: 'Abdul_Basit_Murattal_192kbps' },
];

const toArabicNumber = (num: number): string => {
  return num.toLocaleString('ar-EG');
};

export const AyahActionModal: React.FC<AyahActionModalProps> = ({
  isOpen,
  onClose,
  surahNumber,
  surahName,
  ayahNumber,
  ayahText,
  onOpenInStudio,
}) => {
  const [activeTab, setActiveTab] = useState<'tafseer' | 'words'>('tafseer');
  const [selectedReciter, setSelectedReciter] = useState(() => {
    return localStorage.getItem('maladh_quran_reciter') || RECITERS[0].id;
  });
  const [isPlayingAyah, setIsPlayingAyah] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [playingWordIndex, setPlayingWordIndex] = useState<number | null>(null);
  const [isAutoWordSequence, setIsAutoWordSequence] = useState(false);

  const [tafseerText, setTafseerText] = useState<string | null>(null);
  const [isLoadingTafseer, setIsLoadingTafseer] = useState(false);
  const [tafseerError, setTafseerError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const wordAudioRef = useRef<HTMLAudioElement | null>(null);
  const isAutoWordRef = useRef(false);

  const surahPadded = String(surahNumber).padStart(3, '0');
  const ayahPadded = String(ayahNumber).padStart(3, '0');

  // Clean words list with waqf marks attached so word indices match audio files 100%!
  const cleanedText = ayahText
    .replace(/[٠-٩0-9\u0660-\u0669\(\)﴿﴾۝]/g, '')
    .replace(/\s+([ۖۗۘۙۚۛۜ۩])/g, '$1')
    .replace(/([۞])\s+/g, '$1')
    .trim();
  const words = cleanedText.split(/\s+/).filter(Boolean);

  const reciterMeta = RECITERS.find((r) => r.id === selectedReciter) || RECITERS[0];

  // Stop any playing audio when modal closes or ayah changes
  useEffect(() => {
    return () => {
      isAutoWordRef.current = false;
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (wordAudioRef.current) {
        wordAudioRef.current.pause();
        wordAudioRef.current = null;
      }
      setIsPlayingAyah(false);
      setPlayingWordIndex(null);
      setIsAutoWordSequence(false);
    };
  }, [isOpen, surahNumber, ayahNumber]);

  // Load Tafseer when Ayah is selected
  useEffect(() => {
    if (!isOpen || !surahNumber || !ayahNumber) return;

    let isMounted = true;
    const cacheKey = `maladh_tafseer_${surahNumber}_${ayahNumber}`;
    const cached = localStorage.getItem(cacheKey);

    if (cached) {
      setTafseerText(cached);
      setIsLoadingTafseer(false);
      setTafseerError(null);
      return;
    }

    setIsLoadingTafseer(true);
    setTafseerError(null);

    fetch(`https://api.alquran.cloud/v1/ayah/${surahNumber}:${ayahNumber}/ar.muyassar`)
      .then((res) => {
        if (!res.ok) throw new Error('فشل جلب التفسير');
        return res.json();
      })
      .then((data) => {
        if (!isMounted) return;
        const text = data?.data?.text || '';
        if (text) {
          setTafseerText(text);
          localStorage.setItem(cacheKey, text);
        } else {
          throw new Error('التفسير غير متاح حالياً');
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        setTafseerError(err.message || 'تعذر تحميل التفسير');
      })
      .finally(() => {
        if (isMounted) setIsLoadingTafseer(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, surahNumber, ayahNumber]);

  // Toggle Ayah Audio
  const togglePlayAyah = () => {
    if (isPlayingAyah) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setIsPlayingAyah(false);
      return;
    }

    // Stop word audio if playing
    isAutoWordRef.current = false;
    setIsAutoWordSequence(false);
    if (wordAudioRef.current) {
      wordAudioRef.current.pause();
      setPlayingWordIndex(null);
    }

    const audioUrl = `https://everyayah.com/data/${reciterMeta.folder}/${surahPadded}${ayahPadded}.mp3`;
    setIsLoadingAudio(true);

    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    audio.oncanplay = () => {
      setIsLoadingAudio(false);
      audio.play().catch(() => {
        setIsPlayingAyah(false);
        setIsLoadingAudio(false);
      });
      setIsPlayingAyah(true);
    };

    audio.onended = () => {
      setIsPlayingAyah(false);
      setIsLoadingAudio(false);
    };

    audio.onerror = () => {
      // Fallback to Quran.com CDN
      const fallbackUrl = `https://verses.quran.com/Alafasy/mp3/${surahPadded}${ayahPadded}.mp3`;
      const fallbackAudio = new Audio(fallbackUrl);
      audioRef.current = fallbackAudio;
      fallbackAudio.play().then(() => {
        setIsPlayingAyah(true);
        setIsLoadingAudio(false);
      }).catch(() => {
        setIsPlayingAyah(false);
        setIsLoadingAudio(false);
      });
    };
  };

  // Play Single Word Audio with optional callback for sequential playback
  const playWordAudio = (wordIdx: number, onEnd?: () => void) => {
    // Stop ayah audio if playing
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlayingAyah(false);
    }
    if (wordAudioRef.current) {
      wordAudioRef.current.pause();
    }

    const wordNumberPadded = String(wordIdx + 1).padStart(3, '0');
    const wordUrl = `https://audio.qurancdn.com/wbw/${surahPadded}_${ayahPadded}_${wordNumberPadded}.mp3`;

    const audio = new Audio(wordUrl);
    wordAudioRef.current = audio;
    setPlayingWordIndex(wordIdx);

    audio.play().catch(() => {
      setPlayingWordIndex(null);
      onEnd?.();
    });

    audio.onended = () => {
      setPlayingWordIndex(null);
      onEnd?.();
    };

    audio.onerror = () => {
      setPlayingWordIndex(null);
      onEnd?.();
    };
  };

  // Play Words Sequentially one by one
  const handleToggleAutoWordSequence = () => {
    if (isAutoWordSequence) {
      isAutoWordRef.current = false;
      setIsAutoWordSequence(false);
      if (wordAudioRef.current) {
        wordAudioRef.current.pause();
      }
      setPlayingWordIndex(null);
      return;
    }

    isAutoWordRef.current = true;
    setIsAutoWordSequence(true);

    const playSequential = (idx: number) => {
      if (!isAutoWordRef.current || idx >= words.length) {
        isAutoWordRef.current = false;
        setIsAutoWordSequence(false);
        setPlayingWordIndex(null);
        return;
      }
      playWordAudio(idx, () => {
        if (isAutoWordRef.current) {
          setTimeout(() => playSequential(idx + 1), 150);
        }
      });
    };

    playSequential(0);
  };

  // Copy Ayah Text
  const handleCopy = () => {
    const formatted = `﴿ ${ayahText.trim()} ﴾\n[سورة ${surahName} - الآية ${toArabicNumber(ayahNumber)}]`;
    navigator.clipboard.writeText(formatted).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (!isOpen) return null;

  return (
    <div 
      role="dialog"
      aria-modal="true"
      className="ayah-action-modal fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in" 
      dir="rtl"
    >
      {/* Backdrop tap to close */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Main Bottom Sheet / Modal Dialog */}
      <div 
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-xl bg-surface border-t sm:border border-border rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[85vh] animate-slide-up sm:animate-scale-in"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-surface-elevated">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
              {toArabicNumber(ayahNumber)}
            </div>
            <div>
              <h4 className="font-alexandria font-bold text-sm text-text">
                سورة {surahName}
              </h4>
              <p className="text-[11px] text-text-muted">
                الآية الكريمة {toArabicNumber(ayahNumber)}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface hover:bg-border text-text-muted hover:text-text flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Ayah Text Card with Real-Time Audio Highlighting & Tracking */}
          <div 
            className={`p-4 rounded-2xl border text-center transition-all duration-200 ${
              isPlayingAyah
                ? 'bg-[#1B7E6B]/5 dark:bg-[#34E7B7]/10 border-[#1B7E6B] dark:border-[#34E7B7] ring-2 ring-[#1B7E6B]/25 dark:ring-[#34E7B7]/30 shadow-md'
                : 'bg-[#FAF7F0] dark:bg-[#141A22] border-[#D9CAAF]/60 dark:border-[#2C3540] shadow-xs'
            }`}
          >
            {/* Live Recitation Indicator */}
            {isPlayingAyah && (
              <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-[#1B7E6B] dark:text-[#34E7B7] mb-2 animate-pulse">
                <Volume2 className="w-4 h-4" />
                <span>جارٍ الاستماع لتلاوة الآية كاملة ({reciterMeta.name})</span>
              </div>
            )}

            {/* Interactive Ayah Words with Real-time Highlighting */}
            <p className="font-quran text-xl sm:text-2xl leading-[2.6] select-text">
              {words.map((word, wIdx) => {
                const isWordPlaying = playingWordIndex === wIdx;
                return (
                  <span
                    key={`modal_w_${wIdx}_${word}`}
                    onClick={() => playWordAudio(wIdx)}
                    className={`inline-block mx-0.5 px-1 rounded-lg cursor-pointer transition-all duration-150 ${
                      isWordPlaying
                        ? 'text-[#1B7E6B] dark:text-[#34E7B7] font-bold bg-[#1B7E6B]/20 dark:bg-[#34E7B7]/25 scale-110 underline decoration-2 decoration-[#1B7E6B]/60 dark:decoration-[#34E7B7]/70'
                        : isPlayingAyah
                        ? 'text-[#1B7E6B] dark:text-[#34E7B7] font-semibold'
                        : 'text-[#14120E] dark:text-[#FAF6EE] hover:text-[#1B7E6B] dark:hover:text-[#34E7B7] hover:bg-black/5 dark:hover:bg-white/5'
                    }`}
                    title={`اضغط لنطق كلمة «${word.replace(/[ۖۗۘۙۚۛۜ۩]/g, '').trim()}»`}
                  >
                    {word}{' '}
                  </span>
                );
              })}
            </p>
          </div>

          {/* Quick Action Toolbar (Play, Reciter, Copy, Studio Card) */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-2xl bg-surface-elevated border border-border">
            {/* Play Ayah Button & Reciter */}
            <div className="flex items-center gap-2">
              <button
                onClick={togglePlayAyah}
                disabled={isLoadingAudio}
                className={`px-3.5 py-2 rounded-xl flex items-center gap-2 text-xs font-semibold cursor-pointer transition-all ${
                  isPlayingAyah
                    ? 'bg-red-500 text-white shadow-xs animate-pulse'
                    : 'bg-primary text-white hover:bg-primary/95 shadow-xs'
                }`}
                title="الاستماع لتلاوة الآية كاملة"
              >
                {isLoadingAudio ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isPlayingAyah ? (
                  <Square className="w-4 h-4 fill-white" />
                ) : (
                  <Play className="w-4 h-4 fill-white" />
                )}
                <span>{isPlayingAyah ? 'إيقاف' : 'استماع للآية'}</span>
              </button>

              {/* Reciter Selector */}
              <div className="relative" onClick={(e) => e.stopPropagation()}>
                <select
                  value={selectedReciter}
                  onChange={(e) => {
                    const newRec = e.target.value;
                    setSelectedReciter(newRec);
                    localStorage.setItem('maladh_quran_reciter', newRec);
                    if (isPlayingAyah && audioRef.current) {
                      audioRef.current.pause();
                      setIsPlayingAyah(false);
                    }
                  }}
                  className="appearance-none bg-surface border border-border rounded-xl px-2.5 py-2 pr-2 pl-6 text-[11px] font-sans text-text cursor-pointer focus:outline-none focus:border-primary"
                >
                  {RECITERS.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3 h-3 text-text-muted absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Action Buttons: Copy & Studio */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleCopy}
                className="px-2.5 py-2 rounded-xl border border-border bg-surface hover:border-primary/40 text-text text-xs font-semibold cursor-pointer flex items-center gap-1 transition-all"
                title="نسخ نص الآية"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5 text-text-muted" />}
                <span>{copied ? 'تم النسخ' : 'نسخ'}</span>
              </button>

              {onOpenInStudio && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenInStudio(ayahText, `سورة ${surahName} - الآية ${toArabicNumber(ayahNumber)}`);
                  }}
                  className="px-2.5 py-2 rounded-xl bg-accent-light border border-accent/40 text-accent text-xs font-semibold hover:bg-accent hover:text-white cursor-pointer flex items-center gap-1 transition-all"
                  title="تصميم بطاقة دعوية في الاستوديو"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>بطاقة</span>
                </button>
              )}
            </div>
          </div>

          {/* Tabs: التفسير الميسر vs استماع الكلمات (Word-by-Word) */}
          <div className="flex items-center gap-2 border-b border-border pb-2">
            <button
              onClick={() => setActiveTab('tafseer')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                activeTab === 'tafseer'
                  ? 'bg-primary/10 text-primary border border-primary/30'
                  : 'text-text-muted hover:text-text'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>التفسير الميسر</span>
            </button>

            <button
              onClick={() => setActiveTab('words')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                activeTab === 'words'
                  ? 'bg-primary/10 text-primary border border-primary/30'
                  : 'text-text-muted hover:text-text'
              }`}
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>نطق الكلمات (كلمة كلمة)</span>
            </button>
          </div>

          {/* Tab 1: التفسير الميسر */}
          {activeTab === 'tafseer' && (
            <div className="animate-fade-in space-y-2">
              <div className="flex items-center justify-between text-xs text-text-muted font-sans">
                <span>تفسير الآية الكريمة:</span>
                <span className="text-[10px] text-accent font-semibold">مجمع الملك فهد</span>
              </div>

              {isLoadingTafseer ? (
                <div className="py-8 flex flex-col items-center justify-center gap-2 text-text-muted">
                  <Loader2 className="w-6 h-6 text-primary animate-spin" />
                  <span className="text-xs">جاري تحميل التفسير الميسر...</span>
                </div>
              ) : tafseerError ? (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-500 text-center">
                  {tafseerError}
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-surface-elevated border border-border leading-relaxed text-xs sm:text-sm text-text font-sans select-text">
                  {tafseerText}
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Word-by-Word Interactive Audio Chips & Auto-play */}
          {activeTab === 'words' && (
            <div className="animate-fade-in space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-text-muted font-sans">
                  💡 اضغط على أي كلمة للاستماع لنطقها أو اضغط تشغيل بالتتابع:
                </p>
                <button
                  onClick={handleToggleAutoWordSequence}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    isAutoWordSequence
                      ? 'bg-red-500 text-white animate-pulse'
                      : 'bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20'
                  }`}
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>{isAutoWordSequence ? 'إيقاف التتابع' : 'تشغيل الكلمات بالتتابع'}</span>
                </button>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 p-3 rounded-2xl bg-surface-elevated border border-border">
                {words.map((word, wIdx) => {
                  const isPlayingThis = playingWordIndex === wIdx;
                  return (
                    <button
                      key={`word_${wIdx}_${word}`}
                      onClick={() => playWordAudio(wIdx)}
                      className={`px-3 py-1.5 rounded-xl text-base sm:text-lg font-quran transition-all cursor-pointer border ${
                        isPlayingThis
                          ? 'bg-[#1B7E6B] dark:bg-[#34E7B7] text-white dark:text-black border-transparent scale-105 shadow-sm font-bold'
                          : 'bg-surface border-border text-text hover:border-primary/40 hover:bg-primary/5'
                      }`}
                      title="اضغط لسماع نطق الكلمة"
                    >
                      {word}
                      {isPlayingThis && (
                        <span className="inline-block mr-1 text-xs animate-bounce">🔊</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
