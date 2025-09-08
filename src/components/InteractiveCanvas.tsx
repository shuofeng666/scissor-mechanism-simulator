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
  const [isPanning, setIsPanning] = useState(false);
  const [lastMouse, setLastMouse] = useState({ x: 0, y: 0 });
  const [drawingPoints, setDrawingPoints] = useState<Point[]>([]);

  // 修正的坐标转换函数 - 这些函数现在会正确处理缩放
  const modelToScreen = useCallback((mx: number, my: number): Point => {
    // 将模型坐标转换为屏幕坐标，考虑缩放和偏移
    const sx = (mx + viewState.offsetX) * viewState.scale + canvasSize.width / 2;
    const sy = (my + viewState.offsetY) * viewState.scale + canvasSize.height / 2;
    return { x: sx, y: sy };
  }, [viewState, canvasSize]);

  const screenToModel = useCallback((sx: number, sy: number): Point => {
    // 将屏幕坐标转换为模型坐标
    const mx = (sx - canvasSize.width / 2) / viewState.scale - viewState.offsetX;
    const my = (sy - canvasSize.height / 2) / viewState.scale - viewState.offsetY;
    return { x: mx, y: my };
  }, [viewState, canvasSize]);

  // 节点拾取 - 在屏幕空间中进行
  const pickNodeAt = useCallback((sx: number, sy: number): NodePickResult | null => {
    const R_pivot = 12;
    const R_joint = 10;
    
    // 检查支点
    for (const p of mechanism.pivots) {
      const sp = modelToScreen(p.x - mechanism.centerX, p.y - mechanism.centerY);
      if (Math.hypot(sp.x - sx, sp.y - sy) <= R_pivot) {
        return { id: p.id, type: 'pivot', world: { x: sp.x, y: sp.y } };
      }
    }
    
    // 检查关节
    for (const j of mechanism.joints) {
      const sp = modelToScreen(j.x - mechanism.centerX, j.y - mechanism.centerY);
      if (Math.hypot(sp.x - sx, sp.y - sy) <= R_joint) {
        return { id: j.id, type: 'joint', world: { x: sp.x, y: sp.y } };
      }
    }
    
    return null;
  }, [mechanism, modelToScreen]);

  // RDP 简化算法
  const simplifyRDP = useCallback((points: Point[], epsilon: number): Point[] => {
    if (points.length < 3) return [...points];
    
    const a = points[0];
    const b = points[points.length - 1];
    const A = b.y - a.y;
    const B = a.x - b.x;
    const C = b.x * a.y - a.x * b.y;
    let dmax = -1;
    let idx = -1;
    
    for (let i = 1; i < points.length - 1; i++) {
      const p = points[i];
      const d = Math.abs(A * p.x + B * p.y + C) / Math.hypot(A, B);
      if (d > dmax) { 
        dmax = d; 
        idx = i; 
      }
    }
    
    if (dmax > epsilon && idx > 0) {
      const res1 = simplifyRDP(points.slice(0, idx + 1), epsilon);
      const res2 = simplifyRDP(points.slice(idx), epsilon);
      return [...res1.slice(0, -1), ...res2];
    } else {
      return [points[0], points[points.length - 1]];
    }
  }, []);

  // 鼠标事件处理
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
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

    // 左键：绘制自由曲线
    if (e.button === 0 && mechanism.curveType === 'free') {
      setIsDrawing(true);
      const p = screenToModel(x, y);
      setDrawingPoints([p]);
      setIsPanning(false);
    }
    // 右键：拖拽平移
    else if (e.button === 2) {
      setIsPanning(true);
      setLastMouse({ x, y });
      setIsDrawing(false);
    }
  }, [anchorMode, pickNodeAt, setAnchor, mechanism.curveType, screenToModel, setIsDrawing]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (anchorMode) return;

    // 绘制模式
    if (isDrawing && mechanism.curveType === 'free') {
      const p = screenToModel(x, y);
      setDrawingPoints(prev => {
        const last = prev[prev.length - 1];
        if (!last || Math.hypot(p.x - last.x, p.y - last.y) > 2) {
          return [...prev, p];
        }
        return prev;
      });
    }
    // 平移模式
    else if (isPanning) {
      const dx = (x - lastMouse.x) / viewState.scale;
      const dy = (y - lastMouse.y) / viewState.scale;
      setViewState(prev => ({
        ...prev,
        offsetX: prev.offsetX + dx,
        offsetY: prev.offsetY + dy
      }));
      setLastMouse({ x, y });
    }
  }, [anchorMode, isDrawing, mechanism.curveType, isPanning, lastMouse, screenToModel, setViewState, viewState.scale]);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (anchorMode) return;

    if (isDrawing && mechanism.curveType === 'free') {
      setIsDrawing(false);
      if (drawingPoints.length >= 2) {
        const simplified = simplifyRDP(drawingPoints, 2);
        setFreeCurve(simplified);
      }
      setDrawingPoints([]);
    }
    
    if (e.button === 2) {
      setIsPanning(false);
    }
  }, [anchorMode, isDrawing, mechanism.curveType, drawingPoints, setFreeCurve, setIsDrawing, simplifyRDP]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // 计算鼠标位置在模型空间的坐标
    const mouseModel = screenToModel(x, y);
    
    // 缩放
    const scaleFactor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
    const newScale = Math.max(0.1, Math.min(10, viewState.scale * scaleFactor));
    
    // 计算新的偏移，使鼠标位置保持不变
    const newMouseModel = {
      x: (x - canvasSize.width / 2) / newScale - viewState.offsetX,
      y: (y - canvasSize.height / 2) / newScale - viewState.offsetY
    };
    
    const offsetDx = mouseModel.x - newMouseModel.x;
    const offsetDy = mouseModel.y - newMouseModel.y;
    
    setViewState(prev => ({
      scale: newScale,
      offsetX: prev.offsetX + offsetDx,
      offsetY: prev.offsetY + offsetDy
    }));
  }, [setViewState, screenToModel, viewState, canvasSize]);

  // 禁用右键菜单
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

  // 生成路径字符串的辅助函数
  const generatePathD = useCallback((points: Point[]): string => {
    if (points.length === 0) return '';
    return `M ${points.map(p => `${p.x},${p.y}`).join(' L ')}`;
  }, []);

  return (
    <div className="fixed inset-0 w-screen h-screen">
      <svg
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        className="w-full h-full bg-gray-100"
        style={{
          backgroundImage: `radial-gradient(circle, #d1d5db 1px, transparent 1px)`,
          backgroundSize: `${30 * viewState.scale}px ${30 * viewState.scale}px`,
          backgroundPosition: `${viewState.offsetX * viewState.scale + canvasSize.width / 2}px ${viewState.offsetY * viewState.scale + canvasSize.height / 2}px`,
          cursor: anchorMode ? 'crosshair' : 
                  isDrawing ? 'crosshair' : 
                  isPanning ? 'grabbing' : 
                  mechanism.curveType === 'free' ? 'crosshair' : 'grab'
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        onContextMenu={handleContextMenu}
      >
        <g>
          {/* 基础曲线 */}
          {showOptions.showCurve && mechanism.baseCurve.length > 1 && (
            <path
              d={generatePathD(mechanism.baseCurve.map(p => {
                const screen = modelToScreen(p.x, p.y);
                return { x: screen.x, y: screen.y };
              }))}
              stroke="#9ca3af"
              strokeWidth="1"
              strokeDasharray="5,4"
              fill="none"
            />
          )}

          {/* 轨迹 */}
          {showOptions.showTrail && mechanism.trailPoints.length > 1 && (
            <path
              d={generatePathD(mechanism.trailPoints.map(p => {
                const screen = modelToScreen(p.x - mechanism.centerX, p.y - mechanism.centerY);
                return { x: screen.x, y: screen.y };
              }))}
              stroke="#6b7280"
              strokeWidth="1"
              fill="none"
            />
          )}

          {/* 连杆 */}
          {mechanism.links.map((link, idx) => {
            if (!(link.start && link.end)) return null;
            const startScreen = modelToScreen(link.start.x - mechanism.centerX, link.start.y - mechanism.centerY);
            const endScreen = modelToScreen(link.end.x - mechanism.centerX, link.end.y - mechanism.centerY);
            return (
              <line
                key={idx}
                x1={startScreen.x}
                y1={startScreen.y}
                x2={endScreen.x}
                y2={endScreen.y}
                stroke="#111827"
                strokeWidth={2 * viewState.scale}
                strokeLinecap="round"
              />
            );
          })}

          {/* 制造预览 */}
          {showOptions.showMfg && (
            <g stroke="#d1d5db" strokeWidth={1 * viewState.scale} fill="none">
              {mechanism.links.map((link, idx) => {
                if (!(link.start && link.end)) return null;
                const startScreen = modelToScreen(link.start.x - mechanism.centerX, link.start.y - mechanism.centerY);
                const endScreen = modelToScreen(link.end.x - mechanism.centerX, link.end.y - mechanism.centerY);
                return (
                  <g key={idx}>
                    <CapsuleShape 
                      start={startScreen} 
                      end={endScreen} 
                      width={12 * viewState.scale} 
                    />
                    <circle cx={startScreen.x} cy={startScreen.y} r={2 * viewState.scale} />
                    <circle cx={endScreen.x} cy={endScreen.y} r={2 * viewState.scale} />
                  </g>
                );
              })}
            </g>
          )}

          {/* 关节点 */}
          {showOptions.showJoints && mechanism.joints.map((joint, idx) => {
            const screen = modelToScreen(joint.x - mechanism.centerX, joint.y - mechanism.centerY);
            return (
              <g key={idx}>
                <circle
                  cx={screen.x}
                  cy={screen.y}
                  r={4 * viewState.scale}
                  stroke="#111827"
                  strokeWidth={1.5 * viewState.scale}
                  fill="none"
                />
                {showOptions.showLabels && (
                  <text
                    x={screen.x + 8 * viewState.scale}
                    y={screen.y - 8 * viewState.scale}
                    fontSize={10 * viewState.scale}
                    fill="#6b7280"
                    fontFamily="monospace"
                  >
                    {joint.id}
                  </text>
                )}
              </g>
            );
          })}

          {/* 支点 */}
          {showOptions.showPivots && mechanism.pivots.map((pivot, idx) => {
            const screen = modelToScreen(pivot.x - mechanism.centerX, pivot.y - mechanism.centerY);
            const size = 6 * viewState.scale;
            return (
              <g key={idx}>
                <circle
                  cx={screen.x}
                  cy={screen.y}
                  r={size}
                  stroke="#111827"
                  strokeWidth={1.5 * viewState.scale}
                  fill="none"
                />
                <line
                  x1={screen.x - size}
                  y1={screen.y}
                  x2={screen.x + size}
                  y2={screen.y}
                  stroke="#111827"
                  strokeWidth={1.5 * viewState.scale}
                />
                <line
                  x1={screen.x}
                  y1={screen.y - size}
                  x2={screen.x}
                  y2={screen.y + size}
                  stroke="#111827"
                  strokeWidth={1.5 * viewState.scale}
                />
                {showOptions.showLabels && (
                  <text
                    x={screen.x + 10 * viewState.scale}
                    y={screen.y + 10 * viewState.scale}
                    fontSize={11 * viewState.scale}
                    fill="#6b7280"
                    fontFamily="monospace"
                  >
                    {pivot.id}
                  </text>
                )}
              </g>
            );
          })}

          {/* 绘制中的自由曲线 */}
          {isDrawing && drawingPoints.length > 1 && (
            <path
              d={generatePathD(drawingPoints.map(p => {
                const screen = modelToScreen(p.x, p.y);
                return { x: screen.x, y: screen.y };
              }))}
              stroke="#6b7280"
              strokeWidth={1 * viewState.scale}
              strokeDasharray="4,3"
              fill="none"
            />
          )}

          {/* 锚点高亮 */}
          {anchor?.id && (() => {
            const node = mechanism.pivots.find(p => p.id === anchor.id) || 
                        mechanism.joints.find(j => j.id === anchor.id);
            if (!node) return null;
            const sp = modelToScreen(node.x - mechanism.centerX, node.y - mechanism.centerY);
            const size = 9 * viewState.scale;
            return (
              <g key="anchor">
                <circle
                  cx={sp.x}
                  cy={sp.y}
                  r={size}
                  stroke="#2563eb"
                  strokeWidth={2 * viewState.scale}
                  fill="none"
                />
                <line x1={sp.x - size} y1={sp.y} x2={sp.x + size} y2={sp.y} stroke="#2563eb" strokeWidth={2 * viewState.scale} />
                <line x1={sp.x} y1={sp.y - size} x2={sp.x} y2={sp.y + size} stroke="#2563eb" strokeWidth={2 * viewState.scale} />
              </g>
            );
          })()}
        </g>
      </svg>
    </div>
  );
};