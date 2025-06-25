/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api-assets.clashofclans.com',
        port: '',
        pathname: '/badges/**',
      },
      {
        protocol: 'https',
        hostname: 'api-assets.clashofclans.com',
        port: '',
        pathname: '/leagues/**',
      },
    ],
  },
};

module.exports = nextConfig;
