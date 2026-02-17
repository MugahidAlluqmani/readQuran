// components/RamadanTracker/DailyProgress.jsx
import React, { useState } from 'react';

const DailyProgress = ({ 
  todayProgress, 
  dailyGoal, 
  onAddReading, 
  onReset,
  onUpdateGoal,
  currentSurah,
  currentAyah 
}) => {
  const [pagesToAdd, setPagesToAdd] = useState(1);
  const [showGoalInput, setShowGoalInput] = useState(false);
  const [newGoal, setNewGoal] = useState(dailyGoal);

  const handleAddReading = () => {
    if (pagesToAdd > 0) {
      onAddReading(pagesToAdd, null);
    }
  };

  const handleCompleteJuz = () => {
    const juzNumber = Math.floor(currentAyah / 20) + 1; // تقريبي
    onAddReading(20, juzNumber);
  };

  const progressPercent = (todayProgress.pages / dailyGoal) * 100;

  return (
    <div className="daily-progress">
      <div className="section-header">
        <h3>📖 تقدم اليوم</h3>
        <span className="date">{new Date().toLocaleDateString('ar-EG')}</span>
      </div>

      <div className="progress-circle-container">
        <div className="progress-circle">
          <svg viewBox="0 0 100 100">
            <circle className="progress-bg" cx="50" cy="50" r="45" />
            <circle 
              className="progress-fill" 
              cx="50" 
              cy="50" 
              r="45" 
              strokeDasharray={`${2 * Math.PI * 45}`}
              strokeDashoffset={`${2 * Math.PI * 45 * (1 - progressPercent / 100)}`}
            />
            <text x="50" y="50" textAnchor="middle" dominantBaseline="middle">
              {Math.round(progressPercent)}%
            </text>
          </svg>
        </div>
        <div className="progress-stats">
          <span className="pages-read">{todayProgress.pages} / {dailyGoal}</span>
          <span className="pages-label">صفحة</span>
        </div>
      </div>

      <div className="add-reading">
        <div className="pages-input-group">
          <label>اضف عدد الصفحات اللتي تمت قراءتها</label>
          <div className="input-controls">
            <button 
              onClick={() => setPagesToAdd(prev => Math.max(1, prev - 1))}
              className="control-btn"
            >-</button>
            <input 
              type="number" 
              value={pagesToAdd}
              onChange={(e) => setPagesToAdd(parseInt(e.target.value) || 1)}
              min="1"
              max="30"
            />
            <button 
              onClick={() => setPagesToAdd(prev => prev + 1)}
              className="control-btn"
            >+</button>
          </div>
          <button 
            className="add-btn"
            onClick={handleAddReading}
          >
            ➕ إضافة صفحات
          </button>
        </div>

        <div className="quick-actions">
          <button 
            className="quick-btn complete-juz"
            onClick={handleCompleteJuz}
            disabled={!currentSurah}
          >
            📚 أكملت جزء
          </button>
          
          <button 
            className="quick-btn reset-btn"
            onClick={onReset}
          >
            🔄 إعادة تعيين
          </button>

          <button 
            className="quick-btn goal-btn"
            onClick={() => setShowGoalInput(!showGoalInput)}
          >
            🎯 تعديل الهدف
          </button>
        </div>

        {showGoalInput && (
          <div className="goal-input">
            <input 
              type="number"
              value={newGoal}
              onChange={(e) => setNewGoal(parseInt(e.target.value) || 1)}
              min="1"
              max="60"
            />
            <button 
              className="save-goal-btn"
              onClick={() => {
                onUpdateGoal(newGoal);
                setShowGoalInput(false);
              }}
            >
              حفظ
            </button>
          </div>
        )}
      </div>

      {todayProgress.completed && (
        <div className="daily-complete-message">
          🎉 أحسنت! أكملت هدفك اليومي
        </div>
      )}

      {currentSurah && (
        <div className="current-reading">
          <span className="reading-label">آخر قراءة:</span>
          <span className="reading-info">
            {currentSurah} - آية {currentAyah}
          </span>
        </div>
      )}
    </div>
  );
};

export default DailyProgress;