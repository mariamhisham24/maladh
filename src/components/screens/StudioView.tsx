import React, { useState, useEffect, useRef } from 'react';
import { RotateCcw, Share2, Download, Copy, Check, Sparkles, Type } from 'lucide-react';
import { toPng, toBlob } from 'html-to-image';

interface StudioViewProps {
  onBack?: () => void;
  initialContent?: { text?: string; source?: string };
}

interface ColorTheme {
  id: string;
  name: string;
  swatchColor: string;
  background: string;
  textColor: string;
  subtextColor: string;
  borderColor: string;
  innerBorderColor: string;
  watermark: string;
  watermarkOpacity: number;
}

const COLOR_THEMES: ColorTheme[] = [
  {
    id: 'night',
    name: 'كحلي ليلي',
    swatchColor: '#0A0D14',
    background: 'radial-gradient(ellipse at 15% 10%, #20332a 0%, transparent 45%), linear-gradient(150deg, #101820 0%, #080b10 100%)',
    textColor: '#F5F2EB',
    subtextColor: '#C6A66B',
    borderColor: '#9E824C',
    innerBorderColor: 'rgba(198, 166, 107, 0.45)',
    watermark: '/botanical-night.png',
    watermarkOpacity: 0.35,
  },
  {
    id: 'ivory',
    name: 'عاجي هادئ',
    swatchColor: '#F7F4ED',
    background: 'linear-gradient(150deg, #F5EFE1 0%, #FDFBF7 100%)',
    textColor: '#18231F',
    subtextColor: '#8D7039',
    borderColor: '#CBB792',
    innerBorderColor: 'rgba(180, 150, 90, 0.4)',
    watermark: '/botanical-ivory.png',
    watermarkOpacity: 0.28,
  },
  {
    id: 'emerald',
    name: 'أخضر زمردي',
    swatchColor: '#17362E',
    background: 'radial-gradient(ellipse at 20% 12%, #2d584c 0%, transparent 52%), linear-gradient(150deg, #142e26 0%, #071511 100%)',
    textColor: '#F5F2EB',
    subtextColor: '#D4BC88',
    borderColor: '#4A7F70',
    innerBorderColor: 'rgba(212, 188, 136, 0.45)',
    watermark: '/botanical-night.png',
    watermarkOpacity: 0.35,
  },
  {
    id: 'bronze',
    name: 'ذهبي برونزي دافئ',
    swatchColor: '#6B5226',
    background: 'radial-gradient(ellipse at 18% 12%, #5a451f 0%, transparent 55%), linear-gradient(150deg, #2e210c 0%, #130d03 100%)',
    textColor: '#FBF7EE',
    subtextColor: '#E8CA8C',
    borderColor: '#A88746',
    innerBorderColor: 'rgba(232, 202, 140, 0.5)',
    watermark: '/botanical-night.png',
    watermarkOpacity: 0.3,
  },
  {
    id: 'slate',
    name: 'رمادي كحلي',
    swatchColor: '#151B24',
    background: 'radial-gradient(ellipse at 15% 10%, #283342 0%, transparent 48%), linear-gradient(150deg, #161d26 0%, #0b0e13 100%)',
    textColor: '#F5F2EB',
    subtextColor: '#C6A66B',
    borderColor: '#485669',
    innerBorderColor: 'rgba(198, 166, 107, 0.45)',
    watermark: '/botanical-night.png',
    watermarkOpacity: 0.32,
  },
];

export const StudioView: React.FC<StudioViewProps> = ({ initialContent }) => {
  const [aspectRatio, setAspectRatio] = useState<'9:16' | '1:1' | 'wallpaper'>('9:16');
  const [selectedThemeId, setSelectedThemeId] = useState<string>('night');
  const [fontSizeLevel, setFontSizeLevel] = useState<'صغير' | 'متوسط' | 'كبير'>('متوسط');
  const [showLibrary, setShowLibrary] = useState<boolean>(false);
  const [showCustomEdit, setShowCustomEdit] = useState<boolean>(false);
  const [cardText, setCardText] = useState<string>(initialContent?.text || 'أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ');
  const [cardSubtext, setCardSubtext] = useState<string>(initialContent?.source || 'سورة الرعد · آية ٢٨');
  const [copied, setCopied] = useState<boolean>(false);
  const [sharing, setSharing] = useState<boolean>(false);
  const [downloading, setDownloading] = useState<boolean>(false);

  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialContent?.text) {
      setCardText(initialContent.text);
      setCardSubtext(initialContent.source || '');
    }
  }, [initialContent]);

  const textOptions = [
    { text: 'أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ', subtext: 'سورة الرعد · آية ٢٨' },
    { text: 'وَإِذَا سَأَلَكَ عِبَادِي عَنِّي فَإِنِّي قَرِيبٌ', subtext: 'سورة البقرة · آية ١٨٦' },
    { text: 'حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ', subtext: 'سورة آل عمران · آية ١٧٣' },
    { text: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ ، سُبْحَانَ اللَّهِ الْعَظِيمِ', subtext: 'صحيح البخاري ومسلم' },
    { text: 'رَبِّ إِنِّي لِمَا أَنْزَلْتَ إِلَيَّ مِنْ خَيْرٍ فَقِيرٌ', subtext: 'سورة القصص · آية ٢٤' },
    { text: 'لَا إِلَهَ إِلَّا أَنْتَ سُبْحَانَكَ إِنِّي كُنْتُ مِنَ الظَّالِمِينَ', subtext: 'سورة الأنبياء · آية ٨٧' },
    { text: 'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ', subtext: 'سورة البقرة · آية ٢٥٥' },
    { text: 'فَاصْبِرْ صَبْرًا جَمِيلًا', subtext: 'سورة المعارج · آية ٥' },
  ];

  const currentTheme = COLOR_THEMES.find((t) => t.id === selectedThemeId) || COLOR_THEMES[0];

  const handleReset = () => {
    setCardText('أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ');
    setCardSubtext('سورة الرعد · آية ٢٨');
    setSelectedThemeId('night');
    setAspectRatio('9:16');
    setFontSizeLevel('متوسط');
    setShowLibrary(false);
    setShowCustomEdit(false);
  };

  const cycleFontSize = (direction: 'up' | 'down') => {
    if (direction === 'up') {
      if (fontSizeLevel === 'صغير') setFontSizeLevel('متوسط');
      else if (fontSizeLevel === 'متوسط') setFontSizeLevel('كبير');
    } else {
      if (fontSizeLevel === 'كبير') setFontSizeLevel('متوسط');
      else if (fontSizeLevel === 'متوسط') setFontSizeLevel('صغير');
    }
  };

  // Smart responsive font sizing calculated from text length to prevent overflow
  const getDynamicFontSizeStyle = () => {
    const len = cardText.length;
    let factor = fontSizeLevel === 'كبير' ? 1.25 : fontSizeLevel === 'صغير' ? 0.85 : 1.05;

    if (aspectRatio === '1:1') factor *= 0.92;

    let baseSize = 22;
    if (len < 40) baseSize = 26;
    else if (len < 80) baseSize = 21;
    else if (len < 140) baseSize = 17;
    else if (len < 220) baseSize = 14.5;
    else if (len < 320) baseSize = 13;
    else baseSize = 11.5;

    const computedPx = Math.round(baseSize * factor);

    return {
      fontSize: `${computedPx}px`,
      lineHeight: computedPx > 18 ? 2.3 : 2.1,
    };
  };

  // Export card using html-to-image: 100% exact pixel replica of what is visible on screen
  const handleExportPNG = async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      // 1. Try toBlob first (most reliable on mobile & desktop)
      const blob = await toBlob(cardRef.current, {
        pixelRatio: 2.5,
        cacheBust: true,
      });

      if (blob) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `maladh-card-${Date.now()}.png`;
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 2000);
      } else {
        // Fallback to toPng
        const dataUrl = await toPng(cardRef.current, {
          pixelRatio: 2.5,
          cacheBust: true,
        });
        const link = document.createElement('a');
        link.download = `maladh-card-${Date.now()}.png`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setDownloading(false);
    }
  };

  // Direct share to apps using html-to-image to generate an identical blob
  const handleShareApp = async () => {
    if (!cardRef.current) return;
    setSharing(true);
    try {
      const blob = await toBlob(cardRef.current, {
        pixelRatio: 3,
        cacheBust: true,
      });

      if (blob && navigator.share) {
        try {
          const file = new File([blob], 'maladh-card.png', { type: 'image/png' });
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
              title: 'بطاقة من مَـلَاذْ',
              text: `${cardText}\n— ${cardSubtext}`,
              files: [file],
            });
            return;
          }
        } catch {
          // If file sharing was cancelled or unhandled, try text share
        }
      }

      // Text share fallback
      if (navigator.share) {
        try {
          await navigator.share({
            title: 'مَـلَاذْ',
            text: `«${cardText}»\n— ${cardSubtext}\n\nعبر تطبيق مَـلَاذْ`,
          });
          return;
        } catch {}
      }

      // If Web Share is not available on desktop, download PNG
      await handleExportPNG();
    } catch (err) {
      console.error('Share error:', err);
    } finally {
      setSharing(false);
    }
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(`«${cardText}»\n— ${cardSubtext}\n\nعبر تطبيق مَـلَاذْ`).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="space-y-4 pb-28 md:pb-8 animate-fade-in max-w-lg mx-auto text-right">
      {/* Top Header */}
      <div className="flex items-center justify-between pt-1">
        <div className="w-9 h-9" />

        <div className="font-alexandria font-bold text-lg text-text">
          استوديو البطاقات
        </div>

        <button 
          onClick={handleReset}
          className="w-9 h-9 rounded-full border border-border flex items-center justify-center text-text-muted hover:text-text cursor-pointer transition-colors"
          title="إعادة ضبط"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Greeting & Hint */}
      <div className="pt-1 pb-1">
        <h1 className="font-alexandria font-bold text-2xl md:text-3xl text-text leading-tight">
          اصنع بطاقة هادئة
        </h1>
        <p className="text-xs text-text-muted mt-1 leading-normal">
          نسّق آية أو ذكراً أو سنة بتصميم مطابق تماماً لما تشاركه وتحفظه.
        </p>
      </div>

      {/* Aspect Ratio Selector */}
      <div className="bg-surface rounded-3xl p-4 md:p-5 border border-border shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-text-muted">المقاس المطلوب للبطاقة</span>
          <h3 className="font-alexandria font-bold text-sm text-text">
            المقاس
          </h3>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => setAspectRatio('9:16')}
            className={`py-2 px-3 rounded-2xl text-xs transition-all cursor-pointer font-alexandria flex flex-col items-center justify-center gap-1 ${
              aspectRatio === '9:16'
                ? 'border-2 border-primary bg-primary-light/50 text-primary font-bold shadow-xs'
                : 'bg-surface-elevated border border-border text-text hover:border-primary/40'
            }`}
          >
            <span>قصة (ستوري)</span>
            <span className="text-[10px] font-mono text-text-muted">9:16</span>
          </button>

          <button
            onClick={() => setAspectRatio('1:1')}
            className={`py-2 px-3 rounded-2xl text-xs transition-all cursor-pointer font-alexandria flex flex-col items-center justify-center gap-1 ${
              aspectRatio === '1:1'
                ? 'border-2 border-primary bg-primary-light/50 text-primary font-bold shadow-xs'
                : 'bg-surface-elevated border border-border text-text hover:border-primary/40'
            }`}
          >
            <span>منشور مربع</span>
            <span className="text-[10px] font-mono text-text-muted">1:1</span>
          </button>

          <button
            onClick={() => setAspectRatio('wallpaper')}
            className={`py-2 px-3 rounded-2xl text-xs transition-all cursor-pointer font-alexandria flex flex-col items-center justify-center gap-1 ${
              aspectRatio === 'wallpaper'
                ? 'border-2 border-primary bg-primary-light/50 text-primary font-bold shadow-xs'
                : 'bg-surface-elevated border border-border text-text hover:border-primary/40'
            }`}
          >
            <span>خلفية هاتف</span>
            <span className="text-[10px] font-mono text-text-muted">9:19.5</span>
          </button>
        </div>
      </div>

      {/* Live Preview Container: Exactly captured via cardRef */}
      <div className="w-full flex items-center justify-center p-3 sm:p-6 bg-surface-elevated/40 rounded-3xl border border-border/60">
        <div
          ref={cardRef}
          className={`relative overflow-hidden flex flex-col justify-between text-center select-none transition-all duration-300 shadow-2xl ${
            aspectRatio === '9:16'
              ? 'w-[300px] min-h-[500px] p-6'
              : aspectRatio === '1:1'
              ? 'w-[320px] aspect-square p-6'
              : 'w-[290px] min-h-[540px] p-6'
          }`}
          style={{
            borderRadius: '24px',
            background: currentTheme.background,
            border: `1.5px solid ${currentTheme.borderColor}`,
            boxShadow: 'inset 0 0 0 6px rgba(255, 255, 255, 0.04), 0 20px 40px rgba(0,0,0,0.25)',
            color: currentTheme.textColor,
          }}
        >
          {/* Subtle Botanical Watermark */}
          <div 
            className="absolute -left-[24px] -top-[16px] w-[150px] h-[190px] pointer-events-none rotate-[12deg]"
            style={{
              backgroundImage: `url(${currentTheme.watermark})`,
              backgroundSize: 'contain',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              opacity: currentTheme.watermarkOpacity,
            }}
          />

          {/* Golden Ornate Inner Border Frame */}
          <div 
            className="absolute inset-[12px] rounded-[18px] pointer-events-none" 
            style={{ border: `1px solid ${currentTheme.innerBorderColor}` }}
          />

          {/* Top Brand Tag */}
          <div className="relative z-10 pt-2 shrink-0">
            <div 
              className="font-alexandria font-bold text-xs tracking-wider"
              style={{ color: currentTheme.subtextColor }}
            >
              مَـلَاذْ · MALADH
            </div>
            <div className="font-sans text-[10px] opacity-75 mt-0.5">
              أَثَرٌ لِقَلْبِكَ.. وَذُخْرٌ لِي
            </div>
          </div>

          {/* Center Verse / Content Area with Smart Font Auto-Fit */}
          <div className="relative z-10 my-auto px-2 py-4 flex flex-col items-center justify-center max-w-full">
            <p
              className="font-quran select-none drop-shadow-sm text-center break-words max-w-full"
              style={getDynamicFontSizeStyle()}
            >
              {cardText}
            </p>
          </div>

          {/* Bottom Citation & Source */}
          <div className="relative z-10 pb-2 shrink-0">
            <div 
              className="font-sans text-[11px] font-semibold tracking-wide"
              style={{ color: currentTheme.subtextColor }}
            >
              {cardSubtext || 'مَلَاذْ · أَثَرٌ لِقَلْبِكَ'}
            </div>
          </div>
        </div>
      </div>

      {/* Content Customization & Library Section */}
      <div className="bg-surface rounded-3xl p-4 md:p-5 border border-border shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => {
                setShowCustomEdit(!showCustomEdit);
                if (showLibrary) setShowLibrary(false);
              }}
              className="text-xs font-semibold text-primary hover:underline cursor-pointer flex items-center gap-1"
            >
              <Type className="w-3.5 h-3.5" />
              <span>{showCustomEdit ? 'إخفاء التعديل' : 'تعديل النص'}</span>
            </button>
            <span className="text-border">|</span>
            <button 
              onClick={() => {
                setShowLibrary(!showLibrary);
                if (showCustomEdit) setShowCustomEdit(false);
              }}
              className="text-xs font-semibold text-accent hover:underline cursor-pointer flex items-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{showLibrary ? 'إغلاق النماذج' : 'اختر من النماذج'}</span>
            </button>
          </div>

          <h3 className="font-alexandria font-bold text-sm text-text">
            المحتوى
          </h3>
        </div>

        {/* Custom Edit Textarea */}
        {showCustomEdit && (
          <div className="space-y-2 pt-2 animate-fade-in border-t border-border-subtle">
            <label className="text-[11px] text-text-muted block">
              نص الآية أو الذكر:
            </label>
            <textarea
              value={cardText}
              onChange={(e) => setCardText(e.target.value)}
              rows={3}
              className="w-full bg-surface-elevated border border-border rounded-xl p-3 text-xs text-text focus:outline-none focus:border-primary text-right font-quran leading-relaxed resize-none"
              placeholder="اكتب أو عدل النص هنا..."
            />
            <label className="text-[11px] text-text-muted block mt-1">
              المصدر أو التوثيق:
            </label>
            <input
              type="text"
              value={cardSubtext}
              onChange={(e) => setCardSubtext(e.target.value)}
              className="w-full bg-surface-elevated border border-border rounded-xl px-3 py-2 text-xs text-text focus:outline-none focus:border-primary text-right"
              placeholder="مثال: سورة البقرة · آية ٢٥٥"
            />
          </div>
        )}

        {/* Library of Verified Texts */}
        {showLibrary && (
          <div className="space-y-2 pt-2 animate-fade-in border-t border-border-subtle max-h-56 overflow-y-auto">
            {textOptions.map((opt, i) => (
              <div
                key={i}
                onClick={() => {
                  setCardText(opt.text);
                  setCardSubtext(opt.subtext);
                  setShowLibrary(false);
                }}
                className={`p-3 rounded-2xl border text-xs cursor-pointer transition-all ${
                  cardText === opt.text
                    ? 'border-primary bg-primary-light text-primary font-bold'
                    : 'border-border bg-surface-elevated text-text hover:border-primary/40'
                }`}
              >
                <p className="line-clamp-2 font-quran text-sm leading-relaxed">{opt.text}</p>
                <span className="text-[10px] text-accent block mt-1">{opt.subtext}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Theme & Styling Customization */}
      <div className="bg-surface rounded-3xl p-4 md:p-5 border border-border shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs text-text-muted">{currentTheme.name}</span>
          <h3 className="font-alexandria font-bold text-sm text-text">
            الخلفية والألوان
          </h3>
        </div>

        {/* Swatches */}
        <div className="flex items-center justify-end gap-3 pt-1">
          {COLOR_THEMES.map((theme) => {
            const isSelected = selectedThemeId === theme.id;
            return (
              <button
                key={theme.id}
                onClick={() => setSelectedThemeId(theme.id)}
                className={`w-9 h-9 rounded-full cursor-pointer transition-all border-2 border-surface shadow-xs flex items-center justify-center ${
                  isSelected ? 'scale-110 ring-2 ring-primary ring-offset-2 ring-offset-bg' : 'hover:scale-105 opacity-85'
                }`}
                style={{ backgroundColor: theme.swatchColor }}
                title={theme.name}
              />
            );
          })}
        </div>

        {/* Font Size Tuner */}
        <div className="flex items-center justify-between border-t border-border-subtle pt-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => cycleFontSize('down')}
              className="text-xs font-bold text-primary hover:bg-primary-light px-3 py-1.5 rounded-xl bg-surface-elevated border border-border cursor-pointer transition-colors"
              title="تصغير النص"
            >
              − تصغير
            </button>
            <button
              onClick={() => cycleFontSize('up')}
              className="text-xs font-bold text-primary hover:bg-primary-light px-3 py-1.5 rounded-xl bg-surface-elevated border border-border cursor-pointer transition-colors"
              title="تكبير النص"
            >
              ＋ تكبير
            </button>
          </div>

          <div className="text-right">
            <strong className="font-alexandria font-bold text-xs text-text block">
              حجم النص التلقائي
            </strong>
            <span className="text-[11px] text-text-muted block font-mono">
              مستوى {fontSizeLevel} (يُضبط تلقائيًا حسب الطول)
            </span>
          </div>
        </div>
      </div>

      {/* Actions: Share directly to apps + Download PNG + Copy Text */}
      <div className="space-y-2.5">
        <button
          onClick={handleShareApp}
          disabled={sharing}
          className="w-full py-4 rounded-2xl bg-primary text-white font-alexandria font-bold text-sm flex items-center justify-center gap-2.5 hover:bg-primary/95 transition-all shadow-md cursor-pointer active:scale-[0.99] disabled:opacity-50"
        >
          <Share2 className="w-4 h-4" />
          <span>{sharing ? 'جاري تجهيز الصورة للمشاركة...' : 'مشاركة مباشرة للتطبيقات (صورة)'}</span>
        </button>

        <div className="flex gap-2.5">
          <button
            onClick={handleExportPNG}
            disabled={downloading}
            className="flex-1 py-3 rounded-2xl bg-surface border border-border text-text font-alexandria font-semibold text-xs flex items-center justify-center gap-2 hover:border-primary/40 transition-all cursor-pointer shadow-xs active:scale-[0.99] disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 text-accent" />
            <span>{downloading ? 'جاري التحميل...' : 'تحميل الصورة (PNG بدقة عالية)'}</span>
          </button>

          <button
            onClick={handleCopyText}
            className="px-4 py-3 rounded-2xl bg-surface border border-border text-text font-alexandria font-semibold text-xs flex items-center justify-center gap-1.5 hover:border-primary/40 transition-all cursor-pointer shadow-xs active:scale-[0.99]"
            title="نسخ النص"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5 text-text-muted" />}
            <span>{copied ? 'تم النسخ' : 'نسخ النص'}</span>
          </button>
        </div>
      </div>

      {/* Local Verification Notice */}
      <div className="text-center text-xs text-text-muted pt-1">
        تتم المعالجة محليًا في جهازك وبنفس الجودة تمامًا دون أي وسيط خارجي.
      </div>
    </div>
  );
};
