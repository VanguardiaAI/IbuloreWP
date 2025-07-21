import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  basePath: '/panel',
  assetPrefix: '/panel',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ibulore.com',
        port: '',
        pathname: '/wp-content/**',
      },
      {
        protocol: 'https',
        hostname: 'replicate.delivery',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;