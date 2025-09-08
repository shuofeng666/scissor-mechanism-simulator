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
    <div className="absolute bottom-4 left-4 bg-black/80 text-white text-xs p-3 rounded-lg max-w-xs">
      <div className="space-y-1">
        <div className="font-medium text-yellow-300">🖱️ Mouse Controls:</div>
        <div>• Scroll wheel: Zoom in/out</div>
        <div>• Right click + drag: Pan view</div>
        <div>• Left click: Draw free curve (in Free mode)</div>
        <div>• Left click: Select anchor (in Anchor mode)</div>
        
        {curveType === 'free' && (
          <div className="text-yellow-300 mt-2">
            {isDrawing ? '✏️ Drawing curve...' : '✏️ Free mode: Left drag to draw'}
          </div>
        )}
        
        {anchor?.id && (
          <div className="text-blue-300 mt-2">
            ⚓ Anchored: {anchor.id}
          </div>
        )}
        
        <div className="text-gray-400 mt-2 pt-1 border-t border-gray-600">
          Scale: {(viewState.scale * 100).toFixed(0)}% | 
          Offset: ({viewState.offsetX.toFixed(0)}, {viewState.offsetY.toFixed(0)})
        </div>
      </div>
    </div>
  );
};