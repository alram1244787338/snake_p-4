// 网格几何与占位规则的唯一真源
//
// 整个棋盘是 CELL_COUNT × CELL_COUNT 的方格，每格 CELL_SIZE 像素。
// 蛇、食物、障碍物、Boss、子弹全部把坐标对齐到格子，并以「左上角」为锚点。
// 以前每个模块各自手搓 `Math.round(Math.random()*29)*10`、各自写边界 290 / 270、
// 各自抄一份命中判定，规则散落且互相不一致。现在统一收口到这里：
//   - 想生成随机落点    -> randomPoint / randomCoord
//   - 想把坐标钳进棋盘  -> clamp
//   - 想判断越界(墙)     -> isOutOfBounds
//   - 想判断占位/命中    -> rectContainsPoint / anyContainsPoint / occupies
// 新增实体(陷阱、移动障碍物、别的敌人)只要实现 GridEntity.footprint()，
// 上面这些规则即可直接复用，不必再抄一套坐标和碰撞代码。

// 一格 = 蛇移动一步 = 10px
export const CELL_SIZE = 10;
// 棋盘是 30×30 格
export const CELL_COUNT = 30;
// 合法坐标下界
export const MIN = 0;
// 单格实体「左上角」坐标的上界：(30-1)*10 = 290
export const MAX = (CELL_COUNT - 1) * CELL_SIZE;

// 一个格点
export interface Point {
    x: number;
    y: number;
}

// 一个占位矩形（左上角 x/y + 像素宽高 w/h）
export interface Rect {
    x: number;
    y: number;
    w: number;
    h: number;
}

// 任何参与碰撞 / 占位 / 生成的实体，只要能给出自己的占位矩形，
// 就能复用本模块的所有规则。这是扩展新实体唯一需要实现的契约。
export interface GridEntity {
    footprint(): Rect;
}

// 用「左上角 + 像素尺寸」描述一个占位矩形；尺寸默认是一格(10px)
export function rect(x: number, y: number, size: number = CELL_SIZE): Rect {
    return { x, y, w: size, h: size };
}

// 一个 size 像素宽的实体，左上角能取到的最大格子坐标。
// 因为实体向右下展开 size 像素，所以越大的实体左上角越要往回收：
//   单格(10px)   -> 290（占 1 格）
//   Boss(30px)   -> 290 - 20 = 270（占 3 格，右下边缘正好压在 290 上）
export function maxTopLeft(size: number = CELL_SIZE): number {
    return MAX - Math.max(0, size - CELL_SIZE);
}

// 把一个左上角坐标钳进合法范围（按实体尺寸收窄上界）
export function clamp(value: number, size: number = CELL_SIZE): number {
    const upper = maxTopLeft(size);
    if (value < MIN) return MIN;
    if (value > upper) return upper;
    return value;
}

// 随机一个对齐到格子的合法坐标（按实体尺寸收窄上界）
//   单格 -> Math.round(random*29)*10
//   Boss -> Math.round(random*27)*10
export function randomCoord(size: number = CELL_SIZE): number {
    const steps = maxTopLeft(size) / CELL_SIZE;
    return Math.round(Math.random() * steps) * CELL_SIZE;
}

// 随机一个对齐到格子的合法落点
export function randomPoint(size: number = CELL_SIZE): Point {
    return { x: randomCoord(size), y: randomCoord(size) };
}

// 点是否越界（用于墙体判定，例如子弹飞出棋盘）
export function isOutOfBounds(x: number, y: number): boolean {
    return x < MIN || x > MAX || y < MIN || y > MAX;
}

// 占位矩形是否「覆盖」某个点，边界取闭区间，和历史命中判定保持一致：
//   - 单格实体(w=h=0) 时退化为坐标完全相等（食物/障碍物的判定）
//   - Boss(w=h=30) 时是 px∈[x, x+30]、py∈[y, y+30] 的闭区间盒判定
// 这样一个函数就同时复刻了原来分散在各处的两种判定，不改变命中结果。
export function rectContainsPoint(
    r: { x: number; y: number; w?: number; h?: number },
    px: number,
    py: number
): boolean {
    const w = r.w ?? 0;
    const h = r.h ?? 0;
    return px >= r.x && px <= r.x + w && py >= r.y && py <= r.y + h;
}

// 一组占位矩形里是否有任意一个覆盖该点（生成避让 / 多障碍物碰撞都用它）
export function anyContainsPoint(
    rects: { x: number; y: number; w?: number; h?: number }[],
    px: number,
    py: number
): boolean {
    return rects.some(r => rectContainsPoint(r, px, py));
}

// 某个实体是否占据某个点（碰撞判定的统一入口）
export function occupies(entity: GridEntity, px: number, py: number): boolean {
    return rectContainsPoint(entity.footprint(), px, py);
}
