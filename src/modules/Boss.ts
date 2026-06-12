import * as Grid from './Grid';

export class Boss implements Grid.GridEntity {
    // Boss 视觉/占位尺寸（像素），占 3 格
    static SIZE = 30;

    element: HTMLElement;
    hp: number;
    maxHp: number;
    isAlive: boolean = true;
    // 坐标数据为真源
    X: number = 0;
    Y: number = 0;

    constructor(stage: number) {
        this.maxHp = stage * 5; // Boss HP scales with stage
        this.hp = this.maxHp;

        // Create boss element
        this.element = document.createElement('div');
        this.element.className = 'boss';
        this.element.style.width = Boss.SIZE + 'px';
        this.element.style.height = Boss.SIZE + 'px';
        this.element.style.backgroundColor = 'red';
        this.element.style.position = 'absolute';
        this.element.style.borderRadius = '50%';
        this.element.style.zIndex = '10';

        const stageElement = document.getElementById('stage')!;
        stageElement.appendChild(this.element);

        this.spawn();
    }

    // Boss 按 30px 的盒子占位，命中/碰撞统一走这个 footprint
    footprint(): Grid.Rect {
        return Grid.rect(this.X, this.Y, Boss.SIZE);
    }

    spawn() {
        // 随机一个能容纳 30px 实体的合法落点（由 Grid 统一收窄到 0..270）
        const p = Grid.randomPoint(Boss.SIZE);
        this.X = p.x;
        this.Y = p.y;
        this.render();
    }

    takeDamage(damage: number = 1) {
        this.hp -= damage;
        if (this.hp <= 0) {
            this.die();
        } else {
            // Flash effect
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
        // Simple random movement（每步移动一格）
        const direction = Math.floor(Math.random() * 4);
        switch (direction) {
            case 0: this.Y -= Grid.CELL_SIZE; break;
            case 1: this.Y += Grid.CELL_SIZE; break;
            case 2: this.X -= Grid.CELL_SIZE; break;
            case 3: this.X += Grid.CELL_SIZE; break;
        }

        // 边界钳制由 Grid 按 Boss 尺寸统一处理（0..270）
        this.X = Grid.clamp(this.X, Boss.SIZE);
        this.Y = Grid.clamp(this.Y, Boss.SIZE);

        this.render();
    }

    // 把坐标数据同步到 DOM（唯一写 DOM 的地方）
    private render() {
        this.element.style.left = this.X + 'px';
        this.element.style.top = this.Y + 'px';
    }
}
