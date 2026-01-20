import React from 'react';
import '../../public/styles/AyahDisplay.css';

const AyahDisplay = ({ ayah, showTranslation, showTajweed, currentIndex, totalAyahs }) => {
  if (!ayah) return null;

  return (
    <div className="ayah-display">
      <div className="ayah-header">
        <div className="surah-info">
          <span className="surah-name">{ayah.sura_name_ar}</span>
          <span className="ayah-number">الآية: {ayah.aya_no}</span>
        </div>
        <div className="page-info">
          <span className="page">الصفحة: {ayah.page}</span>
          <span className="juz">الجزء: {ayah.jozz}</span>
        </div>
      </div>

      <div className="arabic-text">
        <h2>{ayah.aya_text}</h2>
      </div>

      <div className="emlaey-text">
        <p>{ayah.aya_text_emlaey}</p>
      </div>

      {showTranslation && (
        <div className="translation">
          <h3>ترجمة السورة:</h3>
          <p>{ayah.sura_name_en}</p>
        </div>
      )}
    </div>
  );
};

export default AyahDisplay;