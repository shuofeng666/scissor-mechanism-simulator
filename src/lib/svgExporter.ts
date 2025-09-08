import { ImprovedScissorMechanism } from './ScissorMechanism';

export interface ExportConfig {
  linkWidth?: number;
  holeDia?: number;
  groupTol?: number;
  spacing?: number;
  px2mm?: number;
  strokeW?: number;
  kerf?: number;
  perRow?: number;
}

export const exportLinksToSVG = (mechanism: ImprovedScissorMechanism, config: ExportConfig = {}): string | null => {
  const {
    linkWidth = 12, 
    holeDia = 4, 
    groupTol = 0.1, 
    spacing = 6,
    px2mm = 1, 
    strokeW = 0.1, 
    kerf = 0, 
    perRow = 8
  } = config;

  const bodyW = Math.max(0.1, linkWidth + kerf);
  const holeD = Math.max(0.1, holeDia + kerf);

  // 收集所有连杆长度
  const allLinks = [];
  for (const lk of mechanism.links) {
    if (!(lk.start && lk.end)) continue;
    const Lpx = Math.hypot(lk.end.x - lk.start.x, lk.end.y - lk.start.y);
    const Lmm = Lpx * px2mm;
    allLinks.push({ Lmm });
  }
  
  if (allLinks.length === 0) return null;

  // 按长度分组
  const groups = new Map<string, { Lmm: number; count: number }>();
  const roundTo = (x: number, step: number) => Math.round(x / step) * step;
  
  for (const item of allLinks) {
    const key = roundTo(item.Lmm, groupTol).toFixed(3);
    if (!groups.has(key)) {
      groups.set(key, { Lmm: +key, count: 0 });
    }
    groups.get(key)!.count++;
  }
  
  const keys = Array.from(groups.keys()).sort((a, b) => parseFloat(a) - parseFloat(b));

  // 布局计算
  const margin = spacing;
  const rowGap = bodyW + spacing;
  let x = margin, y = margin, col = 0, maxRowW = 0;
  const place: Array<{ x: number; y: number; Lmm: number }> = [];

  for (const k of keys) {
    const g = groups.get(k)!;
    for (let i = 0; i < g.count; i++) {
      place.push({ x, y, Lmm: g.Lmm });
      x += g.Lmm + spacing + bodyW;
      col++; 
      maxRowW = Math.max(maxRowW, x);
      if (col >= perRow) { 
        col = 0; 
        x = margin; 
        y += rowGap + bodyW; 
      }
    }
    if (col !== 0) { 
      col = 0; 
      x = margin; 
      y += rowGap + bodyW; 
    }
  }

  const widthMM = Math.max(maxRowW, perRow * (spacing + bodyW)) + margin;
  const heightMM = y + margin + bodyW;

  // 生成 SVG
  const svgParts: string[] = [];
  svgParts.push(`<?xml version="1.0" encoding="UTF-8"?>`);
  svgParts.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${widthMM}mm" height="${heightMM}mm" viewBox="0 0 ${widthMM} ${heightMM}" version="1.1">`);
  svgParts.push(`<desc>Scissor links export · linkWidth=${linkWidth}mm hole=${holeDia}mm tol=${groupTol}mm px2mm=${px2mm} kerf=${kerf}</desc>`);
  svgParts.push(`<g fill="none" stroke="#ff0000" stroke-width="${strokeW}" stroke-linecap="round" stroke-linejoin="round">`);

  const capsulePath = (cx: number, cy: number, L: number, W: number): string => {
    const r = W / 2;
    const x1 = cx - L / 2, x2 = cx + L / 2, y1 = cy - r, y2 = cy + r;
    return `M ${x1} ${y1} H ${x2} A ${r} ${r} 0 0 1 ${x2} ${y2} H ${x1} A ${r} ${r} 0 0 1 ${x1} ${y1} Z`;
  };

  for (const p of place) {
    const cx = p.x + p.Lmm / 2;
    const cy = p.y + bodyW / 2;
    svgParts.push(`<path d="${capsulePath(cx, cy, p.Lmm, bodyW)}"/>`);
    
    const r = holeD / 2; 
    const hx1 = cx - p.Lmm / 2, hx2 = cx + p.Lmm / 2, hy = cy;
    svgParts.push(`<circle cx="${hx1}" cy="${hy}" r="${r}"/>`);
    svgParts.push(`<circle cx="${hx2}" cy="${hy}" r="${r}"/>`);
  }
  
  svgParts.push(`</g></svg>`);
  return svgParts.join('\n');
};

export const downloadSVG = (svgContent: string, filename?: string): void => {
  const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  a.download = filename || `scissor_links_${ts}.svg`;
  a.href = url;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};