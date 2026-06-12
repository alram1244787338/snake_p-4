import { Boss } from './Boss';

// 子弹运行所需的上下文：实时读取 Boss / 障碍物，并把「打中 Boss」这一事件回报给业务层。
// BulletManager 只负责子弹本身（DOM、移动、碰撞几何），不直接改分数、不放粒子——
// 那些是游戏规则与表现层的职责，通过 onBossHit 交回 GameControl 调度。
export interface BulletContext {
    getBoss: () => Boss | null;
    getObstacleCoords: () => { x: number; y: number }[];
    // 子弹命中 Boss 时回调，参数为命中点坐标
    onBossHit: (x: number, y: number) => void;
}

// 子弹管理器：统一持有子弹的 DOM 与移动定时器，负责发射、移动、碰撞与清理。
export class BulletManager {
    private stageEl: HTMLElement;
    // 记录存活子弹及其定时器，便于切关 / 重开时统一清理
    private active = new Map<HTMLDivElement, number>();

    constructor() {
        this.stageEl = document.getElementById('stage')!;
    }

    // 从蛇头位置发射一颗子弹
    spawn(headX: number, headY: number, direction: string, ctx: BulletContext) {
        const bullet = document.createElement('div');
        bullet.className = 'bullet';

        let bx = headX + 5;
        let by = headY + 5;
        bullet.style.left = bx + 'px';
        bullet.style.top = by + 'px';
        this.stageEl.appendChild(bullet);

        const { vx, vy } = this.velocityFor(direction);

        const intervalId = window.setInterval(() => {
            bx += vx;
            by += vy;
            bullet.style.left = bx + 'px';
            bullet.style.top = by + 'px';

            // 命中 Boss
            const boss = ctx.getBoss();
            if (boss && boss.isAlive &&
                bx >= boss.X && bx <= boss.X + 30 &&
                by >= boss.Y && by <= boss.Y + 30) {
                this.destroy(bullet);
                ctx.onBossHit(bx, by);
                return;
            }

            // 撞墙或撞障碍物
            if (bx < 0 || bx > 290 || by < 0 || by > 290 ||
                ctx.getObstacleCoords().some(c => c.x === bx && c.y === by)) {
                this.destroy(bullet);
            }
        }, 30);

        this.active.set(bullet, intervalId);
    }

    // 清理所有存活子弹（切关 / 重开时调用）
    clear() {
        for (const [bullet] of this.active) {
            this.destroy(bullet);
        }
    }

    // 停止并移除单颗子弹
    private destroy(bullet: HTMLDivElement) {
        const intervalId = this.active.get(bullet);
        if (intervalId !== undefined) {
            clearInterval(intervalId);
            this.active.delete(bullet);
        }
        if (bullet.parentNode) {
            bullet.parentNode.removeChild(bullet);
        }
    }

    // 根据方向解析子弹速度，默认向右
    private velocityFor(direction: string): { vx: number; vy: number } {
        if (direction === 'ArrowUp' || direction === 'Up' || direction === 'w') return { vx: 0, vy: -10 };
        if (direction === 'ArrowDown' || direction === 'Down' || direction === 's') return { vx: 0, vy: 10 };
        if (direction === 'ArrowLeft' || direction === 'Left' || direction === 'a') return { vx: -10, vy: 0 };
        return { vx: 10, vy: 0 };
    }
}
