// src/lib/InteractiveDeformation.ts (修复空值检查版)
'use client';

import { ImprovedScissorMechanism, Point } from './ScissorMechanism';

export interface DeformationState {
  isDragging: boolean;
  draggedNodeId: string | null;
  draggedNodeType: 'joint' | 'pivot' | null;
  initialMousePos: Point | null;
  initialNodePos: Point | null;
}

export class InteractiveDeformationSystem {
  private mechanism: ImprovedScissorMechanism;
  private state: DeformationState;
  private anchorId: string | null = null;

  constructor(mechanism: ImprovedScissorMechanism) {
    this.mechanism = mechanism;
    this.state = {
      isDragging: false,
      draggedNodeId: null,
      draggedNodeType: null,
      initialMousePos: null,
      initialNodePos: null
    };
  }

  setAnchor(nodeId: string | null) {
    this.anchorId = nodeId;
  }

  startDrag(nodeId: string, nodeType: 'joint' | 'pivot', mousePos: Point): boolean {
    // 不能拖拽锚点
    if (nodeId === this.anchorId) {
      return false;
    }

    // 找到节点
    const node = nodeType === 'joint' 
      ? this.mechanism.joints.find(j => j.id === nodeId)
      : this.mechanism.pivots.find(p => p.id === nodeId);

    if (!node) return false;

    this.state = {
      isDragging: true,
      draggedNodeId: nodeId,
      draggedNodeType: nodeType,
      initialMousePos: { ...mousePos },
      initialNodePos: { x: node.x, y: node.y }
    };

    return true;
  }

  updateDrag(mousePos: Point): boolean {
    if (!this.state.isDragging || !this.state.draggedNodeId || !this.state.initialMousePos || !this.state.initialNodePos) {
      return false;
    }

    // 计算鼠标移动的偏移量
    const dx = mousePos.x - this.state.initialMousePos.x;
    const dy = mousePos.y - this.state.initialMousePos.y;

    // 计算新的节点位置
    const newPos = {
      x: this.state.initialNodePos.x + dx,
      y: this.state.initialNodePos.y + dy
    };

    // 更新节点位置并重新计算机构
    this.updateNodePosition(this.state.draggedNodeId, this.state.draggedNodeType!, newPos);
    
    return true;
  }

  endDrag(): boolean {
    if (!this.state.isDragging) return false;

    this.state = {
      isDragging: false,
      draggedNodeId: null,
      draggedNodeType: null,
      initialMousePos: null,
      initialNodePos: null
    };

    return true;
  }

  private updateNodePosition(nodeId: string, nodeType: 'joint' | 'pivot', newPos: Point) {
    if (nodeType === 'joint') {
      // 更新关节位置
      const joint = this.mechanism.joints.find(j => j.id === nodeId);
      if (joint) {
        joint.x = newPos.x;
        joint.y = newPos.y;
      }
    } else if (nodeType === 'pivot') {
      // 更新支点位置
      const pivot = this.mechanism.pivots.find(p => p.id === nodeId);
      if (pivot) {
        pivot.x = newPos.x;
        pivot.y = newPos.y;
      }
    }

    // 重新计算相关的连杆和约束
    this.recalculateConstraints(nodeId, nodeType);
  }

  private recalculateConstraints(changedNodeId: string, nodeType: 'joint' | 'pivot') {
    if (nodeType === 'joint') {
      // 重新计算涉及这个关节的所有连杆
      this.mechanism.links.forEach(link => {
        if (link.start.id === changedNodeId || link.end.id === changedNodeId) {
          // 重新计算这个连杆的支点位置（如果有的话）
          if (link.pivot) {
            // 找到与这个连杆相交的另一个连杆
            const otherLink = this.mechanism.links.find(otherLink => 
              otherLink !== link && 
              otherLink.pivot && 
              link.pivot && // 修复：添加 link.pivot 的空值检查
              otherLink.pivot.id === link.pivot.id
            );

            if (otherLink && otherLink.pivot && link.pivot) {
              // 重新计算两条连杆的交点作为支点位置
              const intersection = this.mechanism.lineIntersection(
                link.start, link.end,
                otherLink.start, otherLink.end
              );

              if (intersection) {
                // 更新支点位置
                link.pivot.x = intersection.x;
                link.pivot.y = intersection.y;
                otherLink.pivot.x = intersection.x;
                otherLink.pivot.y = intersection.y;
              }
            }
          }
        }
      });
    } else if (nodeType === 'pivot') {
      // 支点被拖拽时，需要调整相关的连杆
      // 这种情况比较复杂，可能需要重新计算整个机构
      this.recalculateEntireMechanism();
    }

    // 更新轨迹
    this.mechanism.updateTrail();
  }

  private recalculateEntireMechanism() {
    // 保持锚点固定，重新计算其他部分
    // 这是一个简化的实现，实际可能需要更复杂的约束求解
    
    // 重新计算所有支点位置
    this.mechanism.pivots.forEach(pivot => {
      const relatedLinks = this.mechanism.links.filter(link => 
        link.pivot && link.pivot.id === pivot.id
      );

      if (relatedLinks.length >= 2) {
        const link1 = relatedLinks[0];
        const link2 = relatedLinks[1];
        
        // 修复：确保 start 和 end 不为空
        if (link1.start && link1.end && link2.start && link2.end) {
          const intersection = this.mechanism.lineIntersection(
            link1.start, link1.end,
            link2.start, link2.end
          );

          if (intersection) {
            pivot.x = intersection.x;
            pivot.y = intersection.y;
          }
        }
      }
    });
  }

  isDragging(): boolean {
    return this.state.isDragging;
  }

  getDraggedNodeId(): string | null {
    return this.state.draggedNodeId;
  }

  // 获取可拖拽的节点（排除锚点）
  getDraggableNodes(): Array<{id: string, type: 'joint' | 'pivot', pos: Point}> {
    const nodes: Array<{id: string, type: 'joint' | 'pivot', pos: Point}> = [];

    // 添加可拖拽的关节
    this.mechanism.joints.forEach(joint => {
      if (joint.id !== this.anchorId) {
        nodes.push({
          id: joint.id,
          type: 'joint',
          pos: { x: joint.x, y: joint.y }
        });
      }
    });

    // 添加可拖拽的支点
    this.mechanism.pivots.forEach(pivot => {
      if (pivot.id !== this.anchorId) {
        nodes.push({
          id: pivot.id,
          type: 'pivot',
          pos: { x: pivot.x, y: pivot.y }
        });
      }
    });

    return nodes;
  }
}