// main.js
// 全局状态（显式挂到 window，供其他文件读取）
let canvas;
window.curvedScissorMechanism = undefined;
window.gui = undefined;
window.currentCurveType = 'arc';
window.showCurve  = true;
window.showJoints = true;
window.showPivots = true;
window.showTrail  = false;

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
  // 背景渐变
  for(let i=0;i<height;i++){
    const inter=map(i,0,height,0,1);
    const c=lerpColor(color(230,80,10),color(250,60,5),inter);
    stroke(c); line(0,i,width,i);
  }

  window.curvedScissorMechanism.update();
  drawGrid();
  window.curvedScissorMechanism.draw();
  drawPerformance();
}

function drawGrid(){
  stroke(0,0,100,20); strokeWeight(1);
  const s=50;
  for(let x=0;x<width;x+=s) line(x,0,x,height);
  for(let y=0;y<height;y+=s) line(0,y,width,y);
  stroke(180,100,100,50); line(width/2,0,width/2,height); line(0,height/2,width,height/2);
}

function drawPerformance(){
  fill(0,0,100,.8); textSize(12); textAlign(RIGHT,BOTTOM);
  const metrics=[
    `FPS: ${frameRate().toFixed(1)}`,
    `关节数: ${window.curvedScissorMechanism.joints.length}`,
    `铰链轴心: ${window.curvedScissorMechanism.pivots.length}`,
    `连接数: ${window.curvedScissorMechanism.links.length}`
  ];
  for(let i=0;i<metrics.length;i++) text(metrics[i], width-20, height-20-(i*18));
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
    case '1': document.querySelector('[data-curve="arc"]').click(); break;
    case '2': document.querySelector('[data-curve="sine"]').click(); break;
    case '3': document.querySelector('[data-curve="spiral"]').click(); break;
    case '4': document.querySelector('[data-curve="bezier"]').click(); break;
    case 'r': case 'R': window.gui.reset(); break;
  }
}
