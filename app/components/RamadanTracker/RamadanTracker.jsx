// components/RamadanTracker/RamadanTracker.jsx
'use client'
import React, { useState, useEffect, useCallback } from 'react';
import DailyProgress from './DailyProgress';
import JuzProgress from './JuzProgress';
import Statistics from './Statistics';
import ReminderSettings from './ReminderSettings';
import './RamadanTracker.css';

const RamadanTracker = ({ currentSurah, currentAyah, userId = 'default' }) => {
  const [ramadanData, setRamadanData] = useState({
    year: new Date().getFullYear(),
    startDate: null,
    endDate: null,
    totalKhatma: 0,
    targetKhatma: 1,
    dailyGoal: 20, // صفحات
    readingHistory: [],
    juzProgress: Array(30).fill(0).map((_, i) => ({
      juz: i + 1,
      completed: false,
      dateCompleted: null,
      surahs: []
    })),
    currentStreak: 0,
    longestStreak: 0,
    lastReadDate: null,
    reminders: {
      enabled: true,
      time: '20:00',
      type: 'push',
      days: ['saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday']
    }
  });

  const [showTracker, setShowTracker] = useState(false);
  const [todayProgress, setTodayProgress] = useState({
    date: new Date().toDateString(),
    pages: 0,
    juz: [],
    completed: false
  });

  // تحميل بيانات رمضان من localStorage
  useEffect(() => {
    loadRamadanData();
    calculateRamadanDates();
  }, []);

  // حفظ البيانات عند التغيير
  useEffect(() => {
    saveRamadanData();
  }, [ramadanData]);

  const loadRamadanData = () => {
    try {
      const saved = localStorage.getItem(`ramadan_${userId}`);
      if (saved) {
        setRamadanData(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading Ramadan data:', error);
    }
  };

  const saveRamadanData = () => {
    try {
      localStorage.setItem(`ramadan_${userId}`, JSON.stringify(ramadanData));
    } catch (error) {
      console.error('Error saving Ramadan data:', error);
    }
  };

  // حساب تواريخ رمضان
  const calculateRamadanDates = () => {
    const today = new Date();
    const year = today.getFullYear();
    
    // تقريب تاريخ رمضان (هجري)
    const ramadanStart = new Date(year, 2, 23); // تقريبي
    const ramadanEnd = new Date(year, 3, 22); // تقريبي
    
    setRamadanData(prev => ({
      ...prev,
      startDate: ramadanStart.toISOString(),
      endDate: ramadanEnd.toISOString()
    }));
  };

  // إضافة قراءة جديدة
  const addReading = useCallback((pages, juz) => {
    const today = new Date().toDateString();
    
    setTodayProgress(prev => {
      const newPages = prev.pages + pages;
      const newJuz = [...prev.juz];
      if (juz && !newJuz.includes(juz)) {
        newJuz.push(juz);
      }

      return {
        ...prev,
        pages: newPages,
        juz: newJuz,
        completed: newPages >= ramadanData.dailyGoal
      };
    });

    // تحديث تاريخ القراءة
    const today2 = new Date();
    const lastRead = ramadanData.lastReadDate ? new Date(ramadanData.lastReadDate) : null;
    
    // حساب الـ streak
    let newStreak = ramadanData.currentStreak;
    if (lastRead) {
      const diffDays = Math.floor((today2 - lastRead) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        newStreak += 1;
      } else if (diffDays > 1) {
        newStreak = 1;
      }
    } else {
      newStreak = 1;
    }

    setRamadanData(prev => ({
      ...prev,
      readingHistory: [
        ...prev.readingHistory,
        {
          date: today2.toISOString(),
          pages,
          juz
        }
      ],
      currentStreak: newStreak,
      longestStreak: Math.max(newStreak, prev.longestStreak),
      lastReadDate: today2.toISOString()
    }));

    // إذا أكملت جزء
    if (juz) {
      completeJuz(juz);
    }
  }, [ramadanData.dailyGoal]);

  // إكمال جزء
  const completeJuz = (juzNumber) => {
    setRamadanData(prev => {
      const newJuzProgress = [...prev.juzProgress];
      if (!newJuzProgress[juzNumber - 1].completed) {
        newJuzProgress[juzNumber - 1] = {
          ...newJuzProgress[juzNumber - 1],
          completed: true,
          dateCompleted: new Date().toISOString()
        };

        // إذا اكتمل كل الأجزاء
        const completedCount = newJuzProgress.filter(j => j.completed).length;
        if (completedCount === 30) {
          return {
            ...prev,
            totalKhatma: prev.totalKhatma + 1,
            juzProgress: Array(30).fill(0).map((_, i) => ({
              juz: i + 1,
              completed: false,
              dateCompleted: null,
              surahs: []
            }))
          };
        }
      }
      return { ...prev, juzProgress: newJuzProgress };
    });
  };

  // إعادة تعيين اليوم
  const resetToday = () => {
    setTodayProgress({
      date: new Date().toDateString(),
      pages: 0,
      juz: [],
      completed: false
    });
  };

  // تحديث الهدف اليومي
  const updateDailyGoal = (goal) => {
    setRamadanData(prev => ({
      ...prev,
      dailyGoal: goal
    }));
  };

  // تحديث إعدادات التذكير
  const updateReminders = (reminders) => {
    setRamadanData(prev => ({
      ...prev,
      reminders
    }));
  };

  // حساب التقدم الكلي
  const calculateOverallProgress = () => {
    const totalJuz = 30 * (ramadanData.totalKhatma + 1);
    const completedJuz = ramadanData.juzProgress.filter(j => j.completed).length;
    const totalPages = 604; // عدد صفحات المصحف
    const readPages = ramadanData.readingHistory.reduce((sum, r) => sum + r.pages, 0);
    
    return {
      juzProgress: (completedJuz / totalJuz) * 100,
      pageProgress: (readPages / totalPages) * 100,
      completedJuz,
      totalJuz,
      readPages,
      totalPages
    };
  };

  // حساب الأيام المتبقية
  const getRemainingDays = () => {
    if (!ramadanData.endDate) return 0;
    const end = new Date(ramadanData.endDate);
    const today = new Date();
    const diff = Math.ceil((end - today) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  };

  const progress = calculateOverallProgress();
  const remainingDays = getRemainingDays();

  if (!showTracker) {
    return (
      <button 
        className="ramadan-floating-btn"
        onClick={() => setShowTracker(true)}
        title="تتبع ختم القرآن في رمضان"
      >
        <span className="ramadan-icon">🌙</span>
        <span className="ramadan-text">رمضان</span>
        {ramadanData.currentStreak > 0 && (
          <span className="streak-badge">{ramadanData.currentStreak}🔥</span>
        )}
      </button>
    );
  }

  return (
    <div className="ramadan-tracker-overlay" onClick={() => setShowTracker(false)}>
      <div className="ramadan-tracker" onClick={e => e.stopPropagation()}>
        <div className="tracker-header">
          <div className="header-title">
            <h2>🌙 ختم القرآن في رمضان</h2>
            <p className="ramadan-year">{ramadanData.year}</p>
          </div>
          <button className="close-btn" onClick={() => setShowTracker(false)}>✕</button>
        </div>

        {/* الإحصائيات الرئيسية */}
        <div className="main-stats">
          <div className="stat-card">
            <span className="stat-value">{ramadanData.totalKhatma}</span>
            <span className="stat-label">عدد الختمات</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{progress.completedJuz}</span>
            <span className="stat-label">أجزاء مكتملة</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{ramadanData.currentStreak}</span>
            <span className="stat-label">أيام متتالية</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{remainingDays}</span>
            <span className="stat-label">يوم متبقي</span>
          </div>
        </div>

        {/* التقدم اليومي */}
        <DailyProgress
          todayProgress={todayProgress}
          dailyGoal={ramadanData.dailyGoal}
          onAddReading={addReading}
          onReset={resetToday}
          onUpdateGoal={updateDailyGoal}
          currentSurah={currentSurah}
          currentAyah={currentAyah}
        />

        {/* تقدم الأجزاء */}
        <JuzProgress
          juzProgress={ramadanData.juzProgress}
          onJuzClick={completeJuz}
        />

        {/* إحصائيات متقدمة */}
        <Statistics
          readingHistory={ramadanData.readingHistory}
          progress={progress}
          streak={ramadanData.currentStreak}
          longestStreak={ramadanData.longestStreak}
        />

        {/* إعدادات التذكير */}
        <ReminderSettings
          reminders={ramadanData.reminders}
          onUpdate={updateReminders}
        />

        {/* نصائح سريعة */}
        <div className="ramadan-tips">
          <h4>💡 نصائح سريعة</h4>
          <ul>
            <li>اقرأ 20 صفحة يومياً لختم القرآن في 30 يوم</li>
            <li>خصص وقتاً بعد صلاة التراويح للقراءة</li>
            <li>استخدم التذكيرات للمواظبة على القراءة</li>
            <li>شارك تقدمك مع العائلة والأصدقاء</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default RamadanTracker;