/** @type {import('next').NextConfig} */
const nextConfig = {
  // Removed tldraw transpilation - replaced with simple placeholder
  experimental: {
    // Removed optimizePackageImports for @tldraw/editor due to import errors
  },
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      crypto: false,
    };
    return config;
  },
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
      {
        protocol: 'https',
        hostname: 'jejzszvdpemiwmektmek.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      }
    ],
  },
};

module.exports = nextConfig;
