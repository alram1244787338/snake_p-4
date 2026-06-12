// HUD 视图：表现层中唯一持有分数 / 关卡 DOM 的地方。
// 业务代码不再直接读写 #score / #level，统一通过 render(patch) 更新展示，
// 之后要加生命值、连击数等信息，只需扩展 HudPatch 与这里的渲染逻辑。

// 一次展示更新的「补丁」，所有字段可选，只更新传入的部分
export interface HudPatch {
    score?: number;
    stage?: number;
}

export class Hud {
    private scoreEle: HTMLElement;
    private stageEle: HTMLElement;

    constructor() {
        this.scoreEle = document.getElementById('score')!;
        this.stageEle = document.getElementById('level')!;
    }

    // 按补丁更新展示，未涉及的字段保持原样
    render(patch: HudPatch) {
        if (patch.score !== undefined) {
            this.scoreEle.innerHTML = patch.score + '';
        }
        if (patch.stage !== undefined) {
            this.stageEle.innerHTML = patch.stage + '';
        }
    }

    // 复位展示
    reset() {
        this.render({ score: 0, stage: 1 });
    }
}
