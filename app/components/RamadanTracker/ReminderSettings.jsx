// components/RamadanTracker/ReminderSettings.jsx
import React, { useState } from 'react';

const ReminderSettings = ({ reminders, onUpdate }) => {
  const [showSettings, setShowSettings] = useState(false);

  const daysInArabic = {
    saturday: 'السبت',
    sunday: 'الأحد',
    monday: 'الإثنين',
    tuesday: 'الثلاثاء',
    wednesday: 'الأربعاء',
    thursday: 'الخميس',
    friday: 'الجمعة'
  };

  const handleToggleDay = (day) => {
    const newDays = reminders.days.includes(day)
      ? reminders.days.filter(d => d !== day)
      : [...reminders.days, day];
    
    onUpdate({
      ...reminders,
      days: newDays
    });
  };

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      alert('المتصفح لا يدعم الإشعارات');
      return;
    }

    if (Notification.permission === 'granted') {
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      onUpdate({
        ...reminders,
        type: 'push'
      });
    }
  };

  return (
    <div className="reminder-settings">
      <div 
        className="reminder-header"
        onClick={() => setShowSettings(!showSettings)}
      >
        <h4>⏰ تذكير بالقراءة</h4>
        <span className={`toggle-icon ${showSettings ? 'open' : ''}`}>▼</span>
      </div>

      {showSettings && (
        <div className="reminder-content">
          <div className="reminder-toggle">
            <label className="switch">
              <input 
                type="checkbox"
                checked={reminders.enabled}
                onChange={(e) => onUpdate({
                  ...reminders,
                  enabled: e.target.checked
                })}
              />
              <span className="slider"></span>
            </label>
            <span className="toggle-label">
              {reminders.enabled ? 'التذكير مفعل' : 'التذكير معطل'}
            </span>
          </div>

          {reminders.enabled && (
            <>
              <div className="reminder-time">
                <label>وقت التذكير:</label>
                <input 
                  type="time"
                  value={reminders.time}
                  onChange={(e) => onUpdate({
                    ...reminders,
                    time: e.target.value
                  })}
                />
              </div>

              <div className="reminder-days">
                <label>أيام التذكير:</label>
                <div className="days-grid">
                  {Object.entries(daysInArabic).map(([key, value]) => (
                    <button
                      key={key}
                      className={`day-btn ${reminders.days.includes(key) ? 'active' : ''}`}
                      onClick={() => handleToggleDay(key)}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </div>

              <div className="reminder-type">
                <label>نوع التذكير:</label>
                <div className="type-buttons">
                  <button 
                    className={`type-btn ${reminders.type === 'push' ? 'active' : ''}`}
                    onClick={() => {
                      requestNotificationPermission();
                      onUpdate({
                        ...reminders,
                        type: 'push'
                      });
                    }}
                  >
                    🔔 إشعار
                  </button>
                  <button 
                    className={`type-btn ${reminders.type === 'sound' ? 'active' : ''}`}
                    onClick={() => onUpdate({
                      ...reminders,
                      type: 'sound'
                    })}
                  >
                    🔊 صوت
                  </button>
                  <button 
                    className={`type-btn ${reminders.type === 'both' ? 'active' : ''}`}
                    onClick={() => onUpdate({
                      ...reminders,
                      type: 'both'
                    })}
                  >
                    🔔🔊 كلاهما
                  </button>
                </div>
              </div>

              <div className="test-reminder">
                <button 
                  className="test-btn"
                  onClick={() => {
                    if (reminders.type.includes('push')) {
                      new Notification('تذكير بقراءة القرآن', {
                        body: 'حان وقت قراءة وردك اليومي 📖',
                        icon: '/icons/192.png'
                      });
                    }
                    if (reminders.type.includes('sound')) {
                      const audio = new Audio('/sounds/reminder.mp3');
                      audio.play();
                    }
                  }}
                >
                  🔔 اختبار التذكير
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ReminderSettings;