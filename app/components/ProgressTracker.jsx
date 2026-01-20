"use client"
import React from 'react';
//import './ProgressTracker.css';

const ProgressTracker = ({ currentAyah, totalAyahs, ayahs }) => {
  const calculateProgress = () => {
    return ((currentAyah / totalAyahs) * 100).toFixed(1);
  };

  const getSurahProgress = () => {
    const surahs = {};
    ayahs.forEach(ayah => {
      if (!surahs[ayah.sura_no]) {
        surahs[ayah.sura_no] = {
          name: ayah.sura_name_ar,
          total: 0,
          completed: 0
        };
      }
      surahs[ayah.sura_no].total++;
      if (ayah.id <= currentAyah) {
        surahs[ayah.sura_no].completed++;
      }
    });
    
    return Object.values(surahs);
  };

  return (
    <div className="progress-tracker">
      <h3>تقدمك في التعلم</h3>
      
      <div className="overall-progress">
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${calculateProgress()}%` }}
          ></div>
        </div>
        <span className="progress-text">
          {calculateProgress()}% ({currentAyah} من {totalAyahs})
        </span>
      </div>
      
      <div className="surah-progress">
        <h4>تقدم السور:</h4>
        {getSurahProgress().map(surah => (
          <div key={surah.name} className="surah-item">
            <span className="surah-name">{surah.name}</span>
            <span className="surah-stats">
              {surah.completed} / {surah.total}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProgressTracker;