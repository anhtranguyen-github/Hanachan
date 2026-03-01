/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  async redirects() {
    return [];
  },
  eslint: {
    // Re-enable ESLint during builds for better security/code quality
    ignoreDuringBuilds: false,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.youtube.com https://s.ytimg.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https://*.supabase.co https://*.wanikani.com https://*.bunpro.jp https://img.youtube.com http://127.0.0.1:54421; font-src 'self' https://fonts.gstatic.com; frame-src 'self' https://www.youtube.com; connect-src 'self' https://*.supabase.co https://api.elevenlabs.io https://api.openai.com http://127.0.0.1:54421 http://127.0.0.1:8765;",
          },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'files.wanikani.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.wanikani.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'bunpro.jp',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
        pathname: '/**',
      }
    ],
  },
}
module.exports = nextConfig
