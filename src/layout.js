// src/layout.js

export function buildPage(words) {
  const lines = [];
  // تقسيم الكلمات على 15 سطر ثابتين لمصحف المدينة
  for (let i = 1; i <= 15; i++) {
    lines.push(words.filter(w => w.lineNumber === i));
  }
  return lines;
}

