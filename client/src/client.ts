import { GameState, Card, ChatMessage, GameListing } from '../../shared/types';
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
    private playerName: string = '';
    private isChatMinimized: boolean = true;

    constructor() {
        // Use dynamic socket URL from global variable, fallback to localhost
        const socketUrl = window.SOCKET_URL || 'http://localhost:3001';
        this.socket = io(socketUrl);
        this.ui = new UIManager();
        this.game = new GameClient(this.socket, this.ui);
        
        this.initializeEventListeners();
        this.setupSocketListeners();
        this.setupChatListeners();
        this.requestGamesList();
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
        document.getElementById('joinPlayerName')!.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.joinGame();
        });
        document.getElementById('gameCode')!.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.joinGame();
        });
    }

    private setupChatListeners(): void {
        const chatToggle = document.getElementById('chatToggle')!;
        const chatHeader = document.getElementById('chatHeader')!;
        const chatContainer = document.getElementById('chatContainer')!;

        const toggleChat = () => {
            this.isChatMinimized = !this.isChatMinimized;
            chatContainer.classList.toggle('minimized');
            chatToggle.textContent = this.isChatMinimized ? '▼' : '▲';
        };

        chatToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleChat();
        });

        chatHeader.addEventListener('click', toggleChat);

        // Quick message buttons
        document.querySelectorAll('.quick-msg-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const message = (btn as HTMLElement).dataset.msg;
                if (message && this.currentGameId) {
                    this.socket.emit('chatMessage', {
                        gameId: this.currentGameId,
                        message: message
                    });
                }
            });
        });
    }

    private requestGamesList(): void {
        // Request games list every 3 seconds when in lobby
        setInterval(() => {
            if (document.getElementById('lobby')?.classList.contains('active')) {
                this.socket.emit('requestGamesList');
            }
        }, 3000);
        
        // Request immediately on load
        this.socket.emit('requestGamesList');
    }

    private setupSocketListeners(): void {
        this.socket.on('gameCreated', (data: { gameId: string; gameState: GameState }) => {
            this.currentGameId = data.gameId;
            this.game.setGameId(data.gameId);
            this.ui.showWaitingRoom(data.gameId);
        });

        this.socket.on('gameStateUpdate', (gameState: GameState) => {
            this.game.updateGameState(gameState);
            this.ui.updatePlayerNames(gameState, this.socket.id);
        });

        this.socket.on('gamesList', (games: GameListing[]) => {
            this.displayGamesList(games);
        });

        this.socket.on('chatMessage', (data: ChatMessage) => {
            this.displayChatMessage(data);
        });

        this.socket.on('error', (message: string) => {
            alert('Error: ' + message);
        });
    }

    private displayGamesList(games: GameListing[]): void {
        const gamesListElement = document.getElementById('gamesList')!;
        
        if (games.length === 0) {
            gamesListElement.innerHTML = '<div class="no-games">No games waiting for players</div>';
            return;
        }

        gamesListElement.innerHTML = games.map(game => `
            <div class="game-item" data-game-id="${game.gameId}">
                <div class="game-item-info">
                    <div class="game-code">${game.gameId}</div>
                    <div class="player-name-display">👤 ${game.playerName}</div>
                </div>
                <button class="join-btn" onclick="window.joinGameById('${game.gameId}')">Join</button>
            </div>
        `).join('');
    }

    private displayChatMessage(data: ChatMessage): void {
        const messagesContainer = document.getElementById('chatMessages')!;
        const isOwn = data.playerId === this.socket.id;
        
        const messageElement = document.createElement('div');
        messageElement.className = `chat-message ${isOwn ? 'own' : 'opponent'}`;
        messageElement.innerHTML = `
            <div class="sender">${data.playerName}</div>
            <div class="text">${data.message}</div>
        `;
        
        messagesContainer.appendChild(messageElement);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        // Auto-expand chat when message received
        if (this.isChatMinimized && !isOwn) {
            const chatContainer = document.getElementById('chatContainer')!;
            const chatToggle = document.getElementById('chatToggle')!;
            chatContainer.classList.remove('minimized');
            chatToggle.textContent = '▲';
            this.isChatMinimized = false;
        }
    }

    private createGame(): void {
        const playerName = (document.getElementById('playerName') as HTMLInputElement).value.trim();
        if (!playerName) {
            alert('Please enter your name');
            return;
        }
        this.playerName = playerName;
        this.socket.emit('createGame', playerName);
    }

    private joinGame(): void {
        const playerName = (document.getElementById('joinPlayerName') as HTMLInputElement).value.trim();
        const gameCode = (document.getElementById('gameCode') as HTMLInputElement).value.trim().toUpperCase();
        
        if (!playerName || !gameCode) {
            alert('Please enter both your name and game code');
            return;
        }
        
        this.playerName = playerName;
        this.socket.emit('joinGame', gameCode, playerName);
        this.currentGameId = gameCode;
        this.game.setGameId(gameCode);
    }

    private joinGameById(gameId: string): void {
        const playerName = (document.getElementById('joinPlayerName') as HTMLInputElement).value.trim();
        
        if (!playerName) {
            alert('Please enter your name first');
            return;
        }
        
        this.playerName = playerName;
        this.socket.emit('joinGame', gameId, playerName);
        this.currentGameId = gameId;
        this.game.setGameId(gameId);
    }

    private playAgain(): void {
        this.ui.showLobby();
        (document.getElementById('playerName') as HTMLInputElement).value = '';
        (document.getElementById('joinPlayerName') as HTMLInputElement).value = '';
        (document.getElementById('gameCode') as HTMLInputElement).value = '';
        this.currentGameId = '';
        
        // Clear chat
        document.getElementById('chatMessages')!.innerHTML = '';
        
        // Request fresh games list
        this.socket.emit('requestGamesList');
    }
}

// Start the client immediately or when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        const client = new NumberLineDuelClient();
        // Expose join function globally
        (window as any).joinGameById = (gameId: string) => client['joinGameById'](gameId);
    });
} else {
    // DOM is already ready
    const client = new NumberLineDuelClient();
    // Expose join function globally
    (window as any).joinGameById = (gameId: string) => client['joinGameById'](gameId);
}