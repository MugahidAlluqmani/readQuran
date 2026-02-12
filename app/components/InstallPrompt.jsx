"use client"
import React, { useState, useEffect } from 'react';
import './InstallPrompt.css';

const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [platform, setPlatform] = useState('web');

  useEffect(() => {
    // التحقق مما إذا كان التطبيق مثبتاً
    if (window.matchMedia('(display-mode: standalone)').matches || 
        window.navigator.standalone === true) {
      setIsInstalled(true);
    }

    // تحديد المنصة
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    if (/android/i.test(userAgent)) {
      setPlatform('android');
    } else if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
      setPlatform('ios');
    }

    // استقبال حدث التثبيت
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    });

    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
      console.log('تم تثبيت التطبيق بنجاح');
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', () => {});
      window.removeEventListener('appinstalled', () => {});
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('وافق المستخدم على التثبيت');
    } else {
      console.log('رفض المستخدم التثبيت');
    }
    
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('installPromptDismissed', 'true');
  };

  const handleIOSInstall = () => {
    alert(
      'لتثبيت التطبيق على جهاز iPhone أو iPad:\n\n' +
      '1. اضغط على زر المشاركة 📤\n' +
      '2. اختر "إضافة إلى الشاشة الرئيسية" ➕\n' +
      '3. اضغط على "إضافة" في الأعلى ✅'
    );
  };

  if (isInstalled || !showPrompt || localStorage.getItem('installPromptDismissed')) {
    return null;
  }

  return (
    <div className="install-prompt">
      <div className="install-prompt-content">
        <button className="close-btn" onClick={handleDismiss}>✕</button>
        
        <div className="install-icon">📱</div>
        
        <h3>ثبّت تطبيق إقرأ القرآن الكريم</h3>
        
        <p className="install-description">
          يمكنك تثبيت التطبيق على جهازك للوصول السريع وقراءة القرآن بدون إنترنت
        </p>
        
        {platform === 'ios' ? (
          <div className="ios-install-instructions">
            <p>📱 لتثبيت التطبيق على iPhone/iPad:</p>
            <ol>
              <li>اضغط على زر المشاركة <span className="ios-icon">📤</span></li>
              <li>اختر "إضافة إلى الشاشة الرئيسية" <span className="ios-icon">➕</span></li>
              <li>اضغط على "إضافة" ✅</li>
            </ol>
            <button className="got-it-btn" onClick={handleDismiss}>
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