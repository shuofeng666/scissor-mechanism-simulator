// 极简线稿版剪刀机构
class ImprovedScissorMechanism {
  constructor(){
    this.segments   = 4;
    this.linkLength = 60;
    this.curvature  = 1.0;
    this.curveLength= 300;
    this.curveType  = 'arc';

    this.centerX = 0; this.centerY = 0;
    this.joints = []; this.links = []; this.pivots = [];
    this.trailPoints = []; this.baseCurve = [];
    this._dirty = true; // 参数改动时重算
  }

  setCenter(x,y){ this.centerX = x; this.centerY = y; this._dirty = true; }

  setParams({segments, linkLength, curvature, curveLength, curveType}){
    if(segments      !== undefined) this.segments    = segments|0;
    if(linkLength    !== undefined) this.linkLength  = +linkLength;
    if(curvature     !== undefined) this.curvature   = +curvature;
    if(curveLength   !== undefined) this.curveLength = +curveLength;
    if(curveType     !== undefined) this.curveType   = curveType;
    this._dirty = true;
  }

  generateBaseCurve(){
    switch(this.curveType){
      case 'sine':   return CurveGenerator.generateSine(this.curveLength, this.curvature);
      case 'spiral': return CurveGenerator.generateSpiral(this.curveLength, this.curvature);
      case 'bezier': return CurveGenerator.generateBezier(this.curveLength, this.curvature);
      case 'arc':
      default:       return CurveGenerator.generateArc(this.curveLength, this.curvature);
    }
  }

  calculateGeometry(){
    this.joints.length = 0; this.links.length = 0; this.pivots.length = 0;
    this.baseCurve = this.generateBaseCurve();
    if(!this.baseCurve.length) return;

    // 逐段投影并生成左右关节
    for(let i=0;i<=this.segments;i++){
      const t = i / this.segments;
      const idx = Math.floor(t * (this.baseCurve.length - 1));
      const cpt = this.baseCurve[idx];
      const n = this.normalAt(idx);
      const off = this.linkLength * 0.5;

      const L = { x: this.centerX + cpt.x - n.x * off, y: this.centerY + cpt.y - n.y * off, side: 'L', level: i, id: `L${i}` };
      const R = { x: this.centerX + cpt.x + n.x * off, y: this.centerY + cpt.y + n.y * off, side: 'R', level: i, id: `R${i}` };
      this.joints.push(L, R);
    }

    // 交叉连杆与中间铰链
    for(let i=0;i<this.segments;i++){
      const LB=this.joints[i*2], RB=this.joints[i*2+1];
      const LT=this.joints[(i+1)*2], RT=this.joints[(i+1)*2+1];
      if(!(LB && RB && LT && RT)) continue;

      const p = this.lineIntersection(LB, RT, RB, LT);
      if(!p) continue;
      const P = { x: p.x, y: p.y, segment: i, id: `P${i}`, links: [] };
      this.pivots.push(P);

      const link1={ start: LB, end: P, type:'a', id:`${LB.id}-${P.id}` };
      const link2={ start: P,  end: RT, type:'a', id:`${P.id}-${RT.id}` };
      const link3={ start: RB, end: P, type:'b', id:`${RB.id}-${P.id}` };
      const link4={ start: P,  end: LT, type:'b', id:`${P.id}-${LT.id}` };
      this.links.push(link1,link2,link3,link4);
      P.links.push(link1,link2,link3,link4);
    }

    this.updateTrail();
    this._dirty = false;
  }

  lineIntersection(p1,p2,p3,p4){
    const x1=p1.x,y1=p1.y,x2=p2.x,y2=p2.y,x3=p3.x,y3=p3.y,x4=p4.x,y4=p4.y;
    const d=(x1-x2)*(y3-y4)-(y1-y2)*(x3-x4);
    if(Math.abs(d)<1e-6) return null;
    const t=((x1-x3)*(y3-y4)-(y1-y3)*(x3-x4))/d;
    return { x: x1 + t*(x2-x1), y: y1 + t*(y2-y1) };
  }

  normalAt(idx){
    const a=this.baseCurve[Math.max(0,idx-1)];
    const b=this.baseCurve[Math.min(this.baseCurve.length-1,idx+1)];
    const dx=b.x-a.x, dy=b.y-a.y, L=Math.hypot(dx,dy)||1;
    return { x:-dy/L, y:dx/L };
  }

  updateTrail(){
    if(!window.showTrail) return;
    const tops = this.joints.filter(j => j.level === this.segments);
    if(tops.length>=2){
      const m={ x:(tops[0].x+tops[1].x)/2, y:(tops[0].y+tops[1].y)/2, t:millis() };
      this.trailPoints.push(m);
      if(this.trailPoints.length>180) this.trailPoints.shift();
    }
  }

  polylineArcLength(){
    let L=0;
    for(let i=1;i<this.baseCurve.length;i++){
      const a=this.baseCurve[i-1], b=this.baseCurve[i];
      L += Math.hypot(b.x-a.x,b.y-a.y);
    }
    return L;
  }

  getIntegrity(){
    if(!this.pivots.length) return {level:'error',text:'无轴心'};
    if(this.pivots.length < this.segments) return {level:'warning',text:'部分'};
    return {level:'good',text:'良好'};
  }

  update(){ if(this._dirty) this.calculateGeometry(); }

  /* ===== 绘制（极简线稿） ===== */
  draw(){
    push();
    // 基准曲线
    if(window.showCurve) this.drawBaseCurve();
    // 轨迹
    if(window.showTrail) this.drawTrail();
    // 连杆
    this.drawLinks();
    // 关节/铰链
    if(window.showJoints) this.drawJoints();
    if(window.showPivots) this.drawPivots();
    pop();
  }

  drawBaseCurve(){
    if(this.baseCurve.length<2) return;
    push();
    noFill();
    stroke(156); // #9ca3af
    strokeWeight(1);
    drawingContext.setLineDash([5,4]);
    beginShape();
    for(const pt of this.baseCurve) vertex(this.centerX+pt.x, this.centerY+pt.y);
    endShape();
    drawingContext.setLineDash([]);
    pop();
  }

  drawLinks(){
    push();
    stroke(17); // #111827
    strokeWeight(1.5);
    strokeCap(ROUND);
    for(const lk of this.links){
      if(!(lk.start && lk.end)) continue;
      line(lk.start.x, lk.start.y, lk.end.x, lk.end.y);
    }
    pop();
  }

drawJoints(){
  push();
  noFill();
  stroke(17);
  strokeWeight(1.5);
  for(const j of this.joints){
    ellipse(j.x, j.y, 8, 8); // 空心小圆
    if(window.showLabels){
      noStroke();
      fill(80);               // 中灰
      textSize(10);
      textFont('ui-monospace, SFMono-Regular, Menlo, Consolas, monospace');
      textAlign(LEFT, BOTTOM);
      text(j.id, j.x + 6, j.y - 6); // 圆旁边小注
    }
  }
  pop();
}

drawPivots(){
  push();
  noFill();
  stroke(17);
  strokeWeight(1.5);
  for(const p of this.pivots){
    ellipse(p.x, p.y, 12, 12);
    line(p.x-6, p.y, p.x+6, p.y);
    line(p.x, p.y-6, p.x, p.y+6);
    if(window.showLabels){
      noStroke();
      fill(80);
      textSize(11);
      textFont('ui-monospace, SFMono-Regular, Menlo, Consolas, monospace');
      textAlign(LEFT, TOP);
      text(p.id, p.x + 8, p.y + 8);
    }
  }
  pop();
}


  drawTrail(){
    if(this.trailPoints.length<2) return;
    push();
    noFill();
    stroke(80); // 中灰
    strokeWeight(1);
    beginShape();
    for(const q of this.trailPoints) vertex(q.x, q.y);
    endShape();
    pop();
  }
}
