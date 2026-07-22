// src/App.jsx
import React, { useState, useEffect, useRef, useCallback } = 'react';
import { TOTAL_PAGES, getSurahName } from './data';
import { savePage, loadPage, hasPage, toArabicNumber } from './utils';
import { loadFont } from './fontLoader';
import { buildPage } from './layout';
import Mushaf from './Mushaf';
import './style.css';

export default function App() {
  const [page, setPage] = useState(1);
  const [night, setNight] = useState(true);
  const [words, setWords] = useState([]);
  const [groupedLines, setGroupedLines] = useState({});
  const [selectedAyahKey, setSelectedAyahKey] = useState(null);
  const [selectedAyahText, setSelectedAyahText] = useState("");
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState({ surahName: "", juz: 1, hizb: 1 });
  const [activeModal, setActiveModal] = useState(null);
  
  // 18) منع الضغط المتكرر أثناء التقليب
  const [changingPage, setChangingPage] = useState(false);
  const [showJump, setShowJump] = useState(false);
  const [jumpInput, setJumpInput] = useState("");

  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  // 20) استرجاع الصفحة والحالة المرجعية
  useEffect(() => {
    const lastPage = localStorage.getItem("last_page");
    if (lastPage) setPage(Number(lastPage));
    
    const lastAyah = localStorage.getItem("last_ayah");
    if (lastAyah) setSelectedAyahKey(lastAyah);
  }, []);

  useEffect(() => {
    localStorage.setItem("last_page", page);
    if (selectedAyahKey) {
      localStorage.setItem("last_ayah", selectedAyahKey);
    }
  }, [page, selectedAyahKey]);

  // 18) تغيير الصفحة مع الحماية والاهتزاز
  const handlePageChange = useCallback((newPage) => {
    if (changingPage || newPage < 1 || newPage > TOTAL_PAGES) return;
    setChangingPage(true);
    
    if (navigator.vibrate) navigator.vibrate(20); // 23) اهتزاز خفيف
    
    setPage(newPage);
    setTimeout(() => setChangingPage(false), 250);
  }, [changingPage]);

  // 19) دعم لوحة المفاتيح
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowLeft") handlePageChange(page + 1);
      if (e.key === "ArrowRight") handlePageChange(page - 1);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [page, handlePageChange]);

  // جلب البيانات واستخدام الـ Preload + Cache
  const fetchPageData = useCallback(async (p, isPreload = false) => {
    if (!isPreload) setLoading(true);

    // 11) استخدام Cache الذاكرة الفوري
    if (hasPage(p)) {
      const cached = loadPage(p);
      if (!isPreload) {
        setWords(cached.words);
        setGroupedLines(cached.groupedLines);
        setMeta(cached.meta);
        setLoading(false);
      }
      return;
    }

    try {
      await loadFont(p);
      const res = await fetch(`https://api.quran.com/api/v4/verses/by_page/${p}?words=true&word_fields=code_v2,line_number,text_uthmani,char_type_name&fields=chapter_id,juz_number,hizb_number`);
      const json = await res.json();

      if (json.verses && json.verses.length > 0) {
        const pageWords = [];
        json.verses.forEach(v => {
          v.words.forEach(w => {
            pageWords.push({
              id: w.id,
              code: w.code_v2,
              lineNumber: w.line_number,
              ayahKey: v.verse_key,
              charType: w.char_type_name,
              text: w.text_uthmani
            });
          });
        });

        const lines = buildPage(pageWords);
        const first = json.verses[0];
        const surahName = getSurahName(first.chapter_id);

        const pageMeta = {
          surahName,
          juz: first.juz_number,
          hizb: first.hizb_number
        };

        // حفظ البيانات في الـ Cache الذكي
        savePage(p, {
          words: pageWords,
          groupedLines: lines,
          meta: pageMeta
        });

        if (!isPreload) {
          setWords(pageWords);
          setGroupedLines(lines);
          setMeta(pageMeta);
          setLoading(false);
        }
      }
    } catch (e) {
      console.error("فشل التحميل:", e);
      if (!isPreload) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPageData(page);

    // 17) Preload للصفحات المجاورة (4 صفحات)
    const neighbors = [page - 2, page - 1, page + 1, page + 2];
    neighbors.forEach(p => {
      if (p >= 1 && p <= TOTAL_PAGES && !hasPage(p)) {
        fetchPageData(p, true);
      }
    });
  }, [page, fetchPageData]);

  // أحداث اللمس للسحب
  const handleTouchStart = (e) => { touchStartX.current = e.targetTouches[0].clientX; };
  const handleTouchMove = (e) => { touchEndX.current = e.targetTouches[0].clientX; };
  const handleTouchEnd = () => {
    const dist = touchStartX.current - touchEndX.current;
    if (Math.abs(dist) > 45 && touchEndX.current !== 0) {
      if (dist > 0) handlePageChange(page + 1);
      else handlePageChange(page - 1);
    }
    touchStartX.current = 0;
    touchEndX.current = 0;
  };

  const handleWordClick = useCallback((word) => {
    if (selectedAyahKey === word.ayahKey) {
      setSelectedAyahKey(null);
      setActiveModal(null);
    } else {
      setSelectedAyahKey(word.ayahKey);
      const text = words.filter(w => w.ayahKey === word.ayahKey).map(w => w.text).join(" ");
      setSelectedAyahText(text);
      setActiveModal('menu');
    }
  }, [selectedAyahKey, words]);

  return (
    <div className={`flex flex-col h-screen w-full ${night ? 'bg-[#0b1411] text-[#E9E0CC]' : 'bg-[#EFE7D3] text-[#241C12]'} transition-colors duration-300`}>
      
      {/* الهيدر العلوي */}
      <header className={`w-full py-2 px-4 flex items-center justify-between border-b shadow-md ${night ? 'bg-[#121f1a] border-emerald-900/40 text-amber-100' : 'bg-[#123328] text-white'}`}>
        <button 
          onClick={() => setNight(!night)} 
          className="text-xs px-3 py-1.5 rounded-full bg-emerald-900/40 border border-amber-500/30 text-amber-300 active:scale-95 transition"
        >
          {night ? "☀️ نهار" : "🌙 ليل"}
        </button>

        <div className="text-center">
          <div className="text-base font-bold text-amber-300">{meta.surahName || "المصحف الشريف"}</div>
          <div className="text-[11px] opacity-80 text-emerald-400">
            الجزء {toArabicNumber(meta.juz)} &nbsp;|&nbsp; الحزب {toArabicNumber(meta.hizb)}
          </div>
        </div>

        <div className="text-xs font-bold text-amber-300 bg-emerald-950/70 px-3 py-1 rounded-md border border-amber-500/20">
          {toArabicNumber(page)} / {toArabicNumber(TOTAL_PAGES)}
        </div>
      </header>

      {/* منطقة المصحف الرئيسية */}
      <main 
        className="flex-1 flex items-center justify-center p-2 sm:p-4 overflow-hidden relative"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <Mushaf 
          page={page}
          words={words}
          groupedLines={groupedLines}
          loading={loading}
          selectedAyahKey={selectedAyahKey}
          onWordClick={handleWordClick}
          night={night}
        />
      </main>

      {/* 14) زر الانتقال السريع العائم */}
      <button
        className="fixed bottom-6 right-6 w-12 h-12 rounded-full bg-amber-600/90 hover:bg-amber-600 text-white shadow-xl flex items-center justify-center text-lg z-30 transition active:scale-90"
        onClick={() => setShowJump(true)}
      >
        📖
      </button>

      {/* نافذة الانتقال السريع */}
      {showJump && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4" onClick={() => setShowJump(false)}>
          <div onClick={e => e.stopPropagation()} className="bg-[#121f1a] border border-amber-500/40 w-full max-w-xs rounded-2xl p-5 text-amber-100 text-center">
            <h3 className="text-sm font-bold text-amber-300 mb-3">الانتقال إلى صفحة</h3>
            <input 
              type="number"
              value={jumpInput}
              onChange={e => setJumpInput(e.target.value)}
              placeholder={`1 - ${TOTAL_PAGES}`}
              className="w-full text-center py-2 bg-emerald-950/60 border border-emerald-700/40 rounded-xl text-amber-200 outline-none mb-4"
            />
            <div className="flex gap-2">
              <button 
                onClick={() => {
                  const p = parseInt(jumpInput, 10);
                  if (p >= 1 && p <= TOTAL_PAGES) {
                    handlePageChange(p);
                    setShowJump(false);
                    setJumpInput("");
                  }
                }}
                className="flex-1 py-2 bg-amber-600 text-white rounded-xl text-xs font-bold"
              >
                انتقال
              </button>
              <button onClick={() => setShowJump(false)} className="flex-1 py-2 bg-emerald-900/40 text-amber-200 rounded-xl text-xs">إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Sheet للخيارات */}
      {selectedAyahKey && activeModal === 'menu' && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end justify-center p-0 sm:p-4" onClick={() => { setSelectedAyahKey(null); setActiveModal(null); }}>
          <div onClick={e => e.stopPropagation()} className="bottom-sheet-anim w-full sm:max-w-md bg-[#121f1a] text-amber-100 border-amber-500/30 border-t sm:border rounded-t-2xl sm:rounded-2xl p-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-amber-500/20 pb-3 mb-4">
              <span className="text-sm font-bold text-amber-300">
                الآية ({toArabicNumber(selectedAyahKey.split(':')[1])}) - {meta.surahName}
              </span>
              <button onClick={() => { setSelectedAyahKey(null); setActiveModal(null); }} className="text-xs bg-amber-500/20 px-2.5 py-1 rounded-full text-amber-300">✕</button>
            </div>

            <div className="grid grid-cols-2 gap-2.5 text-xs font-semibold">
              <button onClick={() => navigator.share ? navigator.share({ text: selectedAyahText }) : navigator.clipboard.writeText(selectedAyahText)} className="p-3 rounded-xl bg-emerald-900/30 border border-emerald-700/30 text-amber-200">
                📤 مشاركة / نسخ
              </button>
              <button onClick={() => setSelectedAyahKey(null)} className="p-3 rounded-xl bg-emerald-900/30 border border-emerald-700/30 text-amber-200">
                إلغاء التحديد
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
