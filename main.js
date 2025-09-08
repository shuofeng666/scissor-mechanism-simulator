let canvas;
window.curvedScissorMechanism = undefined;
window.gui = undefined;

window.currentCurveType = 'arc';
window.showCurve  = true;
window.showJoints = true;
window.showPivots = true;
window.showTrail  = false;
window.showLabels = true;
window.showMfg    = true;     // NEW: preview manufacturing shapes

window.freeCurve = [];
let isDrawingFree = false;
let freeRaw = [];

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
  background('#ffffff'); drawGrid();

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
  if (window.currentCurveType === 'free')
    txt.push(isDrawingFree ? 'Free drawing…' : 'Free: drag to draw');
  txt.push(`FPS ${nf(frameRate(),2,1)}`);
  txt.push(`Scale ${(viewScale*100).toFixed(0)}%`);
  txt.push(`Offset ${viewOffsetX.toFixed(0)}, ${viewOffsetY.toFixed(0)}`);
  push(); fill(17); noStroke(); textSize(11);
  let x = width-170, y = height-62;
  for(let i=0;i<txt.length;i++) text(txt[i], x, y+i*14);
  pop();
}

function windowResized(){ resizeCanvas(windowWidth, windowHeight); window.curvedScissorMechanism.setCenter(width/2, height/2); }

// utils
function screenToModelRelative(mx, my){
  const x1 = mx - (width/2 + viewOffsetX);
  const y1 = my - (height/2 + viewOffsetY);
  return { x: x1 / viewScale, y: y1 / viewScale };
}
function simplifyRDP(points, epsilon){ /* unchanged from previous */ }
function resampleByStep(points, step=2){ /* unchanged from previous */ }

// keys
function keyPressed(){
  switch(key){
    case 'P': case 'p': window.showPivots=!window.showPivots; document.getElementById('showPivots').checked=window.showPivots; break;
    case 'J': case 'j': window.showJoints=!window.showJoints; document.getElementById('showJoints').checked=window.showJoints; break;
    case 'L': case 'l': window.showLabels=!window.showLabels; document.getElementById('showLabels').checked=window.showLabels; break;
    case 'M': case 'm': window.showMfg=!window.showMfg; document.getElementById('showMfg').checked=window.showMfg; break;
    case 'C': case 'c': window.showCurve=!window.showCurve; document.getElementById('showCurve').checked=window.showCurve; break;
    case 'T': case 't':
      window.showTrail=!window.showTrail; document.getElementById('showTrail').checked=window.showTrail;
      if(!window.showTrail) window.curvedScissorMechanism.trailPoints = []; break;
    case '1': document.querySelector('[data-curve="arc"]').click(); break;
    case '2': document.querySelector('[data-curve="sine"]').click(); break;
    case '3': document.querySelector('[data-curve="free"]').click(); break;
    case 'R': case 'r': if(keyIsDown(SHIFT)) resetView(); else window.gui.reset(); break;
    case ' ': centerView(); break;
  }
}

// mouse
function mouseWheel(e){ e.preventDefault(); if(mouseX<0||mouseX>width||mouseY<0||mouseY>height) return false; viewScale=constrain(viewScale*((e.delta<0)?1.1:1/1.1),0.2,5); return false; }
function mousePressed(){
  const inCanvas = mouseX>=0 && mouseX<=width && mouseY>=0 && mouseY<=height;
  const leftPanel = mouseX<=352 && mouseY<=820;
  const rightPanel= mouseX>=width-280 && mouseY<=360;
  if (!inCanvas || leftPanel || rightPanel) return;

  if (window.currentCurveType === 'free') {
    isDrawingFree = true; freeRaw = [];
    const p = screenToModelRelative(mouseX, mouseY); freeRaw.push(p); isDragging=false;
  } else { isDragging = true; lastMouseX=mouseX; lastMouseY=mouseY; }
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
      const bbox = freeRaw.reduce((b,p)=>({minx:Math.min(b.minx,p.x),miny:Math.min(b.miny,p.y),
        maxx:Math.max(b.maxx,p.x),maxy:Math.max(b.maxy,p.y)}), {minx:Infinity,miny:Infinity,maxx:-Infinity,maxy:-Infinity});
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
