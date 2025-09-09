// src/components/StatusPanel.tsx (增强版)
'use client';

import React from 'react';
import { ImprovedScissorMechanism } from '../lib/ScissorMechanism';

interface StatusPanelProps {
  mechanism: ImprovedScissorMechanism;
  physicsEnabled?: boolean;
  fps?: number;
  isAnimating?: boolean;
}

export const StatusPanel: React.FC<StatusPanelProps> = ({ 
  mechanism, 
  physicsEnabled = false, 
  fps = 60,
  isAnimating = false 
}) => {
  const integrity = mechanism.getIntegrity();

  // FPS 颜色指示
  const getFPSColor = (fps: number) => {
    if (fps >= 50) return 'text-green-600';
    if (fps >= 30) return 'text-yellow-600';
    return 'text-red-600';
  };

  // FPS 状态点颜色
  const getFPSIndicator = (fps: number) => {
    if (fps >= 50) return 'bg-green-600';
    if (fps >= 30) return 'bg-yellow-600';
    return 'bg-red-600';
  };

  return (
    <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg shadow-lg p-3">
      <div className="space-y-1 text-xs">
        <div className="font-medium text-gray-900">Status</div>
        
        {/* 🎬 动画状态 */}
        <div className="flex items-center space-x-1">
          <span className="text-gray-600">Animation:</span>
          <span className={`inline-flex items-center space-x-1 ${
            isAnimating ? 'text-purple-600' : 'text-gray-600'
          }`}>
            <span className={`w-2 h-2 rounded-full ${
              isAnimating ? 'bg-purple-600 animate-pulse' : 'bg-gray-400'
            }`}></span>
            <span className="font-mono">{isAnimating ? 'Running' : 'Stopped'}</span>
          </span>
        </div>
        
        {/* 🚀 物理状态 */}
        <div className="flex items-center space-x-1">
          <span className="text-gray-600">Physics:</span>
          <span className={`inline-flex items-center space-x-1 ${
            physicsEnabled ? 'text-blue-600' : 'text-gray-600'
          }`}>
            <span className={`w-2 h-2 rounded-full ${
              physicsEnabled ? 'bg-blue-600' : 'bg-gray-400'
            }`}></span>
            <span className="font-mono">{physicsEnabled ? 'Active' : 'Disabled'}</span>
          </span>
        </div>

        {/* 🎯 性能监控 */}
        <div className="flex items-center space-x-1">
          <span className="text-gray-600">FPS:</span>
          <span className={`inline-flex items-center space-x-1 ${getFPSColor(fps)}`}>
            <span className={`w-2 h-2 rounded-full ${getFPSIndicator(fps)}`}></span>
            <span className="font-mono">{fps}</span>
          </span>
        </div>
        
        <div className="grid grid-cols-2 gap-x-3 gap-y-1">
          <div>
            <span className="text-gray-600">Curve:</span>
            <span className="ml-1 text-gray-900 font-mono capitalize">{mechanism.curveType}</span>
          </div>
          <div>
            <span className="text-gray-600">Segments:</span>
            <span className="ml-1 text-gray-900 font-mono">{mechanism.segments}</span>
          </div>
          <div>
            <span className="text-gray-600">Pivots:</span>
            <span className="ml-1 text-gray-900 font-mono">{mechanism.pivots.length}</span>
          </div>
          <div>
            <span className="text-gray-600">Joints:</span>
            <span className="ml-1 text-gray-900 font-mono">{mechanism.joints.length}</span>
          </div>
          <div className="col-span-2">
            <span className="text-gray-600">Length:</span>
            <span className="ml-1 text-gray-900 font-mono">{Math.round(mechanism.polylineArcLength())}px</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-1 pt-1 border-t border-gray-200">
          <span className="text-gray-600">Integrity:</span>
          <span className={`inline-flex items-center space-x-1 ${
            integrity.level === 'good' ? 'text-green-600' : 
            integrity.level === 'warning' ? 'text-yellow-600' : 'text-red-600'
          }`}>
            <span className={`w-2 h-2 rounded-full ${
              integrity.level === 'good' ? 'bg-green-600' : 
              integrity.level === 'warning' ? 'bg-yellow-600' : 'bg-red-600'
            }`}></span>
            <span className="font-mono">{integrity.text}</span>
          </span>
        </div>

        {/* 🎨 当前模式指示 */}
        <div className="text-xs text-gray-500 pt-1 border-t border-gray-200">
          {isAnimating && physicsEnabled ? '🎬⚡ Animation + Physics' :
           isAnimating ? '🎬 Animation Mode' :
           physicsEnabled ? '⚡ Physics Mode' :
           '📐 Geometry Mode'}
        </div>
      </div>
    </div>
  );
};