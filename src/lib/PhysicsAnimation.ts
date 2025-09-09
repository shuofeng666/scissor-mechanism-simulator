// src/lib/PhysicsAnimation.ts
'use client';

import Matter from 'matter-js';
import { FixedPhysicsAdapter } from './physics/FixedPhysicsAdapter';

export interface PhysicsAnimationConfig {
  // 重力波动
  gravityWave?: {
    enabled: boolean;
    amplitude: number; // 重力变化幅度 (0.2 - 2.0)
    frequency: number; // 变化频率 (0.1 - 1.0)
    baseGravity: number; // 基础重力值
  };
  
  // 周期性扰动
  periodicShake?: {
    enabled: boolean;
    interval: number; // 扰动间隔 (秒)
    intensity: number; // 扰动强度
  };
  
  // 锚点动画
  anchorAnimation?: {
    enabled: boolean;
    type: 'circle' | 'figure8' | 'random';
    radius: number; // 运动半径
    speed: number; // 运动速度
  };
}

export class PhysicsAnimationSystem {
  private physicsAdapter: FixedPhysicsAdapter;
  private animationFrame: number | null = null;
  private startTime: number = 0;
  private isRunning: boolean = false;
  private lastShakeTime: number = 0;
  
  private config: PhysicsAnimationConfig = {
    gravityWave: {
      enabled: true,
      amplitude: 0.4,
      frequency: 0.3,
      baseGravity: 0.8
    },
    periodicShake: {
      enabled: true,
      interval: 3, // 每3秒自动扰动一次
      intensity: 0.015
    },
    anchorAnimation: {
      enabled: false,
      type: 'circle',
      radius: 30,
      speed: 0.5
    }
  };

  constructor(physicsAdapter: FixedPhysicsAdapter) {
    this.physicsAdapter = physicsAdapter;
  }

  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.startTime = performance.now();
    this.lastShakeTime = this.startTime;
    this.animate();
  }

  stop() {
    this.isRunning = false;
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }

  updateConfig(newConfig: Partial<PhysicsAnimationConfig>) {
    this.config = {
      gravityWave: { ...this.config.gravityWave, ...newConfig.gravityWave },
      periodicShake: { ...this.config.periodicShake, ...newConfig.periodicShake },
      anchorAnimation: { ...this.config.anchorAnimation, ...newConfig.anchorAnimation }
    };
  }

  private animate = () => {
    if (!this.isRunning) return;

    const currentTime = performance.now();
    const elapsed = (currentTime - this.startTime) / 1000; // 转换为秒

    // 1. 重力波动动画
    if (this.config.gravityWave?.enabled) {
      this.animateGravity(elapsed);
    }

    // 2. 周期性扰动
    if (this.config.periodicShake?.enabled) {
      this.animatePeriodicShake(currentTime);
    }

    // 3. 锚点动画 (如果有锚点的话)
    if (this.config.anchorAnimation?.enabled) {
      this.animateAnchor(elapsed);
    }

    this.animationFrame = requestAnimationFrame(this.animate);
  };

  private animateGravity(elapsed: number) {
    const wave = this.config.gravityWave!;
    const gravity = wave.baseGravity + Math.sin(elapsed * wave.frequency * Math.PI * 2) * wave.amplitude;
    
    // 更新物理引擎的重力
    const engine = this.physicsAdapter.getEngine();
    if (engine) {
      engine.world.gravity.y = Math.max(0, gravity);
    }
  }

  private animatePeriodicShake(currentTime: number) {
    const shake = this.config.periodicShake!;
    const timeSinceLastShake = (currentTime - this.lastShakeTime) / 1000;
    
    if (timeSinceLastShake >= shake.interval) {
      // 添加随机扰动
      this.physicsAdapter.addRandomImpulse();
      this.lastShakeTime = currentTime;
    }
  }

  private animateAnchor(elapsed: number) {
    // 这个功能可以后续扩展，让锚点也能运动
    // 目前先保留接口
  }

  // 手动触发特殊动画
  triggerExplosion(intensity: number = 0.05) {
    // 强力扰动，模拟"爆炸"效果
    const engine = this.physicsAdapter.getEngine();
    if (!engine) return;

    // 对所有物体施加随机冲量
    engine.world.bodies.forEach(body => {
      if (!body.isStatic) {
        const impulse = {
          x: (Math.random() - 0.5) * intensity,
          y: (Math.random() - 0.5) * intensity
        };
        Matter.Body.applyForce(body, body.position, impulse);
      }
    });
  }

  triggerWave(direction: 'left' | 'right' | 'up' | 'down', intensity: number = 0.03) {
    // 定向波浪扰动
    const engine = this.physicsAdapter.getEngine();
    if (!engine) return;

    const impulseMap = {
      left: { x: -intensity, y: 0 },
      right: { x: intensity, y: 0 },
      up: { x: 0, y: -intensity },
      down: { x: 0, y: intensity }
    };

    const impulse = impulseMap[direction];

    engine.world.bodies.forEach(body => {
      if (!body.isStatic) {
        Matter.Body.applyForce(body, body.position, impulse);
      }
    });
  }

  // 预设动画配置
  static presets = {
    gentle: {
      gravityWave: {
        enabled: true,
        amplitude: 0.2,
        frequency: 0.2,
        baseGravity: 0.8
      },
      periodicShake: {
        enabled: true,
        interval: 5,
        intensity: 0.008
      }
    },
    
    dynamic: {
      gravityWave: {
        enabled: true,
        amplitude: 0.5,
        frequency: 0.4,
        baseGravity: 0.8
      },
      periodicShake: {
        enabled: true,
        interval: 2,
        intensity: 0.02
      }
    },
    
    chaotic: {
      gravityWave: {
        enabled: true,
        amplitude: 0.8,
        frequency: 0.8,
        baseGravity: 1.0
      },
      periodicShake: {
        enabled: true,
        interval: 1,
        intensity: 0.04
      }
    }
  };

  applyPreset(presetName: keyof typeof PhysicsAnimationSystem.presets) {
    const preset = PhysicsAnimationSystem.presets[presetName];
    this.updateConfig(preset);
  }

  getConfig(): PhysicsAnimationConfig {
    return { ...this.config };
  }

  isAnimating(): boolean {
    return this.isRunning;
  }
}