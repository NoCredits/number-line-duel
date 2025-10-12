/**
 * Artillery Duel - Shared Type Definitions
 * 
 * Physics-based artillery game where players take turns firing projectiles
 * at each other across varied terrain with wind effects.
 */

export interface Position {
    x: number;
    y: number;
}

export interface TrajectoryPoint {
    x: number;
    y: number;
}

export interface Wind {
    speed: number;        // Wind speed (0-15, affects horizontal velocity)
    direction: number;    // Wind direction in degrees (90-270, horizontal wind only)
}

export interface VegetationItem {
    x: number;
    y: number;
    type: 'tree' | 'bush' | 'rock' | 'flowers' | 'grass' | 'stone';
    size?: number;        // Optional size modifier for variety
}

export interface Cloud {
    x: number;
    y: number;
    width: number;
    height: number;
    speed: number;        // How fast the cloud moves
    opacity: number;      // For variation in cloud density
}

export interface ArtilleryPlayer {
    id: string;
    name: string;
    health: number;
    pos: Position;
    isActive: boolean;
}

export interface ArtilleryGameState {
    gameId: string;
    gameStatus: 'waiting' | 'active' | 'finished';
    roomId: string;
    terrain: number[];
    vegetation: VegetationItem[];
    clouds: Cloud[];
    players: ArtilleryPlayer[];
    currentPlayerId: string;
    turn: 'p1' | 'p2';
    difficulty: 'easy' | 'medium' | 'hard';
    wind: Wind;
    turnStartTime: number;
    turnTimeLimit: number;
}

export interface FireData {
    gameId: string;
    angle: number;
    power: number;
}

export interface ShotResult {
    trajectory: TrajectoryPoint[];
    hit: boolean;
    damage?: number;
    newHealth?: number;
}

export interface GameStats {
    activeGames: number;
    waitingPlayers: number;
    queueLengths: {
        easy: number;
        medium: number;
        hard: number;
    };
}
