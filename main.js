// main.js - 简洁现代风格 + 鼠标交互
// 全局状态（显式挂到 window，供其他文件读取）
let canvas;
window.curvedScissorMechanism = undefined;
window.gui = undefined;
window.currentCurveType = 'arc';
window.showCurve  = true;
window.showJoints = true;
window.showPivots = true;
window.showTrail  = false;

// 视图控制变量
let viewScale = 1.0;
let viewOffsetX = 0;
let viewOffsetY = 0;
let isDragging = false;
let lastMouseX = 0;
let lastMouseY = 0;

// p5 生命周期
function setup(){
  canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent(document.body);
  colorMode(HSB);

  window.curvedScissorMechanism = new ImprovedScissorMechanism();
  window.curvedScissorMechanism.setCenter(width/2, height/2);

  window.gui = new GUI();
  window.gui.updateDisplay();

  // p5.js 加载检查（若 CDN 失败给出提示）
  (function(){
    function showFail(){
      var div=document.createElement('div');
      div.style.position='fixed';div.style.top='10px';div.style.left='50%';div.style.transform='translateX(-50%)';
      div.style.background='rgba(255,0,0,0.9)';div.style.color='#fff';div.style.padding='10px 14px';div.style.zIndex='2000';
      div.style.borderRadius='8px';div.style.boxShadow='0 2px 10px rgba(0,0,0,.3)';
      div.textContent='未能加载 p5.js（网络限制）。页面功能受限。';
      document.body.appendChild(div);
    }
    if(!(window.p5)){
      setTimeout(function(){ if(!(window.p5)) showFail(); }, 800);
    }
  })();
}

function draw(){
  // 简洁的白色背景
  background(0, 0, 100);
  
  // 应用视图变换
  push();
  translate(width/2 + viewOffsetX, height/2 + viewOffsetY);
  scale(viewScale);
  translate(-width/2, -height/2);
  
  window.curvedScissorMechanism.update();
  drawGrid();
  window.curvedScissorMechanism.draw();
  
  pop();
  
  // UI元素不受变换影响
  drawStats();
  drawControls();
}

function drawGrid(){
  push();
  // 简洁的网格系统
  const gridSize = 50;
  
  // 细网格
  stroke(0, 0, 0, 8);
  strokeWeight(1);
  for(let x = 0; x < width; x += gridSize) {
    line(x, 0, x, height);
  }
  for(let y = 0; y < height; y += gridSize) {
    line(0, y, width, y);
  }
  
  // 中心线
  stroke(200, 50, 70, 80);
  strokeWeight(2);
  line(width/2, 0, width/2, height);
  line(0, height/2, width, height/2);
  
  // 中心点
  fill(200, 60, 80);
  noStroke();
  ellipse(width/2, height/2, 6);
  pop();
}

function drawStats(){
  push();
  // 右下角状态信息
  const x = width - 160;
  const y = height - 100;
  
  // 背景
  fill(0, 0, 100, 200);
  stroke(0, 0, 0, 30);
  strokeWeight(1);
  rect(x, y, 150, 90, 8);
  
  // 文字
  fill(0, 0, 30);
  textSize(12);
  textAlign(LEFT, TOP);
  
  const stats = [
    `FPS: ${frameRate().toFixed(1)}`,
    `关节: ${window.curvedScissorMechanism.joints.length}`,
    `铰链: ${window.curvedScissorMechanism.pivots.length}`,
    `连杆: ${window.curvedScissorMechanism.links.length}`,
    `缩放: ${(viewScale * 100).toFixed(0)}%`,
    `偏移: ${viewOffsetX.toFixed(0)}, ${viewOffsetY.toFixed(0)}`
  ];
  
  for(let i = 0; i < stats.length; i++) {
    text(stats[i], x + 10, y + 10 + (i * 13));
  }
  pop();
}

function drawControls(){
  push();
  // 左下角控制提示
  const x = 20;
  const y = height - 120;
  
  // 背景
  fill(0, 0, 100, 200);
  stroke(0, 0, 0, 30);
  strokeWeight(1);
  rect(x, y, 200, 100, 8);
  
  // 标题
  fill(0, 0, 20);
  textSize(14);
  textAlign(LEFT, TOP);
  text('视图控制', x + 10, y + 10);
  
  // 控制说明
  fill(0, 0, 40);
  textSize(11);
  const controls = [
    '滚轮: 缩放',
    '拖拽: 平移视图',
    'Shift+R: 重置视图',
    'Space: 居中'
  ];
  
  for(let i = 0; i < controls.length; i++) {
    text(controls[i], x + 10, y + 35 + (i * 15));
  }
  pop();
}

function windowResized(){
  resizeCanvas(windowWidth, windowHeight);
  window.curvedScissorMechanism.setCenter(width/2, height/2);
}

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
      if(keyIsDown(SHIFT)) {
        // Shift+R: 重置视图
        resetView();
      } else {
        // R: 重置参数
        window.gui.reset(); 
      }
      break;
    case ' ': // 空格键居中视图
      centerView();
      break;
  }
}

// 鼠标滚轮缩放
function mouseWheel(event) {
  // 阻止页面滚动
  event.preventDefault();
  
  // 检查鼠标是否在画布区域
  if (mouseX >= 0 && mouseX <= width && mouseY >= 0 && mouseY <= height) {
    const scaleFactor = 1.1;
    const zoomIn = event.delta < 0;
    
    if (zoomIn) {
      viewScale *= scaleFactor;
    } else {
      viewScale /= scaleFactor;
    }
    
    // 限制缩放范围
    viewScale = constrain(viewScale, 0.1, 5.0);
  }
  
  return false;
}

// 鼠标按下
function mousePressed() {
  // 检查是否点击在画布区域（避免与UI面板冲突）
  if (mouseX >= 0 && mouseX <= width && mouseY >= 0 && mouseY <= height) {
    // 检查是否点击在UI面板区域
    const leftPanelArea = mouseX <= 350 && mouseY <= 500;
    const rightPanelArea = mouseX >= width - 170 && mouseY <= 350;
    const bottomLeftArea = mouseX <= 220 && mouseY >= height - 130;
    const bottomRightArea = mouseX >= width - 170 && mouseY >= height - 110;
    
    if (!leftPanelArea && !rightPanelArea && !bottomLeftArea && !bottomRightArea) {
      isDragging = true;
      lastMouseX = mouseX;
      lastMouseY = mouseY;
    }
  }
}

// 鼠标拖拽
function mouseDragged() {
  if (isDragging) {
    const deltaX = mouseX - lastMouseX;
    const deltaY = mouseY - lastMouseY;
    
    viewOffsetX += deltaX;
    viewOffsetY += deltaY;
    
    lastMouseX = mouseX;
    lastMouseY = mouseY;
  }
}

// 鼠标释放
function mouseReleased() {
  isDragging = false;
}

// 重置视图
function resetView() {
  viewScale = 1.0;
  viewOffsetX = 0;
  viewOffsetY = 0;
}

// 居中视图
function centerView() {
  viewOffsetX = 0;
  viewOffsetY = 0;
}