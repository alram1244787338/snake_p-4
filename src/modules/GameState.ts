/**
 * 游戏状态 —— 只持有数据，不做任何 DOM / 音效 / 粒子操作。
 * 每次状态变更通过 EventBus 发布事件，由表现层自行响应。
 */

import { eventBus } from './EventBus';

export class GameState {
  score = 0;
  stage = 1;
  isLive = true;
  speed: number;

  readonly maxStage: number;
  readonly upScore: number;

  private _baseSpeed: number;

  constructor(maxStage = 10, upScore = 5, baseSpeed = 300) {
    this.maxStage = maxStage;
    this.upScore = upScore;
    this._baseSpeed = baseSpeed;
    this.speed = baseSpeed;
  }

  /* ---------- 分数 ---------- */

  addScore(delta = 1) {
    this.score += delta;
    eventBus.emit('score:update', { score: this.score });

    if (this.score % this.upScore === 0) {
      this.stageUp();
    }
  }

  /** 直接加分（Boss 击杀奖励等） */
  addBonus(amount: number) {
    this.score += amount;
    eventBus.emit('score:update', { score: this.score });
  }

  /* ---------- 关卡 ---------- */

  private stageUp() {
    if (this.stage < this.maxStage) {
      this.stage++;
      eventBus.emit('stage:update', { stage: this.stage });
    }
  }

  setStage(stage: number) {
    if (stage >= 1 && stage <= this.maxStage) {
      this.stage = stage;
      eventBus.emit('stage:update', { stage: this.stage });
    }
  }

  /* ---------- 速度 ---------- */

  speedUp(step = 50) {
    this.speed = Math.max(50, this.speed - step);
  }

  speedDown(step = 50) {
    this.speed = Math.min(1000, this.speed + step);
  }

  /* ---------- 生命周期 ---------- */

  die(reason: string) {
    if (!this.isLive) return;          // 防止重复触发
    this.isLive = false;
    eventBus.emit('game:over', { reason, score: this.score, stage: this.stage });
  }

  /** 完整重置，回到初始状态 */
  reset() {
    this.score = 0;
    this.stage = 1;
    this.isLive = true;
    this.speed = this._baseSpeed;
    eventBus.emit('score:update', { score: 0 });
    eventBus.emit('stage:update', { stage: 1 });
    eventBus.emit('game:restart', {});
  }
}
