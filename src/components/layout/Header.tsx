import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Sun, Moon, Settings } from 'lucide-react';
import { InstallAppButton } from '../common/PWAInstallBanner';

interface HeaderProps {
  onOpenSettings?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSettings }) => {
  const { theme, effectiveTheme, setTheme } = useTheme();

  const toggleTheme = () => {
    if (theme === 'system') {
      setTheme(effectiveTheme === 'dark' ? 'light' : 'dark');
    } else if (theme === 'dark') {
      setTheme('light');
    } else {
      setTheme('dark');
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-surface/85 backdrop-blur-md border-b border-border/80 px-4 py-3 transition-colors duration-200">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        {/* Brand Lockup */}
        <div className="flex items-center gap-3">
          <img 
            src="/maladh-logo-original.png" 
            alt="مَلَاذْ" 
            className="w-9 h-9 rounded-full shadow-sm object-cover shrink-0"
          />
          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-1.5 leading-none">
              <span className="font-alexandria font-bold text-base text-text">مَـلَاذْ</span>
              <span className="text-[10px] text-accent font-semibold font-mono">MALADH</span>
            </div>
            <p className="text-[11px] text-text-muted mt-1.5 leading-normal">أَثَرٌ لِقَلْبِكَ.. وَذُخْرٌ لِي</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          <InstallAppButton compact />

          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="w-9 h-9 rounded-xl bg-surface border border-border flex items-center justify-center text-text-muted hover:text-primary transition-colors cursor-pointer"
              title="الإعدادات"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="w-9 h-9 rounded-xl bg-surface border border-border flex items-center justify-center text-text-muted hover:text-primary transition-colors cursor-pointer"
            title={effectiveTheme === 'dark' ? 'التحويل للوضع الفاتح' : 'التحويل للوضع الداكن'}
            aria-label="تبديل المظهر"
          >
            {effectiveTheme === 'dark' ? (
              <Sun className="w-4 h-4 text-accent transition-transform duration-300 rotate-0 hover:rotate-90" />
            ) : (
              <Moon className="w-4 h-4 text-primary transition-transform duration-300 -rotate-12 hover:rotate-0" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
