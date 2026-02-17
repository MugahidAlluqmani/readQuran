// components/RamadanTracker/Statistics.jsx
import React from 'react';

const Statistics = ({ readingHistory, progress, streak, longestStreak }) => {
  // حساب متوسط القراءة اليومية
  const averageDaily = readingHistory.length > 0
    ? Math.round(progress.readPages / readingHistory.length)
    : 0;

  // حساب أفضل يوم
  const bestDay = readingHistory.length > 0
    ? readingHistory.reduce((max, day) => day.pages > max.pages ? day : max, readingHistory[0])
    : null;

  // أيام الأسبوع
  const weekDays = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

  return (
    <div className="statistics">
      <h3>📊 إحصائيات متقدمة</h3>

      <div className="stats-grid">
        <div className="stat-item">
          <span className="stat-label">إجمالي الصفحات</span>
          <span className="stat-value-large">{progress.readPages}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">متوسط يومي</span>
          <span className="stat-value-large">{averageDaily}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">أطول سلسلة</span>
          <span className="stat-value-large">{longestStreak} أيام</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">نسبة الإنجاز</span>
          <span className="stat-value-large">{Math.round(progress.pageProgress)}%</span>
        </div>
      </div>

      {bestDay && (
        <div className="best-day">
          <h4>🏆 أفضل يوم</h4>
          <div className="best-day-info">
            <span className="best-date">
              {new Date(bestDay.date).toLocaleDateString('ar-EG')}
            </span>
            <span className="best-pages">
              {bestDay.pages} صفحة
            </span>
            {bestDay.juz && (
              <span className="best-juz">
                (الجزء {bestDay.juz})
              </span>
            )}
          </div>
        </div>
      )}

      <div className="weekly-summary">
        <h4>📅 ملخص الأسبوع</h4>
        <div className="week-bars">
          {weekDays.map((day, index) => {
            const dayReadings = readingHistory.filter(r => 
              new Date(r.date).getDay() === index
            );
            const totalPages = dayReadings.reduce((sum, r) => sum + r.pages, 0);
            const height = Math.min(100, (totalPages / 50) * 100);

            return (
              <div key={day} className="day-bar-container">
                <div className="day-bar" style={{ height: `${height}px` }}>
                  <span className="bar-value">{totalPages}</span>
                </div>
                <span className="day-label">{day.substring(0, 2)}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="prediction">
        <h4>🔮 توقع الختمة القادمة</h4>
        {averageDaily > 0 ? (
          <div className="prediction-info">
            <p>
              بناءً على متوسط قراءتك ({averageDaily} صفحة/يوم)،
              ستكمل الختمة الحالية في:
            </p>
            <div className="prediction-date">
              {(() => {
                const remainingPages = 604 - progress.readPages;
                const daysNeeded = Math.ceil(remainingPages / averageDaily);
                const targetDate = new Date();
                targetDate.setDate(targetDate.getDate() + daysNeeded);
                return (
                  <>
                    <span className="days">{daysNeeded} أيام</span>
                    <span className="date">
                      ({targetDate.toLocaleDateString('ar-EG')})
                    </span>
                  </>
                );
              })()}
            </div>
          </div>
        ) : (
          <p className="no-data">ابدأ القراءة للحصول على توقعات</p>
        )}
      </div>
    </div>
  );
};

export default Statistics;