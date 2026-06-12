import Snake from "./Snake";
import Food from "./Food";
import ScorePanel from "./ScorePanel";
import { ParticleSystem } from "./ParticleEffect";
import { AudioManager } from "./AudioManager";
import { ObstacleManager } from "./ObstacleManager";
import { Boss } from "./Boss";
import { GRID_SIZE, maxXFor, maxYFor } from "./GridSystem";
import { entityRegistry } from "./EntityRegistry";

/** 子弹尺寸（像素） */
const BULLET_SIZE = 5;

// 游戏控制器，控制其他所有类
class GameControl {
    // 定义属性
    snake: Snake;
    food: Food;
    scorePanel: ScorePanel;
    particleSystem: ParticleSystem;
    audioManager: AudioManager;
    obstacleManager: ObstacleManager;
    boss: Boss | null = null;
    bullets: HTMLDivElement[] = [];

    // 蛇的移动方向（也就是按键的方向）
    direction: string = '';
    // 记录游戏是否结束
    isLive = true;
    // 游戏速度
    speed: number = 300;

    constructor() {
        this.snake = new Snake();
        this.food = new Food();
        this.scorePanel = new ScorePanel(10, 5); // 每5分升级
        this.particleSystem = new ParticleSystem();
        this.audioManager = new AudioManager();
        this.obstacleManager = new ObstacleManager();

        this.init();
    }

    // 游戏的初始化方法
    init() {
        // 绑定键盘按键按下的事件
        document.addEventListener('keydown', this.keydownHandler.bind(this));

        // 初始化障碍物
        this.obstacleManager.generateObstacles(this.scorePanel.stage);

        // 播放背景音乐（浏览器可能阻止自动播放，需在用户交互后播放）
        document.addEventListener('click', () => {
            this.audioManager.playBgm();
        }, { once: true });

        // 调用run方法，使蛇移动
        this.run();
    }

    /*
    *   ArrowUp  Up  w
    *   ArrowDown Down s
    *   ArrowLeft Left a
    *   ArrowRight Right d
    * */

    // 键盘按键响应
    keydownHandler(event: KeyboardEvent) {
        // Prevent default scrolling for arrow keys
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].indexOf(event.key) > -1) {
            event.preventDefault();
        }

        switch (event.key.toLowerCase()) {
            case 'arrowup':
            case 'up':
            case 'w':
                if (this.direction !== 'ArrowDown' && this.direction !== 'Down' && this.direction !== 's')
                    this.direction = event.key;
                break;
            case 'arrowdown':
            case 'down':
            case 's':
                if (this.direction !== 'ArrowUp' && this.direction !== 'Up' && this.direction !== 'w')
                    this.direction = event.key;
                break;
            case 'arrowleft':
            case 'left':
            case 'a':
                if (this.direction !== 'ArrowRight' && this.direction !== 'Right' && this.direction !== 'd')
                    this.direction = event.key;
                break;
            case 'arrowright':
            case 'right':
            case 'd':
                if (this.direction !== 'ArrowLeft' && this.direction !== 'Left' && this.direction !== 'a')
                    this.direction = event.key;
                break;
            case 'r':
                this.restartGame();
                break;
            case 't':
                this.prevStage();
                break;
            case 'y':
                this.nextStage();
                break;
            case 'g':
                this.speed = Math.max(50, this.speed - 50);
                break;
            case 'h':
                this.speed = Math.min(1000, this.speed + 50);
                break;
            case 'f':
                this.shoot();
                break;
        }
    }

    restartGame() {
        location.reload();
    }

    prevStage() {
        if (this.scorePanel.stage > 1) {
            this.scorePanel.setStage(this.scorePanel.stage - 1);
            this.resetStage();
        }
    }

    nextStage() {
        if (this.scorePanel.stage < this.scorePanel.maxStage) {
            this.scorePanel.setStage(this.scorePanel.stage + 1);
            this.resetStage();
        }
    }

    resetStage() {
        this.obstacleManager.generateObstacles(this.scorePanel.stage);
        this.food.change(this.obstacleManager.obstacleCoords);

        // Boss 处理
        if (this.boss) {
            this.boss.die();
            this.boss = null;
        }
        if (this.scorePanel.stage % 5 === 0) {
            this.boss = new Boss(this.scorePanel.stage);
        }
    }

    shoot() {
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

        let vx = 0;
        let vy = 0;

        // Determine bullet direction based on last move direction
        if (this.direction === 'ArrowUp' || this.direction === 'Up' || this.direction === 'w') vy = -GRID_SIZE;
        else if (this.direction === 'ArrowDown' || this.direction === 'Down' || this.direction === 's') vy = GRID_SIZE;
        else if (this.direction === 'ArrowLeft' || this.direction === 'Left' || this.direction === 'a') vx = -GRID_SIZE;
        else vx = GRID_SIZE; // Default right

        const bulletInterval = setInterval(() => {
            bx += vx;
            by += vy;
            bullet.style.left = bx + 'px';
            bullet.style.top = by + 'px';

            // ── 子弹 vs Boss（通过 EntityRegistry 统一碰撞） ──
            if (this.boss && this.boss.isAlive) {
                const bossHit = entityRegistry.findColliding(
                    bx, by, BULLET_SIZE, BULLET_SIZE, ['boss'],
                );
                if (bossHit) {
                    this.boss.takeDamage();
                    clearInterval(bulletInterval);
                    if (bullet.parentNode) bullet.parentNode.removeChild(bullet);

                    // Particle effect on hit
                    this.particleSystem.addParticles(bx, by, 5, 'red');

                    if (!this.boss.isAlive) {
                        this.boss = null;
                        // Bonus points for killing boss
                        this.scorePanel.score += 50;
                        this.scorePanel.scoreEle.innerHTML = this.scorePanel.score + '';
                    }
                    return;
                }
            }

            // ── 子弹 vs 墙壁 / 障碍物（通过 EntityRegistry 统一碰撞） ──
            const hitObstacle = entityRegistry.findColliding(
                bx, by, BULLET_SIZE, BULLET_SIZE, ['obstacle'],
            );
            if (
                bx < 0 || bx > maxXFor(GRID_SIZE) ||
                by < 0 || by > maxYFor(GRID_SIZE) ||
                hitObstacle
            ) {
                clearInterval(bulletInterval);
                if (bullet.parentNode) bullet.parentNode.removeChild(bullet);
            }
        }, 30);
    }

    // 蛇移动的主循环
    run() {
        if (!this.isLive) return;

        // 获取蛇现在坐标
        let X = this.snake.X;
        let Y = this.snake.Y;

        // 根据按键方向来修改 X 值和 Y 值
        switch (this.direction) {
            case "ArrowUp":
            case "Up":
            case "w":
                Y -= GRID_SIZE;
                break;
            case "ArrowDown":
            case "Down":
            case "s":
                Y += GRID_SIZE;
                break;
            case "ArrowLeft":
            case "Left":
            case "a":
                X -= GRID_SIZE;
                break;
            case "ArrowRight":
            case "Right":
            case "d":
                X += GRID_SIZE;
                break;
        }

        // 检查蛇是否吃到了食物
        this.checkEat(X, Y);

        // ── 蛇 vs 障碍物（通过 EntityRegistry 统一碰撞） ──
        if (entityRegistry.checkGridCell(X, Y, ['obstacle'])) {
            this.isLive = false;
            this.audioManager.playDeath();
            alert('撞到障碍物了！ GAME OVER!');
            return;
        }

        // ── 蛇 vs Boss（通过 EntityRegistry 统一碰撞） ──
        if (this.boss && this.boss.isAlive) {
            const bossHit = entityRegistry.checkGridCell(X, Y, ['boss']);
            if (bossHit) {
                this.isLive = false;
                this.audioManager.playDeath();
                alert('被Boss打败了！ GAME OVER!');
                return;
            }
            // Boss moves occasionally
            if (Math.random() < 0.1) this.boss.move();
        }

        // 修改蛇的X和Y值
        try {
            this.snake.X = X;
            this.snake.Y = Y;
        } catch (e: any) {
            // 进入到catch，说明出现了异常，游戏结束
            this.audioManager.playDeath();
            alert(e.message + ' GAME OVER!');
            this.isLive = false;
        }

        // 更新粒子系统
        if (this.particleSystem && this.particleSystem.update) {
            this.particleSystem.update();
        }

        // 开启定时调用
        this.isLive && setTimeout(this.run.bind(this), this.speed);
    }

    // 检查蛇是否吃到食物
    checkEat(X: number, Y: number) {
        if (X === this.food.X && Y === this.food.Y) {
            // 播放吃食物音效
            this.audioManager.playEat();

            // 在食物位置创建粒子特效
            try {
                this.particleSystem.addParticles(
                    X + 5,
                    Y + 5,
                    10,
                    '#FFD700'
                );
            } catch (e) {
                console.error('Particle effect error:', e);
            }

            // 食物的位置要进行重置
            this.food.change(this.obstacleManager.obstacleCoords);
            // 分数增加
            const currentStage = this.scorePanel.stage;
            this.scorePanel.addScore();
            // Check if stage increased
            if (this.scorePanel.stage > currentStage) {
                this.resetStage();
            }

            // 蛇要增加一节
            this.snake.addBody();
        }
    }
}

export default GameControl;
