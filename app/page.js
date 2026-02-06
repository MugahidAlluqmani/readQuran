"use client"
import React, { useState, useEffect } from 'react';
import NavigationBar from './components/NavigationBar';
import SearchBottomSheet from './components/SearchBottomSheet';
import AyahDisplay from './components/AyahDisplay';
import FullAyahsView from './components/FullAyahsView';
import AudioPlayer from './components/AudioPlayer';
import ProgressTracker from './components/ProgressTracker';
import SettingsPanel from './components/SettingsPanel';
import '../public/styles/main.css'
import '../public/styles/animations.css';
import quranData from '../public/data/hafs_smart_v8.json';
import { BookmarkUtils } from "./utils/bookmarkUtils"
import { loadTafsirData } from './utils/tafsirParser';
function Home() {
  const [ayahs, setAyahs] = useState([]);
  const [displayAyahs, setDisplayAyahs] = useState([]);
  const [currentAyahIndex, setCurrentAyahIndex] = useState(0);
  const [tafsirData, setTafsirData] = useState([]);
  const [loading, setLoading] = useState(true);

  // حالة البحث
  const [showSearchSheet, setShowSearchSheet] = useState(false);
  const [searchResult, setSearchResult] = useState(null);
  
  // عرض الآيات كاملة
  const [showFullView, setShowFullView] = useState(false);
  
  // الإعدادات
  const [showTranslation, setShowTranslation] = useState(true);
  const [showTajweed, setShowTajweed] = useState(false);
  const [recitationSpeed, setRecitationSpeed] = useState(1);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    if (quranData && Array.isArray(quranData)) {
      setAyahs(quranData);
      setDisplayAyahs(quranData);
    }
  }, []);

  // دالة البحث عن سورة وتحديد نطاق
  const handleSearch = (surahNumber, fromAyah, toAyah) => {
    // إغلاق البوتوم شيت
    setShowSearchSheet(false);
    
    // البحث عن السورة
    const surahAyahs = ayahs.filter(ayah => ayah.sura_no === parseInt(surahNumber));
    
    if (surahAyahs.length > 0) {
      // تحديد النطاق المطلوب
      const startIndex = Math.max(1, parseInt(fromAyah));
      const endIndex = Math.min(surahAyahs[surahAyahs.length - 1].aya_no, parseInt(toAyah));
      
      const filteredAyahs = surahAyahs.filter(
        ayah => ayah.aya_no >= startIndex && ayah.aya_no <= endIndex
      );
      
      if (filteredAyahs.length > 0) {
        setDisplayAyahs(filteredAyahs);
        setCurrentAyahIndex(0);
        
        // حفظ نتيجة البحث للعرض
        const selectedSurah = surahAyahs[0];
        setSearchResult({
          surahName: selectedSurah.sura_name_ar,
          from: startIndex,
          to: endIndex,
          total: filteredAyahs.length,
          surahNumber: surahNumber
        });
        
        // الانتقال للعرض الكامل
        setShowFullView(true);
      }
    }
  };

  // العودة للعرض الكامل
  const handleShowAll = () => {
    setDisplayAyahs(ayahs);
    setCurrentAyahIndex(0);
    setSearchResult(null);
    setShowFullView(false);
  };

  // العودة للعرض المفرد
  const handleShowSingleView = () => {
    setShowFullView(false);
  };

  // التنقل بين الآيات
  const nextAyah = () => {
    if (currentAyahIndex < displayAyahs.length - 1) {
      setCurrentAyahIndex(currentAyahIndex + 1);
    }
  };

  const prevAyah = () => {
    if (currentAyahIndex > 0) {
      setCurrentAyahIndex(currentAyahIndex - 1);
    }
  };

  const selectAyah = (index) => {
    setCurrentAyahIndex(index);
  };

  const currentAyah = displayAyahs[currentAyahIndex];

  // جلب اسم السورة الكامل
  const getSurahFullName = () => {
    if (displayAyahs.length > 0) {
      return displayAyahs[0].sura_name_ar;
    }
    return '';
  };

  useEffect(() => {
    // تحميل بيانات التفسير
    const loadData = async () => {
      try {
        const [ayahsData, tafsirData] = await Promise.all([
          fetch('/data/hafs_smart_v8.json').then(res => res.json()),
          loadTafsirData()
        ]);
        
        setAyahs(ayahsData);
        setTafsirData(tafsirData);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  if (loading) {
    return <div>جاري التحميل...</div>;
  }

  return (
    <div className={`Home ${darkMode ? 'dark-mode' : ''}`}>
      {/* الشريط العلوي */}
      <header className="Home-header">
        <div className="header-content">
          <h1>القرآن الكريم</h1>
          {searchResult && (
            <div className="search-result-info">
              <span className="surah-name">{searchResult.surahName}</span>
              <span className="range-info">
                (من آية {searchResult.from} إلى آية {searchResult.to})
              </span>
              <div className="view-toggle">
                <button 
                  className={`view-btn ${!showFullView ? 'active' : ''}`}
                  onClick={handleShowSingleView}
                >
                  آية واحدة
                </button>
                <button 
                  className={`view-btn ${showFullView ? 'active' : ''}`}
                  onClick={() => setShowFullView(true)}
                >
                  عرض الكل
                </button>
              </div>
              <button className="show-all-btn" onClick={handleShowAll}>
                عرض كل القرآن
              </button>
            </div>
          )}
        </div>
      </header>

      {/* المحتوى الرئيسي */}
      <main className="main-content">
        {showFullView && searchResult ? (
          // عرض جميع الآيات المحددة كاملة
          <FullAyahsView 
            ayahs={displayAyahs}
            searchResult={searchResult}
            showTranslation={showTranslation}
            showTajweed={showTajweed}
            onBack={handleShowSingleView}
            tafsirData={tafsirData}
          />
        ) : currentAyah ? (
          // عرض آية واحدة
          <>
            <AyahDisplay 
              ayah={currentAyah}
              showTranslation={showTranslation}
              showTajweed={showTajweed}
              currentIndex={currentAyahIndex}
              totalAyahs={displayAyahs.length}
            />
            
            <AudioPlayer 
              ayahNumber={currentAyah.id}
              speed={recitationSpeed}
            />
            
            <div className="navigation-controls">
              <button 
                className="nav-btn prev-btn"
                onClick={prevAyah}
                disabled={currentAyahIndex === 0}
              >
                ← السابقة
              </button>
              
              <div className="ayah-counter">
                <span>{currentAyahIndex + 1} / {displayAyahs.length}</span>
                {displayAyahs.length > 1 && (
                  <button 
                    className="show-full-btn"
                    onClick={() => setShowFullView(true)}
                  >
                    📄 عرض الكل
                  </button>
                )}
              </div>
              
              <button 
                className="nav-btn next-btn"
                onClick={nextAyah}
                disabled={currentAyahIndex === displayAyahs.length - 1}
              >
                التالية →
              </button>
            </div>
            
            
          </>
        ) : (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>جاري تحميل البيانات...</p>
          </div>
        )}
      </main>

      {/* Navigation Bar */}
      <NavigationBar 
        onSearchClick={() => setShowSearchSheet(true)}
        onHomeClick={handleShowAll}
        onSettingsClick={() => {/* يمكنك إضافة لوحة الإعدادات هنا */}}
        showFullView={showFullView}
        onToggleView={() => setShowFullView(!showFullView)}
      />

      {/* Search Bottom Sheet */}
      <SearchBottomSheet 
        isVisible={showSearchSheet}
        onClose={() => setShowSearchSheet(false)}
        onSearch={handleSearch}
        ayahs={ayahs}
      />

      {searchResult && (
  <div className="bookmark-controls">
    <button 
      className="control-btn export-btn"
      onClick={BookmarkUtils.exportData}
      title="تصدير البيانات"
    >
      📤 تصدير
    </button>
    
    <button 
      className="control-btn import-btn"
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
)}
    </div>
    
  );
}

export default Home;