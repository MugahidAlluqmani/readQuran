// next.config.js
const path = require('path')

// ✅ إعدادات PWA منفصلة تماماً
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  buildExcludes: [/middleware-manifest.json$/],
  // ✅ لا تضع أي خيارات إضافية هنا
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  // ✅ Turbopack
  turbopack: {},
  
  // ✅ إعدادات Next.js النقية
  reactStrictMode: true, // ✅ هنا فقط، ليس داخل withPWA
  
  // ✅ إعدادات الصور الحديثة
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.islamic.network',
        port: '',
        pathname: '/**',
      },
    ],
  },

  // ✅ للإنتاج - علق هذا السطر إذا أردت استخدام npm run start
  // output: 'standalone',

  // ✅ لمشروعك في مجلد فرعي
  outputFileTracingRoot: path.join(__dirname, '../'),
}

module.exports = withPWA(nextConfig)