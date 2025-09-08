// 控制界面逻辑
class GUI {
  constructor(){
    this.setupCurveSelector();
    this.setupSliders();
    this.setupButtons();
    this.setupCheckboxes();
  }
  setupCurveSelector(){
    const buttons=document.querySelectorAll('.curve-btn');
    buttons.forEach(btn=>{
      btn.addEventListener('click',()=>{
        buttons.forEach(b=>b.classList.remove('active'));
        btn.classList.add('active');
        window.currentCurveType=btn.getAttribute('data-curve');
        window.curvedScissorMechanism.curveType=window.currentCurveType;
        this.updateDisplay();
      });
    });
  }
  setupSliders(){
    this.segmentSlider=document.getElementById('segmentSlider');
    this.segmentSlider.addEventListener('input',()=>{
      window.curvedScissorMechanism.segments=parseInt(this.segmentSlider.value,10);
      this.updateDisplay();
    });

    this.linkLengthSlider=document.getElementById('linkLengthSlider');
    this.linkLengthSlider.addEventListener('input',()=>{
      window.curvedScissorMechanism.linkLength=parseInt(this.linkLengthSlider.value,10);
      this.updateDisplay();
    });

    this.curvatureSlider=document.getElementById('curvatureSlider');
    this.curvatureSlider.addEventListener('input',()=>{
      window.curvedScissorMechanism.curvature=parseFloat(this.curvatureSlider.value);
      this.updateDisplay();
    });

    this.lengthSlider=document.getElementById('lengthSlider');
    this.lengthSlider.addEventListener('input',()=>{
      window.curvedScissorMechanism.curveLength=parseInt(this.lengthSlider.value,10);
      this.updateDisplay();
    });
  }
  setupButtons(){
    document.getElementById('resetBtn').addEventListener('click',()=>this.reset());
    document.getElementById('randomBtn').addEventListener('click',()=>this.randomize());
  }
  setupCheckboxes(){
    document.getElementById('showCurve').addEventListener('change',e=>{ window.showCurve=e.target.checked;});
    document.getElementById('showJoints').addEventListener('change',e=>{ window.showJoints=e.target.checked;});
    document.getElementById('showPivots').addEventListener('change',e=>{ window.showPivots=e.target.checked;});
    document.getElementById('showTrail').addEventListener('change',e=>{
      window.showTrail=e.target.checked;
      if(!window.showTrail) window.curvedScissorMechanism.trailPoints=[];
    });
  }
  updateDisplay(){
    const mech=window.curvedScissorMechanism;
    document.getElementById('segmentValue').textContent=mech.segments;
    document.getElementById('linkLengthValue').textContent=`${mech.linkLength}px`;
    document.getElementById('curvatureValue').textContent=mech.curvature.toFixed(1);
    document.getElementById('lengthValue').textContent=`${mech.curveLength}px`;

    const curveNames={arc:'圆弧',sine:'正弦波',spiral:'螺旋',bezier:'贝塞尔'};
    document.getElementById('currentCurve').textContent=curveNames[window.currentCurveType]||'未知';
    document.getElementById('totalSegments').textContent=mech.segments;
    document.getElementById('pivotCount').textContent=mech.pivots.length;
    document.getElementById('currentLength').textContent=`${mech.polylineArcLength().toFixed(1)}px`;

    const integ=mech.getIntegrity();
    const indicator=document.querySelector('.status-indicator');
    indicator.className=`status-indicator status-${integ.level}`;
    document.getElementById('integrityText').textContent=integ.text;
  }
  reset(){
    const mech=window.curvedScissorMechanism;
    mech.segments=4;
    mech.linkLength=60;
    mech.curvature=1.0;
    mech.curveLength=300;
    window.currentCurveType='arc';
    mech.curveType='arc';

    this.segmentSlider.value=4;
    this.linkLengthSlider.value=60;
    this.curvatureSlider.value=1.0;
    this.lengthSlider.value=300;

    document.querySelectorAll('.curve-btn').forEach(b=>{
      b.classList.toggle('active', b.getAttribute('data-curve')==='arc');
    });

    mech.trailPoints=[];
    this.updateDisplay();
  }
  randomize(){
    const mech=window.curvedScissorMechanism;
    const types=['arc','sine','spiral','bezier'];
    const t=types[Math.floor(Math.random()*types.length)];
    window.currentCurveType=t; mech.curveType=t;
    document.querySelectorAll('.curve-btn').forEach(b=>{
      b.classList.toggle('active', b.getAttribute('data-curve')===t);
    });

    mech.segments = Math.floor(Math.random()*8)+3;
    mech.linkLength= Math.floor(Math.random()*60)+40;
    mech.curvature = Math.random()*2.5+0.5;
    mech.curveLength= Math.floor(Math.random()*250)+200;

    this.segmentSlider.value=mech.segments;
    this.linkLengthSlider.value=mech.linkLength;
    this.curvatureSlider.value=mech.curvature;
    this.lengthSlider.value=mech.curveLength;

    mech.trailPoints=[];
    this.updateDisplay();
  }
}
