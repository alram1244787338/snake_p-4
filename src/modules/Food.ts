import * as Grid from './Grid';

// 定义食物类
// 坐标以「数据字段」为唯一真源：构造时从 DOM 的初始位置播种一次，
// 之后只用 change() 改数据并由 render() 同步到 DOM，不再用 offsetLeft/offsetTop 当数据源。
class Food implements Grid.GridEntity {
    // 食物对应的页面元素（只负责显示）
    element: HTMLElement;

    // 食物坐标数据（真源）
    private x: number;
    private y: number;

    constructor() {
        // 获取页面中的food元素
        // ! 表示该元素一定存在
        this.element = document.getElementById('food')!;
        // 用初始 DOM 位置给坐标数据播种（保持开局位置与样式表一致），此后不再回读 DOM
        this.x = this.element.offsetLeft;
        this.y = this.element.offsetTop;
    }

    // 食物X轴坐标（来自数据字段，对外保持原有读法 food.X）
    get X() {
        return this.x;
    }

    // 食物Y轴坐标
    get Y() {
        return this.y;
    }

    // 食物按「单格」占位，接入统一的占位/碰撞规则
    footprint(): Grid.Rect {
        return { x: this.x, y: this.y, w: 0, h: 0 };
    }

    // 修改食物位置：生成一个合法且不落在障碍物上的随机格点
    // 坐标由 Grid 统一生成与避让，模块内不再手搓随机点与边界
    change(obstacles: Grid.Point[] = []) {
        let p: Grid.Point;
        do {
            p = Grid.randomPoint();
        } while (Grid.anyContainsPoint(obstacles, p.x, p.y));

        this.x = p.x;
        this.y = p.y;
        this.render();
    }

    // 把坐标数据同步到 DOM（唯一写 DOM 的地方）
    private render() {
        this.element.style.left = this.x + 'px';
        this.element.style.top = this.y + 'px';
    }
}

export default Food;
