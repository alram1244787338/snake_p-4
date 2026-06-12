// 记分牌「模型」：只负责分数 / 关卡的数值状态，不接触任何 DOM。
// 视图更新由 Hud 负责，业务流程通过返回的 ScoreState 得知发生了什么变化。

// 一次分数变化后的快照，供表现层（Hud / Presenter）消费
export interface ScoreState {
    score: number;
    stage: number;
    // 本次变化是否触发了升级
    leveledUp: boolean;
}

// 定义表示记分牌的类
class ScorePanel {
    // score和stage用来记录分数和关卡
    score = 0;
    stage = 1;

    // 设置一个变量限制关卡
    maxStage: number;
    // 设置一个变量表示多少分升级
    upScore: number;

    constructor(maxStage: number = 10, upScore: number = 10) {
        this.maxStage = maxStage;
        this.upScore = upScore;
    }

    // 加分：自增分数，必要时升级，返回本次变化的快照
    addScore(): ScoreState {
        this.score++;
        let leveledUp = false;
        // 判断分数是否达到升级条件
        if (this.score % this.upScore === 0 && this.stage < this.maxStage) {
            this.stage++;
            leveledUp = true;
        }
        return this.snapshot(leveledUp);
    }

    // 额外奖励分（如击败 Boss），不参与升级判定
    addBonus(points: number): ScoreState {
        this.score += points;
        return this.snapshot(false);
    }

    // 直接设置关卡（手动切关），成功返回 true
    setStage(stage: number): boolean {
        if (stage >= 1 && stage <= this.maxStage) {
            this.stage = stage;
            return true;
        }
        return false;
    }

    // 重置数值状态
    reset() {
        this.score = 0;
        this.stage = 1;
    }

    // 生成当前状态快照
    snapshot(leveledUp: boolean = false): ScoreState {
        return { score: this.score, stage: this.stage, leveledUp };
    }
}

export default ScorePanel;
