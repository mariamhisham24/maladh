import React, { useState } from 'react';
import { Bell, Check, X, Clock } from 'lucide-react';

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

  if (!isOpen) return null;

  const handleSavePreferences = async () => {
    if ('Notification' in window && Notification.permission !== 'granted') {
      try {
        await Notification.requestPermission();
      } catch {
        // ignore
      }
    }

    localStorage.setItem(
      'maladh_notifications_config',
      JSON.stringify({
        morning: { enabled: morningReminder, time: morningTime },
        evening: { enabled: eveningReminder, time: eveningTime },
        quran: { enabled: quranReminder, time: quranTime },
      })
    );

    onSave();
    onClose();
  };

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

        {/* Action Button */}
        <button
          onClick={handleSavePreferences}
          className="w-full py-3.5 rounded-2xl bg-primary text-white font-alexandria font-bold text-xs flex items-center justify-center gap-2 hover:bg-primary/95 transition-all shadow-sm cursor-pointer"
        >
          <Check className="w-4 h-4" />
          <span>حفظ تذكيرات الورد</span>
        </button>
      </div>
    </div>
  );
};
