// 生成不同类型的基准曲线（单位：px），全部返回均匀采样的点列
const CurveGenerator = {
  // 圆弧（默认半圆左右拉伸）
  generateArc(len = 300, k = 1.0) {
    const n = 200;
    const R = Math.max(1, len / (Math.PI * 1.0)); // 半圆半径
    const s = k; // 曲率强度作为竖向比例
    const pts = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n;          // 0..1
      const th = Math.PI * t;   // 0..π
      const x = (th - Math.PI / 2) * R * 2; // 居中
      const y = -Math.sin(th) * R * s;
      pts.push({ x, y });
    }
    return this._resampleByLength(pts, len);
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
  },

  // 螺旋（阿基米德螺线的一段）
  generateSpiral(len = 300, k = 1.0) {
    const n = 500;
    const turns = 1 + k; // 转数随强度
    const a = 3;         // 螺距系数
    const maxTh = 2 * Math.PI * turns;
    const scale = len / (turns * 6); // 粗略缩放到可视范围
    const pts = [];
    for (let i = 0; i <= n; i++) {
      const th = (i / n) * maxTh;
      const r = a * th;
      pts.push({ x: Math.cos(th) * r * scale * 0.5, y: Math.sin(th) * r * scale * 0.5 });
    }
    // 居中后拉直整体朝右
    const dx = pts[pts.length - 1].x - pts[0].x;
    const dy = pts[pts.length - 1].y - pts[0].y;
    const ang = Math.atan2(dy, dx);
    const rot = -ang; // 旋到水平
    const cos = Math.cos(rot), sin = Math.sin(rot);
    const cx = (pts[0].x + pts[pts.length - 1].x) / 2;
    const cy = (pts[0].y + pts[pts.length - 1].y) / 2;
    const out = pts.map(p => {
      const x = p.x - cx, y = p.y - cy;
      return { x: x * cos - y * sin, y: x * sin + y * cos };
    });
    return out;
  },

  // 贝塞尔（固定四点，强度影响中控点）
  generateBezier(len = 300, k = 1.0) {
    const p0 = { x: -len / 2, y: 0 };
    const p3 = { x:  len / 2, y: 0 };
    const h  = (len / 3) * k * 0.6;
    const p1 = { x: -len / 6, y: -h };
    const p2 = { x:  len / 6, y:  h };

    const n = 200, pts = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n, u = 1 - t;
      const x = u*u*u*p0.x + 3*u*u*t*p1.x + 3*u*t*t*p2.x + t*t*t*p3.x;
      const y = u*u*u*p0.y + 3*u*u*t*p1.y + 3*u*t*t*p2.y + t*t*t*p3.y;
      pts.push({ x, y });
    }
    return pts;
  },

  // 以总长粗略重采样（均匀步长）
  _resampleByLength(pts, targetLen = 300, step = 2) {
    if (pts.length < 2) return pts.slice();
    // 累计弧长
    const L = [0];
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1], b = pts[i];
      L[i] = L[i - 1] + Math.hypot(b.x - a.x, b.y - a.y);
    }
    const total = L[L.length - 1];
    const sStep = Math.max(step, total / Math.max(2, Math.floor(targetLen / step)));
    const res = [];
    for (let s = 0; s <= total; s += sStep) {
      // 在 L 中找 s 所在段
      let j = 1;
      while (j < L.length && L[j] < s) j++;
      const t = (s - L[j - 1]) / (L[j] - L[j - 1] || 1);
      const a = pts[j - 1], b = pts[j];
      res.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
    }
    res.push(pts[pts.length - 1]);
    return res;
  }
};
