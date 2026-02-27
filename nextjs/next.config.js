/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: '.next_clean',
  async redirects() {
    return [];
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
