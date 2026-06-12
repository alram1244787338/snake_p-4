import * as Grid from './Grid';

export class ObstacleManager {
    obstacles: HTMLElement[] = [];
    obstacleCoords: Grid.Point[] = [];
    stageElement: HTMLElement;

    // 出生保护区：左上角起步区域不放障碍物（游戏规则，保留原值）
    static START_SAFE_ZONE = 50;

    constructor() {
        this.stageElement = document.getElementById('stage')!;
    }

    generateObstacles(stage: number) {
        this.clearObstacles();
        const count = stage; // Number of obstacles equals stage number

        for (let i = 0; i < count; i++) {
            const obstacle = document.createElement('div');
            obstacle.className = 'obstacle';
            obstacle.style.width = Grid.CELL_SIZE + 'px';
            obstacle.style.height = Grid.CELL_SIZE + 'px';
            obstacle.style.backgroundColor = 'gray';
            obstacle.style.position = 'absolute';

            // 随机落点由 Grid 统一生成；避让其它障碍物与起步区
            let p: Grid.Point;
            do {
                p = Grid.randomPoint();
            } while (
                Grid.anyContainsPoint(this.obstacleCoords, p.x, p.y) ||
                this.inStartZone(p)
            );

            obstacle.style.left = p.x + 'px';
            obstacle.style.top = p.y + 'px';
            this.stageElement.appendChild(obstacle);
            this.obstacles.push(obstacle);
            this.obstacleCoords.push({ x: p.x, y: p.y });
        }
    }

    // 是否落在左上角起步保护区
    private inStartZone(p: Grid.Point): boolean {
        return p.x < ObstacleManager.START_SAFE_ZONE && p.y < ObstacleManager.START_SAFE_ZONE;
    }

    clearObstacles() {
        this.obstacles.forEach(obs => {
            if (obs.parentNode) obs.parentNode.removeChild(obs);
        });
        this.obstacles = [];
        this.obstacleCoords = [];
    }

    // 某个点是否撞到任意障碍物（统一走 Grid 的占位判定）
    checkCollision(x: number, y: number): boolean {
        return Grid.anyContainsPoint(this.obstacleCoords, x, y);
    }
}
