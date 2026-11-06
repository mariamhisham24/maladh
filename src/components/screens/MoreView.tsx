import React, { useState } from 'react';
import type { TabKey } from '../layout/BottomNav';
import { 
  Compass, 
  HeartHandshake, 
  Palette, 
  Settings as SettingsIcon, 
  ShieldCheck, 
  ChevronLeft,
  Sun,
  Moon,
  Monitor,
  Sparkles,
  Heart
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { AboutModal } from '../common/AboutModal';

interface MoreViewProps {
  onNavigate: (tab: TabKey) => void;
}

export const MoreView: React.FC<MoreViewProps> = ({ onNavigate }) => {
  const { theme, setTheme } = useTheme();
  const [isAboutOpen, setIsAboutOpen] = useState(false);

  const sections = [
    {
      key: 'navigator' as TabKey,
      title: 'الموجّه الروحي',
      subtitle: 'ماذا يثقل صدرك الآن؟ محتوى موثق يناسب حالتك',
      icon: Compass,
      color: 'text-primary',
      bgColor: 'bg-primary-light',
    },
    {
      key: 'sunnah' as TabKey,
      title: 'سنة اليوم',
      subtitle: 'إحياء السنن النبوية اليومية وتطبيقها في الحياة',
      icon: HeartHandshake,
      color: 'text-accent',
      bgColor: 'bg-accent-light',
    },
    {
      key: 'studio' as TabKey,
      title: 'استوديو البطاقات',
      subtitle: 'تصميم وتصدير بطاقات الآيات والأذكار محلياً',
      icon: Palette,
      color: 'text-primary',
      bgColor: 'bg-primary-light',
    },
    {
      key: 'settings' as TabKey,
      title: 'الإعدادات والبيانات',
      subtitle: 'المظهر، الاهتزاز، الصوت، والنسخ الاحتياطي المحلي',
      icon: SettingsIcon,
      color: 'text-text',
      bgColor: 'bg-surface-elevated',
    },
  ];

  return (
    <div className="space-y-5 pb-28 md:pb-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-primary-light text-primary flex items-center justify-center shrink-0">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <h1 className="font-alexandria font-bold text-2xl text-text leading-tight">المزيد</h1>
          <p className="text-xs text-text-muted mt-0.5">استكشف كافة أدوات مَلَاذْ وخصائص التجربة</p>
        </div>
      </div>

      {/* Quick Access Menu Cards */}
      <div className="space-y-3">
        {sections.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.key}
              onClick={() => onNavigate(item.key)}
              className="bg-surface rounded-2xl p-4 border border-border shadow-xs hover:border-primary/40 cursor-pointer transition-all flex items-center justify-between group active:scale-[0.99]"
            >
              <div className="flex items-center gap-3.5">
                <div className={`w-11 h-11 rounded-2xl ${item.bgColor} ${item.color} flex items-center justify-center shrink-0 border border-border-subtle`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-alexandria font-bold text-sm text-text group-hover:text-primary transition-colors leading-normal">
                    {item.title}
                  </h3>
                  <p className="text-xs text-text-muted mt-1 leading-normal line-clamp-1">
                    {item.subtitle}
                  </p>
                </div>
              </div>
              <ChevronLeft className="w-5 h-5 text-text-muted group-hover:text-primary transition-transform group-hover:-translate-x-1" />
            </div>
          );
        })}
      </div>

      {/* Quick Appearance Controls */}
      <div className="bg-surface rounded-2xl p-4 border border-border shadow-xs space-y-3">
        <span className="text-xs font-bold text-text block">مظهر التطبيق</span>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => setTheme('light')}
            className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-semibold transition-all cursor-pointer ${
              theme === 'light'
                ? 'bg-primary-light border-primary text-primary shadow-xs'
                : 'bg-surface-elevated border-border text-text-muted'
            }`}
          >
            <Sun className="w-3.5 h-3.5" />
            <span>فاتح</span>
          </button>
          <button
            onClick={() => setTheme('dark')}
            className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-semibold transition-all cursor-pointer ${
              theme === 'dark'
                ? 'bg-primary-light border-primary text-primary shadow-xs'
                : 'bg-surface-elevated border-border text-text-muted'
            }`}
          >
            <Moon className="w-3.5 h-3.5" />
            <span>داكن</span>
          </button>
          <button
            onClick={() => setTheme('system')}
            className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-semibold transition-all cursor-pointer ${
              theme === 'system'
                ? 'bg-primary-light border-primary text-primary shadow-xs'
                : 'bg-surface-elevated border-border text-text-muted'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>تلقائي</span>
          </button>
        </div>
      </div>

      {/* Local & Privacy Badge */}
      <div className="bg-border-subtle/50 rounded-2xl p-4 border border-border space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold text-primary">
          <ShieldCheck className="w-4 h-4 shrink-0" />
          <span>خصوصية تامة وبدون حساب</span>
        </div>
        <p className="text-xs text-text-muted leading-relaxed">
          جميع بياناتك، وأورادك، وجلسات التسبيح محفوظة محلياً على هذا الجهاز بنسبة 100%. لا نجمع أي بيانات ولا نعرض إعلانات.
        </p>
      </div>

      {/* About App - Clickable */}
      <div 
        onClick={() => setIsAboutOpen(true)}
        className="bg-accent-light/40 hover:bg-accent-light/70 border border-accent/20 rounded-2xl p-4 flex items-center justify-between cursor-pointer transition-all active:scale-[0.99] group"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-surface border border-accent/30 flex items-center justify-center text-accent shrink-0">
            <Heart className="w-4 h-4 fill-accent" />
          </div>
          <div>
            <span className="font-alexandria font-bold text-xs text-text block">عن مَلَاذْ ورسالة الصانعة</span>
            <span className="text-[11px] text-text-muted mt-0.5 block">«أَثَرٌ لِقَلْبِكَ.. وَذُخْرٌ لِي»</span>
          </div>
        </div>
        <ChevronLeft className="w-4 h-4 text-accent group-hover:-translate-x-1 transition-transform" />
      </div>

      {/* About Modal */}
      <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
    </div>
  );
};
