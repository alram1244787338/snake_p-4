import { GRID_SIZE, findEmptyPosition, Position } from './GridSystem';
import { entityRegistry } from './EntityRegistry';

// 定义食物类
class Food {
    // 定义一个属性表示食物所对应的元素
    element: HTMLElement;

    // 食物的数据坐标（数据源，不再从 DOM 读取）
    private _x: number;
    private _y: number;

    constructor() {
        // 获取页面中的food元素并将其赋值给element
        // ! 表示该元素一定存在
        this.element = document.getElementById('food')!;

        // 从 DOM 读取 CSS 设定的初始位置
        this._x = this.element.offsetLeft;
        this._y = this.element.offsetTop;

        // 注册到实体系统，方便其他实体查询食物位置
        entityRegistry.register({
            id: 'food',
            type: 'food',
            x: this._x,
            y: this._y,
            width: GRID_SIZE,
            height: GRID_SIZE,
        });
    }

    // 定义一个获取食物X轴坐标的方法（从数据读取，不依赖 DOM）
    get X() {
        return this._x;
    }

    // 定义一个获取食物Y轴坐标的方法（从数据读取，不依赖 DOM）
    get Y() {
        return this._y;
    }

    // 修改食物位置的方法
    change(obstacles: Position[] = []) {
        // 使用 GridSystem 的统一位置生成，避开已占用的位置
        const pos = findEmptyPosition(obstacles);

        this._x = pos.x;
        this._y = pos.y;

        // 同步 DOM
        this.element.style.left = this._x + 'px';
        this.element.style.top = this._y + 'px';

        // 同步实体注册表
        entityRegistry.updatePosition('food', this._x, this._y);
    }
}

export default Food;
