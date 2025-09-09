// src/components/ControlPanel.tsx (增强版)
'use client';

import React, { useState } from 'react';
import { MechanismParams, ShowOptions, AnchorState, ViewState } from '../types';
import { ImprovedScissorMechanism } from '../lib/ScissorMechanism';
import { AnimationSystem, AnimationPresets, AnimationConfig } from '../lib/AnimationSystem';

interface ControlPanelProps {
  params: MechanismParams;
  setParams: (params: MechanismParams | ((prev: MechanismParams) => MechanismParams)) => void;
  showOptions: ShowOptions;
  setShowOptions: (options: ShowOptions | ((prev: ShowOptions) => ShowOptions)) => void;
  anchorMode: boolean;
  setAnchorMode: (mode: boolean) => void;
  anchor: AnchorState;
  setAnchor: (anchor: AnchorState) => void;
  onReset: () => void;
  onRandomize: () => void;
  onExportSVG: () => void;
  onShake: () => void;
  mechanism: ImprovedScissorMechanism;
  physicsEnabled: boolean;
  setPhysicsEnabled: (enabled: boolean) => void;
  viewState: ViewState;
  setViewState: (state: ViewState | ((prev: ViewState) => ViewState)) => void;
  animationSystem: AnimationSystem;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  params,
  setParams,
  showOptions,
  setShowOptions,
  anchorMode,
  setAnchorMode,
  anchor,
  setAnchor,
  onReset,
  onRandomize,
  onExportSVG,
  onShake,
  mechanism,
  physicsEnabled,
  setPhysicsEnabled,
  viewState,
  setViewState,
  animationSystem
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationPreset, setAnimationPreset] = useState<keyof typeof AnimationPresets>('gentle');
  const [showAnimationControls, setShowAnimationControls] = useState(false);
  const [customAnimConfig, setCustomAnimConfig] = useState<AnimationConfig>(AnimationPresets.gentle);

  // 动画控制函数
  const toggleAnimation = () => {
    if (isAnimating) {
      animationSystem.stop();
      setIsAnimating(false);
    } else {
      // 设置回调函数
      animationSystem.setParameterUpdateCallback((animParams) => {
        setParams(prev => ({ ...prev, ...animParams }));
      });
      
      animationSystem.setViewUpdateCallback((viewParams) => {
        setViewState(prev => ({ ...prev, ...viewParams }));
      });

      animationSystem.updateConfig(customAnimConfig);
      animationSystem.start();
      setIsAnimating(true);
    }
  };

  const applyPreset = (preset: keyof typeof AnimationPresets) => {
    setAnimationPreset(preset);
    const config = AnimationPresets[preset];
    setCustomAnimConfig(config);
    animationSystem.updateConfig(config);
  };

  // 平滑参数过渡函数
  const smoothTransition = (paramName: keyof MechanismParams, targetValue: number) => {
    const currentValue = params[paramName] as number;
    animationSystem.animateToValue(
      currentValue,
      targetValue,
      500, // 500ms 过渡
      AnimationSystem.easing.easeInOut,
      (value) => {
        setParams(prev => ({ ...prev, [paramName]: value }));
      }
    );
  };

  return (
    <div className="absolute top-4 left-4 w-80 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg shadow-lg p-4 space-y-4 max-h-[90vh] overflow-y-auto">
      <h1 className="text-lg font-bold text-gray-900">Scissor Mechanism</h1>
      
      {/* 🎬 动画控制区域 */}
      <div className="space-y-3 p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-purple-800">🎬 Animation</h3>
          <button
            onClick={() => setShowAnimationControls(!showAnimationControls)}
            className="text-xs text-purple-600 hover:text-purple-800"
          >
            {showAnimationControls ? '收起' : '展开'}
          </button>
        </div>
        
        {/* 主动画开关 */}
        <div className="flex items-center space-x-3">
          <button
            onClick={toggleAnimation}
            className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-all ${
              isAnimating 
                ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg' 
                : 'bg-green-500 hover:bg-green-600 text-white shadow-lg hover:shadow-xl'
            }`}
          >
            {isAnimating ? '⏹️ Stop Animation' : '▶️ Start Animation'}
          </button>
          
          {/* 预设选择 */}
          <select
            value={animationPreset}
            onChange={(e) => applyPreset(e.target.value as keyof typeof AnimationPresets)}
            className="px-2 py-1 text-xs border border-gray-300 rounded"
            disabled={isAnimating}
          >
            <option value="gentle">温和</option>
            <option value="dynamic">动感</option>
            <option value="crazy">疯狂</option>
            <option value="breathing">呼吸</option>
          </select>
        </div>

        {/* 详细动画控制 */}
        {showAnimationControls && (
          <div className="space-y-2 pt-2 border-t border-purple-200">
            {/* 曲率波动 */}
            <div className="space-y-1">
              <label className="flex items-center space-x-2 text-xs">
                <input
                  type="checkbox"
                  checked={customAnimConfig.curvatureWave?.enabled ?? false}
                  onChange={(e) => {
                    const newConfig = {
                      ...customAnimConfig,
                      curvatureWave: {
                        ...customAnimConfig.curvatureWave!,
                        enabled: e.target.checked
                      }
                    };
                    setCustomAnimConfig(newConfig);
                    if (isAnimating) animationSystem.updateConfig(newConfig);
                  }}
                  className="w-3 h-3"
                />
                <span className="text-purple-700">曲率波动</span>
              </label>
              
              {customAnimConfig.curvatureWave?.enabled && (
                <div className="grid grid-cols-2 gap-1 text-xs">
                  <div>
                    <label>幅度: {customAnimConfig.curvatureWave.amplitude.toFixed(1)}</label>
                    <input
                      type="range"
                      min="0.1"
                      max="2.0"
                      step="0.1"
                      value={customAnimConfig.curvatureWave.amplitude}
                      onChange={(e) => {
                        const newConfig = {
                          ...customAnimConfig,
                          curvatureWave: {
                            ...customAnimConfig.curvatureWave!,
                            amplitude: parseFloat(e.target.value)
                          }
                        };
                        setCustomAnimConfig(newConfig);
                        if (isAnimating) animationSystem.updateConfig(newConfig);
                      }}
                      className="w-full h-1"
                    />
                  </div>
                  <div>
                    <label>频率: {customAnimConfig.curvatureWave.frequency.toFixed(1)}</label>
                    <input
                      type="range"
                      min="0.1"
                      max="1.0"
                      step="0.1"
                      value={customAnimConfig.curvatureWave.frequency}
                      onChange={(e) => {
                        const newConfig = {
                          ...customAnimConfig,
                          curvatureWave: {
                            ...customAnimConfig.curvatureWave!,
                            frequency: parseFloat(e.target.value)
                          }
                        };
                        setCustomAnimConfig(newConfig);
                        if (isAnimating) animationSystem.updateConfig(newConfig);
                      }}
                      className="w-full h-1"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 长度脉冲 */}
            <div className="space-y-1">
              <label className="flex items-center space-x-2 text-xs">
                <input
                  type="checkbox"
                  checked={customAnimConfig.lengthPulse?.enabled ?? false}
                  onChange={(e) => {
                    const newConfig = {
                      ...customAnimConfig,
                      lengthPulse: {
                        ...customAnimConfig.lengthPulse!,
                        enabled: e.target.checked
                      }
                    };
                    setCustomAnimConfig(newConfig);
                    if (isAnimating) animationSystem.updateConfig(newConfig);
                  }}
                  className="w-3 h-3"
                />
                <span className="text-purple-700">长度脉冲</span>
              </label>
            </div>

            {/* 段数变化 */}
            <div className="space-y-1">
              <label className="flex items-center space-x-2 text-xs">
                <input
                  type="checkbox"
                  checked={customAnimConfig.segmentShift?.enabled ?? false}
                  onChange={(e) => {
                    const newConfig = {
                      ...customAnimConfig,
                      segmentShift: {
                        ...customAnimConfig.segmentShift!,
                        enabled: e.target.checked
                      }
                    };
                    setCustomAnimConfig(newConfig);
                    if (isAnimating) animationSystem.updateConfig(newConfig);
                  }}
                  className="w-3 h-3"
                />
                <span className="text-purple-700">段数变化</span>
              </label>
            </div>

            {/* 自动旋转 */}
            <div className="space-y-1">
              <label className="flex items-center space-x-2 text-xs">
                <input
                  type="checkbox"
                  checked={customAnimConfig.autoRotate?.enabled ?? false}
                  onChange={(e) => {
                    const newConfig = {
                      ...customAnimConfig,
                      autoRotate: {
                        ...customAnimConfig.autoRotate!,
                        enabled: e.target.checked
                      }
                    };
                    setCustomAnimConfig(newConfig);
                    if (isAnimating) animationSystem.updateConfig(newConfig);
                  }}
                  className="w-3 h-3"
                />
                <span className="text-purple-700">自动旋转</span>
              </label>
            </div>
          </div>
        )}
      </div>
      
      {/* 🚀 物理模拟开关 */}
      <div className="space-y-2">
        <h3 className="text-xs font-medium text-gray-600 uppercase tracking-wide">Physics</h3>
        <label className="flex items-center space-x-2 text-sm">
          <input
            type="checkbox"
            checked={physicsEnabled}
            onChange={(e) => setPhysicsEnabled(e.target.checked)}
            className="w-4 h-4 rounded"
          />
          <span className={`${physicsEnabled ? 'text-blue-600 font-medium' : 'text-gray-700'}`}>
            Enable Physics Simulation
          </span>
        </label>
        {physicsEnabled && (
          <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded space-y-2">
            <div>🎯 Physics mode: Use anchor to pin joints and watch the chain react to gravity!</div>
            <button
              onClick={onShake}
              className="w-full px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded font-medium"
            >
              🌊 Shake Chain
            </button>
          </div>
        )}
      </div>
      
      {/* 曲线类型选择 */}
      <div className="space-y-2">
        <h3 className="text-xs font-medium text-gray-600 uppercase tracking-wide">Curve</h3>
        <div className="grid grid-cols-3 gap-1">
          {(['arc', 'sine', 'free'] as const).map(type => (
            <button
              key={type}
              onClick={() => setParams(p => ({ ...p, curveType: type }))}
              className={`px-2 py-1 text-xs rounded border transition-all ${
                params.curveType === type 
                  ? 'border-gray-900 bg-gray-900 text-white' 
                  : 'border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50'
              }`}
            >
              {type === 'arc' ? 'Arc' : type === 'sine' ? 'Sine' : 'Free'}
            </button>
          ))}
        </div>
      </div>

      {/* 基础参数 - 增加平滑过渡 */}
      <div className="space-y-3">
        <h3 className="text-xs font-medium text-gray-600 uppercase tracking-wide">Basic</h3>
        
        <div>
          <div className="flex justify-between items-center text-xs text-gray-700 mb-1">
            <span>Segments</span>
            <div className="flex items-center space-x-2">
              <span className="text-gray-900 font-mono">{params.segments}</span>
              <button
                onClick={() => smoothTransition('segments', Math.random() * 8 + 3)}
                className="text-xs text-blue-600 hover:text-blue-800"
                title="随机平滑过渡"
              >
                🎲
              </button>
            </div>
          </div>
          <input
            type="range"
            min="2"
            max="12"
            value={params.segments}
            onChange={(e) => setParams(p => ({ ...p, segments: parseInt(e.target.value) }))}
            className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        <div>
          <div className="flex justify-between items-center text-xs text-gray-700 mb-1">
            <span>Link length</span>
            <div className="flex items-center space-x-2">
              <span className="text-gray-900 font-mono">{params.linkLength}px</span>
              <button
                onClick={() => smoothTransition('linkLength', Math.random() * 90 + 30)}
                className="text-xs text-blue-600 hover:text-blue-800"
                title="随机平滑过渡"
              >
                🎲
              </button>
            </div>
          </div>
          <input
            type="range"
            min="30"
            max="120"
            value={params.linkLength}
            onChange={(e) => setParams(p => ({ ...p, linkLength: parseInt(e.target.value) }))}
            className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
        </div>
      </div>

      {/* 曲线参数 - 增加平滑过渡 */}
      <div className="space-y-3">
        <h3 className="text-xs font-medium text-gray-600 uppercase tracking-wide">Curve Params</h3>
        
        <div>
          <div className="flex justify-between items-center text-xs text-gray-700 mb-1">
            <span>Curvature</span>
            <div className="flex items-center space-x-2">
              <span className="text-gray-900 font-mono">{params.curvature.toFixed(1)}</span>
              <button
                onClick={() => smoothTransition('curvature', Math.random() * 2.9 + 0.1)}
                className="text-xs text-blue-600 hover:text-blue-800"
                title="随机平滑过渡"
              >
                🎲
              </button>
            </div>
          </div>
          <input
            type="range"
            min="0.1"
            max="3.0"
            step="0.1"
            value={params.curvature}
            onChange={(e) => setParams(p => ({ ...p, curvature: parseFloat(e.target.value) }))}
            className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        <div>
          <div className="flex justify-between items-center text-xs text-gray-700 mb-1">
            <span>Length</span>
            <div className="flex items-center space-x-2">
              <span className="text-gray-900 font-mono">{params.curveLength}px</span>
              <button
                onClick={() => smoothTransition('curveLength', Math.random() * 350 + 150)}
                className="text-xs text-blue-600 hover:text-blue-800"
                title="随机平滑过渡"
              >
                🎲
              </button>
            </div>
          </div>
          <input
            type="range"
            min="150"
            max="500"
            value={params.curveLength}
            onChange={(e) => setParams(p => ({ ...p, curveLength: parseInt(e.target.value) }))}
            className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
        </div>
      </div>

      {/* 显示选项 */}
      <div className="space-y-2">
        <h3 className="text-xs font-medium text-gray-600 uppercase tracking-wide">Display</h3>
        <div className="grid grid-cols-2 gap-1 text-xs">
          {Object.entries({
            showCurve: 'Curve',
            showJoints: 'Joints',
            showPivots: 'Pivots',
            showTrail: 'Trail',
            showLabels: 'Labels',
            showMfg: 'Laser'
          }).map(([key, label]) => (
            <label key={key} className="flex items-center space-x-1">
              <input
                type="checkbox"
                checked={showOptions[key as keyof ShowOptions]}
                onChange={(e) => setShowOptions(o => ({ ...o, [key]: e.target.checked }))}
                className="w-3 h-3 rounded"
              />
              <span className="text-gray-700">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* 锚点控制 */}
      <div className="space-y-2">
        <h3 className="text-xs font-medium text-gray-600 uppercase tracking-wide">Anchor</h3>
        <label className="flex items-center space-x-2 text-xs">
          <input
            type="checkbox"
            checked={anchorMode}
            onChange={(e) => setAnchorMode(e.target.checked)}
            className="w-3 h-3 rounded"
          />
          <span className="text-gray-700">Anchor mode</span>
        </label>
        <div className="flex space-x-1">
          <button
            onClick={() => {
              setAnchor({ id: null, world: null });
              setAnchorMode(false);
              if (mechanism && typeof mechanism.setAnchor === 'function') {
                mechanism.setAnchor(null, null);
              }
            }}
            className="flex-1 px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-900 text-xs rounded border border-gray-300"
          >
            Clear
          </button>
          <span className="text-xs text-gray-500 px-2 py-1 bg-gray-50 rounded border border-gray-200">
            {anchor?.id || 'none'}
          </span>
        </div>
      </div>

      {/* 控制按钮 */}
      <div className="flex space-x-1">
        <button
          onClick={onReset}
          className="flex-1 px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-900 text-xs rounded border border-gray-300"
        >
          Reset
        </button>
        <button
          onClick={onRandomize}
          className="flex-1 px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded"
        >
          Random
        </button>
        <button
          onClick={onExportSVG}
          className="flex-1 px-2 py-1 bg-green-500 hover:bg-green-600 text-white text-xs rounded"
        >
          Export
        </button>
      </div>
    </div>
  );
};