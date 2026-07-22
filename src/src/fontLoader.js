// src/fontLoader.js

const loadedFonts = new Set();

export async function loadFont(page) {
  const name = `QCF_V2_P${page}`;
  
  // التحقق إذا كان الخط موجود في الـ Cache أو محمل مسبقاً في المتصفح
  if (loadedFonts.has(name) || document.fonts.check(`16px ${name}`)) {
    loadedFonts.add(name);
    return true;
  }

  const url = `https://verses.quran.foundation/fonts/quran/hafs/v2/woff2/p${page}.woff2`;
  
  try {
    const font = new FontFace(name, `url(${url})`);
    await font.load();
    document.fonts.add(font);
    await document.fonts.ready; // منع الوميض
    loadedFonts.add(name);
    return true;
  } catch (e) {
    console.error("خطأ في تحميل الخط:", e);
    return false;
  }
}

