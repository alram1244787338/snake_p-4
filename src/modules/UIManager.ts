/**
 * UI 管理器 —— 唯一负责操作 DOM 展示的地方。
 * 订阅 EventBus 事件，更新分数、关卡、游戏结束浮层等。
 * GameControl / GameState 等模块永远不需要直接触碰 DOM。
 */

import { eventBus } from './EventBus';

export class UIManager {
  private scoreEle!: HTMLElement;
  private stageEle!: HTMLElement;
  private overlay!: HTMLElement;
  private overlayMessage!: HTMLElement;
  private overlayScore!: HTMLElement;

  constructor() {
    this.bindElements();
    this.createOverlay();
    this.subscribe();
  }

  /* ---------- 初始化 ---------- */

  private bindElements() {
    this.scoreEle = document.getElementById('score')!;
    this.stageEle = document.getElementById('level')!;
  }

  /** 动态创建游戏结束浮层（替代 alert） */
  private createOverlay() {
    this.overlay = document.createElement('div');
    this.overlay.id = 'game-over-overlay';
    this.overlay.innerHTML = `
      <div class="overlay-content">
        <h2 class="overlay-title">游戏结束</h2>
        <p class="overlay-reason" id="game-over-reason"></p>
        <p class="overlay-score">得分：<span id="game-over-score">0</span></p>
        <p class="overlay-hint">按 <kbd>R</kbd> 重新开始</p>
      </div>
    `;
    document.body.appendChild(this.overlay);
    this.overlayMessage = document.getElementById('game-over-reason')!;
    this.overlayScore = document.getElementById('game-over-score')!;
  }

  /* ---------- 事件订阅 ---------- */

  private subscribe() {
    eventBus.on('score:update', ({ score }) => {
      this.scoreEle.textContent = String(score);
    });

    eventBus.on('stage:update', ({ stage }) => {
      this.stageEle.textContent = String(stage);
    });

    eventBus.on('game:over', ({ reason, score }) => {
      this.overlayMessage.textContent = reason;
      this.overlayScore.textContent = String(score);
      this.overlay.classList.add('visible');
    });

    eventBus.on('game:restart', () => {
      this.overlay.classList.remove('visible');
    });
  }

  /** 销毁时清理（目前为单例生命周期，可不调用） */
  destroy() {
    if (this.overlay.parentNode) {
      this.overlay.parentNode.removeChild(this.overlay);
    }
  }
}
