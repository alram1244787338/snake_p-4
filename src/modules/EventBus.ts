/**
 * 轻量事件总线 —— 游戏状态与表现层之间的唯一通信通道。
 * 所有状态变更通过事件发布，UI / 音效 / 粒子各自订阅，互不直接引用。
 */

export interface GameEvents {
  // 分数 & 关卡
  'score:update':    { score: number };
  'stage:update':    { stage: number };

  // 食物
  'food:eaten':      { x: number; y: number };

  // Boss
  'boss:hit':        { x: number; y: number };
  'boss:killed':     { x: number; y: number; bonus: number };

  // 生命周期
  'game:over':       { reason: string; score: number; stage: number };
  'game:restart':    {};
  'stage:reset':     { stage: number };
}

type EventName = keyof GameEvents;
type Handler<T> = (payload: T) => void;

export class EventBus {
  private listeners = new Map<EventName, Set<Handler<any>>>();

  on<T extends EventName>(event: T, handler: Handler<GameEvents[T]>) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);
  }

  off<T extends EventName>(event: T, handler: Handler<GameEvents[T]>) {
    this.listeners.get(event)?.delete(handler);
  }

  emit<T extends EventName>(event: T, payload: GameEvents[T]) {
    this.listeners.get(event)?.forEach(fn => {
      try { fn(payload); } catch (e) { console.error(`[EventBus] handler error on "${event}":`, e); }
    });
  }

  /** 清除所有监听器（用于完整重置） */
  clear() {
    this.listeners.clear();
  }
}

/** 全局单例 */
export const eventBus = new EventBus();
