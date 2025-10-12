import { ArtilleryGameState, FireData, TrajectoryPoint, Position } from '../../../../shared/types/artillery-duel.js';
import { ArtilleryUIManager } from './ArtilleryUI.js';

declare const io: any;

export class ArtilleryGameClient {
    private socket: any;
    private ui: ArtilleryUIManager;
    private currentGameState: ArtilleryGameState | null = null;
    private playerId: string = '';
    private gameId: string = '';

    constructor(socket: any, ui: ArtilleryUIManager, gameId: string) {
        this.socket = socket;
        this.ui = ui;
        this.gameId = gameId;
        this.setupSocketListeners();
        this.setupUICallbacks();
    }

    private setupUICallbacks(): void {
        this.ui.setOnFire((angle: number, power: number) => {
            this.fire(angle, power);
        });

        this.ui.setOnJoinQueue((difficulty: 'easy' | 'medium' | 'hard') => {
            this.joinQueue(difficulty);
        });
    }

    private setupSocketListeners(): void {
        console.log('🎯 ArtilleryGameClient: Setting up socket listeners for gameId:', this.gameId);

        this.socket.on('artilleryGameState', (gameState: ArtilleryGameState) => {
            console.log('📊 ArtilleryGameClient: Received artilleryGameState', gameState.gameStatus);
            this.currentGameState = gameState;
            this.ui.updateGameState(gameState, this.playerId);
        });

        this.socket.on('artilleryMatchFound', (data: { roomId: string; state: ArtilleryGameState }) => {
            console.log('🎮 ArtilleryGameClient: Match found!', data);
            this.gameId = data.roomId;
            this.currentGameState = data.state;
            this.ui.showGameScreen();
            this.ui.updateGameState(data.state, this.playerId);
            this.ui.showNotification('Match found! Game starting...', 'success');
        });

        this.socket.on('artilleryShotFired', (data: { 
            trajectory: TrajectoryPoint[]; 
            shooter: 'p1' | 'p2';
            shooterId: string;
            shotId: string;
            angle: number;
            power: number;
        }) => {
            console.log('💥 Shot fired by:', data.shooter);
            this.ui.animateTrajectory(data.trajectory, () => {
                // After animation, check for hit
                this.checkHit(data);
            });
        });

        this.socket.on('artilleryHit', (data: { 
            victim: 'p1' | 'p2'; 
            damage: number; 
            health: number;
            isDead: boolean;
        }) => {
            console.log('🎯 Hit confirmed!', data);
            if (this.currentGameState) {
                const victimPlayer = this.currentGameState.players.find(p => 
                    (data.victim === 'p1' && p.id === this.currentGameState!.players[0].id) ||
                    (data.victim === 'p2' && p.id === this.currentGameState!.players[1].id)
                );
                if (victimPlayer) {
                    victimPlayer.health = data.health;
                }
                this.ui.updateGameState(this.currentGameState, this.playerId);
            }
            this.ui.showNotification(`Hit! -${data.damage} damage`, 'success');
        });

        this.socket.on('artilleryTurnChanged', (data: { 
            turn: 'p1' | 'p2';
            windChanged: boolean;
            newWind: any;
        }) => {
            console.log('🔄 Turn changed to:', data.turn);
            if (this.currentGameState) {
                this.currentGameState.turn = data.turn;
                if (data.windChanged && data.newWind) {
                    this.currentGameState.wind = data.newWind;
                }
                this.ui.updateGameState(this.currentGameState, this.playerId);
            }
        });

        this.socket.on('artilleryGameOver', (data: { winner: string; reason: string }) => {
            console.log('🏆 Game over!', data);
            const isWinner = data.winner === (this.currentGameState?.turn === 'p1' ? 'p1' : 'p2');
            this.ui.showGameOver(isWinner, data.reason);
        });

        this.socket.on('artilleryQueueJoined', (data: { 
            position: number;
            difficulty: string;
            queueLengths: any;
            message: string;
        }) => {
            console.log('⏳ Joined queue:', data);
            this.ui.showNotification(data.message, 'info');
        });

        this.socket.on('error', (data: { message: string }) => {
            console.error('❌ Error:', data.message);
            this.ui.showNotification(data.message, 'error');
        });
    }

    setPlayerId(id: string): void {
        this.playerId = id;
    }

    joinQueue(difficulty: 'easy' | 'medium' | 'hard' = 'medium'): void {
        console.log('🔍 Joining queue with difficulty:', difficulty);
        this.socket.emit('artilleryJoinQueue', { difficulty });
    }

    fire(angle: number, power: number): void {
        if (!this.canFire()) {
            this.ui.showNotification('Cannot fire: Not your turn or invalid state', 'error');
            return;
        }

        const fireData: FireData = {
            gameId: this.gameId,
            angle,
            power
        };

        console.log('🔫 Firing:', fireData);
        this.socket.emit('artilleryFire', fireData);
    }

    private canFire(): boolean {
        if (!this.currentGameState || this.currentGameState.gameStatus !== 'active') {
            return false;
        }

        return this.isMyTurn();
    }

    private checkHit(data: any): void {
        if (!this.currentGameState) return;

        // Simple hit detection on client side
        const trajectory = data.trajectory;
        const terrain = this.currentGameState.terrain;
        const opponent = this.getOpponent();
        
        if (!opponent) return;

        // Check if trajectory hit the opponent
        let hit = false;
        const targetSize = 30;

        for (const point of trajectory) {
            const terrainY = terrain[Math.floor(opponent.pos.x)] || 500;
            const tankY = terrainY - 30;
            const tankCenterY = tankY + 15;

            if (Math.abs(point.x - opponent.pos.x) < targetSize && 
                Math.abs(point.y - tankCenterY) < targetSize) {
                hit = true;
                break;
            }
        }

        if (hit) {
            const damage = 20;
            const newHealth = Math.max(0, opponent.health - damage);
            
            // Notify server of hit
            this.socket.emit('artilleryHitConfirmed', {
                roomId: this.gameId,
                victim: opponent.id === this.currentGameState.players[0].id ? 'p1' : 'p2',
                damage: damage,
                health: newHealth,
                shotId: data.shotId
            });
        } else {
            // Notify server of miss
            this.socket.emit('artilleryMissConfirmed', {
                roomId: this.gameId,
                shotId: data.shotId
            });
        }
    }

    getCurrentPlayer() {
        if (!this.currentGameState) return null;
        return this.currentGameState.players.find(p => p.id === this.playerId) || null;
    }

    getOpponent() {
        if (!this.currentGameState) return null;
        return this.currentGameState.players.find(p => p.id !== this.playerId) || null;
    }

    isMyTurn(): boolean {
        if (!this.currentGameState) return false;
        const currentPlayerIndex = this.currentGameState.turn === 'p1' ? 0 : 1;
        return this.currentGameState.players[currentPlayerIndex]?.id === this.playerId;
    }
}
