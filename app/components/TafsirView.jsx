// components/TafsirView.jsx
import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import '../../public/styles/TafsirView.css';

const TafsirView = ({ 
  ayah, 
  onClose,
  tafsirData = null,
  isLoading = false
}) => {
  const [fontSize, setFontSize] = useState(16);
  const [showArabicOnly, setShowArabicOnly] = useState(false);
  const [currentTafsir, setCurrentTafsir] = useState(null);

  useEffect(() => {
    if (tafsirData && ayah) {
      // البحث عن تفسير الآية الحالية
      const tafsir = tafsirData.find(t => 
        t.sura_no === ayah.sura_no && 
        t.aya_no === ayah.aya_no
      );
      setCurrentTafsir(tafsir);
    } else if (ayah && ayah.aya_tafseer) {
      // إذا كان التفسير مضمن في بيانات الآية
      setCurrentTafsir({
        ...ayah,
        aya_tafseer: ayah.aya_tafseer
      });
    }
  }, [ayah, tafsirData]);

  const parseTafsirText = useCallback((tafsirText) => {
    if (!tafsirText) return { arabicText: '', translatedText: '', words: [] };
    
    // تقسيم النص إلى أجزاء
    const parts = tafsirText.split(/(<span class='aya'>.*?<\/span>)/g);
    
    const words = [];
    let arabicText = '';
    let translatedText = '';
    
    parts.forEach(part => {
      if (part.startsWith("<span class='aya'>")) {
        // استخراج نص الآية من الوسم
        const match = part.match(/<span class='aya'>(.*?)<\/span>/);
        if (match) {
          const ayahWord = match[1].replace('ﵡ', '').replace('ﵠ', '');
          words.push({
            text: ayahWord,
            isAyah: true,
            original: match[1]
          });
          arabicText += ayahWord;
        }
      } else {
        // نص التفسير العادي
        const lines = part.split('‏').filter(line => line.trim());
        lines.forEach(line => {
          if (line.trim()) {
            words.push({
              text: line.trim(),
              isAyah: false
            });
            
            // محاولة تمييز النص العربي عن الترجمة
            const isArabic = /[\u0600-\u06FF]/.test(line);
            if (isArabic) {
              arabicText += line + ' ';
            } else {
              translatedText += line + ' ';
            }
          }
        });
      }
    });
    
    return { arabicText: arabicText.trim(), translatedText: translatedText.trim(), words };
  }, []);

  const renderTafsirContent = () => {
    if (!currentTafsir) return null;
    
    const { arabicText, translatedText, words } = parseTafsirText(currentTafsir.aya_tafseer);
    
    if (showArabicOnly) {
      return (
        <div className="tafsir-arabic-only">
          <div className="tafsir-text" style={{ fontSize: `${fontSize}px` }}>
            {words.map((word, index) => (
              <span 
                key={index} 
                className={`tafsir-word ${word.isAyah ? 'ayah-word' : ''}`}
              >
                {word.isAyah ? (
                  <span className="quran-word-highlight">
                    {word.text}
                  </span>
                ) : word.text}
                {' '}
              </span>
            ))}
          </div>
        </div>
      );
    }
    
    return (
      <div className="tafsir-bilingual">
        <div className="tafsir-section arabic-section">
          <h4 className="section-title">التفسير العربي</h4>
          <div className="tafsir-text" style={{ fontSize: `${fontSize}px` }}>
            {words.map((word, index) => (
              <span 
                key={index} 
                className={`tafsir-word ${word.isAyah ? 'ayah-word' : ''}`}
              >
                {word.isAyah ? (
                  <span className="quran-word-highlight">
                    {word.text}
                  </span>
                ) : word.text}
                {' '}
              </span>
            ))}
          </div>
        </div>
        
        <div className="tafsir-section translation-section">
          <h4 className="section-title">معاني الكلمات</h4>
          <div className="translation-text" style={{ fontSize: `${fontSize - 2}px` }}>
            {translatedText || 'لا يوجد ترجمة متاحة'}
          </div>
        </div>
      </div>
    );
  };

  if (!ayah) return null;

  return (
    <div className="tafsir-modal-overlay" onClick={onClose}>
      <div className="tafsir-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="header-info">
            <h3 className="surah-name">{ayah.sura_name_ar}</h3>
            <div className="ayah-reference">
              <span className="ayah-number">آية {ayah.aya_no}</span>
              <span className="page-number">الصفحة {ayah.page}</span>
              <span className="juz-number">الجزء {ayah.jozz}</span>
            </div>
          </div>
          
          <div className="header-controls">
            <div className="font-controls">
              <button 
                className="font-btn smaller"
                onClick={() => setFontSize(prev => Math.max(12, prev - 1))}
                title="تصغير الخط"
              >
                A-
              </button>
              <span className="font-size">{fontSize}px</span>
              <button 
                className="font-btn larger"
                onClick={() => setFontSize(prev => Math.min(24, prev + 1))}
                title="تكبير الخط"
              >
                A+
              </button>
            </div>
            
            <button 
              className={`view-toggle translate ${showArabicOnly ? 'active' : ''}`}
              onClick={() => setShowArabicOnly(!showArabicOnly)}
              title={showArabicOnly ? 'عرض التفسير والترجمة' : 'عرض التفسير العربي فقط'}
              style={{display: "none"}}
            >
              {showArabicOnly ? '🌐' : '📖'}
            </button>
            
            <button className="close-btn" onClick={onClose} title="إغلاق">
              ✕
            </button>
          </div>
        </div>
        
        <div className="modal-body">
          <div className="ayah-display">
            <div className="ayah-text-container">
              <div className="ayah-text" style={{ fontSize: `${fontSize + 2}px` }}>
                {ayah.aya_text}
              </div>
              <div className="ayah-transcription">
                {ayah.aya_text_emlaey}
              </div>
            </div>
          </div>
          
          <div className="tafsir-content">
            {isLoading ? (
              <div className="loading-tafsir">
                <div className="spinner"></div>
                <span>جاري تحميل التفسير...</span>
              </div>
            ) : currentTafsir ? (
              renderTafsirContent()
            ) : (
              <div className="no-tafsir">
                <div className="no-data-icon">📝</div>
                <h4>لا يوجد تفسير متاح</h4>
                <p>لم يتم العثور على تفسير لهذه الآية</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="modal-footer">
          <div className="footer-navigation">
            <button className="nav-btn prev-btn" disabled>
              السابق
            </button>
            <button className="nav-btn next-btn" disabled>
              التالي
            </button>
          </div>
          
          <div className="footer-info">
            <span className="source-info">
              تفسير معاصر - الشيخ صالح بن عبدالله بن حميد
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

TafsirView.propTypes = {
  ayah: PropTypes.object,
  onClose: PropTypes.func.isRequired,
  tafsirData: PropTypes.array,
  isLoading: PropTypes.bool
};

export default TafsirView;