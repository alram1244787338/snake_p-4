import { GRID_SIZE, findEmptyPosition, Position, Rect } from './GridSystem';
import { entityRegistry } from './EntityRegistry';

/** 蛇的出生区域（左上角），障碍物不应刷在这里 */
const SPAWN_EXCLUDE: Rect = { x: 0, y: 0, width: 50, height: 50 };

export class ObstacleManager {
    obstacles: HTMLElement[] = [];
    obstacleCoords: Position[] = [];
    stageElement: HTMLElement;

    constructor() {
        this.stageElement = document.getElementById('stage')!;
    }

    generateObstacles(stage: number) {
        this.clearObstacles();
        const count = stage; // Number of obstacles equals stage number

        for (let i = 0; i < count; i++) {
            // 使用 GridSystem 的统一位置生成，自动避开已有障碍物和出生区
            const pos = findEmptyPosition(
                this.obstacleCoords,
                GRID_SIZE,
                GRID_SIZE,
                SPAWN_EXCLUDE,
            );

            const obstacle = document.createElement('div');
            obstacle.className = 'obstacle';
            obstacle.style.width = GRID_SIZE + 'px';
            obstacle.style.height = GRID_SIZE + 'px';
            obstacle.style.backgroundColor = 'gray';
            obstacle.style.position = 'absolute';
            obstacle.style.left = pos.x + 'px';
            obstacle.style.top = pos.y + 'px';

            this.stageElement.appendChild(obstacle);
            this.obstacles.push(obstacle);
            this.obstacleCoords.push(pos);

            // 注册到实体系统，供统一碰撞查询使用
            entityRegistry.register({
                id: 'obstacle_' + stage + '_' + i,
                type: 'obstacle',
                x: pos.x,
                y: pos.y,
                width: GRID_SIZE,
                height: GRID_SIZE,
            });
        }
    }

    clearObstacles() {
        this.obstacles.forEach(obs => {
            if (obs.parentNode) obs.parentNode.removeChild(obs);
        });
        this.obstacles = [];
        this.obstacleCoords = [];

        // 从实体系统批量注销障碍物
        entityRegistry.clearByType('obstacle');
    }

    /**
     * 检查指定坐标是否与某个障碍物重叠。
     * 保留此方法以兼容旧调用方式，内部实现改为查 EntityRegistry。
     */
    checkCollision(x: number, y: number): boolean {
        return entityRegistry.checkGridCell(x, y, ['obstacle']) !== null;
    }
}
