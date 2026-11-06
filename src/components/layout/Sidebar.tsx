import React from 'react';
import type { TabKey } from './BottomNav';
import { 
  Home, 
  Compass, 
  Sun, 
  Sparkles, 
  BookOpen, 
  HeartHandshake, 
  Palette, 
  Settings,
  ShieldCheck
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface SidebarProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  const { theme, setTheme } = useTheme();

  const navigationItems = [
    { key: 'home' as TabKey, label: 'الرئيسية', icon: Home, desc: 'نقطة الانطلاق والورد' },
    { key: 'navigator' as TabKey, label: 'الموجّه الروحي', icon: Compass, desc: 'ماذا يثقل صدرك؟' },
    { key: 'adhkar' as TabKey, label: 'الأذكار اليومية', icon: Sun, desc: 'الصباح والمساء والنوم' },
    { key: 'tasbeeh' as TabKey, label: 'السبحة الذكية', icon: Sparkles, desc: 'عدّ هادئ بيد واحدة' },
    { key: 'quran' as TabKey, label: 'القرآن والختمة', icon: BookOpen, desc: 'متابعة مرنة بلا ضغط' },
    { key: 'sunnah' as TabKey, label: 'سنة اليوم', icon: HeartHandshake, desc: 'إحياء السنن اليومية' },
    { key: 'studio' as TabKey, label: 'استوديو البطاقات', icon: Palette, desc: 'تصميم ومشاركة محلياً' },
    { key: 'settings' as TabKey, label: 'الإعدادات والبيانات', icon: Settings, desc: 'المظهر والنسخ الاحتياطي' },
  ];

  return (
    <aside className="hidden md:flex flex-col w-72 shrink-0 bg-surface border-l border-border h-screen sticky top-0 px-4 py-6 overflow-y-auto">
      {/* Brand Header */}
      <div className="flex items-center gap-3.5 px-3 mb-8">
        <img 
          src="/maladh-logo-icon.png" 
          alt="شعار مَلَاذْ" 
          className="w-11 h-11 rounded-full border border-accent/40 shadow-sm object-cover"
        />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-alexandria font-bold text-lg text-text">مَـلَاذْ</span>
              <span className="text-[10px] text-accent font-semibold font-mono">MALADH</span>
            </div>
            <p className="text-xs text-text-muted mt-1.5 leading-normal">أَثَرٌ لِقَلْبِكَ.. وَذُخْرٌ لِي</p>
          </div>
      </div>

      {/* Nav List */}
      <nav className="flex-1 space-y-1.5">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.key;
          return (
            <button
              key={item.key}
              onClick={() => onTabChange(item.key)}
              className={`w-full flex items-center gap-3.5 px-3.5 py-3 rounded-2xl text-right transition-all group ${
                isActive
                  ? 'bg-primary-light text-primary font-medium shadow-xs border border-primary/20'
                  : 'text-text-muted hover:text-text hover:bg-border-subtle/50'
              }`}
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                isActive 
                  ? 'bg-primary text-white shadow-sm' 
                  : 'bg-surface-elevated border border-border group-hover:border-primary/40'
              }`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 truncate">
                <div className="text-sm font-semibold leading-normal">{item.label}</div>
                <div className="text-[11px] text-text-muted truncate mt-1 leading-normal">{item.desc}</div>
              </div>
            </button>
          );
        })}
      </nav>

      {/* Footer Info & Privacy Indicator */}
      <div className="mt-6 pt-4 border-t border-border/80 px-2 space-y-3">
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
          <span>بياناتك محفوظة محلياً 100%</span>
        </div>
        
        {/* Quick Theme Switch */}
        <div className="bg-border-subtle/70 rounded-xl p-1.5 flex items-center justify-between text-xs">
          <button 
            onClick={() => setTheme('light')}
            className={`flex-1 py-1 rounded-lg text-center transition-all ${
              theme === 'light' ? 'bg-surface text-primary shadow-xs font-semibold' : 'text-text-muted'
            }`}
          >
            فاتح
          </button>
          <button 
            onClick={() => setTheme('dark')}
            className={`flex-1 py-1 rounded-lg text-center transition-all ${
              theme === 'dark' ? 'bg-surface text-primary shadow-xs font-semibold' : 'text-text-muted'
            }`}
          >
            داكن
          </button>
          <button 
            onClick={() => setTheme('system')}
            className={`flex-1 py-1 rounded-lg text-center transition-all ${
              theme === 'system' ? 'bg-surface text-primary shadow-xs font-semibold' : 'text-text-muted'
            }`}
          >
            تلقائي
          </button>
        </div>
      </div>
    </aside>
  );
};
