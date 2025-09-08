'use client';

import React, { useRef, useState, useCallback } from 'react';
import { ImprovedScissorMechanism, Point } from '../lib/ScissorMechanism';
import { ViewState, CanvasSize, ShowOptions, AnchorState, NodePickResult } from '../types';

interface InteractiveCanvasProps {
  mechanism: ImprovedScissorMechanism;
  showOptions: ShowOptions;
  canvasSize: CanvasSize;
  viewState: ViewState;
  setViewState: (state: ViewState | ((prev: ViewState) => ViewState)) => void;
  freeCurve: Point[];
  setFreeCurve: (curve: Point[]) => void;
  anchor: AnchorState;
  setAnchor: (anchor: AnchorState) => void;
  anchorMode: boolean;
  isDrawing: boolean;
  setIsDrawing: (drawing: boolean) => void;
}

// 胶囊形状组件
const CapsuleShape: React.FC<{ start: Point; end: Point; width: number }> = ({ start, end, width }) => {
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

export const InteractiveCanvas: React.FC<InteractiveCanvasProps> = ({
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
}) => {
  const canvasRef = useRef<SVGSVGElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [lastMouse, setLastMouse] = useState({ x: 0, y: 0 });
  const [drawingPoints, setDrawingPoints] = useState<Point[]>([]);

  // 坐标转换函数
  const modelToScreen = useCallback((mx: number, my: number): Point => {
    const sx = (mx - (canvasSize.width / 2)) * viewState.scale + (canvasSize.width / 2 + viewState.offsetX);
    const sy = (my - (canvasSize.height / 2)) * viewState.scale + (canvasSize.height / 2 + viewState.offsetY);
    return { x: sx, y: sy };
  }, [viewState, canvasSize]);

  const screenToModelRelative = useCallback((sx: number, sy: number): Point => {
    const x1 = sx - (canvasSize.width / 2 + viewState.offsetX);
    const y1 = sy - (canvasSize.height / 2 + viewState.offsetY);
    return { x: x1 / viewState.scale, y: y1 / viewState.scale };
  }, [viewState, canvasSize]);

  // 节点拾取
  const pickNodeAt = useCallback((sx: number, sy: number): NodePickResult | null => {
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

  // RDP 简化算法
  const simplifyRDP = useCallback((points: Point[], epsilon: number): Point[] => {
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
  }, []);

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
      setViewState(prev => ({
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
        const simplified = simplifyRDP(drawingPoints, 2);
        setFreeCurve(simplified);
      }
      setDrawingPoints([]);
    }
    setIsDragging(false);
  }, [anchorMode, isDrawing, mechanism.curveType, drawingPoints, setFreeCurve, setIsDrawing, simplifyRDP]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const scaleFactor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
    setViewState(prev => ({
      ...prev,
      scale: Math.max(0.2, Math.min(5, prev.scale * scaleFactor))
    }));
  }, [setViewState]);

  return (
    <div className="relative">
      <svg
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        className="bg-gray-100 cursor-grab active:cursor-grabbing"
        style={{
          backgroundImage: 'radial-gradient(circle, #d1d5db 1px, transparent 1px)',
          backgroundSize: '30px 30px'
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
              d={`M ${mechanism.baseCurve.map(p => 
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
              d={`M ${mechanism.trailPoints.map(p => `${p.x},${p.y}`).join(' L ')}`}
              stroke="#6b7280"
              strokeWidth="1"
              fill="none"
            />
          )}

          {/* 连杆 */}
          {mechanism.links.map((link, idx) => (
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
              {mechanism.links.map((link, idx) => (
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
          {showOptions.showJoints && mechanism.joints.map((joint, idx) => (
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
          {showOptions.showPivots && mechanism.pivots.map((pivot, idx) => (
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
              d={`M ${drawingPoints.map(p => 
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
            const node = mechanism.pivots.find(p => p.id === anchor.id) || 
                        mechanism.joints.find(j => j.id === anchor.id);
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
    </div>
  );
};