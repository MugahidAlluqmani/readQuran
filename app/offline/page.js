// app/offline/page.js
'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import './offline.css'

export default function OfflinePage() {
  const [lastVisited, setLastVisited] = useState([])

  useEffect(() => {
    // تحميل آخر السور المقروءة من localStorage
    const recent = localStorage.getItem('quran_recent_surahs')
    if (recent) {
      setLastVisited(JSON.parse(recent))
    }
  }, [])

  return (
    <div className="offline-container">
      <div className="offline-header">
        <div className="offline-icon">📖</div>
        <h1>أنت غير متصل بالإنترنت</h1>
        <p>يمكنك قراءة السور التالية من ذاكرة التخزين المؤقت</p>
      </div>

      <div className="offline-surahs">
        <h2>📚 السور المتاحة للقراءة</h2>
        <div className="surahs-grid">
          <Link href="/surah/1" className="surah-card">
            <span className="surah-number">١</span>
            <span className="surah-name">الفاتحة</span>
          </Link>
          <Link href="/surah/18" className="surah-card">
            <span className="surah-number">١٨</span>
            <span className="surah-name">الكهف</span>
          </Link>
          <Link href="/surah/36" className="surah-card">
            <span className="surah-number">٣٦</span>
            <span className="surah-name">يس</span>
          </Link>
          <Link href="/surah/55" className="surah-card">
            <span className="surah-number">٥٥</span>
            <span className="surah-name">الرحمن</span>
          </Link>
          <Link href="/surah/67" className="surah-card">
            <span className="surah-number">٦٧</span>
            <span className="surah-name">الملك</span>
          </Link>
          <Link href="/surah/112" className="surah-card">
            <span className="surah-number">١١٢</span>
            <span className="surah-name">الإخلاص</span>
          </Link>
        </div>
      </div>

      {lastVisited.length > 0 && (
        <div className="recent-surahs">
          <h2>🕒 آخر السور المقروءة</h2>
          <div className="recent-grid">
            {lastVisited.slice(0, 3).map(surah => (
              <Link 
                key={surah.number}
                href={`/surah/${surah.number}`}
                className="recent-card"
              >
                <span className="recent-number">{surah.number}</span>
                <span className="recent-name">{surah.name}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="offline-footer">
        <Link href="/" className="home-btn">
          🔄 محاولة إعادة الاتصال
        </Link>
        <p className="offline-note">
          عندما تعود إلى الاتصال بالإنترنت، ستتوفر جميع السور
        </p>
      </div>
    </div>
  )
}