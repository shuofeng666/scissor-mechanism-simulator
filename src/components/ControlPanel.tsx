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
  setPhysicsEnabled
}) => {
  return (
    <div className="absolute top-4 left-4 w-80 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg shadow-lg p-4 space-y-4 max-h-[90vh] overflow-y-auto">
      <h1 className="text-lg font-bold text-gray-900">Scissor Mechanism</h1>
      
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
              className={`px-2 py-1 text-xs rounded border ${
                params.curveType === type 
                  ? 'border-gray-900 bg-gray-900 text-white' 
                  : 'border-gray-300 hover:border-gray-400 bg-white'
              }`}
            >
              {type === 'arc' ? 'Arc' : type === 'sine' ? 'Sine' : 'Free'}
            </button>
          ))}
        </div>
      </div>

      {/* 基础参数 */}
      <div className="space-y-3">
        <h3 className="text-xs font-medium text-gray-600 uppercase tracking-wide">Basic</h3>
        
        <div>
          <label className="flex justify-between text-xs text-gray-700 mb-1">
            <span>Segments</span>
            <span className="text-gray-900 font-mono">{params.segments}</span>
          </label>
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
          <label className="flex justify-between text-xs text-gray-700 mb-1">
            <span>Link length</span>
            <span className="text-gray-900 font-mono">{params.linkLength}px</span>
          </label>
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

      {/* 曲线参数 */}
      <div className="space-y-3">
        <h3 className="text-xs font-medium text-gray-600 uppercase tracking-wide">Curve Params</h3>
        
        <div>
          <label className="flex justify-between text-xs text-gray-700 mb-1">
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
            className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        <div>
          <label className="flex justify-between text-xs text-gray-700 mb-1">
            <span>Length</span>
            <span className="text-gray-900 font-mono">{params.curveLength}px</span>
          </label>
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