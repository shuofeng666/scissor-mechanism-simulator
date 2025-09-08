// src/components/PhysicsCanvas.tsx
"use client";
import React, { useEffect, useRef } from "react";
import ScissorPhysics, { Joint, Rod } from "@/lib/physics/ScissorPhysics";

type Props = {
  width: number;
  height: number;
  joints: Joint[];   // 你的“节点数组” -> {x,y}
  rods: Rod[];       // 你的“边数组” -> {a,b}
  anchorMode: boolean;
  gravityOn: boolean;
  /** 可选：每帧把位置回传给父层（用于你原来的 SVG 渲染） */
  onPositions?: (pts: {x:number;y:number}[]) => void;
};

export default function PhysicsCanvas({
  width, height, joints, rods, anchorMode, gravityOn, onPositions
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const physicsRef = useRef<ScissorPhysics | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    // 调整像素比，画面更清晰
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    const ctx = canvas.getContext("2d")!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const phys = new ScissorPhysics();
    phys.mount(canvas);
    phys.loadGraph(joints, rods);
    phys.setAnchorMode(anchorMode);
    phys.setGravity(gravityOn);
    physicsRef.current = phys;

    let raf = 0;
    const tick = () => {
      onPositions?.(phys.getPositions());
      raf = requestAnimationFrame(tick);
    };
    tick();

    const onClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      phys.toggleAnchorAt(x, y);
    };
    canvas.addEventListener("click", onClick);

    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener("click", onClick);
    };
  }, [width, height]);

  useEffect(() => {
    physicsRef.current?.setAnchorMode(anchorMode);
  }, [anchorMode]);

  useEffect(() => {
    physicsRef.current?.setGravity(gravityOn);
  }, [gravityOn]);

  useEffect(() => {
    // 当你的图拓扑改变时，重载
    physicsRef.current?.loadGraph(joints, rods);
  }, [joints, rods]);

  return (
    <canvas ref={canvasRef} style={{ display: "block" }} />
  );
}
