// src/utils.js

export const PAGE_CACHE = new Map();

// حفظ الصفحة مع الاحتفاظ بآخر 10 صفحات فقط في الذاكرة للأداء
export function savePage(page, data) {
  PAGE_CACHE.set(page, data);
  if (PAGE_CACHE.size > 10) {
    const firstKey = PAGE_CACHE.keys().next().value;
    PAGE_CACHE.delete(firstKey);
  }
}

export function loadPage(page) {
  return PAGE_CACHE.get(page);
}

export function hasPage(page) {
  return PAGE_CACHE.has(page);
}

const numeralsAr = ["٠","١","٢","٣","٤","٥","٦","٧","٨","٩"];
export function toArabicNumber(n) {
  return String(n).split("").map(d => numeralsAr[+d] ?? d).join("");
}

