import React, { useState, useEffect } from 'react';
import { Bell, Check, X, Clock, Send, Sparkles, AlertCircle } from 'lucide-react';
import { 
  requestNotificationPermission, 
  sendTestNotification, 
  isNotificationSupported, 
  checkAndDispatchDueReminders,
  STORAGE_NOTIF_CONFIG 
} from '../../utils/notifications';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const [morningReminder, setMorningReminder] = useState(true);
  const [morningTime, setMorningTime] = useState('05:30');
  const [eveningReminder, setEveningReminder] = useState(true);
  const [eveningTime, setEveningTime] = useState('17:00');
  const [quranReminder, setQuranReminder] = useState(false);
  const [quranTime, setQuranTime] = useState('21:00');
  
  const [testSent, setTestSent] = useState<boolean>(false);
  const [permissionState, setPermissionState] = useState<string>('default');

  // Load saved preferences on mount or open
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermissionState(Notification.permission);
    }

    try {
      const raw = localStorage.getItem(STORAGE_NOTIF_CONFIG);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.morning) {
          setMorningReminder(parsed.morning.enabled ?? true);
          if (parsed.morning.time) setMorningTime(parsed.morning.time);
        }
        if (parsed.evening) {
          setEveningReminder(parsed.evening.enabled ?? true);
          if (parsed.evening.time) setEveningTime(parsed.evening.time);
        }
        if (parsed.quran) {
          setQuranReminder(parsed.quran.enabled ?? false);
          if (parsed.quran.time) setQuranTime(parsed.quran.time);
        }
      }
    } catch {
      // ignore
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestNotification = async () => {
    const granted = await requestNotificationPermission();
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermissionState(Notification.permission);
    }

    if (granted) {
      const success = await sendTestNotification();
      if (success) {
        setTestSent(true);
        setTimeout(() => setTestSent(false), 5000);
      }
    }
  };

  const handleSavePreferences = async () => {
    const granted = await requestNotificationPermission();
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermissionState(Notification.permission);
    }

    localStorage.setItem(
      STORAGE_NOTIF_CONFIG,
      JSON.stringify({
        morning: { enabled: morningReminder, time: morningTime },
        evening: { enabled: eveningReminder, time: eveningTime },
        quran: { enabled: quranReminder, time: quranTime },
      })
    );

    // If notifications are active and permission is granted, send an instant confirmation notification
    if (granted && (morningReminder || eveningReminder || quranReminder)) {
      sendTestNotification();
      checkAndDispatchDueReminders();
    }

    onSave();
    onClose();
  };

  const isSupported = isNotificationSupported();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div 
        className="bg-surface border border-border rounded-3xl max-w-md w-full p-6 shadow-2xl relative animate-scale-in text-right space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-subtle pb-3">
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-text-muted hover:text-text cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2">
            <h3 className="font-alexandria font-bold text-base text-text">
              إعداد تذكيرات الورد
            </h3>
            <div className="w-8 h-8 rounded-xl bg-primary-light text-primary flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
          </div>
        </div>

        <p className="text-xs text-text-muted leading-relaxed">
          تذكيرات لطيفة هادئة تظهر في أوقات الورد المختارة لمساعدتك على الحفاظ على وردك دون إلحاح.
        </p>

        {/* Not Supported Warning */}
        {!isSupported && (
          <div className="bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 rounded-2xl p-3 text-xs flex items-center gap-2 text-right">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>متصفحك الحالي لا يدعم ميزة التنبيهات الخارجية مباشرة.</span>
          </div>
        )}

        {/* Permission Notice if Denied */}
        {permissionState === 'denied' && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 rounded-2xl p-3 text-xs flex items-center gap-2 text-right">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>الإشعارات محظورة في متصفحك. يرجى تفعيل الإذن من إعدادات المتصفح أو القفل بجوار الرابط لتصلك التنبيهات.</span>
          </div>
        )}

        {/* Reminders List */}
        <div className="space-y-3">
          {/* Morning Reminder */}
          <div className="bg-surface-elevated rounded-2xl p-3.5 border border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <input 
                type="time" 
                value={morningTime}
                onChange={(e) => setMorningTime(e.target.value)}
                className="bg-surface border border-border rounded-lg px-2 py-1 text-xs text-text font-mono"
              />
              <button
                type="button"
                onClick={() => setMorningReminder(!morningReminder)}
                dir="ltr"
                className={`w-10 h-6 rounded-full p-0.5 cursor-pointer transition-colors flex items-center ${
                  morningReminder ? 'bg-primary justify-end' : 'bg-border justify-start'
                }`}
              >
                <span className="w-5 h-5 rounded-full bg-white shadow-xs block" />
              </button>
            </div>

            <div>
              <strong className="text-xs font-bold text-text block leading-normal">
                أذكار الصباح
              </strong>
              <small className="text-[11px] text-text-muted flex items-center gap-1 mt-0.5 justify-end">
                <Clock className="w-3 h-3 text-accent" />
                <span>بعد الفجر</span>
              </small>
            </div>
          </div>

          {/* Evening Reminder */}
          <div className="bg-surface-elevated rounded-2xl p-3.5 border border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <input 
                type="time" 
                value={eveningTime}
                onChange={(e) => setEveningTime(e.target.value)}
                className="bg-surface border border-border rounded-lg px-2 py-1 text-xs text-text font-mono"
              />
              <button
                type="button"
                onClick={() => setEveningReminder(!eveningReminder)}
                dir="ltr"
                className={`w-10 h-6 rounded-full p-0.5 cursor-pointer transition-colors flex items-center ${
                  eveningReminder ? 'bg-primary justify-end' : 'bg-border justify-start'
                }`}
              >
                <span className="w-5 h-5 rounded-full bg-white shadow-xs block" />
              </button>
            </div>

            <div>
              <strong className="text-xs font-bold text-text block leading-normal">
                أذكار المساء
              </strong>
              <small className="text-[11px] text-text-muted flex items-center gap-1 mt-0.5 justify-end">
                <Clock className="w-3 h-3 text-accent" />
                <span>قبل الغروب</span>
              </small>
            </div>
          </div>

          {/* Quran Reminder */}
          <div className="bg-surface-elevated rounded-2xl p-3.5 border border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <input 
                type="time" 
                value={quranTime}
                onChange={(e) => setQuranTime(e.target.value)}
                className="bg-surface border border-border rounded-lg px-2 py-1 text-xs text-text font-mono"
              />
              <button
                type="button"
                onClick={() => setQuranReminder(!quranReminder)}
                dir="ltr"
                className={`w-10 h-6 rounded-full p-0.5 cursor-pointer transition-colors flex items-center ${
                  quranReminder ? 'bg-primary justify-end' : 'bg-border justify-start'
                }`}
              >
                <span className="w-5 h-5 rounded-full bg-white shadow-xs block" />
              </button>
            </div>

            <div>
              <strong className="text-xs font-bold text-text block leading-normal">
                الورد القرآني
              </strong>
              <small className="text-[11px] text-text-muted flex items-center gap-1 mt-0.5 justify-end">
                <Clock className="w-3 h-3 text-accent" />
                <span>جلسة المساء</span>
              </small>
            </div>
          </div>
        </div>

        {/* Live Instant Test Notification Button */}
        <div className="pt-1">
          <button
            type="button"
            onClick={handleTestNotification}
            className="w-full py-2.5 px-4 rounded-xl border border-accent/40 bg-accent-light/50 text-accent hover:bg-accent hover:text-white transition-all text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            <Send className="w-3.5 h-3.5" />
            <span>تجربة إرسال إشعار فوري الآن إلى جهازك 🔔</span>
          </button>

          {testSent && (
            <p className="text-[11px] text-primary font-semibold text-center mt-2 animate-fade-in flex items-center justify-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>تم إرسال إشعار تجريبي بنجاح! تفقد شريط الإشعارات في جهازك.</span>
            </p>
          )}
        </div>

        {/* Action Button */}
        <button
          onClick={handleSavePreferences}
          className="w-full py-3.5 rounded-2xl bg-primary text-white font-alexandria font-bold text-xs flex items-center justify-center gap-2 hover:bg-primary/95 transition-all shadow-sm cursor-pointer"
        >
          <Check className="w-4 h-4" />
          <span>حفظ التذكيرات وتفعيلها</span>
        </button>

        {/* iOS Note */}
        <p className="text-[10px] text-text-muted/70 text-center font-sans">
          (لهواتف آيفون: تتيح أبل التنبيهات عند تثبيت التطبيق على الشاشة الرئيسية عبر زر المشاركة ⎋ «إضافة إلى الشاشة الرئيسية»).
        </p>
      </div>
    </div>
  );
};
