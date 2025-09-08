const fs = require('fs');
const path = require('path');
const { minify } = require('html-minifier');
const CleanCSS = require('clean-css');
const { minify: terserMinify } = require('terser');

console.log('🔧 开始优化静态资源...\n');

// 配置
const config = {
  input: 'public',
  output: 'public',
  htmlOptions: {
    removeComments: true,
    removeRedundantAttributes: true,
    removeScriptTypeAttributes: true,
    removeStyleLinkTypeAttributes: true,
    sortClassName: true,
    useShortDoctype: true,
    collapseWhitespace: true,
    conservativeCollapse: true,
    preserveLineBreaks: false,
    removeEmptyAttributes: true,
    minifyCSS: true,
    minifyJS: true
  },
  cssOptions: {
    level: 2,
    returnPromise: false
  },
  jsOptions: {
    compress: {
      drop_console: process.env.NODE_ENV === 'production',
      drop_debugger: true,
      pure_funcs: ['console.log', 'console.info', 'console.debug']
    },
    mangle: {
      toplevel: true
    },
    format: {
      comments: false
    }
  }
};

// 辅助函数
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function getFileSize(filePath) {
  const stats = fs.statSync(filePath);
  return (stats.size / 1024).toFixed(2) + ' KB';
}

function logOptimization(originalPath, originalSize, optimizedSize) {
  const savings = ((originalSize - optimizedSize) / originalSize * 100).toFixed(1);
  console.log(`✅ ${path.basename(originalPath)}: ${originalSize} → ${optimizedSize} (节省 ${savings}%)`);
}

// 优化 HTML 文件
async function optimizeHTML() {
  console.log('📄 优化 HTML 文件...');
  
  const htmlFiles = fs.readdirSync(config.input)
    .filter(file => file.endsWith('.html'));
  
  for (const file of htmlFiles) {
    const inputPath = path.join(config.input, file);
    const outputPath = path.join(config.output, file);
    
    const originalSize = fs.statSync(inputPath).size;
    const html = fs.readFileSync(inputPath, 'utf8');
    
    try {
      const minified = minify(html, config.htmlOptions);
      fs.writeFileSync(outputPath, minified);
      
      const optimizedSize = fs.statSync(outputPath).size;
      logOptimization(inputPath, getFileSize(inputPath), getFileSize(outputPath));
    } catch (error) {
      console.error(`❌ 优化 ${file} 失败:`, error.message);
    }
  }
}

// 优化 CSS 文件
async function optimizeCSS() {
  console.log('\n🎨 优化 CSS 文件...');
  
  const cssDir = path.join(config.input, 'assets', 'css');
  if (!fs.existsSync(cssDir)) {
    console.log('⏭️  未找到 CSS 目录，跳过...');
    return;
  }
  
  const cssFiles = fs.readdirSync(cssDir)
    .filter(file => file.endsWith('.css'));
  
  const cleanCSS = new CleanCSS(config.cssOptions);
  
  for (const file of cssFiles) {
    const inputPath = path.join(cssDir, file);
    const outputPath = inputPath; // 原地替换
    
    const css = fs.readFileSync(inputPath, 'utf8');
    
    try {
      const result = cleanCSS.minify(css);
      
      if (result.errors.length > 0) {
        console.error(`❌ CSS 优化错误 ${file}:`, result.errors);
        continue;
      }
      
      fs.writeFileSync(outputPath, result.styles);
      logOptimization(inputPath, getFileSize(inputPath), getFileSize(outputPath));
      
      if (result.warnings.length > 0) {
        console.warn(`⚠️  CSS 优化警告 ${file}:`, result.warnings);
      }
    } catch (error) {
      console.error(`❌ 优化 ${file} 失败:`, error.message);
    }
  }
}

// 优化 JavaScript 文件
async function optimizeJS() {
  console.log('\n📜 优化 JavaScript 文件...');
  
  const jsDir = path.join(config.input, 'assets', 'js');
  if (!fs.existsSync(jsDir)) {
    console.log('⏭️  未找到 JS 目录，跳过...');
    return;
  }
  
  const jsFiles = fs.readdirSync(jsDir)
    .filter(file => file.endsWith('.js') && !file.endsWith('.min.js'));
  
  for (const file of jsFiles) {
    const inputPath = path.join(jsDir, file);
    const outputPath = inputPath; // 原地替换
    
    const js = fs.readFileSync(inputPath, 'utf8');
    
    try {
      const result = await terserMinify(js, config.jsOptions);
      
      if (result.error) {
        console.error(`❌ JS 优化错误 ${file}:`, result.error);
        continue;
      }
      
      fs.writeFileSync(outputPath, result.code);
      logOptimization(inputPath, getFileSize(inputPath), getFileSize(outputPath));
    } catch (error) {
      console.error(`❌ 优化 ${file} 失败:`, error.message);
    }
  }
}

// 生成资源清单
function generateManifest() {
  console.log('\n📋 生成资源清单...');
  
  const manifest = {
    name: "剪刀式机构模拟器",
    short_name: "ScissorSim",
    description: "优化的剪刀式机构模拟器 - 可视化工程力学仿真工具",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0a2e",
    theme_color: "#00ffaa",
    icons: [
      {
        src: "assets/images/icon-192.png",
        sizes: "192x192",
        type: "image/png"
      },
      {
        src: "assets/images/icon-512.png",
        sizes: "512x512",
        type: "image/png"
      }
    ],
    categories: ["education", "utilities", "productivity"],
    lang: "zh-CN"
  };
  
  const manifestPath = path.join(config.output, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log('✅ 生成 manifest.json');
}

// 复制并优化图片
function optimizeImages() {
  console.log('\n🖼️  处理图片资源...');
  
  const imageDir = path.join(config.input, 'assets', 'images');
  ensureDir(imageDir);
  
  // 创建默认图标（简单的 SVG 转换）
  const iconSvg = `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0a0a2e"/>
      <stop offset="100%" style="stop-color:#16213e"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" fill="url(#bg)"/>
  <g stroke="#00ffaa" stroke-width="8" fill="none">
    <path d="M100 200 L200 100 L300 200 L400 100" stroke-width="12"/>
    <path d="M100 300 L200 200 L300 300 L400 200" stroke-width="12"/>
    <path d="M100 400 L200 300 L300 400 L400 300" stroke-width="12"/>
    <circle cx="150" cy="150" r="8" fill="#00ffaa"/>
    <circle cx="250" cy="150" r="8" fill="#00ffaa"/>
    <circle cx="350" cy="150" r="8" fill="#00ffaa"/>
    <circle cx="150" cy="250" r="8" fill="#00ffaa"/>
    <circle cx="250" cy="250" r="8" fill="#00ffaa"/>
    <circle cx="350" cy="250" r="8" fill="#00ffaa"/>
  </g>
  <text x="256" y="450" font-family="Arial" font-size="24" fill="#00ffaa" text-anchor="middle">剪刀机构</text>
</svg>`;
  
  fs.writeFileSync(path.join(imageDir, 'icon.svg'), iconSvg.trim());
  console.log('✅ 生成默认图标');
}

// 生成 Service Worker
function generateServiceWorker() {
  console.log('\n⚙️  生成 Service Worker...');
  
  const swContent = `
// Scissor Mechanism Simulator Service Worker
const CACHE_NAME = 'scissor-sim-v1.0.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/assets/css/style.css',
  '/assets/js/app.js',
  'https://cdn.jsdelivr.net/npm/p5@1.7.0/lib/p5.min.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
`;
  
  const swPath = path.join(config.output, 'sw.js');
  fs.writeFileSync(swPath, swContent.trim());
  console.log('✅ 生成 Service Worker');
}

// 主函数
async function main() {
  try {
    console.log('🚀 剪刀式机构模拟器 - 资源优化工具\n');
    
    // 确保输出目录存在
    ensureDir(config.output);
    ensureDir(path.join(config.output, 'assets', 'css'));
    ensureDir(path.join(config.output, 'assets', 'js'));
    ensureDir(path.join(config.output, 'assets', 'images'));
    
    // 执行优化任务
    await optimizeHTML();
    await optimizeCSS();
    await optimizeJS();
    
    // 生成额外文件
    optimizeImages();
    generateManifest();
    generateServiceWorker();
    
    console.log('\n🎉 优化完成！');
    console.log('\n📊 优化统计:');
    console.log('   - HTML 文件已压缩');
    console.log('   - CSS 文件已优化');
    console.log('   - JavaScript 文件已压缩');
    console.log('   - 生成了 PWA 配置文件');
    console.log('   - 添加了 Service Worker 支持');
    
    console.log('\n🌐 部署建议:');
    console.log('   - 运行 npm run deploy 部署到 GitHub Pages');
    console.log('   - 或使用 vercel/netlify 进行自动部署');
    
  } catch (error) {
    console.error('\n❌ 优化过程中出现错误:', error);
    process.exit(1);
  }
}

// 运行优化
if (require.main === module) {
  main();
}

module.exports = {
  optimizeHTML,
  optimizeCSS,
  optimizeJS,
  generateManifest,
  generateServiceWorker
};