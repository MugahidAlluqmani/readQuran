import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import '../../public/styles/FullAyahsView.css';
import TafsirView from "./TafsirView"
// مكونات مساعدة
const LoadingSpinner = () => (
  <div className="loading-spinner">
    <div className="spinner"></div>
    <span>جاري التحميل...</span>
  </div>
);

const ErrorDisplay = ({ message, onRetry }) => (
  <div className="error-display">
    <div className="error-icon">⚠️</div>
    <h3>حدث خطأ</h3>
    <p>{message}</p>
    {onRetry && (
      <button className="retry-btn" onClick={onRetry}>
        إعادة المحاولة
      </button>
    )}
  </div>
);

// مكون مشغل الصوت المعزول
const AudioPlayer = React.memo(({
  isPlaying,
  audioUrl,
  currentTime,
  audioDuration,
  audioProgress,
  volume,
  isRepeating,
  selectedAyah,
  ayahs,
  onPlayPause,
  onStop,
  onRepeatToggle,
  onSeek,
  onVolumeChange
}) => {
  const formatTime = useCallback((seconds) => {
    if (!seconds || isNaN(seconds)) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const selectedAyahData = useMemo(() => 
    ayahs.find(a => a.id === selectedAyah), [ayahs, selectedAyah]
  );

  if (!selectedAyah) return null;

  return (
    <div className="audio-player-fixed">
      <div className="player-container">
        <div className="player-info">
          <div className="now-playing">
            <span className="playing-icon">🎵</span>
            <span className="playing-text">
              {selectedAyahData?.sura_name_ar || ''} - 
              آية {selectedAyahData?.aya_no || ''}
            </span>
          </div>
        </div>
        
        <div className="player-controls">
          <button 
            className="player-btn play-pause-btn"
            onClick={onPlayPause}
            aria-label={isPlaying ? 'إيقاف مؤقت' : 'تشغيل'}
          >
            {isPlaying ? '⏸️' : '▶️'}
          </button>
          
          <button 
            className="player-btn stop-btn"
            onClick={onStop}
            aria-label="إيقاف"
          >
            ⏹️
          </button>
          
          <button 
            className={`player-btn repeat-btn ${isRepeating ? 'active' : ''}`}
            onClick={onRepeatToggle}
            aria-label={isRepeating ? 'تعطيل التكرار' : 'تفعيل التكرار'}
          >
            🔄
          </button>
        </div>
        
        <div className="player-progress">
          <div className="time-display">
            <span className="current-time">{formatTime(currentTime)}</span>
            <span className="duration-time">{formatTime(audioDuration)}</span>
          </div>
          
          <input
            type="range"
            min="0"
            max={audioDuration || 100}
            value={currentTime}
            onChange={onSeek}
            className="progress-slider"
            aria-label="تقدم الصوت"
          />
          
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${audioProgress}%` }}
            ></div>
          </div>
        </div>
        
        <div className="player-volume">
          <span className="volume-icon">🔊</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={onVolumeChange}
            className="volume-slider"
            aria-label="مستوى الصوت"
          />
        </div>
      </div>
    </div>
  );
});

AudioPlayer.propTypes = {
  isPlaying: PropTypes.bool,
  audioUrl: PropTypes.string,
  currentTime: PropTypes.number,
  audioDuration: PropTypes.number,
  audioProgress: PropTypes.number,
  volume: PropTypes.number,
  isRepeating: PropTypes.bool,
  selectedAyah: PropTypes.string,
  ayahs: PropTypes.array,
  onPlayPause: PropTypes.func,
  onStop: PropTypes.func,
  onRepeatToggle: PropTypes.func,
  onSeek: PropTypes.func,
  onVolumeChange: PropTypes.func
};

// المكون الرئيسي
const FullAyahsView = ({ 
  ayahs = [], 
  searchResult = null,
  showTranslation = true,
  showTajweed = false,
  onBack = () => {},
  isLoading = false,
  error = null,
  tafsirData = [] // بيانات التفسير الجديدة
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pages, setPages] = useState([]);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [selectedAyah, setSelectedAyah] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState('');
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isRepeating, setIsRepeating] = useState(false);
  const [lastReadPosition, setLastReadPosition] = useState(null);
  const [bookmarks, setBookmarks] = useState([]);
  const [showBookmarkMenu, setShowBookmarkMenu] = useState(false);
  const [selectedAyahForBookmark, setSelectedAyahForBookmark] = useState(null);
  const [activeTool, setActiveTool] = useState(null);
  const [nightMode, setNightMode] = useState(false);
  const [fontFamily, setFontFamily] = useState('Uthmanic');
  const [searchResults, setSearchResults] = useState([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
  const [showTafsir, setShowTafsir] = useState(false);
  const [selectedAyahForTafsir, setSelectedAyahForTafsir] = useState(null);
  const [tafsirLoading, setTafsirLoading] = useState(false);
  const [parsedTafsirData, setParsedTafsirData] = useState([]);

  const containerRef = useRef(null);
  const audioRef = useRef(null);
  const longPressTimer = useRef(null);
  const touchStartTime = useRef(null);
  const toastTimeout = useRef(null);
  const ayahElementsRef = useRef({});

  const [highlightedAyah, setHighlightedAyah] = useState(null);
  const [bookmarkAyahDetails, setBookmarkAyahDetails] = useState(null);
  const [isScrollingToAyah, setIsScrollingToAyah] = useState(false);
  const highlightedTimer = useRef(null);

  // معالجة بيانات التفسير عند التحميل
  useEffect(() => {
    if (tafsirData.length > 0) {
      setParsedTafsirData(tafsirData);
    }
  }, [tafsirData]);

  // دالة لفتح التفسير
  const openTafsir = useCallback((ayah) => {
    if (!ayah) return;
    
    setSelectedAyahForTafsir(ayah);
    setTafsirLoading(true);
    setShowTafsir(true);
    
    // محاكاة تحميل التفسير
    setTimeout(() => {
      setTafsirLoading(false);
    }, 300);
  }, []);


  // تهيئة البيانات
  useEffect(() => {
    loadBookmarksFromStorage();
    loadLastPosition();
    loadSettings();
  }, []);

  // تسجيل مراجع لجميع عناصر الآيات
  useEffect(() => {
    if (pages.length > 0) {
      ayahElementsRef.current = {};
    }
  }, [pages]);

  const goToPage = useCallback((pageIndex) => {
    if (pageIndex >= 0 && pageIndex < pages.length) {
      setActivePageIndex(pageIndex);
      setCurrentPage(pages[pageIndex].pageNumber);
      scrollToActivePage();
    }
  }, [pages]);

  const scrollToActivePage = useCallback(() => {
    setTimeout(() => {
      const pageElement = document.getElementById(`page-${activePageIndex}`);
      if (pageElement && containerRef.current) {
        containerRef.current.scrollTo({
          top: pageElement.offsetTop - 20,
          behavior: 'smooth'
        });
      }
    }, 100);
  }, [activePageIndex]);

  // إدارة التنقل
  const goToNextPage = useCallback(() => {
    if (activePageIndex < pages.length - 1) {
      goToPage(activePageIndex + 1);
    }
  }, [activePageIndex, pages.length, goToPage]);

  const goToPrevPage = useCallback(() => {
    if (activePageIndex > 0) {
      goToPage(activePageIndex - 1);
    }
  }, [activePageIndex, goToPage]);

    // وظيفة للعثور على صفحة الآية
    const findAyahPage = useCallback((surahNumber, ayahNumber) => {
      return pages.findIndex(page => 
        page.ayahs.some(ayah => 
          ayah.sura_no === surahNumber && ayah.aya_no === ayahNumber
        )
      );
    }, [pages]);
  // وظيفة محسنة للتمرير إلى الآية (مثل Ctrl+F)
  const scrollToAyah = useCallback((ayahId, focus = true) => {
    // محاولة العثور على العنصر المباشر
    let ayahElement = document.querySelector(`[data-ayah-id="${ayahId}"]`);
    
    // إذا لم يتم العثور، انتظر قليلاً وحاول مرة أخرى
    if (!ayahElement) {
      setTimeout(() => {
        ayahElement = document.querySelector(`[data-ayah-id="${ayahId}"]`);
        if (ayahElement) {
          performScrollToAyah(ayahElement, ayahId, focus);
        }
      }, 100);
      return;
    }
    
    performScrollToAyah(ayahElement, ayahId, focus);
  }, []);
      // وظيفة للانتقال المباشر إلى الآية (مثل Ctrl+F)
  const navigateToAyah = useCallback((ayahId, surahNumber, ayahNumber, highlightOnly = false) => {
    if (!ayahId) return;
    
    // البحث عن الآية في المصفوفة الكاملة
    const ayah = ayahs.find(a => a.id === ayahId);
    if (!ayah) {
      showToast('لم يتم العثور على الآية', 'error');
      return;
    }
    
    // تحديث تفاصيل الآية المحددة
    setBookmarkAyahDetails({
      key: `${surahNumber}_${ayahNumber}`,
      surahNumber,
      ayahNumber,
      ayahId,
      ayahText: ayah.aya_text_emlaey || ayah.aya_text,
      surahName: ayah.sura_name_ar
    });
    
    // البحث عن الصفحة التي تحتوي على الآية
    const pageIndex = findAyahPage(surahNumber, ayahNumber);
    
    if (pageIndex >= 0) {
      // إذا لم تكن في نفس الصفحة، الانتقال إلى الصفحة
      if (!highlightOnly && pageIndex !== activePageIndex) {
        goToPage(pageIndex);
        setIsScrollingToAyah(true);
      }
      
      // تأخير بسيط ثم التمرير إلى الآية
      setTimeout(() => {
        scrollToAyah(ayahId, true);
        
        // إزالة التظليل بعد 5 ثواني
        if (highlightedTimer.current) {
          clearTimeout(highlightedTimer.current);
        }
        
        highlightedTimer.current = setTimeout(() => {
          if (!isScrollingToAyah) {
            setHighlightedAyah(null);
          }
        }, 5000);
      }, highlightOnly ? 0 : 300);
      
      if (!highlightOnly) {
        showToast(`انتقال إلى ${ayah.sura_name_ar} - آية ${ayahNumber}`);
      }
    } else {
      showToast('لم يتم العثور على الصفحة', 'error');
    }
  }, [ayahs, findAyahPage, activePageIndex, goToPage, scrollToAyah, isScrollingToAyah]);



  // وظيفة مساعدة للتمرير
  const performScrollToAyah = useCallback((ayahElement, ayahId, focus) => {
    if (!ayahElement || !containerRef.current) return;
    
    // تعيين الآية كالمحددة
    setHighlightedAyah(ayahId);
    setIsScrollingToAyah(false);
    
    // الحصول على إحداثيات العنصر
    const rect = ayahElement.getBoundingClientRect();
    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();
    
    // حساب موضع التمرير
    const scrollTop = container.scrollTop;
    const elementTop = rect.top + scrollTop - containerRect.top;
    
    // التمرير إلى منتصف العنصر
    container.scrollTo({
      top: elementTop - (container.clientHeight / 2) + (rect.height / 2),
      behavior: 'smooth'
    });
    
    // إضافة تأثيرات
    ayahElement.classList.add('search-highlight');
    
    // التركيز على العنصر (مثل Ctrl+F)
    if (focus) {
      setTimeout(() => {
        ayahElement.focus({ preventScroll: true });
        
        // إضافة تأثير التركيز المرئي
        ayahElement.setAttribute('tabindex', '-1');
        ayahElement.style.outline = 'none';
        
        // تأثير نبض
        ayahElement.classList.add('search-pulse');
        setTimeout(() => {
          ayahElement.classList.remove('search-pulse');
        }, 1500);
      }, 300);
    }
    
    // إزالة التظليل بعد فترة
    setTimeout(() => {
      ayahElement.classList.remove('search-highlight');
    }, 3000);
  }, []);

  // وظيفة للانتقال إلى الإشارة المرجعية
  const goToBookmarkAyah = useCallback((bookmark) => {
    if (!bookmark) return;
    
    const { surahNumber, ayahNumber, key } = bookmark;
    
    // البحث عن الآية في المصفوفة الكاملة
    const ayah = ayahs.find(a => 
      a.sura_no === surahNumber && a.aya_no === ayahNumber
    );
    
    if (!ayah) {
      showToast('لم يتم العثور على الآية', 'error');
      return;
    }
    
    // استخدام وظيفة التنقل المحسنة
    navigateToAyah(ayah.id, surahNumber, ayahNumber, false);
    
    // إضافة إلى نتائج البحث (لميزة التنقل بين النتائج)
    setSearchResults([{
      id: ayah.id,
      surahNumber,
      ayahNumber,
      text: ayah.aya_text_emlaey || ayah.aya_text,
      surahName: ayah.sura_name_ar
    }]);
    setCurrentSearchIndex(0);
    
  }, [ayahs, navigateToAyah]);
  
      // وظيفة للتنقل بين نتائج البحث
  const navigateSearchResults = useCallback((direction) => {
    if (searchResults.length === 0) return;
    
    let newIndex;
    if (direction === 'next') {
      newIndex = (currentSearchIndex + 1) % searchResults.length;
    } else {
      newIndex = (currentSearchIndex - 1 + searchResults.length) % searchResults.length;
    }
    
    setCurrentSearchIndex(newIndex);
    const result = searchResults[newIndex];
    
    if (result) {
      navigateToAyah(result.id, result.surahNumber, result.ayahNumber, true);
      showToast(`${result.surahName} - آية ${result.ayahNumber} (${newIndex + 1}/${searchResults.length})`);
    }
  }, [searchResults, currentSearchIndex, navigateToAyah]);


  // تحديث دالة goToSavedPosition
  const goToSavedPosition = useCallback((position) => {
    if (!position || !pages.length) return;
    
    const pageIndex = position.pageIndex || 
      pages.findIndex(p => p.pageNumber === position.pageNumber);
    
    if (pageIndex >= 0 && pageIndex < pages.length) {
      goToPage(pageIndex);
      
      // إذا كان هناك رقم آية محفوظ، التمرير إليها
      if (position.ayahNumber) {
        setTimeout(() => {
          // البحث عن الآية في الصفحة الحالية
          const currentPage = pages[pageIndex];
          const ayah = currentPage.ayahs.find(a => a.aya_no === position.ayahNumber);
          
          if (ayah) {
            navigateToAyah(ayah.id, ayah.sura_no, ayah.aya_no, true);
          }
        }, 600);
      }
      
      showToast(`تم العودة إلى ${position.surahName} - صفحة ${position.pageNumber}`);
    }
  }, [pages, goToPage, navigateToAyah]);
    
  // تقسيم الآيات إلى صفحات
  useEffect(() => {
    if (ayahs.length > 0) {
      const pagesMap = {};
      let displayedSurahs = new Set();
      
      ayahs.forEach(ayah => {
        const pageNum = ayah.page;
        if (!pagesMap[pageNum]) {
          pagesMap[pageNum] = {
            pageNumber: pageNum,
            ayahs: [],
            surahs: new Set(),
            lines: {},
            startAyah: Infinity,
            endAyah: 0,
          };
        }
        
        if (!pagesMap[pageNum].lines[ayah.line_start]) {
          pagesMap[pageNum].lines[ayah.line_start] = [];
        }
        
        const shouldShowSurahTitle = !displayedSurahs.has(ayah.sura_no);
        if (shouldShowSurahTitle) {
          displayedSurahs.add(ayah.sura_no);
        }
        
        pagesMap[pageNum].lines[ayah.line_start].push({
          ...ayah,
          positionInLine: pagesMap[pageNum].lines[ayah.line_start].length,
          shouldShowSurahTitle: shouldShowSurahTitle && ayah.line_start <= 3
        });
        
        pagesMap[pageNum].ayahs.push(ayah);
        pagesMap[pageNum].surahs.add(ayah.sura_name_ar);
        
        if (ayah.aya_no < pagesMap[pageNum].startAyah) {
          pagesMap[pageNum].startAyah = ayah.aya_no;
        }
        if (ayah.aya_no > pagesMap[pageNum].endAyah) {
          pagesMap[pageNum].endAyah = ayah.aya_no;
        }
      });
      
      const sortedPages = Object.values(pagesMap)
        .sort((a, b) => a.pageNumber - b.pageNumber)
        .map(page => ({
          ...page,
          surahs: Array.from(page.surahs),
          surahsCount: page.surahs.size,
          orderedLines: Object.keys(page.lines)
            .sort((a, b) => parseInt(a) - parseInt(b))
            .map(lineNum => ({
              lineNumber: parseInt(lineNum),
              ayahs: page.lines[lineNum]
            }))
        }));
      
      setPages(sortedPages);
      if (sortedPages.length > 0) {
        const initialPage = lastReadPosition?.pageIndex || 0;
        setCurrentPage(sortedPages[initialPage].pageNumber);
        setActivePageIndex(initialPage);
        
        if (initialPage > 0) {
          setTimeout(() => scrollToActivePage(), 300);
        }
      }
    }
  }, [ayahs]);

  // إدارة الإشارات المرجعية
  const loadBookmarksFromStorage = useCallback(() => {
    try {
      const savedBookmarks = localStorage.getItem('quran_bookmarks');
      if (savedBookmarks) {
        setBookmarks(JSON.parse(savedBookmarks));
      }
    } catch (error) {
      console.error('Error loading bookmarks:', error);
      showToast('تعذر تحميل الإشارات المرجعية', 'error');
    }
  }, []);

  const loadLastPosition = useCallback(() => {
    try {
      const savedPosition = localStorage.getItem('quran_last_position');
      if (savedPosition) {
        setLastReadPosition(JSON.parse(savedPosition));
      }
    } catch (error) {
      console.error('Error loading last position:', error);
    }
  }, []);

  const loadSettings = useCallback(() => {
    try {
      const savedSettings = localStorage.getItem('quran_settings');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        setNightMode(settings.nightMode || false);
        setFontFamily(settings.fontFamily || 'Uthmanic');
        setZoomLevel(settings.zoomLevel || 100);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }, []);

  const saveSettings = useCallback(() => {
    try {
      const settings = {
        nightMode,
        fontFamily,
        zoomLevel
      };
      localStorage.setItem('quran_settings', JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  }, [nightMode, fontFamily, zoomLevel]);

  const saveBookmarksToStorage = useCallback((bookmarksList) => {
    try {
      localStorage.setItem('quran_bookmarks', JSON.stringify(bookmarksList));
    } catch (error) {
      console.error('Error saving bookmarks:', error);
      showToast('تعذر حفظ الإشارة المرجعية', 'error');
    }
  }, []);

  const saveCurrentPosition = useCallback(() => {
    if (!searchResult || activePageIndex >= pages.length) return;
    
    const currentPageData = pages[activePageIndex];
    const position = {
      surahNumber: searchResult.surahNumber,
      surahName: searchResult.surahName,
      fromAyah: searchResult.from,
      toAyah: searchResult.to,
      pageNumber: currentPageData.pageNumber,
      pageIndex: activePageIndex,
      ayahNumber: getCurrentAyahInView(),
      timestamp: new Date().toISOString(),
      totalPages: pages.length
    };
    
    try {
      localStorage.setItem('quran_last_position', JSON.stringify(position));
      setLastReadPosition(position);
      showToast('تم حفظ الموضع الحالي');
    } catch (error) {
      console.error('Error saving position:', error);
      showToast('تعذر حفظ الموضع', 'error');
    }
  }, [searchResult, activePageIndex, pages]);

  const getCurrentAyahInView = useCallback(() => {
    if (!containerRef.current || !pages[activePageIndex]) return 1;
    
    const scrollTop = containerRef.current.scrollTop;
    const pageTop = document.getElementById(`page-${activePageIndex}`)?.offsetTop || 0;
    const relativeScroll = scrollTop - pageTop;
    
    const page = pages[activePageIndex];
    if (page && page.ayahs.length > 0) {
      const ayahsPerPixel = page.ayahs.length / 800;
      const ayahIndex = Math.floor(relativeScroll * ayahsPerPixel);
      return page.ayahs[Math.max(0, Math.min(ayahIndex, page.ayahs.length - 1))].aya_no;
    }
    
    return 1;
  }, [activePageIndex, pages]);



  // إدارة الإشارات المرجعية
  const toggleBookmark = useCallback((ayah) => {
    if (!ayah) return;
    
    const bookmarkKey = `${ayah.sura_no}_${ayah.aya_no}`;
    const existingIndex = bookmarks.findIndex(b => b.key === bookmarkKey);
    
    let newBookmarks;
    if (existingIndex >= 0) {
      newBookmarks = bookmarks.filter((_, index) => index !== existingIndex);
      showToast('تم إزالة الإشارة المرجعية');
    } else {
      const bookmark = {
        key: bookmarkKey,
        surahNumber: ayah.sura_no,
        surahName: ayah.sura_name_ar,
        ayahNumber: ayah.aya_no,
        page: ayah.page,
        juz: ayah.jozz,
        text: ayah.aya_text_emlaey?.substring(0, 50) + '...' || '',
        timestamp: new Date().toISOString(),
        color: getRandomBookmarkColor()
      };
      
      newBookmarks = [...bookmarks, bookmark];
      showToast('تم إضافة إشارة مرجعية');
    }
    
    setBookmarks(newBookmarks);
    saveBookmarksToStorage(newBookmarks);
    setShowBookmarkMenu(false);
  }, [bookmarks, saveBookmarksToStorage]);

  const getRandomBookmarkColor = useCallback(() => {
    const colors = ['#4caf50', '#2196f3', '#ff9800', '#9c27b0', '#f44336', '#009688'];
    return colors[Math.floor(Math.random() * colors.length)];
  }, []);

  // إدارة النقر المطول
  const handleAyahLongPress = useCallback((ayah, event) => {
    event.preventDefault();
    setSelectedAyahForBookmark(ayah);
    setShowBookmarkMenu(true);
    saveCurrentPosition();
  }, [saveCurrentPosition]);

  const handleAyahTouchStart = useCallback((ayah, event) => {
    touchStartTime.current = Date.now();
    longPressTimer.current = setTimeout(() => {
      handleAyahLongPress(ayah, event);
    }, 800);
  }, [handleAyahLongPress]);

  const handleAyahTouchEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    touchStartTime.current = null;
  }, []);

  const handleAyahClick = useCallback((ayah) => {
    const clickDuration = touchStartTime.current ? Date.now() - touchStartTime.current : 0;
    
    if (clickDuration < 300) {
      playAyah(ayah);
    }
    
    handleAyahTouchEnd();
  }, [handleAyahTouchEnd]);

  // عرض الرسائل المؤقتة
  const showToast = useCallback((message, type = 'success') => {
    if (toastTimeout.current) {
      clearTimeout(toastTimeout.current);
    }

    const toast = document.createElement('div');
    toast.className = `position-toast ${type}`;
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      bottom: 100px;
      left: 50%;
      transform: translateX(-50%);
      background: ${type === 'error' ? '#f44336' : 'rgba(0, 0, 0, 0.8)'};
      color: white;
      padding: 12px 24px;
      border-radius: 25px;
      z-index: 10000;
      font-size: 14px;
      animation: fadeInOut 3s ease-in-out;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    `;
    
    document.body.appendChild(toast);
    
    toastTimeout.current = setTimeout(() => {
      if (toast.parentNode) {
        toast.remove();
      }
    }, 3000);
  }, []);

  // إدارة الصوت
  const playAyah = useCallback((ayah) => {
    if (!ayah) return;
    
    setSelectedAyah(ayah.id);
    const ayahNumber = ayah.id;
    
    const url = `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${ayahNumber}.mp3`;
    setAudioUrl(url);
    
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      
      audioRef.current.src = url;
      audioRef.current.load();
      
      audioRef.current.oncanplaythrough = () => {
        audioRef.current.play()
          .then(() => {
            setIsPlaying(true);
          })
          .catch(error => {
            console.error('خطأ في تشغيل الصوت:', error);
            showToast('تعذر تشغيل الصوت. تأكد من اتصال الإنترنت.', 'error');
          });
      };
    }
  }, []);

  const togglePlayPause = useCallback(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying]);

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      setSelectedAyah(null);
      setAudioProgress(0);
      setCurrentTime(0);
    }
  }, []);

  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current) {
      const progress = (audioRef.current.currentTime / audioRef.current.duration) * 100;
      setAudioProgress(progress);
      setCurrentTime(audioRef.current.currentTime);
      setAudioDuration(audioRef.current.duration);
    }
  }, []);

  const handleAudioEnded = useCallback(() => {
    setIsPlaying(false);
    if (isRepeating && selectedAyah) {
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.currentTime = 0;
          audioRef.current.play();
          setIsPlaying(true);
        }
      }, 500);
    }
  }, [isRepeating, selectedAyah]);

  const handleSeek = useCallback((e) => {
    if (audioRef.current) {
      const newTime = parseFloat(e.target.value);
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  }, []);

  const handleVolumeChange = useCallback((e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  }, []);







  
  // إعدادات الخط
  const fontFamilies = useMemo(() => [
    { id: 'uthmanic', name: 'عثماني', className: 'font-uthmanic' },
    { id: 'naskh', name: 'نسخ', className: 'font-naskh' },
    { id: 'me-quran', name: 'مي قرآن', className: 'font-me-quran' },
    { id: 'kfgq', name: 'مجمع الملك فهد', className: 'font-kfgq' }
  ], []);

  // عرض قائمة الإشارات المرجعية
  const renderBookmarksMenu = useCallback(() => {
    if (!showBookmarkMenu || !selectedAyahForBookmark) return null;

    const isBookmarked = bookmarks.some(
      b => b.key === `${selectedAyahForBookmark.sura_no}_${selectedAyahForBookmark.aya_no}`
    );

    return (
      <div className="bookmark-menu-overlay" onClick={() => setShowBookmarkMenu(false)}>
        <div className="bookmark-menu" onClick={e => e.stopPropagation()}>
          <div className="menu-header">
            <h4>إشارة مرجعية</h4>
            <button 
              className="close-menu" 
              onClick={() => setShowBookmarkMenu(false)}
              aria-label="إغلاق"
            >
              ✕
            </button>
          </div>
          
          <div className="menu-content">
            <p className="ayah-preview">
              {selectedAyahForBookmark.aya_text_emlaey?.substring(0, 60) || ''}...
            </p>
            
            <div className="menu-actions">
              <button 
                className={`bookmark-action ${isBookmarked ? 'remove' : 'add'}`}
                onClick={() => toggleBookmark(selectedAyahForBookmark)}
                aria-label={isBookmarked ? 'إزالة الإشارة' : 'إضافة إشارة'}
              >
                <span className="action-icon">
                  {isBookmarked ? '📌' : '📍'}
                </span>
                <span className="action-text">
                  {isBookmarked ? 'إزالة الإشارة' : 'إضافة إشارة'}
                </span>
              </button>
              
              <button 
                className="bookmark-action save-position"
                onClick={saveCurrentPosition}
                aria-label="حفظ الموضع"
              >
                <span className="action-icon">💾</span>
                <span className="action-text">حفظ الموضع</span>
              </button>
              
              <button 
                className="bookmark-action play-audio"
                onClick={() => playAyah(selectedAyahForBookmark)}
                aria-label="تشغيل الآية"
              >
                <span className="action-icon">🔊</span>
                <span className="action-text">تشغيل الآية</span>
              </button>

              <button 
              className="bookmark-action tafsir-action"
              onClick={() => {
                openTafsir(selectedAyahForBookmark);
                setShowBookmarkMenu(false);
              }}
              aria-label="عرض التفسير"
            >
              <span className="action-icon">📖</span>
              <span className="action-text">عرض التفسير</span>
            </button>
            </div>
          </div>
        </div>
      </div>
    );
  }, [showBookmarkMenu, selectedAyahForBookmark, bookmarks, toggleBookmark, saveCurrentPosition, openTafsir]);

  // عرض شريط الإشارات المرجعية
    const renderBookmarksBar = useCallback(() => {
      if (bookmarks.length === 0) return null;
  
      return (
        <div className="bookmarks-sidebar">
          <div className="sidebar-header">
            <h4>📚 الإشارات المرجعية ({bookmarks.length})</h4>
            <div className="sidebar-controls">
              {searchResults.length > 1 && (
                <div className="search-navigation">
                  <button 
                    onClick={() => navigateSearchResults('prev')}
                    className="nav-search-btn"
                    title="السابق"
                  >
                    ◀
                  </button>
                  <span className="search-counter">
                    {currentSearchIndex + 1}/{searchResults.length}
                  </span>
                  <button 
                    onClick={() => navigateSearchResults('next')}
                    className="nav-search-btn"
                    title="التالي"
                  >
                    ▶
                  </button>
                </div>
              )}
              <button 
                className="sidebar-toggle"
                onClick={() => {
                  const sidebar = document.querySelector('.bookmarks-sidebar');
                  sidebar?.classList.toggle('collapsed');
                }}
                aria-label="طي/فتح الشريط"
              >
                ◀
              </button>
            </div>
          </div>
          
          <div className="bookmarks-list">
            {bookmarks.slice(0, 5).map((bookmark) => (
              <div 
                key={bookmark.key}
                className={`bookmark-item ${bookmarkAyahDetails?.key === bookmark.key ? 'active' : ''}`}
                onClick={() => goToBookmarkAyah(bookmark)}
                style={{ borderRightColor: bookmark.color }}
                role="button"
                tabIndex={0}
                onKeyPress={(e) => e.key === 'Enter' && goToBookmarkAyah(bookmark)}
                title="انقر للانتقال إلى الآية (مثل Ctrl+F)"
              >
                <div className="bookmark-info">
                  <span className="bookmark-surah">{bookmark.surahName}</span>
                  <span className="bookmark-ayah">آية {bookmark.ayahNumber}</span>
                </div>
                <div className="bookmark-meta">
                  <span className="bookmark-page">ص {bookmark.page}</span>
                  <button 
                    className="remove-bookmark"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleBookmark({
                        sura_no: bookmark.surahNumber,
                        aya_no: bookmark.ayahNumber,
                        sura_name_ar: bookmark.surahName
                      });
                    }}
                    aria-label="إزالة الإشارة"
                  >
                    ✕
                  </button>
                </div>
                
                {bookmarkAyahDetails?.key === bookmark.key && (
                  <div className="bookmark-navigating">
                    <div className="navigating-indicator">
                      <div className="indicator-dot"></div>
                      <div className="indicator-dot"></div>
                      <div className="indicator-dot"></div>
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            {bookmarks.length > 5 && (
              <div className="more-bookmarks">
                + {bookmarks.length - 5} إشارة أخرى
              </div>
            )}
          </div>
          
          <div className="sidebar-footer">
            <button 
              className="go-to-last"
              onClick={() => lastReadPosition && goToSavedPosition(lastReadPosition)}
              disabled={!lastReadPosition}
              aria-label="العودة لآخر موضع"
            >
              📍 العودة لآخر موضع
            </button>
            
            {bookmarkAyahDetails && (
              <div className="current-ayah-info">
                <div className="ayah-info-header">
                  <span>📍 الآية المحددة:</span>
                  <div className="ayah-info-controls">
                    {searchResults.length > 1 && (
                      <button 
                        className="nav-result-btn"
                        onClick={() => navigateSearchResults('prev')}
                        title="النتيجة السابقة"
                      >
                        ◀
                      </button>
                    )}
                    <button 
                      className="clear-highlight"
                      onClick={() => {
                        setHighlightedAyah(null);
                        setBookmarkAyahDetails(null);
                        setIsScrollingToAyah(false);
                        setSearchResults([]);
                      }}
                      aria-label="إزالة التظليل"
                    >
                      ✕
                    </button>
                    {searchResults.length > 1 && (
                      <button 
                        className="nav-result-btn"
                        onClick={() => navigateSearchResults('next')}
                        title="النتيجة التالية"
                      >
                        ▶
                      </button>
                    )}
                  </div>
                </div>
                <div className="ayah-info-content">
                  <strong>{bookmarkAyahDetails.surahName} - آية {bookmarkAyahDetails.ayahNumber}</strong>
                  <p className="ayah-preview-text">
                    {bookmarkAyahDetails.ayahText.substring(0, 40)}...
                  </p>
                  {searchResults.length > 1 && (
                    <div className="search-position">
                      النتيجة {currentSearchIndex + 1} من {searchResults.length}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }, [bookmarks, bookmarkAyahDetails, searchResults, currentSearchIndex, 
        goToBookmarkAyah, toggleBookmark, lastReadPosition, goToSavedPosition, 
        navigateSearchResults]);

  // إضافة useEffect لتنظيف التايمر
  useEffect(() => {
    return () => {
      if (highlightedTimer.current) {
        clearTimeout(highlightedTimer.current);
      }
    };
  }, []);

  // عرض إعدادات الخط
  const renderFontSettings = useCallback(() => {
    if (activeTool !== 'font') return null;

    return (
      <div className="settings-menu">
        <div className="settings-header">
          <h5>إعدادات الخط</h5>
          <button onClick={() => setActiveTool(null)}>✕</button>
        </div>
        <div className="font-options">
          {fontFamilies.map(font => (
            <button
              key={font.id}
              className={`font-option ${fontFamily === font.id ? 'active' : ''}`}
              onClick={() => {
                setFontFamily(font.id);
                saveSettings();
              }}
            >
              <span className={`font-sample ${font.className}`}>القرآن الكريم</span>
              <span className="font-name">{font.name}</span>
            </button>
          ))}
        </div>
        <div className="zoom-controls">
          <button onClick={() => setZoomLevel(prev => Math.max(70, prev - 10))}>🔍-</button>
          <span>{zoomLevel}%</span>
          <button onClick={() => setZoomLevel(prev => Math.min(150, prev + 10))}>🔍+</button>
        </div>
      </div>
    );
  }, [activeTool, fontFamily, fontFamilies, saveSettings]);

  // عرض صفحة من المصحف
  const renderMushafPage = useCallback((page, pageIndex) => {
    const isActive = pageIndex === activePageIndex;
    const surahsInPage = {};
    
    page.ayahs.forEach(ayah => {
      if (!surahsInPage[ayah.sura_no]) {
        surahsInPage[ayah.sura_no] = {
          name: ayah.sura_name_ar,
          number: ayah.sura_no,
          showTitle: false
        };
      }
    });
    
    const firstLineAyahs = page.orderedLines[0]?.ayahs || [];
    firstLineAyahs.forEach(ayah => {
      const ayahIndexInAllAyahs = ayahs.findIndex(a => a.id === ayah.id);
      if (ayahIndexInAllAyahs > 0) {
        const prevAyah = ayahs[ayahIndexInAllAyahs - 1];
        if (prevAyah.sura_no !== ayah.sura_no) {
          surahsInPage[ayah.sura_no].showTitle = true;
        }
      } else {
        surahsInPage[ayah.sura_no].showTitle = true;
      }
    });

    return (
      <div 
        id={`page-${pageIndex}`}
        key={page.pageNumber}
        className={`mushaf-page ${isActive ? 'active' : ''} ${nightMode ? 'night-mode' : ''}`}
        style={{ fontFamily: fontFamily }}
      >
        <div className="page-frame">
          {/* ... (بقية الهيدر كما هو) */}
          
          <div className="mushaf-content">
            {page.orderedLines.map((line) => (
              <div key={line.lineNumber} className="quran-line">
                {line.ayahs.map((ayah) => {
                  const isSurahStart = surahsInPage[ayah.sura_no]?.showTitle && 
                    line.ayahs.indexOf(ayah) === 0 && 
                    page.orderedLines.indexOf(line) === 0;
                  
                  const isSelected = selectedAyah === ayah.id;
                  const isBookmarked = bookmarks.some(
                    b => b.key === `${ayah.sura_no}_${ayah.aya_no}`
                  );
                  const isHighlighted = highlightedAyah === ayah.id;
                  const isCurrentBookmark = bookmarkAyahDetails?.ayahId === ayah.id;
                  
                  return (
                    <React.Fragment key={ayah.id}>
                      {isSurahStart && (
                        <div className="surah-title-section">
                             <div className="basmala-section">
                                <span className="basmala-arabic">
                                      
                                </span>
                                <span className="basmala-translation">
                                  بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                                </span>
                              </div>
                        </div>
                      )}
                      
                      <div 
                        ref={el => {
                          if (el) {
                            ayahElementsRef.current[ayah.id] = el;
                          }
                        }}
                        data-ayah-id={ayah.id}
                        data-surah-number={ayah.sura_no}
                        data-ayah-number={ayah.aya_no}
                        className={`
                          ayah-inline 
                          ${isSelected ? 'selected' : ''} 
                          ${isBookmarked ? 'bookmarked' : ''}
                          ${isHighlighted ? 'search-highlighted' : ''}
                          ${isCurrentBookmark ? 'current-bookmark' : ''}
                        `}
                        onClick={() => handleAyahClick(ayah)}
                        onTouchStart={(e) => handleAyahTouchStart(ayah, e)}
                        onTouchEnd={handleAyahTouchEnd}
                        onTouchCancel={handleAyahTouchEnd}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          handleAyahLongPress(ayah, e);
                        }}
                        title={isCurrentBookmark ? 
                          "الآية المحددة (انقر للتشغيل، اضغط مطولاً للإشارة المرجعية)" : 
                          "انقر للتشغيل، اضغط مطولاً للإشارة المرجعية"
                        }
                        role="button"
                        tabIndex={0}
                        onKeyPress={(e) => e.key === 'Enter' && handleAyahClick(ayah)}
                        aria-label={`آية ${ayah.aya_no} من سورة ${ayah.sura_name_ar}${isCurrentBookmark ? ' - الآية المحددة' : ''}`}
                      >

                        {isBookmarked && (
                          <div 
                            className="bookmark-indicator" 
                            style={{
                              backgroundColor: bookmarks.find(
                                b => b.key === `${ayah.sura_no}_${ayah.aya_no}`
                              )?.color
                            }}
                            title="آية موسومة"
                          ></div>
                        )}
                        
                        <span className="quran-text-inline">
                          {ayah.aya_text}
                        </span>
                        
                        <span className="ayah-end-sign">
                          <div className="circle-number">
                            <span className="ayah-number-small">{ayah.aya_no}</span>
                          </div>
                        </span>
                        
                        {isSelected && isPlaying && (
                          <div className="playing-indicator">
                            <div className="sound-wave">
                              <div className="wave-bar"></div>
                              <div className="wave-bar"></div>
                              <div className="wave-bar"></div>
                            </div>
                          </div>
                        )}
                        
                        {isCurrentBookmark && (
                          <div className="current-bookmark-indicator">
                            <div className="bookmark-pin">
                              <div className="pin-head"></div>
                              <div className="pin-body"></div>
                            </div>
                            <div className="bookmark-tooltip">
                              <span>📍 الآية المحددة</span>
                            </div>
                          </div>
                        )}

                        {isHighlighted && (
                          <div className="search-match-indicator">
                            <div className="search-match-arrow">▼</div>
                            <div className="search-match-badge">
                              <span className="badge-text">مطابقة</span>
                              {searchResults.length > 1 && (
                                <span className="badge-counter">
                                  {currentSearchIndex + 1}/{searchResults.length}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                        <div className="ayah-actions">
                          <button 
                            className="ayah-action tafsir-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              openTafsir(ayah);
                            }}
                            title="عرض تفسير الآية"
                            aria-label="عرض تفسير الآية"
                          >
                            📖
                          </button>
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>
            ))}
          </div>

          {/* ... (بقية الفوتر كما هو) */}
          <div className="page-footer">
            <div className="footer-info">
              <div className="info-item">
                
                <span className="info-text">الجزء {page.ayahs[0]?.jozz || 1}</span>
              </div>
              <div className="info-item">
                
                <span className="info-text">الصفحة {page.pageNumber}</span>
              </div>
            </div>
        </div>
      </div>
      </div>
    );
  }, [activePageIndex, selectedAyah, isPlaying, bookmarks, nightMode, fontFamily, 
    ayahs, handleAyahClick, handleAyahTouchStart, handleAyahTouchEnd, 
    handleAyahLongPress, goToPage, pages, highlightedAyah, bookmarkAyahDetails,
    searchResults, currentSearchIndex,openTafsir]);

    // إضافة زر للعودة إلى الآية المحددة
    const renderReturnToBookmarkButton = useCallback(() => {
      if (!bookmarkAyahDetails || !highlightedAyah) return null;
  
      return (
        <div className="return-to-bookmark-fab">
          <button
            className="return-btn"
            onClick={() => scrollToAyah(bookmarkAyahDetails.ayahId)}
            title="العودة إلى الآية المحددة"
            aria-label="العودة إلى الآية المحددة"
          >
            <span className="return-icon">📍</span>
            <span className="return-text">
              {bookmarkAyahDetails.surahName} - آية {bookmarkAyahDetails.ayahNumber}
            </span>
          </button>
        </div>
      );
    }, [bookmarkAyahDetails, highlightedAyah, scrollToAyah]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorDisplay message={error} onRetry={onBack} />;
  }

  if (ayahs.length === 0) {
    return (
      <div className="no-ayahs-message">
        <h3>لا توجد آيات لعرضها</h3>
        <button onClick={onBack} className="back-btn">
          العودة للبحث
        </button>
      </div>
    );
  }

  return (
    <div className={`full-ayahs-view ${nightMode ? 'night-mode' : ''}`}>
      {/* مشغل الصوت المخفي */}
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleAudioEnded}
        onLoadedMetadata={() => {
          if (audioRef.current) {
            setAudioDuration(audioRef.current.duration);
          }
        }}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onError={(e) => {
          console.error('خطأ في تحميل الصوت:', e);
          showToast('تعذر تحميل الصوت. تأكد من اتصال الإنترنت.', 'error');
        }}
      />

      {/* شريط التحكم العلوي */}
      <div className="mushaf-header">
        <div className="header-container">
          <button className="back-to-single" onClick={onBack} aria-label="عودة للقراءة المفردة">
            <span className="back-icon">↩</span>
            <span className="back-text">عودة للقراءة المفردة</span>
          </button>
          
          <div className="range-display">
            <h2 className="surah-name-display">
              {searchResult?.surahName || 'المصحف الشريف'}
            </h2>
            <div className="range-details">
              <span className="pages-count">
                الصفحات: {pages[0]?.pageNumber} - {pages[pages.length - 1]?.pageNumber}
              </span>
              <span className="ayahs-count">
                ({ayahs.length} آية في {pages.length} صفحة)
              </span>
            </div>
          </div>
          
          <div className="header-tools">
            <div className="tool-group">
              <button 
                className={`tool-btn ${nightMode ? 'active' : ''}`}
                onClick={() => {
                  setNightMode(!nightMode);
                  saveSettings();
                }}
                title={nightMode ? 'الوضع النهاري' : 'الوضع الليلي'}
                aria-label={nightMode ? 'تفعيل الوضع النهاري' : 'تفعيل الوضع الليلي'}
              >
                {nightMode ? '🌙' : '☀️'}
              </button>
              
              <button 
                className="tool-btn save-position-btn"
                onClick={saveCurrentPosition}
                title="حفظ الموضع الحالي"
                aria-label="حفظ الموضع الحالي"
              >
                💾 حفظ
              </button>
              
              {lastReadPosition && (
                <button 
                  className="tool-btn last-position-btn"
                  onClick={() => goToSavedPosition(lastReadPosition)}
                  title="العودة لآخر موضع"
                  aria-label="العودة لآخر موضع"
                >
                  📍 العودة
                </button>
              )}
            </div>

                  {/* زر العودة إلى الآية المحددة */}
                  {renderReturnToBookmarkButton()}
                        {/* أدوات البحث */}
      {searchResults.length > 0 && (
        <div className="search-tools">
          <div className="search-tools-container">
            <div className="search-stats">
              <span className="search-count">
                {searchResults.length} نتيجة
              </span>
              {bookmarkAyahDetails && (
                <span className="current-search">
                  {bookmarkAyahDetails.surahName} - آية {bookmarkAyahDetails.ayahNumber}
                </span>
              )}
            </div>
            <div className="search-controls">
              <button 
                className="search-nav-btn prev-btn"
                onClick={() => navigateSearchResults('prev')}
                disabled={searchResults.length <= 1}
              >
                ◀ السابق
              </button>
              <button 
                className="search-nav-btn next-btn"
                onClick={() => navigateSearchResults('next')}
                disabled={searchResults.length <= 1}
              >
                التالي ▶
              </button>
              <button 
                className="search-close-btn"
                onClick={() => {
                  setSearchResults([]);
                  setHighlightedAyah(null);
                  setBookmarkAyahDetails(null);
                }}
              >
                ✕ إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
            <div className="tool-group">
              <button 
                className="tool-btn font-btn"
                onClick={() => setActiveTool(activeTool === 'font' ? null : 'font')}
                title="إعدادات الخط"
                aria-label="إعدادات الخط"
              >
                🔤
              </button>
              
              <div className="tool-group">
                <button 
                  className="tool-btn zoom-out"
                  onClick={() => setZoomLevel(prev => Math.max(70, prev - 10))}
                  title="تصغير"
                  aria-label="تصغير النص"
                >
                  🔍-
                </button>
                <span className="zoom-display">{zoomLevel}%</span>
                <button 
                  className="tool-btn zoom-in"
                  onClick={() => setZoomLevel(prev => Math.min(150, prev + 10))}
                  title="تكبير"
                  aria-label="تكبير النص"
                >
                  🔍+
                </button>
              </div>
            </div>
            
            <button 
              className="tool-btn print-btn" 
              onClick={() => window.print()}
              title="طباعة"
              aria-label="طباعة الصفحة"
            >
              🖨️ طباعة
            </button>
          </div>
        </div>
        
        <div className="progress-container">
          <div 
            className="progress-fill" 
            style={{ width: `${((activePageIndex + 1) / pages.length) * 100}%` }}
          ></div>
        </div>
        
        {renderFontSettings()}
      </div>

      {/* مشغل الصوت الثابت */}
      <AudioPlayer
        isPlaying={isPlaying}
        audioUrl={audioUrl}
        currentTime={currentTime}
        audioDuration={audioDuration}
        audioProgress={audioProgress}
        volume={volume}
        isRepeating={isRepeating}
        selectedAyah={selectedAyah}
        ayahs={ayahs}
        onPlayPause={togglePlayPause}
        onStop={stopAudio}
        onRepeatToggle={() => setIsRepeating(!isRepeating)}
        onSeek={handleSeek}
        onVolumeChange={handleVolumeChange}
      />

      {/* قائمة الصفحات المصغرة */}
      <div className="pages-thumbnails">
        <div className="thumbnails-scroll">
          {pages.map((page, index) => (
            <button
              key={page.pageNumber}
              className={`page-thumb ${index === activePageIndex ? 'active' : ''}`}
              onClick={() => goToPage(index)}
              title={`الصفحة ${page.pageNumber}`}
              aria-label={`الذهاب للصفحة ${page.pageNumber}`}
            >
              <div className="thumb-number">{page.pageNumber}</div>
              <div className="thumb-stats">
                <span className="thumb-ayahs">{page.ayahs.length} آية</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* المحتوى الرئيسي */}
      <div 
        ref={containerRef}
        className="mushaf-pages-container"
        style={{ 
          fontSize: `${zoomLevel}%`,
          lineHeight: `${zoomLevel * 1.2}%`
        }}
      >
        {pages.map((page, index) => renderMushafPage(page, index))}
      </div>

      {/* شريط التنقل السفلي */}
      <div className="mushaf-navigation">
        <div className="nav-container">
          <button 
            className="nav-button prev-button"
            onClick={goToPrevPage}
            disabled={activePageIndex === 0}
            aria-label="الصفحة السابقة"
          >
            <span className="nav-icon">⏮</span>
            <span className="nav-label">السابقة</span>
          </button>
          
          <div className="page-navigator">
            <div className="page-info">
              <span className="page-current">الصفحة {currentPage}</span>
              <span className="page-total">من {pages.length}</span>
            </div>
          </div>
          
          <button 
            className="nav-button next-button"
            onClick={goToNextPage}
            disabled={activePageIndex === pages.length - 1}
            aria-label="الصفحة التالية"
          >
            <span className="nav-label">التالية</span>
            <span className="nav-icon">⏭</span>
          </button>
        </div>
      </div>

      {/* شريط الإشارات المرجعية */}
      {renderBookmarksBar()}

      {/* قائمة الإشارات المرجعية */}
      {renderBookmarksMenu()}
      {/* مكون التفسير */}
      {showTafsir && (
        <TafsirView
          ayah={selectedAyahForTafsir}
          onClose={() => {
            setShowTafsir(false);
            setSelectedAyahForTafsir(null);
            setTafsirLoading(false);
          }}
          tafsirData={parsedTafsirData}
          isLoading={tafsirLoading}
        />
      )}
    </div>
  );
};

FullAyahsView.propTypes = {
  ayahs: PropTypes.array,
  searchResult: PropTypes.shape({
    surahName: PropTypes.string,
    surahNumber: PropTypes.number,
    from: PropTypes.number,
    to: PropTypes.number
  }),
  showTranslation: PropTypes.bool,
  showTajweed: PropTypes.bool,
  onBack: PropTypes.func,
  isLoading: PropTypes.bool,
  error: PropTypes.string
};

export default FullAyahsView;