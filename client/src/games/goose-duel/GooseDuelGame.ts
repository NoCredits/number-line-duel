import { GooseGameState, GooseCard, GoosePlayer } from '../../../../shared/types/goose-duel.js';
import { GooseUIManager } from './GooseDuelUI.js';

declare const io: any;

export class GooseGameClient {
    private socket: any;
    private ui: GooseUIManager;
    private currentGameState: GooseGameState | null = null;
    private playerId: string = '';
    private gameId: string = '';

    constructor(socket: any, ui: GooseUIManager, gameId: string) {
        this.socket = socket;
        this.ui = ui;
        this.gameId = gameId;
        this.setupSocketListeners();
        this.setupUICallbacks();
    }

    private setupUICallbacks(): void {
        // Wire up UI callbacks
        this.ui.setOnCardPlay((cardId: string) => {
            this.playMovementCard(cardId);
        });

        this.ui.setOnTrapPlace((cardId: string, position: number) => {
            this.placeTrap(cardId, position);
        });

        this.ui.setOnBoostUse((cardId: string, targetPosition?: number) => {
            this.useBoost(cardId, targetPosition);
        });

        this.ui.setOnPowerUpUse((cardId: string, targetPlayerId?: string) => {
            this.usePowerUp(cardId, targetPlayerId);
        });

        this.ui.setOnEndTurn(() => {
            this.endTurn();
        });

        this.ui.setOnSkipTurn(() => {
            this.skipTurn();
        });
    }

    private setupSocketListeners(): void {
        console.log('🎮 GooseGameClient: Setting up socket listeners for gameId:', this.gameId);
        
        this.socket.on('gooseGameState', (gameState: GooseGameState) => {
            console.log('📊 GooseGameClient: Received gooseGameState', gameState.gameStatus);
            this.currentGameState = gameState;
            this.ui.updateGameState(gameState, this.playerId);
        });

        this.socket.on('gooseGameStarted', (gameState: GooseGameState) => {
            console.log('🎮🎮🎮 GooseGameClient: Received gooseGameStarted!', gameState);
            this.currentGameState = gameState;
            console.log('🎮 Calling showGameScreen()...');
            this.ui.showGameScreen();
            console.log('🎮 Calling updateGameState()...');
            this.ui.updateGameState(gameState, this.playerId);
            console.log('🎮 Showing notification...');
            this.ui.showNotification('Game started! 🦢', 'success');
            console.log('🎮 GooseGameStarted handler complete!');
        });

        this.socket.on('gooseActionResult', (data: { success: boolean; message: string; gameState: GooseGameState }) => {
            if (data.success) {
                this.currentGameState = data.gameState;
                this.ui.updateGameState(data.gameState, this.playerId);
                this.ui.showNotification(data.message, 'success');
            } else {
                this.ui.showNotification(data.message, 'error');
            }
        });

        this.socket.on('gooseGameOver', (data: { winnerId: string; winnerName: string }) => {
            const isWinner = data.winnerId === this.playerId;
            this.ui.showGameOver(isWinner, data.winnerName);
        });
    }

    setPlayerId(id: string): void {
        this.playerId = id;
    }

    playMovementCard(cardId: string): void {
        this.socket.emit('goosePlayMovement', { gameId: this.gameId, cardId });
    }

    placeTrap(cardId: string, position: number): void {
        this.socket.emit('goosePlaceTrap', { gameId: this.gameId, cardId, space: position });
    }

    useBoost(cardId: string, targetPosition?: number): void {
        this.socket.emit('gooseUseBoost', { gameId: this.gameId, cardId, targetSpace: targetPosition });
    }

    usePowerUp(cardId: string, targetPlayerId?: string): void {
        this.socket.emit('gooseUsePowerUp', { gameId: this.gameId, cardId, targetPlayerId });
    }

    endTurn(): void {
        this.socket.emit('gooseEndTurn', this.gameId);
    }

    skipTurn(): void {
        console.log('🔄 Emitting skip turn event');
        this.socket.emit('gooseSkipTurn', this.gameId);
    }

    getCurrentPlayer(): GoosePlayer | null {
        if (!this.currentGameState) return null;
        return this.currentGameState.players.find(p => p.id === this.playerId) || null;
    }

    getOpponent(): GoosePlayer | null {
        if (!this.currentGameState) return null;
        return this.currentGameState.players.find(p => p.id !== this.playerId) || null;
    }

    isMyTurn(): boolean {
        if (!this.currentGameState) return false;
        return this.currentGameState.currentPlayerId === this.playerId;
    }
}
