/** @type {import('next').NextConfig} */
const nextConfig = {
  // 确保是静态导出模式（如果需要）
  // output: 'export',
  
  // 确保图片优化配置
  images: {
    unoptimized: true
  },
  
  // 确保严格模式
  reactStrictMode: true,
  
  // 确保 TypeScript 配置
  typescript: {
    ignoreBuildErrors: false
  },
  
  // 确保 ESLint 配置
  eslint: {
    ignoreDuringBuilds: false
  },

  // 确保正确的 trailingSlash 设置
  trailingSlash: false,
  
  // 确保正确的基础路径（如果需要）
  // basePath: '',
  
  // 确保正确的资产前缀（如果需要）
  // assetPrefix: '',
}

module.exports = nextConfig