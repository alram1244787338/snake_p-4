import Snake from "./Snake";
import Food from "./Food";
import ScorePanel from "./ScorePanel";
import { ParticleSystem } from "./ParticleEffect";
import { AudioManager } from "./AudioManager";
import { ObstacleManager } from "./ObstacleManager";
import { Boss } from "./Boss";
import { InputManager, Direction } from "./InputManager";
import {
    DEFAULT_SPEED, MIN_SPEED, MAX_SPEED, SPEED_STEP,
    BOSS_SPAWN_STAGE_INTERVAL, BOSS_MOVE_CHANCE, BOSS_SIZE,
    BULLET_SIZE, BULLET_SPEED, BULLET_INTERVAL, MAX_COORD,
} from "./constants";

/**
 * 游戏控制器
 * 职责：组合各子系统，驱动游戏主循环
 * 输入、常量、方向判断分别由 InputManager / constants 管理
 */
class GameControl {
    snake: Snake;
    food: Food;
    scorePanel: ScorePanel;
    particleSystem: ParticleSystem;
    audioManager: AudioManager;
    obstacleManager: ObstacleManager;
    inputManager: InputManager;

    boss: Boss | null = null;
    bullets: HTMLDivElement[] = [];
    isLive = true;
    speed: number = DEFAULT_SPEED;

    constructor() {
        this.snake = new Snake();
        this.food = new Food();
        this.scorePanel = new ScorePanel(10, 5); // 每 5 分升级
        this.particleSystem = new ParticleSystem();
        this.audioManager = new AudioManager();
        this.obstacleManager = new ObstacleManager();
        this.inputManager = new InputManager();

        this.init();
    }

    // ==================== 初始化 ====================

    /** 游戏初始化，调用后游戏开始 */
    init(): void {
        this.bindInput();
        this.obstacleManager.generateObstacles(this.scorePanel.stage);

        // 浏览器可能阻止自动播放，在首次点击后播放 BGM
        document.addEventListener('click', () => {
            this.audioManager.playBgm();
        }, { once: true });

        this.run();
    }

    /** 将所有键盘操作统一注册到 InputManager */
    private bindInput(): void {
        this.inputManager.bind();
        this.inputManager.registerAction('restart',   ['r'], () => this.restartGame());
        this.inputManager.registerAction('prevStage', ['t'], () => this.prevStage());
        this.inputManager.registerAction('nextStage', ['y'], () => this.nextStage());
        this.inputManager.registerAction('speedUp',   ['g'], () => this.adjustSpeed(-SPEED_STEP));
        this.inputManager.registerAction('speedDown', ['h'], () => this.adjustSpeed(SPEED_STEP));
        this.inputManager.registerAction('shoot',     ['f'], () => this.shoot());
    }

    // ==================== 动作入口 ====================

    restartGame(): void {
        location.reload();
    }

    prevStage(): void {
        if (this.scorePanel.stage > 1) {
            this.scorePanel.setStage(this.scorePanel.stage - 1);
            this.resetStage();
        }
    }

    nextStage(): void {
        if (this.scorePanel.stage < this.scorePanel.maxStage) {
            this.scorePanel.setStage(this.scorePanel.stage + 1);
            this.resetStage();
        }
    }

    adjustSpeed(delta: number): void {
        this.speed = Math.max(MIN_SPEED, Math.min(MAX_SPEED, this.speed + delta));
    }

    // ==================== 关卡重置 ====================

    resetStage(): void {
        this.obstacleManager.generateObstacles(this.scorePanel.stage);
        this.food.change(this.obstacleManager.obstacleCoords);

        // 清理旧 Boss
        if (this.boss) {
            this.boss.die();
            this.boss = null;
        }
        // 每 BOSS_SPAWN_STAGE_INTERVAL 关生成一个 Boss
        if (this.scorePanel.stage % BOSS_SPAWN_STAGE_INTERVAL === 0) {
            this.boss = new Boss(this.scorePanel.stage);
        }
    }

    // ==================== 射击 ====================

    shoot(): void {
        if (!this.isLive) return;

        const bullet = document.createElement('div');
        bullet.style.width = BULLET_SIZE + 'px';
        bullet.style.height = BULLET_SIZE + 'px';
        bullet.style.backgroundColor = 'yellow';
        bullet.style.position = 'absolute';

        let bx = this.snake.X + 5;
        let by = this.snake.Y + 5;
        bullet.style.left = bx + 'px';
        bullet.style.top = by + 'px';
        document.getElementById('stage')!.appendChild(bullet);

        // 根据当前归一化方向决定子弹速度
        let vx = 0;
        let vy = 0;
        switch (this.inputManager.currentDirection) {
            case Direction.Up:    vy = -BULLET_SPEED; break;
            case Direction.Down:  vy =  BULLET_SPEED; break;
            case Direction.Left:  vx = -BULLET_SPEED; break;
            default:              vx =  BULLET_SPEED; break; // 默认向右
        }

        const bulletInterval = setInterval(() => {
            bx += vx;
            by += vy;
            bullet.style.left = bx + 'px';
            bullet.style.top = by + 'px';

            // 命中 Boss
            if (this.boss && this.boss.isAlive) {
                if (bx >= this.boss.X && bx <= this.boss.X + BOSS_SIZE &&
                    by >= this.boss.Y && by <= this.boss.Y + BOSS_SIZE) {
                    this.boss.takeDamage();
                    clearInterval(bulletInterval);
                    bullet.remove();
                    this.particleSystem.addParticles(bx, by, 5, 'red');

                    if (!this.boss.isAlive) {
                        this.boss = null;
                        this.scorePanel.score += 50;
                        this.scorePanel.scoreEle.innerHTML = this.scorePanel.score + '';
                    }
                    return;
                }
            }

            // 撞墙 / 撞障碍物 → 消失
            if (bx < 0 || bx > MAX_COORD || by < 0 || by > MAX_COORD ||
                this.obstacleManager.checkCollision(bx, by)) {
                clearInterval(bulletInterval);
                bullet.remove();
            }
        }, BULLET_INTERVAL);
    }

    // ==================== 游戏主循环 ====================

    /** 每个 tick 推进一次蛇的移动 */
    run = (): void => {
        if (!this.isLive) return;

        let X = this.snake.X;
        let Y = this.snake.Y;

        // 根据归一化方向计算新坐标
        switch (this.inputManager.currentDirection) {
            case Direction.Up:    Y -= 10; break;
            case Direction.Down:  Y += 10; break;
            case Direction.Left:  X -= 10; break;
            case Direction.Right: X += 10; break;
        }

        // 1) 检查是否吃到食物
        this.checkEat(X, Y);

        // 2) 检查障碍物碰撞
        if (this.obstacleManager.checkCollision(X, Y)) {
            this.die('撞到障碍物了！');
            return;
        }

        // 3) 检查 Boss 碰撞 & Boss 移动
        if (this.boss && this.boss.isAlive) {
            if (X >= this.boss.X && X <= this.boss.X + BOSS_SIZE &&
                Y >= this.boss.Y && Y <= this.boss.Y + BOSS_SIZE) {
                this.die('被Boss打败了！');
                return;
            }
            if (Math.random() < BOSS_MOVE_CHANCE) {
                this.boss.move();
            }
        }

        // 4) 移动蛇（可能抛出撞墙 / 撞自身异常）
        try {
            this.snake.X = X;
            this.snake.Y = Y;
        } catch (e: any) {
            this.audioManager.playDeath();
            alert(e.message + ' GAME OVER!');
            this.isLive = false;
            return;
        }

        // 5) 更新粒子
        this.particleSystem.update();

        // 6) 调度下一个 tick
        setTimeout(this.run, this.speed);
    };

    // ==================== 吃食物 ====================

    checkEat(X: number, Y: number): void {
        if (X !== this.food.X || Y !== this.food.Y) return;

        this.audioManager.playEat();

        try {
            this.particleSystem.addParticles(X + 5, Y + 5, 10, '#FFD700');
        } catch (e) {
            console.error('Particle effect error:', e);
        }

        this.food.change(this.obstacleManager.obstacleCoords);

        const prevStage = this.scorePanel.stage;
        this.scorePanel.addScore();
        if (this.scorePanel.stage > prevStage) {
            this.resetStage();
        }

        this.snake.addBody();
    }

    // ==================== 死亡 ====================

    private die(reason: string): void {
        this.isLive = false;
        this.audioManager.playDeath();
        alert(reason + ' GAME OVER!');
    }
}

export default GameControl;
