// p5 主循环 + 视图交互（极简）
let canvas;
window.curvedScissorMechanism = undefined;
window.gui = undefined;

window.currentCurveType = 'arc';
window.showCurve  = true;
window.showJoints = true;
window.showPivots = true;
window.showTrail  = false;

window.showTrail  = false;
window.showLabels = true;   // 新增：显示编号


// 视图
let viewScale = 1.0;
let viewOffsetX = 0;
let viewOffsetY = 0;
let isDragging = false;
let lastMouseX = 0;
let lastMouseY = 0;

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

  // 网格（极淡）
  drawGrid();

  // 视图变换
  push();
  translate(width/2 + viewOffsetX, height/2 + viewOffsetY);
  scale(viewScale);
  translate(-width/2, -height/2);

  window.curvedScissorMechanism.update();
  window.curvedScissorMechanism.draw();
  pop();

  // 右下角简洁 FPS/视图提示
  drawHUD();
}

function drawGrid(){
  push();
  stroke(229, 231, 235); // #e5e7eb
  strokeWeight(1);
  for(let x=0; x<=width; x+=48) line(x, 0, x, height);
  for(let y=0; y<=height; y+=48) line(0, y, width, y);
  pop();
}

function drawHUD(){
  const txt = [
    `FPS ${nf(frameRate(),2,1)}`,
    `Scale ${(viewScale*100).toFixed(0)}%`,
    `Offset ${viewOffsetX.toFixed(0)}, ${viewOffsetY.toFixed(0)}`
  ];
  push();
  fill(17); noStroke();
  textSize(11);
  let x = width-140, y = height-50;
  for(let i=0;i<txt.length;i++) text(txt[i], x, y+i*14);
  pop();
}

function windowResized(){
  resizeCanvas(windowWidth, windowHeight);
  window.curvedScissorMechanism.setCenter(width/2, height/2);
}

// 键盘
function keyPressed(){
  switch(key){
    case 'p': case 'P':
      window.showPivots = !window.showPivots;
      document.getElementById('showPivots').checked = window.showPivots;
      break;
    case 'j': case 'J':
      window.showJoints = !window.showJoints;
      document.getElementById('showJoints').checked = window.showJoints;
      break;
    case 'c': case 'C':
      window.showCurve = !window.showCurve;
      document.getElementById('showCurve').checked = window.showCurve;
      break;
    case 't': case 'T':
      window.showTrail = !window.showTrail;
      document.getElementById('showTrail').checked = window.showTrail;
      if(!window.showTrail) window.curvedScissorMechanism.trailPoints = [];
      break;
    case '1': document.querySelector('[data-curve="arc"]').click(); break;
    case '2': document.querySelector('[data-curve="sine"]').click(); break;
    case '3': document.querySelector('[data-curve="spiral"]').click(); break;
    case '4': document.querySelector('[data-curve="bezier"]').click(); break;
    case 'r': case 'R':
      if(keyIsDown(SHIFT)) resetView(); else window.gui.reset();
      break;
    case ' ':
      centerView(); break;
  }
}

// 视图缩放（以画布为界）
function mouseWheel(e){
  e.preventDefault();
  if(mouseX<0||mouseX>width||mouseY<0||mouseY>height) return false;
  const s = (e.delta<0) ? 1.1 : 1/1.1;
  viewScale = constrain(viewScale * s, 0.2, 5);
  return false;
}

function mousePressed(){
  // 避开左/右面板区域
  const leftPanel = mouseX<=352 && mouseY<=520;
  const rightPanel= mouseX>=width-280 && mouseY<=360;
  if(!leftPanel && !rightPanel && mouseX>=0 && mouseX<=width && mouseY>=0 && mouseY<=height){
    isDragging = true; lastMouseX=mouseX; lastMouseY=mouseY;
  }
}
function mouseDragged(){
  if(isDragging){
    viewOffsetX += mouseX-lastMouseX;
    viewOffsetY += mouseY-lastMouseY;
    lastMouseX = mouseX; lastMouseY = mouseY;
  }
}
function mouseReleased(){ isDragging = false; }

function resetView(){ viewScale=1; viewOffsetX=0; viewOffsetY=0; }
function centerView(){ viewOffsetX=0; viewOffsetY=0; }
