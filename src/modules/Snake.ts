import { MAX_COORD } from "./constants";

class Snake {
    // 表示蛇头的元素
    head: HTMLElement;
    // 蛇的身体（包括蛇头）
    bodies: HTMLCollection;
    // 获取蛇的容器
    element: HTMLElement;

    constructor() {
        this.element = document.getElementById('snake')!;
        this.head = document.querySelector('#snake > div') as HTMLElement;
        this.bodies = this.element.getElementsByTagName('div');
    }

    // 获取蛇的坐标（蛇头坐标）
    get X() {
        return this.head.offsetLeft;
    }

    // 获取蛇的Y轴坐标
    get Y() {
        return this.head.offsetTop;
    }

    // 设置蛇头的坐标
    set X(value: number) {
        // 如果新值和旧值相同，则直接返回不再修改
        if (this.X === value) {
            return;
        }

        // X 的值的合法范围 0 ~ MAX_COORD
        if (value < 0 || value > MAX_COORD) {
            throw new Error('蛇撞墙了！');
        }

        // 修改 x 时是在水平移动，不能掉头
        if (this.bodies[1] && (this.bodies[1] as HTMLElement).offsetLeft === value) {
            if (value > this.X) {
                // 向右走时发生掉头，继续向左
                value = this.X - 10;
            } else {
                // 向左走时发生掉头，继续向右
                value = this.X + 10;
            }
        }

        this.moveBody();
        this.head.style.left = value + 'px';
        this.checkHeadBody();
    }

    set Y(value: number) {
        if (this.Y === value) {
            return;
        }

        if (value < 0 || value > MAX_COORD) {
            throw new Error('蛇撞墙了！');
        }

        if (this.bodies[1] && (this.bodies[1] as HTMLElement).offsetTop === value) {
            if (value > this.Y) {
                value = this.Y - 10;
            } else {
                value = this.Y + 10;
            }
        }

        this.moveBody();
        this.head.style.top = value + 'px';
        this.checkHeadBody();
    }

    // 蛇增加身体的方法
    addBody() {
        this.element.insertAdjacentHTML("beforeend", "<div></div>");

        const newBody = this.bodies[this.bodies.length - 1] as HTMLElement;
        const lastBody = this.bodies[this.bodies.length - 2] as HTMLElement;

        if (lastBody) {
            newBody.style.left = lastBody.offsetLeft + 'px';
            newBody.style.top = lastBody.offsetTop + 'px';
        }
    }

    // 蛇身体跟随移动
    moveBody() {
        for (let i = this.bodies.length - 1; i > 0; i--) {
            let X = (this.bodies[i - 1] as HTMLElement).offsetLeft;
            let Y = (this.bodies[i - 1] as HTMLElement).offsetTop;

            (this.bodies[i] as HTMLElement).style.left = X + 'px';
            (this.bodies[i] as HTMLElement).style.top = Y + 'px';
        }
    }

    // 检查蛇头是否撞到身体
    checkHeadBody() {
        // 只检查身体长度 > 4 的情况（避免新增身体在第一帧就触发碰撞检测）
        if (this.bodies.length <= 4) {
            return;
        }

        for (let i = 4; i < this.bodies.length; i++) {
            let bd = this.bodies[i] as HTMLElement;
            if (this.X === bd.offsetLeft && this.Y === bd.offsetTop) {
                throw new Error('撞到自己了！');
            }
        }
    }
}

export default Snake;
