// src/lib/physics/FixedPhysicsAdapter.ts (优化版 - 更高刷新率)
'use client';

import Matter from 'matter-js';
import { ImprovedScissorMechanism } from '../ScissorMechanism';

export interface PhysicsOptions {
  gravity?: boolean;
  stiffness?: number;
  damping?: number;
  targetFPS?: number; // 🚀 新增：目标帧率
}

export class FixedPhysicsAdapter {
  private engine: Matter.Engine;
  private world: Matter.World;
  private runner: Matter.Runner;
  private mechanism: ImprovedScissorMechanism;
  
  private jointBodies: Record<string, Matter.Body> = {};
  private linkConstraints: Matter.Constraint[] = [];
  private pivotConstraints: Matter.Constraint[] = [];
  
  private isRunning = false;
  private anchorId: string | null = null;
  private targetFPS: number;
  
  constructor(mechanism: ImprovedScissorMechanism, options: PhysicsOptions = {}) {
    this.mechanism = mechanism;
    this.targetFPS = options.targetFPS || 120; // 🚀 默认120FPS
    
    this.engine = Matter.Engine.create();
    this.world = this.engine.world;
    
    // 🚀 优化重力设置
    this.world.gravity.y = options.gravity !== false ? 0.8 : 0; // 稍微降低重力
    this.world.gravity.scale = 0.0008; // 减小重力比例
    
    // 🚀 大幅优化迭代次数以提高性能
    this.engine.positionIterations = 8;  // 从12降到8
    this.engine.velocityIterations = 6;  // 从10降到6
    this.engine.constraintIterations = 4; // 从8降到4
    
    // 🚀 启用高性能模式
    this.engine.enableSleeping = true;
    this.engine.timing.timeScale = 1.0;
    
    this.runner = Matter.Runner.create({
      delta: 1000 / this.targetFPS, // 🚀 设置目标时间步长
      isFixed: true // 🚀 固定时间步长
    });
    
    this.buildPhysicsFromMechanism();
    this.start();
  }
  
  private buildPhysicsFromMechanism() {
    this.clearPhysics();
    
    this.mechanism.joints.forEach(joint => {
      const body = Matter.Bodies.circle(joint.x, joint.y, 5, { // 🚀 稍微减小半径
        frictionAir: 0.015, // 🚀 减少空气阻力
        friction: 0.08,     // 🚀 减少摩擦
        restitution: 0.05,  // 🚀 减少弹性
        density: 0.0015,    // 🚀 降低密度
        collisionFilter: { group: -1 },
        sleepThreshold: 30, // 🚀 更快进入睡眠状态
        slop: 0.05         // 🚀 允许小幅度重叠以提高性能
      });
      
      this.jointBodies[joint.id] = body;
      Matter.World.add(this.world, body);
    });
    
    this.mechanism.links.forEach(link => {
      if (!link.start || !link.end) return;
      
      const bodyA = this.jointBodies[link.start.id];
      const bodyB = this.jointBodies[link.end.id];
      
      if (bodyA && bodyB) {
        const linkLength = Math.hypot(
          link.end.x - link.start.x,
          link.end.y - link.start.y
        );
        
        const constraint = Matter.Constraint.create({
          bodyA,
          bodyB,
          length: linkLength,
          stiffness: 1.0,        // 🚀 保持高刚度
          damping: 0.005,        // 🚀 减少阻尼
          render: { visible: false }
        });
        
        this.linkConstraints.push(constraint);
        Matter.World.add(this.world, constraint);
      }
    });
    
    this.mechanism.pivots.forEach(pivot => {
      if (!pivot.link1 || !pivot.link2) return;
      
      const link1Start = this.jointBodies[pivot.link1.start.id];
      const link1End = this.jointBodies[pivot.link1.end.id];
      const link2Start = this.jointBodies[pivot.link2.start.id];
      const link2End = this.jointBodies[pivot.link2.end.id];
      
      if (link1Start && link1End && link2Start && link2End) {
        const pivotBody = Matter.Bodies.circle(pivot.x, pivot.y, 1, { // 🚀 减小枢轴体积
          isStatic: false,
          render: { visible: false },
          collisionFilter: { group: -1 },
          sleepThreshold: 20
        });
        
        Matter.World.add(this.world, pivotBody);
        
        [link1Start, link1End, link2Start, link2End].forEach(jointBody => {
          const distance = Math.hypot(
            jointBody.position.x - pivot.x,
            jointBody.position.y - pivot.y
          );
          
          const pivotConstraint = Matter.Constraint.create({
            bodyA: pivotBody,
            bodyB: jointBody,
            length: distance,
            stiffness: 0.95,      // 🚀 稍微降低刚度
            damping: 0.03,        // 🚀 减少阻尼
            render: { visible: false }
          });
          
          this.pivotConstraints.push(pivotConstraint);
          Matter.World.add(this.world, pivotConstraint);
        });
      }
    });
    
    // 🚀 优化地面设置
    const ground = Matter.Bodies.rectangle(
      this.mechanism.centerX,
      this.mechanism.centerY + 300,
      1000,
      60,
      { 
        isStatic: true,
        friction: 0.8,
        restitution: 0.3
      }
    );
    Matter.World.add(this.world, ground);
  }
  
  private clearPhysics() {
    this.linkConstraints.forEach(c => Matter.World.remove(this.world, c));
    this.pivotConstraints.forEach(c => Matter.World.remove(this.world, c));
    this.linkConstraints = [];
    this.pivotConstraints = [];
    
    Object.values(this.jointBodies).forEach(body => {
      Matter.World.remove(this.world, body);
    });
    this.jointBodies = {};
  }
  
  setAnchor(jointId: string | null) {
    if (this.anchorId && this.jointBodies[this.anchorId]) {
      Matter.Body.setStatic(this.jointBodies[this.anchorId], false);
    }
    
    this.anchorId = jointId;
    
    if (jointId && this.jointBodies[jointId]) {
      const body = this.jointBodies[jointId];
      Matter.Body.setVelocity(body, { x: 0, y: 0 });
      Matter.Body.setAngularVelocity(body, 0);
      Matter.Body.setStatic(body, true);
    }
  }
  
  updateMechanism() {
    if (!this.isRunning) return;
    
    const positions: Record<string, { x: number; y: number }> = {};
    
    Object.entries(this.jointBodies).forEach(([id, body]) => {
      positions[id] = {
        x: body.position.x,
        y: body.position.y
      };
    });
    
    this.mechanism.applyPhysicsPositions(positions);
  }
  
  addRandomImpulse() {
    Object.values(this.jointBodies).forEach(body => {
      if (!body.isStatic) {
        const impulse = {
          x: (Math.random() - 0.5) * 0.02, // 🚀 减小冲量
          y: (Math.random() - 0.5) * 0.02
        };
        Matter.Body.applyForce(body, body.position, impulse);
      }
    });
  }
  
  start() {
    if (!this.isRunning) {
      Matter.Runner.run(this.runner, this.engine);
      this.isRunning = true;
    }
  }
  
  stop() {
    if (this.isRunning) {
      Matter.Runner.stop(this.runner);
      this.isRunning = false;
    }
  }
  
  rebuild() {
    this.buildPhysicsFromMechanism();
    
    if (this.anchorId) {
      this.setAnchor(this.anchorId);
    }
  }
  
  setGravity(enabled: boolean) {
    this.world.gravity.y = enabled ? 0.8 : 0; // 🚀 优化重力值
  }
  
  // 🚀 新增：动态调整FPS
  setTargetFPS(fps: number) {
    this.targetFPS = Math.max(30, Math.min(144, fps));
    this.runner.delta = 1000 / this.targetFPS;
  }
  
  // 🚀 新增：获取当前FPS
  getCurrentFPS(): number {
    return Math.round(1000 / this.runner.delta);
  }
  
  destroy() {
    this.stop();
    Matter.World.clear(this.world, false);
    Matter.Engine.clear(this.engine);
  }
  
  getEngine() {
    return this.engine;
  }
}