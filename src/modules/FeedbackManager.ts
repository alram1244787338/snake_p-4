/**
 * 反馈管理器 —— 统一管理音效和粒子特效的触发。
 * 订阅 EventBus 事件，根据事件类型调用 AudioManager / ParticleSystem。
 * 业务逻辑（GameControl）不需要知道任何反馈细节。
 */

import { eventBus } from './EventBus';
import { AudioManager } from './AudioManager';
import { ParticleSystem } from './ParticleEffect';

export class FeedbackManager {
  audio: AudioManager;
  particles: ParticleSystem;

  constructor() {
    this.audio = new AudioManager();
    this.particles = new ParticleSystem();
    this.subscribe();
  }

  /* ---------- 事件订阅 ---------- */

  private subscribe() {
    // 吃食物 → 音效 + 金色粒子
    eventBus.on('food:eaten', ({ x, y }) => {
      this.audio.playEat();
      this.particles.addParticles(x + 5, y + 5, 10, '#FFD700');
    });

    // Boss 被击中 → 红色粒子
    eventBus.on('boss:hit', ({ x, y }) => {
      this.particles.addParticles(x, y, 5, 'red');
    });

    // Boss 被击杀 → 大量粒子庆祝
    eventBus.on('boss:killed', ({ x, y }) => {
      this.particles.addParticles(x + 15, y + 15, 20, '#FF6600');
      this.particles.addParticles(x + 15, y + 15, 15, '#FFD700');
    });

    // 游戏结束 → 死亡音效
    eventBus.on('game:over', () => {
      this.audio.playDeath();
      this.audio.stopBgm();
    });

    // 重新开始 → 重置粒子，重新播放背景音乐
    eventBus.on('game:restart', () => {
      this.particles.clear();
      this.audio.playBgm();
    });
  }

  /* ---------- 被 GameControl 直接调用的方法 ---------- */

  /** 每帧更新粒子（需要在游戏循环中调用） */
  updateParticles() {
    this.particles.update();
  }

  /** 初始化背景音乐（需要用户交互后才能播放） */
  initBgm() {
    document.addEventListener('click', () => {
      this.audio.playBgm();
    }, { once: true });
  }
}
