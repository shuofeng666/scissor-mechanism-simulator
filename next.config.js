/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  images: {
    unoptimized: true
  },
  
  typescript: {
    ignoreBuildErrors: false
  },
  
  eslint: {
    ignoreDuringBuilds: false
  },

  trailingSlash: false,
  
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    return config;
  },
}

module.exports = nextConfig