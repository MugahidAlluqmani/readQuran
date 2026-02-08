"use client"
import React, { useState, useEffect, useCallback, useRef } from 'react';
import NavigationBar from './components/NavigationBar';
import SearchBottomSheet from './components/SearchBottomSheet';
import FullAyahsView from './components/FullAyahsView';
import '../public/styles/main.css'
import '../public/styles/animations.css';
import quranData from '../public/data/hafs_smart_v8.json';
import { BookmarkUtils } from "./utils/bookmarkUtils"
import { loadTafsirData } from './utils/tafsirParser';
import '../public/styles/Home.css';

function Home() {
  const [allAyahs, setAllAyahs] = useState([]);
  const [displayAyahs, setDisplayAyahs] = useState([]);
  const [tafsirData, setTafsirData] = useState([]);
  const [loading, setLoading] = useState(true);
  const fullAyahsViewRef = useRef(null);
  // حالة البحث
  const [showSearchSheet, setShowSearchSheet] = useState(false);
  const [searchResult, setSearchResult] = useState(null);
  
  // حالة السورة الحالية
  const [currentSurah, setCurrentSurah] = useState(1);
  const [surahList, setSurahList] = useState([]);
  
  // الإعدادات
  const [showTranslation, setShowTranslation] = useState(true);
  const [showTajweed, setShowTajweed] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [fontSize, setFontSize] = useState(100);

  // دالة الانتقال لبداية السورة
  const scrollToSurahStart = useCallback(() => {
    // استخدام setTimeout لضمان تحديث DOM أولاً
    setTimeout(() => {
      if (fullAyahsViewRef.current) {
        // استدعاء دالة في FullAyahsView للتمرير إلى البداية
        fullAyahsViewRef.current.scrollToTop();
      } else {
        // طريقة احتياطية
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        // البحث عن أول آية في السورة وتركيز عليها
        if (displayAyahs.length > 0) {
          const firstAyahId = displayAyahs[0].id;
          // يمكن إضافة كود هنا للتركيز على أول آية
          console.log('الانتقال إلى آية:', firstAyahId);
        }
      }
    }, 100);
  }, [displayAyahs]);

  // تحميل الإعدادات
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = () => {
    try {
      const savedSettings = localStorage.getItem('quran_settings');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        setDarkMode(settings.darkMode || false);
        setFontSize(settings.fontSize || 100);
        setShowTranslation(settings.showTranslation !== false);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSettings = () => {
    try {
      const settings = {
        darkMode,
        fontSize,
        showTranslation,
        showTajweed
      };
      localStorage.setItem('quran_settings', JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  // تحميل البيانات الأساسية
  useEffect(() => {
    const loadData = async () => {
      try {
        const [ayahsData, tafsirData] = await Promise.all([
          fetch('/data/hafs_smart_v8.json').then(res => res.json()),
          loadTafsirData()
        ]);
        
        setAllAyahs(ayahsData);
        setTafsirData(tafsirData);
        
        // إنشاء قائمة السور
        const uniqueSurahs = [];
        const seen = new Set();
        
        ayahsData.forEach(ayah => {
          if (!seen.has(ayah.sura_no)) {
            seen.add(ayah.sura_no);
            uniqueSurahs.push({
              number: ayah.sura_no,
              name: ayah.sura_name_ar,
              nameEn: ayah.sura_name_en,
              totalAyahs: ayahsData.filter(a => a.sura_no === ayah.sura_no).length
            });
          }
        });
        
        setSurahList(uniqueSurahs.sort((a, b) => a.number - b.number));
        
        // تحميل السورة الأولى افتراضياً
        loadSurah(1);
        
      } catch (error) {
        console.error('Error loading data:', error);
        // استخدام البيانات المحلية
        if (quranData && Array.isArray(quranData)) {
          setAllAyahs(quranData);
          loadSurah(1);
        }
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  // دالة لتحميل سورة معينة
  // تحميل سورة معينة مع التمرير للأعلى
  const loadSurah = useCallback((surahNumber) => {
    if (!allAyahs.length) return;
    
    const surahAyahs = allAyahs.filter(ayah => ayah.sura_no === surahNumber);
    
    if (surahAyahs.length > 0) {
      setDisplayAyahs(surahAyahs);
      setCurrentSurah(surahNumber);
      
      setSearchResult({
        surahName: surahAyahs[0].sura_name_ar,
        from: 1,
        to: surahAyahs[surahAyahs.length - 1].aya_no,
        total: surahAyahs.length,
        surahNumber: surahNumber
      });
      
      // تمرير للأعلى بعد تحميل السورة
      setTimeout(() => {
        scrollToSurahStart();
      }, 200);
    }
  }, [allAyahs, scrollToSurahStart]);

  // البحث عن سورة محددة
  const handleSearch = useCallback((surahNumber, fromAyah, toAyah) => {
    setShowSearchSheet(false);
    
    const surahAyahs = allAyahs.filter(ayah => 
      ayah.sura_no === parseInt(surahNumber)
    );
    
    if (surahAyahs.length > 0) {
      // إذا تم تحديد نطاق محدد
      if (fromAyah && toAyah) {
        const startIndex = Math.max(1, parseInt(fromAyah));
        const endIndex = Math.min(
          surahAyahs[surahAyahs.length - 1].aya_no, 
          parseInt(toAyah)
        );
        
        const filteredAyahs = surahAyahs.filter(
          ayah => ayah.aya_no >= startIndex && ayah.aya_no <= endIndex
        );
        
        setDisplayAyahs(filteredAyahs);
        
        setSearchResult({
          surahName: surahAyahs[0].sura_name_ar,
          from: startIndex,
          to: endIndex,
          total: filteredAyahs.length,
          surahNumber: surahNumber
        });
        
      } else {
        // السورة كاملة
        setDisplayAyahs(surahAyahs);
        
        setSearchResult({
          surahName: surahAyahs[0].sura_name_ar,
          from: 1,
          to: surahAyahs[surahAyahs.length - 1].aya_no,
          total: surahAyahs.length,
          surahNumber: surahNumber
        });
      }
      
      setCurrentSurah(parseInt(surahNumber));
      
      // تمرير للأعلى بعد البحث
      setTimeout(() => {
        scrollToSurahStart();
      }, 300);
    }
  }, [allAyahs, scrollToSurahStart]);

  // تحميل كل القرآن دفعة واحدة (مع تحذير للأداء)
  const handleShowAllQuran = useCallback(() => {
    if (allAyahs.length > 2000) {
      if (window.confirm('تحميل كل القرآن قد يؤثر على أداء التطبيق. هل تريد المتابعة؟')) {
        setDisplayAyahs(allAyahs.slice(0, 2000)); // تحديد حد معقول
        setSearchResult({
          surahName: 'المصحف الشريف (منظور محدود)',
          from: 1,
          to: allAyahs[1999]?.aya_no || allAyahs[allAyahs.length - 1]?.aya_no,
          total: 2000,
          surahNumber: 1
        });
        setCurrentSurah(1);
      }
    } else {
      setDisplayAyahs(allAyahs);
      setSearchResult({
        surahName: 'المصحف الشريف',
        from: 1,
        to: allAyahs[allAyahs.length - 1]?.aya_no,
        total: allAyahs.length,
        surahNumber: 1
      });
      setCurrentSurah(1);
    }
  }, [allAyahs]);

  // تحميل آخر سورة تمت زيارتها
  const handleContinueFromLast = useCallback(() => {
    try {
      const savedPosition = localStorage.getItem('quran_last_position');
      if (savedPosition) {
        const position = JSON.parse(savedPosition);
        loadSurah(position.surahNumber);
      }
    } catch (error) {
      console.error('Error loading last position:', error);
    }
  }, [loadSurah]);

  // الانتقال للسورة التالية
  const goToNextSurah = useCallback(() => {
    if (currentSurah < 114) {
      loadSurah(currentSurah + 1);
      // الانتقال لبداية السورة الجديدة
      scrollToSurahStart();
    }
  }, [currentSurah, loadSurah, scrollToSurahStart]);

  // الانتقال للسورة السابقة
  const goToPrevSurah = useCallback(() => {
    if (currentSurah > 1) {
      loadSurah(currentSurah - 1);
      // الانتقال لبداية السورة الجديدة
      scrollToSurahStart();
    }
  }, [currentSurah, loadSurah, scrollToSurahStart]);

  // الحصول على معلومات السورة الحالية
  const getCurrentSurahInfo = () => {
    return surahList.find(s => s.number === currentSurah);
  };

  // معالجات الإعدادات
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    saveSettings();
  };

  const increaseFontSize = () => {
    setFontSize(prev => Math.min(150, prev + 10));
    saveSettings();
  };

  const decreaseFontSize = () => {
    setFontSize(prev => Math.max(70, prev - 10));
    saveSettings();
  };

  const toggleTranslation = () => {
    setShowTranslation(!showTranslation);
    saveSettings();
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-content">
          <div className="quran-icon">📖</div>
          <div className="spinner"></div>
          <h2>جاري تحميل المصحف الشريف</h2>
          <p>يرجى الانتظار...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`home-container ${darkMode ? 'dark-mode' : ''}`}>
      {/* شريط الأدوات العلوي */}
      <div className="top-toolbar">
        <div className="toolbar-left">
          <button 
            className="toolbar-btn search-btn"
            onClick={() => setShowSearchSheet(true)}
            title="بحث في القرآن"
          >
            🔍 بحث
          </button>
          
          <button 
            className="toolbar-btn all-quran-btn"
            onClick={handleShowAllQuran}
            title="عرض كل القرآن"
          >
            📖 الكل
          </button>
          
          <button 
            className="toolbar-btn continue-btn"
            onClick={handleContinueFromLast}
            title="الاستمرار من حيث توقفت"
          >
            🔄 استمرار
          </button>
        </div>
        
        
        <div className="toolbar-right">
          <div className="font-controls">
            <button 
              className="font-btn smaller"
              onClick={decreaseFontSize}
              title="تصغير الخط"
            >
              A-
            </button>
            <span className="font-size">{fontSize}%</span>
            <button 
              className="font-btn larger"
              onClick={increaseFontSize}
              title="تكبير الخط"
            >
              A+
            </button>
          </div>
          
          <button 
            className={`toolbar-btn dark-mode-btn ${darkMode ? 'active' : ''}`}
            onClick={toggleDarkMode}
            title={darkMode ? 'الوضع النهاري' : 'الوضع الليلي'}
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
          
          <button 
            className={`toolbar-btn translation-btn ${showTranslation ? 'active' : ''}`}
            onClick={toggleTranslation}
            title={showTranslation ? 'إخفاء الترجمة' : 'إظهار الترجمة'}
          >
            🌐
          </button>
        </div>
      </div>

      {/* أزرار التحكم في السور */}
      <div className="surah-navigation-bar">
        <div className="surah-nav-container">
          <button 
            className="surah-nav-btn prev-surah-btn"
            onClick={goToPrevSurah}
            disabled={currentSurah === 1}
            title="السورة السابقة"
          >
            السورة السابقة: 
            {surahList.find(s => s.number === currentSurah - 1)?.name || currentSurah - 1}
          </button>
          
          <div className="current-surah-info">
            <div className="surah-number-badge">{currentSurah}</div>
            <div className="surah-details">
              <h3 className="surah-name-display">{getCurrentSurahInfo()?.name || ''}</h3>
              <div className="surah-meta">
                <span className="surah-ayahs">{getCurrentSurahInfo()?.totalAyahs || 0} آية</span>
                <span className="surah-type">
                  {currentSurah <= 114 ? 
                    (currentSurah <= 92 ? 'مكية' : 'مدنية') : ''}
                </span>
              </div>
            </div>
          </div>
          
          <button 
            className="surah-nav-btn next-surah-btn"
            onClick={goToNextSurah}
            disabled={currentSurah === 114}
            title="السورة التالية"
            
          >
            <span className="btn-text">
              السورة التالية: {surahList.find(s => s.number === currentSurah + 1)?.name || currentSurah + 1}
            </span>
          </button>
        </div>
      </div>

      {/* قائمة السور السريعة */}
      <div className="quick-surahs-bar">
        <div className="quick-surahs-container">
          <span className="quick-title">بحث سريع:</span>
          {[1, 2, 36, 55, 56, 67, 112, 113, 114].map(surahNum => {
            const surah = surahList.find(s => s.number === surahNum);
            return surah ? (
              <button
                key={surahNum}
                className={`quick-surah-btn ${currentSurah === surahNum ? 'active' : ''}`}
                onClick={() => loadSurah(surahNum)}
                title={surah.name}
              >
                
                <span className="quick-name">
                  {surah.name.length > 10 
                    ? surah.name.substring(0, 8) + '..' 
                    : surah.name}
                </span>
              </button>
            ) : null;
          })}
        </div>
      </div>

      {/* المحتوى الرئيسي */}
      <main className="main-content">
        {displayAyahs.length > 0 ? (
          <FullAyahsView 
            ref={fullAyahsViewRef}
            ayahs={displayAyahs}
            searchResult={searchResult}
            showTranslation={showTranslation}
            showTajweed={showTajweed}
            onBack={handleShowAllQuran}
            tafsirData={tafsirData}
          />
        ) : (
          <div className="no-ayahs-message">
            {loadSurah(1)}
          </div>
        )}
      </main>



      {/* شريط التنقل السفلي */}
      <NavigationBar 
        onSearchClick={() => setShowSearchSheet(true)}
        onHomeClick={handleShowAllQuran}
        onSettingsClick={() => {}}
        showFullView={true}
        onToggleView={toggleTranslation}
      />

      {/* Search Bottom Sheet */}
      <SearchBottomSheet 
        isVisible={showSearchSheet}
        onClose={() => setShowSearchSheet(false)}
        onSearch={handleSearch}
        ayahs={allAyahs}
      />

      {/* أزرار التصدير/الاستيراد */}
      <div className="data-controls">
        <button 
          className="data-btn export-btn"
          onClick={BookmarkUtils.exportData}
          title="تصدير البيانات"
        >
          📤 تصدير
        </button>
        
        <button 
          className="data-btn import-btn"
          onClick={() => document.getElementById('import-input').click()}
          title="استيراد البيانات"
        >
          📥 استيراد
        </button>
        
        <input
          id="import-input"
          type="file"
          accept=".json"
          style={{ display: 'none' }}
          onChange={async (e) => {
            const file = e.target.files[0];
            if (file) {
              try {
                await BookmarkUtils.importData(file);
                alert('تم استيراد البيانات بنجاح');
                window.location.reload();
              } catch (error) {
                alert(`خطأ في الاستيراد: ${error.message}`);
              }
            }
            e.target.value = '';
          }}
        />
      </div>
    </div>
  );
}

export default Home;