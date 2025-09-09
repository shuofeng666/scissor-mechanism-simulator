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

interface LinkInfo {
  Lmm: number;
}

interface GroupInfo {
  Lmm: number;
  count: number;
}

interface PlacementInfo {
  x: number;
  y: number;
  Lmm: number;
}

export const exportLinksToSVG = (
  mechanism: ImprovedScissorMechanism, 
  config: ExportConfig = {}
): string | null => {
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

  const allLinks: LinkInfo[] = [];
  for (const lk of mechanism.links) {
    if (!(lk.start && lk.end)) continue;
    const Lpx = Math.hypot(lk.end.x - lk.start.x, lk.end.y - lk.start.y);
    const Lmm = Lpx * px2mm;
    allLinks.push({ Lmm });
  }
  
  if (allLinks.length === 0) return null;

  const groups = new Map<string, GroupInfo>();
  const roundTo = (x: number, step: number): number => Math.round(x / step) * step;
  
  for (const item of allLinks) {
    const key = roundTo(item.Lmm, groupTol).toFixed(3);
    const existingGroup = groups.get(key);
    if (!existingGroup) {
      groups.set(key, { Lmm: parseFloat(key), count: 1 });
    } else {
      existingGroup.count++;
    }
  }
  
  const keys = Array.from(groups.keys()).sort((a, b) => parseFloat(a) - parseFloat(b));

  const margin = spacing;
  const rowGap = bodyW + spacing;
  let x = margin;
  let y = margin;
  let col = 0;
  let maxRowW = 0;
  const place: PlacementInfo[] = [];

  for (const k of keys) {
    const g = groups.get(k);
    if (!g) continue;
    
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

  const svgParts: string[] = [];
  svgParts.push(`<?xml version="1.0" encoding="UTF-8"?>`);
  svgParts.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${widthMM}mm" height="${heightMM}mm" viewBox="0 0 ${widthMM} ${heightMM}" version="1.1">`);
  svgParts.push(`<desc>Scissor links export · linkWidth=${linkWidth}mm hole=${holeDia}mm tol=${groupTol}mm px2mm=${px2mm} kerf=${kerf}</desc>`);
  svgParts.push(`<g fill="none" stroke="#ff0000" stroke-width="${strokeW}" stroke-linecap="round" stroke-linejoin="round">`);

  const capsulePath = (cx: number, cy: number, L: number, W: number): string => {
    const r = W / 2;
    const x1 = cx - L / 2;
    const x2 = cx + L / 2;
    const y1 = cy - r;
    const y2 = cy + r;
    return `M ${x1} ${y1} H ${x2} A ${r} ${r} 0 0 1 ${x2} ${y2} H ${x1} A ${r} ${r} 0 0 1 ${x1} ${y1} Z`;
  };

  for (const p of place) {
    const cx = p.x + p.Lmm / 2;
    const cy = p.y + bodyW / 2;
    svgParts.push(`<path d="${capsulePath(cx, cy, p.Lmm, bodyW)}"/>`);
    
    const r = holeD / 2; 
    const hx1 = cx - p.Lmm / 2;
    const hx2 = cx + p.Lmm / 2;
    const hxm = cx;
    const hy = cy;
    svgParts.push(`<circle cx="${hx1}" cy="${hy}" r="${r}"/>`);
    svgParts.push(`<circle cx="${hxm}" cy="${hy}" r="${r}"/>`);
    svgParts.push(`<circle cx="${hx2}" cy="${hy}" r="${r}"/>`);
  }
  
  svgParts.push(`</g></svg>`);
  return svgParts.join('\n');
};

export const downloadSVG = (svgContent: string, filename?: string): void => {
  try {
    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    a.download = filename || `scissor_links_${ts}.svg`;
    a.href = url;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to download SVG:', error);
    alert('Failed to download SVG file. Please try again.');
  }
};