// p5 主循环 + 视图交互 + 自由绘
let canvas;
window.curvedScissorMechanism = undefined;
window.gui = undefined;

window.currentCurveType = 'arc';
window.showCurve  = true;
window.showJoints = true;
window.showPivots = true;
window.showTrail  = false;
window.showLabels = true;

// 自由绘曲线（相对中心坐标）
window.freeCurve = [];
let isDrawingFree = false;
let freeRaw = [];

// 视图
let viewScale = 1.0, viewOffsetX = 0, viewOffsetY = 0;
let isDragging = false, lastMouseX = 0, lastMouseY = 0;

function setup(){
  canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent(document.body);

  window.curvedScissorMechanism = new ImprovedScissorMechanism();
  window.curvedScissorMechanism.setCenter(width/2, height/2);

  window.gui = new GUI();
  window.gui.updateDisplay();
}

function draw(){
  background('#ffffff');
  drawGrid();

  push();
  translate(width/2 + viewOffsetX, height/2 + viewOffsetY);
  scale(viewScale);
  translate(-width/2, -height/2);
  window.curvedScissorMechanism.update();
  window.curvedScissorMechanism.draw();
  pop();

  if (window.currentCurveType === 'free' && isDrawingFree && freeRaw.length >= 2) {
    push(); noFill(); stroke(80); strokeWeight(1); drawingContext.setLineDash([4,3]);
    beginShape();
    for (const p of freeRaw) {
      const sx = p.x * viewScale + (width/2 + viewOffsetX);
      const sy = p.y * viewScale + (height/2 + viewOffsetY);
      vertex(sx, sy);
    }
    endShape(); drawingContext.setLineDash([]); pop();
  }

  drawHUD();
}

function drawGrid(){
  push(); stroke(229,231,235); strokeWeight(1);
  for(let x=0;x<=width;x+=48) line(x,0,x,height);
  for(let y=0;y<=height;y+=48) line(0,y,width,y);
  pop();
}

function drawHUD(){
  const txt = [];
  if (window.currentCurveType === 'free') txt.push(isDrawingFree ? 'Free drawing…' : 'Free: drag to draw');
  txt.push(`FPS ${nf(frameRate(),2,1)}`);
  txt.push(`Scale ${(viewScale*100).toFixed(0)}%`);
  txt.push(`Offset ${viewOffsetX.toFixed(0)}, ${viewOffsetY.toFixed(0)}`);
  push(); fill(17); noStroke(); textSize(11);
  let x = width-170, y = height-62;
  for(let i=0;i<txt.length;i++) text(txt[i], x, y+i*14);
  pop();
}

function windowResized(){ resizeCanvas(windowWidth, windowHeight); window.curvedScissorMechanism.setCenter(width/2, height/2); }

// 坐标/几何工具
function screenToModelRelative(mx, my){
  const x1 = mx - (width/2 + viewOffsetX);
  const y1 = my - (height/2 + viewOffsetY);
  return { x: x1 / viewScale, y: y1 / viewScale };
}

function simplifyRDP(points, epsilon){
  if(points.length < 3) return points.slice();
  const dmaxInfo = (() => {
    let dmax = -1, idx = -1;
    const a = points[0], b = points[points.length-1];
    const A = b.y - a.y, B = a.x - b.x, C = b.x*a.y - a.x*b.y;
    for(let i=1;i<points.length-1;i++){
      const p = points[i];
      const d = Math.abs(A*p.x + B*p.y + C) / Math.hypot(A,B);
      if(d > dmax){ dmax = d; idx = i; }
    }
    return {dmax, idx};
  })();
  if(dmaxInfo.dmax > epsilon){
    const res1 = simplifyRDP(points.slice(0, dmaxInfo.idx+1), epsilon);
    const res2 = simplifyRDP(points.slice(dmaxInfo.idx), epsilon);
    return res1.slice(0,-1).concat(res2);
  }else{
    return [points[0], points[points.length-1]];
  }
}

function resampleByStep(points, step=2){
  if(points.length<2) return points.slice();
  const acc=[0];
  for(let i=1;i<points.length;i++) acc[i] = acc[i-1] + Math.hypot(points[i].x - points[i-1].x, points[i].y - points[i-1].y);
  const total = acc[acc.length-1]; if(total===0) return points.slice();
  const out = [];
  for(let s=0;s<=total;s+=step){
    let j=1; while(j<acc.length && acc[j]<s) j++;
    const t = (s - acc[j-1]) / (acc[j] - acc[j-1] || 1);
    const a=points[j-1], b=points[j];
    out.push({ x: a.x + (b.x-a.x)*t, y: a.y + (b.y-a.y)*t });
  }
  out.push(points[points.length-1]); return out;
}

// 键盘
function keyPressed(){
  switch(key){
    case 'p': case 'P': window.showPivots=!window.showPivots; document.getElementById('showPivots').checked=window.showPivots; break;
    case 'j': case 'J': window.showJoints=!window.showJoints; document.getElementById('showJoints').checked=window.showJoints; break;
    case 'l': case 'L': window.showLabels=!window.showLabels; document.getElementById('showLabels').checked=window.showLabels; break;
    case 'c': case 'C': window.showCurve=!window.showCurve; document.getElementById('showCurve').checked=window.showCurve; break;
    case 't': case 'T':
      window.showTrail=!window.showTrail; document.getElementById('showTrail').checked=window.showTrail;
      if(!window.showTrail) window.curvedScissorMechanism.trailPoints = []; break;
    case '1': document.querySelector('[data-curve="arc"]').click(); break;
    case '2': document.querySelector('[data-curve="sine"]').click(); break;
    case '3': document.querySelector('[data-curve="free"]').click(); break;
    case 'r': case 'R': if(keyIsDown(SHIFT)) resetView(); else window.gui.reset(); break;
    case ' ': centerView(); break;
  }
}

// 鼠标
function mouseWheel(e){ e.preventDefault(); if(mouseX<0||mouseX>width||mouseY<0||mouseY>height) return false; viewScale=constrain(viewScale*((e.delta<0)?1.1:1/1.1),0.2,5); return false; }
function mousePressed(){
  const inCanvas = mouseX>=0 && mouseX<=width && mouseY>=0 && mouseY<=height;
  const leftPanel = mouseX<=352 && mouseY<=720;
  const rightPanel= mouseX>=width-280 && mouseY<=360;
  if (!inCanvas || leftPanel || rightPanel) return;

  if (window.currentCurveType === 'free') {
    isDrawingFree = true; freeRaw = [];
    const p = screenToModelRelative(mouseX, mouseY); freeRaw.push(p); isDragging=false;
  } else {
    isDragging = true; lastMouseX=mouseX; lastMouseY=mouseY;
  }
}
function mouseDragged(){
  if (isDrawingFree && window.currentCurveType === 'free') {
    const p = screenToModelRelative(mouseX, mouseY);
    const last = freeRaw[freeRaw.length-1];
    if (!last || Math.hypot(p.x-last.x, p.y-last.y) > 1.5) freeRaw.push(p);
  } else if (isDragging) {
    viewOffsetX += mouseX-lastMouseX; viewOffsetY += mouseY-lastMouseY; lastMouseX=mouseX; lastMouseY=mouseY;
  }
}
function mouseReleased(){
  if (isDrawingFree && window.currentCurveType === 'free') {
    isDrawingFree = false;
    if (freeRaw.length >= 2) {
      const bbox = freeRaw.reduce((b,p)=>({minx:Math.min(b.minx,p.x),miny:Math.min(b.miny,p.y),maxx:Math.max(b.maxx,p.x),maxy:Math.max(b.maxy,p.y)}), {minx:Infinity,miny:Infinity,maxx:-Infinity,maxy:-Infinity});
      const span = Math.max(bbox.maxx-bbox.minx, bbox.maxy-bbox.miny);
      const eps = Math.max(0.8, span * 0.01);
      const simplified = simplifyRDP(freeRaw, eps);
      const resampled  = resampleByStep(simplified, 2);
      window.freeCurve = resampled;
      window.curvedScissorMechanism.setParams({ curveType: 'free' });
      window.gui.updateDisplay();
    }
  }
  isDragging = false;
}

function resetView(){ viewScale=1; viewOffsetX=0; viewOffsetY=0; }
function centerView(){ viewOffsetX=0; viewOffsetY=0; }
