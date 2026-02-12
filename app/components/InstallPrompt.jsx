// components/InstallPrompt.jsx
'use client'
import React, { useState, useEffect } from 'react';
import './InstallPrompt.css';

const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [platform, setPlatform] = useState('web');
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // ✅ التحقق من التثبيت
    if (window.matchMedia('(display-mode: standalone)').matches || 
        window.navigator.standalone === true) {
      setIsInstalled(true);
      return;
    }

    // ✅ التحقق من نظام التشغيل
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    
    if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
      setIsIOS(true);
      setPlatform('ios');
    }

    // ✅ التحقق من دعم beforeinstallprompt
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(() => {
        console.log('✅ Service Worker ready');
      });
    }

    // ✅ حدث التثبيت
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      // ✅ لا تظهر على iOS أو إذا كان مثبتاً مسبقاً
      if (!isIOS && !isInstalled) {
        setShowPrompt(true);
      }
    });

    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
      console.log('✅ App installed successfully');
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', () => {});
      window.removeEventListener('appinstalled', () => {});
    };
  }, [isIOS, isInstalled]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // ✅ إذا لم يكن هناك حدث تثبيت، اعرض تعليمات iOS
      if (isIOS) {
        alert(
          'لتثبيت التطبيق على جهاز iPhone أو iPad:\n\n' +
          '1. اضغط على زر المشاركة 📤\n' +
          '2. اختر "إضافة إلى الشاشة الرئيسية" ➕\n' +
          '3. اضغط على "إضافة" في الأعلى ✅'
        );
      }
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('✅ User accepted the install prompt');
    } else {
      console.log('❌ User dismissed the install prompt');
    }
    
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('installPromptDismissed', Date.now().toString());
  };

  // ✅ لا تظهر إذا كان مثبتاً أو إذا تم الرفض سابقاً
  if (isInstalled || !showPrompt) {
    return null;
  }

  // ✅ التحقق من آخر رفض (30 يوم)
  const lastDismissed = localStorage.getItem('installPromptDismissed');
  if (lastDismissed) {
    const daysSinceDismissed = (Date.now() - parseInt(lastDismissed)) / (1000 * 60 * 60 * 24);
    if (daysSinceDismissed < 30) {
      return null;
    }
  }

  return (
    <div className="install-prompt">
      <div className="install-prompt-content">
        <button className="close-btn" onClick={handleDismiss}>✕</button>
        
        <div className="install-icon">📱</div>
        
        <h3>ثبّت تطبيق القرآن الكريم</h3>
        
        <p className="install-description">
          يمكنك تثبيت التطبيق على جهازك للوصول السريع وقراءة القرآن بدون إنترنت
        </p>
        
        {isIOS ? (
          <div className="ios-install-instructions">
            <p>📱 لتثبيت التطبيق على iPhone/iPad:</p>
            <ol>
              <li>اضغط على زر المشاركة <span className="ios-icon">📤</span></li>
              <li>اختر "إضافة إلى الشاشة الرئيسية" <span className="ios-icon">➕</span></li>
              <li>اضغط على "إضافة" ✅</li>
            </ol>
            <button className="got-it-btn" onClick={handleInstallClick}>
              فهمت ✓
            </button>
          </div>
        ) : (
          <div className="install-actions">
            <button className="install-btn" onClick={handleInstallClick}>
              📲 تثبيت التطبيق
            </button>
            <button className="later-btn" onClick={handleDismiss}>
              لاحقاً
            </button>
          </div>
        )}
        
        <div className="install-features">
          <div className="feature">
            <span className="feature-icon">⚡</span>
            <span>وصول سريع</span>
          </div>
          <div className="feature">
            <span className="feature-icon">📶</span>
            <span>قراءة بدون إنترنت</span>
          </div>
          <div className="feature">
            <span className="feature-icon">🔔</span>
            <span>تذكير بالقراءة</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstallPrompt;