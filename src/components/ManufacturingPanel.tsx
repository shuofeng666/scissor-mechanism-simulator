'use client';

import React from 'react';
import { ManufacturingParams } from '../types';

interface ManufacturingPanelProps {
  params: ManufacturingParams;
  setParams: (params: ManufacturingParams | ((prev: ManufacturingParams) => ManufacturingParams)) => void;
}

export const ManufacturingPanel: React.FC<ManufacturingPanelProps> = ({ params, setParams }) => {
  return (
    <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg shadow-lg p-3">
      <div className="space-y-2 text-xs">
        <div className="font-medium text-gray-900">Manufacturing (SVG)</div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-gray-600 mb-1">Width (mm)</label>
            <input
              type="number"
              value={params.linkWidth}
              onChange={(e) => setParams(p => ({ ...p, linkWidth: parseFloat(e.target.value) }))}
              step="0.1"
              className="w-full px-1 py-1 text-xs border border-gray-300 rounded"
            />
          </div>
          <div>
            <label className="block text-gray-600 mb-1">Hole Ø (mm)</label>
            <input
              type="number"
              value={params.holeDia}
              onChange={(e) => setParams(p => ({ ...p, holeDia: parseFloat(e.target.value) }))}
              step="0.1"
              className="w-full px-1 py-1 text-xs border border-gray-300 rounded"
            />
          </div>
        {/*   <div>
            <label className="block text-gray-600 mb-1">px→mm</label>
            <input
              type="number"
              value={params.px2mm}
              onChange={(e) => setParams(p => ({ ...p, px2mm: parseFloat(e.target.value) }))}
              step="0.01"
              className="w-full px-1 py-1 text-xs border border-gray-300 rounded"
            />
          </div>
          <div>
            <label className="block text-gray-600 mb-1">Per row</label>
            <input
              type="number"
              value={params.perRow}
              onChange={(e) => setParams(p => ({ ...p, perRow: parseInt(e.target.value) }))}
              min="1"
              className="w-full px-1 py-1 text-xs border border-gray-300 rounded"
            />
          </div> */}
        </div>
      </div>
    </div>
  );
};