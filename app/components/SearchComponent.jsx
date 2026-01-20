"use client"
import React, { useState, useEffect } from 'react';
//import './SearchComponent.css';

const SearchComponent = ({ ayahs, onSelectRange, onJumpToAyah }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState('surah'); // 'surah', 'word', 'juz'
  const [searchResults, setSearchResults] = useState([]);
  const [selectedSurah, setSelectedSurah] = useState(null);
  const [surahList, setSurahList] = useState([]);
  const [fromAyah, setFromAyah] = useState(1);
  const [toAyah, setToAyah] = useState(1);
  const [surahAyahs, setSurahAyahs] = useState([]);

  // استخراج قائمة السور الفريدة
  useEffect(() => {
    if (ayahs && ayahs.length > 0) {
      const uniqueSurahs = [];
      const seen = new Set();
      
      ayahs.forEach(ayah => {
        if (!seen.has(ayah.sura_no)) {
          seen.add(ayah.sura_no);
          uniqueSurahs.push({
            id: ayah.sura_no,
            name_ar: ayah.sura_name_ar,
            name_en: ayah.sura_name_en,
            totalAyahs: 0
          });
        }
      });
      
      // حساب عدد آيات كل سورة
      uniqueSurahs.forEach(surah => {
        const surahAyahs = ayahs.filter(a => a.sura_no === surah.id);
        surah.totalAyahs = Math.max(...surahAyahs.map(a => a.aya_no));
      });
      
      setSurahList(uniqueSurahs.sort((a, b) => a.id - b.id));
    }
  }, [ayahs]);

  // البحث
  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    let results = [];
    
    switch(searchType) {
      case 'surah':
        results = surahList.filter(surah => 
          surah.name_ar.includes(searchTerm) || 
          surah.name_en.toLowerCase().includes(searchTerm.toLowerCase())
        );
        break;
        
      case 'word':
        results = ayahs.filter(ayah =>
          ayah.aya_text_emlaey.includes(searchTerm) ||
          ayah.aya_text.includes(searchTerm)
        ).slice(0, 50); // تحديد النتائج
        break;
        
      case 'juz':
        results = ayahs.filter(ayah => 
          ayah.jozz.toString() === searchTerm
        );
        // تجميع حسب السور
        const juzSurahs = [...new Set(results.map(r => r.sura_no))];
        results = juzSurahs.map(surahId => {
          const surahAyahs = results.filter(r => r.sura_no === surahId);
          return {
            sura_no: surahId,
            sura_name_ar: surahAyahs[0]?.sura_name_ar,
            ayahs: surahAyahs
          };
        });
        break;
        
      default:
        break;
    }
    
    setSearchResults(results);
  }, [searchTerm, searchType, ayahs, surahList]);

  // عند اختيار سورة
  const handleSelectSurah = (surah) => {
    setSelectedSurah(surah);
    setSearchTerm('');
    setSearchResults([]);
    
    // استخراج آيات السورة المحددة
    const filteredAyahs = ayahs.filter(a => a.sura_no === surah.id);
    setSurahAyahs(filteredAyahs);
    
    // تعيين القيم الافتراضية للنطاق
    setFromAyah(1);
    setToAyah(surah.totalAyahs || 1);
  };

  // تطبيق النطاق المحدد
  const handleApplyRange = () => {
    if (!selectedSurah) return;
    
    const startAyah = ayahs.find(a => 
      a.sura_no === selectedSurah.id && a.aya_no === parseInt(fromAyah)
    );
    
    const endAyah = ayahs.find(a => 
      a.sura_no === selectedSurah.id && a.aya_no === parseInt(toAyah)
    );
    
    if (startAyah && endAyah) {
      onSelectRange({
        surah: selectedSurah,
        from: parseInt(fromAyah),
        to: parseInt(toAyah),
        startAyahId: startAyah.id,
        endAyahId: endAyah.id
      });
      
      // الانتقال للآية الأولى في النطاق
      onJumpToAyah(startAyah.id - 1);
    }
  };

  // الانتقال لآية محددة مباشرة
  const handleJumpToAyah = (ayahId) => {
    onJumpToAyah(ayahId - 1);
    setSearchTerm('');
    setSearchResults([]);
  };

  // ملء قائمة آيات السورة
  const getAyahOptions = () => {
    if (!selectedSurah) return [];
    
    const options = [];
    for (let i = 1; i <= selectedSurah.totalAyahs; i++) {
      options.push(i);
    }
    return options;
  };

  return (
    <div className="search-component">
      <div className="search-header">
        <h3>🔍 البحث والتحديد</h3>
      </div>

      <div className="search-controls">
        <div className="search-type-selector">
          <label>نوع البحث:</label>
          <select 
            value={searchType} 
            onChange={(e) => setSearchType(e.target.value)}
          >
            <option value="surah">بحث عن سورة</option>
            <option value="word">بحث بكلمة</option>
            <option value="juz">بحث بالجزء</option>
          </select>
        </div>

        <div className="search-input-container">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={
              searchType === 'surah' ? "ابحث باسم السورة..." :
              searchType === 'word' ? "ابحث بكلمة في الآيات..." :
              "أدخل رقم الجزء (1-30)..."
            }
            className="search-input"
          />
          {searchTerm && (
            <button 
              className="clear-search"
              onClick={() => setSearchTerm('')}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* عرض نتائج البحث */}
      {searchResults.length > 0 && (
        <div className="search-results">
          <h4>نتائج البحث ({searchResults.length})</h4>
          <div className="results-list">
            {searchType === 'surah' ? (
              searchResults.map(surah => (
                <div 
                  key={surah.id}
                  className="result-item surah-result"
                  onClick={() => handleSelectSurah(surah)}
                >
                  <span className="surah-number">{surah.id}.</span>
                  <span className="surah-name-ar">{surah.name_ar}</span>
                  <span className="surah-name-en">({surah.name_en})</span>
                  <span className="ayah-count">{surah.totalAyahs} آية</span>
                </div>
              ))
            ) : searchType === 'word' ? (
              searchResults.map(ayah => (
                <div 
                  key={ayah.id}
                  className="result-item word-result"
                  onClick={() => handleJumpToAyah(ayah.id)}
                >
                  <div className="ayah-context">
                    <span className="surah-name">{ayah.sura_name_ar}</span>
                    <span className="ayah-number">آية {ayah.aya_no}</span>
                  </div>
                  <div className="ayah-text-preview">
                    {ayah.aya_text_emlaey.length > 50 
                      ? `${ayah.aya_text_emlaey.substring(0, 50)}...`
                      : ayah.aya_text_emlaey
                    }
                  </div>
                  <div className="highlighted-term">
                    الكلمة: <strong>{searchTerm}</strong>
                  </div>
                </div>
              ))
            ) : searchType === 'juz' ? (
              searchResults.map(group => (
                <div key={group.sura_no} className="result-item juz-result">
                  <div className="juz-surah-header">
                    <span className="surah-name">{group.sura_name_ar}</span>
                    <span className="ayahs-count">{group.ayahs.length} آية</span>
                  </div>
                  <div className="juz-ayahs-preview">
                    من آية {Math.min(...group.ayahs.map(a => a.aya_no))}
                    {' '}إلى آية {Math.max(...group.ayahs.map(a => a.aya_no))}
                  </div>
                  <button 
                    className="view-juz-btn"
                    onClick={() => {
                      handleSelectSurah({
                        id: group.sura_no,
                        name_ar: group.sura_name_ar,
                        totalAyahs: Math.max(...group.ayahs.map(a => a.aya_no))
                      });
                    }}
                  >
                    تحديد نطاق
                  </button>
                </div>
              ))
            ) : null}
          </div>
        </div>
      )}

      {/* قسم تحديد النطاق */}
      {selectedSurah && (
        <div className="range-selector">
          <div className="selected-surah-info">
            <h4>تحديد نطاق الآيات في سورة {selectedSurah.name_ar}</h4>
            <p>السورة تحتوي على {selectedSurah.totalAyahs} آية</p>
          </div>

          <div className="range-controls">
            <div className="range-input-group">
              <label>من آية:</label>
              <select 
                value={fromAyah}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  setFromAyah(value);
                  if (value > toAyah) {
                    setToAyah(value);
                  }
                }}
              >
                {getAyahOptions().map(num => (
                  <option key={`from-${num}`} value={num}>
                    {num}
                  </option>
                ))}
              </select>
            </div>

            <div className="range-input-group">
              <label>إلى آية:</label>
              <select 
                value={toAyah}
                onChange={(e) => setToAyah(parseInt(e.target.value))}
                disabled={fromAyah === selectedSurah.totalAyahs}
              >
                {getAyahOptions()
                  .filter(num => num >= fromAyah)
                  .map(num => (
                    <option key={`to-${num}`} value={num}>
                      {num}
                    </option>
                  ))}
              </select>
            </div>

            <div className="range-info">
              <p>عدد الآيات المحددة: {toAyah - fromAyah + 1} آية</p>
            </div>

            <div className="range-actions">
              <button 
                className="apply-range-btn"
                onClick={handleApplyRange}
                disabled={fromAyah > toAyah}
              >
                تطبيق النطاق المحدد
              </button>
              
              <button 
                className="clear-range-btn"
                onClick={() => setSelectedSurah(null)}
              >
                اختيار سورة أخرى
              </button>
            </div>
          </div>

          {/* معاينة الآيات */}
          <div className="ayahs-preview">
            <h5>معاينة الآيات المحددة:</h5>
            <div className="preview-list">
              {surahAyahs
                .filter(a => a.aya_no >= fromAyah && a.aya_no <= toAyah)
                .slice(0, 5) // عرض أول 5 آيات فقط للمعاينة
                .map(ayah => (
                  <div key={ayah.id} className="preview-item">
                    <span className="preview-ayah-num">آية {ayah.aya_no}:</span>
                    <span className="preview-ayah-text">
                      {ayah.aya_text_emlaey.length > 60
                        ? `${ayah.aya_text_emlaey.substring(0, 60)}...`
                        : ayah.aya_text_emlaey
                      }
                    </span>
                    <button 
                      className="jump-to-ayah-btn"
                      onClick={() => handleJumpToAyah(ayah.id)}
                    >
                      ↪
                    </button>
                  </div>
                ))}
              
              {toAyah - fromAyah + 1 > 5 && (
                <div className="more-ayahs">
                  + {(toAyah - fromAyah + 1) - 5} آية أخرى...
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* اختيار سورة سريع */}
      {!selectedSurah && (
        <div className="quick-surah-selector">
          <h4>اختيار سريع للسور</h4>
          <div className="quick-surah-list">
            {surahList.slice(0, 10).map(surah => (
              <button
                key={surah.id}
                className="quick-surah-btn"
                onClick={() => handleSelectSurah(surah)}
              >
                <span className="quick-surah-num">{surah.id}.</span>
                <span className="quick-surah-name">{surah.name_ar}</span>
              </button>
            ))}
          </div>
          <details className="all-surahs-details">
            <summary>عرض جميع السور ({surahList.length})</summary>
            <div className="all-surahs-grid">
              {surahList.map(surah => (
                <button
                  key={surah.id}
                  className="surah-grid-btn"
                  onClick={() => handleSelectSurah(surah)}
                >
                  <div className="surah-grid-num">{surah.id}</div>
                  <div className="surah-grid-name">{surah.name_ar}</div>
                  <div className="surah-grid-count">{surah.totalAyahs} آية</div>
                </button>
              ))}
            </div>
          </details>
        </div>
      )}
    </div>
  );
};

export default SearchComponent;