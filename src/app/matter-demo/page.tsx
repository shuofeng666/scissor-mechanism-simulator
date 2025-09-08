// src/app/page.tsx
"use client";
import React, { useMemo, useState, useCallback } from "react";
import PhysicsCanvas from "@/components/PhysicsCanvas";
import type { Joint, Rod } from "@/lib/physics/ScissorPhysics";

export default function HomePage() {
  // ===== 控制项 =====
  const [anchorMode, setAnchorMode] = useState(true);
  const [gravityOn, setGravityOn] = useState(true);
  const [preset, setPreset] = useState<"cell" | "chain">("cell"); // 数据集切换
  const [positions, setPositions] = useState<{ x: number; y: number }[] | null>(null);

  // 画布尺寸（按你的布局改）
  const W = 1000;
  const H = 600;

  // ===== 示例 1：单个剪刀单元 =====
  const cellData = useMemo(() => {
    const cx = W * 0.5,
      cy = H * 0.4,
      span = 300,
      h = 120;
    const joints: Joint[] = [
      { x: cx - span / 2, y: cy - h / 2 }, // 0 左上
      { x: cx + span / 2, y: cy - h / 2 }, // 1 右上
      { x: cx - span / 2, y: cy + h / 2 }, // 2 左下
      { x: cx + span / 2, y: cy + h / 2 }, // 3 右下
    ];
    const rods: Rod[] = [
      { a: 0, b: 3 },
      { a: 1, b: 2 }, // 交叉
      { a: 0, b: 1 },
      { a: 2, b: 3 }, // 上下横向增加稳定
    ];
    return { joints, rods };
  }, [W, H]);

  // ===== 示例 2：两节剪刀链（四组点，三组交叉）=====
  const chainData = useMemo(() => {
    const cx = W * 0.5,
      cy = H * 0.45,
      span = 480, // 总跨距更大
      h = 120;

    // 四列 × 两行 = 8 个点
    const cols = 4;
    const dx = span / (cols - 1);
    const x0 = cx - span / 2;

    const top: Joint[] = new Array(cols).fill(0).map((_, i) => ({
      x: x0 + i * dx,
      y: cy - h / 2,
    }));
    const bottom: Joint[] = new Array(cols).fill(0).map((_, i) => ({
      x: x0 + i * dx,
      y: cy + h / 2,
    }));

    const joints: Joint[] = [...top, ...bottom];

    const rods: Rod[] = [];
    // 每段交叉： (top[i], bottom[i+1]) & (top[i+1], bottom[i])
    for (let i = 0; i < cols - 1; i++) {
      rods.push({ a: i, b: cols + i + 1 }); // 上 i  — 下 i+1
      rods.push({ a: i + 1, b: cols + i }); // 上 i+1 — 下 i
    }
    // 顶部与底部横向（加稳定）
    for (let i = 0; i < cols - 1; i++) {
      rods.push({ a: i, b: i + 1 }); // 顶部
      rods.push({ a: cols + i, b: cols + i + 1 }); // 底部
    }

    return { joints, rods };
  }, [W, H]);

  // ===== 根据预设选择数据 =====
  const { joints, rods } = preset === "cell" ? cellData : chainData;

  // ===== 把物理结果位置回传（可用于你的 SVG 层渲染）=====
  const handlePositions = useCallback((pts: { x: number; y: number }[]) => {
    setPositions(pts);
    // TODO: 如果你有自己的 SVG/Three 渲染，把 pts 写回去更新
  }, []);

  // ===== 简单的“重置”功能：切换一次数据再切回来（触发重新 loadGraph）=====
  const resetPhysics = () => {
    setPreset((p) => (p === "cell" ? "chain" : "cell"));
    setTimeout(() => setPreset((p) => (p === "cell" ? "chain" : "cell")), 0);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部控制条 */}
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b">
        <div className="max-w-[1100px] mx-auto px-4 py-3 flex flex-wrap items-center gap-4">
          <h1 className="text-lg font-semibold">Scissor Mechanism — Anchor Mode</h1>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={anchorMode}
                onChange={(e) => setAnchorMode(e.target.checked)}
              />
              Anchor Mode
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={gravityOn}
                onChange={(e) => setGravityOn(e.target.checked)}
              />
              Gravity
            </label>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={preset}
              onChange={(e) => setPreset(e.target.value as "cell" | "chain")}
              className="border rounded px-2 py-1 text-sm"
            >
              <option value="cell">Single Cell</option>
              <option value="chain">Two-Stage Chain</option>
            </select>
            <button
              onClick={resetPhysics}
              className="text-sm px-3 py-1.5 rounded bg-gray-900 text-white"
            >
              Reset
            </button>
          </div>

          <div className="ml-auto text-xs text-gray-500">
            提示：Anchor Mode 开启后，<b>点击节点</b>即可固定/解锁；按住鼠标拖拽节点会联动其他杆件。
          </div>
        </div>
      </div>

      {/* 画布容器（可按你的布局改） */}
      <div className="max-w-[1100px] mx-auto px-4 py-6">
        <div
          className="relative border rounded-xl overflow-hidden bg-white shadow-sm"
          style={{ width: W, height: H }}
        >
          {/* 你的原有 SVG/Canvas 渲染层（可选） */}
          {/* <YourSvgRenderer points={positions ?? joints} edges={rods} /> */}

          {/* 物理层（透明画布，接管拖拽与锚点点击） */}
          <div className="absolute inset-0">
            <PhysicsCanvas
              width={W}
              height={H}
              joints={joints}
              rods={rods}
              anchorMode={anchorMode}
              gravityOn={gravityOn}
              onPositions={handlePositions}
            />
          </div>
        </div>

        {/* 仅用于调试：实时显示第一个点的位置 */}
        <div className="text-sm text-gray-600 mt-3">
          {positions ? (
            <span>
              p0: ({positions[0]?.x.toFixed(1)}, {positions[0]?.y.toFixed(1)})
            </span>
          ) : (
            <span>p0: —</span>
          )}
        </div>
      </div>
    </div>
  );
}
