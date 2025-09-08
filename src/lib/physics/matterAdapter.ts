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
  // 清理旧的 anchor（关节静态 & 枢轴锚体）
  if (anchorId && bodies[anchorId]) {
    Matter.Body.setStatic(bodies[anchorId], false);
  }
  // 如果之前创建过枢轴-锚体，移除它和它的约束
  if ((setAnchor as any).__pivotAnchor) {
    const pa = (setAnchor as any).__pivotAnchor as {
      body: Matter.Body; cons: Matter.Constraint[];
    };
    pa.cons.forEach(c => Matter.World.remove(world, c));
    Matter.World.remove(world, pa.body);
    (setAnchor as any).__pivotAnchor = null;
  }

  anchorId = id;

  if (!anchorId) return;

  // 情况 A：关节（例如 "L3" / "R2"）
  if (bodies[anchorId]) {
    const b = bodies[anchorId];
    Matter.Body.setVelocity(b, { x: 0, y: 0 });
    Matter.Body.setAngularVelocity(b, 0);
    Matter.Body.setStatic(b, true);
    return;
  }

  // 情况 B：枢轴（例如 "P0"）
  // 从机制中找到该段的四个相关关节：LB, RB, LT, RT
  if (/^P\d+$/.test(anchorId)) {
    const seg = parseInt(anchorId.slice(1), 10);
    // joints 在机制中排列：每个 level 有 L、R 两个，索引 = level*2 (+0 = L, +1 = R)
    const LB = mech.joints[seg * 2];
    const RB = mech.joints[seg * 2 + 1];
    const LT = mech.joints[(seg + 1) * 2];
    const RT = mech.joints[(seg + 1) * 2 + 1];

    if (!(LB && RB && LT && RT)) return;

    const pivot = mech.pivots.find(p => p.id === anchorId);
    if (!pivot) return;

    // 1) 创建一个静态圆点作为“地锚”
    const anchorBody = Matter.Bodies.circle(pivot.x, pivot.y, 2, { isStatic: true });

    // 2) 与四个关节各连一条距离约束（长度=当前距离）
    const cons: Matter.Constraint[] = [];
    for (const j of [LB, RB, LT, RT]) {
      const bj = bodies[j.id];
      if (!bj) continue;
      const L = Math.hypot(bj.position.x - pivot.x, bj.position.y - pivot.y);
      const c = Matter.Constraint.create({
        bodyA: anchorBody, bodyB: bj,
        length: L, stiffness: 1, damping: 0.03, render: { visible: false }
      });
      cons.push(c);
    }

    Matter.World.add(world, [anchorBody, ...cons]);
    (setAnchor as any).__pivotAnchor = { body: anchorBody, cons };
    return;
  }

  // 其它 id：忽略
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
