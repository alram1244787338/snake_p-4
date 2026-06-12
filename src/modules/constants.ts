/**
 * 游戏全局常量配置
 * 集中管理所有硬编码数值，方便后续调参
 */

/** 一格的大小（像素） */
export const GRID_SIZE = 10;

/** 舞台边长（像素） */
export const STAGE_SIZE = 300;

/** 蛇/食物/子弹可达到的最大坐标（舞台尺寸 - 一格） */
export const MAX_COORD = STAGE_SIZE - GRID_SIZE; // 290

/** 网格数量（300 / 10 = 30 格） */
export const GRID_COUNT = STAGE_SIZE / GRID_SIZE; // 30

// ---- 速度相关 ----
export const DEFAULT_SPEED = 300;
export const MIN_SPEED = 50;
export const MAX_SPEED = 1000;
export const SPEED_STEP = 50;

// ---- Boss 相关 ----
export const BOSS_SIZE = 30;
export const BOSS_SPAWN_STAGE_INTERVAL = 5;
export const BOSS_MAX_COORD = MAX_COORD - BOSS_SIZE; // 260 -> 取整到格子 = 270
export const BOSS_SPAWN_GRID_MAX = (BOSS_MAX_COORD + GRID_SIZE) / GRID_SIZE - 1; // 27
export const BOSS_MOVE_CHANCE = 0.1;

// ---- 子弹相关 ----
export const BULLET_SIZE = 5;
export const BULLET_SPEED = 10;
export const BULLET_INTERVAL = 30;
