// 曲线生成器
export const CurveGenerator = {
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

// 类型定义
export interface Point {
  x: number;
  y: number;
}

export interface Joint extends Point {
  side: 'L' | 'R';
  level: number;
  id: string;
}

export interface Pivot extends Point {
  segment: number;
  id: string;
  links: Link[];
}

export interface Link {
  start: Joint | Pivot;
  end: Joint | Pivot;
  type: 'a' | 'b';
  id: string;
}

export interface TrailPoint extends Point {
  t: number;
}

// 完整的剪刀机构类
export class ImprovedScissorMechanism {
  segments: number;
  linkLength: number;
  curvature: number;
  curveLength: number;
  curveType: string;
  centerX: number;
  centerY: number;
  joints: Joint[];
  links: Link[];
  pivots: Pivot[];
  trailPoints: TrailPoint[];
  baseCurve: Point[];
  _dirty: boolean;

  constructor() {
    this.segments = 4;
    this.linkLength = 60;
    this.curvature = 1.0;
    this.curveLength = 300;
    this.curveType = 'arc';
    this.centerX = 0;
    this.centerY = 0;
    this.joints = [];
    this.links = [];
    this.pivots = [];
    this.trailPoints = [];
    this.baseCurve = [];
    this._dirty = true;
  }

  setCenter(x: number, y: number) {
    this.centerX = x;
    this.centerY = y;
    this._dirty = true;
  }

  setParams({ segments, linkLength, curvature, curveLength, curveType }: {
    segments?: number;
    linkLength?: number;
    curvature?: number;
    curveLength?: number;
    curveType?: string;
  }) {
    if (segments !== undefined) this.segments = segments | 0;
    if (linkLength !== undefined) this.linkLength = +linkLength;
    if (curvature !== undefined) this.curvature = +curvature;
    if (curveLength !== undefined) this.curveLength = +curveLength;
    if (curveType !== undefined) this.curveType = curveType;
    this._dirty = true;
  }

  generateBaseCurve(freeCurve: Point[] | null = null): Point[] {
    switch (this.curveType) {
      case 'free':
        return (Array.isArray(freeCurve) && freeCurve.length >= 2)
          ? freeCurve.slice()
          : CurveGenerator.generateArc(this.curveLength, this.curvature);
      case 'sine':
        return CurveGenerator.generateSine(this.curveLength, this.curvature);
      case 'arc':
      default:
        return CurveGenerator.generateArc(this.curveLength, this.curvature);
    }
  }

  calculateGeometry(freeCurve: Point[] | null = null) {
    this.joints.length = 0;
    this.links.length = 0;
    this.pivots.length = 0;
    this.baseCurve = this.generateBaseCurve(freeCurve);
    if (!this.baseCurve.length) return;

    for (let i = 0; i <= this.segments; i++) {
      const t = i / this.segments;
      const idx = Math.floor(t * (this.baseCurve.length - 1));
      const cpt = this.baseCurve[idx];
      const n = this.normalAt(idx);
      const off = this.linkLength * 0.5;

      const L: Joint = {
        x: this.centerX + cpt.x - n.x * off,
        y: this.centerY + cpt.y - n.y * off,
        side: 'L',
        level: i,
        id: `L${i}`
      };
      const R: Joint = {
        x: this.centerX + cpt.x + n.x * off,
        y: this.centerY + cpt.y + n.y * off,
        side: 'R',
        level: i,
        id: `R${i}`
      };
      this.joints.push(L, R);
    }

    for (let i = 0; i < this.segments; i++) {
      const LB = this.joints[i * 2], RB = this.joints[i * 2 + 1];
      const LT = this.joints[(i + 1) * 2], RT = this.joints[(i + 1) * 2 + 1];
      if (!(LB && RB && LT && RT)) continue;

      const p = this.lineIntersection(LB, RT, RB, LT);
      if (!p) continue;
      
      const P: Pivot = { x: p.x, y: p.y, segment: i, id: `P${i}`, links: [] };
      this.pivots.push(P);

      const link1: Link = { start: LB, end: P, type: 'a', id: `${LB.id}-${P.id}` };
      const link2: Link = { start: P, end: RT, type: 'a', id: `${P.id}-${RT.id}` };
      const link3: Link = { start: RB, end: P, type: 'b', id: `${RB.id}-${P.id}` };
      const link4: Link = { start: P, end: LT, type: 'b', id: `${P.id}-${LT.id}` };
      
      this.links.push(link1, link2, link3, link4);
      P.links.push(link1, link2, link3, link4);
    }

    this.updateTrail();
    this._dirty = false;
  }

  lineIntersection(p1: Point, p2: Point, p3: Point, p4: Point): Point | null {
    const x1 = p1.x, y1 = p1.y, x2 = p2.x, y2 = p2.y, x3 = p3.x, y3 = p3.y, x4 = p4.x, y4 = p4.y;
    const d = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
    if (Math.abs(d) < 1e-6) return null;
    const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / d;
    return { x: x1 + t * (x2 - x1), y: y1 + t * (y2 - y1) };
  }

  normalAt(idx: number): Point {
    const a = this.baseCurve[Math.max(0, idx - 1)];
    const b = this.baseCurve[Math.min(this.baseCurve.length - 1, idx + 1)];
    const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy) || 1;
    return { x: -dy / L, y: dx / L };
  }

  updateTrail() {
    const tops = this.joints.filter(j => j.level === this.segments);
    if (tops.length >= 2) {
      const m: TrailPoint = { 
        x: (tops[0].x + tops[1].x) / 2, 
        y: (tops[0].y + tops[1].y) / 2, 
        t: Date.now() 
      };
      this.trailPoints.push(m);
      if (this.trailPoints.length > 180) this.trailPoints.shift();
    }
  }

  polylineArcLength(): number {
    let L = 0;
    for (let i = 1; i < this.baseCurve.length; i++) {
      const a = this.baseCurve[i - 1], b = this.baseCurve[i];
      L += Math.hypot(b.x - a.x, b.y - a.y);
    }
    return L;
  }

  getIntegrity(): { level: 'error' | 'warning' | 'good'; text: string } {
    if (!this.pivots.length) return { level: 'error', text: 'No pivot' };
    if (this.pivots.length < this.segments) return { level: 'warning', text: 'Partial' };
    return { level: 'good', text: 'OK' };
  }

  _translateAll(dx: number, dy: number) {
    for (const j of this.joints) { j.x += dx; j.y += dy; }
    for (const p of this.pivots) { p.x += dx; p.y += dy; }
    this.centerX += dx; this.centerY += dy;
  }

  update(freeCurve: Point[] | null = null) {
    if (this._dirty) this.calculateGeometry(freeCurve);
  }
}