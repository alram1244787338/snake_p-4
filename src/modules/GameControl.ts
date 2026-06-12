import Snake from './Snake';
import Food from './Food';
import { GameState } from './GameState';
import { FeedbackManager } from './FeedbackManager';
import { UIManager } from './UIManager';
import { eventBus } from './EventBus';
import { ObstacleManager } from './ObstacleManager';
import { Boss } from './Boss';

/**
 * 游戏控制器 —— 只负责：
 *   1. 游戏主循环（移动、碰撞检测）
 *   2. 键盘输入响应
 *   3. 子弹逻辑
 *
 * 表现反馈（UI / 音效 / 粒子）全部通过 EventBus 发布事件，
 * 由 UIManager 和 FeedbackManager 各自订阅处理。
 */
class GameControl {
  // ---- 核心模块 ----
  snake: Snake;
  food: Food;
  state: GameState;
  feedback: FeedbackManager;
  ui: UIManager;
  obstacleManager: ObstacleManager;

  // ---- Boss ----
  boss: Boss | null = null;

  // ---- 子弹 ----
  private bullets: HTMLDivElement[] = [];
  private bulletTimers: number[] = [];

  // ---- 输入 ----
  direction = '';

  // ---- 游戏循环 ----
  private runTimer: number | null = null;

  constructor() {
    // 初始化纯数据状态
    this.state = new GameState(10, 5, 300);

    // 初始化表现层（订阅事件）
    this.ui = new UIManager();
    this.feedback = new FeedbackManager();

    // 初始化游戏实体
    this.snake = new Snake();
    this.food = new Food();
    this.obstacleManager = new ObstacleManager();

    this.init();
  }

  /* ================================================================
   *  初始化
   * ================================================================ */

  private init() {
    document.addEventListener('keydown', this.onKeyDown);
    this.obstacleManager.generateObstacles(this.state.stage);
    this.feedback.initBgm();
    this.run();
  }

  /* ================================================================
   *  键盘输入
   * ================================================================ */

  private onKeyDown = (e: KeyboardEvent) => {
    // 阻止方向键滚动页面
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
      e.preventDefault();
    }

    switch (e.key.toLowerCase()) {
      /* ---- 方向 ---- */
      case 'arrowup': case 'up': case 'w':
        if (!this.isOpposite('down')) this.direction = e.key;
        break;
      case 'arrowdown': case 'down': case 's':
        if (!this.isOpposite('up')) this.direction = e.key;
        break;
      case 'arrowleft': case 'left': case 'a':
        if (!this.isOpposite('right')) this.direction = e.key;
        break;
      case 'arrowright': case 'right': case 'd':
        if (!this.isOpposite('left')) this.direction = e.key;
        break;

      /* ---- 功能键 ---- */
      case 'r':  this.restart(); break;
      case 't':  this.prevStage(); break;
      case 'y':  this.nextStage(); break;
      case 'g':  this.state.speedUp(); break;
      case 'h':  this.state.speedDown(); break;
      case 'f':  this.shoot(); break;
    }
  };

  private isOpposite(dir: string): boolean {
    const d = this.direction.toLowerCase();
    switch (dir) {
      case 'up':    return d === 'arrowdown' || d === 'down' || d === 's';
      case 'down':  return d === 'arrowup'   || d === 'up'   || d === 'w';
      case 'left':  return d === 'arrowright'|| d === 'right' || d === 'd';
      case 'right': return d === 'arrowleft' || d === 'left'  || d === 'a';
    }
    return false;
  }

  /* ================================================================
   *  游戏主循环
   * ================================================================ */

  private run = () => {
    if (!this.state.isLive) return;

    let X = this.snake.X;
    let Y = this.snake.Y;

    switch (this.direction) {
      case 'ArrowUp':   case 'Up':   case 'w': Y -= 10; break;
      case 'ArrowDown': case 'Down': case 's': Y += 10; break;
      case 'ArrowLeft': case 'Left': case 'a': X -= 10; break;
      case 'ArrowRight':case 'Right':case 'd': X += 10; break;
    }

    // 吃食物检测
    this.checkEat(X, Y);

    // 障碍物碰撞
    if (this.obstacleManager.checkCollision(X, Y)) {
      this.state.die('撞到障碍物了！');
      return;
    }

    // Boss 碰撞
    if (this.boss?.isAlive) {
      if (X >= this.boss.X && X <= this.boss.X + 30 &&
          Y >= this.boss.Y && Y <= this.boss.Y + 30) {
        this.state.die('被 Boss 打败了！');
        return;
      }
      // Boss 偶尔移动
      if (Math.random() < 0.1) this.boss.move();
    }

    // 移动蛇
    try {
      this.snake.X = X;
      this.snake.Y = Y;
    } catch (e: any) {
      this.state.die(e.message);
      return;
    }

    // 更新粒子
    this.feedback.updateParticles();

    // 调度下一帧
    this.runTimer = window.setTimeout(this.run, this.state.speed);
  };

  /* ================================================================
   *  吃食物
   * ================================================================ */

  private checkEat(X: number, Y: number) {
    if (X !== this.food.X || Y !== this.food.Y) return;

    // 发布食物被吃事件 → FeedbackManager 自动播放音效 + 粒子
    eventBus.emit('food:eaten', { x: X, y: Y });

    // 重置食物
    this.food.change(this.obstacleManager.obstacleCoords);

    // 加分（GameState 内部判断是否升级并发布事件）
    const prevStage = this.state.stage;
    this.state.addScore();

    // 如果升级了，重置关卡布局
    if (this.state.stage > prevStage) {
      this.resetStage();
    }

    // 蛇身增长
    this.snake.addBody();
  }

  /* ================================================================
   *  关卡管理
   * ================================================================ */

  private prevStage() {
    if (this.state.stage > 1) {
      this.state.setStage(this.state.stage - 1);
      this.resetStage();
    }
  }

  private nextStage() {
    if (this.state.stage < this.state.maxStage) {
      this.state.setStage(this.state.stage + 1);
      this.resetStage();
    }
  }

  private resetStage() {
    this.obstacleManager.generateObstacles(this.state.stage);
    this.food.change(this.obstacleManager.obstacleCoords);

    // 清理旧 Boss
    if (this.boss) { this.boss.die(); this.boss = null; }

    // 每 5 关出现 Boss
    if (this.state.stage % 5 === 0) {
      this.boss = new Boss(this.state.stage);
    }

    eventBus.emit('stage:reset', { stage: this.state.stage });
  }

  /* ================================================================
   *  子弹系统
   * ================================================================ */

  private shoot() {
    if (!this.state.isLive) return;

    const bullet = document.createElement('div');
    bullet.style.cssText =
      'width:5px;height:5px;background:yellow;position:absolute;border-radius:50%;z-index:20;';

    let bx = this.snake.X + 5;
    let by = this.snake.Y + 5;
    bullet.style.left = bx + 'px';
    bullet.style.top  = by + 'px';

    document.getElementById('stage')!.appendChild(bullet);
    this.bullets.push(bullet);

    let vx = 0, vy = 0;
    if (this.isDir('up'))         vy = -10;
    else if (this.isDir('down'))  vy =  10;
    else if (this.isDir('left'))  vx = -10;
    else                          vx =  10;

    const timer = window.setInterval(() => {
      bx += vx; by += vy;
      bullet.style.left = bx + 'px';
      bullet.style.top  = by + 'px';

      // 命中 Boss
      if (this.boss?.isAlive &&
          bx >= this.boss.X && bx <= this.boss.X + 30 &&
          by >= this.boss.Y && by <= this.boss.Y + 30) {

        const hitX = bx, hitY = by;
        this.boss.takeDamage();
        this.removeBullet(bullet, timer);

        eventBus.emit('boss:hit', { x: hitX, y: hitY });

        if (!this.boss.isAlive) {
          eventBus.emit('boss:killed', { x: this.boss.X, y: this.boss.Y, bonus: 50 });
          this.boss = null;
          this.state.addBonus(50);
        }
        return;
      }

      // 出界或撞障碍物
      if (bx < 0 || bx > 290 || by < 0 || by > 290 ||
          this.obstacleManager.checkCollision(bx, by)) {
        this.removeBullet(bullet, timer);
      }
    }, 30);

    this.bulletTimers.push(timer);
  }

  private isDir(dir: string): boolean {
    const d = this.direction.toLowerCase();
    switch (dir) {
      case 'up':    return d === 'arrowup'   || d === 'up'   || d === 'w';
      case 'down':  return d === 'arrowdown' || d === 'down' || d === 's';
      case 'left':  return d === 'arrowleft' || d === 'left' || d === 'a';
    }
    return false;
  }

  private removeBullet(bullet: HTMLDivElement, timer: number) {
    clearInterval(timer);
    if (bullet.parentNode) bullet.parentNode.removeChild(bullet);
    const bIdx = this.bullets.indexOf(bullet);
    if (bIdx > -1) this.bullets.splice(bIdx, 1);
    const tIdx = this.bulletTimers.indexOf(timer);
    if (tIdx > -1) this.bulletTimers.splice(tIdx, 1);
  }

  /* ================================================================
   *  重新开始（不刷新页面）
   * ================================================================ */

  private restart() {
    // 1. 停止当前循环
    if (this.runTimer !== null) { clearTimeout(this.runTimer); this.runTimer = null; }

    // 2. 清理所有子弹
    this.bulletTimers.forEach(t => clearInterval(t));
    this.bulletTimers = [];
    this.bullets.forEach(b => b.parentNode?.removeChild(b));
    this.bullets = [];

    // 3. 清理 Boss
    if (this.boss) { this.boss.die(); this.boss = null; }

    // 4. 重置游戏状态（发布 score:0, stage:1, game:restart 事件）
    this.state.reset();

    // 5. 重置蛇
    this.snake.reset();
    this.direction = '';

    // 6. 重置障碍物 & 食物
    this.obstacleManager.generateObstacles(1);
    this.food.change(this.obstacleManager.obstacleCoords);

    // 7. 重启游戏循环
    this.run();
  }
}

export default GameControl;
