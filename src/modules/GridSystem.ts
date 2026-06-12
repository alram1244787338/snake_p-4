/**
 * GridSystem — 统一的网格坐标、边界、位置生成工具
 *
 * 所有与格子坐标、舞台边界、随机位置生成相关的公共逻辑都集中在这里。
 * 任何需要在网格上活动的实体（蛇、食物、障碍物、Boss、子弹、陷阱……）
 * 都应使用此模块提供的常量和工具函数，避免各自硬编码。
 */

/* ───────── 常量 ───────── */

/** 每格的像素大小 */
export const GRID_SIZE = 10;

/** 舞台可玩区域的宽高（像素） */
export const STAGE_WIDTH = 300;
export const STAGE_HEIGHT = 300;

/* ───────── 类型 ───────── */

/** 坐标点（左上角） */
export interface Position {
  x: number;
  y: number;
}

/** 矩形区域 */
export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/* ───────── 工具函数 ───────── */

/** 将任意像素值对齐到最近的格子 */
export function snapToGrid(value: number): number {
  return Math.round(value / GRID_SIZE) * GRID_SIZE;
}

/** 指定实体尺寸下允许的最大 X 坐标 */
export function maxXFor(entityWidth: number): number {
  return STAGE_WIDTH - entityWidth;
}

/** 指定实体尺寸下允许的最大 Y 坐标 */
export function maxYFor(entityHeight: number): number {
  return STAGE_HEIGHT - entityHeight;
}

/** 生成一个格子对齐的随机位置，自动考虑实体自身尺寸 */
export function randomGridPosition(
  entityWidth: number = GRID_SIZE,
  entityHeight: number = GRID_SIZE,
): Position {
  const cols = (STAGE_WIDTH - entityWidth) / GRID_SIZE;
  const rows = (STAGE_HEIGHT - entityHeight) / GRID_SIZE;
  return {
    x: Math.round(Math.random() * cols) * GRID_SIZE,
    y: Math.round(Math.random() * rows) * GRID_SIZE,
  };
}

/** 判断一个实体是否在舞台范围内 */
export function isInBounds(
  x: number,
  y: number,
  entityWidth: number = GRID_SIZE,
  entityHeight: number = GRID_SIZE,
): boolean {
  return (
    x >= 0 &&
    y >= 0 &&
    x + entityWidth <= STAGE_WIDTH &&
    y + entityHeight <= STAGE_HEIGHT
  );
}

/** 把坐标夹紧到舞台范围内 */
export function clampToBounds(
  x: number,
  y: number,
  entityWidth: number = GRID_SIZE,
  entityHeight: number = GRID_SIZE,
): Position {
  return {
    x: Math.max(0, Math.min(x, STAGE_WIDTH - entityWidth)),
    y: Math.max(0, Math.min(y, STAGE_HEIGHT - entityHeight)),
  };
}

/** 两个坐标是否完全相同 */
export function positionsEqual(a: Position, b: Position): boolean {
  return a.x === b.x && a.y === b.y;
}

/** 两个矩形是否重叠（AABB 碰撞检测） */
export function rectsOverlap(
  ax: number, ay: number, aw: number, ah: number,
  bx: number, by: number, bw: number, bh: number,
): boolean {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

/**
 * 在避开所有已占用位置的前提下，寻找一个随机的格子对齐位置。
 * 可选地额外排除一个矩形区域（例如蛇的出生区）。
 */
export function findEmptyPosition(
  occupied: Position[],
  entityWidth: number = GRID_SIZE,
  entityHeight: number = GRID_SIZE,
  excludeRect?: Rect,
): Position {
  const MAX_ATTEMPTS = 1000;
  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    const pos = randomGridPosition(entityWidth, entityHeight);
    let valid = true;

    // 避开已占用的位置
    for (const occ of occupied) {
      if (pos.x === occ.x && pos.y === occ.y) {
        valid = false;
        break;
      }
    }

    // 避开排除区域
    if (valid && excludeRect) {
      if (
        pos.x >= excludeRect.x &&
        pos.x < excludeRect.x + excludeRect.width &&
        pos.y >= excludeRect.y &&
        pos.y < excludeRect.y + excludeRect.height
      ) {
        valid = false;
      }
    }

    if (valid) return pos;
  }
  // 极端情况下的兜底
  return randomGridPosition(entityWidth, entityHeight);
}
