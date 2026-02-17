import './globals.css'
import InstallPrompt from './components/InstallPrompt'
import RamadanTracker from "./components/RamadanTracker/RamadanTracker"
import { Analytics } from "@vercel/analytics/next"

import { Metadata } from 'next'

export const metadata = {
  title: 'إقرأ القرآن الكريم - المصحف الشريف',
  description: 'تطبيق القرآن الكريم لقراءة وتفسير آيات الذكر الحكيم',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'إقرأ القرآن الكريم',
    startupImage: [
      {
        url: '/splash/launch-640x1136.png',
        media: '(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)'
      },
      {
        url: '/splash/launch-750x1334.png',
        media: '(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)'
      },
      {
        url: '/splash/launch-1242x2208.png',
        media: '(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3)'
      },
      {
        url: '/splash/launch-1125x2436.png',
        media: '(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)'
      },
      {
        url: '/splash/launch-1536x2048.png',
        media: '(min-device-width: 768px) and (max-device-width: 1024px) and (-webkit-min-device-pixel-ratio: 2)'
      }
    ]
  },
  formatDetection: {
    telephone: false,
    date: false,
    address: false,
    email: false
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-touch-fullscreen': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'msapplication-tap-highlight': 'no',
    'msapplication-TileColor': '#4a6491',
    'msapplication-TileImage': '/icons/144.png'
  }
}
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
}
export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/32.png" />
        <link rel="icon" type="image/png" sizes="96x96" href="/icons/87.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/16.png" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/180.png" />
        <meta name="apple-mobile-web-app-title" content="إقرأ القرآن" />
        <meta name="application-name" content="إقرأ القرآن" />
        <meta name="msapplication-starturl" content="/" />
      </head>
      <body>
        {children}
      <InstallPrompt /> {/* ✅ هنا يظهر في كل الصفحات */}
      <RamadanTracker/>
      <Analytics/>
      </body>
    </html>
  )
}