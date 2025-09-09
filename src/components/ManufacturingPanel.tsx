// src/components/ManufacturingPanel.tsx (简洁版)
'use client';

import React from 'react';
import { ManufacturingParams } from '../types';

interface ManufacturingPanelProps {
  params: ManufacturingParams;
  setParams: (params: ManufacturingParams | ((prev: ManufacturingParams) => ManufacturingParams)) => void;
}

export const ManufacturingPanel: React.FC<ManufacturingPanelProps> = ({ params, setParams }) => {
  return (
    <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg shadow-lg p-4">
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-800">Manufacturing</h3>
        
        {/* 主要参数 */}
        <div className="space-y-3">
          <div>
            <label className="flex justify-between text-sm text-gray-700 mb-2">
              <span>Link Width</span>
              <span className="text-gray-900 font-mono">{params.linkWidth}mm</span>
            </label>
            <input
              type="range"
              min="5"
              max="25"
              step="0.5"
              value={params.linkWidth}
              onChange={(e) => setParams(p => ({ ...p, linkWidth: parseFloat(e.target.value) }))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>
          
          <div>
            <label className="flex justify-between text-sm text-gray-700 mb-2">
              <span>Hole Diameter</span>
              <span className="text-gray-900 font-mono">{params.holeDia}mm</span>
            </label>
            <input
              type="range"
              min="2"
              max="10"
              step="0.1"
              value={params.holeDia}
              onChange={(e) => setParams(p => ({ ...p, holeDia: parseFloat(e.target.value) }))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>
        
        {/* 高级参数 */}
        <details className="group">
          <summary className="cursor-pointer text-sm text-gray-700 hover:text-gray-900 select-none">
            Advanced Settings
          </summary>
          <div className="mt-3 space-y-3 pl-4 border-l-2 border-gray-100">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Tolerance</label>
                <input
                  type="number"
                  value={params.groupTol}
                  onChange={(e) => setParams(p => ({ ...p, groupTol: parseFloat(e.target.value) || 0.1 }))}
                  step="0.05"
                  min="0.01"
                  max="1"
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-600 mb-1">Spacing</label>
                <input
                  type="number"
                  value={params.spacing}
                  onChange={(e) => setParams(p => ({ ...p, spacing: parseFloat(e.target.value) || 6 }))}
                  step="0.5"
                  min="1"
                  max="20"
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Per Row</label>
                <input
                  type="number"
                  value={params.perRow}
                  onChange={(e) => setParams(p => ({ ...p, perRow: parseInt(e.target.value) || 8 }))}
                  min="1"
                  max="20"
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-600 mb-1">Kerf</label>
                <input
                  type="number"
                  value={params.kerf}
                  onChange={(e) => setParams(p => ({ ...p, kerf: parseFloat(e.target.value) || 0 }))}
                  step="0.05"
                  min="0"
                  max="1"
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                />
              </div>
            </div>
          </div>
        </details>
        
        <div className="text-sm text-gray-500 pt-3 border-t border-gray-200">
          Enable "Manufacturing" display option to see preview
        </div>
      </div>
    </div>
  );
};