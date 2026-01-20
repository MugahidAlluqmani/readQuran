import React, { useState, useRef, useEffect } from 'react';
import '../../public/styles/FullAyahsView.css';

const FullAyahsView = ({ 
  ayahs = [], 
  searchResult = null,
  showTranslation = true,
  showTajweed = false,
  onBack = () => {}
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
  
  const containerRef = useRef(null);
  const audioRef = useRef(null);

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
        setCurrentPage(sortedPages[0].pageNumber);
        setActivePageIndex(0);
      }
    }
  }, [ayahs]);

  // التعامل مع الصوت
  const playAyah = (ayah) => {
    if (!ayah) return;
    
    setSelectedAyah(ayah.id);
    const ayahNumber = ayah.id; // أو ayah.aya_no إذا كنت تريد رقم الآية فقط
    
    const url = `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${ayahNumber}.mp3`;
    setAudioUrl(url);
    
    // إعادة تعيين المشغل
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      
      // تحميل الملف الجديد
      audioRef.current.src = url;
      audioRef.current.load();
      
      // تشغيل بعد التحميل
      audioRef.current.oncanplaythrough = () => {
        audioRef.current.play()
          .then(() => {
            setIsPlaying(true);
          })
          .catch(error => {
            console.error('خطأ في تشغيل الصوت:', error);
            alert('تعذر تشغيل الصوت. تأكد من اتصال الإنترنت.');
          });
      };
    }
  };

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      setSelectedAyah(null);
      setAudioProgress(0);
      setCurrentTime(0);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const progress = (audioRef.current.currentTime / audioRef.current.duration) * 100;
      setAudioProgress(progress);
      setCurrentTime(audioRef.current.currentTime);
      setAudioDuration(audioRef.current.duration);
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
    if (isRepeating && selectedAyah) {
      // إعادة تشغيل نفس الآية
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.currentTime = 0;
          audioRef.current.play();
          setIsPlaying(true);
        }
      }, 500);
    }
  };

  const handleSeek = (e) => {
    if (audioRef.current) {
      const newTime = parseFloat(e.target.value);
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const goToNextPage = () => {
    if (activePageIndex < pages.length - 1) {
      const nextIndex = activePageIndex + 1;
      setActivePageIndex(nextIndex);
      setCurrentPage(pages[nextIndex].pageNumber);
      scrollToActivePage();
    }
  };

  const goToPrevPage = () => {
    if (activePageIndex > 0) {
      const prevIndex = activePageIndex - 1;
      setActivePageIndex(prevIndex);
      setCurrentPage(pages[prevIndex].pageNumber);
      scrollToActivePage();
    }
  };

  const goToPage = (pageIndex) => {
    setActivePageIndex(pageIndex);
    setCurrentPage(pages[pageIndex].pageNumber);
    scrollToActivePage();
  };

  const scrollToActivePage = () => {
    setTimeout(() => {
      const pageElement = document.getElementById(`page-${activePageIndex}`);
      if (pageElement && containerRef.current) {
        containerRef.current.scrollTo({
          top: pageElement.offsetTop - 20,
          behavior: 'smooth'
        });
      }
    }, 100);
  };

  // عرض صفحة من المصحف
  const renderMushafPage = (page, pageIndex) => {
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
        className={`mushaf-page ${isActive ? 'active' : ''}`}
      >
        <div className="page-frame">
          <div className="page-header">
            <div className="page-number">
              <div className="page-number-circle">
                <span className="page-num">{page.pageNumber}</span>
              </div>
              <div className="page-number-text">
                <span className="page-label">صفحة</span>
              </div>
            </div>
            
            <div className="page-surahs">
              {Object.values(surahsInPage).map((surah, idx) => (
                <div key={surah.number} className="surah-tag">
                  {surah.name}
                </div>
              ))}
            </div>
            
            <div className="page-range">
              <span className="range-text">
                من آية {page.startAyah} إلى {page.endAyah}
              </span>
            </div>
          </div>

          <div className="mushaf-content">
            {page.orderedLines.map((line, lineIndex) => (
              <div key={line.lineNumber} className="quran-line">
                {line.ayahs.map((ayah, ayahIndex) => {
                  const isSurahStart = surahsInPage[ayah.sura_no]?.showTitle && 
                    ayahIndex === 0 && 
                    lineIndex === 0;
                  
                  const isSelected = selectedAyah === ayah.id;
                  
                  return (
                    <React.Fragment key={ayah.id}>
                      {isSurahStart && (
                        <div className="surah-title-section">
                          <div className="surah-header">
                            <div className="surah-name-box">
                              <span className="surah-name-arabic">{ayah.sura_name_ar}</span>
                              <span className="surah-number-circle">{ayah.sura_no}</span>
                            </div>
                            <div className="basmala-section">
                              <span className="basmala-arabic">
                                    
                              </span>
                              <span className="basmala-translation">
                                بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div 
                        className={`ayah-inline ${isSelected ? 'selected' : ''}`}
                        onClick={() => playAyah(ayah)}
                        title="انقر للاستماع للآية"
                      >
                        <span className="quran-text-inline">
                          {ayah.aya_text}
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
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>
            ))}
          </div>

          <div className="page-footer">
            <div className="footer-info">
              <div className="info-item">
                <span className="info-icon">📖</span>
                <span className="info-text">الجزء {page.ayahs[0]?.jozz || 1}</span>
              </div>
              <div className="info-item">
                <span className="info-icon">🕋</span>
                <span className="info-text">الصفحة {page.pageNumber}</span>
              </div>
            </div>
            
            <div className="page-controls">
              {pageIndex > 0 && (
                <button 
                  className="page-nav-btn prev-btn"
                  onClick={() => goToPage(pageIndex - 1)}
                >
                  الصفحة السابقة
                </button>
              )}
              
              <div className="page-position">
                <span className="current-pos">{pageIndex + 1}</span>
                <span className="total-pos">/{pages.length}</span>
              </div>
              
              {pageIndex < pages.length - 1 && (
                <button 
                  className="page-nav-btn next-btn"
                  onClick={() => goToPage(pageIndex + 1)}
                >
                  الصفحة التالية
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="full-ayahs-view">
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
          alert('تعذر تحميل الصوت. تأكد من اتصال الإنترنت.');
        }}
      />

      {/* شريط التحكم العلوي */}
      <div className="mushaf-header">
        <div className="header-container">
          <button className="back-to-single" onClick={onBack}>
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
                className="tool-btn zoom-out"
                onClick={() => setZoomLevel(prev => Math.max(70, prev - 10))}
              >
                🔍-
              </button>
              <span className="zoom-display">{zoomLevel}%</span>
              <button 
                className="tool-btn zoom-in"
                onClick={() => setZoomLevel(prev => Math.min(150, prev + 10))}
              >
                🔍+
              </button>
            </div>
            
            <button className="tool-btn print-btn" onClick={() => window.print()}>
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
      </div>

      {/* مشغل الصوت الثابت */}
      {selectedAyah && (
        <div className="audio-player-fixed">
          <div className="player-container">
            <div className="player-info">
              <div className="now-playing">
                <span className="playing-icon">🎵</span>
                <span className="playing-text">
                  {ayahs.find(a => a.id === selectedAyah)?.sura_name_ar} - 
                  آية {ayahs.find(a => a.id === selectedAyah)?.aya_no}
                </span>
              </div>
            </div>
            
            <div className="player-controls">
              <button 
                className="player-btn play-pause-btn"
                onClick={togglePlayPause}
              >
                {isPlaying ? '⏸️' : '▶️'}
              </button>
              
              <button 
                className="player-btn stop-btn"
                onClick={stopAudio}
              >
                ⏹️
              </button>
              
              <button 
                className={`player-btn repeat-btn ${isRepeating ? 'active' : ''}`}
                onClick={() => setIsRepeating(!isRepeating)}
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
                onChange={handleSeek}
                className="progress-slider"
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
                onChange={handleVolumeChange}
                className="volume-slider"
              />
            </div>
          </div>
        </div>
      )}

      {/* قائمة الصفحات المصغرة */}
      <div className="pages-thumbnails">
        <div className="thumbnails-scroll">
          {pages.map((page, index) => (
            <button
              key={page.pageNumber}
              className={`page-thumb ${index === activePageIndex ? 'active' : ''}`}
              onClick={() => goToPage(index)}
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
          >
            <span className="nav-label">التالية</span>
            <span className="nav-icon">⏭</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default FullAyahsView;