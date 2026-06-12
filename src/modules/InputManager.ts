/**
 * 方向枚举 —— 消除方向字符串比较
 */
export enum Direction {
    Up = 'up',
    Down = 'down',
    Left = 'left',
    Right = 'right',
}

/**
 * 原始按键 → 归一化方向
 * 支持 ArrowUp / Up / w 等全部同义按键
 */
const KEY_TO_DIRECTION: Record<string, Direction> = {
    arrowup: Direction.Up,
    up: Direction.Up,
    w: Direction.Up,
    arrowdown: Direction.Down,
    down: Direction.Down,
    s: Direction.Down,
    arrowleft: Direction.Left,
    left: Direction.Left,
    a: Direction.Left,
    arrowright: Direction.Right,
    right: Direction.Right,
    d: Direction.Right,
};

/** 反方向表，用于防止 180° 掉头 */
const OPPOSITE: Record<Direction, Direction> = {
    [Direction.Up]: Direction.Down,
    [Direction.Down]: Direction.Up,
    [Direction.Left]: Direction.Right,
    [Direction.Right]: Direction.Left,
};

/**
 * 输入管理器
 * - 将键盘事件归一化为 Direction 枚举或动作名称
 * - 对外暴露 currentDirection 和 registerAction 两个接口
 */
export class InputManager {
    private _direction: Direction | null = null;
    private _actions: Map<string, () => void> = new Map();
    private _handler: ((e: KeyboardEvent) => void) | null = null;

    /** 当前归一化后的移动方向 */
    get currentDirection(): Direction | null {
        return this._direction;
    }

    /** 绑定键盘监听 */
    bind(): void {
        this._handler = this.onKeyDown.bind(this);
        document.addEventListener('keydown', this._handler);
    }

    /** 解绑键盘监听 */
    unbind(): void {
        if (this._handler) {
            document.removeEventListener('keydown', this._handler);
            this._handler = null;
        }
    }

    /**
     * 注册一个动作回调（可绑定多个按键）
     * @example registerAction('restart', ['r'], () => this.restart())
     */
    registerAction(name: string, keys: string[], callback: () => void): void {
        this._actions.set(name, callback);
    }

    /** 重置方向（用于重开等场景） */
    resetDirection(): void {
        this._direction = null;
    }

    // ---- private ----

    private onKeyDown(event: KeyboardEvent): void {
        // 阻止方向键和空格的默认滚动
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(event.key)) {
            event.preventDefault();
        }

        const key = event.key.toLowerCase();

        // 1) 先检查是否是方向键
        const dir = KEY_TO_DIRECTION[key];
        if (dir) {
            this.trySetDirection(dir);
            return;
        }

        // 2) 再检查是否是已注册的动作键
        const action = KEY_TO_ACTION_MAP[key];
        if (action) {
            const cb = this._actions.get(action);
            if (cb) cb();
        }
    }

    /** 尝试修改方向（禁止反向） */
    private trySetDirection(newDir: Direction): void {
        if (this._direction === OPPOSITE[newDir]) return;
        this._direction = newDir;
    }
}

/** 原始按键 → 动作名称 */
const KEY_TO_ACTION_MAP: Record<string, string> = {
    r: 'restart',
    t: 'prevStage',
    y: 'nextStage',
    g: 'speedUp',
    h: 'speedDown',
    f: 'shoot',
};
