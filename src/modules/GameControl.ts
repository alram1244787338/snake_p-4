import Snake from "./Snake";
import Food from "./Food";
import ScorePanel from "./ScorePanel";
import { ParticleSystem } from "./ParticleEffect";
import { AudioManager } from "./AudioManager";
import { ObstacleManager } from "./ObstacleManager";
import { Boss } from "./Boss";
import { GameCommand, InputController } from "./InputController";
import {
    BOARD_MAX,
    BOARD_MIN,
    BOSS_KILL_BONUS,
    BOSS_MOVE_CHANCE,
    BOSS_STAGE_INTERVAL,
    BULLET_SIZE,
    BULLET_SPEED,
    BULLET_TICK_MS,
    DEFAULT_SPEED,
    DELTA,
    Direction,
    HALF_CELL,
    MAX_SPEED,
    MIN_SPEED,
    OPPOSITE,
    SPEED_STEP,
} from "./constants";

// 游戏控制器：把各个模块组装起来，负责推进每一帧。
// 具体职责被拆成了一组小方法：
//   输入       -> setDirection / handleCommand
//   关卡/速度  -> loadStage / goToPrevStage / goToNextStage / speedUp / speedDown
//   每帧推进   -> tick 调度，具体步骤拆给 computeNextHead / eatFoodIfPresent / hitsXxx / applyMove
//   死亡       -> gameOver 统一处理
class GameControl {
    // 蛇
    snake: Snake;
    // 食物
    food: Food;
    // 记分牌
    scorePanel: ScorePanel;
    // 粒子系统
    particleSystem: ParticleSystem;
    // 音效管理器
    audioManager: AudioManager;
    // 障碍物管理器
    obstacleManager: ObstacleManager;
    // 输入控制器
    input: InputController;
    // Boss（没有时为 null）
    boss: Boss | null = null;

    // 当前移动方向，用枚举表示，不再靠字符串猜
    direction: Direction = Direction.None;
    // 游戏是否还在进行
    isLive = true;
    // 每一步的间隔毫秒数，越小越快
    speed: number = DEFAULT_SPEED;

    constructor() {
        this.snake = new Snake();
        this.food = new Food();
        this.scorePanel = new ScorePanel(10, 5); // 每 5 分升一关
        this.particleSystem = new ParticleSystem();
        this.audioManager = new AudioManager();
        this.obstacleManager = new ObstacleManager();
        this.input = new InputController({
            onDirection: (direction) => this.setDirection(direction),
            onCommand: (command) => this.handleCommand(command),
        });

        this.init();
    }

    // 初始化并开始游戏
    init() {
        // 接管键盘输入
        this.input.start();

        // 生成当前关卡的障碍物
        this.obstacleManager.generateObstacles(this.scorePanel.stage);

        // 背景音乐需要在用户首次交互后播放（浏览器自动播放限制）
        document.addEventListener('click', () => {
            this.audioManager.playBgm();
        }, { once: true });

        // 启动主循环
        this.tick();
    }

    /* ============ 输入：方向与指令 ============ */

    // 设置移动方向。这里集中处理 “不能掉头” 这条规则：
    // 只要请求的方向不是当前方向的反方向，就接受。
    setDirection(requested: Direction) {
        if (requested === Direction.None) return;
        if (OPPOSITE[requested] === this.direction) return; // 想反向掉头，忽略
        this.direction = requested;
    }

    // 把输入控制器送来的指令派发到对应入口
    handleCommand(command: GameCommand) {
        switch (command) {
            case GameCommand.Restart: this.restart(); break;
            case GameCommand.PrevStage: this.goToPrevStage(); break;
            case GameCommand.NextStage: this.goToNextStage(); break;
            case GameCommand.SpeedUp: this.speedUp(); break;
            case GameCommand.SpeedDown: this.speedDown(); break;
            case GameCommand.Shoot: this.shoot(); break;
        }
    }

    /* ============ 统一的操作入口 ============ */

    restart() {
        location.reload();
    }

    goToPrevStage() {
        if (this.scorePanel.stage > 1) {
            this.scorePanel.setStage(this.scorePanel.stage - 1);
            this.loadStage();
        }
    }

    goToNextStage() {
        if (this.scorePanel.stage < this.scorePanel.maxStage) {
            this.scorePanel.setStage(this.scorePanel.stage + 1);
            this.loadStage();
        }
    }

    // 加速：间隔变短
    speedUp() {
        this.speed = Math.max(MIN_SPEED, this.speed - SPEED_STEP);
    }

    // 减速：间隔变长
    speedDown() {
        this.speed = Math.min(MAX_SPEED, this.speed + SPEED_STEP);
    }

    // 加载（或重置）当前关卡：障碍物、食物、Boss
    loadStage() {
        this.obstacleManager.generateObstacles(this.scorePanel.stage);
        this.food.change(this.obstacleManager.obstacleCoords);

        // 切关时清掉旧 Boss
        if (this.boss) {
            this.boss.die();
            this.boss = null;
        }
        // 每隔若干关刷一个 Boss
        if (this.scorePanel.stage % BOSS_STAGE_INTERVAL === 0) {
            this.boss = new Boss(this.scorePanel.stage);
        }
    }

    /* ============ 主循环 ============ */

    // 每一帧推进一步。只负责编排顺序，细节交给下面的小方法。
    tick = () => {
        if (!this.isLive) return;

        // 输入 -> 方向 -> 下一步坐标
        const { x, y } = this.computeNextHead();

        // 先判断是否吃到食物（可能升关、长身体）
        this.eatFoodIfPresent(x, y);

        // 撞障碍物 / 撞 Boss 直接结束
        if (this.hitsObstacle(x, y)) {
            this.gameOver('撞到障碍物了！');
            return;
        }
        if (this.hitsBoss(x, y)) {
            this.gameOver('被Boss打败了！');
            return;
        }

        // Boss 偶尔走一步
        this.updateBoss();

        // 真正移动蛇（撞墙 / 撞自己会在这里结束游戏）
        this.applyMove(x, y);

        // 更新粒子特效
        this.updateParticles();

        // 还活着就安排下一帧
        if (this.isLive) {
            setTimeout(this.tick, this.speed);
        }
    };

    // 根据当前方向算出蛇头的下一步坐标（方向 -> 移动）
    computeNextHead(): { x: number; y: number } {
        const step = DELTA[this.direction];
        return { x: this.snake.X + step.x, y: this.snake.Y + step.y };
    }

    // 如果下一步落点正好是食物：加分、长身体、刷新食物，必要时升关
    eatFoodIfPresent(x: number, y: number) {
        if (x !== this.food.X || y !== this.food.Y) return;

        this.audioManager.playEat();

        // 在食物位置炸一组粒子（特效报错不影响游戏）
        try {
            this.particleSystem.addParticles(x + HALF_CELL, y + HALF_CELL, 10, '#FFD700');
        } catch (e) {
            console.error('Particle effect error:', e);
        }

        // 重新放置食物，避开障碍物
        this.food.change(this.obstacleManager.obstacleCoords);

        // 加分，若因此升了关则重载关卡
        const prevStage = this.scorePanel.stage;
        this.scorePanel.addScore();
        if (this.scorePanel.stage > prevStage) {
            this.loadStage();
        }

        // 蛇增加一节
        this.snake.addBody();
    }

    // 下一步是否撞到障碍物
    hitsObstacle(x: number, y: number): boolean {
        return this.obstacleManager.checkCollision(x, y);
    }

    // 下一步是否撞到 Boss
    hitsBoss(x: number, y: number): boolean {
        return !!(this.boss && this.boss.isAlive && this.boss.containsPoint(x, y));
    }

    // Boss 的随机走位
    updateBoss() {
        if (this.boss && this.boss.isAlive && Math.random() < BOSS_MOVE_CHANCE) {
            this.boss.move();
        }
    }

    // 把新坐标写到蛇身上；撞墙 / 撞自己时 setter 会抛错，这里转成游戏结束
    applyMove(x: number, y: number) {
        try {
            this.snake.X = x;
            this.snake.Y = y;
        } catch (e: any) {
            this.gameOver(e.message);
        }
    }

    // 安全地推进粒子系统
    updateParticles() {
        if (this.particleSystem && this.particleSystem.update) {
            this.particleSystem.update();
        }
    }

    // 统一的死亡处理：标记结束、播放音效、弹提示
    gameOver(message: string) {
        this.isLive = false;
        this.audioManager.playDeath();
        alert(message + ' GAME OVER!');
    }

    /* ============ 开枪 ============ */

    shoot() {
        if (!this.isLive) return;

        const bullet = document.createElement('div');
        bullet.style.width = BULLET_SIZE + 'px';
        bullet.style.height = BULLET_SIZE + 'px';
        bullet.style.backgroundColor = 'yellow';
        bullet.style.position = 'absolute';

        // 从蛇头中心射出
        let bx = this.snake.X + HALF_CELL;
        let by = this.snake.Y + HALF_CELL;
        bullet.style.left = bx + 'px';
        bullet.style.top = by + 'px';
        document.getElementById('stage')!.appendChild(bullet);

        // 子弹方向跟随当前移动方向；还没动过时默认向右
        const dir = this.direction === Direction.None ? Direction.Right : this.direction;
        const step = DELTA[dir];
        const vx = Math.sign(step.x) * BULLET_SPEED;
        const vy = Math.sign(step.y) * BULLET_SPEED;

        const bulletInterval = setInterval(() => {
            bx += vx;
            by += vy;
            bullet.style.left = bx + 'px';
            bullet.style.top = by + 'px';

            // 命中 Boss
            if (this.boss && this.boss.isAlive && this.boss.containsPoint(bx, by)) {
                this.boss.takeDamage();
                clearInterval(bulletInterval);
                if (bullet.parentNode) bullet.parentNode.removeChild(bullet);

                // 命中粒子
                this.particleSystem.addParticles(bx, by, 5, 'red');

                if (!this.boss.isAlive) {
                    this.boss = null;
                    // 击杀 Boss 的奖励分
                    this.scorePanel.addBonus(BOSS_KILL_BONUS);
                }
                return;
            }

            // 出界或撞到障碍物则销毁
            if (
                bx < BOARD_MIN || bx > BOARD_MAX ||
                by < BOARD_MIN || by > BOARD_MAX ||
                this.obstacleManager.checkCollision(bx, by)
            ) {
                clearInterval(bulletInterval);
                if (bullet.parentNode) bullet.parentNode.removeChild(bullet);
            }
        }, BULLET_TICK_MS);
    }
}

export default GameControl;
