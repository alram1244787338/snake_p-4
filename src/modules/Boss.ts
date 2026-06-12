import { GRID_SIZE, randomGridPosition, clampToBounds } from './GridSystem';
import { entityRegistry } from './EntityRegistry';

/** Boss 的尺寸（像素） */
const BOSS_WIDTH = 30;
const BOSS_HEIGHT = 30;

export class Boss {
    element: HTMLElement;
    hp: number;
    maxHp: number;
    isAlive: boolean = true;
    X: number = 0;
    Y: number = 0;

    /** 在实体注册表中的唯一 ID */
    private entityId: string;

    constructor(stage: number) {
        this.maxHp = stage * 5; // Boss HP scales with stage
        this.hp = this.maxHp;
        this.entityId = 'boss_' + stage + '_' + Date.now();

        // Create boss element
        this.element = document.createElement('div');
        this.element.className = 'boss';
        this.element.style.width = BOSS_WIDTH + 'px';
        this.element.style.height = BOSS_HEIGHT + 'px';
        this.element.style.backgroundColor = 'red';
        this.element.style.position = 'absolute';
        this.element.style.borderRadius = '50%';
        this.element.style.zIndex = '10';

        const stageElement = document.getElementById('stage')!;
        stageElement.appendChild(this.element);

        this.spawn();
    }

    spawn() {
        // 使用 GridSystem 的随机位置生成，自动考虑 Boss 自身尺寸
        const pos = randomGridPosition(BOSS_WIDTH, BOSS_HEIGHT);
        this.X = pos.x;
        this.Y = pos.y;

        // 同步 DOM
        this.element.style.left = this.X + 'px';
        this.element.style.top = this.Y + 'px';

        // 注册到实体系统
        entityRegistry.register({
            id: this.entityId,
            type: 'boss',
            x: this.X,
            y: this.Y,
            width: BOSS_WIDTH,
            height: BOSS_HEIGHT,
        });
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

        // 从实体系统注销
        entityRegistry.unregister(this.entityId);

        if (this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
    }

    move() {
        // Simple random movement
        const direction = Math.floor(Math.random() * 4);
        let newX = this.X;
        let newY = this.Y;

        switch (direction) {
            case 0: newY -= GRID_SIZE; break;
            case 1: newY += GRID_SIZE; break;
            case 2: newX -= GRID_SIZE; break;
            case 3: newX += GRID_SIZE; break;
        }

        // 使用 GridSystem 的统一边界截断，自动考虑 Boss 尺寸
        const clamped = clampToBounds(newX, newY, BOSS_WIDTH, BOSS_HEIGHT);
        this.X = clamped.x;
        this.Y = clamped.y;

        // 同步 DOM
        this.element.style.left = this.X + 'px';
        this.element.style.top = this.Y + 'px';

        // 同步实体注册表
        entityRegistry.updatePosition(this.entityId, this.X, this.Y);
    }
}
