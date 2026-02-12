// next.config.js
const path = require('path')
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  // ✅ تفعيل PWA على Vercel
  disable: process.env.NODE_ENV === 'development', // فقط في التطوير
  buildExcludes: [/middleware-manifest.json$/],
  // ✅ مهم لـ Vercel
  fallbacks: {
    document: '/offline',
  },
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {},
  reactStrictMode: true,
  
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

  // ✅ إزالة output تماماً على Vercel
  output: undefined,
}

module.exports = withPWA(nextConfig)