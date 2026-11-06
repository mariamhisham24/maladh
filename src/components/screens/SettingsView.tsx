import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useSound } from '../../context/SoundContext';
import { 
  Settings, 
  Sun, 
  Moon, 
  Monitor, 
  Download, 
  Upload, 
  ShieldCheck, 
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Heart,
  Play,
  Pause,
  Volume2
} from 'lucide-react';
import { exportBackupJSON, importBackupJSON } from '../../db';
import { AboutModal } from '../common/AboutModal';
import { NotificationsModal } from '../common/NotificationsModal';
import { InstallAppButton } from '../common/PWAInstallBanner';
import type { SoundItemMeta } from '../../utils/ambientAudio';

interface SettingsViewProps {
  onBack?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onBack }) => {
  const { theme, setTheme } = useTheme();
  const {
    soundEnabled,
    setSoundEnabled,
    currentSound,
    isPlaying,
    volume,
    timerMinutes,
    playSound,
    stopSound,
    togglePlay,
    changeVolume,
    changeTimer,
    soundMetaList,
    currentMeta,
  } = useSound();

  const [fontSize, setFontSize] = useState<'صغير' | 'متوسط' | 'كبير'>('متوسط');
  const [vibration, setVibration] = useState<boolean>(true);
  const [showSoundPicker, setShowSoundPicker] = useState<boolean>(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Initialize preferences from localStorage on mount
  useEffect(() => {
    const savedFontSize = localStorage.getItem('maladh_font_size') as 'صغير' | 'متوسط' | 'كبير';
    if (savedFontSize) {
      setFontSize(savedFontSize);
      applyFontSizeScale(savedFontSize);
    }

    const savedVibration = localStorage.getItem('maladh_vibration');
    if (savedVibration !== null) {
      setVibration(savedVibration === 'true');
    }

    const savedNotifications = localStorage.getItem('maladh_notifications_config');
    if (savedNotifications) {
      setNotificationsEnabled(true);
    }
  }, []);

  const applyFontSizeScale = (size: 'صغير' | 'متوسط' | 'كبير') => {
    if (size === 'صغير') {
      document.documentElement.style.fontSize = '14.5px';
    } else if (size === 'كبير') {
      document.documentElement.style.fontSize = '18px';
    } else {
      document.documentElement.style.fontSize = '16px';
    }
  };

  const cycleFontSize = (direction: 'up' | 'down') => {
    let nextSize: 'صغير' | 'متوسط' | 'كبير' = fontSize;
    if (direction === 'up') {
      if (fontSize === 'صغير') nextSize = 'متوسط';
      else if (fontSize === 'متوسط') nextSize = 'كبير';
    } else {
      if (fontSize === 'كبير') nextSize = 'متوسط';
      else if (fontSize === 'متوسط') nextSize = 'صغير';
    }

    setFontSize(nextSize);
    localStorage.setItem('maladh_font_size', nextSize);
    applyFontSizeScale(nextSize);
    setStatusMessage({ type: 'success', text: `تم تغيير حجم الخط في التطبيق إلى: ${nextSize}` });
  };

  const handleToggleVibration = () => {
    const nextVal = !vibration;
    setVibration(nextVal);
    localStorage.setItem('maladh_vibration', String(nextVal));

    if (nextVal && 'vibrate' in navigator) {
      try {
        navigator.vibrate([45, 30, 45]);
      } catch {
        // ignore
      }
    }
    setStatusMessage({ 
      type: 'success', 
      text: nextVal ? 'تم تفعيل الاهتزاز اللمسي الهادئ' : 'تم تعطيل الاهتزاز' 
    });
  };

  const handleToggleSoundMaster = () => {
    const nextVal = !soundEnabled;
    setSoundEnabled(nextVal);
    if (nextVal) {
      playSound();
      setShowSoundPicker(true);
      setStatusMessage({ 
        type: 'success', 
        text: `تم تفعيل أصوات السكينة: ${currentMeta.name}` 
      });
    } else {
      stopSound();
      setShowSoundPicker(false);
      setStatusMessage({ 
        type: 'success', 
        text: 'تم إيقاف أصوات السكينة' 
      });
    }
  };

  const handleExport = async () => {
    try {
      const json = await exportBackupJSON();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `maladh-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setStatusMessage({ type: 'success', text: 'تم تصدير النسخة الاحتياطية بنجاح!' });
    } catch {
      setStatusMessage({ type: 'error', text: 'حدث خطأ أثناء تصدير البيانات.' });
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      if (content) {
        const success = await importBackupJSON(content);
        if (success) {
          setStatusMessage({ type: 'success', text: 'تمت استعادة البيانات بنجاح! سيتم تحديث الصفحة...' });
          setTimeout(() => window.location.reload(), 1500);
        } else {
          setStatusMessage({ type: 'error', text: 'الملف غير صالح أو لا يطابق بنية بيانات مَلَاذْ.' });
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 pb-28 md:pb-8 animate-fade-in max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary-light text-primary flex items-center justify-center shrink-0">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-alexandria font-bold text-2xl text-text">المزيد والإعدادات</h1>
            <p className="text-xs text-text-muted">اجعل التجربة كما تريحك، وتحكم ببياناتك بالكامل</p>
          </div>
        </div>

        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-surface border border-border text-xs font-semibold text-text hover:border-primary/40 cursor-pointer"
          >
            <ArrowRight className="w-4 h-4 text-primary" />
            <span>رجوع</span>
          </button>
        )}
      </div>

      {statusMessage && (
        <div className={`p-4 rounded-2xl flex items-center gap-3 text-xs font-semibold ${
          statusMessage.type === 'success' 
            ? 'bg-primary-light text-primary border border-primary/20' 
            : 'bg-red-500/10 text-red-500 border border-red-500/20'
        }`}>
          {statusMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* PWA Install Banner Button */}
      <InstallAppButton />

      {/* Appearance Section */}
      <div className="bg-surface rounded-3xl p-6 border border-border shadow-xs space-y-4">
        <h3 className="font-alexandria font-bold text-sm text-text border-b border-border-subtle pb-3">
          المظهر والتصميم
        </h3>

        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => setTheme('light')}
            className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all cursor-pointer ${
              theme === 'light'
                ? 'bg-primary-light border-primary text-primary font-semibold shadow-xs'
                : 'bg-surface-elevated border-border text-text-muted hover:text-text'
            }`}
          >
            <Sun className="w-5 h-5 mb-1.5" />
            <span className="text-xs">الوضع الفاتح</span>
          </button>

          <button
            onClick={() => setTheme('dark')}
            className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all cursor-pointer ${
              theme === 'dark'
                ? 'bg-primary-light border-primary text-primary font-semibold shadow-xs'
                : 'bg-surface-elevated border-border text-text-muted hover:text-text'
            }`}
          >
            <Moon className="w-5 h-5 mb-1.5" />
            <span className="text-xs">الوضع الداكن</span>
          </button>

          <button
            onClick={() => setTheme('system')}
            className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all cursor-pointer ${
              theme === 'system'
                ? 'bg-primary-light border-primary text-primary font-semibold shadow-xs'
                : 'bg-surface-elevated border-border text-text-muted hover:text-text'
            }`}
          >
            <Monitor className="w-5 h-5 mb-1.5" />
            <span className="text-xs">حسب الجهاز</span>
          </button>
        </div>
      </div>

      {/* Card: التفضيلات (Correct RTL Order: Text on RIGHT, Controls on LEFT) */}
      <div className="bg-surface rounded-3xl p-6 border border-border shadow-xs space-y-1">
        <h3 className="font-alexandria font-bold text-sm text-text border-b border-border-subtle pb-3 mb-1">
          التفضيلات
        </h3>

        {/* Setting 1: حجم الخط */}
        <div className="flex items-center justify-between py-3.5 border-b border-border-subtle">
          {/* Right in RTL: Title & Subtitle */}
          <div className="text-right">
            <strong className="text-xs font-bold text-text block leading-normal">
              حجم الخط
            </strong>
            <small className="text-[11px] text-text-muted block mt-0.5 leading-normal">
              {fontSize}
            </small>
          </div>

          {/* Left in RTL: Plus / Minus Controls */}
          <div className="flex items-center gap-1.5 text-primary text-sm font-bold bg-surface-elevated border border-border/60 px-2.5 py-1 rounded-xl shadow-xs">
            <button 
              onClick={() => cycleFontSize('down')} 
              className="hover:opacity-75 cursor-pointer px-1.5 py-0.5 rounded transition-opacity"
              title="تصغير الخط"
            >
              −
            </button>
            <span className="text-text-muted font-normal text-xs">/</span>
            <button 
              onClick={() => cycleFontSize('up')} 
              className="hover:opacity-75 cursor-pointer px-1.5 py-0.5 rounded transition-opacity"
              title="تكبير الخط"
            >
              ＋
            </button>
          </div>
        </div>

        {/* Setting 2: الاهتزاز */}
        <div className="flex items-center justify-between py-3.5 border-b border-border-subtle">
          {/* Right in RTL: Title & Subtitle */}
          <div className="text-right">
            <strong className="text-xs font-bold text-text block leading-normal">
              الاهتزاز
            </strong>
            <small className="text-[11px] text-text-muted block mt-0.5 leading-normal">
              {vibration ? 'تفاعل لمسي هادئ' : 'معطّل'}
            </small>
          </div>

          {/* Left in RTL: Clean iOS/Material Switch */}
          <button
            type="button"
            role="switch"
            aria-checked={vibration}
            onClick={handleToggleVibration}
            dir="ltr"
            className={`w-[44px] h-[24px] rounded-full p-[2.5px] transition-colors duration-200 cursor-pointer flex items-center ${
              vibration 
                ? 'bg-primary justify-end' 
                : 'bg-[#D9DCD7] dark:bg-[#39414A] justify-start'
            }`}
            title="تبديل الاهتزاز"
          >
            <span className="w-[19px] h-[19px] rounded-full bg-white shadow-sm block transition-all duration-200" />
          </button>
        </div>

        {/* Setting 3: أصوات السكينة والهدوء */}
        <div className="py-3.5 border-b border-border-subtle space-y-3">
          <div className="flex items-center justify-between">
            {/* Right in RTL: Title & Subtitle */}
            <div className="text-right">
              <strong className="text-xs font-bold text-text block leading-normal">
                أصوات السكينة
              </strong>
              <small className="text-[11px] text-text-muted block mt-0.5 leading-normal">
                {soundEnabled ? `${currentMeta.icon} ${currentMeta.name} (${isPlaying ? 'يعمل الآن' : 'جاهز'})` : 'معطل'}
              </small>
            </div>

            {/* Left in RTL: Options & Switch */}
            <div className="flex items-center gap-2">
              {soundEnabled && (
                <button
                  type="button"
                  onClick={() => setShowSoundPicker(!showSoundPicker)}
                  className="text-[11px] text-primary font-semibold hover:underline cursor-pointer px-2.5 py-1 rounded-lg bg-surface-elevated border border-border"
                >
                  {showSoundPicker ? 'طي الأصوات ▲' : 'اختر صوتاً ▼'}
                </button>
              )}
              <button
                type="button"
                role="switch"
                aria-checked={soundEnabled}
                onClick={handleToggleSoundMaster}
                dir="ltr"
                className={`w-[44px] h-[24px] rounded-full p-[2.5px] transition-colors duration-200 cursor-pointer flex items-center ${
                  soundEnabled 
                    ? 'bg-primary justify-end' 
                    : 'bg-[#D9DCD7] dark:bg-[#39414A] justify-start'
                }`}
                title="تبديل أصوات السكينة"
              >
                <span className="w-[19px] h-[19px] rounded-full bg-white shadow-sm block transition-all duration-200" />
              </button>
            </div>
          </div>

          {/* Expanded Serenity Sound Panel */}
          {soundEnabled && showSoundPicker && (
            <div className="bg-surface-elevated/40 border border-border/60 rounded-2xl p-3.5 space-y-3 animate-fade-in text-right">
              {/* Sounds Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {soundMetaList.map((soundItem: SoundItemMeta) => {
                  const isCurrent = currentSound === soundItem.id;
                  return (
                    <button
                      key={soundItem.id}
                      type="button"
                      onClick={() => playSound(soundItem.id)}
                      className={`p-2.5 rounded-xl border text-right transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                        isCurrent && isPlaying
                          ? 'border-accent bg-accent/15 text-accent shadow-xs'
                          : isCurrent
                          ? 'border-primary/50 bg-primary-light/40 text-text'
                          : 'border-border bg-surface text-text hover:border-primary/40'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-xl">{soundItem.icon}</span>
                        {isCurrent && isPlaying && (
                          <span className="w-2 h-2 rounded-full bg-accent animate-ping" />
                        )}
                      </div>
                      <div>
                        <strong className="text-xs font-alexandria font-bold block leading-tight">
                          {soundItem.name}
                        </strong>
                        <span className="text-[10px] text-text-muted block mt-0.5 line-clamp-1">
                          {soundItem.description}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Volume Slider & Play/Pause */}
              <div className="pt-2 border-t border-border/40 flex items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={togglePlay}
                  className="px-3.5 py-1.5 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary/95 flex items-center gap-1.5 cursor-pointer shrink-0 shadow-xs"
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-3.5 h-3.5 fill-white" />
                      <span>إيقاف مؤقت</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-white" />
                      <span>تشغيل الصوت</span>
                    </>
                  )}
                </button>

                <div className="flex-1 flex items-center gap-2">
                  <span className="text-[10px] font-mono text-text-muted">{Math.round(volume * 100)}%</span>
                  <input
                    type="range"
                    min="0.05"
                    max="1"
                    step="0.05"
                    value={volume}
                    onChange={(e) => changeVolume(parseFloat(e.target.value))}
                    className="w-full accent-primary cursor-pointer"
                  />
                  <Volume2 className="w-3.5 h-3.5 text-text-muted shrink-0" />
                </div>
              </div>

              {/* Sleep Timer */}
              <div className="pt-2 border-t border-border/40 flex items-center justify-between text-xs">
                <span className="text-[11px] text-text-muted">
                  {timerMinutes > 0 ? `يتوقف بعد ${timerMinutes} دقيقة` : 'مستمر'}
                </span>
                <div className="flex items-center gap-1.5 font-sans font-semibold">
                  {[0, 15, 30, 45].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => changeTimer(mins)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] transition-all cursor-pointer ${
                        timerMinutes === mins
                          ? 'bg-primary text-white shadow-xs'
                          : 'bg-surface border border-border text-text-muted hover:text-text'
                      }`}
                    >
                      {mins === 0 ? 'مستمر' : `${mins} د`}
                    </button>
                  ))}
                  <span className="text-[11px] text-text-muted mr-1">المؤقت:</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Setting 4: التنبيهات */}
        <div className="flex items-center justify-between py-3.5">
          {/* Right in RTL: Title & Subtitle */}
          <div className="text-right">
            <strong className="text-xs font-bold text-text block leading-normal">
              التنبيهات
            </strong>
            <small className="text-[11px] text-text-muted block mt-0.5 leading-normal">
              {notificationsEnabled ? 'تنبيهات الورد مفعّلة' : 'تذكير بوقت الورد'}
            </small>
          </div>

          {/* Left in RTL: Clean Link without black border */}
          <button
            onClick={() => setIsNotificationsOpen(true)}
            className="text-primary text-xs font-bold hover:underline cursor-pointer px-3 py-1.5 rounded-xl bg-primary-light/60 border border-primary/20 transition-all hover:bg-primary-light"
          >
            إعداد
          </button>
        </div>
      </div>

      {/* Local Data Management (Export / Import JSON) */}
      <div className="bg-surface rounded-3xl p-6 border border-border shadow-xs space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold text-accent border-b border-border-subtle pb-3">
          <ShieldCheck className="w-4 h-4" />
          <span>بياناتك على جهازك (Local Database)</span>
        </div>

        <p className="text-xs text-text-muted leading-relaxed">
          لا نملك سيرفرات لتخزين أورادك أو إحصائياتك. كل شيء يُخزن في قاعدة بيانات المتصفح المحلية (IndexedDB). يمكنك تصدير بياناتك واستعادتها في أي وقت على أي جهاز آخر.
        </p>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            onClick={handleExport}
            className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-surface-elevated border border-border text-xs font-semibold text-text hover:border-primary/50 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 text-primary" />
            <span>تصدير نسخة (JSON)</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-surface-elevated border border-border text-xs font-semibold text-text hover:border-accent/50 transition-all cursor-pointer"
          >
            <Upload className="w-4 h-4 text-accent" />
            <span>استعادة نسخة</span>
          </button>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImportFile} 
            accept=".json" 
            className="hidden" 
          />
        </div>
      </div>

      {/* About Maladh & Maker's Message */}
      <div 
        onClick={() => setIsAboutOpen(true)}
        className="bg-accent-light/40 hover:bg-accent-light/60 rounded-3xl p-6 border border-accent/30 space-y-3 cursor-pointer transition-all group"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-accent">
            <Heart className="w-4 h-4 fill-accent" />
            <span>رسالة الصانعة وعن مَلَاذْ</span>
          </div>
          <span className="text-xs font-semibold text-accent group-hover:underline">عرض التفاصيل ←</span>
        </div>

        <p className="font-sans text-xs md:text-sm text-text leading-relaxed font-medium italic">
          «صُنعت هذه المساحة لتكون ملاذاً هادئاً وخالصاً لوجه الله، بلا إعلانات ولا تشتيت.. أرجو بها أثراً يُصلح يومك، وذُخراً يثقل ميزاني يوم ألقى ربي. لا تنسني من صالح دعائك بظهر الغيب.»
        </p>

        <p className="text-[11px] text-text-muted border-t border-accent/20 pt-2.5">
          مبادرة فردية خالصة لوجه الله · لا حسابات · لا إعلانات · نصوص موثقة.
        </p>
      </div>

      <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
      
      <NotificationsModal 
        isOpen={isNotificationsOpen} 
        onClose={() => setIsNotificationsOpen(false)} 
        onSave={() => {
          setNotificationsEnabled(true);
          setStatusMessage({ type: 'success', text: 'تم حفظ تذكيرات الورد اليومية بنجاح!' });
        }}
      />
    </div>
  );
};
