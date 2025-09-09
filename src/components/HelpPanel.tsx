// src/components/HelpPanel.tsx (简洁版)
'use client';

import React from 'react';
import { ViewState, AnchorState } from '../types';

interface HelpPanelProps {
  curveType: string;
  isDrawing: boolean;
  anchor: AnchorState;
  viewState: ViewState;
}

export const HelpPanel: React.FC<HelpPanelProps> = ({ curveType, isDrawing, anchor, viewState }) => {
  return (
    <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg shadow-lg p-6">
      <div className="grid md:grid-cols-3 gap-8">
        {/* 基础控制 */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Mouse Controls</h4>
          <div className="space-y-2 text-sm text-gray-600">
            <div><span className="font-medium text-gray-800">Scroll wheel:</span> Zoom in/out</div>
            <div><span className="font-medium text-gray-800">Right click + drag:</span> Pan view</div>
            <div><span className="font-medium text-gray-800">Left click:</span> {curveType === 'free' ? 'Draw curve' : 'Select anchor'}</div>
          </div>
          
          {curveType === 'free' && (
            <div className="mt-4 p-3 bg-green-50 rounded border border-green-200">
              <div className="text-green-800 font-medium text-sm">Free Draw Mode</div>
              <div className="text-green-600 text-sm mt-1">
                {isDrawing ? 'Drawing curve...' : 'Drag to draw custom curve'}
              </div>
            </div>
          )}
          
          {anchor?.id && (
            <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
              <div className="text-blue-800 font-medium text-sm">Anchor Active</div>
              <div className="text-blue-600 text-sm mt-1">Fixed point: {anchor.id}</div>
            </div>
          )}
        </div>

        {/* 面板控制 */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Panel Controls</h4>
          <div className="space-y-2 text-sm text-gray-600">
            <div><span className="font-medium text-gray-800">Controls:</span> Main parameters and physics</div>
            <div><span className="font-medium text-gray-800">Status:</span> System information</div>
            <div><span className="font-medium text-gray-800">Manufacturing:</span> Export settings</div>
            <div><span className="font-medium text-gray-800">Help:</span> This guide</div>
          </div>
          
          <div className="mt-4 p-3 bg-amber-50 rounded border border-amber-200">
            <div className="text-amber-800 font-medium text-sm">Quick Access</div>
            <div className="text-amber-600 text-sm mt-1">
              Use the top toolbar for Reset, Random, and Export
            </div>
          </div>
        </div>

        {/* 功能说明 */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Features</h4>
          <div className="space-y-2 text-sm text-gray-600">
            <div><span className="font-medium text-gray-800">Physics Mode:</span> Realistic simulation</div>
            <div><span className="font-medium text-gray-800">Animation:</span> Auto gravity effects</div>
            <div><span className="font-medium text-gray-800">Anchor Mode:</span> Pin joints/pivots</div>
            <div><span className="font-medium text-gray-800">Free Draw:</span> Custom curves</div>
            <div><span className="font-medium text-gray-800">Export SVG:</span> Laser cutting files</div>
          </div>
          
          <div className="mt-4 p-3 bg-purple-50 rounded border border-purple-200">
            <div className="text-purple-800 font-medium text-sm">Animation Effects</div>
            <div className="text-purple-600 text-sm mt-1">
              Try Explosion and Wave buttons in Physics mode
            </div>
          </div>
        </div>
      </div>
      
      {/* 底部状态栏 */}
      <div className="mt-6 pt-4 border-t border-gray-200 flex justify-between items-center text-sm text-gray-500">
        <div>
          Scale: {(viewState.scale * 100).toFixed(0)}% | 
          Offset: ({viewState.offsetX.toFixed(0)}, {viewState.offsetY.toFixed(0)})
        </div>
        <div>
          Click Help button to close this panel
        </div>
      </div>
    </div>
  );
};