import React, { useState } from 'react';
import { useSound } from '../../context/SoundContext';
import { Play, Pause, X, Volume2, Sparkles, Clock } from 'lucide-react';
import type { SoundCategory } from '../../utils/ambientAudio';

export const AmbientSoundPill: React.FC = () => {
  const { 
    isPlaying, 
    currentItem, 
    togglePlay, 
    stopSound, 
    volume, 
    changeVolume, 
    sounds, 
    playSound, 
    timerMinutes, 
    changeTimer,
    activeCategory,
    setActiveCategory
  } = useSound();

  const [showExpanded, setShowExpanded] = useState<boolean>(false);

  if (!isPlaying && !showExpanded) return null;

  const filteredSounds = sounds.filter((s) => {
    if (activeCategory === 'all') return true;
    return s.category === activeCategory;
  });

  return (
    <>
      {/* Floating Circular Mini Player when playing */}
      <div className="fixed bottom-20 md:bottom-6 left-4 md:left-8 z-40 animate-fade-in text-right">
        <div className="relative group">
          {/* Subtle Ripple/Glow ring when playing */}
          {isPlaying && (
            <span 
              className="absolute -inset-1 rounded-full bg-accent/25 animate-ping pointer-events-none opacity-60" 
            />
          )}

          {/* Main Circular Button */}
          <button
            type="button"
            onClick={() => setShowExpanded(true)}
            title={`${currentItem.name} - خيارات أصوات السكينة`}
            className={`relative w-12 h-12 rounded-full bg-surface/95 backdrop-blur-md border-2 ${
              isPlaying 
                ? 'border-accent shadow-[0_6px_22px_rgba(198,166,107,0.35)] ring-2 ring-accent/20' 
                : 'border-border shadow-md'
            } flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95`}
          >
            {/* Center Sound Icon */}
            <span className={`text-xl select-none transition-transform duration-300 ${isPlaying ? 'scale-110' : 'opacity-80'}`}>
              {currentItem.icon}
            </span>

            {/* Quick Play/Pause Badge */}
            <div
              onClick={(e) => {
                e.stopPropagation();
                togglePlay();
              }}
              title={isPlaying ? 'إيقاف مؤقت' : 'تشغيل'}
              className="absolute -bottom-1 -left-1 w-5 h-5 rounded-full bg-primary text-white border-2 border-surface shadow-xs flex items-center justify-center cursor-pointer hover:bg-primary/90 transition-transform active:scale-90"
            >
              {isPlaying ? (
                <Pause className="w-2.5 h-2.5 fill-white" />
              ) : (
                <Play className="w-2.5 h-2.5 fill-white ml-0.5" />
              )}
            </div>

            {/* Quick Stop/Close Button on Hover */}
            <div
              onClick={(e) => {
                e.stopPropagation();
                stopSound();
                setShowExpanded(false);
              }}
              title="إيقاف الصوت نهائياً"
              className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-text-muted/80 hover:bg-rose-500 text-white border border-surface shadow-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            >
              <X className="w-2.5 h-2.5" />
            </div>
          </button>
        </div>
      </div>

      {/* Expanded Serenity Sound Suite Modal */}
      {showExpanded && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-4 bg-black/60 backdrop-blur-xs animate-fade-in text-right"
          onClick={() => setShowExpanded(false)}
        >
          <div 
            className="bg-surface border border-border rounded-3xl max-w-md w-full p-5 space-y-4 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border pb-3">
              <button
                onClick={() => setShowExpanded(false)}
                className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-text-muted hover:text-text cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="text-right">
                <h3 className="font-alexandria font-bold text-base text-text flex items-center gap-1.5 justify-end">
                  <span>مكتبة السكينة والقرآن</span>
                  <Sparkles className="w-4 h-4 text-accent" />
                </h3>
                <p className="text-xs text-text-muted mt-0.5">
                  تلاوات خاشعة وأصوات طبيعة حقيقية لراحة البال والتدبر
                </p>
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {[
                { id: 'all', label: 'الكل' },
                { id: 'quran', label: 'تلاوات خاشعة 📖' },
                { id: 'nature', label: 'طبيعة حقيقية 🌧️' },
                { id: 'serenity', label: 'سكينة 432Hz 🧘' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id as SoundCategory | 'all')}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    activeCategory === cat.id
                      ? 'bg-primary text-white shadow-xs'
                      : 'bg-surface-elevated border border-border text-text-muted hover:text-text'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Sound Cards List */}
            <div className="space-y-2 max-h-60 overflow-y-auto p-0.5 divide-y divide-border/20">
              {filteredSounds.map((sound) => {
                const isActive = currentItem.id === sound.id;
                return (
                  <div
                    key={sound.id}
                    onClick={() => playSound(sound.id)}
                    className={`pt-2 first:pt-0 p-3 rounded-2xl border text-right transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isActive && isPlaying
                        ? 'border-accent bg-accent/15 text-accent shadow-xs'
                        : isActive
                        ? 'border-primary/50 bg-primary-light/40 text-text'
                        : 'border-border bg-surface-elevated/40 text-text hover:border-primary/40'
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="text-2xl shrink-0">{sound.icon}</span>
                      <div className="min-w-0">
                        <strong className="font-alexandria font-bold text-xs block leading-tight truncate">
                          {sound.name}
                        </strong>
                        <span className="text-[10px] text-text-muted block mt-0.5 truncate">
                          {sound.reciterOrType || sound.description}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isActive && isPlaying ? (
                        <span className="px-2 py-0.5 rounded-full bg-accent text-white text-[10px] font-semibold animate-pulse">
                          يعمل الآن
                        </span>
                      ) : (
                        <Play className="w-3.5 h-3.5 text-text-muted" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Volume Tuner */}
            <div className="space-y-1.5 pt-1 border-t border-border/40">
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono text-text-muted">{Math.round(volume * 100)}%</span>
                <span className="font-semibold text-text flex items-center gap-1">
                  <span>مستوى الصوت</span>
                  <Volume2 className="w-3.5 h-3.5 text-primary" />
                </span>
              </div>
              <input
                type="range"
                min="0.05"
                max="1"
                step="0.05"
                value={volume}
                onChange={(e) => changeVolume(parseFloat(e.target.value))}
                className="w-full accent-primary cursor-pointer"
              />
            </div>

            {/* Sleep Timer */}
            <div className="space-y-1.5 pt-1 border-t border-border/40">
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-muted">
                  {timerMinutes > 0 ? `يتوقف بعد ${timerMinutes} دقيقة` : 'بدون توقف'}
                </span>
                <span className="font-semibold text-text flex items-center gap-1">
                  <span>مؤقت الإيقاف</span>
                  <Clock className="w-3.5 h-3.5 text-accent" />
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1.5 text-xs font-semibold">
                {[0, 15, 30, 45].map((mins) => (
                  <button
                    key={mins}
                    onClick={() => changeTimer(mins)}
                    className={`py-1.5 rounded-xl border transition-all cursor-pointer ${
                      timerMinutes === mins
                        ? 'bg-primary text-white border-primary shadow-xs'
                        : 'bg-surface-elevated border-border text-text-muted hover:text-text'
                    }`}
                  >
                    {mins === 0 ? 'مستمر' : `${mins} د`}
                  </button>
                ))}
              </div>
            </div>

            {/* Master Toggle */}
            <button
              onClick={togglePlay}
              className="w-full py-3 rounded-2xl bg-primary text-white font-alexandria font-bold text-xs flex items-center justify-center gap-2 hover:bg-primary/95 transition-all cursor-pointer shadow-md"
            >
              {isPlaying ? (
                <>
                  <Pause className="w-4 h-4 fill-white" />
                  <span>إيقاف مؤقت ({currentItem.name})</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  <span>تشغيل ({currentItem.name})</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
