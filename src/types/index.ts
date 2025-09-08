// 基础几何类型
export interface Point {
  x: number;
  y: number;
}

export interface ViewState {
  scale: number;
  offsetX: number;
  offsetY: number;
}

export interface CanvasSize {
  width: number;
  height: number;
}

// 机构参数
export interface MechanismParams {
  segments: number;
  linkLength: number;
  curvature: number;
  curveLength: number;
  curveType: 'arc' | 'sine' | 'free';
}

// 显示选项
export interface ShowOptions {
  showCurve: boolean;
  showJoints: boolean;
  showPivots: boolean;
  showTrail: boolean;
  showLabels: boolean;
  showMfg: boolean;
}

// 锚点状态
export interface AnchorState {
  id: string | null;
  world: Point | null;
}

// 制造参数
export interface ManufacturingParams {
  linkWidth: number;
  holeDia: number;
  groupTol: number;
  spacing: number;
  px2mm: number;
  strokeW: number;
  kerf: number;
  perRow: number;
}

// 节点拾取结果
export interface NodePickResult {
  id: string;
  type: 'pivot' | 'joint';
  world: Point;
}