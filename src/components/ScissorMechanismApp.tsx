// src/components/ScissorMechanismApp.tsx (简洁版)
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ImprovedScissorMechanism, Point } from '../lib/ScissorMechanism';
import { exportLinksToSVG, downloadSVG } from '../lib/svgExporter';
import { FixedPhysicsAdapter } from '../lib/physics/FixedPhysicsAdapter';
import { PhysicsAnimationSystem } from '../lib/PhysicsAnimation';
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

const DEFAULT_CANVAS_SIZE: CanvasSize = { width: 1920, height: 1080 };

export default function ScissorMechanismApp() {
  // 机制实例
  const mechanismRef = useRef<ImprovedScissorMechanism>();
  if (!mechanismRef.current) {
    mechanismRef.current = new ImprovedScissorMechanism();
  }
  const mechanism = mechanismRef.current;

  // 物理适配器和动画系统
  const physicsRef = useRef<FixedPhysicsAdapter | null>(null);
  const animationRef = useRef<PhysicsAnimationSystem | null>(null);
  const animationFrameRef = useRef<number>();

  // 面板显示状态
  const [panelsVisible, setPanelsVisible] = useState({
    control: true,
    status: true,
    manufacturing: false,
    help: false
  });

  // 画布尺寸
  const [canvasSize, setCanvasSize] = useState<CanvasSize>(() => {
    if (typeof window !== 'undefined') {
      return { width: window.innerWidth, height: window.innerHeight };
    }
    return DEFAULT_CANVAS_SIZE;
  });

  // 机构参数
  const [params, setParams] = useState<MechanismParams>({
    segments: 4,
    linkLength: 60,
    curvature: 1.0,
    curveLength: 300,
    curveType: 'arc',
  });

  // 显示选项
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

  // 交互状态
  const [freeCurve, setFreeCurve] = useState<Point[]>([]);
  const [anchor, setAnchor] = useState<AnchorState>({ id: null, world: null });
  const [anchorMode, setAnchorMode] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [physicsEnabled, setPhysicsEnabled] = useState(false);

  // 动画状态
  const [animationEnabled, setAnimationEnabled] = useState(false);
  const [animationPreset, setAnimationPreset] = useState<'gentle' | 'dynamic' | 'chaotic'>('gentle');

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

  // [保持原有的 useEffect 和处理函数不变...]
  
  // 画布尺寸变化处理
  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      setCanvasSize({ width: w, height: h });
      mechanism.setCenter(w / 2, h / 2);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [mechanism]);

  // 机构参数变化时更新几何
  useEffect(() => {
    mechanism.setParams(params);
    mechanism.update(freeCurve.length > 0 ? freeCurve : null);
    
    if (physicsEnabled && physicsRef.current) {
      physicsRef.current.rebuild();
      
      if (animationEnabled && animationRef.current) {
        animationRef.current.stop();
        animationRef.current = new PhysicsAnimationSystem(physicsRef.current);
        animationRef.current.applyPreset(animationPreset);
        animationRef.current.start();
      }
    }
  }, [params, freeCurve, physicsEnabled, mechanism, animationEnabled, animationPreset]);

  // 物理模拟开关
  useEffect(() => {
    if (physicsEnabled) {
      physicsRef.current?.destroy();
      physicsRef.current = new FixedPhysicsAdapter(mechanism, {
        gravity: true,
        stiffness: 0.9,
        damping: 0.02
      });

      if (animationEnabled) {
        animationRef.current?.stop();
        animationRef.current = new PhysicsAnimationSystem(physicsRef.current);
        animationRef.current.applyPreset(animationPreset);
        animationRef.current.start();
      }

      if (anchor.id) {
        physicsRef.current.setAnchor(anchor.id);
      }

      setTimeout(() => {
        physicsRef.current?.addRandomImpulse();
      }, 500);

      const animate = () => {
        if (physicsRef.current) {
          physicsRef.current.updateMechanism();
          animationFrameRef.current = requestAnimationFrame(animate);
        }
      };
      animate();

    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      animationRef.current?.stop();
      animationRef.current = null;
      
      physicsRef.current?.destroy();
      physicsRef.current = null;
      
      mechanism.update(freeCurve.length > 0 ? freeCurve : null);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      animationRef.current?.stop();
    };
  }, [physicsEnabled, anchor.id, mechanism, freeCurve, animationEnabled, animationPreset]);

  useEffect(() => {
    if (physicsEnabled && physicsRef.current) {
      if (animationEnabled) {
        animationRef.current?.stop();
        animationRef.current = new PhysicsAnimationSystem(physicsRef.current);
        animationRef.current.applyPreset(animationPreset);
        animationRef.current.start();
      } else {
        animationRef.current?.stop();
        animationRef.current = null;
      }
    }
  }, [animationEnabled, physicsEnabled, animationPreset]);

  useEffect(() => {
    if (physicsRef.current) {
      physicsRef.current.setAnchor(anchor.id);
    }
  }, [anchor]);

  // 处理函数
  const handleReset = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    animationRef.current?.stop();
    animationRef.current = null;
    physicsRef.current?.destroy();
    physicsRef.current = null;

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
    setPhysicsEnabled(false);
    setAnimationEnabled(false);

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

  const handleShake = useCallback(() => {
    if (physicsRef.current) {
      physicsRef.current.addRandomImpulse();
    }
  }, []);

  const handleExplosion = useCallback(() => {
    if (animationRef.current) {
      animationRef.current.triggerExplosion(0.08);
    }
  }, []);

  const handleWave = useCallback((direction: 'left' | 'right' | 'up' | 'down') => {
    if (animationRef.current) {
      animationRef.current.triggerWave(direction, 0.05);
    }
  }, []);

  if (!mechanism) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 relative overflow-hidden">
      {/* 背景画布 */}
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

      {/* 简洁工具栏 */}
      <div className="absolute top-0 left-0 right-0 bg-white/90 backdrop-blur-sm border-b border-gray-200 z-50">
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center space-x-4">
            <h1 className="text-lg font-medium text-gray-900">Scissor Mechanism</h1>
            
            {/* 快速控制 */}
            <div className="flex items-center space-x-2">
              <button
                onClick={handleReset}
                className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
              >
                Reset
              </button>
              <button
                onClick={handleRandomize}
                className="px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition-colors"
              >
                Random
              </button>
              <button
                onClick={handleExportSVG}
                className="px-2 py-1 text-xs bg-green-100 hover:bg-green-200 text-green-700 rounded transition-colors"
              >
                Export
              </button>
            </div>
          </div>

          {/* 面板切换 */}
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setPanelsVisible(p => ({ ...p, control: !p.control }))}
              className={`px-2 py-1 text-xs rounded transition-all ${
                panelsVisible.control 
                  ? 'bg-indigo-100 text-indigo-700' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Controls
            </button>
            <button
              onClick={() => setPanelsVisible(p => ({ ...p, status: !p.status }))}
              className={`px-2 py-1 text-xs rounded transition-all ${
                panelsVisible.status 
                  ? 'bg-emerald-100 text-emerald-700' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Status
            </button>
            <button
              onClick={() => setPanelsVisible(p => ({ ...p, manufacturing: !p.manufacturing }))}
              className={`px-2 py-1 text-xs rounded transition-all ${
                panelsVisible.manufacturing 
                  ? 'bg-purple-100 text-purple-700' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Mfg
            </button>
            <button
              onClick={() => setPanelsVisible(p => ({ ...p, help: !p.help }))}
              className={`px-2 py-1 text-xs rounded transition-all ${
                panelsVisible.help 
                  ? 'bg-amber-100 text-amber-700' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Help
            </button>
          </div>
        </div>
      </div>

      {/* 面板容器 */}
      <div className="absolute inset-0 pt-12 pointer-events-none">
        {/* 左侧面板区域 */}
        <div className="absolute left-4 top-4 bottom-4 w-80 max-w-[calc(50vw-2rem)] pointer-events-auto">
          {panelsVisible.control && (
            <div className="h-full">
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
                onShake={handleShake}
                mechanism={mechanism}
                physicsEnabled={physicsEnabled}
                setPhysicsEnabled={setPhysicsEnabled}
                animationEnabled={animationEnabled}
                setAnimationEnabled={setAnimationEnabled}
                animationPreset={animationPreset}
                setAnimationPreset={setAnimationPreset}
                onExplosion={handleExplosion}
                onWave={handleWave}
              />
            </div>
          )}
        </div>

        {/* 右侧面板区域 */}
        <div className="absolute right-4 top-4 w-64 space-y-4 pointer-events-auto">
          {panelsVisible.status && (
            <StatusPanel 
              mechanism={mechanism} 
              physicsEnabled={physicsEnabled}
              animationEnabled={animationEnabled}
            />
          )}
          
          {panelsVisible.manufacturing && (
            <ManufacturingPanel params={mfgParams} setParams={setMfgParams} />
          )}
        </div>

        {/* 帮助面板 - 现在显示在中央 */}
        {panelsVisible.help && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl px-4 pointer-events-auto">
            <HelpPanel
              curveType={params.curveType}
              isDrawing={isDrawing}
              anchor={anchor}
              viewState={viewState}
            />
          </div>
        )}
      </div>
    </div>
  );
}