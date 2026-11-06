import React from 'react';
import { X, Heart, ShieldCheck, Sparkles } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  const { effectiveTheme } = useTheme();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="relative w-full max-w-lg bg-surface rounded-3xl border border-accent/30 shadow-2xl overflow-hidden p-6 md:p-8 animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle Botanical Watermark */}
        <div 
          className="absolute -left-10 -bottom-10 w-48 h-48 opacity-15 pointer-events-none"
          style={{
            backgroundImage: `url(${effectiveTheme === 'dark' ? '/botanical-night.png' : '/botanical-ivory.png'})`,
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat'
          }}
        />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 left-5 w-8 h-8 rounded-full bg-border-subtle/80 flex items-center justify-center text-text-muted hover:text-text cursor-pointer transition-colors"
          aria-label="إغلاق"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header / Brand Lockup */}
        <div className="flex flex-col items-center text-center pt-2 pb-4">
          <img 
            src="/maladh-logo-icon.png" 
            alt="شعار مَلَاذْ" 
            className="w-14 h-14 rounded-2xl border border-accent/40 shadow-sm object-cover mb-3"
          />
          <h2 className="font-alexandria font-bold text-2xl text-text leading-tight">مَـلَاذْ | MALADH</h2>
          <span className="text-xs text-accent font-semibold tracking-wider font-mono mt-0.5">
            A PERSONAL SPIRITUAL COMPANION
          </span>
          <p className="text-xs text-text-muted mt-1.5 font-medium">«أَثَرٌ لِقَلْبِكَ.. وَذُخْرٌ لِي»</p>
        </div>

        {/* Maker's Message (رسالة الصانعة) */}
        <div className="relative my-4 p-5 rounded-2xl bg-gradient-to-br from-accent-light/40 to-primary-light/30 border border-accent/30 text-center space-y-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-accent">
            <Heart className="w-3.5 h-3.5 fill-accent" />
            رسالة من القلب
          </span>
          <p className="font-sans text-sm md:text-base text-text leading-relaxed select-text font-medium">
            «صُنعت هذه المساحة لتكون ملاذاً هادئاً وخالصاً لوجه الله، بلا إعلانات ولا تشتيت.. أرجو بها أثراً يُصلح يومك، وذُخراً يثقل ميزاني يوم ألقى ربي. لا تنسني من صالح دعائك بظهر الغيب.»
          </p>
        </div>

        {/* Core Pillars */}
        <div className="space-y-2.5 my-4 text-xs text-text-muted">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-accent shrink-0" />
            <span>مبادرة فردية خالصة لوجه الله واحتساباً للأجر والصدقة الجارية.</span>
          </div>
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
            <span>خصوصية ومحلية 100% دون حسابات، خوادم، أو تتبع رقمي.</span>
          </div>
        </div>

        {/* Footer Action */}
        <div className="pt-3 border-t border-border-subtle flex justify-center">
          <button
            onClick={onClose}
            className="w-full py-3.5 rounded-2xl bg-primary text-white font-alexandria font-semibold text-sm hover:bg-primary/95 transition-all shadow-sm cursor-pointer"
          >
            تقبّل الله ونفع بكِ 🤍
          </button>
        </div>
      </div>
    </div>
  );
};
