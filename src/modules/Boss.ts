import {
    BOARD_MIN,
    BOSS_HP_PER_STAGE,
    BOSS_MAX,
    BOSS_SIZE,
    CELL,
} from "./constants";

export class Boss {
    element: HTMLElement;
    hp: number;
    maxHp: number;
    isAlive: boolean = true;
    X: number = 0;
    Y: number = 0;

    constructor(stage: number) {
        this.maxHp = stage * BOSS_HP_PER_STAGE; // Boss 血量随关卡提升
        this.hp = this.maxHp;

        // 创建 Boss 元素
        this.element = document.createElement('div');
        this.element.className = 'boss';
        this.element.style.width = BOSS_SIZE + 'px';
        this.element.style.height = BOSS_SIZE + 'px';
        this.element.style.backgroundColor = 'red';
        this.element.style.position = 'absolute';
        this.element.style.borderRadius = '50%';
        this.element.style.zIndex = '10';

        const stageElement = document.getElementById('stage')!;
        stageElement.appendChild(this.element);

        this.spawn();
    }

    spawn() {
        // 随机落点，保证整只 Boss 落在棋盘内
        const maxIndex = BOSS_MAX / CELL;
        this.X = Math.round(Math.random() * maxIndex) * CELL;
        this.Y = Math.round(Math.random() * maxIndex) * CELL;
        this.element.style.left = this.X + 'px';
        this.element.style.top = this.Y + 'px';
    }

    // 判断某个格点（蛇头 / 子弹）是否落在 Boss 范围内
    containsPoint(x: number, y: number): boolean {
        return (
            x >= this.X &&
            x <= this.X + BOSS_SIZE &&
            y >= this.Y &&
            y <= this.Y + BOSS_SIZE
        );
    }

    takeDamage(damage: number = 1) {
        this.hp -= damage;
        if (this.hp <= 0) {
            this.die();
        } else {
            // 受击闪白
            this.element.style.backgroundColor = 'white';
            setTimeout(() => {
                this.element.style.backgroundColor = 'red';
            }, 100);
        }
    }

    die() {
        this.isAlive = false;
        if (this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
    }

    move() {
        // 简单的随机走位
        const direction = Math.floor(Math.random() * 4);
        switch (direction) {
            case 0: this.Y -= CELL; break;
            case 1: this.Y += CELL; break;
            case 2: this.X -= CELL; break;
            case 3: this.X += CELL; break;
        }

        // 边界收束，保证整只 Boss 不越界
        if (this.X < BOARD_MIN) this.X = BOARD_MIN;
        if (this.X > BOSS_MAX) this.X = BOSS_MAX;
        if (this.Y < BOARD_MIN) this.Y = BOARD_MIN;
        if (this.Y > BOSS_MAX) this.Y = BOSS_MAX;

        this.element.style.left = this.X + 'px';
        this.element.style.top = this.Y + 'px';
    }
}
