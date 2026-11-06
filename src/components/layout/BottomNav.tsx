import React from 'react';
import { Home, Sun, BookOpen, MoreHorizontal } from 'lucide-react';

export type TabKey = 'home' | 'navigator' | 'adhkar' | 'tasbeeh' | 'quran' | 'sunnah' | 'studio' | 'settings' | 'more';

interface BottomNavProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
}

// Concentric circle glyph for Tasbeeh (◉ / ◎) matching the Maladh design kit
const TasbeehIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="1.6" 
    className={className}
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="8" />
    <circle cx="12" cy="12" r="3.2" fill="currentColor" />
  </svg>
);

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { key: 'home' as TabKey, label: 'الرئيسية', icon: Home },
    { key: 'adhkar' as TabKey, label: 'الأذكار', icon: Sun },
    { key: 'tasbeeh' as TabKey, label: 'السبحة', icon: TasbeehIcon },
    { key: 'quran' as TabKey, label: 'القرآن', icon: BookOpen }, // Keeping Quran icon as requested
    { key: 'more' as TabKey, label: 'المزيد', icon: MoreHorizontal },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface/96 backdrop-blur-md border-t border-x border-border rounded-t-[26px] shadow-[0_-6px_24px_rgba(0,0,0,0.05)] transition-colors duration-200">
      <div className="flex items-center justify-around max-w-md mx-auto h-[68px] px-2 pt-1 pb-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => onTabChange(tab.key)}
              className={`flex-1 flex flex-col items-center justify-center h-full relative cursor-pointer transition-colors duration-200 ${
                isActive 
                  ? 'text-primary' 
                  : 'text-text-muted hover:text-text'
              }`}
            >
              {/* Golden Accent Line on top of active tab */}
              {isActive && (
                <span className="absolute -top-[5px] w-6 h-[2.5px] bg-accent rounded-full animate-fade-in" />
              )}
              
              <div className="flex items-center justify-center w-6 h-6 mb-1">
                <Icon className={`w-[19px] h-[19px] transition-transform duration-200 ${isActive ? 'scale-105' : 'stroke-[1.5]'}`} />
              </div>

              <span className={`text-[11px] font-sans leading-normal ${isActive ? 'font-bold' : 'font-normal'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
