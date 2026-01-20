"use client"
import React, { useState, useEffect, useRef } from 'react';
import '../../public/styles/SearchBottomSheet.css';

const SearchBottomSheet = ({ isVisible, onClose, onSearch, ayahs }) => {
  const [surahList, setSurahList] = useState([]);
  const [selectedSurah, setSelectedSurah] = useState('');
  const [fromAyah, setFromAyah] = useState('1');
  const [toAyah, setToAyah] = useState('1');
  const [maxAyah, setMaxAyah] = useState(1);
  const [searchError, setSearchError] = useState('');
  const sheetRef = useRef(null);
  const overlayRef = useRef(null);

  // استخراج قائمة السور
  useEffect(() => {
    if (ayahs && ayahs.length > 0) {
      const uniqueSurahs = [];
      const seen = new Set();
      
      ayahs.forEach(ayah => {
        if (!seen.has(ayah.sura_no)) {
          seen.add(ayah.sura_no);
          uniqueSurahs.push({
            number: ayah.sura_no,
            name: ayah.sura_name_ar,
            nameEn: ayah.sura_name_en
          });
        }
      });
      
      setSurahList(uniqueSurahs);
      
      // تحديد السورة الأولى افتراضيًا
      if (uniqueSurahs.length > 0 && !selectedSurah) {
        setSelectedSurah(uniqueSurahs[0].number.toString());
      }
    }
  }, [ayahs]);

  // تحديث عدد الآيات عند اختيار سورة
  useEffect(() => {
    if (selectedSurah && ayahs.length > 0) {
      const surahAyahs = ayahs.filter(ayah => 
        ayah.sura_no === parseInt(selectedSurah)
      );
      
      if (surahAyahs.length > 0) {
        const max = Math.max(...surahAyahs.map(a => a.aya_no));
        setMaxAyah(max);
        setToAyah(max.toString());
        setFromAyah('1');
      }
    }
  }, [selectedSurah, ayahs]);

  // إغلاق البوتوم شيت عند الضغط خارجها
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isVisible && 
          sheetRef.current && 
          !sheetRef.current.contains(event.target) &&
          overlayRef.current &&
          overlayRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isVisible, onClose]);

  // منع التمرير عند فتح البوتوم شيت
  useEffect(() => {
    if (isVisible) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isVisible]);

  const handleSearch = () => {
    setSearchError('');
    
    // التحقق من المدخلات
    if (!selectedSurah) {
      setSearchError('يرجى اختيار سورة');
      return;
    }
    
    const from = parseInt(fromAyah);
    const to = parseInt(toAyah);
    
    if (isNaN(from) || isNaN(to)) {
      setSearchError('يرجى إدخال أرقام صحيحة');
      return;
    }
    
    if (from < 1 || from > maxAyah) {
      setSearchError(`رقم الآية الأولى يجب أن يكون بين 1 و ${maxAyah}`);
      return;
    }
    
    if (to < 1 || to > maxAyah) {
      setSearchError(`رقم الآية الأخيرة يجب أن يكون بين 1 و ${maxAyah}`);
      return;
    }
    
    if (from > to) {
      setSearchError('رقم الآية الأولى يجب أن يكون أقل من أو يساوي الآية الأخيرة');
      return;
    }
    
    // تنفيذ البحث
    onSearch(selectedSurah, from, to);
  };

  // توليد قائمة أرقام الآيات
  const generateAyahOptions = () => {
    const options = [];
    for (let i = 1; i <= maxAyah; i++) {
      options.push(i);
    }
    return options;
  };

  const ayahOptions = generateAyahOptions();

  if (!isVisible) return null;

  return (
    <>
      <div className="bottom-sheet-overlay" ref={overlayRef}></div>
      <div 
        className={`bottom-sheet-container ${isVisible ? 'visible' : ''}`}
        ref={sheetRef}
      >
        <div className="sheet-header">
          <div className="sheet-handle"></div>
          <div className="header-content">
            <h3>بحث عن آيات القرآن الكريم</h3>
            <button className="close-btn" onClick={onClose}>
              ✕
            </button>
          </div>
        </div>
        
        <div className="sheet-content">
          {/* اختيار السورة */}
          <div className="input-group">
            <label htmlFor="surah-select">
              <span className="label-icon">📖</span>
              اختر السورة
            </label>
            <select 
              id="surah-select"
              value={selectedSurah}
              onChange={(e) => setSelectedSurah(e.target.value)}
              className="surah-select"
            >
              {surahList.map(surah => (
                <option key={surah.number} value={surah.number}>
                  {surah.number}. {surah.name} ({surah.nameEn})
                </option>
              ))}
            </select>
            
            {selectedSurah && (
              <div className="surah-info">
                <span className="surah-name">
                  {surahList.find(s => s.number.toString() === selectedSurah)?.name}
                </span>
                <span className="ayah-count">
                  عدد الآيات: {maxAyah}
                </span>
              </div>
            )}
          </div>

          {/* تحديد نطاق الآيات */}
          <div className="range-group">
            <div className="range-header">
              <span className="range-icon">↔️</span>
              <span>تحديد نطاق الآيات</span>
            </div>
            
            <div className="range-inputs">
              <div className="range-input">
                <label htmlFor="from-ayah">من آية:</label>
                <select 
                  id="from-ayah"
                  value={fromAyah}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFromAyah(value);
                    if (parseInt(value) > parseInt(toAyah)) {
                      setToAyah(value);
                    }
                  }}
                >
                  {ayahOptions.map(num => (
                    <option key={`from-${num}`} value={num}>
                      {num}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="range-separator">
              </div>
              
              <div className="range-input">
                <label htmlFor="to-ayah">إلى آية:</label>
                <select 
                  id="to-ayah"
                  value={toAyah}
                  onChange={(e) => setToAyah(e.target.value)}
                  disabled={parseInt(fromAyah) === maxAyah}
                >
                  {ayahOptions
                    .filter(num => num >= parseInt(fromAyah))
                    .map(num => (
                      <option key={`to-${num}`} value={num}>
                        {num}
                      </option>
                    ))}
                </select>
              </div>
            </div>
            
            <div className="range-summary">
              <div className="summary-item">
                <span className="summary-label">عدد الآيات المحددة:</span>
                <span className="summary-value">
                  {parseInt(toAyah) - parseInt(fromAyah) + 1} آية
                </span>
              </div>
              
              {selectedSurah && fromAyah && toAyah && (
                <div className="preview-text">
                  {`${surahList.find(s => s.number.toString() === selectedSurah)?.name} 
                  (من آية ${fromAyah} إلى آية ${toAyah})`}
                </div>
              )}
            </div>
          </div>

          {/* رسالة الخطأ */}
          {searchError && (
            <div className="error-message">
              ⚠️ {searchError}
            </div>
          )}

          {/* أزرار التنفيذ */}
          <div className="action-buttons">
            <button 
              className="cancel-btn"
              onClick={onClose}
            >
              إلغاء
            </button>
            
            <button 
              className="search-btn"
              onClick={handleSearch}
            >
              <span className="btn-icon">🔍</span>
              بحث
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default SearchBottomSheet;