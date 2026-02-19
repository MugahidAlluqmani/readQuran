// components/RamadanTracker/RamadanTracker.jsx
'use client'
import React, { useState, useEffect, useCallback } from 'react';
import { toHijri, toGregorian } from 'hijri-converter';
import DailyProgress from './DailyProgress';
import JuzProgress from './JuzProgress';
import Statistics from './Statistics';
import ReminderSettings from './ReminderSettings';
import './RamadanTracker.css';
import { saveData, loadData, cleanOldData } from '../../utils/storage';

const RamadanTracker = ({ currentSurah, currentAyah, userId = 'default' }) => {
  const [ramadanData, setRamadanData] = useState({
    year: new Date().getFullYear(),
    startDate: null,
    endDate: null,
    totalKhatma: 0,
    targetKhatma: 1,
    dailyGoal: 20,
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
    totalPagesRead: 0, // ✅ إضافة المجموع الكلي
    reminders: {
      enabled: true,
      time: '20:00',
      type: 'push',
      days: ['saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday']
    }
  });

  const [todayProgress, setTodayProgress] = useState({
    date: new Date().toDateString(),
    pages: 0,
    juz: [],
    completed: false
  });
  const [showTracker, setShowTracker] = useState(false);
  const [loading, setLoading] = useState(true);
  const storageKey = `ramadan_${userId}`;
  const todayKey = `ramadan_today_${userId}`;

    // تحميل البيانات عند بدء التشغيل
    useEffect(() => {
      const loadStoredData = async () => {
        setLoading(true);
        
        // تنظيف البيانات القديمة
        await cleanOldData();
        
        // تحميل بيانات رمضان
        const savedData = await loadData(storageKey);
        if (savedData) {
          setRamadanData(savedData);
        }
        
        // تحميل تقدم اليوم
        const savedToday = await loadData(todayKey);
        if (savedToday) {
          // التحقق إذا كان التاريخ هو اليوم
          if (savedToday.date === new Date().toDateString()) {
            setTodayProgress(savedToday);
          }
        }
        
        setLoading(false);
      };
      
      loadStoredData();
    }, [userId]);

  // حفظ البيانات عند التغيير
  useEffect(() => {
    if (!loading) {
      const saveTimeout = setTimeout(async () => {
        await saveData(storageKey, ramadanData);
      }, 1000); // تأخير 1 ثانية لمنع الحفظ المتكرر
      
      return () => clearTimeout(saveTimeout);
    }
  }, [ramadanData, loading]);

    // حفظ تقدم اليوم
    useEffect(() => {
      if (!loading) {
        const saveTimeout = setTimeout(async () => {
          await saveData(todayKey, todayProgress);
        }, 1000);
        
        return () => clearTimeout(saveTimeout);
      }
    }, [todayProgress, loading]);

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

    setRamadanData(prev => {
      const today = new Date();
      const lastRead = prev.lastReadDate ? new Date(prev.lastReadDate) : null;
      
      // حساب الـ streak
      let newStreak = prev.currentStreak;
      if (lastRead) {
        const diffDays = Math.floor((today - lastRead) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          newStreak += 1;
        } else if (diffDays > 1) {
          newStreak = 1;
        }
      } else {
        newStreak = 1;
      }

      return {
        ...prev,
        totalPagesRead: prev.totalPagesRead + pages,
        readingHistory: [
          ...prev.readingHistory,
          {
            date: today.toISOString(),
            pages,
            juz
          }
        ],
        currentStreak: newStreak,
        longestStreak: Math.max(newStreak, prev.longestStreak),
        lastReadDate: today.toISOString()
      };
    });

    // إذا أكملت جزء
    if (juz) {
      completeJuz(juz);
    }
  }, [ramadanData.dailyGoal]);

  // إكمال جزء
  const completeJuz = useCallback((juzNumber) => {
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
  }, []);

  // إعادة تعيين اليوم
  const resetToday = useCallback(() => {
    const newToday = {
      date: new Date().toDateString(),
      pages: 0,
      juz: [],
      completed: false
    };
    setTodayProgress(newToday);
    saveData(todayKey, newToday);
  }, []);

  // تحديث الهدف اليومي
  const updateDailyGoal = useCallback((goal) => {
    setRamadanData(prev => ({
      ...prev,
      dailyGoal: goal
    }));
  }, []);

    // تصدير البيانات
    const exportData = useCallback(async () => {
      const data = {
        ramadan: ramadanData,
        today: todayProgress,
        exportDate: new Date().toISOString()
      };
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ramadan-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
    }, [ramadanData, todayProgress]);

      // استيراد البيانات
  const importData = useCallback(async (file) => {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      if (data.ramadan && data.today) {
        setRamadanData(data.ramadan);
        setTodayProgress(data.today);
        await saveData(storageKey, data.ramadan);
        await saveData(todayKey, data.today);
        alert('✅ تم استيراد البيانات بنجاح');
      } else {
        alert('❌ ملف غير صالح');
      }
    } catch (error) {
      console.error('Import error:', error);
      alert('❌ فشل استيراد البيانات');
    }
  }, []);

  
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
  const getRemainingDays = useCallback(() => {
    try {
      const today = new Date();
      
      // الحصول على التاريخ الهجري لليوم
      const hijriToday = toHijri(
        today.getFullYear(),
        today.getMonth() + 1,
        today.getDate()
      );
  
      // تحديد هدف التاريخ (بداية أو نهاية رمضان)
      let targetHijriYear = hijriToday.hy;
      let targetHijriMonth = 9; // رمضان
      let targetHijriDay;
      let isRamadan = false;
      
      // المنطق: إذا كنا في رمضان، نحسب الأيام حتى نهايته
      // وإلا نحسب الأيام حتى بداية رمضان القادم
      if (hijriToday.hm === 9) {
        // نحن في رمضان - نحسب الأيام حتى نهايته
        targetHijriDay = 30; // آخر يوم في رمضان (يمكن تحسينه لمعرفة 29 أو 30)
        isRamadan = true;
      } else if (hijriToday.hm < 9) {
        // قبل رمضان - نحسب الأيام حتى بداية رمضان في نفس السنة
        targetHijriDay = 1;
      } else {
        // بعد رمضان - نحسب الأيام حتى رمضان السنة القادمة
        targetHijriYear += 1;
        targetHijriDay = 1;
      }
  
      // تحويل التاريخ الهجري المستهدف إلى ميلادي
      const targetGregorian = toGregorian(
        targetHijriYear,
        targetHijriMonth,
        targetHijriDay
      );
  
      const targetDate = new Date(
        targetGregorian.gy,
        targetGregorian.gm - 1,
        targetGregorian.gd
      );
  
      // حساب الفرق بالأيام
      const diffTime = targetDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      // إذا كنا في رمضان، نضمن عدم ظهور أيام سلبية
      if (isRamadan) {
        return Math.max(0, diffDays);
      }
      
      // للفترات الأخرى، نضمن أرقام موجبة
      return diffDays > 0 ? diffDays : 0;
  
    } catch (error) {
      console.error('Error calculating remaining days:', error);
      
      // Fallback: حساب تقريبي باستخدام التاريخ الميلادي
      const fallbackEnd = ramadanData?.endDate 
        ? new Date(ramadanData.endDate)
        : new Date(new Date().getFullYear(), 8, 1); // سبتمبر كتقريب
      
      const today = new Date();
      const fallbackDiff = Math.ceil((fallbackEnd - today) / (1000 * 60 * 60 * 24));
      return Math.max(0, fallbackDiff);
    }
  }, [ramadanData]);

  const progress = calculateOverallProgress();
  const remainingDays = getRemainingDays();

  if (loading) {
    return (
      <div className="ramadan-loading">
        <div className="spinner"></div>
        <p>جاري تحميل بيانات رمضان...</p>
      </div>
    );
  }
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
          <span className="streak-badge">{ramadanData.currentStreak}👍🏻</span>
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
          totalPagesRead={ramadanData.totalPagesRead} // ✅ تمرير المجموع الكلي
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
          totalPagesRead={ramadanData.totalPagesRead} // ✅ تمرير نفس القيمة
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
           <li> خطة الختمة الواحدة: اقرأ جزءاً يومياً، مقسماً على الصلوات الخمس (4 صفحات لكل صلاة).</li>
           <li>استغلال الأوقات البينية: اقرأ في أوقات الانتظار، وبعد صلاة التراويح، وقبل السحور.</li>
           <li> التدرج والالتزام: تعوّد على القراءة اليومية لسهولة الختم، ولا تحمل نفسك فوق طاقتها لتجنب النتيجة العكسية.</li>
            <li>الدعاء: الزم دعاء "اللهم أعني على ذكرك وشكرك وحسن عبادتك". </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default RamadanTracker;