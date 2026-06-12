import { Direction } from "./constants";

// 除方向之外的游戏指令
export enum GameCommand {
    Restart,
    PrevStage,
    NextStage,
    SpeedUp,   // 加速：每一步间隔变短，蛇走得更快
    SpeedDown, // 减速：每一步间隔变长，蛇走得更慢
    Shoot,
}

// 物理按键 -> 方向：方向键、wasd 的同义按键全部集中在这一张表里，
// 不再分散到 keydownHandler / shoot / run 各写一套。
// 这里是 “输入 -> 方向” 这条链路上唯一需要看的地方。
export const KEY_TO_DIRECTION: Record<string, Direction> = {
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

// 物理按键 -> 指令
export const KEY_TO_COMMAND: Record<string, GameCommand> = {
    r: GameCommand.Restart,
    t: GameCommand.PrevStage,
    y: GameCommand.NextStage,
    g: GameCommand.SpeedUp,
    h: GameCommand.SpeedDown,
    f: GameCommand.Shoot,
};

// 这些按键会被阻止默认行为（避免方向键和空格让页面滚动）
const PREVENT_DEFAULT_KEYS = new Set(["arrowup", "arrowdown", "arrowleft", "arrowright", " "]);

// 输入控制器接收方
export interface InputHandlers {
    onDirection: (direction: Direction) => void;
    onCommand: (command: GameCommand) => void;
}

// 输入控制器：只负责把键盘事件翻译成方向或指令，再交给上层处理。
// 它不关心当前能不能掉头、游戏是否结束——那些规则交给 GameControl 决定。
export class InputController {
    private handlers: InputHandlers;

    constructor(handlers: InputHandlers) {
        this.handlers = handlers;
    }

    // 开始监听键盘
    start() {
        document.addEventListener("keydown", this.handleKeydown);
    }

    // 停止监听（重开 / 清理时使用）
    stop() {
        document.removeEventListener("keydown", this.handleKeydown);
    }

    // 用箭头函数保存 this，方便 add/removeEventListener 用同一个引用
    private handleKeydown = (event: KeyboardEvent) => {
        const key = event.key.toLowerCase();

        if (PREVENT_DEFAULT_KEYS.has(key)) {
            event.preventDefault();
        }

        const direction = KEY_TO_DIRECTION[key];
        if (direction !== undefined) {
            this.handlers.onDirection(direction);
            return;
        }

        const command = KEY_TO_COMMAND[key];
        if (command !== undefined) {
            this.handlers.onCommand(command);
        }
    };
}
