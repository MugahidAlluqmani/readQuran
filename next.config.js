// next.config.js
const path = require('path')

const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development' || process.env.VERCEL === '1',
  buildExcludes: [/middleware-manifest.json$/],
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

  // ✅ IMPORTANT: لا تستخدم standalone على Vercel
  output: process.env.VERCEL === '1' ? undefined : 'standalone',
  
  // ❌ إزالة هذا تماماً
  // outputFileTracingRoot: path.join(__dirname, '../'),
}

module.exports = withPWA(nextConfig)