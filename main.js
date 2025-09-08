// p5 sketch + view transforms + free draw + anchor picking (mouse only)
let canvas;
window.curvedScissorMechanism = undefined;
window.gui = undefined;

window.currentCurveType = 'arc';
window.showCurve  = true;
window.showJoints = true;
window.showPivots = true;
window.showTrail  = false;
window.showLabels = true;
window.showMfg    = true;

// Anchor state (mouse only)
window.anchorMode = false;
window.anchor = { id:null, world:null }; // {x,y} in screen pixels

// Free curve
window.freeCurve = [];      // processed (relative-to-center) points
let isDrawingFree = false;
let freeRaw = [];           // raw points (relative-to-center)

// View
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

  // mechanism layer (subject to view transform)
  push();
  translate(width/2 + viewOffsetX, height/2 + viewOffsetY);
  scale(viewScale);
  translate(-width/2, -height/2);
  window.curvedScissorMechanism.update();
  window.curvedScissorMechanism.draw();
  pop();

  // free draw overlay (screen space)
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

  // anchor highlight (screen space)
  if (window.anchor?.id) {
    const a = findNodeById(window.anchor.id);
    if (a){
      push();
      stroke('#2563eb'); strokeWeight(2); noFill();
      const s=18;
      ellipse(a.screen.x, a.screen.y, s, s);
      line(a.screen.x-s/2, a.screen.y, a.screen.x+s/2, a.screen.y);
      line(a.screen.x, a.screen.y-s/2, a.screen.x, a.screen.y+s/2);
      pop();
    }
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
  if (window.anchor?.id) txt.push(`Anchor: ${window.anchor.id}`);
  txt.push(`FPS ${nf(frameRate(),2,1)}`);
  txt.push(`Scale ${(viewScale*100).toFixed(0)}%`);
  txt.push(`Offset ${viewOffsetX.toFixed(0)}, ${viewOffsetY.toFixed(0)}`);
  push(); fill(17); noStroke(); textSize(11);
  let x = width-180, y = height-76;
  for(let i=0;i<txt.length;i++) text(txt[i], x, y+i*14);
  pop();
}

function windowResized(){
  resizeCanvas(windowWidth, windowHeight);
  window.curvedScissorMechanism.setCenter(width/2, height/2);
}

/* ===== coordinate helpers ===== */
// screen <-> model (absolute model coords, not relative-to-center)
function modelToScreen(mx, my){
  const sx = (mx - (width/2)) * viewScale + (width/2 + viewOffsetX);
  const sy = (my - (height/2)) * viewScale + (height/2 + viewOffsetY);
  return { x: sx, y: sy };
}
function screenToModel(mx, my){
  const x1 = (mx - (width/2 + viewOffsetX)) / viewScale + (width/2);
  const y1 = (my - (height/2 + viewOffsetY)) / viewScale + (height/2);
  return { x: x1, y: y1 };
}
// relative to center (used for freeRaw / freeCurve)
function screenToModelRelative(mx, my){
  const x1 = mx - (width/2 + viewOffsetX);
  const y1 = my - (height/2 + viewOffsetY);
  return { x: x1 / viewScale, y: y1 / viewScale };
}

/* ===== free draw utils ===== */
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
  for(let i=1;i<points.length;i++)
    acc[i] = acc[i-1] + Math.hypot(points[i].x - points[i-1].x, points[i].y - points[i-1].y);
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

/* ===== picking ===== */
function pickNodeAt(sx, sy){
  const mech = window.curvedScissorMechanism;
  mech.update();
  const R_pivot = 12, R_joint = 10; // screen px radius
  for (const p of mech.pivots){
    const sp = modelToScreen(p.x, p.y);
    if (Math.hypot(sp.x - sx, sp.y - sy) <= R_pivot)
      return { id: p.id, type:'pivot', world:{x:sp.x, y:sp.y} };
  }
  for (const j of mech.joints){
    const sp = modelToScreen(j.x, j.y);
    if (Math.hypot(sp.x - sx, sp.y - sy) <= R_joint)
      return { id: j.id, type:'joint', world:{x:sp.x, y:sp.y} };
  }
  return null;
}
function findNodeById(id){
  const mech = window.curvedScissorMechanism; mech.update();
  let pt = mech.pivots.find(p=>p.id===id) || mech.joints.find(j=>j.id===id);
  if (!pt) return null;
  const scr = modelToScreen(pt.x, pt.y);
  return { model: {x:pt.x, y:pt.y}, screen: scr };
}

/* ===== mouse (no keyboard needed) ===== */
function mouseWheel(e){
  e.preventDefault();
  if(mouseX<0||mouseX>width||mouseY<0||mouseY>height) return false;
  viewScale=constrain(viewScale*((e.delta<0)?1.1:1/1.1),0.2,5); return false;
}
function mousePressed(){
  const inCanvas = mouseX>=0 && mouseX<=width && mouseY>=0 && mouseY<=height;
  const leftPanel = mouseX<=380 && mouseY<=900;
  const rightPanel= mouseX>=width-280 && mouseY<=360;
  if (!inCanvas || leftPanel || rightPanel) return;

  if (window.anchorMode) {
    const hit = pickNodeAt(mouseX, mouseY);
    if (hit) {
      window.anchor = { id: hit.id, world: { x: hit.world.x, y: hit.world.y } };
      if (window.gui) window.gui.updateAnchorLabel();
    }
    return; // anchor mode consumes click
  }

  if (window.currentCurveType === 'free') {
    isDrawingFree = true; freeRaw = [];
    const p = screenToModelRelative(mouseX, mouseY);
    freeRaw.push(p); isDragging=false;
  } else {
    isDragging = true; lastMouseX=mouseX; lastMouseY=mouseY;
  }
}
function mouseDragged(){
  if (window.anchorMode) return; // no pan/free-draw while picking
  if (isDrawingFree && window.currentCurveType === 'free') {
    const p = screenToModelRelative(mouseX, mouseY);
    const last = freeRaw[freeRaw.length-1];
    if (!last || Math.hypot(p.x-last.x, p.y-last.y) > 1.5) freeRaw.push(p);
  } else if (isDragging) {
    viewOffsetX += mouseX-lastMouseX; viewOffsetY += mouseY-lastMouseY; lastMouseX=mouseX; lastMouseY=mouseY;
  }
}
function mouseReleased(){
  if (window.anchorMode) return;
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
