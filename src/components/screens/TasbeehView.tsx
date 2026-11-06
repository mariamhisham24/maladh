import React, { useState, useEffect, useRef } from 'react';
import { TASBEEH_PRESETS } from '../../data/seedData';
import { 
  Sparkles, RotateCcw, Undo2, Vibrate, Volume2, VolumeX, 
  ListFilter, Plus, Trash2, Check, X, BookmarkCheck 
} from 'lucide-react';
import { db } from '../../db';

interface TasbeehViewProps {
  initialDhikr?: string;
  initialTarget?: number;
}

interface CustomDhikr {
  id: string;
  text: string;
  defaultTarget: number;
}

const STORAGE_CUSTOM_DHIKRS = 'maladh_custom_dhikrs_list';
const STORAGE_SOUND_KEY = 'maladh_tasbeeh_sound';
const STORAGE_VIB_KEY = 'maladh_vibration';

// Gentle synthetic wooden/water drop click via Web Audio API (Offline & Zero-Asset)
const playSoftClick = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(540, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(240, ctx.currentTime + 0.035);

    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.035);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.04);
  } catch {
    // audio context blocked by browser policy until interaction
  }
};

export const TasbeehView: React.FC<TasbeehViewProps> = ({ 
  initialDhikr = 'سُبْحَانَ اللَّهِ', 
  initialTarget = 33 
}) => {
  const [selectedDhikr, setSelectedDhikr] = useState<string>(initialDhikr);
  const [targetCount, setTargetCount] = useState<number>(initialTarget);
  const [currentCount, setCurrentCount] = useState<number>(0);
  const [completedRounds, setCompletedRounds] = useState<number>(0);
  const [cumulativeTotal, setCumulativeTotal] = useState<number>(0);
  const [history, setHistory] = useState<number[]>([]);
  
  // Preferences
  const [vibrationEnabled, setVibrationEnabled] = useState<boolean>(true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(false);

  // Modals & Sheets
  const [showPickerModal, setShowPickerModal] = useState<boolean>(false);
  const [showAddCustomModal, setShowAddCustomModal] = useState<boolean>(false);
  const [newDhikrText, setNewDhikrText] = useState<string>('');
  const [newDhikrTarget, setNewDhikrTarget] = useState<number>(33);
  const [customDhikrs, setCustomDhikrs] = useState<CustomDhikr[]>([]);
  const [justCompletedRound, setJustCompletedRound] = useState<boolean>(false);

  const tapButtonRef = useRef<HTMLButtonElement>(null);

  // Load preferences, custom dhikrs, and cumulative totals from local storage and Dexie
  useEffect(() => {
    // 1. Vibration
    const savedVib = localStorage.getItem(STORAGE_VIB_KEY);
    if (savedVib !== null) setVibrationEnabled(savedVib === 'true');

    // 2. Sound
    const savedSound = localStorage.getItem(STORAGE_SOUND_KEY);
    if (savedSound !== null) setSoundEnabled(savedSound === 'true');

    // 3. Custom Dhikrs
    try {
      const stored = localStorage.getItem(STORAGE_CUSTOM_DHIKRS);
      if (stored) {
        setCustomDhikrs(JSON.parse(stored));
      }
    } catch {
      // ignore JSON parse error
    }

    // 4. Cumulative Total & Sessions from Dexie
    db.tasbeeh_sessions.orderBy('id').last().then((last) => {
      if (last) {
        if (typeof last.cumulativeTotal === 'number') {
          setCumulativeTotal(last.cumulativeTotal);
        }
        if (typeof (last as any).completedRounds === 'number') {
          setCompletedRounds((last as any).completedRounds);
        }
      } else {
        setCumulativeTotal(0);
      }
    }).catch(() => {
      setCumulativeTotal(0);
    });
  }, []);

  // Synchronize when coming from Spiritual Guidance (Navigator / المساحة الروحانية)
  useEffect(() => {
    if (initialDhikr) {
      setSelectedDhikr(initialDhikr);
      setCurrentCount(0);
      setHistory([]);
    }
    if (typeof initialTarget === 'number') {
      setTargetCount(initialTarget);
    }
  }, [initialDhikr, initialTarget]);

  // Save custom dhikrs
  const saveCustomDhikrs = (list: CustomDhikr[]) => {
    setCustomDhikrs(list);
    localStorage.setItem(STORAGE_CUSTOM_DHIKRS, JSON.stringify(list));
  };

  const handleAddCustomDhikr = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newDhikrText.trim();
    if (!trimmed) return;

    const newEntry: CustomDhikr = {
      id: `custom_${Date.now()}`,
      text: trimmed,
      defaultTarget: newDhikrTarget > 0 ? newDhikrTarget : 33,
    };

    const updated = [newEntry, ...customDhikrs];
    saveCustomDhikrs(updated);
    
    // Auto-select newly created dhikr
    setSelectedDhikr(newEntry.text);
    setTargetCount(newEntry.defaultTarget);
    setCurrentCount(0);
    setHistory([]);
    setNewDhikrText('');
    setShowAddCustomModal(false);
    setShowPickerModal(false);
  };

  const handleDeleteCustomDhikr = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = customDhikrs.filter((d) => d.id !== id);
    saveCustomDhikrs(updated);
  };

  const handleTap = () => {
    let nextCount = currentCount + 1;
    let isNewRoundStart = false;

    // If the user already reached target (e.g. at 33 of 33) and taps again, start fresh at 1 for next round
    if (targetCount > 0 && currentCount >= targetCount) {
      nextCount = 1;
      isNewRoundStart = true;
      setJustCompletedRound(false);
    }

    setHistory((prev) => [...prev, currentCount]);
    setCurrentCount(nextCount);
    
    const nextCumulative = cumulativeTotal + 1;
    setCumulativeTotal(nextCumulative);

    // Audio feedback
    if (soundEnabled) {
      playSoftClick();
    }

    // Check if this tap completes the round target
    const hitTarget = targetCount > 0 && nextCount === targetCount;

    if (hitTarget) {
      setCompletedRounds((prev) => prev + 1);
      setJustCompletedRound(true);

      if (vibrationEnabled && 'vibrate' in navigator) {
        try {
          navigator.vibrate([100, 70, 120, 70, 200]); // Distinct celebratory vibration
        } catch {}
      }
    } else if (!isNewRoundStart) {
      if (vibrationEnabled && 'vibrate' in navigator) {
        try {
          navigator.vibrate(28); // Minimal soothing tap
        } catch {}
      }
    }

    // Persist session state to Dexie
    db.tasbeeh_sessions.put({
      dhikrText: selectedDhikr,
      targetCount: targetCount,
      currentCount: nextCount,
      completedRounds: hitTarget ? completedRounds + 1 : completedRounds,
      cumulativeTotal: nextCumulative,
      history: [...history, currentCount],
      lastUpdated: new Date().toISOString()
    }).catch(() => {});
  };

  const handleUndo = () => {
    if (history.length > 0) {
      const prevCount = history[history.length - 1];
      setHistory((prev) => prev.slice(0, -1));
      setCurrentCount(prevCount);
      setCumulativeTotal((prev) => Math.max(0, prev - 1));
      setJustCompletedRound(false);
    }
  };

  const handleResetRound = () => {
    setHistory([]);
    setCurrentCount(0);
    setJustCompletedRound(false);
  };

  const progressRatio = targetCount > 0 ? Math.min(1, currentCount / targetCount) : 0;
  const strokeCircumference = 2 * Math.PI * 94; // radius ~ 94

  return (
    <div className="space-y-4 md:space-y-5 pb-28 md:pb-8 animate-fade-in flex flex-col items-center max-w-md mx-auto text-right select-none">
      {/* 1. Top Active Dhikr Presentation Card */}
      <div 
        className="w-full bg-surface border border-border/80 rounded-3xl p-4 md:p-5 shadow-xs flex flex-col items-center text-center transition-all relative overflow-hidden"
        style={{
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.03)'
        }}
      >
        {/* Subtle accent corner badge */}
        <div className="flex items-center justify-between w-full text-xs pb-1 border-b border-border/40">
          <button
            onClick={() => setShowAddCustomModal(true)}
            className="text-primary hover:underline font-semibold flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ ذكر خاص بك</span>
          </button>

          <div className="inline-flex items-center gap-1.5 text-accent text-[11px] font-semibold">
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span>الذكر الحالي في السبحة</span>
          </div>
        </div>

        {/* Big Noble Dhikr Text */}
        <div className="py-3 px-2 w-full">
          <p className="font-quran text-2xl md:text-3xl text-text leading-relaxed select-text font-bold">
            {selectedDhikr}
          </p>
        </div>

        {/* Action Controls beneath Dhikr: Change Dhikr + Target Selector */}
        <div className="w-full flex items-center justify-between gap-2 pt-2 border-t border-border/40 text-xs">
          {/* Target Count Segment Selector */}
          <div className="flex bg-surface-elevated border border-border p-0.5 rounded-xl gap-0.5 font-sans font-semibold">
            {[33, 100, 0].map((t) => (
              <button
                key={t}
                onClick={() => {
                  setTargetCount(t);
                  handleResetRound();
                }}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer text-xs ${
                  targetCount === t 
                    ? 'bg-primary text-white shadow-xs' 
                    : 'text-text-muted hover:text-text'
                }`}
              >
                {t === 0 ? 'مفتوح' : t}
              </button>
            ))}
          </div>

          {/* Change Dhikr Button */}
          <button
            onClick={() => setShowPickerModal(true)}
            className="px-3 py-1.5 rounded-xl bg-accent-light/60 border border-accent/30 text-accent font-semibold text-xs hover:bg-accent hover:text-white transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
          >
            <ListFilter className="w-3.5 h-3.5" />
            <span>اختيار الذكر ▾</span>
          </button>
        </div>
      </div>

      {/* Celebratory Banner when Round completes */}
      {justCompletedRound && (
        <div className="w-full bg-accent/15 border-2 border-accent/70 rounded-2xl p-3.5 text-center animate-fade-in shadow-sm">
          <div className="flex items-center justify-center gap-2 text-accent font-alexandria font-bold text-sm">
            <Sparkles className="w-4 h-4 fill-accent shrink-0" />
            <span>تمت الدورة بنجاح! تقبّل الله منك ({targetCount} تسبيحة) ✨</span>
            <Sparkles className="w-4 h-4 fill-accent shrink-0" />
          </div>
          <p className="text-[11px] text-text-muted mt-1 font-sans">
            اضغط على السبحة للبدء في الدورة التالية (#{completedRounds + 1})
          </p>
        </div>
      )}

      {/* 2. Interactive Tactile Tasbeeh Circle */}
      <div className="py-2 w-full flex flex-col items-center justify-center">
        <button
          ref={tapButtonRef}
          onClick={handleTap}
          aria-label="تسبيح"
          className="relative w-52 h-52 sm:w-60 sm:h-60 rounded-full flex flex-col items-center justify-center cursor-pointer transition-all active:scale-[0.96] group focus:outline-none"
          style={{
            background: `radial-gradient(circle at 50% 45%, var(--surface) 60%, var(--surface-elevated) 100%)`,
            boxShadow: justCompletedRound
              ? `0 0 0 10px rgba(198, 166, 107, 0.45), 0 20px 48px rgba(198, 166, 107, 0.25)`
              : `0 0 0 8px rgba(35, 143, 131, 0.12), 0 18px 40px rgba(0, 0, 0, 0.08)`
          }}
        >
          {/* Circular Progress Arc */}
          <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none p-2">
            {/* Background track */}
            <circle
              cx="50%"
              cy="50%"
              r="94"
              fill="transparent"
              stroke="currentColor"
              strokeWidth="6"
              className="text-border-subtle/50"
            />
            {/* Active progress */}
            {targetCount > 0 && (
              <circle
                cx="50%"
                cy="50%"
                r="94"
                fill="transparent"
                stroke="currentColor"
                strokeWidth="6"
                strokeDasharray={strokeCircumference}
                strokeDashoffset={strokeCircumference - strokeCircumference * progressRatio}
                strokeLinecap="round"
                className={`transition-all duration-200 ${
                  justCompletedRound ? 'text-accent' : 'text-primary'
                }`}
              />
            )}
          </svg>

          {/* Number Counter */}
          <span className="font-alexandria font-bold text-5xl sm:text-6xl text-text leading-none select-none tracking-tight">
            {currentCount}
          </span>

          {/* Subtitle information */}
          <span className="text-xs text-text-muted mt-2 select-none font-sans font-medium">
            {targetCount > 0 ? (
              justCompletedRound ? (
                <span className="text-accent font-bold animate-pulse">تمت الدورة بنجاح ✨</span>
              ) : (
                `من ${targetCount} · الدورة ${completedRounds + 1}`
              )
            ) : (
              'عدّاد مفتوح'
            )}
          </span>

          {/* Hint */}
          <span className="text-[11px] font-semibold text-primary mt-1 opacity-80 group-hover:opacity-100 select-none">
            اضغط للعدّ
          </span>
        </button>
      </div>

      {/* 3. Metrics Summary Grid */}
      <div className="w-full grid grid-cols-3 gap-2">
        <div className="bg-surface rounded-2xl p-2.5 border border-border text-center shadow-xs">
          <span className="text-[10px] text-text-muted block">دورة الجلسة</span>
          <span className="font-alexandria font-bold text-sm text-primary mt-0.5 block">
            {currentCount}
          </span>
        </div>

        <div className="bg-surface rounded-2xl p-2.5 border border-border text-center shadow-xs">
          <span className="text-[10px] text-text-muted block">الدورات المكتملة</span>
          <span className="font-alexandria font-bold text-sm text-text mt-0.5 block">
            {completedRounds}
          </span>
        </div>

        <div className="bg-surface rounded-2xl p-2.5 border border-border text-center shadow-xs">
          <span className="text-[10px] text-text-muted block">التراكمي الدائم</span>
          <span className="font-alexandria font-bold text-sm text-accent mt-0.5 block">
            {cumulativeTotal.toLocaleString('ar-EG')}
          </span>
        </div>
      </div>

      {/* 4. Controls Toolbar */}
      <div className="grid grid-cols-4 gap-2 w-full pt-1">
        {/* Undo */}
        <button
          onClick={handleUndo}
          disabled={history.length === 0}
          className="flex flex-col items-center justify-center gap-1 py-2 rounded-2xl bg-surface border border-border text-xs font-semibold text-text hover:border-primary/40 disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-all shadow-xs"
          title="تراجع عن التسبيحة الأخيرة"
        >
          <Undo2 className="w-4 h-4 text-text-muted" />
          <span className="text-[11px]">تراجع</span>
        </button>

        {/* Vibration Toggle */}
        <button
          onClick={() => {
            const nextVib = !vibrationEnabled;
            setVibrationEnabled(nextVib);
            localStorage.setItem(STORAGE_VIB_KEY, String(nextVib));
          }}
          className={`flex flex-col items-center justify-center gap-1 py-2 rounded-2xl border text-xs font-semibold cursor-pointer transition-all shadow-xs ${
            vibrationEnabled 
              ? 'bg-primary-light text-primary border-primary/30' 
              : 'bg-surface text-text-muted border-border hover:border-primary/40'
          }`}
          title="تفعيل أو إيقاف الاهتزاز عند اللمس"
        >
          <Vibrate className="w-4 h-4" />
          <span className="text-[11px]">اهتزاز</span>
        </button>

        {/* Sound Toggle */}
        <button
          onClick={() => {
            const nextSound = !soundEnabled;
            setSoundEnabled(nextSound);
            localStorage.setItem(STORAGE_SOUND_KEY, String(nextSound));
            if (nextSound) playSoftClick();
          }}
          className={`flex flex-col items-center justify-center gap-1 py-2 rounded-2xl border text-xs font-semibold cursor-pointer transition-all shadow-xs ${
            soundEnabled 
              ? 'bg-primary-light text-primary border-primary/30' 
              : 'bg-surface text-text-muted border-border hover:border-primary/40'
          }`}
          title="صوت هادئ خفيف مع كل تسبيحة"
        >
          {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          <span className="text-[11px]">صوت</span>
        </button>

        {/* Reset Round */}
        <button
          onClick={handleResetRound}
          className="flex flex-col items-center justify-center gap-1 py-2 rounded-2xl bg-surface border border-border text-xs font-semibold text-text-muted hover:text-text hover:border-primary/40 cursor-pointer transition-all shadow-xs"
          title="تصفير الدورة الحالية للبدء من جديد"
        >
          <RotateCcw className="w-4 h-4" />
          <span className="text-[11px]">تصفير</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* 5. Dhikr Picker Modal (Rich Preset Library + Custom List) */}
      {/* ======================================================== */}
      {showPickerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-4 bg-black/60 backdrop-blur-xs animate-fade-in text-right">
          <div 
            className="bg-surface border border-border rounded-3xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 border-b border-border flex items-center justify-between bg-surface-elevated/40 shrink-0">
              <button
                onClick={() => setShowPickerModal(false)}
                className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-text-muted hover:text-text cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="text-right">
                <h3 className="font-alexandria font-bold text-base text-text">
                  اختيار الذكر للسبحة
                </h3>
                <p className="text-xs text-text-muted mt-0.5">
                  اختر من الأذكار المأثورة الموثقة أو أذكارك الخاصة
                </p>
              </div>
            </div>

            {/* Quick Add Custom Dhikr Button Bar */}
            <div className="p-3 bg-surface-elevated/30 border-b border-border/60 flex items-center justify-between shrink-0">
              <span className="text-xs text-text-muted">
                مكتبة الأذكار المتوفرة ({TASBEEH_PRESETS.length + customDhikrs.length})
              </span>
              <button
                onClick={() => {
                  setShowPickerModal(false);
                  setShowAddCustomModal(true);
                }}
                className="px-3 py-1.5 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary/95 flex items-center gap-1 cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ إضافة ذكر مخصص</span>
              </button>
            </div>

            {/* List */}
            <div className="p-4 overflow-y-auto space-y-4 flex-1">
              {/* Custom Adhkar Section if exists */}
              {customDhikrs.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-alexandria font-bold text-accent flex items-center gap-1">
                    <BookmarkCheck className="w-3.5 h-3.5" />
                    <span>أذكارك الخاصة المضافة</span>
                  </div>
                  <div className="space-y-1.5">
                    {customDhikrs.map((d) => {
                      const isSelected = selectedDhikr === d.text;
                      return (
                        <div
                          key={d.id}
                          onClick={() => {
                            setSelectedDhikr(d.text);
                            setTargetCount(d.defaultTarget);
                            handleResetRound();
                            setShowPickerModal(false);
                          }}
                          className={`p-3 rounded-2xl border text-xs cursor-pointer transition-all flex items-center justify-between gap-3 ${
                            isSelected
                              ? 'border-primary bg-primary-light/50 font-bold text-primary shadow-xs'
                              : 'border-border bg-surface-elevated/40 hover:border-primary/40 text-text'
                          }`}
                        >
                          <div className="flex items-center gap-2 flex-1">
                            {isSelected && <Check className="w-4 h-4 text-primary shrink-0" />}
                            <span className="font-quran text-base leading-relaxed">{d.text}</span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-surface border border-border text-text-muted font-mono">
                              هدف {d.defaultTarget}
                            </span>
                            <button
                              onClick={(e) => handleDeleteCustomDhikr(d.id, e)}
                              className="w-7 h-7 rounded-lg text-red-500 hover:bg-red-500/10 flex items-center justify-center cursor-pointer transition-colors"
                              title="حذف هذا الذكر"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Standard Authentic Presets */}
              <div className="space-y-2">
                <div className="text-xs font-alexandria font-bold text-text-muted">
                  الأذكار النبوية المأثورة
                </div>

                <div className="space-y-1.5">
                  {TASBEEH_PRESETS.map((p) => {
                    const isSelected = selectedDhikr === p.text;
                    return (
                      <div
                        key={p.id}
                        onClick={() => {
                          setSelectedDhikr(p.text);
                          setTargetCount(p.defaultTarget);
                          handleResetRound();
                          setShowPickerModal(false);
                        }}
                        className={`p-3 rounded-2xl border text-xs cursor-pointer transition-all flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'border-primary bg-primary-light/50 font-bold text-primary shadow-xs'
                            : 'border-border bg-surface-elevated/40 hover:border-primary/40 text-text'
                        }`}
                      >
                        <div className="flex items-center gap-2 flex-1">
                          {isSelected && <Check className="w-4 h-4 text-primary shrink-0" />}
                          <div>
                            <span className="font-quran text-base leading-relaxed block">{p.text}</span>
                            {p.category && (
                              <span className="text-[10px] text-text-muted mt-0.5 block">{p.category}</span>
                            )}
                          </div>
                        </div>

                        <span className="text-[10px] px-2.5 py-1 rounded-lg bg-surface border border-border text-accent font-semibold shrink-0">
                          {p.defaultTarget} مرة
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 6. Add Custom Dhikr Modal                                */}
      {/* ======================================================== */}
      {showAddCustomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-4 bg-black/60 backdrop-blur-xs animate-fade-in text-right">
          <form 
            onSubmit={handleAddCustomDhikr}
            className="bg-surface border border-border rounded-3xl max-w-md w-full p-5 space-y-4 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border pb-3">
              <button
                type="button"
                onClick={() => setShowAddCustomModal(false)}
                className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-text-muted hover:text-text cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="text-right">
                <h3 className="font-alexandria font-bold text-base text-text">
                  إضافة ذكر خاص بك
                </h3>
                <p className="text-xs text-text-muted mt-0.5">
                  احفظ أي دعاء أو صيغة ذكر تفضل تكرارها في سبحتك
                </p>
              </div>
            </div>

            {/* Input: Dhikr text */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text block">
                نص الذكر أو الدعاء:
              </label>
              <textarea
                value={newDhikrText}
                onChange={(e) => setNewDhikrText(e.target.value)}
                placeholder="اكتب الذكر هنا... (مثال: اللَّهُمَّ إِنَّكَ عَفُوٌّ تُحِبُّ الْعَفْوَ فَاعْفُ عَنِّي)"
                rows={3}
                required
                autoFocus
                className="w-full bg-surface-elevated border border-border rounded-2xl p-3 text-xs text-text focus:outline-none focus:border-primary text-right font-quran leading-relaxed resize-none"
              />
            </div>

            {/* Input: Target count */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text block">
                الهدف الافتراضي للتكرار:
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[33, 100, 500, 0].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setNewDhikrTarget(t)}
                    className={`py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      newDhikrTarget === t
                        ? 'bg-primary text-white shadow-xs'
                        : 'bg-surface-elevated border border-border text-text hover:border-primary/40'
                    }`}
                  >
                    {t === 0 ? 'مفتوح' : t}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit */}
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowAddCustomModal(false)}
                className="px-4 py-2.5 rounded-xl border border-border text-xs font-semibold text-text hover:bg-surface cursor-pointer"
              >
                إلغاء
              </button>

              <button
                type="submit"
                disabled={!newDhikrText.trim()}
                className="flex-1 py-2.5 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary/95 disabled:opacity-40 disabled:pointer-events-none cursor-pointer shadow-xs transition-all"
              >
                حفظ واستخدام الذكر في السبحة
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
