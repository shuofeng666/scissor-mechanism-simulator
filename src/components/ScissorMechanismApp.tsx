'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';

// 曲线生成器 - 移植自 curve.js
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

// 完整的剪刀机构类 - 移植自 mechanism.js
class ImprovedScissorMechanism {
  segments: number;
  linkLength: number;
  curvature: number;
  curveLength: number;
  curveType: string;
  centerX: number;
  centerY: number;
  joints: any[];
  links: any[];
  pivots: any[];
  trailPoints: any[];
  baseCurve: any[];
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

  setParams({ segments, linkLength, curvature, curveLength, curveType }: any) {
    if (segments !== undefined) this.segments = segments | 0;
    if (linkLength !== undefined) this.linkLength = +linkLength;
    if (curvature !== undefined) this.curvature = +curvature;
    if (curveLength !== undefined) this.curveLength = +curveLength;
    if (curveType !== undefined) this.curveType = curveType;
    this._dirty = true;
  }

  generateBaseCurve(freeCurve: any = null) {
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

  calculateGeometry(freeCurve: any = null) {
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

      const L = {
        x: this.centerX + cpt.x - n.x * off,
        y: this.centerY + cpt.y - n.y * off,
        side: 'L',
        level: i,
        id: `L${i}`
      };
      const R = {
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
      const P = { x: p.x, y: p.y, segment: i, id: `P${i}`, links: [] };
      this.pivots.push(P);

      const link1 = { start: LB, end: P, type: 'a', id: `${LB.id}-${P.id}` };
      const link2 = { start: P, end: RT, type: 'a', id: `${P.id}-${RT.id}` };
      const link3 = { start: RB, end: P, type: 'b', id: `${RB.id}-${P.id}` };
      const link4 = { start: P, end: LT, type: 'b', id: `${P.id}-${LT.id}` };
      this.links.push(link1, link2, link3, link4);
      (P as any).links.push(link1, link2, link3, link4);
    }

    this.updateTrail();
    this._dirty = false;
  }

  lineIntersection(p1: any, p2: any, p3: any, p4: any) {
    const x1 = p1.x, y1 = p1.y, x2 = p2.x, y2 = p2.y, x3 = p3.x, y3 = p3.y, x4 = p4.x, y4 = p4.y;
    const d = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
    if (Math.abs(d) < 1e-6) return null;
    const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / d;
    return { x: x1 + t * (x2 - x1), y: y1 + t * (y2 - y1) };
  }

  normalAt(idx: number) {
    const a = this.baseCurve[Math.max(0, idx - 1)];
    const b = this.baseCurve[Math.min(this.baseCurve.length - 1, idx + 1)];
    const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy) || 1;
    return { x: -dy / L, y: dx / L };
  }

  updateTrail() {
    const tops = this.joints.filter((j: any) => j.level === this.segments);
    if (tops.length >= 2) {
      const m = { x: (tops[0].x + tops[1].x) / 2, y: (tops[0].y + tops[1].y) / 2, t: Date.now() };
      this.trailPoints.push(m);
      if (this.trailPoints.length > 180) this.trailPoints.shift();
    }
  }

  polylineArcLength() {
    let L = 0;
    for (let i = 1; i < this.baseCurve.length; i++) {
      const a = this.baseCurve[i - 1], b = this.baseCurve[i];
      L += Math.hypot(b.x - a.x, b.y - a.y);
    }
    return L;
  }

  getIntegrity() {
    if (!this.pivots.length) return { level: 'error', text: 'No pivot' };
    if (this.pivots.length < this.segments) return { level: 'warning', text: 'Partial' };
    return { level: 'good', text: 'OK' };
  }

  _translateAll(dx: number, dy: number) {
    for (const j of this.joints) { j.x += dx; j.y += dy; }
    for (const p of this.pivots) { p.x += dx; p.y += dy; }
    this.centerX += dx; this.centerY += dy;
  }

  update(freeCurve: any = null) {
    if (this._dirty) this.calculateGeometry(freeCurve);
  }
}

// SVG 导出功能 - 移植自 exporter.js
const exportLinksToSVG = (mechanism: ImprovedScissorMechanism, config: any) => {
  const {
    linkWidth = 12, holeDia = 4, groupTol = 0.1, spacing = 6,
    px2mm = 1, strokeW = 0.1, kerf = 0, perRow = 8
  } = config;

  const bodyW = Math.max(0.1, linkWidth + kerf);
  const holeD = Math.max(0.1, holeDia + kerf);

  const allLinks = [];
  for (const lk of mechanism.links) {
    if (!(lk.start && lk.end)) continue;
    const Lpx = Math.hypot(lk.end.x - lk.start.x, lk.end.y - lk.start.y);
    const Lmm = Lpx * px2mm;
    allLinks.push({ Lmm });
  }
  if (allLinks.length === 0) return null;

  // 按长度分组
  const groups = new Map();
  const roundTo = (x: number, step: number) => Math.round(x / step) * step;
  for (const item of allLinks) {
    const key = roundTo(item.Lmm, groupTol).toFixed(3);
    if (!groups.has(key)) groups.set(key, { Lmm: +key, count: 0 });
    groups.get(key).count++;
  }
  const keys = Array.from(groups.keys()).sort((a, b) => parseFloat(a) - parseFloat(b));

  const margin = spacing;
  const rowGap = bodyW + spacing;
  let x = margin, y = margin, col = 0, maxRowW = 0;
  const place: any[] = [];

  for (const k of keys) {
    const g = groups.get(k);
    for (let i = 0; i < g.count; i++) {
      place.push({ x, y, Lmm: g.Lmm });
      x += g.Lmm + spacing + bodyW;
      col++; maxRowW = Math.max(maxRowW, x);
      if (col >= perRow) { col = 0; x = margin; y += rowGap + bodyW; }
    }
    if (col !== 0) { col = 0; x = margin; y += rowGap + bodyW; }
  }

  const widthMM = Math.max(maxRowW, perRow * (spacing + bodyW)) + margin;
  const heightMM = y + margin + bodyW;

  const svgParts = [];
  svgParts.push(`<?xml version="1.0" encoding="UTF-8"?>`);
  svgParts.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${widthMM}mm" height="${heightMM}mm" viewBox="0 0 ${widthMM} ${heightMM}" version="1.1">`);
  svgParts.push(`<desc>Scissor links export · linkWidth=${linkWidth}mm hole=${holeDia}mm tol=${groupTol}mm px2mm=${px2mm} kerf=${kerf}</desc>`);
  svgParts.push(`<g fill="none" stroke="#ff0000" stroke-width="${strokeW}" stroke-linecap="round" stroke-linejoin="round">`);

  const capsulePath = (cx: number, cy: number, L: number, W: number) => {
    const r = W / 2;
    const x1 = cx - L / 2, x2 = cx + L / 2, y1 = cy - r, y2 = cy + r;
    return `M ${x1} ${y1} H ${x2} A ${r} ${r} 0 0 1 ${x2} ${y2} H ${x1} A ${r} ${r} 0 0 1 ${x1} ${y1} Z`;
  };

  for (const p of place) {
    const cx = p.x + p.Lmm / 2;
    const cy = p.y + bodyW / 2;
    svgParts.push(`<path d="${capsulePath(cx, cy, p.Lmm, bodyW)}"/>`);
    const r = holeD / 2; const hx1 = cx - p.Lmm / 2, hx2 = cx + p.Lmm / 2, hy = cy;
    svgParts.push(`<circle cx="${hx1}" cy="${hy}" r="${r}"/>`);
    svgParts.push(`<circle cx="${hx2}" cy="${hy}" r="${r}"/>`);
  }
  svgParts.push(`</g></svg>`);
  
  return svgParts.join('\n');
};

// 主要的可视化组件
const InteractiveCanvas = ({ 
  mechanism, 
  showOptions, 
  canvasSize, 
  viewState, 
  setViewState,
  freeCurve,
  setFreeCurve,
  anchor,
  setAnchor,
  anchorMode,
  isDrawing,
  setIsDrawing
}: any) => {
  const canvasRef = useRef<SVGSVGElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [lastMouse, setLastMouse] = useState({ x: 0, y: 0 });
  const [drawingPoints, setDrawingPoints] = useState<any[]>([]);

  // 坐标转换函数
  const modelToScreen = useCallback((mx: number, my: number) => {
    const sx = (mx - (canvasSize.width / 2)) * viewState.scale + (canvasSize.width / 2 + viewState.offsetX);
    const sy = (my - (canvasSize.height / 2)) * viewState.scale + (canvasSize.height / 2 + viewState.offsetY);
    return { x: sx, y: sy };
  }, [viewState, canvasSize]);

  const screenToModel = useCallback((sx: number, sy: number) => {
    const x1 = (sx - (canvasSize.width / 2 + viewState.offsetX)) / viewState.scale + (canvasSize.width / 2);
    const y1 = (sy - (canvasSize.height / 2 + viewState.offsetY)) / viewState.scale + (canvasSize.height / 2);
    return { x: x1, y: y1 };
  }, [viewState, canvasSize]);

  const screenToModelRelative = useCallback((sx: number, sy: number) => {
    const x1 = sx - (canvasSize.width / 2 + viewState.offsetX);
    const y1 = sy - (canvasSize.height / 2 + viewState.offsetY);
    return { x: x1 / viewState.scale, y: y1 / viewState.scale };
  }, [viewState, canvasSize]);

  // 节点拾取
  const pickNodeAt = useCallback((sx: number, sy: number) => {
    const R_pivot = 12, R_joint = 10;
    for (const p of mechanism.pivots) {
      const sp = modelToScreen(p.x, p.y);
      if (Math.hypot(sp.x - sx, sp.y - sy) <= R_pivot)
        return { id: p.id, type: 'pivot', world: { x: sp.x, y: sp.y } };
    }
    for (const j of mechanism.joints) {
      const sp = modelToScreen(j.x, j.y);
      if (Math.hypot(sp.x - sx, sp.y - sy) <= R_joint)
        return { id: j.id, type: 'joint', world: { x: sp.x, y: sp.y } };
    }
    return null;
  }, [mechanism, modelToScreen]);

  // 鼠标事件处理
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (anchorMode) {
      const hit = pickNodeAt(x, y);
      if (hit) {
        setAnchor({ id: hit.id, world: { x: hit.world.x, y: hit.world.y } });
      }
      return;
    }

    if (mechanism.curveType === 'free') {
      setIsDrawing(true);
      const p = screenToModelRelative(x, y);
      setDrawingPoints([p]);
      setIsDragging(false);
    } else {
      setIsDragging(true);
      setLastMouse({ x, y });
    }
  }, [anchorMode, pickNodeAt, setAnchor, mechanism.curveType, screenToModelRelative, setIsDrawing]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (anchorMode) return;

    if (isDrawing && mechanism.curveType === 'free') {
      const p = screenToModelRelative(x, y);
      setDrawingPoints(prev => {
        const last = prev[prev.length - 1];
        if (!last || Math.hypot(p.x - last.x, p.y - last.y) > 1.5) {
          return [...prev, p];
        }
        return prev;
      });
    } else if (isDragging) {
      setViewState((prev: any) => ({
        ...prev,
        offsetX: prev.offsetX + (x - lastMouse.x),
        offsetY: prev.offsetY + (y - lastMouse.y)
      }));
      setLastMouse({ x, y });
    }
  }, [anchorMode, isDrawing, mechanism.curveType, isDragging, lastMouse, screenToModelRelative, setViewState]);

  const handleMouseUp = useCallback(() => {
    if (anchorMode) return;

    if (isDrawing && mechanism.curveType === 'free') {
      setIsDrawing(false);
      if (drawingPoints.length >= 2) {
        // 简化曲线
        const simplified = simplifyRDP(drawingPoints, 2);
        setFreeCurve(simplified);
      }
      setDrawingPoints([]);
    }
    setIsDragging(false);
  }, [anchorMode, isDrawing, mechanism.curveType, drawingPoints, setFreeCurve, setIsDrawing]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const scaleFactor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
    setViewState((prev: any) => ({
      ...prev,
      scale: Math.max(0.2, Math.min(5, prev.scale * scaleFactor))
    }));
  }, [setViewState]);

  // RDP 简化算法
  const simplifyRDP = (points: any[], epsilon: number): any[] => {
    if (points.length < 3) return points.slice();
    const a = points[0], b = points[points.length - 1];
    const A = b.y - a.y, B = a.x - b.x, C = b.x * a.y - a.x * b.y;
    let dmax = -1, idx = -1;
    for (let i = 1; i < points.length - 1; i++) {
      const p = points[i];
      const d = Math.abs(A * p.x + B * p.y + C) / Math.hypot(A, B);
      if (d > dmax) { dmax = d; idx = i; }
    }
    if (dmax > epsilon) {
      const res1 = simplifyRDP(points.slice(0, idx + 1), epsilon);
      const res2 = simplifyRDP(points.slice(idx), epsilon);
      return res1.slice(0, -1).concat(res2);
    } else {
      return [points[0], points[points.length - 1]];
    }
  };

  return (
    <div className="relative">
      <svg
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        className="border border-gray-200 bg-white cursor-grab active:cursor-grabbing"
        style={{
          backgroundImage: 'radial-gradient(circle, #e5e7eb 1px, transparent 1px)',
          backgroundSize: '20px 20px'
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
      >
        <g>
          {/* 基础曲线 */}
          {showOptions.showCurve && mechanism.baseCurve.length > 1 && (
            <path
              d={`M ${mechanism.baseCurve.map((p: any) => 
                `${mechanism.centerX + p.x},${mechanism.centerY + p.y}`
              ).join(' L ')}`}
              stroke="#9ca3af"
              strokeWidth="1"
              strokeDasharray="5,4"
              fill="none"
            />
          )}

          {/* 轨迹 */}
          {showOptions.showTrail && mechanism.trailPoints.length > 1 && (
            <path
              d={`M ${mechanism.trailPoints.map((p: any) => `${p.x},${p.y}`).join(' L ')}`}
              stroke="#6b7280"
              strokeWidth="1"
              fill="none"
            />
          )}

          {/* 连杆 */}
          {mechanism.links.map((link: any, idx: number) => (
            link.start && link.end && (
              <line
                key={idx}
                x1={link.start.x}
                y1={link.start.y}
                x2={link.end.x}
                y2={link.end.y}
                stroke="#111827"
                strokeWidth="2"
                strokeLinecap="round"
              />
            )
          ))}

          {/* 制造预览 */}
          {showOptions.showMfg && (
            <g stroke="#d1d5db" strokeWidth="1" fill="none">
              {mechanism.links.map((link: any, idx: number) => (
                link.start && link.end && (
                  <g key={idx}>
                    <CapsuleShape 
                      start={link.start} 
                      end={link.end} 
                      width={12} 
                    />
                    <circle cx={link.start.x} cy={link.start.y} r="2" />
                    <circle cx={link.end.x} cy={link.end.y} r="2" />
                  </g>
                )
              ))}
            </g>
          )}

          {/* 关节点 */}
          {showOptions.showJoints && mechanism.joints.map((joint: any, idx: number) => (
            <g key={idx}>
              <circle
                cx={joint.x}
                cy={joint.y}
                r="4"
                stroke="#111827"
                strokeWidth="1.5"
                fill="none"
              />
              {showOptions.showLabels && (
                <text
                  x={joint.x + 8}
                  y={joint.y - 8}
                  fontSize="10"
                  fill="#6b7280"
                  fontFamily="monospace"
                >
                  {joint.id}
                </text>
              )}
            </g>
          ))}

          {/* 支点 */}
          {showOptions.showPivots && mechanism.pivots.map((pivot: any, idx: number) => (
            <g key={idx}>
              <circle
                cx={pivot.x}
                cy={pivot.y}
                r="6"
                stroke="#111827"
                strokeWidth="1.5"
                fill="none"
              />
              <line
                x1={pivot.x - 6}
                y1={pivot.y}
                x2={pivot.x + 6}
                y2={pivot.y}
                stroke="#111827"
                strokeWidth="1.5"
              />
              <line
                x1={pivot.x}
                y1={pivot.y - 6}
                x2={pivot.x}
                y2={pivot.y + 6}
                stroke="#111827"
                strokeWidth="1.5"
              />
              {showOptions.showLabels && (
                <text
                  x={pivot.x + 10}
                  y={pivot.y + 10}
                  fontSize="11"
                  fill="#6b7280"
                  fontFamily="monospace"
                >
                  {pivot.id}
                </text>
              )}
            </g>
          ))}

          {/* 绘制中的自由曲线 */}
          {isDrawing && drawingPoints.length > 1 && (
            <path
              d={`M ${drawingPoints.map((p: any) => 
                `${p.x * viewState.scale + (canvasSize.width / 2 + viewState.offsetX)},${p.y * viewState.scale + (canvasSize.height / 2 + viewState.offsetY)}`
              ).join(' L ')}`}
              stroke="#6b7280"
              strokeWidth="1"
              strokeDasharray="4,3"
              fill="none"
            />
          )}

          {/* 锚点高亮 */}
          {anchor?.id && (() => {
            const node = mechanism.pivots.find((p: any) => p.id === anchor.id) || 
                        mechanism.joints.find((j: any) => j.id === anchor.id);
            if (!node) return null;
            const sp = modelToScreen(node.x, node.y);
            return (
              <g key="anchor">
                <circle
                  cx={sp.x}
                  cy={sp.y}
                  r="9"
                  stroke="#2563eb"
                  strokeWidth="2"
                  fill="none"
                />
                <line x1={sp.x - 9} y1={sp.y} x2={sp.x + 9} y2={sp.y} stroke="#2563eb" strokeWidth="2" />
                <line x1={sp.x} y1={sp.y - 9} x2={sp.x} y2={sp.y + 9} stroke="#2563eb" strokeWidth="2" />
              </g>
            );
          })()}
        </g>
      </svg>
      
      {/* 状态显示 */}
      <div className="absolute bottom-4 right-4 bg-black bg-opacity-50 text-white text-xs p-2 rounded space-y-1 font-mono">
        <div>Scale: {(viewState.scale * 100).toFixed(0)}%</div>
        <div>Offset: {viewState.offsetX.toFixed(0)}, {viewState.offsetY.toFixed(0)}</div>
        {mechanism.curveType === 'free' && (
          <div>{isDrawing ? 'Free drawing...' : 'Free: drag to draw'}</div>
        )}
        {anchor?.id && <div>Anchor: {anchor.id}</div>}
      </div>
    </div>
  );
};

// 胶囊形状组件
const CapsuleShape = ({ start, end, width }: any) => {
  const r = width / 2;
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const L = Math.hypot(dx, dy);
  if (L < 1e-6) return null;
  
  const ux = dx / L;
  const uy = dy / L;
  const nx = -uy;
  const ny = ux;
  
  const a1 = { x: start.x + nx * r, y: start.y + ny * r };
  const a2 = { x: end.x + nx * r, y: end.y + ny * r };
  const b1 = { x: end.x - nx * r, y: end.y - ny * r };
  const b2 = { x: start.x - nx * r, y: start.y - ny * r };
  
  return (
    <path
      d={`M ${a1.x} ${a1.y} L ${a2.x} ${a2.y} L ${b1.x} ${b1.y} L ${b2.x} ${b2.y} Z`}
      fill="none"
    />
  );
};

// 完整的主应用
export default function ScissorMechanismApp() {
  const mechanismRef = useRef(new ImprovedScissorMechanism());
  const [canvasSize] = useState({ width: 900, height: 700 });
  
  const [params, setParams] = useState({
    segments: 4,
    linkLength: 60,
    curvature: 1.0,
    curveLength: 300,
    curveType: 'arc'
  });
  
  const [showOptions, setShowOptions] = useState({
    showCurve: true,
    showJoints: true,
    showPivots: true,
    showTrail: false,
    showLabels: true,
    showMfg: true
  });

  const [viewState, setViewState] = useState({
    scale: 1.0,
    offsetX: 0,
    offsetY: 0
  });

  const [freeCurve, setFreeCurve] = useState<any[]>([]);
  const [anchor, setAnchor] = useState<any>({ id: null, world: null });
  const [anchorMode, setAnchorMode] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);

  // 制造参数
  const [mfgParams, setMfgParams] = useState({
    linkWidth: 12,
    holeDia: 4,
    groupTol: 0.1,
    spacing: 6,
    px2mm: 1,
    strokeW: 0.1,
    kerf: 0,
    perRow: 8
  });

  // 更新机构
  useEffect(() => {
    const mechanism = mechanismRef.current;
    mechanism.setCenter(canvasSize.width / 2, canvasSize.height / 2);
    mechanism.setParams(params);
    mechanism.update(freeCurve);
  }, [params, freeCurve, canvasSize]);

  // 重置功能
  const handleReset = useCallback(() => {
    setParams({
      segments: 4,
      linkLength: 60,
      curvature: 1.0,
      curveLength: 300,
      curveType: 'arc'
    });
    setShowOptions({
      showCurve: true,
      showJoints: true,
      showPivots: true,
      showTrail: false,
      showLabels: true,
      showMfg: true
    });
    setViewState({ scale: 1.0, offsetX: 0, offsetY: 0 });
    setFreeCurve([]);
    setAnchor({ id: null, world: null });
    setAnchorMode(false);
  }, []);

  // 随机化功能
  const handleRandomize = useCallback(() => {
    setParams({
      segments: Math.floor(2 + Math.random() * 10),
      linkLength: Math.floor(40 + Math.random() * 80),
      curvature: parseFloat((0.5 + Math.random() * 2.0).toFixed(1)),
      curveLength: Math.floor(200 + Math.random() * 250),
      curveType: ['arc', 'sine', 'free'][Math.floor(Math.random() * 3)]
    });
  }, []);

  // SVG 导出功能
  const handleExportSVG = useCallback(() => {
    const svg = exportLinksToSVG(mechanismRef.current, mfgParams);
    if (!svg) {
      alert('No links to export.');
      return;
    }
    
    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    a.download = `scissor_links_${ts}.svg`;
    a.href = url;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, [mfgParams]);

  const mechanism = mechanismRef.current;
  const integrity = mechanism.getIntegrity();

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* 左侧控制面板 */}
      <div className="w-80 bg-white border-r border-gray-200 p-4 space-y-6 overflow-y-auto">
        <h1 className="text-xl font-bold text-gray-900">Scissor Mechanism</h1>
        
        {/* 曲线类型选择 */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-600">Curve</h3>
          <div className="grid grid-cols-3 gap-2">
            {['arc', 'sine', 'free'].map(type => (
              <button
                key={type}
                onClick={() => setParams(p => ({ ...p, curveType: type }))}
                className={`px-3 py-2 text-sm rounded-md border ${
                  params.curveType === type 
                    ? 'border-gray-900 bg-gray-50' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                {type === 'arc' ? 'Arc' : type === 'sine' ? 'Sine' : 'Free draw'}
              </button>
            ))}
          </div>
        </div>

        {/* 基础参数 */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-600">Basic</h3>
          
          <div>
            <label className="flex justify-between text-sm text-gray-700 mb-1">
              <span>Segments</span>
              <span className="text-gray-900">{params.segments}</span>
            </label>
            <input
              type="range"
              min="2"
              max="12"
              value={params.segments}
              onChange={(e) => setParams(p => ({ ...p, segments: parseInt(e.target.value) }))}
              className="w-full"
            />
          </div>

          <div>
            <label className="flex justify-between text-sm text-gray-700 mb-1">
              <span>Link length (px)</span>
              <span className="text-gray-900">{params.linkLength}</span>
            </label>
            <input
              type="range"
              min="30"
              max="120"
              value={params.linkLength}
              onChange={(e) => setParams(p => ({ ...p, linkLength: parseInt(e.target.value) }))}
              className="w-full"
            />
          </div>
        </div>

        {/* 曲线参数 */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-600">Curve Params</h3>
          
          <div>
            <label className="flex justify-between text-sm text-gray-700 mb-1">
              <span>Curvature</span>
              <span className="text-gray-900">{params.curvature.toFixed(1)}</span>
            </label>
            <input
              type="range"
              min="0.1"
              max="3.0"
              step="0.1"
              value={params.curvature}
              onChange={(e) => setParams(p => ({ ...p, curvature: parseFloat(e.target.value) }))}
              className="w-full"
            />
          </div>

          <div>
            <label className="flex justify-between text-sm text-gray-700 mb-1">
              <span>Curve length (px)</span>
              <span className="text-gray-900">{params.curveLength}</span>
            </label>
            <input
              type="range"
              min="150"
              max="500"
              value={params.curveLength}
              onChange={(e) => setParams(p => ({ ...p, curveLength: parseInt(e.target.value) }))}
              className="w-full"
            />
          </div>
        </div>

        {/* 显示选项 */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-600">Display</h3>
          {Object.entries({
            showCurve: 'Show base curve',
            showJoints: 'Show joints',
            showPivots: 'Show pivots',
            showTrail: 'Show trail',
            showLabels: 'Show labels',
            showMfg: 'Laser-cut preview'
          }).map(([key, label]) => (
            <label key={key} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={showOptions[key as keyof typeof showOptions]}
                onChange={(e) => setShowOptions(o => ({ ...o, [key]: e.target.checked }))}
                className="rounded"
              />
              <span className="text-sm text-gray-700">{label}</span>
            </label>
          ))}
        </div>

        {/* 锚点控制 */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-600">Anchor</h3>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={anchorMode}
              onChange={(e) => setAnchorMode(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-gray-700">Anchor mode (click a pivot/joint)</span>
          </label>
          <button
            onClick={() => {
              setAnchor({ id: null, world: null });
              setAnchorMode(false);
            }}
            className="w-full px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 text-sm rounded-md border border-gray-300"
          >
            Clear anchor
          </button>
          <div className="text-sm text-gray-600">
            Anchored: <span className="text-gray-900">{anchor?.id || 'none'}</span>
          </div>
        </div>

        {/* 制造/导出参数 */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-600">Manufacturing / Export (SVG)</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Link width (mm)</label>
              <input
                type="number"
                value={mfgParams.linkWidth}
                onChange={(e) => setMfgParams(p => ({ ...p, linkWidth: parseFloat(e.target.value) }))}
                step="0.1"
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Hole Ø (mm)</label>
              <input
                type="number"
                value={mfgParams.holeDia}
                onChange={(e) => setMfgParams(p => ({ ...p, holeDia: parseFloat(e.target.value) }))}
                step="0.1"
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Group tol (mm)</label>
              <input
                type="number"
                value={mfgParams.groupTol}
                onChange={(e) => setMfgParams(p => ({ ...p, groupTol: parseFloat(e.target.value) }))}
                step="0.05"
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Spacing (mm)</label>
              <input
                type="number"
                value={mfgParams.spacing}
                onChange={(e) => setMfgParams(p => ({ ...p, spacing: parseFloat(e.target.value) }))}
                step="0.5"
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">px → mm</label>
              <input
                type="number"
                value={mfgParams.px2mm}
                onChange={(e) => setMfgParams(p => ({ ...p, px2mm: parseFloat(e.target.value) }))}
                step="0.01"
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Stroke (mm)</label>
              <input
                type="number"
                value={mfgParams.strokeW}
                onChange={(e) => setMfgParams(p => ({ ...p, strokeW: parseFloat(e.target.value) }))}
                step="0.05"
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Kerf approx (mm)</label>
              <input
                type="number"
                value={mfgParams.kerf}
                onChange={(e) => setMfgParams(p => ({ ...p, kerf: parseFloat(e.target.value) }))}
                step="0.05"
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Per row</label>
              <input
                type="number"
                value={mfgParams.perRow}
                onChange={(e) => setMfgParams(p => ({ ...p, perRow: parseInt(e.target.value) }))}
                min="1"
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
              />
            </div>
          </div>
          <button
            onClick={handleExportSVG}
            className="w-full px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-md"
          >
            Export SVG
          </button>
          <div className="text-xs text-gray-500">
            Export outlines (capsule) + two holes per link. Red stroke, no fill.
          </div>
        </div>

        {/* 控制按钮 */}
        <div className="flex space-x-2">
          <button
            onClick={handleReset}
            className="flex-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 text-sm rounded-md border border-gray-300"
          >
            Reset
          </button>
          <button
            onClick={handleRandomize}
            className="flex-1 px-3 py-2 bg-green-500 hover:bg-green-600 text-white text-sm rounded-md"
          >
            Random
          </button>
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className="flex-1 p-4 space-y-4">
        {/* 顶部状态面板 */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-600">Status</h3>
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Curve:</span>
                  <span className="ml-2 text-gray-900 capitalize">{mechanism.curveType}</span>
                </div>
                <div>
                  <span className="text-gray-600">Segments:</span>
                  <span className="ml-2 text-gray-900">{mechanism.segments}</span>
                </div>
                <div>
                  <span className="text-gray-600">Pivots:</span>
                  <span className="ml-2 text-gray-900">{mechanism.pivots.length}</span>
                </div>
                <div>
                  <span className="text-gray-600">Arc length (px):</span>
                  <span className="ml-2 text-gray-900">{Math.round(mechanism.polylineArcLength())}</span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-gray-600 text-sm">Integrity:</span>
                <span className={`inline-flex items-center space-x-1 text-sm ${
                  integrity.level === 'good' ? 'text-green-600' : 
                  integrity.level === 'warning' ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${
                    integrity.level === 'good' ? 'bg-green-600' : 
                    integrity.level === 'warning' ? 'bg-yellow-600' : 'bg-red-600'
                  }`}></span>
                  <span>{integrity.text}</span>
                </span>
              </div>
            </div>
            <div className="text-xs text-gray-500 text-right">
              <div>Wheel to zoom · Drag to pan</div>
              <div>Free draw: drag on canvas</div>
              <div>Anchor: toggle & click a node</div>
            </div>
          </div>
        </div>

        {/* 机构可视化 */}
        <div className="bg-white rounded-lg p-4">
          <InteractiveCanvas
            mechanism={mechanism}
            showOptions={showOptions}
            canvasSize={canvasSize}
            viewState={viewState}
            setViewState={setViewState}
            freeCurve={freeCurve}
            setFreeCurve={setFreeCurve}
            anchor={anchor}
            setAnchor={setAnchor}
            anchorMode={anchorMode}
            isDrawing={isDrawing}
            setIsDrawing={setIsDrawing}
          />
        </div>
      </div>
    </div>
  );
}