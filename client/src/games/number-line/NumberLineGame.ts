import { GameState, Card as CardType } from '../../../../shared/types/common.js';
import { UIManager } from './NumberLineUI.js';

export class GameClient {
    private currentGameState?: GameState;
    private playerId: string;
    private currentGameId: string = '';

    constructor(
        private socket: any,
        private ui: UIManager
    ) {
        this.playerId = socket.id || '';
        this.setupCardEventListeners();
        
        // Update playerId when socket connects
        socket.on('connect', () => {
            this.playerId = socket.id || '';
        });
    }

    setGameId(gameId: string): void {
        this.currentGameId = gameId;
    }

    updateGameState(gameState: GameState): void {
        this.currentGameState = gameState;
        this.ui.updateGameState(gameState, this.playerId);
        
        if (gameState.gameStatus === 'finished') {
            this.ui.showGameOver(gameState.winnerId === this.playerId);
        }
    }

    private setupCardEventListeners(): void {
        // Central row card clicks (drafting)
        this.ui.onCentralCardClick((cardId: string) => {
            if (!this.currentGameState || this.currentGameState.currentPlayerId !== this.playerId) return;
            
            this.socket.emit('draftCard', {
                gameId: this.currentGameId,
                cardId: cardId
            });
        });

        // Hand card clicks (playing)
        this.ui.onHandCardClick((cardId: string) => {
            if (!this.currentGameState || this.currentGameState.currentPlayerId !== this.playerId) return;
            
            this.socket.emit('playCard', {
                gameId: this.currentGameId,
                cardId: cardId
            });
        });
    }
}