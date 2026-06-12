import { AudioManager } from './AudioManager';
import { ParticleSystem } from './ParticleEffect';
import { Hud } from './Hud';
import { Overlay } from './Overlay';
import type { ScoreState } from './ScorePanel';

// 表现层门面：把音效、粒子、HUD、覆盖层组合在一起，对外只暴露「发生了什么游戏事件」
// 这一层语义化的接口。GameControl 不再自己调度 playEat / addParticles / innerHTML / alert，
// 而是调用 onFoodEaten / onBossHit / onGameOver 这类意图明确的方法，表现与业务彻底解耦。
export class GamePresenter {
    private hud: Hud;
    private audio: AudioManager;
    private particles: ParticleSystem;
    private overlay: Overlay;

    constructor() {
        this.hud = new Hud();
        this.audio = new AudioManager();
        this.particles = new ParticleSystem();
        this.overlay = new Overlay();
    }

    // —— 生命周期 / 帧驱动 ——

    // 背景音乐需在用户首次交互后才能播放
    enableBgmOnFirstInteraction() {
        document.addEventListener('click', () => this.audio.playBgm(), { once: true });
    }

    // 将当前分数 / 关卡同步到 HUD
    syncStats(state: ScoreState) {
        this.hud.render({ score: state.score, stage: state.stage });
    }

    // 每帧推进粒子系统
    tick() {
        this.burst(() => this.particles.update());
    }

    // —— 游戏事件 ——

    // 吃到食物：音效 + 金色粒子 + 刷新分数，升级时附带提示
    onFoodEaten(x: number, y: number, state: ScoreState) {
        this.audio.playEat();
        this.burst(() => this.particles.addParticles(x + 5, y + 5, 10, '#FFD700'));
        this.hud.render({ score: state.score, stage: state.stage });
        if (state.leveledUp) {
            this.onLevelUp(state.stage);
        }
    }

    // 升级提示
    onLevelUp(stage: number) {
        this.overlay.toast(`关卡 ${stage}`);
    }

    // Boss 受击：命中点红色粒子
    onBossHit(x: number, y: number) {
        this.burst(() => this.particles.addParticles(x, y, 5, 'red'));
    }

    // 击败 Boss：更大的爆裂特效 + 刷新分数 + 奖励提示
    onBossDefeated(x: number, y: number, state: ScoreState) {
        this.burst(() => this.particles.addParticles(x, y, 16, '#FFD700'));
        this.hud.render({ score: state.score, stage: state.stage });
        this.overlay.toast('Boss 被击败! +50');
    }

    // 切关：刷新展示（残留粒子很快自行消散，故不强制清空，保留升级瞬间的吃食特效）
    onStageReset(state: ScoreState) {
        this.hud.render({ score: state.score, stage: state.stage });
    }

    // 游戏结束：死亡音效 + 停止背景乐 + 弹出结束面板（替代 alert）
    onGameOver(message: string) {
        this.audio.playDeath();
        this.audio.stopBgm();
        this.overlay.showGameOver(message);
    }

    // 重新开始：收起结束面板、清空粒子、复位展示（替代 location.reload）
    onRestart(state: ScoreState) {
        this.overlay.hide();
        this.particles.clear();
        this.hud.render({ score: state.score, stage: state.stage });
        this.audio.playBgm();
    }

    // 粒子 / 音效相关的副作用包一层防御，出错也不影响游戏主流程
    private burst(fn: () => void) {
        try {
            fn();
        } catch (e) {
            console.error('Presentation effect error:', e);
        }
    }
}
