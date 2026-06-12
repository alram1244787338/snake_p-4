/**
 * EntityRegistry — 统一的实体注册与碰撞查询中心
 *
 * 所有需要参与碰撞/占位判断的实体都在这里注册自己的位置和尺寸。
 * 新实体只需要 register → updatePosition → unregister 就能融入碰撞体系，
 * 无需每个模块都手写一套坐标比较逻辑。
 */

import { GRID_SIZE, rectsOverlap, Position } from './GridSystem';

/* ───────── 类型定义 ───────── */

/** 实体类型枚举 —— 扩展新实体时只需在这里添加新类型 */
export type EntityType =
  | 'snake_head'
  | 'food'
  | 'obstacle'
  | 'boss'
  | 'bullet';

/** 注册到 Registry 的实体数据 */
export interface RegisteredEntity {
  id: string;
  type: EntityType;
  x: number;
  y: number;
  width: number;
  height: number;
}

/* ───────── 实现 ───────── */

class EntityRegistryImpl {
  private entities = new Map<string, RegisteredEntity>();

  /* ── 注册 / 注销 ─────────────────────── */

  register(entity: RegisteredEntity): void {
    this.entities.set(entity.id, entity);
  }

  unregister(id: string): void {
    this.entities.delete(id);
  }

  updatePosition(id: string, x: number, y: number): void {
    const e = this.entities.get(id);
    if (e) {
      e.x = x;
      e.y = y;
    }
  }

  /* ── 查询 ──────────────────────────── */

  get(id: string): RegisteredEntity | undefined {
    return this.entities.get(id);
  }

  getByType(type: EntityType): RegisteredEntity[] {
    const result: RegisteredEntity[] = [];
    for (const e of this.entities.values()) {
      if (e.type === type) result.push(e);
    }
    return result;
  }

  /** 获取所有实体的左上角坐标 */
  getOccupiedPositions(): Position[] {
    return Array.from(this.entities.values()).map(e => ({ x: e.x, y: e.y }));
  }

  /** 按类型过滤后返回坐标列表 */
  getOccupiedPositionsByTypes(types: EntityType[]): Position[] {
    return Array.from(this.entities.values())
      .filter(e => types.includes(e.type))
      .map(e => ({ x: e.x, y: e.y }));
  }

  /* ── 碰撞检测 ────────────────────────── */

  /**
   * 在指定矩形范围内，查找第一个与之重叠的实体。
   * 可以用 filterTypes 限定只检测某些类型的实体。
   */
  findColliding(
    x: number, y: number, w: number, h: number,
    filterTypes?: EntityType[],
  ): RegisteredEntity | null {
    for (const entity of this.entities.values()) {
      if (filterTypes && !filterTypes.includes(entity.type)) continue;
      if (rectsOverlap(x, y, w, h, entity.x, entity.y, entity.width, entity.height)) {
        return entity;
      }
    }
    return null;
  }

  /**
   * 便捷方法：检测一个格子（GRID_SIZE × GRID_SIZE）是否与指定类型的实体碰撞。
   * 常用于蛇头、食物等标准尺寸实体的碰撞判断。
   */
  checkGridCell(
    x: number,
    y: number,
    filterTypes?: EntityType[],
  ): RegisteredEntity | null {
    return this.findColliding(x, y, GRID_SIZE, GRID_SIZE, filterTypes);
  }

  /* ── 清理 ──────────────────────────── */

  clear(): void {
    this.entities.clear();
  }

  clearByType(type: EntityType): void {
    for (const [id, entity] of this.entities) {
      if (entity.type === type) this.entities.delete(id);
    }
  }
}

/** 全局共享的实体注册表（单例） */
export const entityRegistry = new EntityRegistryImpl();
