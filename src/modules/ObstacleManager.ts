import { GRID_COUNT } from "./constants";

export class ObstacleManager {
    obstacles: HTMLElement[] = [];
    obstacleCoords: { x: number; y: number }[] = [];
    stageElement: HTMLElement;

    constructor() {
        this.stageElement = document.getElementById('stage')!;
    }

    generateObstacles(stage: number) {
        this.clearObstacles();
        const count = stage; // 障碍物数量 = 关卡数

        for (let i = 0; i < count; i++) {
            const obstacle = document.createElement('div');
            obstacle.className = 'obstacle';
            obstacle.style.width = '10px';
            obstacle.style.height = '10px';
            obstacle.style.backgroundColor = 'gray';
            obstacle.style.position = 'absolute';

            let x = 0;
            let y = 0;
            let overlap = true;

            while (overlap) {
                x = Math.round(Math.random() * (GRID_COUNT - 1)) * 10;
                y = Math.round(Math.random() * (GRID_COUNT - 1)) * 10;
                overlap = this.obstacleCoords.some(coord => coord.x === x && coord.y === y);
                // 避开左上角起始区域
                if (x < 50 && y < 50) overlap = true;
            }

            obstacle.style.left = x + 'px';
            obstacle.style.top = y + 'px';
            this.stageElement.appendChild(obstacle);
            this.obstacles.push(obstacle);
            this.obstacleCoords.push({ x, y });
        }
    }

    clearObstacles() {
        this.obstacles.forEach(obs => {
            if (obs.parentNode) obs.parentNode.removeChild(obs);
        });
        this.obstacles = [];
        this.obstacleCoords = [];
    }

    checkCollision(x: number, y: number): boolean {
        return this.obstacleCoords.some(coord => coord.x === x && coord.y === y);
    }
}
