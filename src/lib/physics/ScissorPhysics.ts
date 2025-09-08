// src/lib/physics/ScissorPhysics.ts
/* 最小可用的“连杆 = 定长约束”物理层，基于 matter-js */
"use client";
import {
  Engine, World, Bodies, Body, Constraint, Runner, Composite,
  Mouse, MouseConstraint
} from "matter-js";

export type Joint = { id?: string; x: number; y: number; radius?: number; isAnchor?: boolean };
export type Rod   = { id?: string; a: number; b: number };

type JointBody = { data: Joint; body: Body };

export default class ScissorPhysics {
  private engine: Engine;
  private world: World;
  private runner: Runner;
  private joints: JointBody[] = [];
  private rods: Constraint[] = [];
  private mouseConstraint?: MouseConstraint;
  private canvas?: HTMLCanvasElement;
  private ctx?: CanvasRenderingContext2D;
  private anchorMode = false;
  private pickRadius = 18; // 点击锚点的拾取半径

  constructor() {
    this.engine = Engine.create();
    this.world = this.engine.world;
    this.world.gravity.y = 1.0;

    // 提高稳定性
    this.engine.positionIterations = 10;
    this.engine.velocityIterations = 8;
    this.engine.constraintIterations = 4;

    this.runner = Runner.create();
    Runner.run(this.runner, this.engine);
  }

  /** 绑定一个 <canvas> 用于渲染（可透明叠加到你的 SVG 上） */
  mount(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    const mouse = Mouse.create(canvas);
    this.mouseConstraint = MouseConstraint.create(this.engine, {
      mouse,
      constraint: { stiffness: 0.8, damping: 0.1, render: { visible: false } }
    });
    World.add(this.world, this.mouseConstraint);
    // 自绘循环
    const loop = () => {
      this.draw();
      requestAnimationFrame(loop);
    };
    loop();
  }

  /** 从“节点 + 边”构建物理世界 */
  loadGraph(nodes: Joint[], edges: Rod[], group: number = -1) {
    // 清空旧世界
    Composite.clear(this.world, false, true);
    this.joints = [];
    this.rods = [];

    // 1) joints
    nodes.forEach((n, i) => {
      const b = Bodies.circle(n.x, n.y, n.radius ?? 8, {
        friction: 0.05, frictionAir: 0.002, restitution: 0,
        collisionFilter: { group } // 同组不内碰撞
      });
      if (n.isAnchor) Body.setStatic(b, true);
      this.joints.push({ data: { ...n }, body: b });
      World.add(this.world, b);
    });

    // 2) rods (定长约束)
    edges.forEach((e, k) => {
      const A = this.joints[e.a].body;
      const B = this.joints[e.b].body;
      const len = Math.hypot(A.position.x - B.position.x, A.position.y - B.position.y);
      const c = Constraint.create({ bodyA: A, bodyB: B, length: len, stiffness: 1, damping: 0.02 });
      this.rods.push(c);
      World.add(this.world, c);
    });
  }

  setAnchorMode(on: boolean) { this.anchorMode = on; }
  setGravity(on: boolean) { this.world.gravity.y = on ? 1.0 : 0.0; }

  /** 在画布坐标点击，切换最近节点是否为锚点 */
  toggleAnchorAt(x: number, y: number) {
    if (!this.anchorMode) return;
    let best = -1, bestD2 = this.pickRadius * this.pickRadius;
    this.joints.forEach((j, i) => {
      const dx = j.body.position.x - x;
      const dy = j.body.position.y - y;
      const d2 = dx*dx + dy*dy;
      if (d2 < bestD2) { bestD2 = d2; best = i; }
    });
    if (best >= 0) {
      const jb = this.joints[best].body;
      if (jb.isStatic) {
        Body.setStatic(jb, false);
        this.joints[best].data.isAnchor = false;
      } else {
        Body.setVelocity(jb, { x: 0, y: 0 });
        Body.setAngularVelocity(jb, 0);
        Body.setStatic(jb, true);
        this.joints[best].data.isAnchor = true;
      }
    }
  }

  /** 把物理后的节点位置取出来（回写到你的渲染层） */
  getPositions(): { x: number; y: number }[] {
    return this.joints.map(j => ({ x: j.body.position.x, y: j.body.position.y }));
  }

  /** 简单 2D 渲染（纯演示；你也可以不画，用它只做“算位置”） */
  private draw() {
    if (!this.canvas || !this.ctx) return;
    const { width, height } = this.canvas;
    this.ctx.clearRect(0, 0, width, height);

    // rods
    this.ctx.lineWidth = 2;
    this.ctx.strokeStyle = "#111";
    this.ctx.beginPath();
    this.rods.forEach(r => {
      const A = (r.bodyA as Body).position;
      const B = (r.bodyB as Body).position;
      this.ctx.moveTo(A.x, A.y);
      this.ctx.lineTo(B.x, B.y);
    });
    this.ctx.stroke();

    // joints
    this.joints.forEach(j => {
      const p = j.body.position;
      const R = j.body.circleRadius ?? 8;
      this.ctx.fillStyle = j.body.isStatic ? "#0aaaff" : "#333";
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, R, 0, Math.PI * 2);
      this.ctx.fill();
    });
  }
}
