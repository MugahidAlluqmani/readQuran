// components/RamadanBadge.jsx
'use client'
import React, { useState, useEffect } from 'react';
import { toHijri, toGregorian } from 'hijri-converter';

const RamadanBadge = ({ onClick }) => {
  const [daysLeft, setDaysLeft] = useState(0);
  const [progress, setProgress] = useState(0);

  const calculateDaysLeft = () => {
    const today = new Date();

    const hijriToday = toHijri(
      today.getFullYear(),
      today.getMonth() + 1,
      today.getDate()
    );

    let targetHijriYear = hijriToday.hy;

    if (hijriToday.hm > 9) {
      targetHijriYear += 1;
    }

    const ramadanEndGregorian = toGregorian(targetHijriYear, 9, 30);

    const ramadanEndDate = new Date(
      ramadanEndGregorian.gy,
      ramadanEndGregorian.gm - 1,
      ramadanEndGregorian.gd
    );

    const diff =
      Math.ceil(
        (ramadanEndDate.getTime() - today.getTime()) /
          (1000 * 60 * 60 * 24)
      );

    return Math.max(0, diff);
  };

  useEffect(() => {
    setDaysLeft(calculateDaysLeft());

    const interval = setInterval(() => {
      setDaysLeft(calculateDaysLeft());
    }, 1000 * 60 * 60 * 24); // تحديث يومي

    try {
      const data = localStorage.getItem('ramadan_default');
      if (data) {
        const { juzProgress } = JSON.parse(data);
        const completed = juzProgress.filter(j => j.completed).length;
        setProgress(Math.round((completed / 30) * 100));
      }
    } catch (error) {
      console.error('Error loading progress:', error);
    }

    return () => clearInterval(interval);
  }, []);

  return (
    <button className="ramadan-badge" onClick={onClick}>
      <div className="badge-icon">🌙</div>
      <div className="badge-info">
        <span className="badge-title">رمضان</span>
        <span className="badge-days">{daysLeft} يوم متبقي</span>
      </div>
      <div className="badge-progress">
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="progress-text">{progress}%</span>
      </div>
    </button>
  );
};

export default RamadanBadge;