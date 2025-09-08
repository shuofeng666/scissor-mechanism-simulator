# 🔧 剪刀式机构模拟器

> 基于 p5.js 的交互式工程力学仿真工具

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/shuofeng666/scissor-mechanism-simulator)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🌟 特性

- 🎯 **多种曲线类型**: 圆弧、正弦波、螺旋、贝塞尔曲线
- ⚙️ **实时参数调节**: 段数、杆件长度、曲率强度
- 📊 **可视化状态**: 关节点、铰链轴心、运动轨迹
- 🎨 **现代化界面**: 响应式设计，暗色主题
- 🚀 **高性能渲染**: 基于 p5.js，60fps 流畅动画
- 📱 **跨平台兼容**: 支持桌面和移动设备

## 🎮 在线体验

🌐 **[立即体验 →](https://scissor-mechanism-simulator.vercel.app)**

## 📸 预览

![剪刀式机构模拟器](https://via.placeholder.com/800x400/0a0a2e/00ffaa?text=Scissor+Mechanism+Simulator)

## 🚀 本地运行

```bash
# 克隆仓库
git clone https://github.com/shuofeng666/scissor-mechanism-simulator.git
cd scissor-mechanism-simulator

# 安装依赖（可选，仅用于开发）
npm install

# 启动本地服务器
npm run dev
# 或者直接用 Python
python -m http.server 3000
# 或者用 Node.js
npx live-server

# 访问 http://localhost:3000
```

## 📦 部署到 Vercel

### 方法一：一键部署
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/shuofeng666/scissor-mechanism-simulator)

### 方法二：命令行部署
```bash
# 安装 Vercel CLI
npm i -g vercel

# 部署
vercel --prod
```

### 方法三：GitHub 集成
1. Fork 这个仓库
2. 在 [Vercel](https://vercel.com) 注册并连接 GitHub
3. 选择仓库，点击部署
4. 几分钟后获得链接！

## 🎛️ 操作指南

### 基本控制
- **曲线类型**: 点击按钮切换不同曲线
- **参数调节**: 拖动滑块调整各种参数
- **显示选项**: 切换各种可视化元素

### 快捷键
- `1-4`: 快速切换曲线类型
- `P`: 切换铰链轴心显示
- `J`: 切换关节点显示  
- `C`: 切换基准曲线显示
- `R`: 重置所有参数

## 🔧 技术栈

- **p5.js**: 图形渲染和动画
- **HTML5 Canvas**: 高性能绘图
- **CSS3**: 现代化界面设计
- **Vanilla JavaScript**: 纯原生实现

## 🎯 应用场景

- 📚 **工程教育**: 机械原理教学演示
- 🔬 **科研辅助**: 机构设计验证
- 🎨 **创意设计**: 艺术装置设计
- 🏗️ **工程应用**: 可展开结构设计

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 这个仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交修改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📜 开源协议

本项目基于 [MIT License](LICENSE) 开源协议。

## 🙏 致谢

- [p5.js](https://p5js.org/) - 创意编程框架
- [Vercel](https://vercel.com/) - 快速部署平台

---

⭐ 如果这个项目对你有帮助，请给个 Star 支持一下！