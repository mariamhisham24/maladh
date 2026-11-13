import React from 'react';

interface SurahHeaderBannerProps {
  surahNumber: number;
  surahName: string;
  revelationType: string;
  numberOfAyahs: number;
}

const toArabicNumber = (num: number): string => {
  return num.toLocaleString('ar-EG');
};

export const SurahHeaderBanner: React.FC<SurahHeaderBannerProps> = ({
  surahNumber,
  surahName,
  revelationType,
  numberOfAyahs,
}) => {
  const cleanName = surahName.replace(/^(سُورَةُ|سورة)\s*/, '');
  const isMeccan = revelationType === 'Meccan' || revelationType === 'Makki';
  const typeText = isMeccan ? 'مَكِّيَّةٌ' : 'مَدَنِيَّةٌ';
  const ayahCountText = `آيَاتُهَا ${toArabicNumber(numberOfAyahs)}`;

  return (
    <div className="my-6 select-none animate-fade-in" dir="rtl">
      {/* Authentic Medina Mushaf Ornate Surah Header Frame */}
      <div className="relative mx-auto max-w-xl w-full">
        {/* Decorative Outer Container */}
        <div 
          className="relative rounded-2xl border-2 border-[#C6A667]/80 dark:border-[#967C46]/90 bg-gradient-to-r from-[#FAF3E0] via-[#FFFDF8] to-[#FAF3E0] dark:from-[#1A222D] dark:via-[#141A22] dark:to-[#1A222D] p-2.5 sm:p-3.5 shadow-sm overflow-hidden"
          style={{
            boxShadow: 'inset 0 0 0 2px rgba(198, 166, 107, 0.25), 0 4px 14px rgba(198, 166, 107, 0.12)'
          }}
        >
          {/* Subtle Islamic Geometric Background Pattern Overlay */}
          <div 
            className="absolute inset-0 opacity-[0.06] dark:opacity-[0.12] pointer-events-none"
            style={{
              backgroundImage: `radial-gradient(circle at 10px 10px, #C6A667 2px, transparent 0)`,
              backgroundSize: '20px 20px'
            }}
          />

          <div className="relative flex items-center justify-between gap-2 z-10">
            {/* Right Wing: Revelation Type & Islamic Arabesque Motif */}
            <div className="hidden sm:flex items-center gap-1.5 min-w-[90px] justify-start text-[#8A6D3B] dark:text-[#D4AF37]">
              <svg className="w-5 h-5 opacity-70 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L14 8L20 6L16 11L21 15L15 16L15 22L11 17L6 20L8 14L2 12L8 9L7 3L12 6Z" fillOpacity="0.4" stroke="currentColor" strokeWidth="0.5"/>
              </svg>
              <span className="font-alexandria text-[11px] font-semibold text-[#8A6D3B] dark:text-[#E2C792] whitespace-nowrap">
                {typeText}
              </span>
            </div>

            {/* Center: Ornate Cartouche with Calligraphic Surah Name */}
            <div className="flex-1 flex flex-col items-center justify-center text-center px-2">
              <div className="inline-flex items-center gap-2">
                <span className="text-[#C6A667] text-sm opacity-60">❖</span>
                <h3 className="font-quran text-2xl sm:text-3xl font-bold text-[#14120E] dark:text-[#FBF7ED] tracking-wide drop-shadow-xs">
                  سُورَةُ {cleanName}
                </h3>
                <span className="text-[#C6A667] text-sm opacity-60">❖</span>
              </div>

              {/* Mobile Subtitle (when wings are hidden on small screens) */}
              <div className="flex sm:hidden items-center gap-2 text-[10px] text-[#8A6D3B] dark:text-[#D4AF37] mt-0.5 font-sans">
                <span>{typeText}</span>
                <span>•</span>
                <span>{ayahCountText}</span>
              </div>
            </div>

            {/* Left Wing: Ayah Count & Islamic Arabesque Motif */}
            <div className="hidden sm:flex items-center gap-1.5 min-w-[90px] justify-end text-[#8A6D3B] dark:text-[#D4AF37]">
              <span className="font-alexandria text-[11px] font-semibold text-[#8A6D3B] dark:text-[#E2C792] whitespace-nowrap">
                {ayahCountText}
              </span>
              <svg className="w-5 h-5 opacity-70 shrink-0 transform scale-x-[-1]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L14 8L20 6L16 11L21 15L15 16L15 22L11 17L6 20L8 14L2 12L8 9L7 3L12 6Z" fillOpacity="0.4" stroke="currentColor" strokeWidth="0.5"/>
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Centered Calligraphic Basmalah (For all Surahs except Al-Fatihah 1 and At-Tawbah 9) */}
      {surahNumber !== 1 && surahNumber !== 9 && (
        <div className="text-center my-4 sm:my-5 select-none">
          <div className="inline-flex items-center justify-center gap-3 px-6 py-1">
            <span className="text-[#C6A667] text-lg select-none opacity-70 font-serif">۝</span>
            <div className="font-quran text-2xl sm:text-3xl text-[#14120E] dark:text-[#FAF6EE] tracking-wide font-normal">
              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
            </div>
            <span className="text-[#C6A667] text-lg select-none opacity-70 font-serif">۝</span>
          </div>
        </div>
      )}
    </div>
  );
};
