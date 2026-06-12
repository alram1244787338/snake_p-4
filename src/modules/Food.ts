import { GRID_COUNT } from "./constants";

// 定义食物类
class Food {
    // 定义一个属性表示食物所对应的元素
    element: HTMLElement;

    constructor() {
        this.element = document.getElementById('food')!;
    }

    // 获取食物 X 轴坐标
    get X() {
        return this.element.offsetLeft;
    }

    // 获取食物 Y 轴坐标
    get Y() {
        return this.element.offsetTop;
    }

    // 修改食物位置
    change(obstacles: { x: number; y: number }[] = []) {
        // 坐标必须是 GRID_SIZE (10) 的整数倍，范围 0 ~ (GRID_COUNT-1)*10
        let top: number, left: number;
        let isValid = false;

        while (!isValid) {
            top = Math.round(Math.random() * (GRID_COUNT - 1)) * 10;
            left = Math.round(Math.random() * (GRID_COUNT - 1)) * 10;

            isValid = true;
            for (const obstacle of obstacles) {
                if (left === obstacle.x && top === obstacle.y) {
                    isValid = false;
                    break;
                }
            }
        }

        this.element.style.left = left + 'px';
        this.element.style.top = top + 'px';
    }
}

export default Food;
