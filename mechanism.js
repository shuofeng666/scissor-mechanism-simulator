// 剪刀式机构几何与绘制
class ImprovedScissorMechanism {
  constructor(){
    this.segments   = 4;
    this.linkLength = 60;
    this.curvature  = 1.0;
    this.curveLength= 300;
    this.curveType  = 'arc';

    this.centerX=0; this.centerY=0;
    this.joints=[]; this.links=[]; this.pivots=[];
    this.trailPoints=[]; this.baseCurve=[];
    this.calculateGeometry();
  }
  setCenter(x,y){ this.centerX=x; this.centerY=y; }
  generateBaseCurve(){
    switch(this.curveType){
      case 'sine':   return CurveGenerator.generateSine(this.curveLength,this.curvature);
      case 'spiral': return CurveGenerator.generateSpiral(this.curveLength,this.curvature);
      case 'bezier': return CurveGenerator.generateBezier(this.curveLength,this.curvature);
      case 'arc':
      default:       return CurveGenerator.generateArc(this.curveLength,this.curvature);
    }
  }
  calculateGeometry(){
    this.joints=[]; this.links=[]; this.pivots=[];
    this.baseCurve = this.generateBaseCurve();
    if(!this.baseCurve.length) return;

    for(let i=0;i<=this.segments;i++){
      const t=i/this.segments;
      const idx=Math.floor(t*(this.baseCurve.length-1));
      const cpt=this.baseCurve[idx];
      if(!cpt) continue;

      const n=this.normalAt(idx);
      const offset = this.linkLength/2;

      const left  = { x:this.centerX+cpt.x - n.x*offset, y:this.centerY+cpt.y - n.y*offset, side:'left',  level:i, curvePoint:cpt, id:`L${i}` };
      const right = { x:this.centerX+cpt.x + n.x*offset, y:this.centerY+cpt.y + n.y*offset, side:'right', level:i, curvePoint:cpt, id:`R${i}` };
      this.joints.push(left,right);
    }

    for(let i=0;i<this.segments;i++){
      const LB=this.joints[i*2], RB=this.joints[i*2+1],
            LT=this.joints[(i+1)*2], RT=this.joints[(i+1)*2+1];
      if(!(LB&&RB&&LT&&RT)) continue;

      const p = this.lineIntersection(LB,RT,RB,LT);
      if(!p) continue;

      const pivot={x:p.x,y:p.y,segment:i,id:`P${i}`,links:[]};
      this.pivots.push(pivot);

      const link1={start:LB,end:pivot,type:'primary',segment:i,id:`${LB.id}-${pivot.id}`};
      const link2={start:pivot,end:RT,type:'primary',segment:i,id:`${pivot.id}-${RT.id}`};
      const link3={start:RB,end:pivot,type:'secondary',segment:i,id:`${RB.id}-${pivot.id}`};
      const link4={start:pivot,end:LT,type:'secondary',segment:i,id:`${pivot.id}-${LT.id}`};
      this.links.push(link1,link2,link3,link4);
      pivot.links.push(link1,link2,link3,link4);
    }

    this.updateTrail();
  }
  lineIntersection(p1,p2,p3,p4){
    const x1=p1.x,y1=p1.y,x2=p2.x,y2=p2.y,x3=p3.x,y3=p3.y,x4=p4.x,y4=p4.y;
    const denom=(x1-x2)*(y3-y4)-(y1-y2)*(x3-x4);
    if(Math.abs(denom)<1e-6) return null;
    const t=((x1-x3)*(y3-y4)-(y1-y3)*(x3-x4))/denom;
    return {x:x1+t*(x2-x1), y:y1+t*(y2-y1)};
  }
  normalAt(idx){
    const prev=this.baseCurve[Math.max(0,idx-1)];
    const next=this.baseCurve[Math.min(this.baseCurve.length-1,idx+1)];
    const dx=next.x-prev.x, dy=next.y-prev.y;
    const L=Math.hypot(dx,dy)||1;
    return {x:-dy/L,y:dx/L};
  }
  updateTrail(){
    // 读取全局 showTrail（在 main.js 中定义）
    if(!window.showTrail) return;
    if(this.joints.length>=2){
      const tops=this.joints.filter(j=>j.level===this.segments);
      if(tops.length>=2){
        const m={x:(tops[0].x+tops[1].x)/2,y:(tops[0].y+tops[1].y)/2,time:millis()};
        this.trailPoints.push(m);
        if(this.trailPoints.length>150) this.trailPoints.shift();
      }
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
  update(){ this.calculateGeometry(); }
  draw(){
    push();
    if(window.showCurve) this.drawBaseCurve();
    if(window.showTrail) this.drawTrail();
    this.drawLinks();
    if(window.showJoints) this.drawJoints();
    if(window.showPivots) this.drawPivots();
    pop();
  }
  drawBaseCurve(){
    if(this.baseCurve.length<2) return;
    noFill(); stroke(180,150,255,150); strokeWeight(2);
    beginShape();
    for(const pt of this.baseCurve) vertex(this.centerX+pt.x,this.centerY+pt.y);
    endShape();
  }
  drawLinks(){
    for(const lk of this.links){
      if(!(lk.start&&lk.end)) continue;
      if(lk.type==='primary'){ stroke(120,200,255); strokeWeight(4); }
      else{ stroke(300,200,255); strokeWeight(3); }
      line(lk.start.x,lk.start.y,lk.end.x,lk.end.y);
    }
  }
  drawJoints(){
    for(const j of this.joints){
      const hue=map(j.level,0,this.segments,60,180);
      fill(hue,150,200); noStroke(); ellipse(j.x,j.y,8);
      fill(255,255,255,180); textSize(10); textAlign(CENTER,CENTER); text(j.id,j.x,j.y-15);
    }
  }
  drawPivots(){
    for(const p of this.pivots){
      push(); translate(p.x,p.y);
      fill(0,0,50); stroke(0,0,200); strokeWeight(3); ellipse(0,0,24);
      fill(0,0,100); stroke(0,0,255); strokeWeight(2); ellipse(0,0,16);
      fill(30,200,255); noStroke(); ellipse(0,0,8);
      stroke(255); strokeWeight(1); line(-4,0,4,0); line(0,-4,0,4);
      fill(255); textSize(12); textAlign(CENTER,CENTER); text(p.id,0,20);
      pop();
    }
  }
  drawTrail(){
    if(this.trailPoints.length<2) return;
    noFill();
    for(let i=1;i<this.trailPoints.length;i++){
      const a=this.trailPoints[i-1], b=this.trailPoints[i];
      const alpha=map(i, 0, this.trailPoints.length-1, 25, 204);
      const hue=map(i,0,this.trailPoints.length-1,240,300);
      stroke(hue,180,255,alpha); strokeWeight(2); line(a.x,a.y,b.x,b.y);
    }
  }
}
