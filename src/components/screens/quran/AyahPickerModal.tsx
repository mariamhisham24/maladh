import React, { useState, useEffect } from 'react';
import { X, Check, Sparkles, CheckSquare, Square } from 'lucide-react';

interface ApiAyah {
  number: number;
  text: string;
  numberInSurah: number;
  juz: number;
  page: number;
  surah: {
    number: number;
    name: string;
    englishName: string;
    revelationType: string;
    numberOfAyahs: number;
  };
}

interface AyahPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  ayahs: ApiAyah[];
  pageNumber: number;
  onConfirm: (combinedText: string, attribution: string) => void;
}

const toArabicNumber = (num: number): string => {
  return num.toLocaleString('ar-EG');
};

export const AyahPickerModal: React.FC<AyahPickerModalProps> = ({
  isOpen,
  onClose,
  ayahs,
  pageNumber,
  onConfirm,
}) => {
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);

  // When modal opens or ayahs change, select the first ayah by default so user has an immediate valid selection
  useEffect(() => {
    if (isOpen && ayahs.length > 0) {
      setSelectedNumbers([ayahs[0].numberInSurah]);
    }
  }, [isOpen, ayahs]);

  if (!isOpen) return null;

  const toggleAyah = (numInSurah: number) => {
    setSelectedNumbers((prev) =>
      prev.includes(numInSurah)
        ? prev.filter((n) => n !== numInSurah)
        : [...prev, numInSurah]
    );
  };

  const selectAll = () => {
    setSelectedNumbers(ayahs.map((a) => a.numberInSurah));
  };

  const deselectAll = () => {
    setSelectedNumbers([]);
  };

  const handleConfirm = () => {
    if (selectedNumbers.length === 0) return;

    // Filter and sort the selected ayahs in their natural Quranic sequence
    const chosenAyahs = ayahs
      .filter((a) => selectedNumbers.includes(a.numberInSurah))
      .sort((a, b) => a.numberInSurah - b.numberInSurah);

    if (chosenAyahs.length === 0) return;

    // Build the merged text with proper aya markers
    const combinedText = chosenAyahs
      .map((a) => {
        let cleanText = a.text.trim();
        // Remove duplicated Basmala if at start of verse 1 (except Fatiha)
        if (a.numberInSurah === 1 && a.surah.number !== 1) {
          cleanText = cleanText.replace(/^بِسْمِ\s+ٱللَّهِ\s+ٱلرَّحْمَ[ٰـ]نِ\s+ٱلرَّحِيمِ\s*/, '');
        }
        return `${cleanText} ﴿${toArabicNumber(a.numberInSurah)}﴾`;
      })
      .join(' ');

    const surahName = chosenAyahs[0].surah.name;
    const minAyah = Math.min(...chosenAyahs.map((a) => a.numberInSurah));
    const maxAyah = Math.max(...chosenAyahs.map((a) => a.numberInSurah));

    let attribution = '';
    if (minAyah === maxAyah) {
      attribution = `سورة ${surahName} · آية ${toArabicNumber(minAyah)}`;
    } else {
      attribution = `سورة ${surahName} · الآيات (${toArabicNumber(minAyah)} - ${toArabicNumber(maxAyah)})`;
    }

    onConfirm(combinedText, attribution);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-4 bg-black/60 backdrop-blur-xs animate-fade-in text-right">
      <div 
        className="bg-surface border border-border rounded-3xl max-w-lg w-full max-h-[88vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 md:p-5 border-b border-border flex items-center justify-between bg-surface-elevated/40 shrink-0">
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-text-muted hover:text-text cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="text-right">
            <h3 className="font-alexandria font-bold text-base text-text">
              تحديد آيات للبطاقة
            </h3>
            <p className="text-xs text-text-muted mt-0.5">
              صفحة {toArabicNumber(pageNumber)} · حدد الآيات التي تريد إبرازها
            </p>
          </div>
        </div>

        {/* Quick Tools */}
        <div className="px-4 py-2.5 bg-surface-elevated/20 border-b border-border/60 flex items-center justify-between text-xs shrink-0">
          <div className="text-text-muted">
            تم تحديد <span className="font-bold text-primary font-mono">{toArabicNumber(selectedNumbers.length)}</span> من <span className="font-mono">{toArabicNumber(ayahs.length)}</span> آية
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={selectAll}
              className="text-primary hover:underline font-semibold cursor-pointer flex items-center gap-1"
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>تحديد الكل</span>
            </button>
            <span className="text-border">|</span>
            <button
              onClick={deselectAll}
              className="text-text-muted hover:text-text cursor-pointer flex items-center gap-1"
            >
              <Square className="w-3.5 h-3.5" />
              <span>إلغاء</span>
            </button>
          </div>
        </div>

        {/* Ayahs Scrollable List */}
        <div className="p-4 overflow-y-auto space-y-2.5 flex-1 divide-y divide-border/30">
          {ayahs.map((ayah) => {
            const isSelected = selectedNumbers.includes(ayah.numberInSurah);
            let displayText = ayah.text.trim();
            if (ayah.numberInSurah === 1 && ayah.surah.number !== 1) {
              displayText = displayText.replace(/^بِسْمِ\s+ٱللَّهِ\s+ٱلرَّحْمَ[ٰـ]نِ\s+ٱلرَّحِيمِ\s*/, '');
            }

            return (
              <div
                key={`picker_a_${ayah.surah.number}_${ayah.numberInSurah}`}
                onClick={() => toggleAyah(ayah.numberInSurah)}
                className={`pt-2.5 first:pt-0 p-3 rounded-2xl cursor-pointer transition-all border flex items-start gap-3 ${
                  isSelected
                    ? 'border-primary/60 bg-primary-light/40 shadow-xs'
                    : 'border-transparent hover:border-border hover:bg-surface-elevated/50'
                }`}
              >
                {/* Checkbox indicator */}
                <div
                  className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 mt-1 transition-colors ${
                    isSelected
                      ? 'bg-primary border-primary text-white'
                      : 'border-border bg-surface'
                  }`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                </div>

                {/* Ayah Content */}
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-text-muted">
                    <span className="font-alexandria font-semibold text-accent">
                      سورة {ayah.surah.name}
                    </span>
                    <span className="font-sans font-bold px-1.5 py-0.5 rounded-md bg-surface border border-border/80 text-text">
                      آية {toArabicNumber(ayah.numberInSurah)}
                    </span>
                  </div>
                  <p className="font-quran text-base leading-[2.2] text-text">
                    {displayText}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-border bg-surface-elevated/50 flex items-center justify-between gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-border text-xs font-semibold text-text hover:bg-surface cursor-pointer"
          >
            إلغاء
          </button>

          <button
            onClick={handleConfirm}
            disabled={selectedNumbers.length === 0}
            className="flex-1 py-2.5 px-4 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary/95 disabled:opacity-30 disabled:pointer-events-none cursor-pointer flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-[0.99]"
          >
            <Sparkles className="w-4 h-4 text-accent" />
            <span>
              {selectedNumbers.length > 0
                ? `إنشاء بطاقة (${toArabicNumber(selectedNumbers.length)} آيات مختارة)`
                : 'اختر آية واحدة على الأقل'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
