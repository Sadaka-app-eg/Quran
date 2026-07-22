// src/Mushaf.jsx
import React, { useMemo } from 'react';
import { toArabicNumber } from './utils';

// 6) مكون الكلمة المنفصل لمنع إعادة الرسم المكررة
const AyahWord = React.memo(({ word, page, isSelected, onClick }) => {
  return (
    <span
      onClick={() => onClick(word)}
      className={`quran-word ${isSelected ? 'quran-word-selected' : ''}`}
      style={{ fontFamily: `QCF_V2_P${page}` }}
    >
      {word.code}
      {word.charType === "end" && (
        <span className="ayah-number">
          {toArabicNumber(word.ayahKey.split(':')[1])}
        </span>
      )}
    </span>
  );
});

export default function Mushaf({ page, words, groupedLines, loading, selectedAyahKey, onWordClick, night }) {
  // 5) حساب حجم الخط الحقيقي أول صفحات المصحف
  const pageFontSize = useMemo(() => {
    return page <= 2 ? 42 : page <= 10 ? 39 : 35;
  }, [page]);

  // 16) استخدام useMemo لمنع إعادة حساب أسطر التجميع
  const linesData = useMemo(() => groupedLines, [groupedLines]);

  return (
    <div className={`mushaf-frame-container ${night ? 'bg-[#121f1a]' : 'bg-[#FFFDF7]'}`}>
      {/* خلفية الورق الطبيعية */}
      <div className="absolute inset-0 bg-cover opacity-[0.04] pointer-events-none" style={{ backgroundImage: `url('/paper.webp')` }}></div>
      <div className="absolute inset-3 rounded-[20px] border-[4px] border-[#8b6d2d]/30 pointer-events-none"></div>
      <div className="absolute inset-5 rounded-[16px] border border-[#b9953c]/40 pointer-events-none"></div>

      <div className="relative h-full px-4 sm:px-8 py-6 flex flex-col justify-between">
        
        {/* 22) Skeleton Loading عند تحميل الصفحة */}
        {loading ? (
          <div className="my-auto w-full px-2">
            {Array.from({ length: 15 }).map((_, i) => (
              <div key={i} className="skeleton-line" style={{ width: `${85 + (i % 3) * 5}%`, marginInline: 'auto' }}></div>
            ))}
          </div>
        ) : (
          /* 13) الأنيميشن بـ GPU على المحتوى الداخلي فقط */
          <div className="page-fade-inner qcf-page-grid" style={{ fontSize: `${pageFontSize}px` }}>
            {Array.from({ length: 15 }, (_, i) => i + 1).map((lineNum) => {
              /* 7) Lazy Rendering للأسطر */
              const lineWords = linesData[lineNum] || [];
              return (
                <div key={lineNum} className="quran-line">
                  {lineWords.map((word) => (
                    <AyahWord
                      key={word.id}
                      word={word}
                      page={page}
                      isSelected={selectedAyahKey === word.ayahKey}
                      onClick={onWordClick}
                    />
                  ))}
                </div>
              );
            })}
          </div>
        )}

        {/* رقم الصفحة السفلي */}
        <div className="text-center text-xs font-bold opacity-60 border-t border-amber-500/20 pt-1.5 text-amber-300">
          {toArabicNumber(page)}
        </div>
      </div>
    </div>
  );
}

