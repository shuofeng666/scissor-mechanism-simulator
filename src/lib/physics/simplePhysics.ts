// src/lib/physics/simplePhysics.ts
'use client';

import Matter from 'matter-js';
import { ImprovedScissorMechanism } from '../ScissorMechanism';

export interface PhysicsOptions {
  gravity?: boolean;
  stiffness?: number;
  damping?: number;
}

export class SimplePhysicsAdapter {
  private engine: Matter.Engine;
  private world: Matter.World;
  private runner: Matter.Runner;
  private bodies: Record<string, Matter.Body> = {};
  private constraints: Matter.Constraint[] = [];
  private mechanism: ImprovedScissorMechanism;
  
  constructor(mechanism: ImprovedScissorMechanism, options: PhysicsOptions = {}) {
    this.mechanism = mechanism;
    
    // 创建引擎
    this.engine = Matter.Engine.create();
    this.world = this.engine.world;
    
    // 设置重力
    this.world.gravity.y = options.gravity !== false ? 0.8 : 0;
    
    // 提高稳定性
    this.engine.positionIterations = 6;
    this.engine.velocityIterations = 4;
    this.engine.constraintIterations = 2;
    
    // 创建运行器
    this.runner = Matter.Runner.create();
    
    this.setupPhysics(options);
    Matter.Runner.run(this.runner, this.engine);
  }
  
  private setupPhysics(options: PhysicsOptions) {
    const { joints, rods } = this.mechanism.toPhysicsGraph();
    
    // 清空旧的
    this.bodies = {};
    this.constraints.forEach(c => Matter.World.remove(this.world, c));
    this.constraints = [];
    
    // 创建关节点作为刚体
    joints.forEach(joint => {
      const body = Matter.Bodies.circle(joint.x, joint.y, 8, {
        frictionAir: options.damping || 0.02,
        friction: 0.1,
        restitution: 0.3,
        collisionFilter: { group: -1 } // 内部不碰撞
      });
      
      this.bodies[joint.id] = body;
      Matter.World.add(this.world, body);
    });
    
    // 创建连杆约束（类似 chains）
    rods.forEach(rod => {
      const bodyA = this.bodies[rod.a];
      const bodyB = this.bodies[rod.b];
      
      if (bodyA && bodyB) {
        const distance = Matter.Vector.magnitude(
          Matter.Vector.sub(bodyA.position, bodyB.position)
        );
        
        const constraint = Matter.Constraint.create({
          bodyA,
          bodyB,
          length: distance,
          stiffness: options.stiffness || 0.9,
          damping: 0.1,
          render: { visible: false }
        });
        
        this.constraints.push(constraint);
        Matter.World.add(this.world, constraint);
      }
    });
    
    // 添加地面
    const ground = Matter.Bodies.rectangle(
      this.mechanism.centerX, 
      this.mechanism.centerY + 400, 
      2000, 
      60, 
      { isStatic: true }
    );
    Matter.World.add(this.world, ground);
  }
  
  // 设置锚点（固定某个关节）
  setAnchor(jointId: string | null) {
    Object.values(this.bodies).forEach(body => {
      Matter.Body.setStatic(body, false);
    });
    
    if (jointId && this.bodies[jointId]) {
      const body = this.bodies[jointId];
      Matter.Body.setVelocity(body, { x: 0, y: 0 });
      Matter.Body.setAngularVelocity(body, 0);
      Matter.Body.setStatic(body, true);
    }
  }
  
  // 每帧更新：从物理世界回写坐标到机构
  update() {
    const positions: Record<string, { x: number; y: number }> = {};
    
    Object.entries(this.bodies).forEach(([id, body]) => {
      positions[id] = {
        x: body.position.x,
        y: body.position.y
      };
    });
    
    this.mechanism.applyPhysicsPositions(positions);
  }
  
  // 清理资源
  destroy() {
    Matter.Runner.stop(this.runner);
    Matter.World.clear(this.world, false);
    Matter.Engine.clear(this.engine);
  }
  
  // 获取引擎（用于调试）
  getEngine() {
    return this.engine;
  }
}