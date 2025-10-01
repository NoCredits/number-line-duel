import { UIManager } from './ui';
import { GameClient } from './game';
class NumberLineDuelClient {
    constructor() {
        this.currentGameId = '';
        // Use dynamic socket URL from global variable, fallback to localhost
        const socketUrl = window.SOCKET_URL || 'http://localhost:3001';
        this.socket = io(socketUrl);
        this.ui = new UIManager();
        this.game = new GameClient(this.socket, this.ui);
        this.initializeEventListeners();
        this.setupSocketListeners();
    }
    initializeEventListeners() {
        // Lobby events
        document.getElementById('createGame').addEventListener('click', () => this.createGame());
        document.getElementById('joinGame').addEventListener('click', () => this.joinGame());
        document.getElementById('playAgain').addEventListener('click', () => this.playAgain());
        // Enter key support
        document.getElementById('playerName').addEventListener('keypress', (e) => {
            if (e.key === 'Enter')
                this.createGame();
        });
        document.getElementById('gameCode').addEventListener('keypress', (e) => {
            if (e.key === 'Enter')
                this.joinGame();
        });
    }
    setupSocketListeners() {
        this.socket.on('gameCreated', (data) => {
            this.currentGameId = data.gameId;
            this.game.setGameId(data.gameId);
            this.ui.showWaitingRoom(data.gameId);
        });
        this.socket.on('gameStateUpdate', (gameState) => {
            this.game.updateGameState(gameState);
        });
        this.socket.on('error', (message) => {
            alert('Error: ' + message);
        });
    }
    createGame() {
        const playerName = document.getElementById('playerName').value.trim();
        if (!playerName) {
            alert('Please enter your name');
            return;
        }
        this.socket.emit('createGame', playerName);
    }
    joinGame() {
        const playerName = document.getElementById('playerName').value.trim();
        const gameCode = document.getElementById('gameCode').value.trim().toUpperCase();
        if (!playerName || !gameCode) {
            alert('Please enter both your name and game code');
            return;
        }
        this.socket.emit('joinGame', gameCode, playerName);
        this.currentGameId = gameCode;
        this.game.setGameId(gameCode);
    }
    playAgain() {
        this.ui.showLobby();
        document.getElementById('playerName').value = '';
        document.getElementById('gameCode').value = '';
    }
}
// Start the client immediately or when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new NumberLineDuelClient();
    });
}
else {
    // DOM is already ready
    new NumberLineDuelClient();
}
//# sourceMappingURL=client.js.map