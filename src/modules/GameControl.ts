import Snake from "./Snake";
import Food from "./Food";
import ScorePanel from "./ScorePanel";
import { ObstacleManager } from "./ObstacleManager";
import { Boss } from "./Boss";
import { BulletManager } from "./BulletManager";
import { GamePresenter } from "./GamePresenter";

// 游戏运行状态
enum GameStatus {
    Running,
    GameOver,
}

// 游戏控制器：只负责游戏状态机、输入与移动循环这三件事。
// 所有表现反馈（音效 / 粒子 / 分数展示 / 结束提示）都交给 GamePresenter，
// 子弹的 DOM 与碰撞交给 BulletManager，分数数值交给 ScorePanel 模型——
// GameControl 自己不再直接碰 DOM、不调度音效、也不用 alert / location.reload。
class GameControl {
    // 蛇
    snake: Snake;
    // 食物
    food: Food;
    // 记分牌（纯数值模型）
    scorePanel: ScorePanel;
    // 障碍物管理器
    obstacleManager: ObstacleManager;
    // 子弹管理器
    bulletManager: BulletManager;
    // 表现层门面
    presenter: GamePresenter;
    // Boss
    boss: Boss | null = null;

    // 蛇的移动方向（也就是按键的方向）
    direction: string = '';
    // 游戏状态
    status: GameStatus = GameStatus.Running;
    // 游戏速度
    speed: number = 300;

    constructor() {
        this.snake = new Snake();
        this.food = new Food();
        this.scorePanel = new ScorePanel(10, 5); // 每5分升级
        this.obstacleManager = new ObstacleManager();
        this.bulletManager = new BulletManager();
        this.presenter = new GamePresenter();

        this.init();
    }

    // 游戏的初始化方法，调用后游戏即开始
    init() {
        // 绑定键盘按键按下的事件
        document.addEventListener('keydown', this.keydownHandler.bind(this));

        // 初始化障碍物与展示
        this.obstacleManager.generateObstacles(this.scorePanel.stage);
        this.presenter.syncStats(this.scorePanel.snapshot());

        // 背景音乐需用户首次交互后才能播放，交给表现层处理
        this.presenter.enableBgmOnFirstInteraction();

        // 调用run方法，使蛇移动
        this.run();
    }

    /*
    *   ArrowUp  Up  w
    *   ArrowDown Down s
    *   ArrowLeft Left a
    *   ArrowRight Right d
    * */

    // 创建一个键盘按下的响应函数
    keydownHandler(event: KeyboardEvent) {
        // Prevent default scrolling for arrow keys
        if(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].indexOf(event.key) > -1) {
            event.preventDefault();
        }

        switch(event.key.toLowerCase()) {
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
                this.restart();
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

    // 软重开：不刷新页面，逐项复位状态与展示后恢复循环
    restart() {
        const wasOver = this.status === GameStatus.GameOver;

        this.snake.reset();
        this.scorePanel.reset();
        this.direction = '';
        this.speed = 300;
        this.bulletManager.clear();
        if (this.boss) {
            this.boss.die();
            this.boss = null;
        }
        this.obstacleManager.generateObstacles(this.scorePanel.stage);
        this.food.change(this.obstacleManager.obstacleCoords);

        this.status = GameStatus.Running;
        this.presenter.onRestart(this.scorePanel.snapshot());

        // 仅当此前已结束（循环已停）时才重新启动循环，避免重复定时器
        if (wasOver) {
            this.run();
        }
    }

    prevStage() {
        if (this.scorePanel.setStage(this.scorePanel.stage - 1)) {
            this.resetStage();
        }
    }

    nextStage() {
        if (this.scorePanel.setStage(this.scorePanel.stage + 1)) {
            this.resetStage();
        }
    }

    // 切关：清子弹、重建障碍物与食物、按关卡决定是否生成 Boss
    resetStage() {
        this.bulletManager.clear();
        this.obstacleManager.generateObstacles(this.scorePanel.stage);
        this.food.change(this.obstacleManager.obstacleCoords);

        if (this.boss) {
            this.boss.die();
            this.boss = null;
        }
        if (this.scorePanel.stage % 5 === 0) {
            this.boss = new Boss(this.scorePanel.stage);
        }

        this.presenter.onStageReset(this.scorePanel.snapshot());
    }

    // 发射子弹：子弹的 DOM / 移动 / 碰撞全部交给 BulletManager，命中 Boss 时回调处理规则
    shoot() {
        if (this.status !== GameStatus.Running) return;

        this.bulletManager.spawn(this.snake.X, this.snake.Y, this.direction, {
            getBoss: () => this.boss,
            getObstacleCoords: () => this.obstacleManager.obstacleCoords,
            onBossHit: (x, y) => this.handleBossHit(x, y),
        });
    }

    // 子弹命中 Boss 的规则处理：扣血 + 受击特效，击杀则加分并触发击败反馈
    handleBossHit(x: number, y: number) {
        if (!this.boss || !this.boss.isAlive) return;

        this.boss.takeDamage();
        this.presenter.onBossHit(x, y);

        if (!this.boss.isAlive) {
            const state = this.scorePanel.addBonus(50); // 击败 Boss 奖励 50 分
            this.presenter.onBossDefeated(x, y, state);
            this.boss = null;
        }
    }

    // 创建一个控制蛇移动的方法
    run() {
        if (this.status !== GameStatus.Running) return;

        // 获取蛇现在坐标
        let X = this.snake.X;
        let Y = this.snake.Y;

        // 根据按键方向来修改X值和Y值
        switch (this.direction) {
            case "ArrowUp":
            case "Up":
            case "w":
                Y -= 10;
                break;
            case "ArrowDown":
            case "Down":
            case "s":
                Y += 10;
                break;
            case "ArrowLeft":
            case "Left":
            case "a":
                X -= 10;
                break;
            case "ArrowRight":
            case "Right":
            case "d":
                X += 10;
                break;
        }

        // 检查蛇是否吃到了食物
        this.checkEat(X, Y);

        // 撞到障碍物
        if (this.obstacleManager.checkCollision(X, Y)) {
            this.gameOver('撞到障碍物了！');
            return;
        }

        // 撞到 Boss
        if (this.boss && this.boss.isAlive) {
            if (X >= this.boss.X && X <= this.boss.X + 30 &&
                Y >= this.boss.Y && Y <= this.boss.Y + 30) {
                this.gameOver('被Boss打败了！');
                return;
            }
            // Boss 偶尔移动
            if (Math.random() < 0.1) this.boss.move();
        }

        // 修改蛇的X和Y值（撞墙 / 撞自己会抛异常）
        try {
            this.snake.X = X;
            this.snake.Y = Y;
        } catch (e: any) {
            this.gameOver(e.message);
            return;
        }

        // 推进粒子系统
        this.presenter.tick();

        // 开启一个定时调用
        setTimeout(this.run.bind(this), this.speed);
    }

    // 检查蛇是否吃到食物
    checkEat(X: number, Y: number) {
        if (X === this.food.X && Y === this.food.Y) {
            // 分数增加（模型返回本次变化）
            const state = this.scorePanel.addScore();
            // 食物重置 + 蛇增加一节
            this.food.change(this.obstacleManager.obstacleCoords);
            this.snake.addBody();
            // 表现反馈：音效 + 粒子 + 刷新分数（升级时附带提示）
            this.presenter.onFoodEaten(X, Y, state);
            // 升级则切关
            if (state.leveledUp) {
                this.resetStage();
            }
        }
    }

    // 统一的游戏结束入口：替代散落的 alert，仅做状态切换并交表现层提示
    gameOver(message: string) {
        if (this.status === GameStatus.GameOver) return;
        this.status = GameStatus.GameOver;
        this.bulletManager.clear();
        this.presenter.onGameOver(message);
    }
}

export default GameControl;
