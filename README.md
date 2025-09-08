剪刀式机构模拟器
基于 p5.js 的交互式工程力学仿真工具
在线体验
🌐 点击体验
本地运行
bash# 克隆项目
git clone https://github.com/shuofeng666/scissor-mechanism-simulator.git
cd scissor-mechanism-simulator

# 启动服务器（选择一种方式）
python -m http.server 3000
# 或
npm install && npm run dev

# 打开浏览器访问 http://localhost:3000
功能特性

🎯 四种曲线类型：圆弧、正弦波、螺旋、贝塞尔
⚙️ 实时参数调节：段数、杆件长度、曲率强度
📊 可视化显示：关节点、铰链轴心、运动轨迹
🎨 现代化界面：响应式设计，暗色主题
⌨️ 快捷键支持：1-4切换曲线，P/J/C切换显示，R重置

操作说明
基本控制

点击按钮切换曲线类型
拖动滑块调整参数
勾选复选框控制显示元素

快捷键

1-4 切换曲线类型
P 显示/隐藏铰链轴心
J 显示/隐藏关节点
C 显示/隐藏基准曲线
R 重置所有参数