/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    'tldraw',
    '@tldraw/editor',
    '@tldraw/state',
    '@tldraw/store',
    '@tldraw/utils',
    '@tldraw/validate',
    '@tldraw/tlschema',
    '@tldraw/state-react',
  ],
  experimental: {
    optimizePackageImports: ['@tldraw/editor'],
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
