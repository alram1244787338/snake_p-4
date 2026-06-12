import * as Grid from './Grid';

// 子弹实体
// 以前子弹的坐标活在 GameControl.shoot 的闭包变量(bx/by)和 DOM 样式里，
// 命中/越界判定也散写在那。现在把「数据」收进实例字段、把「DOM 更新」收进 render，
// 并通过 footprint() 接入统一的占位规则。轨迹与历史完全一致。
export class Bullet implements Grid.GridEntity {
    // 子弹视觉尺寸（像素），仅用于绘制
    static SIZE = 5;
    // 子弹每步移动的距离 = 一格 = 10px（与历史一致）
    static SPEED = Grid.CELL_SIZE;

    element: HTMLDivElement;
    // 坐标数据是唯一真源，不再回读 DOM
    x: number;
    y: number;
    vx: number;
    vy: number;

    constructor(x: number, y: number, vx: number, vy: number, parent: HTMLElement) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;

        this.element = document.createElement('div');
        this.element.className = 'bullet';
        this.element.style.width = Bullet.SIZE + 'px';
        this.element.style.height = Bullet.SIZE + 'px';
        this.element.style.backgroundColor = 'yellow';
        this.element.style.position = 'absolute';
        parent.appendChild(this.element);

        this.render();
    }

    // 子弹按「单点」占位（取左上角），和历史的逐点命中判定保持一致
    footprint(): Grid.Rect {
        return { x: this.x, y: this.y, w: 0, h: 0 };
    }

    // 前进一步并刷新画面
    step() {
        this.x += this.vx;
        this.y += this.vy;
        this.render();
    }

    // 是否飞出棋盘（撞墙）
    isOutOfBounds(): boolean {
        return Grid.isOutOfBounds(this.x, this.y);
    }

    // 把坐标数据同步到 DOM（唯一写 DOM 的地方）
    render() {
        this.element.style.left = this.x + 'px';
        this.element.style.top = this.y + 'px';
    }

    remove() {
        if (this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
    }
}
