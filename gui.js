// 连接 DOM 控件与机制参数（极简逻辑）
class GUI{
  constructor(){
    this.$curveBtns = Array.from(document.querySelectorAll('.curve-btn'));
    this.$segment   = document.getElementById('segmentSlider');
    this.$linkLen   = document.getElementById('linkLengthSlider');
    this.$curv      = document.getElementById('curvatureSlider');
    this.$len       = document.getElementById('lengthSlider');

    this.$segmentVal= document.getElementById('segmentValue');
    this.$linkVal   = document.getElementById('linkLengthValue');
    this.$curvVal   = document.getElementById('curvatureValue');
    this.$lenVal    = document.getElementById('lengthValue');

    this.$showCurve = document.getElementById('showCurve');
    this.$showJoints= document.getElementById('showJoints');
    this.$showPivots= document.getElementById('showPivots');
    this.$showTrail = document.getElementById('showTrail');
    this.$showLabels= document.getElementById('showLabels');

    this.$curName   = document.getElementById('currentCurve');
    this.$segNum    = document.getElementById('totalSegments');
    this.$pivotCnt  = document.getElementById('pivotCount');
    this.$lenNow    = document.getElementById('currentLength');
    this.$integ     = document.getElementById('integrity');
    this.$integText = document.getElementById('integrityText');

    document.getElementById('resetBtn').addEventListener('click', () => this.reset());
    document.getElementById('randomBtn').addEventListener('click', () => this.randomize());

    this.bind();
  }

  bind(){
    this.$curveBtns.forEach(btn=>{
      btn.addEventListener('click', ()=>{
        this.$curveBtns.forEach(b=>b.classList.remove('active'));
        btn.classList.add('active');
        window.currentCurveType = btn.dataset.curve;
        window.curvedScissorMechanism.setParams({curveType: window.currentCurveType});
        this.updateDisplay();
      });
    });

    const onRange = () => {
      this.$segmentVal.textContent = this.$segment.value;
      this.$linkVal.textContent    = this.$linkLen.value;
      this.$curvVal.textContent    = (+this.$curv.value).toFixed(1);
      this.$lenVal.textContent     = this.$len.value;

      window.curvedScissorMechanism.setParams({
        segments: +this.$segment.value,
        linkLength: +this.$linkLen.value,
        curvature: +this.$curv.value,
        curveLength: +this.$len.value,
        curveType: window.currentCurveType
      });
      this.updateDisplay();
    };
    [this.$segment, this.$linkLen, this.$curv, this.$len].forEach(el=>{
      el.addEventListener('input', onRange);
    });

    const onCheck = () => {
      window.showCurve  = this.$showCurve.checked;
      window.showJoints = this.$showJoints.checked;
      window.showPivots = this.$showPivots.checked;
      window.showTrail  = this.$showTrail.checked;
      window.showLabels = this.$showLabels.checked;
    };
    [this.$showCurve, this.$showJoints, this.$showPivots, this.$showTrail, this.$showLabels].forEach(el=>{
      el.addEventListener('change', onCheck);
    });
  }

  updateDisplay(){
    const mech = window.curvedScissorMechanism;
    mech.update();
    this.$curName.textContent = ({
      arc:'圆弧', sine:'正弦', free:'自由绘'
    })[mech.curveType] || mech.curveType;

    this.$segNum.textContent = mech.segments;
    this.$pivotCnt.textContent = mech.pivots.length;
    this.$lenNow.textContent = Math.round(mech.polylineArcLength());

    const integ = mech.getIntegrity();
    this.$integText.textContent = integ.text;
    const dot = this.$integ.querySelector('.dot');
    dot.className = 'dot ' + (integ.level==='good'?'dot-ok':(integ.level==='warning'?'dot-warn':'dot-err'));
  }

  reset(){
    this.$segment.value = 4;    this.$linkLen.value = 60;
    this.$curv.value    = 1.0;  this.$len.value     = 300;
    this.$segmentVal.textContent = '4';
    this.$linkVal.textContent    = '60';
    this.$curvVal.textContent    = '1.0';
    this.$lenVal.textContent     = '300';

    document.querySelectorAll('.curve-btn').forEach(b=>b.classList.remove('active'));
    document.querySelector('[data-curve="arc"]').classList.add('active');
    window.currentCurveType = 'arc';

    this.$showCurve.checked = true;
    this.$showJoints.checked = true;
    this.$showPivots.checked = true;
    this.$showTrail.checked  = false;
    this.$showLabels.checked = true;

    window.showCurve  = true;
    window.showJoints = true;
    window.showPivots = true;
    window.showTrail  = false;
    window.showLabels = true;

    window.curvedScissorMechanism.setParams({
      segments:4, linkLength:60, curvature:1.0, curveLength:300, curveType:'arc'
    });
    this.updateDisplay();
  }

  randomize(){
    const seg = Math.floor(2 + Math.random()*10);
    const len = Math.floor(40 + Math.random()*80);
    const cur = +(0.5 + Math.random()*2.0).toFixed(1);
    const L   = Math.floor(200 + Math.random()*250);
    const types = ['arc','sine','free'];
    const tp = types[Math.floor(Math.random()*types.length)];

    this.$segment.value = seg;   this.$linkLen.value = len;
    this.$curv.value    = cur;   this.$len.value     = L;
    this.$segmentVal.textContent = String(seg);
    this.$linkVal.textContent    = String(len);
    this.$curvVal.textContent    = cur.toFixed(1);
    this.$lenVal.textContent     = String(L);

    document.querySelectorAll('.curve-btn').forEach(b=>b.classList.remove('active'));
    document.querySelector(`[data-curve="${tp}"]`).classList.add('active');
    window.currentCurveType = tp;

    window.curvedScissorMechanism.setParams({
      segments: seg, linkLength: len, curvature: cur, curveLength: L, curveType: tp
    });
    this.updateDisplay();
  }
}
