// 覆盖层视图：用柔和的舞台内提示替代 alert / location.reload 那种硬打断。
// - showGameOver：游戏结束面板，常驻直到重开
// - toast：切关 / 击败 Boss 等转瞬即逝的提示
// 所有 DOM 都收口在这里，业务层只表达「想提示什么」。

export class Overlay {
    private stageEl: HTMLElement;
    private gameOverEl: HTMLElement;
    private toastEl: HTMLElement;
    private toastTimer: number | null = null;

    constructor() {
        this.stageEl = document.getElementById('stage')!;

        // 游戏结束面板（常驻型）
        this.gameOverEl = document.createElement('div');
        this.gameOverEl.className = 'game-overlay';
        this.stageEl.appendChild(this.gameOverEl);

        // 临时提示（转瞬型）
        this.toastEl = document.createElement('div');
        this.toastEl.className = 'game-toast';
        this.stageEl.appendChild(this.toastEl);
    }

    // 显示游戏结束面板，常驻直到 hide()
    showGameOver(message: string) {
        this.gameOverEl.innerHTML =
            `<div class="game-overlay__title">GAME OVER</div>` +
            `<div class="game-overlay__msg">${message}</div>` +
            `<div class="game-overlay__hint">按 R 重新开始</div>`;
        this.gameOverEl.classList.add('is-visible');
    }

    // 隐藏游戏结束面板
    hide() {
        this.gameOverEl.classList.remove('is-visible');
    }

    // 转瞬即逝的提示（切关、击败 Boss 等）
    toast(message: string, durationMs: number = 1200) {
        this.toastEl.textContent = message;
        this.toastEl.classList.add('is-visible');

        if (this.toastTimer !== null) {
            clearTimeout(this.toastTimer);
        }
        this.toastTimer = window.setTimeout(() => {
            this.toastEl.classList.remove('is-visible');
            this.toastTimer = null;
        }, durationMs);
    }
}
