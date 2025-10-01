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
    private gamesPlayed: number = 0;
    private gamesWon: number = 0;
    private gameHistory: Array<{result: string, opponent: string, date: string}> = [];

    constructor() {
        // Use dynamic socket URL from global variable, fallback to localhost
        const socketUrl = window.SOCKET_URL || 'http://localhost:3001';
        this.socket = io(socketUrl);
        this.ui = new UIManager();
        this.game = new GameClient(this.socket, this.ui);
        
        this.loadPlayerData();
        this.initializeEventListeners();
        this.setupSocketListeners();
        this.setupChatListeners();
        this.setupNavigationListeners();
        this.requestGamesList();
        
        // Ensure menu is hidden on load
        const mainNav = document.getElementById('mainNav');
        if (mainNav) {
            mainNav.classList.remove('open');
            console.log('Menu initialized as hidden');
        }
    }

    private loadPlayerData(): void {
        // Load from localStorage
        this.gamesPlayed = parseInt(localStorage.getItem('gamesPlayed') || '0');
        this.gamesWon = parseInt(localStorage.getItem('gamesWon') || '0');
        this.gameHistory = JSON.parse(localStorage.getItem('gameHistory') || '[]');
        
        this.updatePlayerStats();
        this.updateGameHistory();
    }

    private savePlayerData(): void {
        localStorage.setItem('gamesPlayed', this.gamesPlayed.toString());
        localStorage.setItem('gamesWon', this.gamesWon.toString());
        localStorage.setItem('gameHistory', JSON.stringify(this.gameHistory));
    }

    private updatePlayerStats(): void {
        document.getElementById('gamesPlayed')!.textContent = this.gamesPlayed.toString();
        const winRate = this.gamesPlayed > 0 ? Math.round((this.gamesWon / this.gamesPlayed) * 100) : 0;
        document.getElementById('winRate')!.textContent = `${winRate}%`;
        
        if (this.playerName) {
            document.getElementById('playerNameDisplay')!.textContent = this.playerName;
        }
    }

    private updateGameHistory(): void {
        const historyContainer = document.getElementById('gameHistory')!;
        
        if (this.gameHistory.length === 0) {
            historyContainer.innerHTML = '<div class="no-history">No games played yet</div>';
            return;
        }

        historyContainer.innerHTML = this.gameHistory.slice(-5).reverse().map(game => `
            <div class="history-item ${game.result}">
                <div>${game.result === 'win' ? '🏆' : '💫'} vs ${game.opponent}</div>
                <div style="font-size: 0.8em; opacity: 0.7;">${game.date}</div>
            </div>
        `).join('');
    }

    private setupNavigationListeners(): void {
        const menuBtn = document.getElementById('menuBtn');
        const menuBtnLobby = document.getElementById('menuBtnLobby');
        const navToggle = document.getElementById('navToggle');
        const mainNav = document.getElementById('mainNav')!;
        
        // Create overlay
        const overlay = document.createElement('div');
        overlay.className = 'nav-overlay';
        overlay.id = 'navOverlay';
        document.body.appendChild(overlay);

        const toggleNav = () => {
            mainNav.classList.toggle('open');
            overlay.classList.toggle('active');
        };

        if (menuBtn) {
            menuBtn.addEventListener('click', toggleNav);
        }

        if (menuBtnLobby) {
            menuBtnLobby.addEventListener('click', toggleNav);
        }
        
        if (navToggle) {
            navToggle.addEventListener('click', toggleNav);
        }

        overlay.addEventListener('click', toggleNav);

        // Chat button in game
        const chatBtn = document.getElementById('chatBtn');
        if (chatBtn) {
            chatBtn.addEventListener('click', () => {
                const chatContainer = document.getElementById('chatContainer')!;
                this.isChatMinimized = !this.isChatMinimized;
                chatContainer.classList.toggle('minimized');
                const chatToggle = document.getElementById('chatToggle')!;
                chatToggle.textContent = this.isChatMinimized ? '▼' : '▲';
            });
        }

        // Help button
        const helpBtn = document.getElementById('helpBtn');
        if (helpBtn) {
            helpBtn.addEventListener('click', () => this.showRules());
        }

        // About and Rules buttons in nav
        document.getElementById('aboutBtn')!.addEventListener('click', () => {
            this.showAbout();
            toggleNav();
        });

        document.getElementById('rulesBtn')!.addEventListener('click', () => {
            this.showRules();
            toggleNav();
        });

        // Modal close
        document.getElementById('modalClose')!.addEventListener('click', () => {
            document.getElementById('infoModal')!.style.display = 'none';
        });

        // Settings toggles
        document.getElementById('soundEffects')!.addEventListener('change', (e) => {
            localStorage.setItem('soundEffects', (e.target as HTMLInputElement).checked.toString());
        });

        document.getElementById('animations')!.addEventListener('change', (e) => {
            localStorage.setItem('animations', (e.target as HTMLInputElement).checked.toString());
        });

        // Load settings
        const soundEffects = localStorage.getItem('soundEffects') !== 'false';
        const animations = localStorage.getItem('animations') !== 'false';
        (document.getElementById('soundEffects') as HTMLInputElement).checked = soundEffects;
        (document.getElementById('animations') as HTMLInputElement).checked = animations;
    }

    private showAbout(): void {
        const modal = document.getElementById('infoModal')!;
        const modalBody = document.getElementById('modalBody')!;
        
        modalBody.innerHTML = `
            <h2>About Number Line Duel</h2>
            <p style="margin: 20px 0; line-height: 1.6;">
                <strong>Number Line Duel</strong> is a strategic card game where players compete to reach a target number 
                on a number line using mathematical operations.
            </p>
            <p style="margin: 20px 0; line-height: 1.6;">
                Challenge your friends in real-time multiplayer matches and test your mathematical thinking!
            </p>
            <p style="margin: 20px 0; color: #999;">
                Version 2.0 - 2025 Edition<br>
                Created with ❤️ for math enthusiasts
            </p>
        `;
        
        modal.style.display = 'block';
    }

    private showRules(): void {
        const modal = document.getElementById('infoModal')!;
        const modalBody = document.getElementById('modalBody')!;
        
        modalBody.innerHTML = `
            <h2>📖 How to Play</h2>
            <div style="line-height: 1.8; color: #333;">
                <h3 style="margin-top: 20px; color: #667eea;">🎯 Objective</h3>
                <p>Be the first player to reach the target number on the number line!</p>
                
                <h3 style="margin-top: 20px; color: #667eea;">🎮 Gameplay</h3>
                <ul style="margin-left: 20px;">
                    <li>Each turn, play one card from your hand or the central row</li>
                    <li>Cards can add, subtract, or multiply the current position</li>
                    <li>You cannot go below 0 or above the maximum position</li>
                    <li>First to reach the exact target number wins!</li>
                </ul>
                
                <h3 style="margin-top: 20px; color: #667eea;">💡 Strategy Tips</h3>
                <ul style="margin-left: 20px;">
                    <li>Plan ahead - think about which cards will help you reach the target</li>
                    <li>Watch the central row for useful cards</li>
                    <li>Block your opponent by taking cards they might need</li>
                </ul>
            </div>
        `;
        
        modal.style.display = 'block';
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

        this.socket.on('gameOver', (data: { winnerId: string }) => {
            const isWinner = data.winnerId === this.socket.id;
            
            // Update stats
            this.gamesPlayed++;
            if (isWinner) {
                this.gamesWon++;
            }

            // Add to history
            const opponent = 'Opponent'; // Could be enhanced to get actual opponent name
            this.gameHistory.push({
                result: isWinner ? 'win' : 'loss',
                opponent: opponent,
                date: new Date().toLocaleDateString()
            });

            this.savePlayerData();
            this.updatePlayerStats();
            this.updateGameHistory();
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
        document.getElementById('playerNameDisplay')!.textContent = playerName;
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
        document.getElementById('playerNameDisplay')!.textContent = playerName;
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
        document.getElementById('playerNameDisplay')!.textContent = playerName;
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
        
        // Reset chat to minimized
        const chatContainer = document.getElementById('chatContainer');
        if (chatContainer) {
            chatContainer.classList.add('minimized');
            this.isChatMinimized = true;
            const chatToggle = document.getElementById('chatToggle');
            if (chatToggle) {
                chatToggle.textContent = '▼';
            }
        }
        
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