// src/components/StatusPanel.tsx (简洁版)
'use client';

import React from 'react';
import { ImprovedScissorMechanism } from '../lib/ScissorMechanism';

interface StatusPanelProps {
  mechanism: ImprovedScissorMechanism;
  physicsEnabled?: boolean;
  animationEnabled?: boolean;
}

export const StatusPanel: React.FC<StatusPanelProps> = ({ 
  mechanism, 
  physicsEnabled = false,
  animationEnabled = false
}) => {
  const integrity = mechanism.getIntegrity();

  return (
    <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg shadow-lg p-4">
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-800">System Status</h3>
        
        {/* 模式状态 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Simulation Mode</span>
            <span className={`inline-flex items-center space-x-2 ${
              physicsEnabled ? 'text-blue-600' : 'text-gray-600'
            }`}>
              <span className={`w-2 h-2 rounded-full ${
                physicsEnabled ? 'bg-blue-600' : 'bg-gray-400'
              }`}></span>
              <span className="font-mono text-sm">{physicsEnabled ? 'Physics' : 'Geometry'}</span>
            </span>
          </div>

          {physicsEnabled && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Animation</span>
              <span className={`inline-flex items-center space-x-2 ${
                animationEnabled ? 'text-purple-600' : 'text-gray-400'
              }`}>
                <span className={`w-2 h-2 rounded-full ${
                  animationEnabled ? 'bg-purple-600 animate-pulse' : 'bg-gray-400'
                }`}></span>
                <span className="font-mono text-sm">{animationEnabled ? 'Active' : 'Off'}</span>
              </span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Integrity</span>
            <span className={`inline-flex items-center space-x-2 ${
              integrity.level === 'good' ? 'text-green-600' : 
              integrity.level === 'warning' ? 'text-amber-600' : 'text-red-600'
            }`}>
              <span className={`w-2 h-2 rounded-full ${
                integrity.level === 'good' ? 'bg-green-600' : 
                integrity.level === 'warning' ? 'bg-amber-600' : 'bg-red-600'
              }`}></span>
              <span className="font-mono text-sm">{integrity.text}</span>
            </span>
          </div>
        </div>
        
        {/* 机构信息 */}
        <div className="pt-3 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Curve</span>
              <span className="text-gray-900 font-mono capitalize">{mechanism.curveType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Segments</span>
              <span className="text-gray-900 font-mono">{mechanism.segments}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Pivots</span>
              <span className="text-gray-900 font-mono">{mechanism.pivots.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Length</span>
              <span className="text-gray-900 font-mono">{Math.round(mechanism.polylineArcLength())}</span>
            </div>
          </div>
        </div>

        {/* 动画提示 */}
        {physicsEnabled && animationEnabled && (
          <div className="text-sm text-purple-700 bg-purple-50 p-3 rounded border border-purple-200">
            <div className="font-medium">Auto Animation Active</div>
            <div className="text-xs text-purple-600 mt-1">Dynamic gravity and forces are running</div>
          </div>
        )}
      </div>
    </div>
  );
};