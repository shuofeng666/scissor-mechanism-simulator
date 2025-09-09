// src/components/ControlPanel.tsx (简洁版)
'use client';

import React from 'react';
import { MechanismParams, ShowOptions, AnchorState } from '../types';
import { ImprovedScissorMechanism } from '../lib/ScissorMechanism';

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
  animationEnabled: boolean;
  setAnimationEnabled: (enabled: boolean) => void;
  animationPreset: 'gentle' | 'dynamic' | 'chaotic';
  setAnimationPreset: (preset: 'gentle' | 'dynamic' | 'chaotic') => void;
  onExplosion: () => void;
  onWave: (direction: 'left' | 'right' | 'up' | 'down') => void;
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
  animationEnabled,
  setAnimationEnabled,
  animationPreset,
  setAnimationPreset,
  onExplosion,
  onWave
}) => {
  return (
    <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg shadow-lg p-4 space-y-4 h-full overflow-y-auto">
      
      {/* 物理模拟 */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-800">Physics Simulation</h3>
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={physicsEnabled}
            onChange={(e) => setPhysicsEnabled(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300"
          />
          <span className={`text-sm ${physicsEnabled ? 'text-blue-600 font-medium' : 'text-gray-700'}`}>
            Enable Physics
          </span>
        </label>
        
        {physicsEnabled && (
          <div className="space-y-3 pl-4 border-l-2 border-blue-100">
            {/* 基础控制 */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={onShake}
                className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm rounded border border-blue-200 transition-colors"
              >
                Shake
              </button>
              <button
                onClick={onExplosion}
                className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 text-sm rounded border border-red-200 transition-colors"
              >
                Explosion
              </button>
            </div>

            {/* 动画控制 */}
            <div className="bg-purple-50 p-3 rounded border border-purple-200">
              <label className="flex items-center space-x-2 mb-3">
                <input
                  type="checkbox"
                  checked={animationEnabled}
                  onChange={(e) => setAnimationEnabled(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <span className={`text-sm ${animationEnabled ? 'text-purple-600 font-medium' : 'text-gray-700'}`}>
                  Auto Animation
                </span>
              </label>

              {animationEnabled && (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-600 mb-2 block">Animation Style</label>
                    <div className="grid grid-cols-3 gap-1">
                      {(['gentle', 'dynamic', 'chaotic'] as const).map(preset => (
                        <button
                          key={preset}
                          onClick={() => setAnimationPreset(preset)}
                          className={`px-2 py-1 text-xs rounded transition-all capitalize ${
                            animationPreset === preset 
                              ? 'bg-purple-600 text-white' 
                              : 'bg-white hover:bg-purple-100 border border-purple-300 text-purple-700'
                          }`}
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-gray-600 mb-2 block">Wave Effects</label>
                    <div className="grid grid-cols-4 gap-1">
                      <button onClick={() => onWave('up')} className="px-2 py-1 bg-cyan-50 hover:bg-cyan-100 text-cyan-700 text-xs rounded border border-cyan-200">Up</button>
                      <button onClick={() => onWave('down')} className="px-2 py-1 bg-cyan-50 hover:bg-cyan-100 text-cyan-700 text-xs rounded border border-cyan-200">Down</button>
                      <button onClick={() => onWave('left')} className="px-2 py-1 bg-cyan-50 hover:bg-cyan-100 text-cyan-700 text-xs rounded border border-cyan-200">Left</button>
                      <button onClick={() => onWave('right')} className="px-2 py-1 bg-cyan-50 hover:bg-cyan-100 text-cyan-700 text-xs rounded border border-cyan-200">Right</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* 曲线类型 */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-800">Curve Type</h3>
        <div className="grid grid-cols-3 gap-2">
          {(['arc', 'sine', 'free'] as const).map(type => (
            <button
              key={type}
              onClick={() => setParams(p => ({ ...p, curveType: type }))}
              className={`px-3 py-2 text-sm rounded border transition-all capitalize ${
                params.curveType === type 
                  ? 'border-gray-800 bg-gray-800 text-white' 
                  : 'border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 text-gray-700'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
        
        {params.curveType === 'free' && (
          <div className="text-sm text-green-700 bg-green-50 p-3 rounded border border-green-200">
            <div className="font-medium mb-1">Free Draw Mode</div>
            <div className="text-xs text-green-600">Left click and drag on canvas to draw</div>
          </div>
        )}
      </div>

      {/* 参数控制 */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-800">Parameters</h3>
        
        <div>
          <label className="flex justify-between text-sm text-gray-700 mb-2">
            <span>Segments</span>
            <span className="text-gray-900 font-mono">{params.segments}</span>
          </label>
          <input
            type="range"
            min="2"
            max="12"
            value={params.segments}
            onChange={(e) => setParams(p => ({ ...p, segments: parseInt(e.target.value) }))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        <div>
          <label className="flex justify-between text-sm text-gray-700 mb-2">
            <span>Link Length</span>
            <span className="text-gray-900 font-mono">{params.linkLength}px</span>
          </label>
          <input
            type="range"
            min="30"
            max="120"
            value={params.linkLength}
            onChange={(e) => setParams(p => ({ ...p, linkLength: parseInt(e.target.value) }))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        <div>
          <label className="flex justify-between text-sm text-gray-700 mb-2">
            <span>Curvature</span>
            <span className="text-gray-900 font-mono">{params.curvature.toFixed(1)}</span>
          </label>
          <input
            type="range"
            min="0.1"
            max="3.0"
            step="0.1"
            value={params.curvature}
            onChange={(e) => setParams(p => ({ ...p, curvature: parseFloat(e.target.value) }))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        <div>
          <label className="flex justify-between text-sm text-gray-700 mb-2">
            <span>Curve Length</span>
            <span className="text-gray-900 font-mono">{params.curveLength}px</span>
          </label>
          <input
            type="range"
            min="150"
            max="500"
            value={params.curveLength}
            onChange={(e) => setParams(p => ({ ...p, curveLength: parseInt(e.target.value) }))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
        </div>
      </div>

      {/* 显示选项 */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-800">Display Options</h3>
        <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
          {Object.entries({
            showCurve: 'Curve',
            showJoints: 'Joints',
            showPivots: 'Pivots',
            showTrail: 'Trail',
            showLabels: 'Labels',
            showMfg: 'Manufacturing'
          }).map(([key, label]) => (
            <label key={key} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={showOptions[key as keyof ShowOptions]}
                onChange={(e) => setShowOptions(o => ({ ...o, [key]: e.target.checked }))}
                className="w-4 h-4 rounded border-gray-300"
              />
              <span className="text-gray-700">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* 锚点控制 */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-800">Anchor Control</h3>
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={anchorMode}
            onChange={(e) => setAnchorMode(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300"
          />
          <span className="text-sm text-gray-700">Anchor mode</span>
        </label>
        <div className="flex space-x-2">
          <button
            onClick={() => {
              setAnchor({ id: null, world: null });
              setAnchorMode(false);
              if (mechanism && typeof mechanism.setAnchor === 'function') {
                mechanism.setAnchor(null, null);
              }
            }}
            className="flex-1 px-3 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 text-sm rounded border border-gray-300 transition-colors"
          >
            Clear
          </button>
          <div className="flex-1 text-sm text-gray-500 px-3 py-2 bg-gray-50 rounded border border-gray-200 text-center">
            {anchor?.id || 'none'}
          </div>
        </div>
      </div>
    </div>
  );
};