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

  // قائمة السور المختصرة (الأكثر قراءة)
  const popularSurahs = [
    { number: 1, name: 'الفاتحة' },
    { number: 2, name: 'البقرة' },
    { number: 3, name: 'آل عمران' },
    { number: 36, name: 'يس' },
    { number: 18, name: 'الكهف' },
    { number: 67, name: 'الملك' },
    { number: 55, name: 'الرحمن' },
    { number: 56, name: 'الواقعة' },
    { number: 9, name: 'التوبة' },
    { number: 112, name: 'الإخلاص' },
    { number: 113, name: 'الفلق' },
    { number: 114, name: 'الناس' }
  ];

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

  // اختيار سورة من الاختصارات
  const handleSurahShortcut = (surahNumber) => {
    setSelectedSurah(surahNumber.toString());
    
    // تحميل بيانات السورة المختارة
    const surahAyahs = ayahs.filter(ayah => 
      ayah.sura_no === parseInt(surahNumber)
    );
    
    if (surahAyahs.length > 0) {
      const max = Math.max(...surahAyahs.map(a => a.aya_no));
      setMaxAyah(max);
      setToAyah(max.toString());
      setFromAyah('1');
    }
  };

  // اختيار نطاق كامل للسورة
  const handleFullSurah = (surahNumber) => {
    setSelectedSurah(surahNumber.toString());
    
    const surahAyahs = ayahs.filter(ayah => 
      ayah.sura_no === parseInt(surahNumber)
    );
    
    if (surahAyahs.length > 0) {
      const max = Math.max(...surahAyahs.map(a => a.aya_no));
      setMaxAyah(max);
      setToAyah(max.toString());
      setFromAyah('1');
      
      // البحث مباشرة عن السورة كاملة
      setTimeout(() => {
        onSearch(surahNumber.toString(), 1, max);
      }, 300);
    }
  };

  // البحث عن السورة كاملة
  const searchFullSurah = () => {
    if (!selectedSurah) {
      setSearchError('يرجى اختيار سورة');
      return;
    }
    
    onSearch(selectedSurah, 1, maxAyah);
  };

  // البحث عن نطاق محدد
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

  // الحصول على اسم السورة المختارة
  const getSelectedSurahName = () => {
    if (!selectedSurah) return '';
    const surah = surahList.find(s => s.number.toString() === selectedSurah);
    return surah ? surah.name : '';
  };

  // الحصول على معلومات السور الشعبية من بيانات القرآن
  const getPopularSurahData = () => {
    return popularSurahs.map(popular => {
      const surahData = surahList.find(s => s.number === popular.number);
      return {
        ...popular,
        name: surahData ? surahData.name : popular.name
      };
    }).filter(surah => surah.name); // إزالة السور غير الموجودة في البيانات
  };

  const ayahOptions = generateAyahOptions();
  const popularSurahData = getPopularSurahData();

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
          {/* أزرار اختيار سريعة للسور */}
          <div className="quick-surah-shortcuts">
            <h4 className="shortcuts-title">
              <span className="shortcut-icon">⚡</span>
              اختصار البحث
            </h4>
            <div className="shortcuts-grid">
              {popularSurahData.slice(0, 6).map(surah => (
                <button
                  key={surah.number}
                  className={`surah-shortcut-btn ${
                    selectedSurah === surah.number.toString() ? 'active' : ''
                  }`}
                  onClick={() => handleSurahShortcut(surah.number)}
                >
                  <span className="shortcut-surah-number">{surah.number}</span>
                  <span className="shortcut-surah-name">{surah.name}</span>
                </button>
              ))}
            </div>
            
            {popularSurahData.length > 6 && (
              <div className="more-shortcuts">
                <div className="more-grid">
                  {popularSurahData.slice(6).map(surah => (
                    <button
                      key={surah.number}
                      className={`surah-shortcut-btn small ${
                        selectedSurah === surah.number.toString() ? 'active' : ''
                      }`}
                      onClick={() => handleSurahShortcut(surah.number)}
                    >
                      <span className="shortcut-surah-number">{surah.number}</span>
                      <span className="shortcut-surah-name">{surah.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

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
                  {getSelectedSurahName()}
                </span>
                <span className="ayah-count">
                  عدد الآيات: {maxAyah}
                </span>
              </div>
            )}
          </div>

          {/* أزرار سريعة للاختيار */}
          <div className="quick-actions-section">
            <div className="quick-action-buttons">
              <button 
                className="quick-action-btn full-surah-btn"
                onClick={searchFullSurah}
                disabled={!selectedSurah}
              >
                <span className="action-icon">📖</span>
                <span className="action-text">السورة كاملة</span>
              </button>
              
              <button 
                className="quick-action-btn last-ten-btn"
                onClick={() => {
                  if (selectedSurah && maxAyah > 10) {
                    setFromAyah(Math.max(1, maxAyah - 9).toString());
                    setToAyah(maxAyah.toString());
                  }
                }}
                disabled={!selectedSurah || maxAyah <= 10}
              >
                <span className="action-icon">🔟</span>
                <span className="action-text">العشر الأخيرة</span>
              </button>
              
              <button 
                className="quick-action-btn first-ten-btn"
                onClick={() => {
                  if (selectedSurah) {
                    setFromAyah('1');
                    setToAyah(Math.min(10, maxAyah).toString());
                  }
                }}
                disabled={!selectedSurah}
              >
                <span className="action-icon">🔢</span>
                <span className="action-text">العشر الأولى</span>
              </button>
            </div>
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
                <span className="separator-text">→</span>
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
                  {`${getSelectedSurahName()} 
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
            
            <div className="search-buttons-group">
              <button 
                className="search-full-btn"
                onClick={searchFullSurah}
                disabled={!selectedSurah}
              >
                <span className="btn-icon">📖</span>
                السورة كاملة
              </button>
              
              <button 
                className="search-btn"
                onClick={handleSearch}
                disabled={!selectedSurah || parseInt(fromAyah) > parseInt(toAyah)}
              >
                <span className="btn-icon">🔍</span>
                بحث بالنطاق
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SearchBottomSheet;