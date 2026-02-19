// app/surah/[id]/page.js
"use client"
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import FullAyahsView from '../../components/FullAyahsView'
import NavigationBar from '../../components/NavigationBar';
import SearchBottomSheet from '../../components/SearchBottomSheet';
import { loadTafsirData } from '../../utils/tafsirParser';
import { BookmarkUtils } from "../../utils/bookmarkUtils";
import '../../../public/styles/main.css';
import '../../../public/styles/animations.css';
import '../../../public/styles/Home.css';
import InstallPrompt from '../../components/InstallPrompt';
import quranData from '../../../public/data/hafs_smart_v8.json'

export default function SurahPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const surahId = parseInt(params.id);
  
  const [allAyahs, setAllAyahs] = useState([]);
  const [surahAyahs, setSurahAyahs] = useState([]);
  const [tafsirData, setTafsirData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [surahInfo, setSurahInfo] = useState();
  const [surahList, setSurahList] = useState([]);
  const [showInfoModal, setShowInfoModal] = useState(false);

  const [filteredAyahs, setFilteredAyahs] = useState([]);
  const fromAyah = searchParams.get('from');
  const toAyah = searchParams.get('to');
  // حالة البحث
  const [showSearchSheet, setShowSearchSheet] = useState(false);
  
  // الإعدادات
  const [showTranslation, setShowTranslation] = useState(true);
  const [showTajweed, setShowTajweed] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [fontSize, setFontSize] = useState(100);
  
  const fullAyahsViewRef = useRef(null);

  // دالة للحصول على اسم السورة من رقمها

  const getSurahName = useCallback((surahNumber) => {
    // قائمة بأسماء السور (يمكنك وضعها في ملف منفصل)
    const surahNames = {
      1: 'الفاتحة',
      2: 'البقرة',
      3: 'آل عمران',
      4: 'النساء',
      5: 'المائدة',
      6: 'الأنعام',
      7: 'الأعراف',
      8: 'الأنفال',
      9: 'التوبة',
      10: 'يونس',
      11: 'هود',
      12: 'يوسف',
      13: 'الرعد',
      14: 'إبراهيم',
      15: 'الحجر',
      16: 'النحل',
      17: 'الإسراء',
      18: 'الكهف',
      19: 'مريم',
      20: 'طه',
      21: 'الأنبياء',
      22: 'الحج',
      23: 'المؤمنون',
      24: 'النور',
      25: 'الفرقان',
      26: 'الشعراء',
      27: 'النمل',
      28: 'القصص',
      29: 'العنكبوت',
      30: 'الروم',
      31: 'لقمان',
      32: 'السجدة',
      33: 'الأحزاب',
      34: 'سبأ',
      35: 'فاطر',
      36: 'يس',
      37: 'الصافات',
      38: 'ص',
      39: 'الزمر',
      40: 'غافر',
      41: 'فصلت',
      42: 'الشورى',
      43: 'الزخرف',
      44: 'الدخان',
      45: 'الجاثية',
      46: 'الأحقاف',
      47: 'محمد',
      48: 'الفتح',
      49: 'الحجرات',
      50: 'ق',
      51: 'الذاريات',
      52: 'الطور',
      53: 'النجم',
      54: 'القمر',
      55: 'الرحمن',
      56: 'الواقعة',
      57: 'الحديد',
      58: 'المجادلة',
      59: 'الحشر',
      60: 'الممتحنة',
      61: 'الصف',
      62: 'الجمعة',
      63: 'المنافقون',
      64: 'التغابن',
      65: 'الطلاق',
      66: 'التحريم',
      67: 'الملك',
      68: 'القلم',
      69: 'الحاقة',
      70: 'المعارج',
      71: 'نوح',
      72: 'الجن',
      73: 'المزمل',
      74: 'المدثر',
      75: 'القيامة',
      76: 'الإنسان',
      77: 'المرسلات',
      78: 'النبأ',
      79: 'النازعات',
      80: 'عبس',
      81: 'التكوير',
      82: 'الإنفطار',
      83: 'المطففين',
      84: 'الإنشقاق',
      85: 'البروج',
      86: 'الطارق',
      87: 'الأعلى',
      88: 'الغاشية',
      89: 'الفجر',
      90: 'البلد',
      91: 'الشمس',
      92: 'الليل',
      93: 'الضحى',
      94: 'الشرح',
      95: 'التين',
      96: 'العلق',
      97: 'القدر',
      98: 'البينة',
      99: 'الزلزلة',
      100: 'العاديات',
      101: 'القارعة',
      102: 'التكاثر',
      103: 'العصر',
      104: 'الهمزة',
      105: 'الفيل',
      106: 'قريش',
      107: 'الماعون',
      108: 'الكوثر',
      109: 'الكافرون',
      110: 'النصر',
      111: 'المسد',
      112: 'الإخلاص',
      113: 'الفلق',
      114: 'الناس'
    };
    
    return surahNames[surahNumber] || `سورة ${surahNumber}`;
  }, []);

  useEffect(() => {
    // تسجيل Service Worker
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(registration => {
          console.log('ServiceWorker registered: ', registration);
        }).catch(error => {
          console.log('ServiceWorker registration failed: ', error);
        });
      });
    }
  }, []);

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

  // تحميل البيانات
  useEffect(() => {
    const loadData = async () => {
      try {
        const tafsir = await loadTafsirData();
        setTafsirData(tafsir);
        
        // تحميل بيانات القرآن
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
        
        // تصفية آيات السورة المطلوبة
        const surahAyahsData = ayahsData.filter(ayah => ayah.sura_no === surahId);
        
        if (surahAyahsData.length > 0) {
          // تطبيق النطاق المحدد من query parameters
          let displayAyahs = surahAyahsData;
          let from = 1;
          let to = surahAyahsData[surahAyahsData.length - 1].aya_no;
          
          if (fromAyah && toAyah) {
            const fromNum = parseInt(fromAyah);
            const toNum = parseInt(toAyah);
            
            if (!isNaN(fromNum) && !isNaN(toNum) && 
                fromNum >= 1 && toNum <= surahAyahsData.length && 
                fromNum <= toNum) {
              displayAyahs = surahAyahsData.filter(
                ayah => ayah.aya_no >= fromNum && ayah.aya_no <= toNum
              );
              from = fromNum;
              to = toNum;
            }
          }
          
          setSurahAyahs(surahAyahsData);
          setFilteredAyahs(displayAyahs);
          
          // حفظ معلومات السورة
          setSurahInfo({
            surahName: surahAyahsData[0].sura_name_ar,
            surahNameEn: surahAyahsData[0].sura_name_en,
            totalAyahs: surahAyahsData.length,
            displayAyahs: displayAyahs.length,
            surahNumber: surahId,
            from: from,
            to: to
          });
          
          // حفظ آخر سورة تمت زيارتها
          saveLastVisitedSurah(surahId, surahAyahsData[0].sura_name_ar, from, to);
        } else {
          router.push('/');
        }
        
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (surahId && surahId >= 1 && surahId <= 114) {
      loadData();
    } else {
      router.push('/');
    }
  }, [surahId, fromAyah, toAyah, router]);

  // حفظ آخر سورة تمت زيارتها مع النطاق
  const saveLastVisitedSurah = (surahNumber, surahName, from, to) => {
    try {
      const lastSurah = {
        number: surahNumber,
        name: surahName,
        from: from,
        to: to,
        visitedAt: new Date().toISOString()
      };
      localStorage.setItem('quran_last_surah', JSON.stringify(lastSurah));
      
      // إضافة إلى السور الأخيرة
      addToRecentSurahs(lastSurah);
    } catch (error) {
      console.error('Error saving last surah:', error);
    }
  };

    // إضافة إلى السور الأخيرة
    const addToRecentSurahs = (surahData) => {
        try {
          const saved = localStorage.getItem('quran_recent_surahs');
          let recent = saved ? JSON.parse(saved) : [];
          
          // إزالة إذا كانت موجودة
          recent = recent.filter(s => s.number !== surahData.number);
          
          // إضافة في البداية
          recent.unshift(surahData);
          
          // حفظ آخر 5 سور
          recent = recent.slice(0, 5);
          
          localStorage.setItem('quran_recent_surahs', JSON.stringify(recent));
        } catch (error) {
          console.error('Error adding to recent surahs:', error);
        }
      };

  // دالة البحث
  const handleSearch = (surahNumber, from, to) => {
    setShowSearchSheet(false);
    router.push(`/surah/${surahNumber}?from=${from}&to=${to}`);
  };

  // العودة للصفحة الرئيسية
  const goToHome = () => {
    router.push('/');
  };

  // الانتقال لسورة أخرى
  const goToSurah = (surahNumber) => {
    router.push(`/surah/${surahNumber}`);
  };

  // دالة التمرير لبداية السورة
  const scrollToTop = () => {
    if (fullAyahsViewRef.current) {
      fullAyahsViewRef.current.scrollToTop();
    }
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

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-content">
          <div className="quran-icon">📖</div>
          <div className="spinner"></div>
          <h2>جاري تحميل سورة {surahId}</h2>
          <p>يرجى الانتظار...</p>
        </div>
      </div>
    );
  }


  return (

    <div className={`home-container ${darkMode ? 'dark-mode' : ''}`}>
      {/* شريط معلومات السورة */}
      <div className="surah-navigation-bar">
        <div className="surah-nav-container">
          <button 
            className="surah-nav-btn prev-surah-btn"
            onClick={()=>{goToSurah(surahId - 1);}}
            disabled={surahId === 1}
            title="السورة السابقة"
          >
            السورة السابقة: 
            {getSurahName(surahId - 1)}
          </button>
          
          <div className="current-surah-info">
            <div className="surah-details">
              <h3 className="surah-name-display">{surahInfo?.surahName || getSurahName(surahId)}</h3>
              </div>
          </div>
          <button 
            className="surah-nav-btn next-surah-btn"
            onClick={()=>{goToSurah(surahId + 1);}}
            disabled={surahId === 114}
            title="السورة التالية"
            
          >
            <span className="btn-text">
              السورة التالية: {getSurahName(surahId + 1)}
            </span>
          </button>
        </div>
      </div>
{/* شريط معلومات النطاق إذا كان محدداً */}
{surahInfo?.from && surahInfo?.to && 
            (surahInfo.from !== 1 || surahInfo.to !== surahInfo.totalAyahs) && (
                <div className="range-info-bar">
                <div className="range-info-container">
                    <span className="range-icon">🎯</span>
                    <span className="range-text">
                    عرض الآيات من {surahInfo.from} إلى {surahInfo.to}
                    </span>
                    <button 
                    className="clear-range-btn"
                    onClick={() => router.push(`/surah/${surahId}`)}
                    title="عرض السورة كاملة"
                    >
                    ✕ إلغاء النطاق
                    </button>
                </div>
        </div>
      )}
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
            style={{display : 'none'}}
            className={`toolbar-btn translation-btn ${showTranslation ? 'active' : ''}`}
            onClick={toggleTranslation}
            title={showTranslation ? 'إخفاء الترجمة' : 'إظهار الترجمة'}
          >
            🌐
          </button>

          <button 
            className="toolbar-btn info-btn"
            onClick={() => setShowInfoModal(true)}
            title="معلومات عن المصادر"
            aria-label="معلومات عن المصادر"
          >
            ℹ️
          </button>
          
        </div>
      </div>


      {/* المحتوى الرئيسي */}
      <main className="main-content">
      <FullAyahsView 
          ref={fullAyahsViewRef}
          ayahs={filteredAyahs} // استخدام الآيات المفلترة
          searchResult={{
            surahName: surahInfo?.surahName,
            from: surahInfo?.from || 1,
            to: surahInfo?.to || filteredAyahs[filteredAyahs.length - 1]?.aya_no,
            total: filteredAyahs.length,
            surahNumber: surahId
          }}
          showTranslation={showTranslation}
          showTajweed={showTajweed}
          onBack={goToHome}
          tafsirData={tafsirData}
        />

        {/* ✅ مودال المعلومات */}
        {showInfoModal && (
          <div className="info-modal-overlay" onClick={() => setShowInfoModal(false)}>
            <div className="info-modal" onClick={e => e.stopPropagation()}>
              <button className="info-close-btn" onClick={() => setShowInfoModal(false)}>✕</button>
              
              <div className="info-header">
                <div className="info-icon">📖</div>
                <h2>مصادر البيانات</h2>
              </div>
              
              <div className="info-content">
                <div className="info-section">
                  <h3>📚 المصحف الشريف</h3>
                  <p>
                    تم الحصول على بيانات المصحف الشريف (نص القرآن الكريم) من 
                    <strong> مجمع الملك فهد لطباعة المصحف الشريف</strong>.
                  </p>
                  <a 
                    href="https://qurancomplex.gov.sa/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="info-link"
                  >
                    زيارة موقع مجمع الملك فهد  ←
                  </a>
                </div>

                <div className="info-section">
                  <h3>📝 التفسير المعاصر</h3>
                  <p>
                    بيانات التفسير مأخوذة من 
                    <strong> تفسير معاصر - الشيخ صالح بن عبدالله بن حميد</strong>.
                  </p>
                </div>

                <div className="info-section thanks-section">
                  <h3>🤝 كلمة شكر</h3>
                  <p>
                    نتقدم بجزيل الشكر والعرفان إلى 
                    <strong>  مجمع الملك فهد لطباعة المصحف الشريف </strong> 
                    على إتاحة هذه البيانات القيمة لتطوير التطبيقات الإسلامية، 
                    سائلين المولى عز وجل أن يجعل هذا العمل في ميزان حسناتهم.
                  </p>
                  <p className="dua">
                    اللهم اجعل هذا العمل خالصاً لوجهك الكريم، وانفع به المسلمين.
                  </p>
                </div>

                <div className="info-footer">
                  <p className="copyright">
                    جميع الحقوق محفوظة لأصحابها 🤲
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>


      {/* Search Bottom Sheet */}
      <SearchBottomSheet 
        isVisible={showSearchSheet}
        onClose={() => setShowSearchSheet(false)}
        onSearch={handleSearch}
        ayahs={allAyahs}
      />
    </div>
  );
}