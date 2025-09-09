// src/components/ScissorMechanismApp.tsx (增强版)
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ImprovedScissorMechanism, Point } from '../lib/ScissorMechanism';
import { exportLinksToSVG, downloadSVG } from '../lib/svgExporter';
import { FixedPhysicsAdapter } from '../lib/physics/FixedPhysicsAdapter';
import { AnimationSystem } from '../lib/AnimationSystem';
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

  // 🎬 动画系统
  const animationSystemRef = useRef<AnimationSystem>();
  if (!animationSystemRef.current) {
    animationSystemRef.current = new AnimationSystem();
  }
  const animationSystem = animationSystemRef.current;

  // 物理适配器
  const physicsRef = useRef<FixedPhysicsAdapter | null>(null);
  const animationRef = useRef<number>();

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

  // 🎨 增强的性能监控状态
  const [fps, setFPS] = useState(60);
  const [smoothParams, setSmoothParams] = useState(params);

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

  // 🎬 平滑参数更新处理
  useEffect(() => {
    const updateMechanism = () => {
      // 使用平滑后的参数更新机制
      mechanism.setParams(smoothParams);
      mechanism.update(freeCurve.length > 0 ? freeCurve : null);
      
      // 如果物理模拟启用，重建物理世界
      if (physicsEnabled && physicsRef.current) {
        physicsRef.current.rebuild();
      }
    };

    // 使用 requestAnimationFrame 确保更新在下一帧进行
    const frame = requestAnimationFrame(updateMechanism);
    return () => cancelAnimationFrame(frame);
  }, [smoothParams, freeCurve, physicsEnabled, mechanism]);

  // 🎬 参数变化的平滑处理
  useEffect(() => {
    // 检查是否有显著变化
    const hasSignificantChange = Object.keys(params).some(key => {
      const k = key as keyof MechanismParams;
      return Math.abs((params[k] as number) - (smoothParams[k] as number)) > 0.01;
    });

    if (hasSignificantChange) {
      // 如果动画系统正在运行，直接应用参数
      if (animationSystem.isRunning()) {
        setSmoothParams(params);
      } else {
        // 否则使用平滑过渡
        const smoothTransition = () => {
          setSmoothParams(prev => {
            const newParams = { ...prev };
            let hasChange = false;

            Object.keys(params).forEach(key => {
              const k = key as keyof MechanismParams;
              const current = prev[k] as number;
              const target = params[k] as number;
              const diff = target - current;

              if (Math.abs(diff) > 0.01) {
                // 平滑插值，每帧移动 10% 的距离
                (newParams[k] as number) = current + diff * 0.1;
                hasChange = true;
              } else {
                (newParams[k] as number) = target;
              }
            });

            if (hasChange) {
              requestAnimationFrame(smoothTransition);
            }

            return newParams;
          });
        };

        smoothTransition();
      }
    }
  }, [params, animationSystem]);

  // 物理模拟开关
  useEffect(() => {
    if (physicsEnabled) {
      // 启用物理模拟
      physicsRef.current?.destroy();
      physicsRef.current = new FixedPhysicsAdapter(mechanism, {
        gravity: true,
        stiffness: 0.9,
        damping: 0.02
      });

      // 如果有锚点，设置它
      if (anchor.id) {
        physicsRef.current.setAnchor(anchor.id);
      }

      // 添加初始扰动
      setTimeout(() => {
        physicsRef.current?.addRandomImpulse();
      }, 500);

      // 启动连续更新循环
      let frameCount = 0;
      let lastTime = performance.now();
      
      const animate = () => {
        if (physicsRef.current) {
          const now = performance.now();
          frameCount++;
          
          // 每60帧计算一次FPS
          if (frameCount % 60 === 0) {
            const newFPS = Math.round(1000 / (now - lastTime) * 60);
            setFPS(newFPS);
          }
          lastTime = now;

          physicsRef.current.updateMechanism();
          animationRef.current = requestAnimationFrame(animate);
        }
      };
      animate();

    } else {
      // 关闭物理模拟
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      physicsRef.current?.destroy();
      physicsRef.current = null;
      
      // 恢复几何模式
      mechanism.update(freeCurve.length > 0 ? freeCurve : null);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [physicsEnabled, anchor.id, mechanism, freeCurve]);

  // 锚点变化时更新物理
  useEffect(() => {
    if (physicsRef.current) {
      physicsRef.current.setAnchor(anchor.id);
    }
  }, [anchor]);

  // 🎬 组件卸载时清理动画
  useEffect(() => {
    return () => {
      animationSystem.stop();
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      physicsRef.current?.destroy();
    };
  }, [animationSystem]);

  // 重置功能
  const handleReset = useCallback(() => {
    // 🎬 停止动画
    animationSystem.stop();

    // 清理物理
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    physicsRef.current?.destroy();
    physicsRef.current = null;

    // 重新创建机制
    mechanismRef.current = new ImprovedScissorMechanism();
    const mech = mechanismRef.current;

    // 重置所有状态
    const defaultParams = {
      segments: 4,
      linkLength: 60,
      curvature: 1.0,
      curveLength: 300,
      curveType: 'arc' as const,
    };

    setParams(defaultParams);
    setSmoothParams(defaultParams);
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

    // 初始化机制
    if (mech) {
      mech.setCenter(canvasSize.width / 2, canvasSize.height / 2);
      mech.setParams(defaultParams);
      mech.update();
    }
  }, [canvasSize, animationSystem]);

  // 随机化功能 - 增加平滑过渡
  const handleRandomize = useCallback(() => {
    const curveTypes: Array<'arc' | 'sine' | 'free'> = ['arc', 'sine', 'free'];
    const newParams = {
      segments: Math.floor(2 + Math.random() * 10),
      linkLength: Math.floor(40 + Math.random() * 80),
      curvature: parseFloat((0.5 + Math.random() * 2.0).toFixed(1)),
      curveLength: Math.floor(200 + Math.random() * 250),
      curveType: curveTypes[Math.floor(Math.random() * curveTypes.length)],
    };

    // 🎬 如果动画系统运行中，直接设置；否则平滑过渡
    if (animationSystem.isRunning()) {
      setParams(newParams);
    } else {
      // 平滑过渡到新参数
      const startParams = { ...params };
      const startTime = performance.now();
      const duration = 1000; // 1秒过渡

      const animate = () => {
        const elapsed = performance.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = progress * progress * (3 - 2 * progress); // smoothstep

        const interpolatedParams = {
          segments: Math.round(startParams.segments + (newParams.segments - startParams.segments) * eased),
          linkLength: Math.round(startParams.linkLength + (newParams.linkLength - startParams.linkLength) * eased),
          curvature: parseFloat((startParams.curvature + (newParams.curvature - startParams.curvature) * eased).toFixed(1)),
          curveLength: Math.round(startParams.curveLength + (newParams.curveLength - startParams.curveLength) * eased),
          curveType: progress > 0.5 ? newParams.curveType : startParams.curveType,
        };

        setParams(interpolatedParams);

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };

      animate();
    }
  }, [params, animationSystem]);

  // SVG 导出功能
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

  // 添加扰动功能 - 增强版
  const handleShake = useCallback(() => {
    if (physicsRef.current) {
      // 🎬 更强烈的扰动效果
      for (let i = 0; i < 3; i++) {
        setTimeout(() => {
          physicsRef.current?.addRandomImpulse();
        }, i * 100);
      }
    } else {
      // 🎬 几何模式下的视觉摇晃
      const originalOffset = { ...viewState };
      const shakeAnimation = () => {
        const time = Date.now() * 0.05;
        const shakeX = Math.sin(time) * 5;
        const shakeY = Math.cos(time * 1.3) * 3;
        
        setViewState(prev => ({
          ...prev,
          offsetX: originalOffset.offsetX + shakeX,
          offsetY: originalOffset.offsetY + shakeY
        }));
      };

      let shakeCount = 0;
      const maxShakes = 30;
      const shakeInterval = setInterval(() => {
        shakeAnimation();
        shakeCount++;
        if (shakeCount >= maxShakes) {
          clearInterval(shakeInterval);
          setViewState(originalOffset);
        }
      }, 16);
    }
  }, [physicsRef, viewState]);

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

      {/* 🎬 增强的控制面板 */}
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
        viewState={viewState}
        setViewState={setViewState}
        animationSystem={animationSystem}
      />

      {/* 状态面板 - 增加FPS显示 */}
      <StatusPanel 
        mechanism={mechanism} 
        physicsEnabled={physicsEnabled} 
        fps={fps}
        isAnimating={animationSystem.isRunning()}
      />

      {/* 制造参数面板 */}
      <ManufacturingPanel params={mfgParams} setParams={setMfgParams} />

      {/* 帮助提示 */}
      <HelpPanel
        curveType={params.curveType}
        isDrawing={isDrawing}
        anchor={anchor}
        viewState={viewState}
      />

      {/* 🎬 动画状态指示器 */}
      {animationSystem.isRunning() && (
        <div className="absolute top-1/2 right-4 transform -translate-y-1/2">
          <div className="bg-purple-500 text-white px-3 py-2 rounded-full shadow-lg animate-pulse">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-white rounded-full animate-bounce"></div>
              <span className="text-sm font-medium">Animating</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}