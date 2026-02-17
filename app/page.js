// app/page.js
"use client"
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import NavigationBar from './components/NavigationBar';
import SearchBottomSheet from './components/SearchBottomSheet';
import '../public/styles/main.css';
import '../public/styles/animations.css';
import '../public/styles/Home.css';
import quranData from '../public/data/hafs_smart_v8.json';
import InstallPrompt from './components/InstallPrompt';
import RamadanTracker from "./components/RamadanTracker/RamadanTracker"

export default function Home() {
  const router = useRouter();
  const [surahList, setSurahList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSearchSheet, setShowSearchSheet] = useState(false);
  const [allAyahs, setAllAyahs] = useState([]);
  const [recentSurahs, setRecentSurahs] = useState([]);
  const [lastSurah, setLastSurah] = useState(null);

  // تحميل البيانات
  useEffect(() => {
    const loadData = async () => {
      try {
        let ayahsData = quranData;
        if (!ayahsData || ayahsData.length === 0) {
          const response = await fetch('/data/hafs_smart_v8.json');
          ayahsData = await response.json();
        }
        
        setAllAyahs(ayahsData);
        
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
        
        // تحميل آخر سورة من localStorage
        loadRecentSurahs();
        loadLastSurah();
        
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  // تحميل السور الأخيرة
  const loadRecentSurahs = () => {
    try {
      const saved = localStorage.getItem('quran_recent_surahs');
      if (saved) {
        setRecentSurahs(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading recent surahs:', error);
    }
  };

  // تحميل آخر سورة
  const loadLastSurah = () => {
    try {
      const saved = localStorage.getItem('quran_last_surah');
      if (saved) {
        setLastSurah(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading last surah:', error);
    }
  };

  // الذهاب إلى سورة
  const goToSurah = (surahNumber) => {
    router.push(`/surah/${surahNumber}`);
  };

  // البحث
  const handleSearch = (surahNumber, fromAyah, toAyah) => {
    setShowSearchSheet(false);
    router.push(`/surah/${surahNumber}?from=${fromAyah}&to=${toAyah}`);
  };

  // العودة لآخر سورة
  const goToLastSurah = () => {
    if (lastSurah) {
      router.push(`/surah/${lastSurah.number}`);
    }
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-content">
          <div className="quran-icon">📖</div>
          <div className="spinner"></div>
          <h2>القرآن الكريم</h2>
          <p>جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (

    <div className="home-page">
      <header className="home-header">
        <h1 className="home-title">القرآن الكريم</h1>
        <p className="home-subtitle">اختر سورة للقراءة</p>
      </header>

      <main className="home-main">
        {/* آخر سورة */}
        {lastSurah && (
          <div className="last-surah-section">
            <h2 className="section-title">🔄 متابعة القراءة</h2>
            <button 
              className="last-surah-card"
              onClick={() => goToSurah(lastSurah.number)}
            >
              <div className="last-surah-icon">🕯️</div>
              <div className="last-surah-info">
                <span className="last-surah-label">آخر زيارة:</span>
                <span className="last-surah-name">{lastSurah.name}</span>
                <span className="last-surah-time">
                  {new Date(lastSurah.visitedAt).toLocaleDateString('ar-EG')}
                </span>
              </div>
              <span className="last-surah-arrow">◀</span>
            </button>
          </div>
        )}

        {/* السور الأخيرة */}
        {recentSurahs.length > 0 && (
          <div className="recent-surahs-section">
            <h2 className="section-title">🕒 السور الأخيرة</h2>
            <div className="recent-grid">
              {recentSurahs.slice(0, 5).map(surah => (
                <button
                  key={surah.number}
                  className="recent-surah-card"
                  onClick={() => goToSurah(surah.number)}
                >
                  <span className="recent-surah-number">{surah.number}</span>
                  <span className="recent-surah-name">{surah.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* قائمة جميع السور */}
        <div className="all-surahs-section">
          <h2 className="section-title">📖 فهرس السور</h2>
          <div className="surahs-grid">
            {surahList.map(surah => (
              <button
                key={surah.number}
                className="surah-card"
                onClick={() => goToSurah(surah.number)}
              >
                <span className="surah-card-number">{surah.number}</span>
                <div className="surah-card-info">
                  <span className="surah-card-name">{surah.name}</span>
                  <span className="surah-card-ayahs">{surah.totalAyahs} آية</span>
                </div>
                <span className="surah-card-arrow">◀</span>
              </button>
            ))}
          </div>
        </div>
      </main>

      {/* شريط التنقل السفلي */}
      <NavigationBar 
        onSearchClick={() => setShowSearchSheet(true)}
        onHomeClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        onSettingsClick={() => {}}
        showFullView={false}
      />

      {/* Search Bottom Sheet */}
      <SearchBottomSheet 
        isVisible={showSearchSheet}
        onClose={() => setShowSearchSheet(false)}
        onSearch={handleSearch}
        ayahs={allAyahs}
      />

      {/* محتوى الصفحة */}
      <RamadanTracker />
    </div>
  );
}