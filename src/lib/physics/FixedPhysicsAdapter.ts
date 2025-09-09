'use client';

import Matter from 'matter-js';
import { ImprovedScissorMechanism } from '../ScissorMechanism';

export interface PhysicsOptions {
  gravity?: boolean;
  stiffness?: number;
  damping?: number;
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
  
  constructor(mechanism: ImprovedScissorMechanism, options: PhysicsOptions = {}) {
    this.mechanism = mechanism;
    
    this.engine = Matter.Engine.create();
    this.world = this.engine.world;
    
    this.world.gravity.y = options.gravity !== false ? 1.0 : 0;
    this.world.gravity.scale = 0.001;
    
    this.engine.positionIterations = 12;
    this.engine.velocityIterations = 10;
    this.engine.constraintIterations = 8;
    
    this.runner = Matter.Runner.create();
    
    this.buildPhysicsFromMechanism();
    this.start();
  }
  
  private buildPhysicsFromMechanism() {
    this.clearPhysics();
    
    this.mechanism.joints.forEach(joint => {
      const body = Matter.Bodies.circle(joint.x, joint.y, 6, {
        frictionAir: 0.02,
        friction: 0.1,
        restitution: 0.1,
        density: 0.002,
        collisionFilter: { group: -1 }
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
          stiffness: 1.0,
          damping: 0.01,
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
        const pivotBody = Matter.Bodies.circle(pivot.x, pivot.y, 2, {
          isStatic: false,
          render: { visible: false },
          collisionFilter: { group: -1 }
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
            stiffness: 0.9,
            damping: 0.05,
            render: { visible: false }
          });
          
          this.pivotConstraints.push(pivotConstraint);
          Matter.World.add(this.world, pivotConstraint);
        });
      }
    });
    
    const ground = Matter.Bodies.rectangle(
      this.mechanism.centerX,
      this.mechanism.centerY + 300,
      1000,
      60,
      { isStatic: true }
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
          x: (Math.random() - 0.5) * 0.03,
          y: (Math.random() - 0.5) * 0.03
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
    this.world.gravity.y = enabled ? 1.0 : 0;
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