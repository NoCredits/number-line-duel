"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArtilleryGame = void 0;
class ArtilleryGame {
    constructor(gameId, roomId, difficulty = 'medium') {
        this.currentShotId = null;
        this.processedShotIds = new Set();
        this.waitingForTurnEnd = false;
        this.gameId = gameId;
        this.roomId = roomId;
        this.players = new Map();
        this.difficulty = difficulty;
        this.terrain = this.generateTerrain();
        this.vegetation = this.generateVegetation();
        this.clouds = this.generateClouds();
        this.currentPlayerIndex = 0;
        this.wind = this.generateWind();
        this.turnStartTime = Date.now();
        this.turnTimeLimit = 30000; // 30 seconds
        this.playerActivity = {};
        this.gameStatus = 'waiting';
    }
    addPlayer(playerId, playerName) {
        if (this.players.size >= 2)
            return false;
        const isFirstPlayer = this.players.size === 0;
        const x = isFirstPlayer ? 200 : 800;
        const y = this.terrain[x] - 25;
        const player = {
            id: playerId,
            name: playerName,
            health: 100,
            pos: { x, y },
            isActive: true
        };
        this.players.set(playerId, player);
        this.playerActivity[playerId] = {
            lastActivity: Date.now(),
            isActive: false
        };
        if (this.players.size === 2) {
            this.gameStatus = 'active';
        }
        return true;
    }
    removePlayer(playerId) {
        this.players.delete(playerId);
        delete this.playerActivity[playerId];
    }
    getGameState() {
        const playerArray = Array.from(this.players.values());
        return {
            gameId: this.gameId,
            gameStatus: this.gameStatus,
            roomId: this.roomId,
            terrain: this.terrain,
            vegetation: this.vegetation,
            clouds: this.clouds,
            players: playerArray,
            currentPlayerId: playerArray[this.currentPlayerIndex]?.id || '',
            turn: this.currentPlayerIndex === 0 ? 'p1' : 'p2',
            difficulty: this.difficulty,
            wind: this.wind,
            turnStartTime: this.turnStartTime,
            turnTimeLimit: this.turnTimeLimit
        };
    }
    getCurrentPlayer() {
        return Array.from(this.players.values())[this.currentPlayerIndex];
    }
    getOpponent() {
        const opponentIndex = this.currentPlayerIndex === 0 ? 1 : 0;
        return Array.from(this.players.values())[opponentIndex];
    }
    switchTurn() {
        this.currentPlayerIndex = this.currentPlayerIndex === 0 ? 1 : 0;
        this.turnStartTime = Date.now();
        const currentPlayerId = this.getCurrentPlayer().id;
        if (this.playerActivity[currentPlayerId]) {
            this.playerActivity[currentPlayerId].lastActivity = Date.now();
            this.playerActivity[currentPlayerId].isActive = false;
        }
        // Change wind conditions every few turns
        if (Math.random() < 0.4) {
            this.wind = this.generateWind();
        }
        this.waitingForTurnEnd = false;
    }
    applyDamage(playerId, damage) {
        const player = this.players.get(playerId);
        if (!player)
            return false;
        player.health = Math.max(0, player.health - damage);
        if (player.health <= 0) {
            player.isActive = false;
            this.gameStatus = 'finished';
            return true; // Game over
        }
        return false;
    }
    checkGameOver() {
        const players = Array.from(this.players.values());
        const alivePlayers = players.filter(p => p.isActive);
        if (alivePlayers.length === 1) {
            return alivePlayers[0].id;
        }
        return null;
    }
    isTimeUp() {
        const currentPlayerId = this.getCurrentPlayer().id;
        const lastActivity = this.playerActivity[currentPlayerId]?.lastActivity || this.turnStartTime;
        return Date.now() - lastActivity > this.turnTimeLimit;
    }
    updatePlayerActivity(playerId, isActive) {
        if (this.playerActivity[playerId]) {
            this.playerActivity[playerId].lastActivity = Date.now();
            this.playerActivity[playerId].isActive = isActive;
            if (playerId === this.getCurrentPlayer().id && isActive) {
                this.turnStartTime = Date.now();
            }
        }
    }
    pauseTimer() {
        const currentPlayerId = this.getCurrentPlayer().id;
        if (this.playerActivity[currentPlayerId]) {
            this.playerActivity[currentPlayerId].lastActivity = Date.now();
        }
        this.turnStartTime = Date.now();
    }
    updateClouds() {
        if (!this.wind)
            return;
        const windInfluence = 0.3;
        const windSpeedX = Math.cos((this.wind.direction - 90) * Math.PI / 180) * this.wind.speed * windInfluence;
        for (const cloud of this.clouds) {
            cloud.x += cloud.speed + windSpeedX * 0.1;
            if (cloud.x > 1100) {
                cloud.x = -cloud.width - 50;
            }
            else if (cloud.x < -cloud.width - 100) {
                cloud.x = 1100;
            }
        }
    }
    generateWind() {
        const difficultyMultipliers = {
            easy: 0.5,
            medium: 1.0,
            hard: 1.5
        };
        const multiplier = difficultyMultipliers[this.difficulty];
        if (!this.wind) {
            const baseSpeed = Math.random() * 15;
            const speed = baseSpeed * multiplier;
            const direction = 90 + Math.random() * 180;
            return { speed, direction };
        }
        else {
            let baseSpeed = this.wind.speed / multiplier;
            baseSpeed = baseSpeed + (Math.random() - 0.5) * 4;
            let newSpeed = baseSpeed * multiplier;
            let newDirection = this.wind.direction + (Math.random() - 0.5) * 30;
            newSpeed = Math.max(0, Math.min(15 * multiplier, newSpeed));
            newDirection = Math.max(90, Math.min(270, newDirection));
            return { speed: newSpeed, direction: newDirection };
        }
    }
    generateTerrain() {
        const width = 1000;
        const height = 600;
        const terrain = new Array(width);
        const seed = Math.random() * 1000;
        const difficultySettings = {
            easy: { maxPeakHeight: 100, maxVariation: 100 },
            medium: { maxPeakHeight: 200, maxVariation: 150 },
            hard: { maxPeakHeight: 300, maxVariation: 200 }
        };
        const settings = difficultySettings[this.difficulty];
        const baseLevel = height * (0.8 + this.seededRandom(seed) * 0.1);
        const mountainCenter = width / 2 + (this.seededRandom(seed + 50) - 0.5) * 100;
        const peakHeight = 100 + (this.seededRandom(seed) * settings.maxPeakHeight);
        const mountainWidth = 350 + (this.seededRandom(seed + 100) * settings.maxVariation);
        const leftPlatformHeight = 20 + (this.seededRandom(seed + 200) * 40);
        const rightPlatformHeight = 20 + (this.seededRandom(seed + 300) * 40);
        for (let x = 0; x < width; x++) {
            let y = baseLevel;
            const distanceFromCenter = Math.abs(x - mountainCenter);
            const normalizedDistance = distanceFromCenter / (mountainWidth / 2);
            if (normalizedDistance <= 1) {
                const mountainHeight = peakHeight * Math.pow(Math.cos(normalizedDistance * Math.PI / 2), 1.5);
                y -= mountainHeight;
                y += Math.sin(normalizedDistance * Math.PI * 3) * 20 * (1 - normalizedDistance);
                y += Math.cos(normalizedDistance * Math.PI * 5) * 15 * (1 - normalizedDistance);
            }
            const leftInfluence = Math.max(0, 1 - Math.abs(x - 200) / 150);
            const rightInfluence = Math.max(0, 1 - Math.abs(x - 800) / 150);
            y -= leftInfluence * leftPlatformHeight;
            y -= rightInfluence * rightPlatformHeight;
            y += Math.sin(x * 0.008 + seed) * 25;
            y += Math.sin(x * 0.012 + seed * 2) * 18;
            y += Math.cos(x * 0.015 + seed * 3) * 15;
            y += Math.sin(x * 0.025 + seed * 4) * 8;
            y += Math.cos(x * 0.035 + seed * 5) * 6;
            y += (this.seededRandom(x + seed) - 0.5) * 8;
            terrain[x] = Math.max(150, Math.min(height - 50, y));
        }
        for (let smooth = 0; smooth < 2; smooth++) {
            for (let i = 1; i < width - 1; i++) {
                terrain[i] = (terrain[i - 1] + terrain[i] + terrain[i + 1]) / 3;
            }
        }
        return terrain;
    }
    generateVegetation() {
        const vegetation = [];
        for (let x = 50; x < 950; x += 15) {
            const y = this.terrain[x];
            const distanceFromP1 = Math.abs(x - 200);
            const distanceFromP2 = Math.abs(x - 800);
            const distanceFromCenter = Math.abs(x - 500);
            if (y > 350 && distanceFromP1 > 50 && distanceFromP2 > 50 &&
                distanceFromCenter > 100 &&
                (x === 50 || Math.abs(this.terrain[x] - this.terrain[Math.max(0, x - 10)]) < 25)) {
                const actualX = x + (Math.random() - 0.5) * 25;
                const actualY = this.getTerrainHeightAt(Math.floor(actualX));
                const rand = Math.random();
                if (rand > 0.85) {
                    vegetation.push({ x: actualX, y: actualY, type: 'tree', size: 0.8 + Math.random() * 0.4 });
                }
                else if (rand > 0.7) {
                    vegetation.push({ x: actualX, y: actualY, type: 'bush', size: 0.6 + Math.random() * 0.8 });
                }
                else if (rand > 0.5) {
                    vegetation.push({ x: actualX, y: actualY, type: 'rock', size: 0.5 + Math.random() * 1.0 });
                }
                else if (rand > 0.3) {
                    vegetation.push({ x: actualX, y: actualY, type: 'flowers', size: 0.4 + Math.random() * 0.6 });
                }
                else if (rand > 0.1) {
                    vegetation.push({ x: actualX, y: actualY, type: 'grass', size: 0.3 + Math.random() * 0.7 });
                }
                else {
                    vegetation.push({ x: actualX, y: actualY, type: 'stone', size: 0.2 + Math.random() * 0.6 });
                }
            }
        }
        return vegetation;
    }
    generateClouds() {
        const clouds = [];
        const numClouds = 3 + Math.floor(Math.random() * 4);
        for (let i = 0; i < numClouds; i++) {
            clouds.push({
                x: Math.random() * 1200 - 100,
                y: 50 + Math.random() * 150,
                width: 60 + Math.random() * 80,
                height: 30 + Math.random() * 40,
                speed: 0.1 + Math.random() * 0.3,
                opacity: 0.3 + Math.random() * 0.4
            });
        }
        return clouds;
    }
    getTerrainHeightAt(x) {
        x = Math.max(0, Math.min(999, x));
        return this.terrain[Math.floor(x)] || 500;
    }
    seededRandom(seed) {
        const x = Math.sin(seed) * 10000;
        return x - Math.floor(x);
    }
    // Public getters for physics calculations
    getTerrain() {
        return this.terrain;
    }
    getWind() {
        return this.wind;
    }
    setWaitingForTurnEnd(waiting) {
        this.waitingForTurnEnd = waiting;
    }
    isWaitingForTurnEnd() {
        return this.waitingForTurnEnd;
    }
    setCurrentShotId(shotId) {
        this.currentShotId = shotId;
    }
    getCurrentShotId() {
        return this.currentShotId;
    }
    addProcessedShotId(shotId) {
        this.processedShotIds.add(shotId);
    }
    hasProcessedShot(shotId) {
        return this.processedShotIds.has(shotId);
    }
}
exports.ArtilleryGame = ArtilleryGame;
