// src/components/StatusPanel.tsx (修复版)
'use client';

import React from 'react';
import { ImprovedScissorMechanism } from '../lib/ScissorMechanism';

interface StatusPanelProps {
  mechanism: ImprovedScissorMechanism;
  physicsEnabled?: boolean;
}

export const StatusPanel: React.FC<StatusPanelProps> = ({ 
  mechanism, 
  physicsEnabled = false
}) => {
  const integrity = mechanism.getIntegrity();

  return (
    <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg shadow-lg p-3">
      <div className="space-y-1 text-xs">
        <div className="font-medium text-gray-900">Status</div>
        
        {/* 🚀 物理状态 */}
        <div className="flex items-center space-x-1">
          <span className="text-gray-600">Mode:</span>
          <span className={`inline-flex items-center space-x-1 ${
            physicsEnabled ? 'text-blue-600' : 'text-gray-600'
          }`}>
            <span className={`w-2 h-2 rounded-full ${
              physicsEnabled ? 'bg-blue-600' : 'bg-gray-400'
            }`}></span>
            <span className="font-mono">{physicsEnabled ? 'Physics' : 'Geometry'}</span>
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
            <span className="text-gray-600">Length:</span>
            <span className="ml-1 text-gray-900 font-mono">{Math.round(mechanism.polylineArcLength())}</span>
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
      </div>
    </div>
  );
};