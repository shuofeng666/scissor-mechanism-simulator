# 🔧 剪刀式机构模拟器

> 一个基于 p5.js 的交互式工程力学仿真工具

[![Deploy Status](https://github.com/yourusername/scissor-mechanism-simulator/workflows/Deploy%20to%20GitHub%20Pages/badge.svg)](https://github.com/yourusername/scissor-mechanism-simulator/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen.svg)](https://nodejs.org/)

## 🌟 特性

- 🎯 **多种曲线类型**: 圆弧、正弦波、螺旋、贝塞尔曲线
- ⚙️ **实时参数调节**: 段数、杆件长度、曲率强度
- 📊 **可视化状态**: 关节点、铰链轴心、运动轨迹
- 🎨 **现代化界面**: 响应式设计，暗色主题
- 🚀 **高性能渲染**: 基于 p5.js，60fps 流畅动画
- 📱 **跨平台兼容**: 支持桌面和移动设备

## 🎮 在线体验

🌐 **[立即体验](https://yourusername.github.io/scissor-mechanism-simulator)**

## 📸 预览

![剪刀式机构模拟器](https://via.placeholder.com/800x400/0a0a2e/00ffaa?text=Scissor+Mechanism+Simulator)

## 🚀 快速开始

### 前置要求
- Node.js >= 14.0.0
- npm 或 yarn

### 安装和运行

```bash
# 克隆仓库
git clone https://github.com/yourusername/scissor-mechanism-simulator.git
cd scissor-mechanism-simulator

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 访问 http://localhost:3000
```

### 构建和部署

```bash
# 构建优化版本
npm run build

# 部署到 GitHub Pages
npm run deploy
```

## 🎛️ 操作指南

### 基本控制
- **曲线类型**: 点击按钮切换圆弧、正弦波、螺旋、贝塞尔曲线
- **参数调节**: 使用滑块调整段数、杆件长度、曲率强度
- **显示选项**: 切换基准曲线、关节点、铰链轴心、运动轨迹

### 快捷键
- `1-4`: 快速切换曲线类型
- `P`: 切换铰链轴心显示
- `J`: 切换关节点显示  
- `C`: 切换基准曲线显示
- `R`: 重置所有参数

### 界面说明
- **左侧面板**: 参数控制和显示选项
- **右侧面板**: 实时状态信息和完整性检查
- **底部**: 性能监控数据

## 🔧 技术架构

### 前端技术
- **p5.js**: 图形渲染和动画
- **HTML5 Canvas**: 高性能绘图
- **CSS3**: 现代化界面设计
- **Vanilla JavaScript**: 纯原生实现

### 后端支持
- **Express.js**: Web 服务器
- **Compression**: Gzip 压缩
- **Helmet**: 安全中间件
- **RESTful API**: 数据接口

### 部署方案
- **GitHub Pages**: 静态网站托管
- **GitHub Actions**: 自动化部署
- **Vercel/Netlify**: 替代部署选项

## 📊 API 接口

### 获取项目信息
```bash
GET /api/info
```

### 计算曲线数据
```bash
GET /api/curve/:type?length=300&curvature=1.0&segments=100
```

支持的曲线类型: `arc`, `sine`, `spiral`, `bezier`

## 🛠️ 开发指南

### 项目结构
```
src/
├── public/           # 静态文件
│   ├── index.html   # 主页面
│   └── assets/      # 资源文件
├── server.js        # Node.js 服务器
├── scripts/         # 构建脚本
└── docs/           # 文档
```

### 核心类说明

#### `CurveGenerator`
负责生成各种类型的基准曲线
- `generateArc()`: 圆弧曲线
- `generateSine()`: 正弦波曲线
- `generateSpiral()`: 螺旋曲线
- `generateBezier()`: 贝塞尔曲线

#### `ImprovedScissorMechanism`
剪刀式机构的核心计算引擎
- `calculateGeometry()`: 几何计算
- `lineIntersection()`: 交点计算
- `normalAt()`: 法线计算
- `draw()`: 渲染方法

#### `GUI`
用户界面控制器
- `setupSliders()`: 滑块控制
- `setupButtons()`: 按钮事件
- `updateDisplay()`: 界面更新

## 🎯 应用场景

- 📚 **工程教育**: 机械原理教学演示
- 🔬 **科研辅助**: 机构设计验证
- 🎨 **创意设计**: 艺术装置设计
- 🏗️ **工程应用**: 可展开结构设计

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 这个仓库
2. 创建你的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交你的修改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开一个 Pull Request

## 📜 开源协议

本项目基于 [MIT License](LICENSE) 开源协议。



## 🎖️ 致谢

- [p5.js](https://p5js.org/) - 创意编程框架
- [Express.js](https://expressjs.com/) - Web 应用框架
- [GitHub Pages](https://pages.github.com/) - 免费静态网站托管

---

⭐ 如果这个项目对你有帮助，请给个 Star 支持一下！