// src/components/ScissorMechanismApp.tsx
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ImprovedScissorMechanism, Point } from '../lib/ScissorMechanism';
import { exportLinksToSVG, downloadSVG } from '../lib/svgExporter';
import {
  MechanismParams,
  ShowOptions,
  ViewState,
  CanvasSize,
  AnchorState,
  ManufacturingParams,
} from '../types';

import { InteractiveCanvas } from './InteractiveCanvas';
import { ControlPanel } from './ControlPanel';
import { StatusPanel } from './StatusPanel';
import { ManufacturingPanel } from './ManufacturingPanel';
import { HelpPanel } from './HelpPanel';

// ★ 新增：Matter.js 物理适配器（不渲染，只负责“算物理→回写机制坐标”）
import { buildWorldFromMechanism, PhysicsHandle } from '../lib/physics/matterAdapter';

const DEFAULT_CANVAS_SIZE: CanvasSize = { width: 1920, height: 1080 };

export default function ScissorMechanismApp() {
  // 机制实例（保持与你的原代码一致）
  const mechanismRef = useRef<ImprovedScissorMechanism>();
  if (!mechanismRef.current) {
    mechanismRef.current = new ImprovedScissorMechanism();
  }
  const mechanism = mechanismRef.current;

  // ★ 物理世界句柄
  const physicsRef = useRef<PhysicsHandle | null>(null);

  // 画布尺寸
  const [canvasSize, setCanvasSize] = useState<CanvasSize>(() => {
    if (typeof window !== 'undefined') {
      return { width: window.innerWidth, height: window.innerHeight };
    }
    return DEFAULT_CANVAS_SIZE;
  });

  // 参数 & 显示
  const [params, setParams] = useState<MechanismParams>({
    segments: 4,
    linkLength: 60,
    curvature: 1.0,
    curveLength: 300,
    curveType: 'arc',
  });

  const [showOptions, setShowOptions] = useState<ShowOptions>({
    showCurve: true,
    showJoints: true,
    showPivots: true,
    showTrail: false,
    showLabels: true,
    showMfg: true,
  });

  // 视图状态
  const [viewState, setViewState] = useState<ViewState>({
    scale: 1.0,
    offsetX: 0,
    offsetY: 0,
  });

  // 自由曲线 & 锚点 & 模式
  const [freeCurve, setFreeCurve] = useState<Point[]>([]);
  const [anchor, setAnchor] = useState<AnchorState>({ id: null, world: null });
  const [anchorMode, setAnchorMode] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);

  // 制造参数
  const [mfgParams, setMfgParams] = useState<ManufacturingParams>({
    linkWidth: 12,
    holeDia: 4,
    groupTol: 0.1,
    spacing: 6,
    px2mm: 1,
    strokeW: 0.1,
    kerf: 0,
    perRow: 8,
  });

  // 尺寸变更或参数变化时，更新几何
  useEffect(() => {
    const mech = mechanism;
    if (!mech) return;

    const updateSize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      setCanvasSize({ width: w, height: h });
      mech.setCenter(w / 2, h / 2);
      mech.setParams(params);
      mech.update(freeCurve.length > 0 ? freeCurve : null);
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [params, freeCurve, mechanism]);

  useEffect(() => {
    const mech = mechanism;
    if (!mech) return;
    mech.setParams(params);
    mech.update(freeCurve.length > 0 ? freeCurve : null);
  }, [params, freeCurve, mechanism]);

  // ★ 关键1：Anchor Mode 开/关时创建/销毁物理世界，并开启帧循环回写坐标
  useEffect(() => {
    if (!mechanism) return;

    let raf = 0;

    if (anchorMode) {
      // 清掉旧的
      physicsRef.current?.destroy?.();
      physicsRef.current = null;

      // 用当前几何创建物理世界
      physicsRef.current = buildWorldFromMechanism(mechanism, {
        gravity: true,
        worldBounds: { minX: -2000, minY: -2000, maxX: 4000, maxY: 3000 },
        damping: { linear: 0.05, air: 0.02 }, // 稍大阻尼，更易收敛
      });

      // 如果已有选中的锚点，则设为静态
      if (anchor.id) {
        physicsRef.current.setAnchor(anchor.id);
      }

      // 帧循环：从物理世界取坐标回写到机制 → 你的 SVG 自动用新坐标绘制
      const loop = () => {
        physicsRef.current?.stepAndWriteBack();
        raf = requestAnimationFrame(loop);
      };
      loop();

      return () => {
        cancelAnimationFrame(raf);
      };
    } else {
      // 关闭物理：销毁并回到纯几何
      physicsRef.current?.destroy?.();
      physicsRef.current = null;
      mechanism.update(freeCurve.length > 0 ? freeCurve : null);
    }
  }, [anchorMode, anchor?.id, mechanism, freeCurve]);

  // ★ 关键2：当 anchor 变化时，同步到物理世界（把该 joint 设为静态/解除）
  useEffect(() => {
    if (physicsRef.current) {
      physicsRef.current.setAnchor(anchor.id);
    }
  }, [anchor]);

  // 重置
  const handleReset = useCallback(() => {
    // 清理物理
    physicsRef.current?.destroy?.();
    physicsRef.current = null;

    // 重新创建机制实例，与你原代码一致
    mechanismRef.current = new ImprovedScissorMechanism();
    const mech = mechanismRef.current;

    setParams({
      segments: 4,
      linkLength: 60,
      curvature: 1.0,
      curveLength: 300,
      curveType: 'arc',
    });
    setShowOptions({
      showCurve: true,
      showJoints: true,
      showPivots: true,
      showTrail: false,
      showLabels: true,
      showMfg: true,
    });
    setViewState({ scale: 1.0, offsetX: 0, offsetY: 0 });
    setFreeCurve([]);
    setAnchor({ id: null, world: null });
    setAnchorMode(false);
    setIsDrawing(false);

    if (mech) {
      mech.setCenter(canvasSize.width / 2, canvasSize.height / 2);
      mech.setParams({
        segments: 4,
        linkLength: 60,
        curvature: 1.0,
        curveLength: 300,
        curveType: 'arc',
      });
      mech.update();
    }
  }, [canvasSize]);

  // 随机化
  const handleRandomize = useCallback(() => {
    const curveTypes: Array<'arc' | 'sine' | 'free'> = ['arc', 'sine', 'free'];
    setParams({
      segments: Math.floor(2 + Math.random() * 10),
      linkLength: Math.floor(40 + Math.random() * 80),
      curvature: parseFloat((0.5 + Math.random() * 2.0).toFixed(1)),
      curveLength: Math.floor(200 + Math.random() * 250),
      curveType: curveTypes[Math.floor(Math.random() * curveTypes.length)],
    });
  }, []);

  // 导出 SVG（保持你的原逻辑）
  const handleExportSVG = useCallback(() => {
    const mech = mechanismRef.current;
    if (!mech) {
      alert('Mechanism not initialized.');
      return;
    }
    const svg = exportLinksToSVG(mech, mfgParams);
    if (!svg) {
      alert('No links to export.');
      return;
    }
    downloadSVG(svg);
  }, [mfgParams]);

  if (!mechanism) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 relative overflow-hidden">
      {/* 背景画布（你的 SVG 渲染层） */}
      <div className="absolute inset-0">
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
          mfgParams={mfgParams}
        />
      </div>

      {/* 控制面板（保留你原有交互；Anchor Mode 勾选会触发物理适配器启用） */}
      <ControlPanel
        params={params}
        setParams={setParams}
        showOptions={showOptions}
        setShowOptions={setShowOptions}
        anchorMode={anchorMode}
        setAnchorMode={setAnchorMode}
        anchor={anchor}
        setAnchor={setAnchor}
        onReset={handleReset}
        onRandomize={handleRandomize}
        onExportSVG={handleExportSVG}
        mechanism={mechanism}
      />

      {/* 状态面板 */}
      <StatusPanel mechanism={mechanism} />

      {/* 制造参数面板（注意：该组件只需要 params / setParams） */}
      <ManufacturingPanel params={mfgParams} setParams={setMfgParams} />

      {/* 帮助提示 */}
      <HelpPanel
        curveType={params.curveType}
        isDrawing={isDrawing}
        anchor={anchor}
        viewState={viewState}
      />
    </div>
  );
}
