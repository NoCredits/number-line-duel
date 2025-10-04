export interface Position {
    x: number;
    y: number;
}

export interface TrajectoryPoint {
    x: number;
    y: number;
}

export class Player {
    id: string;
    health: number;
    pos: Position;

    constructor(id: string, startX: number, startY: number = 0) {
        this.id = id;
        this.health = 100;
        this.pos = { x: startX, y: startY };
    }

    takeDamage(damage: number): boolean {
        this.health -= damage;
        return this.health <= 0;
    }

    isAlive(): boolean {
        return this.health > 0;
    }
}

export interface Wind {
    speed: number;
    direction: number;
}

export interface VegetationItem {
    x: number;
    y: number;
    type: 'tree' | 'bush' | 'rock' | 'flowers' | 'grass' | 'stone';
    size?: number;
}

export interface Cloud {
    x: number;
    y: number;
    width: number;
    height: number;
    speed: number;
    opacity: number;
}

export class ArtilleryGame {
    roomId: string;
    terrain: number[];
    vegetation: VegetationItem[];
    clouds: Cloud[];
    players: { p1: Player; p2: Player };
    turn: 'p1' | 'p2';
    isActive: boolean;
    waitingForTurnEnd: boolean = false;
    wind: Wind;
    turnStartTime: number;
    turnTimeLimit: number;
    playerActivity: { [key: string]: { lastActivity: number; isActive: boolean } };
    currentShotId: string | null = null;
    processedShotIds: Set<string> = new Set();
    private readonly CANVAS_WIDTH = 1000;
    private readonly CANVAS_HEIGHT = 600;
    private readonly GRAVITY = 0.5;

    constructor(roomId: string, player1Id: string, player2Id: string) {
        this.roomId = roomId;
        this.terrain = this.generateTerrain();
        this.vegetation = this.generateVegetation();
        this.clouds = this.generateClouds();
        
        const p1X = 200;
        const p2X = 800;
        const p1Y = this.terrain[p1X] - 25;
        const p2Y = this.terrain[p2X] - 25;
        
        this.players = {
            p1: new Player(player1Id, p1X, p1Y),
            p2: new Player(player2Id, p2X, p2Y)
        };
        this.turn = 'p1';
        this.isActive = true;
        this.wind = this.generateWind();
        
        this.turnTimeLimit = 30000;
        this.turnStartTime = Date.now();
        this.playerActivity = {
            [player1Id]: { lastActivity: Date.now(), isActive: false },
            [player2Id]: { lastActivity: Date.now(), isActive: false }
        };
    }

    private generateWind(): Wind {
        if (!this.wind) {
            const speed = Math.random() * 10 - 5;
            const direction = 90 + Math.random() * 180;
            return { speed, direction };
        } else {
            let speed = this.wind.speed + (Math.random() * 2 - 1);
            speed = Math.max(-10, Math.min(10, speed));
            let direction = this.wind.direction + (Math.random() * 20 - 10);
            direction = Math.max(90, Math.min(270, direction));
            return { speed, direction };
        }
    }

    private generateTerrain(): number[] {
        const width = this.CANVAS_WIDTH;
        const height = this.CANVAS_HEIGHT;
        const terrain = new Array(width);
        
        const seed = Math.random() * 1000;
        const baseLevel = height * (0.8 + this.seededRandom(seed) * 0.1);
        const mountainCenter = width / 2 + (this.seededRandom(seed + 50) - 0.5) * 100;
        const peakHeight = 100 + (this.seededRandom(seed) * 200);
        const mountainWidth = 350 + (this.seededRandom(seed + 100) * 150);
        
        const leftPlatformHeight = 20 + (this.seededRandom(seed + 200) * 40);
        const rightPlatformHeight = 20 + (this.seededRandom(seed + 300) * 40);
        
        for (let x = 0; x < width; x++) {
            const distFromCenter = Math.abs(x - mountainCenter);
            
            if (distFromCenter < mountainWidth / 2) {
                const mountainFactor = 1 - (distFromCenter / (mountainWidth / 2));
                const smoothMountain = this.smoothStep(0, 1, mountainFactor);
                terrain[x] = baseLevel - (smoothMountain * peakHeight);
            } else {
                terrain[x] = baseLevel;
            }
            
            if (x < 250) {
                const leftFactor = x / 250;
                const smoothLeft = this.smoothStep(0, 1, leftFactor);
                terrain[x] = baseLevel - (smoothLeft * leftPlatformHeight);
            }
            
            if (x > 750) {
                const rightFactor = (width - x) / 250;
                const smoothRight = this.smoothStep(0, 1, rightFactor);
                terrain[x] = baseLevel - (smoothRight * rightPlatformHeight);
            }
            
            if (x % 50 === 0) {
                const noise = (this.seededRandom(seed + x) - 0.5) * 15;
                terrain[x] += noise;
            }
        }
        
        for (let smooth = 0; smooth < 2; smooth++) {
            for (let x = 1; x < width - 1; x++) {
                terrain[x] = (terrain[x - 1] + terrain[x] + terrain[x + 1]) / 3;
            }
        }
        
        return terrain;
    }

    private smoothStep(edge0: number, edge1: number, x: number): number {
        const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
        return t * t * (3 - 2 * t);
    }

    private seededRandom(seed: number): number {
        const x = Math.sin(seed) * 10000;
        return x - Math.floor(x);
    }

    private generateVegetation(): VegetationItem[] {
        const vegetation: VegetationItem[] = [];
        
        for (let x = 50; x < 950; x += 15) {
            if (Math.random() < 0.3) {
                const terrainY = this.terrain[x];
                if (terrainY < this.CANVAS_HEIGHT - 50) {
                    const types: ('tree' | 'bush' | 'rock' | 'grass')[] = ['tree', 'bush', 'rock', 'grass'];
                    const type = types[Math.floor(Math.random() * types.length)];
                    const size = 0.8 + Math.random() * 0.4;
                    vegetation.push({ x, y: terrainY, type, size });
                }
            }
        }
        
        return vegetation;
    }

    private generateClouds(): Cloud[] {
        const clouds: Cloud[] = [];
        const numClouds = 3 + Math.floor(Math.random() * 4);
        
        for (let i = 0; i < numClouds; i++) {
            clouds.push({
                x: Math.random() * this.CANVAS_WIDTH,
                y: 50 + Math.random() * 150,
                width: 30 + Math.random() * 40,
                height: 15 + Math.random() * 15,
                speed: 0.2 + Math.random() * 0.3,
                opacity: 0.3 + Math.random() * 0.4
            });
        }
        
        return clouds;
    }

    getGameState() {
        return {
            roomId: this.roomId,
            players: this.players,
            terrain: this.terrain,
            vegetation: this.vegetation,
            clouds: this.clouds,
            wind: this.wind,
            turn: this.turn,
            isActive: this.isActive
        };
    }

    calculateTrajectory(angle: number, power: number, startX: number, startY: number, isPlayer1: boolean): TrajectoryPoint[] {
        const trajectory: TrajectoryPoint[] = [];
        const adjustedAngle = isPlayer1 ? angle : (180 - angle);
        const radians = (adjustedAngle * Math.PI) / 180;
        const velocityX = Math.cos(radians) * power * 2;
        const velocityY = -Math.sin(radians) * power * 2;
        
        const windRad = this.wind.direction * Math.PI / 180;
        const windVx = Math.cos(windRad) * this.wind.speed * 0.3;
        const windVy = -Math.sin(windRad) * this.wind.speed * 0.1;
        
        let t = 0;
        const TIME_STEP = 0.1;
        
        while (true) {
            t += TIME_STEP;
            
            const x = startX + velocityX * t + windVx * t * t;
            const y = startY + velocityY * t + 0.5 * this.GRAVITY * t * t + windVy * t * t;
            
            if (x >= this.CANVAS_WIDTH || x < 0 || y >= this.CANVAS_HEIGHT) {
                break;
            }
            
            if (x >= 0 && x < this.terrain.length && y >= this.terrain[Math.floor(x)]) {
                trajectory.push({ x: Math.round(x), y: Math.round(y) });
                break;
            }
            
            trajectory.push({ x: Math.round(x), y: Math.round(y) });
        }
        
        return trajectory;
    }

    checkHit(trajectory: TrajectoryPoint[]): 'p1' | 'p2' | null {
        const targetSize = 30;
        const lastPoint = trajectory[trajectory.length - 1];
        
        for (const key of ['p1', 'p2'] as const) {
            const player = this.players[key];
            const terrainY = this.terrain[Math.floor(player.pos.x)] || 500;
            const tankY = terrainY - 30;
            const tankCenterY = tankY + 15;
            
            const dx = lastPoint.x - player.pos.x;
            const dy = lastPoint.y - tankCenterY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < targetSize) {
                return key;
            }
        }
        
        return null;
    }

    applyDamage(playerId: 'p1' | 'p2', damage: number = 20): void {
        const player = this.players[playerId];
        if (!player) return;

        player.health = Math.max(0, player.health - damage);

        if (player.health <= 0) {
            this.isActive = false;
        }
    }

    nextTurn(): void {
        this.turn = this.turn === 'p1' ? 'p2' : 'p1';
        this.turnStartTime = Date.now();
        const currentPlayerId = this.getCurrentPlayer().id;
        if (this.playerActivity[currentPlayerId]) {
            this.playerActivity[currentPlayerId].lastActivity = Date.now();
        }
        
        if (Math.random() < 0.4) {
            this.wind = this.generateWind();
        }
    }

    getCurrentPlayer(): Player {
        return this.players[this.turn];
    }

    getOpponent(): Player {
        return this.players[this.turn === 'p1' ? 'p2' : 'p1'];
    }

    checkGameOver(): 'p1' | 'p2' | null {
        if (!this.players.p1.isAlive()) return 'p2';
        if (!this.players.p2.isAlive()) return 'p1';
        return null;
    }

    getWind(): Wind {
        return this.wind;
    }

    getTurn(): 'p1' | 'p2' {
        return this.turn;
    }

    isGameOver(): boolean {
        return !this.isActive || !this.players.p1.isAlive() || !this.players.p2.isAlive();
    }

    getWinner(): { id: string } | null {
        if (this.isGameOver()) {
            if (!this.players.p1.isAlive()) return { id: this.players.p2.id };
            if (!this.players.p2.isAlive()) return { id: this.players.p1.id };
        }
        return null;
    }

    getPlayerPosition(socketId: string): Position | null {
        if (this.players.p1.id === socketId) return this.players.p1.pos;
        if (this.players.p2.id === socketId) return this.players.p2.pos;
        return null;
    }

    getPlayerKey(socketId: string): 'p1' | 'p2' | null {
        if (this.players.p1.id === socketId) return 'p1';
        if (this.players.p2.id === socketId) return 'p2';
        return null;
    }

    updatePlayerActivity(playerId: string, isActive: boolean): void {
        if (this.playerActivity[playerId]) {
            this.playerActivity[playerId].isActive = isActive;
            if (isActive) {
                this.playerActivity[playerId].lastActivity = Date.now();
            }
        }
    }

    pauseTimer(): void {
        const currentPlayerId = this.getCurrentPlayer().id;
        if (this.playerActivity[currentPlayerId]) {
            this.playerActivity[currentPlayerId].lastActivity = Date.now();
        }
        this.turnStartTime = Date.now();
    }
}
