// 生成不同类型的基准曲线（单位：px），返回均匀/稳定的点列
const CurveGenerator = {
  // 圆弧（半圆）
  generateArc(len = 300, k = 1.0) {
    const n = 200;
    const R = Math.max(1, len / Math.PI);
    const s = k; // 纵向拉伸
    const pts = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n;          // 0..1
      const th = Math.PI * t;   // 0..π
      const x = (th - Math.PI / 2) * R * 2; // 居中
      const y = -Math.sin(th) * R * s;
      pts.push({ x, y });
    }
    return pts;
  },

  // 正弦波（一段）
  generateSine(len = 300, amp = 1.0) {
    const n = 400;
    const A = (len / 6) * amp * 0.5; // 振幅相对长度
    const pts = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const x = (t - 0.5) * len;
      const y = -Math.sin(t * 2 * Math.PI) * A;
      pts.push({ x, y });
    }
    return pts;
  }
};
