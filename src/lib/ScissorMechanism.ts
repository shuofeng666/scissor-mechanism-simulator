// 曲线生成器
export const CurveGenerator = {
  generateArc(len = 300, k = 1.0): Point[] {
    const n = 200;
    const R = Math.max(1, len / Math.PI);
    const s = k;
    const pts: Point[] = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const th = Math.PI * t;
      const x = (th - Math.PI / 2) * R * 2;
      const y = -Math.sin(th) * R * s;
      pts.push({ x, y });
    }
    return pts;
  },
  
  generateSine(len = 300, amp = 1.0): Point[] {
    const n = 400;
    const A = (len / 6) * amp * 0.5;
    const pts: Point[] = [];
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
  link1: Link;
  link2: Link;
}

export interface Link {
  start: Joint;
  end: Joint;
  pivot: Pivot | null;
  type: 'a' | 'b';
  id: string;
}

export interface TrailPoint extends Point {
  t: number;
}

export interface AnchorInfo {
  id: string;
  originalPos: Point;
  targetPos: Point;
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
  
  private _anchor: AnchorInfo | null = null;

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

  setCenter(x: number, y: number): void {
    this.centerX = x;
    this.centerY = y;
    this._dirty = true;
  }

  setParams(params: {
    segments?: number;
    linkLength?: number;
    curvature?: number;
    curveLength?: number;
    curveType?: string;
  }): void {
    if (params.segments !== undefined) this.segments = Math.floor(params.segments);
    if (params.linkLength !== undefined) this.linkLength = Number(params.linkLength);
    if (params.curvature !== undefined) this.curvature = Number(params.curvature);
    if (params.curveLength !== undefined) this.curveLength = Number(params.curveLength);
    if (params.curveType !== undefined) this.curveType = params.curveType;
    this._dirty = true;
  }

  setAnchor(anchorId: string | null, targetWorldPos: Point | null): void {
    if (!anchorId || !targetWorldPos) {
      this._anchor = null;
      return;
    }

    const pivot = this.pivots.find(p => p.id === anchorId);
    const joint = this.joints.find(j => j.id === anchorId);
    const node = pivot || joint;
    
    if (!node) {
      this._anchor = null;
      return;
    }

    this._anchor = {
      id: anchorId,
      originalPos: { x: node.x, y: node.y },
      targetPos: { x: targetWorldPos.x, y: targetWorldPos.y }
    };

    this._applyAnchorConstraint();
  }

  getAnchor(): AnchorInfo | null {
    return this._anchor;
  }

  private _applyAnchorConstraint(): void {
    if (!this._anchor) return;

    const pivot = this.pivots.find(p => p.id === this._anchor!.id);
    const joint = this.joints.find(j => j.id === this._anchor!.id);
    const anchorNode = pivot || joint;
    
    if (!anchorNode) return;

    const dx = this._anchor.targetPos.x - anchorNode.x;
    const dy = this._anchor.targetPos.y - anchorNode.y;

    this._translateAll(dx, dy);
  }

  generateBaseCurve(freeCurve: Point[] | null = null): Point[] {
    switch (this.curveType) {
      case 'free':
        return (Array.isArray(freeCurve) && freeCurve.length >= 2)
          ? [...freeCurve]
          : CurveGenerator.generateArc(this.curveLength, this.curvature);
      case 'sine':
        return CurveGenerator.generateSine(this.curveLength, this.curvature);
      case 'arc':
      default:
        return CurveGenerator.generateArc(this.curveLength, this.curvature);
    }
  }

  calculateGeometry(freeCurve: Point[] | null = null): void {
    this.joints.length = 0;
    this.links.length = 0;
    this.pivots.length = 0;
    this.baseCurve = this.generateBaseCurve(freeCurve);
    
    if (!this.baseCurve.length) return;

    // 生成关节点
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

    // 生成连杆和支点
    for (let i = 0; i < this.segments; i++) {
      const LB = this.joints[i * 2];
      const RB = this.joints[i * 2 + 1];
      const LT = this.joints[(i + 1) * 2];
      const RT = this.joints[(i + 1) * 2 + 1];
      
      if (!(LB && RB && LT && RT)) continue;

      const pivotPoint = this.lineIntersection(LB, RT, RB, LT);
      if (!pivotPoint) continue;
      
      const P: Pivot = { 
        x: pivotPoint.x, 
        y: pivotPoint.y, 
        segment: i, 
        id: `P${i}`,
        link1: null as any,
        link2: null as any
      };
      
      const link1: Link = { 
        start: LB, 
        end: RT, 
        pivot: P,
        type: 'a', 
        id: `${LB.id}-${RT.id}` 
      };
      
      const link2: Link = { 
        start: RB, 
        end: LT, 
        pivot: P,
        type: 'b', 
        id: `${RB.id}-${LT.id}` 
      };
      
      P.link1 = link1;
      P.link2 = link2;
      
      this.pivots.push(P);
      this.links.push(link1, link2);
    }

    if (this._anchor) {
      this._applyAnchorConstraint();
    }

    this.updateTrail();
    this._dirty = false;
  }

  lineIntersection(p1: Point, p2: Point, p3: Point, p4: Point): Point | null {
    const x1 = p1.x, y1 = p1.y;
    const x2 = p2.x, y2 = p2.y;
    const x3 = p3.x, y3 = p3.y;
    const x4 = p4.x, y4 = p4.y;
    
    const d = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
    if (Math.abs(d) < 1e-6) return null;
    
    const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / d;
    return { 
      x: x1 + t * (x2 - x1), 
      y: y1 + t * (y2 - y1) 
    };
  }

  normalAt(idx: number): Point {
    const a = this.baseCurve[Math.max(0, idx - 1)];
    const b = this.baseCurve[Math.min(this.baseCurve.length - 1, idx + 1)];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const L = Math.hypot(dx, dy) || 1;
    return { x: -dy / L, y: dx / L };
  }

  updateTrail(): void {
    const tops = this.joints.filter(j => j.level === this.segments);
    if (tops.length >= 2) {
      const m: TrailPoint = { 
        x: (tops[0].x + tops[1].x) / 2, 
        y: (tops[0].y + tops[1].y) / 2, 
        t: Date.now() 
      };
      this.trailPoints.push(m);
      if (this.trailPoints.length > 180) {
        this.trailPoints.shift();
      }
    }
  }

  polylineArcLength(): number {
    let L = 0;
    for (let i = 1; i < this.baseCurve.length; i++) {
      const a = this.baseCurve[i - 1];
      const b = this.baseCurve[i];
      L += Math.hypot(b.x - a.x, b.y - a.y);
    }
    return L;
  }

  getIntegrity(): { level: 'error' | 'warning' | 'good'; text: string } {
    if (!this.pivots.length) return { level: 'error', text: 'No pivot' };
    if (this.pivots.length < this.segments) return { level: 'warning', text: 'Partial' };
    
    if (this._anchor) {
      return { level: 'good', text: `Anchored: ${this._anchor.id}` };
    }
    
    return { level: 'good', text: 'OK' };
  }

  _translateAll(dx: number, dy: number) {
    for (const j of this.joints) { j.x += dx; j.y += dy; }
    for (const p of this.pivots) { p.x += dx; p.y += dy; }
    for (const t of this.trailPoints) { t.x += dx; t.y += dy; }
    this.centerX += dx; this.centerY += dy;
  }

  update(freeCurve: Point[] | null = null): void {
    if (this._dirty) {
      this.calculateGeometry(freeCurve);
    }
  }

  toPhysicsGraph(): {
    joints: { id: string; x: number; y: number }[];
    rods: { a: string; b: string }[];
  } {
    const joints = this.joints.map(j => ({ id: j.id, x: j.x, y: j.y }));
    const rods = this.links
      .filter(lk => lk.start && lk.end)
      .map(lk => ({ a: lk.start.id, b: lk.end.id }));
    return { joints, rods };
  }

  applyPhysicsPositions(pos: Record<string, { x: number; y: number }>): void {
    for (const j of this.joints) {
      const p = pos[j.id];
      if (p) { j.x = p.x; j.y = p.y; }
    }
    
    this.pivots.length = 0;
    for (let i = 0; i < this.segments; i++) {
      const LB = this.joints[i * 2];
      const RB = this.joints[i * 2 + 1];
      const LT = this.joints[(i + 1) * 2];
      const RT = this.joints[(i + 1) * 2 + 1];
      if (!(LB && RB && LT && RT)) continue;

      const pv = this.lineIntersection(LB, RT, RB, LT);
      if (!pv) continue;

      const P = { x: pv.x, y: pv.y, segment: i, id: `P${i}`, link1: null as any, link2: null as any };
      const link1 = this.links.find(l => l.id === `${LB.id}-${RT.id}`);
      const link2 = this.links.find(l => l.id === `${RB.id}-${LT.id}`);
      if (link1) link1.pivot = P;
      if (link2) link2.pivot = P;

      this.pivots.push(P as any);
    }
    this.updateTrail();
  }
}