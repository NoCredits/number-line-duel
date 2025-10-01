import { GameState, Card } from '../../shared/types';
import { UIManager } from './ui';
import { GameClient } from './game';

// Use global io from socket.io script
declare const io: any;
declare const window: any;

class NumberLineDuelClient {
    private socket: any;
    private ui: UIManager;
    private game: GameClient;
    private currentGameId: string = '';

    constructor() {
        // Use dynamic socket URL from global variable, fallback to localhost
        const socketUrl = window.SOCKET_URL || 'http://localhost:3001';
        this.socket = io(socketUrl);
        this.ui = new UIManager();
        this.game = new GameClient(this.socket, this.ui);
        
        this.initializeEventListeners();
        this.setupSocketListeners();
    }

    private initializeEventListeners(): void {
        // Lobby events
        document.getElementById('createGame')!.addEventListener('click', () => this.createGame());
        document.getElementById('joinGame')!.addEventListener('click', () => this.joinGame());
        document.getElementById('playAgain')!.addEventListener('click', () => this.playAgain());

        // Enter key support
        document.getElementById('playerName')!.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.createGame();
        });
        document.getElementById('gameCode')!.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.joinGame();
        });
    }

    private setupSocketListeners(): void {
        this.socket.on('gameCreated', (data: { gameId: string; gameState: GameState }) => {
            this.currentGameId = data.gameId;
            this.game.setGameId(data.gameId);
            this.ui.showWaitingRoom(data.gameId);
        });

        this.socket.on('gameStateUpdate', (gameState: GameState) => {
            this.game.updateGameState(gameState);
        });

        this.socket.on('error', (message: string) => {
            alert('Error: ' + message);
        });
    }

    private createGame(): void {
        const playerName = (document.getElementById('playerName') as HTMLInputElement).value.trim();
        if (!playerName) {
            alert('Please enter your name');
            return;
        }
        this.socket.emit('createGame', playerName);
    }

    private joinGame(): void {
        const playerName = (document.getElementById('playerName') as HTMLInputElement).value.trim();
        const gameCode = (document.getElementById('gameCode') as HTMLInputElement).value.trim().toUpperCase();
        
        if (!playerName || !gameCode) {
            alert('Please enter both your name and game code');
            return;
        }
        
        this.socket.emit('joinGame', gameCode, playerName);
        this.currentGameId = gameCode;
        this.game.setGameId(gameCode);
    }

    private playAgain(): void {
        this.ui.showLobby();
        (document.getElementById('playerName') as HTMLInputElement).value = '';
        (document.getElementById('gameCode') as HTMLInputElement).value = '';
    }
}

// Start the client immediately or when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new NumberLineDuelClient();
    });
} else {
    // DOM is already ready
    new NumberLineDuelClient();
}