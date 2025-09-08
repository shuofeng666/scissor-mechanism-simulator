// 极简线稿剪刀机构（支持 free 曲线 & 编号）
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
    this._dirty = true;
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
      case 'free':
        return (Array.isArray(window.freeCurve) && window.freeCurve.length>=2)
          ? window.freeCurve.slice()
          : CurveGenerator.generateArc(this.curveLength, this.curvature);
      case 'sine':   return CurveGenerator.generateSine(this.curveLength, this.curvature);
      case 'arc':
      default:       return CurveGenerator.generateArc(this.curveLength, this.curvature);
    }
  }

  calculateGeometry(){
    this.joints.length = 0; this.links.length = 0; this.pivots.length = 0;
    this.baseCurve = this.generateBaseCurve();
    if(!this.baseCurve.length) return;

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

  // ===== 绘制（极简线稿） =====
  draw(){
    push();
    if(window.showCurve) this.drawBaseCurve();
    if(window.showTrail) this.drawTrail();
    this.drawLinks();                // thin-line schematic
    if(window.showJoints) this.drawJoints();
    if(window.showPivots) this.drawPivots();

    // ---- Laser-cut preview (capsule + holes) ----
    if (window.showMfg) {
      const mm = +document.getElementById('lc_px2mm').value || 1;   // mm per px
      const linkWmm = +document.getElementById('lc_linkWidth').value || 12;
      const holeDmm = +document.getElementById('lc_holeDia').value || 4;
      const kerf = +document.getElementById('lc_kerf').value || 0;
      const Wpx = (linkWmm + kerf) / mm;   // convert mm->px
      const Hpx = (holeDmm + kerf) / mm;
      this.drawManufacturingPreview(Wpx, Hpx);
    }
    pop();
  }

   drawManufacturingPreview(linkWidthPx, holeDiaPx){
    push();
    noFill();
    stroke(200);     // light gray preview
    strokeWeight(1);
    for(const lk of this.links){
      if(!(lk.start && lk.end)) continue;
      this._drawCapsule(lk.start, lk.end, linkWidthPx);
      // holes
      ellipse(lk.start.x, lk.start.y, holeDiaPx, holeDiaPx);
      ellipse(lk.end.x,   lk.end.y,   holeDiaPx, holeDiaPx);
    }
    pop();
  }

  _drawCapsule(p1, p2, width){
    const r = width/2;
    const dx = p2.x - p1.x, dy = p2.y - p1.y;
    const L  = Math.hypot(dx, dy);
    if (L < 1e-6) return;

    // local frame along the link
    const ux = dx / L, uy = dy / L;
    const nx = -uy, ny = ux;

    // four corner points (outer rectangle edges)
    const a1 = { x: p1.x + nx*r, y: p1.y + ny*r };
    const a2 = { x: p2.x + nx*r, y: p2.y + ny*r };
    const b1 = { x: p2.x - nx*r, y: p2.y - ny*r };
    const b2 = { x: p1.x - nx*r, y: p1.y - ny*r };

    // straight sides
    beginShape();
    vertex(a1.x, a1.y);
    vertex(a2.x, a2.y);
    vertex(b1.x, b1.y);
    vertex(b2.x, b2.y);
    endShape(CLOSE);

    // end arcs (approximate with p5 arc)
    push();
    // arc at p2
    translate(p2.x, p2.y);
    rotate(Math.atan2(uy, ux));
    arc(0, 0, width, width, -HALF_PI, HALF_PI);
    pop();

    push();
    // arc at p1
    translate(p1.x, p1.y);
    rotate(Math.atan2(uy, ux));
    arc(0, 0, width, width, HALF_PI, -HALF_PI);
    pop();
  }

  drawBaseCurve(){
    if(this.baseCurve.length<2) return;
    push();
    noFill(); stroke(156); strokeWeight(1); drawingContext.setLineDash([5,4]);
    beginShape(); for(const pt of this.baseCurve) vertex(this.centerX+pt.x, this.centerY+pt.y); endShape();
    drawingContext.setLineDash([]); pop();
  }

  drawLinks(){
    push(); stroke(17); strokeWeight(1.5); strokeCap(ROUND);
    for(const lk of this.links){ if(lk.start&&lk.end) line(lk.start.x,lk.start.y,lk.end.x,lk.end.y); }
    pop();
  }

  drawJoints(){
    push(); noFill(); stroke(17); strokeWeight(1.5);
    for(const j of this.joints){
      ellipse(j.x, j.y, 8, 8);
      if(window.showLabels){
        noStroke(); fill(80); textSize(10);
        textFont('ui-monospace, SFMono-Regular, Menlo, Consolas, monospace');
        textAlign(LEFT,BOTTOM); text(j.id, j.x+6, j.y-6);
      }
    } pop();
  }

  drawPivots(){
    push(); noFill(); stroke(17); strokeWeight(1.5);
    for(const p of this.pivots){
      ellipse(p.x,p.y,12,12); line(p.x-6,p.y,p.x+6,p.y); line(p.x,p.y-6,p.x,p.y+6);
      if(window.showLabels){
        noStroke(); fill(80); textSize(11);
        textFont('ui-monospace, SFMono-Regular, Menlo, Consolas, monospace');
        textAlign(LEFT,TOP); text(p.id, p.x+8, p.y+8);
      }
    } pop();
  }

  drawTrail(){
    if(this.trailPoints.length<2) return;
    push(); noFill(); stroke(80); strokeWeight(1);
    beginShape(); for(const q of this.trailPoints) vertex(q.x,q.y); endShape(); pop();
  }
}
