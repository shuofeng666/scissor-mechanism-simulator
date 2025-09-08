// Base curves (Arc / Sine). Points are relative to mechanism center.
const CurveGenerator = {
  generateArc(len = 300, k = 1.0) {
    const n = 200;
    const R = Math.max(1, len / Math.PI);
    const s = k;
    const pts = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const th = Math.PI * t;
      const x = (th - Math.PI / 2) * R * 2;
      const y = -Math.sin(th) * R * s;
      pts.push({ x, y });
    }
    return pts;
  },
  generateSine(len = 300, amp = 1.0) {
    const n = 400;
    const A = (len / 6) * amp * 0.5;
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
