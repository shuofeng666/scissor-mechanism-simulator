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
    <div className="absolute bottom-4 left-4 bg-black/80 text-white text-xs p-2 rounded">
      <div>🖱️ Wheel: zoom · Drag: pan</div>
      <div>✏️ Free draw: drag on canvas</div>
      <div>⚓ Anchor: toggle & click node</div>
      {curveType === 'free' && (
        <div className="text-yellow-300">
          {isDrawing ? '✏️ Drawing...' : '✏️ Free: drag to draw'}
        </div>
      )}
      {anchor?.id && (
        <div className="text-blue-300">⚓ Anchored: {anchor.id}</div>
      )}
      <div className="text-gray-400">
        Scale: {(viewState.scale * 100).toFixed(0)}% · 
        Offset: {viewState.offsetX.toFixed(0)},{viewState.offsetY.toFixed(0)}
      </div>
    </div>
  );
};