import React from 'react';

interface AyahEndMarkerProps {
  ayahNumber: number;
}

const toArabicNumber = (num: number): string => {
  return num.toLocaleString('ar-EG');
};

export const AyahEndMarker: React.FC<AyahEndMarkerProps> = ({ ayahNumber }) => {
  const arNum = toArabicNumber(ayahNumber);
  const fontSize = arNum.length > 2 ? 10.5 : arNum.length > 1 ? 12 : 13.5;

  return (
    <span 
      className="inline-flex items-center justify-center align-middle mx-1 sm:mx-1.5 select-none whitespace-nowrap cursor-default"
      style={{ verticalAlign: 'middle', transform: 'translateY(-2px)' }}
      title={`الآية ${arNum}`}
    >
      <svg
        className="w-7 h-7 sm:w-8 sm:h-8 text-[#C6A667] dark:text-[#D4AF37] transition-transform duration-200 hover:scale-110 drop-shadow-xs"
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Outer 8-point geometric rosette */}
        <circle 
          cx="18" 
          cy="18" 
          r="16" 
          stroke="currentColor" 
          strokeWidth="1.2" 
          strokeDasharray="2.5 1.5" 
          opacity="0.65" 
        />
        {/* Inner solid circular ring with warm ivory/gold tint */}
        <circle 
          cx="18" 
          cy="18" 
          r="14" 
          stroke="currentColor" 
          strokeWidth="1.4" 
          className="fill-[#FAF6EC]/80 dark:fill-[#1C2530]/80"
        />
        {/* Subtle inner framing ring */}
        <circle 
          cx="18" 
          cy="18" 
          r="11.5" 
          stroke="currentColor" 
          strokeWidth="0.8" 
          opacity="0.5" 
        />
        
        {/* 4 Cardinal Decorative Islamic Corner Points */}
        <polygon points="18,2 19.5,4.5 16.5,4.5" fill="currentColor" opacity="0.8" />
        <polygon points="18,34 19.5,31.5 16.5,31.5" fill="currentColor" opacity="0.8" />
        <polygon points="2,18 4.5,19.5 4.5,16.5" fill="currentColor" opacity="0.8" />
        <polygon points="34,18 31.5,19.5 31.5,16.5" fill="currentColor" opacity="0.8" />

        {/* Centered Eastern Arabic Numeral (١، ٢، ٣...) */}
        <text
          x="18"
          y="18.5"
          textAnchor="middle"
          dominantBaseline="central"
          className="font-bold fill-[#7D5E28] dark:fill-[#F5E6C8]"
          style={{
            fontSize: `${fontSize}px`,
            fontFamily: "'Amiri', 'Amiri Quran', 'IBM Plex Sans Arabic', serif",
            fontWeight: 700,
          }}
        >
          {arNum}
        </text>
      </svg>
    </span>
  );
};
