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
  const [recentSurahs, setRecentSurahs] = useState([]);
  const [lastSurah, setLastSurah] = useState(null);
  const [showRecent, setShowRecent] = useState(true);
  
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

  // تحميل آخر السور التي تم زيارتها
  useEffect(() => {
    loadRecentSurahs();
    loadLastSurah();
  }, []);

  // تحميل السور الأخيرة من localStorage
  const loadRecentSurahs = () => {
    try {
      const saved = localStorage.getItem('quran_recent_surahs');
      if (saved) {
        const recent = JSON.parse(saved);
        setRecentSurahs(recent);
      }
    } catch (error) {
      console.error('Error loading recent surahs:', error);
    }
  };

  // تحميل آخر سورة تم زيارتها
  const loadLastSurah = () => {
    try {
      const saved = localStorage.getItem('quran_last_surah');
      if (saved) {
        const last = JSON.parse(saved);
        setLastSurah(last);
        // تعيينها كسورة مختارة افتراضياً
        if (last && last.number) {
          setSelectedSurah(last.number.toString());
        }
      }
    } catch (error) {
      console.error('Error loading last surah:', error);
    }
  };

  // حفظ السورة كآخر سورة تمت زيارتها
  const saveLastSurah = (surahNumber, from, to) => {
    try {
      const surahData = surahList.find(s => s.number === surahNumber);
      if (!surahData) return;
      
      const lastSurahData = {
        number: surahNumber,
        name: surahData.name,
        fromAyah: from,
        toAyah: to,
        visitedAt: new Date().toISOString()
      };
      
      // حفظ كآخر سورة
      localStorage.setItem('quran_last_surah', JSON.stringify(lastSurahData));
      setLastSurah(lastSurahData);
      
      // إضافة إلى السور الأخيرة
      addToRecentSurahs(lastSurahData);
      
    } catch (error) {
      console.error('Error saving last surah:', error);
    }
  };

  // إضافة سورة إلى قائمة السور الأخيرة
  const addToRecentSurahs = (surahData) => {
    try {
      const recent = [...recentSurahs];
      
      // إزالة إذا كانت موجودة بالفعل
      const existingIndex = recent.findIndex(s => s.number === surahData.number);
      if (existingIndex !== -1) {
        recent.splice(existingIndex, 1);
      }
      
      // إضافة في البداية
      recent.unshift(surahData);
      
      // حفظ فقط آخر 5 سور
      const limitedRecent = recent.slice(0, 5);
      
      localStorage.setItem('quran_recent_surahs', JSON.stringify(limitedRecent));
      setRecentSurahs(limitedRecent);
      
    } catch (error) {
      console.error('Error adding to recent surahs:', error);
    }
  };

  // استخراج قائمة السور من بيانات الآيات
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
      
      // إذا لم يكن هناك آخر سورة محفوظة، تحديد الأولى
      if (uniqueSurahs.length > 0 && !selectedSurah && !lastSurah) {
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

  // اختيار سورة من السور الأخيرة
  const handleRecentSurah = (surah) => {
    setSelectedSurah(surah.number.toString());
    
    const surahAyahs = ayahs.filter(ayah => 
      ayah.sura_no === parseInt(surah.number)
    );
    
    if (surahAyahs.length > 0) {
      const max = Math.max(...surahAyahs.map(a => a.aya_no));
      setMaxAyah(max);
      
      // إذا كان هناك نطاق محفوظ، استخدامه
      if (surah.fromAyah && surah.toAyah) {
        setFromAyah(surah.fromAyah.toString());
        setToAyah(surah.toAyah.toString());
      } else {
        setToAyah(max.toString());
        setFromAyah('1');
      }
    }
  };

  // اختيار آخر سورة تمت زيارتها
  const handleLastSurah = () => {
    if (!lastSurah) return;
    
    setSelectedSurah(lastSurah.number.toString());
    
    const surahAyahs = ayahs.filter(ayah => 
      ayah.sura_no === parseInt(lastSurah.number)
    );
    
    if (surahAyahs.length > 0) {
      const max = Math.max(...surahAyahs.map(a => a.aya_no));
      setMaxAyah(max);
      
      // استخدام نطاق محفوظ إذا وجد
      if (lastSurah.fromAyah && lastSurah.toAyah) {
        setFromAyah(lastSurah.fromAyah.toString());
        setToAyah(lastSurah.toAyah.toString());
      } else {
        setToAyah(max.toString());
        setFromAyah('1');
      }
    }
  };

  // اختيار سورة من الاختصارات
  const handleSurahShortcut = (surahNumber) => {
    setSelectedSurah(surahNumber.toString());
    
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
        const surahData = surahList.find(s => s.number === surahNumber);
        if (surahData) {
          saveLastSurah(surahNumber, 1, max);
        }
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
    
    const surahNumber = parseInt(selectedSurah);
    const surahData = surahList.find(s => s.number === surahNumber);
    
    if (surahData) {
      saveLastSurah(surahNumber, 1, maxAyah);
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
    const surahNumber = parseInt(selectedSurah);
    
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
    
    // حفظ السورة
    const surahData = surahList.find(s => s.number === surahNumber);
    if (surahData) {
      saveLastSurah(surahNumber, from, to);
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
    }).filter(surah => surah.name);
  };

  // تنسيق وقت الزيارة
  const formatVisitTime = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 60) {
      return `قبل ${diffMins} دقيقة`;
    } else if (diffHours < 24) {
      return `قبل ${diffHours} ساعة`;
    } else if (diffDays < 7) {
      return `قبل ${diffDays} يوم`;
    } else {
      return date.toLocaleDateString('ar-EG');
    }
  };

  // عرض قائمة السور الأخيرة
  const renderRecentSurahs = () => {
    if (recentSurahs.length === 0) return null;

    return (
      <div className="recent-surahs-section">
        <div className="section-header">
          <h4 className="section-title">
            <span className="title-icon">🕒</span>
            السور الأخيرة
            <button 
              className="toggle-recent-btn"
              onClick={() => setShowRecent(!showRecent)}
              title={showRecent ? 'إخفاء السور الأخيرة' : 'إظهار السور الأخيرة'}
            >
              {showRecent ? '▲' : '▼'}
            </button>
          </h4>
        </div>
        
        {showRecent && (
          <div className="recent-grid">
            {recentSurahs.map((surah, index) => (
              <button
                key={surah.number}
                className={`recent-surah-btn ${selectedSurah === surah.number.toString() ? 'active' : ''}`}
                onClick={() => handleRecentSurah(surah)}
                title={`${surah.name} - ${surah.fromAyah ? `آيات ${surah.fromAyah}-${surah.toAyah}` : 'كل السورة'}`}
              >
                <div className="recent-surah-header">
                  <span className="recent-surah-number">{surah.number}</span>
                  <span className="recent-surah-name">{surah.name}</span>
                  <span className="recent-surah-range">
                    {surah.fromAyah ? `${surah.fromAyah}-${surah.toAyah}` : 'كاملة'}
                  </span>
                </div>
                {surah.visitedAt && (
                  <div className="recent-surah-time">
                    {formatVisitTime(surah.visitedAt)}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  // عرض زر آخر سورة
  const renderLastSurahButton = () => {
    if (!lastSurah) return null;

    return (
      <div className="last-surah-section">
        <button
          className="last-surah-btn"
          onClick={handleLastSurah}
          title="العودة إلى آخر سورة قمت بزيارتها"
        >
          <div className="last-surah-content">
            <span className="last-surah-icon">↩️</span>
            <div className="last-surah-info">
              <span className="last-surah-label">آخر زيارة:</span>
              <span className="last-surah-name">{lastSurah.name}</span>
              <span className="last-surah-range">
                {lastSurah.fromAyah ? `آيات ${lastSurah.fromAyah}-${lastSurah.toAyah}` : 'كل السورة'}
              </span>
            </div>
            <span className="last-surah-time">
              {formatVisitTime(lastSurah.visitedAt)}
            </span>
          </div>
        </button>
      </div>
    );
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
          {/* زر آخر سورة */}
          {renderLastSurahButton()}
          
          {/* قائمة السور الأخيرة */}
          {renderRecentSurahs()}
                    {/* أزرار سريعة للاختيار */}
                    <div className="quick-actions-section">
            <div className="quick-action-buttons">
              
              <button 
                className="quick-action-btn clear-history-btn"
                onClick={() => {
                  if (confirm('هل تريد حذف كل سجل السور الأخيرة؟')) {
                    localStorage.removeItem('quran_recent_surahs');
                    localStorage.removeItem('quran_last_surah');
                    setRecentSurahs([]);
                    setLastSurah(null);
                    alert('تم حذف السجل');
                  }
                }}
                title="حذف سجل السور الأخيرة"
              >
                <span className="action-icon">🗑️</span>
                <span className="action-text">مسح السجل</span>
              </button>
            </div>
          </div>
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
              <option value="">-- اختر سورة --</option>
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
                <button 
                  className="add-to-recent-btn"
                  onClick={() => {
                    const surahNumber = parseInt(selectedSurah);
                    const surahData = surahList.find(s => s.number === surahNumber);
                    if (surahData) {
                      saveLastSurah(surahNumber, parseInt(fromAyah), parseInt(toAyah));
                      alert(`تم حفظ ${surahData.name} في السور الأخيرة`);
                    }
                  }}
                  title="حفظ في السور الأخيرة"
                >
                  💾
                </button>
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