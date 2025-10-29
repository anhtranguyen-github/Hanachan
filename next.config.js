/** @type {import('next').NextConfig} */
const nextConfig = {

  async redirects() {
    return [
      // Only keeping critical system redirects if any, otherwise clean slate.
      {
        source: '/progress',
        destination: '/dashboard',
        permanent: true,
      }
    ];
  },
  eslint: {
    ignoreDuringBuilds: true,
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

