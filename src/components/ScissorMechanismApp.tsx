'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ImprovedScissorMechanism } from '../lib/ScissorMechanism';
import { exportLinksToSVG, downloadSVG } from '../lib/svgExporter';
import { 
  MechanismParams, 
  ShowOptions, 
  ViewState, 
  CanvasSize, 
  AnchorState, 
  ManufacturingParams,
  Point 
} from '../types';
import { InteractiveCanvas } from './InteractiveCanvas';
import { ControlPanel } from './ControlPanel';
import { StatusPanel } from './StatusPanel';
import { ManufacturingPanel } from './ManufacturingPanel';
import { HelpPanel } from './HelpPanel';

export default function ScissorMechanismApp() {
  const mechanismRef = useRef(new ImprovedScissorMechanism());
  
  const [canvasSize, setCanvasSize] = useState<CanvasSize>({ 
    width: typeof window !== 'undefined' ? window.innerWidth : 1920, 
    height: typeof window !== 'undefined' ? window.innerHeight : 1080 
  });
  
  const [params, setParams] = useState<MechanismParams>({
    segments: 4,
    linkLength: 60,
    curvature: 1.0,
    curveLength: 300,
    curveType: 'arc'
  });
  
  const [showOptions, setShowOptions] = useState<ShowOptions>({
    showCurve: true,
    showJoints: true,
    showPivots: true,
    showTrail: false,
    showLabels: true,
    showMfg: true
  });

  const [viewState, setViewState] = useState<ViewState>({
    scale: 1.0,
    offsetX: 0,
    offsetY: 0
  });

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
    perRow: 8
  });

  // 更新机构和画布尺寸
  useEffect(() => {
    const mechanism = mechanismRef.current;
    const updateSize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      setCanvasSize({ width: w, height: h });
      mechanism.setCenter(w / 2, h / 2);
      mechanism.setParams(params);
      mechanism.update(freeCurve);
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [params, freeCurve]);

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
      curveType: (['arc', 'sine', 'free'] as const)[Math.floor(Math.random() * 3)]
    });
  }, []);

  // SVG 导出功能
  const handleExportSVG = useCallback(() => {
    const svg = exportLinksToSVG(mechanismRef.current, mfgParams);
    if (!svg) {
      alert('No links to export.');
      return;
    }
    downloadSVG(svg);
  }, [mfgParams]);

  const mechanism = mechanismRef.current;

  return (
    <div className="min-h-screen bg-gray-100 relative">
      {/* 全屏画布背景 */}
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
        />
      </div>

      {/* 浮动控制面板 */}
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
      />

      {/* 状态面板 */}
      <StatusPanel mechanism={mechanism} />

      {/* 制造参数面板 */}
      <ManufacturingPanel 
        params={mfgParams} 
        setParams={setMfgParams} 
      />

      {/* 帮助信息 */}
      <HelpPanel
        curveType={params.curveType}
        isDrawing={isDrawing}
        anchor={anchor}
        viewState={viewState}
      />
    </div>
  );
}