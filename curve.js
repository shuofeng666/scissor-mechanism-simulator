// 生成各类基准曲线
class CurveGenerator {
  static generateArc(length, curvature){
    const pts=[], seg=100;
    const radius = length/(curvature*Math.PI);
    const angle  = curvature*Math.PI;
    for(let i=0;i<=seg;i++){
      const t=i/seg, a=(t-0.5)*angle;
      const x= radius*Math.sin(a);
      const y= radius*(Math.cos(a)-1);
      pts.push({x,y,t});
    }
    return pts;
  }
  static generateSine(length, curvature){
    const pts=[], seg=100;
    for(let i=0;i<=seg;i++){
      const t=i/seg;
      const x=(t-0.5)*length;
      const y= curvature*50*Math.sin(4*Math.PI*t);
      pts.push({x,y,t});
    }
    return pts;
  }
  static generateSpiral(length, curvature){
    const pts=[], seg=100;
    for(let i=0;i<=seg;i++){
      const t=i/seg, ang=curvature*4*Math.PI*t, r=t*length/6;
      pts.push({x:r*Math.cos(ang), y:r*Math.sin(ang), t});
    }
    return pts;
  }
  static generateBezier(length, curvature){
    const pts=[], seg=100;
    const p0={x:-length/2,y:0}, p1={x:-length/4,y:-curvature*80},
          p2={x: length/4,y: curvature*80},  p3={x: length/2,y:0};
    for(let i=0;i<=seg;i++){
      const t=i/seg, u=1-t;
      const x=u*u*u*p0.x + 3*u*u*t*p1.x + 3*u*t*t*p2.x + t*t*t*p3.x;
      const y=u*u*u*p0.y + 3*u*u*t*p1.y + 3*u*t*t*p2.y + t*t*t*p3.y;
      pts.push({x,y,t});
    }
    return pts;
  }
}
