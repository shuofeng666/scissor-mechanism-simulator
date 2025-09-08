const express = require('express');
const path = require('path');
const compression = require('compression');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 3000;

// 安全中间件
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "cdn.jsdelivr.net", "cdnjs.cloudflare.com"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", "data:", "https:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
}));

// 启用 gzip 压缩
app.use(compression());

// 静态文件服务
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: '1d', // 缓存静态文件1天
  etag: true
}));

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'Scissor Mechanism Simulator'
  });
});

// API 端点 - 获取项目信息
app.get('/api/info', (req, res) => {
  res.json({
    name: 'Scissor Mechanism Simulator',
    version: '1.0.0',
    description: '优化的剪刀式机构模拟器',
    features: [
      '多种曲线类型（圆弧、正弦波、螺旋、贝塞尔）',
      '实时参数调节',
      '可视化机构状态',
      '性能监控',
      '响应式设计'
    ],
    curves: ['arc', 'sine', 'spiral', 'bezier'],
    maxSegments: 12,
    linkLengthRange: [30, 120]
  });
});

// API 端点 - 计算曲线数据
app.get('/api/curve/:type', (req, res) => {
  const { type } = req.params;
  const { length = 300, curvature = 1.0, segments = 100 } = req.query;
  
  const curveData = generateCurveData(type, 
    parseFloat(length), 
    parseFloat(curvature), 
    parseInt(segments)
  );
  
  res.json({
    type,
    parameters: { length, curvature, segments },
    points: curveData,
    arcLength: calculateArcLength(curveData)
  });
});

// 曲线生成函数
function generateCurveData(type, length, curvature, segments) {
  const points = [];
  
  switch(type) {
    case 'arc':
      const radius = length / (curvature * Math.PI);
      const angle = curvature * Math.PI;
      for(let i = 0; i <= segments; i++) {
        const t = i / segments;
        const a = (t - 0.5) * angle;
        const x = radius * Math.sin(a);
        const y = radius * (Math.cos(a) - 1);
        points.push({ x, y, t });
      }
      break;
      
    case 'sine':
      for(let i = 0; i <= segments; i++) {
        const t = i / segments;
        const x = (t - 0.5) * length;
        const y = curvature * 50 * Math.sin(4 * Math.PI * t);
        points.push({ x, y, t });
      }
      break;
      
    case 'spiral':
      for(let i = 0; i <= segments; i++) {
        const t = i / segments;
        const angle = curvature * 4 * Math.PI * t;
        const r = t * length / 6;
        const x = r * Math.cos(angle);
        const y = r * Math.sin(angle);
        points.push({ x, y, t });
      }
      break;
      
    case 'bezier':
      const p0 = { x: -length/2, y: 0 };
      const p1 = { x: -length/4, y: -curvature*80 };
      const p2 = { x: length/4, y: curvature*80 };
      const p3 = { x: length/2, y: 0 };
      
      for(let i = 0; i <= segments; i++) {
        const t = i / segments;
        const u = 1 - t;
        const x = u*u*u*p0.x + 3*u*u*t*p1.x + 3*u*t*t*p2.x + t*t*t*p3.x;
        const y = u*u*u*p0.y + 3*u*u*t*p1.y + 3*u*t*t*p2.y + t*t*t*p3.y;
        points.push({ x, y, t });
      }
      break;
      
    default:
      return [];
  }
  
  return points;
}

function calculateArcLength(points) {
  let length = 0;
  for(let i = 1; i < points.length; i++) {
    const dx = points[i].x - points[i-1].x;
    const dy = points[i].y - points[i-1].y;
    length += Math.sqrt(dx*dx + dy*dy);
  }
  return length;
}

// 404 处理
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'public/index.html'));
});

// 错误处理
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong!'
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 Scissor Mechanism Simulator Server running on port ${PORT}`);
  console.log(`📱 Local: http://localhost:${PORT}`);
  console.log(`🌐 Health Check: http://localhost:${PORT}/health`);
  console.log(`📊 API Info: http://localhost:${PORT}/api/info`);
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  process.exit(0);
});