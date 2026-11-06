import React, { useState } from 'react';
import { QURAN_SURAHS, type SurahMeta } from '../../../data/quranSurahs';
import { Search, BookOpen } from 'lucide-react';

interface SurahListViewProps {
  onSelectSurah: (surah: SurahMeta) => void;
  currentPage: number;
}

export const SurahListView: React.FC<SurahListViewProps> = ({ onSelectSurah, currentPage }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSurahs: SurahMeta[] = QURAN_SURAHS.filter((s: SurahMeta) =>
    s.name.includes(searchQuery) ||
    s.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.id.toString() === searchQuery
  );

  return (
    <div className="space-y-3 animate-fade-in text-right">
      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="ابحث باسم السورة أو رقمها..."
          className="w-full bg-surface border border-border rounded-2xl py-3 pr-10 pl-4 text-xs text-text placeholder:text-text-muted focus:outline-none focus:border-primary/60 transition-colors"
        />
        <Search className="w-4 h-4 text-text-muted absolute right-3.5 top-3.5 pointer-events-none" />
      </div>

      {/* Surahs Count & Hint */}
      <div className="flex justify-between items-center text-xs text-text-muted px-1">
        <span>{filteredSurahs.length} سورة</span>
        <span>طبعة مصحف المدينة النبوية (٦٠٤ صفحات)</span>
      </div>

      {/* Surah List */}
      <div className="space-y-2 max-h-[520px] overflow-y-auto pr-0.5 scrollbar-thin">
        {filteredSurahs.map((surah: SurahMeta) => {
          const isCurrentSurah = currentPage >= surah.page && 
            (QURAN_SURAHS[surah.id] ? currentPage < QURAN_SURAHS[surah.id].page : currentPage <= 604);

          return (
            <div
              key={surah.id}
              onClick={() => onSelectSurah(surah)}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group active:scale-[0.99] ${
                isCurrentSurah
                  ? 'bg-primary-light/50 border-primary text-primary font-bold shadow-xs'
                  : 'bg-surface border-border hover:border-primary/40 text-text'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-xl border flex items-center justify-center font-mono text-xs font-semibold shrink-0 ${
                  isCurrentSurah 
                    ? 'bg-primary text-white border-primary' 
                    : 'bg-surface-elevated border-border text-text-muted group-hover:border-primary/40'
                }`}>
                  {surah.id}
                </div>

                <div className="text-right">
                  <div className="flex items-center gap-2">
                    <h4 className="font-alexandria font-bold text-sm leading-normal">
                      سورة {surah.name}
                    </h4>
                    <span className="text-[10px] text-accent px-1.5 py-0.5 rounded-md bg-accent-light/60 font-sans">
                      {surah.type === 'Makki' ? 'مكية' : 'مدنية'}
                    </span>
                  </div>
                  <span className="text-[11px] text-text-muted block mt-0.5">
                    {surah.ayahCount} آية · الجزء {surah.juz}
                  </span>
                </div>
              </div>

              <div className="text-left flex items-center gap-2">
                <span className="text-xs text-text-muted font-mono">
                  ص {surah.page}
                </span>
                <BookOpen className="w-4 h-4 text-text-muted group-hover:text-primary transition-colors" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
