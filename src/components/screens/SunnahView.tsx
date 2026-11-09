import React, { useState, useEffect } from 'react';
import { SEED_SUNNAH, getDailySunnah, SUNNAH_CATEGORIES } from '../../data/seedData';
import { 
  ArrowRight, Star, Check, Sparkles, Bell, BellCheck, 
  ChevronRight, ChevronLeft, Shuffle, BookOpen, Search, X 
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { requestNotificationPermission, isNotificationGranted, sendDailySunnahNotification } from '../../utils/notifications';

interface SunnahViewProps {
  onBack?: () => void;
  onOpenInStudio?: (text: string, source: string) => void;
}

const toArabicNumber = (num: number): string => {
  return num.toLocaleString('ar-EG');
};

export const SunnahView: React.FC<SunnahViewProps> = ({ onBack, onOpenInStudio }) => {
  const { effectiveTheme } = useTheme();
  const sunnahList = SEED_SUNNAH;
  
  // Set today's sunnah as active initial item
  const daily = getDailySunnah();
  const initialIndex = SEED_SUNNAH.findIndex((s) => s.id === daily.id);
  const [currentIndex, setCurrentIndex] = useState<number>(initialIndex >= 0 ? initialIndex : 0);
  const [savedIds, setSavedIds] = useState<Record<string, boolean>>({});
  const [notifEnabled, setNotifEnabled] = useState<boolean>(false);
  const [notifMessage, setNotifMessage] = useState<string | null>(null);
  
  // Category filter & Browse Modal
  const [selectedCategory, setSelectedCategory] = useState<string>('الكل');
  const [showCatalogModal, setShowCatalogModal] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    const isGranted = isNotificationGranted();
    const isEnabled = localStorage.getItem('maladh_sunnah_notif_enabled') === 'true';
    setNotifEnabled(isGranted && isEnabled);
    
    // Load saved favorites
    try {
      const saved = localStorage.getItem('maladh_saved_sunnah_ids');
      if (saved) setSavedIds(JSON.parse(saved));
    } catch {}
  }, []);

  const currentSunnah = sunnahList[currentIndex] || sunnahList[0];
  const isSaved = !!savedIds[currentSunnah.id];

  const toggleSave = () => {
    const nextSaved = {
      ...savedIds,
      [currentSunnah.id]: !savedIds[currentSunnah.id]
    };
    setSavedIds(nextSaved);
    localStorage.setItem('maladh_saved_sunnah_ids', JSON.stringify(nextSaved));
  };

  const handleToggleNotifications = async () => {
    if (!notifEnabled) {
      const granted = await requestNotificationPermission();
      if (granted) {
        setNotifEnabled(true);
        localStorage.setItem('maladh_sunnah_notif_enabled', 'true');
        setNotifMessage('تم تفعيل التنبيهات وإرسال إشعار تجريبي بنجاح 🌿');
        setTimeout(() => setNotifMessage(null), 4000);
        await sendDailySunnahNotification(currentSunnah.title, currentSunnah.hadithText);
      } else {
        setNotifMessage('يرجى السماح بالإشعارات من إعدادات المتصفح');
        setTimeout(() => setNotifMessage(null), 4000);
      }
    } else {
      setNotifEnabled(false);
      localStorage.setItem('maladh_sunnah_notif_enabled', 'false');
      setNotifMessage('تم إيقاف تنبيهات السنن');
      setTimeout(() => setNotifMessage(null), 3000);
    }
  };

  const handleRandomSunnah = () => {
    let rand = Math.floor(Math.random() * sunnahList.length);
    if (rand === currentIndex) rand = (rand + 1) % sunnahList.length;
    setCurrentIndex(rand);
  };

  const handleResetToToday = () => {
    if (initialIndex >= 0) setCurrentIndex(initialIndex);
  };

  // Filtered list for Catalog Modal
  const filteredCatalog = sunnahList.filter((s) => {
    const matchCat = selectedCategory === 'الكل' || s.category === selectedCategory;
    const matchQuery = !searchQuery.trim() || 
      s.title.includes(searchQuery) || 
      s.hadithText.includes(searchQuery) ||
      s.source.includes(searchQuery);
    return matchCat && matchQuery;
  });

  return (
    <div className="space-y-4 pb-28 md:pb-8 animate-fade-in max-w-lg mx-auto text-right">
      {/* Top Bar with circular buttons */}
      <div className="flex items-center justify-between pt-1">
        {onBack ? (
          <button 
            onClick={onBack}
            className="w-9 h-9 rounded-full border border-border flex items-center justify-center text-text-muted hover:text-text cursor-pointer transition-colors"
            title="رجوع"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={() => setShowCatalogModal(true)}
            className="h-9 px-3 rounded-full border border-border flex items-center gap-1.5 text-xs text-text-muted hover:text-primary hover:border-primary/40 cursor-pointer transition-colors"
            title="فهرس السنن"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>موسوعة السنن ({toArabicNumber(sunnahList.length)})</span>
          </button>
        )}

        <div className="font-alexandria font-bold text-lg text-text">
          السنة النبوية
        </div>

        <button 
          onClick={toggleSave}
          className={`w-9 h-9 rounded-full border border-border flex items-center justify-center cursor-pointer transition-colors ${
            isSaved ? 'text-accent border-accent/40 bg-accent-light/50' : 'text-text-muted hover:text-text'
          }`}
          title={isSaved ? 'محفوظة في المفضلة' : 'حفظ'}
        >
          <Star className={`w-4 h-4 ${isSaved ? 'fill-accent' : ''}`} />
        </button>
      </div>

      {/* Greeting & Header */}
      <div className="pt-1 pb-1 flex items-center justify-between">
        <div>
          <span className="text-xs text-primary font-bold">
            {currentIndex === initialIndex ? 'سُنّة اليوم المقترحة 🌟' : 'سُنّة مختارة للاقتداء'}
          </span>
          <h1 className="font-alexandria font-bold text-2xl md:text-3xl text-text mt-0.5 leading-tight">
            {currentSunnah.title}
          </h1>
        </div>

        {currentIndex !== initialIndex && (
          <button
            onClick={handleResetToToday}
            className="text-xs font-semibold px-2.5 py-1 rounded-xl bg-accent-light/60 text-accent border border-accent/30 hover:bg-accent hover:text-white transition-all cursor-pointer shadow-xs shrink-0"
          >
            العودة لسنة اليوم
          </button>
        )}
      </div>

      {/* Quick Navigation and Explorer Row */}
      <div className="flex items-center justify-between gap-2 text-xs">
        <button
          onClick={() => setShowCatalogModal(true)}
          className="flex-1 py-2 px-3 rounded-xl bg-surface border border-border hover:border-primary/40 text-text font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-all"
        >
          <Search className="w-3.5 h-3.5 text-primary" />
          <span>بحث وتصفح ({toArabicNumber(sunnahList.length)} سُنّة)</span>
        </button>

        <button
          onClick={handleRandomSunnah}
          className="py-2 px-3 rounded-xl bg-surface border border-border hover:border-accent/40 text-text font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
          title="عرض سنة عشوائية للإلهام"
        >
          <Shuffle className="w-3.5 h-3.5 text-accent" />
          <span>سنة عشوائية</span>
        </button>
      </div>

      {/* Card 1: Primary Sunnah Card (Asymmetric serene curve 28px 28px 8px 28px) */}
      <div 
        className="p-5 md:p-6 border shadow-xs space-y-4"
        style={{
          borderRadius: '28px 28px 8px 28px',
          background: effectiveTheme === 'dark'
            ? 'linear-gradient(145deg, #1f2723, #13191d)'
            : 'linear-gradient(145deg, #f3ede0, #fcfbf8)',
          borderColor: effectiveTheme === 'dark' ? '#5a4d33' : '#dbcdb1'
        }}
      >
        {/* Badges: Category & Index */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-[11px] font-semibold text-primary bg-primary-light px-3 py-1 rounded-full">
            {currentSunnah.category || 'سنة نبوية موثقة'}
          </span>

          <span className="font-mono text-xs text-text-muted">
            سُنّة {toArabicNumber(currentIndex + 1)} من {toArabicNumber(sunnahList.length)}
          </span>
        </div>

        {/* Hadith quote placeholder with bottom gold border */}
        <div className="border-b border-[#C6A66B]/60 pb-5 pt-2">
          <p className="font-quran text-2xl md:text-[26px] text-text text-center leading-[2.3] select-text">
            {currentSunnah.hadithText}
          </p>
        </div>

        {/* Source line & Card Studio Button */}
        <div className="flex justify-between items-center text-xs text-text-muted pt-1">
          <div>
            <span className="block font-medium text-text">{currentSunnah.source}</span>
            <span className="text-[11px] text-accent font-semibold mt-0.5 block">الدرجة: {currentSunnah.grade}</span>
          </div>

          {onOpenInStudio && (
            <button
              onClick={() => onOpenInStudio(currentSunnah.hadithText, `${currentSunnah.title} · ${currentSunnah.source}`)}
              className="px-3.5 py-2 rounded-xl bg-accent text-white font-semibold text-xs hover:bg-accent/90 transition-all cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-[0.98]"
              title="اصنع بطاقة لمشاركتها"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>اصنع بطاقة ✦</span>
            </button>
          )}
        </div>
      </div>

      {/* Navigation Between Sunan */}
      <div className="flex items-center justify-between gap-2 pt-0.5">
        <button
          onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
          disabled={currentIndex === 0}
          className="flex-1 py-3 rounded-2xl bg-surface border border-border flex items-center justify-center gap-1.5 text-xs font-semibold text-text hover:border-primary/40 disabled:opacity-30 disabled:pointer-events-none cursor-pointer shadow-xs"
        >
          <ChevronRight className="w-4 h-4" />
          <span>السنة السابقة</span>
        </button>

        <button
          onClick={() => setCurrentIndex((prev) => Math.min(sunnahList.length - 1, prev + 1))}
          disabled={currentIndex === sunnahList.length - 1}
          className="flex-1 py-3 rounded-2xl bg-primary text-white flex items-center justify-center gap-1.5 text-xs font-semibold hover:bg-primary/95 disabled:opacity-30 disabled:pointer-events-none cursor-pointer shadow-xs"
        >
          <span>السنة التالية</span>
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Daily Notification Reminder Card */}
      <div className="bg-surface rounded-3xl p-4 border border-border shadow-xs space-y-2">
        <div className="flex items-center justify-between">
          <button
            onClick={handleToggleNotifications}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              notifEnabled
                ? 'bg-primary text-white shadow-xs'
                : 'bg-surface-elevated border border-border text-text hover:border-primary/40'
            }`}
          >
            {notifEnabled ? <BellCheck className="w-3.5 h-3.5" /> : <Bell className="w-3.5 h-3.5" />}
            <span>{notifEnabled ? 'التنبيه مفعّل' : 'تفعيل التنبيه'}</span>
          </button>

          <div>
            <h4 className="font-alexandria font-bold text-xs text-text">تنبيه بسنة كل يوم</h4>
            <p className="text-[11px] text-text-muted mt-0.5">تذكير هادئ بسنة نبوية متجددة يومياً</p>
          </div>
        </div>

        {notifMessage && (
          <div className="text-[11px] text-center font-medium py-1.5 px-3 rounded-xl bg-primary-light/60 text-primary border border-primary/20 animate-fade-in">
            {notifMessage}
          </div>
        )}
      </div>

      {/* Card 2: المعنى والتطبيق */}
      <div className="bg-surface rounded-3xl p-5 border border-border shadow-xs space-y-3">
        <h3 className="font-alexandria font-bold text-sm text-text">
          المعنى والتطبيق العملي
        </h3>
        <p className="text-xs text-text-muted leading-relaxed font-sans">
          {currentSunnah.reflection}
        </p>

        {/* Step list row */}
        <div className="space-y-2 pt-1">
          {currentSunnah.practicalSteps.map((step, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-surface-elevated border border-border/50">
              <div className="flex-1">
                <span className="text-[11px] font-sans text-text leading-relaxed block">
                  {step}
                </span>
              </div>
              <div className="w-7 h-7 rounded-xl bg-primary-light text-primary font-bold text-xs flex items-center justify-center shrink-0 mr-3">
                {toArabicNumber(idx + 1)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Save Toggle Button */}
      <button
        onClick={toggleSave}
        className={`w-full py-3.5 rounded-2xl border-2 font-alexandria font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs ${
          isSaved 
            ? 'bg-accent/15 border-accent text-accent font-bold' 
            : 'border-primary text-primary hover:bg-primary-light/50'
        }`}
      >
        {isSaved ? (
          <>
            <Check className="w-4 h-4" />
            <span>محفوظة في إشاراتك للرجوع إليها</span>
          </>
        ) : (
          <span>حفظ هذه السنة للرجوع إليها</span>
        )}
      </button>

      {/* ======================================================== */}
      {/* Catalog & Search Modal (All 100+ Sunan)                   */}
      {/* ======================================================== */}
      {showCatalogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-4 bg-black/60 backdrop-blur-xs animate-fade-in text-right">
          <div 
            className="bg-surface border border-border rounded-3xl max-w-lg w-full max-h-[88vh] flex flex-col shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 border-b border-border flex items-center justify-between bg-surface-elevated/40 shrink-0">
              <button
                onClick={() => setShowCatalogModal(false)}
                className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-text-muted hover:text-text cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="text-right">
                <h3 className="font-alexandria font-bold text-base text-text">
                  موسوعة السنن النبوية
                </h3>
                <p className="text-xs text-text-muted mt-0.5">
                  تصفح {toArabicNumber(sunnahList.length)} سُنّة نبوية موثقة من أمهات كتب الحديث
                </p>
              </div>
            </div>

            {/* Search Input Bar */}
            <div className="p-3 bg-surface-elevated/20 border-b border-border/60 shrink-0">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ابحث في السنن (مثال: سواك، مطر، وضوء، وتر، سلام)..."
                  className="w-full bg-surface border border-border rounded-xl pr-9 pl-4 py-2 text-xs text-text focus:outline-none focus:border-primary text-right"
                  autoFocus
                />
                <Search className="w-4 h-4 text-text-muted absolute right-3 top-2.5 pointer-events-none" />
              </div>

              {/* Category Pills Slider */}
              <div className="flex gap-1.5 overflow-x-auto pt-2 pb-0.5 no-scrollbar">
                {SUNNAH_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1 rounded-xl text-[11px] font-semibold whitespace-nowrap cursor-pointer transition-all ${
                      selectedCategory === cat
                        ? 'bg-primary text-white shadow-xs'
                        : 'bg-surface border border-border text-text hover:border-primary/40'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Results List */}
            <div className="p-3 md:p-4 overflow-y-auto space-y-2 flex-1 divide-y divide-border/30">
              {filteredCatalog.length === 0 ? (
                <div className="py-12 text-center text-xs text-text-muted">
                  لا توجد سنن تطابق بحثك الحالي
                </div>
              ) : (
                filteredCatalog.map((sunnah) => {
                  const sIdx = sunnahList.findIndex((item) => item.id === sunnah.id);
                  const isCurrent = sIdx === currentIndex;

                  return (
                    <div
                      key={sunnah.id}
                      onClick={() => {
                        setCurrentIndex(sIdx);
                        setShowCatalogModal(false);
                      }}
                      className={`pt-2 first:pt-0 p-3 rounded-2xl cursor-pointer transition-all border flex items-start justify-between gap-3 ${
                        isCurrent
                          ? 'border-primary bg-primary-light/40 shadow-xs'
                          : 'border-transparent hover:border-border hover:bg-surface-elevated/60'
                      }`}
                    >
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2 text-[11px]">
                          <span className="font-alexandria font-bold text-text">
                            {sunnah.title}
                          </span>
                          {sunnah.category && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface border border-border text-primary font-medium">
                              {sunnah.category}
                            </span>
                          )}
                        </div>
                        <p className="font-quran text-sm text-text-muted line-clamp-2 leading-relaxed">
                          {sunnah.hadithText}
                        </p>
                        <span className="text-[10px] text-accent block mt-0.5 font-sans">
                          {sunnah.source}
                        </span>
                      </div>

                      <span className="font-mono text-xs text-text-muted shrink-0 pt-1">
                        #{toArabicNumber(sIdx + 1)}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
