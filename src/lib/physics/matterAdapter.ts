"use client";
import Matter from "matter-js";
import { ImprovedScissorMechanism } from "../ScissorMechanism";

type BodiesMap = Record<string, Matter.Body>;

export type PhysicsHandle = {
  engine: Matter.Engine;
  world: Matter.World;
  bodies: BodiesMap;
  constraints: Matter.Constraint[];
  runner: Matter.Runner;
  anchorId: string | null;
  setAnchor: (id: string | null) => void;
  setGravity: (on: boolean) => void;
  setDamping: (linear: number, air: number) => void;
  stepAndWriteBack: () => void;
  destroy: () => void;
};

export function buildWorldFromMechanism(
  mech: ImprovedScissorMechanism,
  options?: {
    gravity?: boolean;
    worldBounds?: { minX: number; minY: number; maxX: number; maxY: number };
    damping?: { linear?: number; air?: number };
  }
): PhysicsHandle {
  const engine = Matter.Engine.create();
  const world  = engine.world;

  // 重力 & 迭代数：稳定一点
  world.gravity.y = options?.gravity === false ? 0 : 1;
  engine.positionIterations = 10;
  engine.velocityIterations = 8;
  engine.constraintIterations = 4;

  const { joints, rods } = mech.toPhysicsGraph();
  const bodies: BodiesMap = {};
  const constraints: Matter.Constraint[] = [];

  // 1) joints → circle bodies（半径 6px）
  for (const j of joints) {
    const b = Matter.Bodies.circle(j.x, j.y, 6, {
      friction: options?.damping?.linear ?? 0.05,
      frictionAir: options?.damping?.air ?? 0.01,
      restitution: 0,
      collisionFilter: { group: -1 }, // 内部不互撞
    });
    (b as any).__id = j.id; // 标记回写
    bodies[j.id] = b;
    Matter.World.add(world, b);
  }

  // 2) rods → 距离约束（定长，像无质量刚性杆）
  for (const r of rods) {
    const A = bodies[r.a], B = bodies[r.b];
    if (!A || !B) continue;
    const len = Math.hypot(A.position.x - B.position.x, A.position.y - B.position.y);
    const c = Matter.Constraint.create({
      bodyA: A, bodyB: B, length: len,
      stiffness: 1, damping: 0.03, render: { visible: false }
    });
    constraints.push(c);
    Matter.World.add(world, c);
  }

  // 3) 世界边界（可选）
  if (options?.worldBounds) {
    const { minX, minY, maxX, maxY } = options.worldBounds;
    const w = maxX - minX, h = maxY - minY;
    const thick = 100;
    const walls = [
      Matter.Bodies.rectangle(minX - thick/2, (minY + maxY)/2, thick, h + thick*2, { isStatic: true }),
      Matter.Bodies.rectangle(maxX + thick/2, (minY + maxY)/2, thick, h + thick*2, { isStatic: true }),
      Matter.Bodies.rectangle((minX + maxX)/2, minY - thick/2, w + thick*2, thick, { isStatic: true }),
      Matter.Bodies.rectangle((minX + maxX)/2, maxY + thick/2, w + thick*2, thick, { isStatic: true }),
    ];
    Matter.World.add(world, walls);
  }

  // 4) 运行器
  const runner = Matter.Runner.create();
  Matter.Runner.run(runner, engine);

  // 5) API
  let anchorId: string | null = null;

  function setAnchor(id: string | null) {
    // 取消旧 anchor
    if (anchorId && bodies[anchorId]) {
      Matter.Body.setStatic(bodies[anchorId], false);
    }
    anchorId = id;
    if (anchorId && bodies[anchorId]) {
      // 清零速度再设静态，稳定
      const b = bodies[anchorId];
      Matter.Body.setVelocity(b, { x: 0, y: 0 });
      Matter.Body.setAngularVelocity(b, 0);
      Matter.Body.setStatic(b, true);
    }
  }

  function setGravity(on: boolean) {
    world.gravity.y = on ? 1 : 0;
  }

  function setDamping(linear: number, air: number) {
    for (const id in bodies) {
      const b = bodies[id];
      (b as any).friction = linear;
      (b as any).frictionAir = air;
    }
  }

  function stepAndWriteBack() {
    // 你也可以手动 Engine.update；Runner 已在跑，这里只负责回写
    const positions: Record<string, { x: number; y: number }> = {};
    for (const id in bodies) {
      const b = bodies[id];
      positions[(b as any).__id] = { x: b.position.x, y: b.position.y };
    }
    mech.applyPhysicsPositions(positions);
  }

  function destroy() {
    Matter.Runner.stop(runner);
    Matter.World.clear(world, false);
    Matter.Engine.clear(engine);
  }

  // 初始阻尼
  if (options?.damping) {
    setDamping(options.damping.linear ?? 0.05, options.damping.air ?? 0.01);
  }

  return { engine, world, bodies, constraints, runner, anchorId, setAnchor, setGravity, setDamping, stepAndWriteBack, destroy };
}
