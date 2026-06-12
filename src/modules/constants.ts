// 游戏的公共常量与方向模型
// 把原先散落在各处的魔法数字（300 / 50 / 1000 / 290 / 30 ...）集中到这里，
// 后面调节奏、改尺寸只需要改这一个文件。

/* ============ 场地 / 网格 ============ */

// 一个格子的边长（蛇身、食物、障碍物都是这个尺寸），单位 px
export const CELL = 10;
// 格子中心相对左上角的偏移（原代码里到处出现的那个 “+5”）
export const HALF_CELL = CELL / 2;
// 棋盘上左上角坐标的合法范围：[BOARD_MIN, BOARD_MAX]
// 舞台内边长 304px，10px 的格子合法落点是 0,10,...,290
export const BOARD_MIN = 0;
export const BOARD_MAX = 290;
// 随机生成坐标时的格子下标上限（0..GRID_MAX_INDEX，乘以 CELL 得到像素坐标）
export const GRID_MAX_INDEX = BOARD_MAX / CELL; // 29

/* ============ 速度（每一步的间隔毫秒数） ============ */

// 数值越小蛇走得越快
export const DEFAULT_SPEED = 300;
export const MIN_SPEED = 50;
export const MAX_SPEED = 1000;
// 一次加速 / 减速调整的步长
export const SPEED_STEP = 50;

/* ============ Boss ============ */

// Boss 方块的边长，单位 px
export const BOSS_SIZE = 30;
// Boss 左上角坐标上限：要保证整只 Boss 落在棋盘内
export const BOSS_MAX = BOARD_MAX - (BOSS_SIZE - CELL); // 270
// 每一关给 Boss 增加的血量
export const BOSS_HP_PER_STAGE = 5;
// 每个 tick 里 Boss 随机移动的概率
export const BOSS_MOVE_CHANCE = 0.1;
// 每隔多少关出现一个 Boss
export const BOSS_STAGE_INTERVAL = 5;
// 击杀 Boss 的奖励分数
export const BOSS_KILL_BONUS = 50;

/* ============ 子弹 ============ */

// 子弹方块的边长，单位 px
export const BULLET_SIZE = 5;
// 子弹每次移动的像素数
export const BULLET_SPEED = 10;
// 子弹移动定时器的间隔毫秒数
export const BULLET_TICK_MS = 30;

/* ============ 方向模型 ============ */

// 用枚举代替原来的字符串方向，避免到处靠 'ArrowUp' / 'Up' / 'w' 这种字符串去猜方向
export enum Direction {
    None,
    Up,
    Down,
    Left,
    Right,
}

// 每个方向的反方向：用来判断蛇能不能掉头（不能直接反向走回身体里）
export const OPPOSITE: Record<Direction, Direction> = {
    [Direction.None]: Direction.None,
    [Direction.Up]: Direction.Down,
    [Direction.Down]: Direction.Up,
    [Direction.Left]: Direction.Right,
    [Direction.Right]: Direction.Left,
};

// 每个方向对应的位移（像素）。这一张表把 “方向 -> 移动” 这一步收敛成一次查表。
export const DELTA: Record<Direction, { x: number; y: number }> = {
    [Direction.None]: { x: 0, y: 0 },
    [Direction.Up]: { x: 0, y: -CELL },
    [Direction.Down]: { x: 0, y: CELL },
    [Direction.Left]: { x: -CELL, y: 0 },
    [Direction.Right]: { x: CELL, y: 0 },
};
