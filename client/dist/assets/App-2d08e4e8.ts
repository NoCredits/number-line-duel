import { GameState, Card, ChatMessage, GameListing } from '../../../shared/types/common.js';
import { UIManager } from '../games/number-line/NumberLineUI.js';
import { GameClient } from '../games/number-line/NumberLineGame.js';
import { GooseGameClient } from '../games/goose-duel/GooseDuelGame.js';
import { ArtilleryGameClient, ArtilleryUIManager } from '../games/artillery-duel/index.js';

// Use global io from socket.io script
declare const io: any;
declare const window: any;

type GameMode = 'numberline' | 'goose' | 'artillery';

class NumberLineDuelClient {
    private socket: any;
    private ui: UIManager;
    private game: GameClient;
    private gooseGame: GooseGameClient | null = null;
    private artilleryGame: ArtilleryGameClient | null = null;
    private artilleryUI: ArtilleryUIManager | null = null;
    private selectedArtilleryDifficulty: 'easy' | 'medium' | 'hard' = 'medium';
    private currentGameId: string = '';
    private playerName: string = '';
    private isChatMinimized: boolean = true;
    private gamesPlayed: number = 0;
    private gamesWon: number = 0;
    private gameHistory: Array<{result: string, opponent: string, date: string}> = [];
    private selectedGameMode: GameMode = 'numberline';

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
        
        // Check if player is already logged in
        if (this.playerName) {
            console.log('Player already logged in:', this.playerName);
            this.showScreen('mainMenu');
        } else {
            // Show login screen first
            this.showScreen('loginScreen');
        }
        
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
        
        // Load saved player name
        const savedName = localStorage.getItem('playerName');
        if (savedName) {
            this.playerName = savedName;
            document.getElementById('playerNameDisplay')!.textContent = savedName;
            document.getElementById('playerNameHeader')!.textContent = savedName;
            // Auto-populate login input
            const loginInput = document.getElementById('loginPlayerName') as HTMLInputElement;
            if (loginInput) {
                loginInput.value = savedName;
            }
        }
        
        this.updatePlayerStats();
        this.updateGameHistory();
    }

    private savePlayerData(): void {
        localStorage.setItem('gamesPlayed', this.gamesPlayed.toString());
        localStorage.setItem('gamesWon', this.gamesWon.toString());
        localStorage.setItem('gameHistory', JSON.stringify(this.gameHistory));
        localStorage.setItem('playerName', this.playerName);
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
        const menuBtnMain = document.getElementById('menuBtnMain');
        const menuBtnLobby = document.getElementById('menuBtnLobby');
        const menuBtnGoose = document.getElementById('menuBtnGoose');
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

        if (menuBtnMain) {
            menuBtnMain.addEventListener('click', toggleNav);
        }

        if (menuBtnLobby) {
            menuBtnLobby.addEventListener('click', () => {
                // Close nav if open
                mainNav.classList.remove('open');
                overlay.classList.remove('active');
                // Go back to main menu
                this.showScreen('mainMenu');
            });
        }

        if (menuBtnGoose) {
            menuBtnGoose.addEventListener('click', toggleNav);
        }
        
        if (navToggle) {
            navToggle.addEventListener('click', toggleNav);
        }

        overlay.addEventListener('click', toggleNav);

        // Leave Game button
        const leaveGameBtn = document.getElementById('leaveGameBtn');
        if (leaveGameBtn) {
            leaveGameBtn.addEventListener('click', () => {
                if (confirm('Are you sure you want to leave the game?')) {
                    // Close nav
                    mainNav.classList.remove('open');
                    overlay.classList.remove('active');
                    // Return to main menu
                    this.showScreen('mainMenu');
                    // Hide leave game button
                    leaveGameBtn.style.display = 'none';
                }
            });
        }

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
        console.log('Initializing event listeners...');
        
        // Login screen
        const loginBtn = document.getElementById('loginBtn');
        const loginInput = document.getElementById('loginPlayerName') as HTMLInputElement;
        
        if (loginBtn) {
            loginBtn.addEventListener('click', () => this.handleLogin());
            console.log('Login button listener added');
        } else {
            console.error('Login button not found!');
        }
        
        if (loginInput) {
            loginInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.handleLogin();
            });
            console.log('Login input listener added');
        } else {
            console.error('Login input not found!');
        }
        
        // Main menu - Game mode selection
        const selectNumberLine = document.getElementById('selectNumberLine');
        const selectGoose = document.getElementById('selectGoose');
        const selectArtillery = document.getElementById('selectArtillery');
        
        if (selectNumberLine) {
            selectNumberLine.addEventListener('click', () => this.selectGameModeFromMenu('numberline'));
        }
        
        if (selectGoose) {
            selectGoose.addEventListener('click', () => this.selectGameModeFromMenu('goose'));
        }

        if (selectArtillery) {
            selectArtillery.addEventListener('click', () => this.selectGameModeFromMenu('artillery'));
        }
        
        // Artillery difficulty selection
        const difficultyButtons = document.querySelectorAll('.difficulty-btn');
        difficultyButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                // Remove active class from all buttons
                difficultyButtons.forEach(b => b.classList.remove('active'));
                // Add active class to clicked button
                btn.classList.add('active');
                // Store selected difficulty
                this.selectedArtilleryDifficulty = btn.getAttribute('data-difficulty') as 'easy' | 'medium' | 'hard';
                console.log('Selected difficulty:', this.selectedArtilleryDifficulty);
            });
        });

        // Artillery join queue button
        const joinArtilleryQueueBtn = document.getElementById('joinArtilleryQueue');
        if (joinArtilleryQueueBtn) {
            joinArtilleryQueueBtn.addEventListener('click', () => this.joinArtilleryQueue());
        }

        // Artillery controls
        const artilleryAngle = document.getElementById('artilleryAngle') as HTMLInputElement;
        const artilleryAngleValue = document.getElementById('artilleryAngleValue');
        const artilleryPower = document.getElementById('artilleryPower') as HTMLInputElement;
        const artilleryPowerValue = document.getElementById('artilleryPowerValue');
        const artilleryFireBtn = document.getElementById('artilleryFireBtn');

        if (artilleryAngle && artilleryAngleValue) {
            artilleryAngle.addEventListener('input', () => {
                artilleryAngleValue.textContent = artilleryAngle.value + '°';
            });
        }

        if (artilleryPower && artilleryPowerValue) {
            artilleryPower.addEventListener('input', () => {
                artilleryPowerValue.textContent = artilleryPower.value;
            });
        }

        if (artilleryFireBtn) {
            artilleryFireBtn.addEventListener('click', () => {
                if (this.artilleryGame && artilleryAngle && artilleryPower) {
                    const angle = parseInt(artilleryAngle.value);
                    const power = parseInt(artilleryPower.value);
                    this.artilleryGame.fire(angle, power);
                }
            });
        }
        
        // Lobby events
        const createGameBtn = document.getElementById('createGame');
        const joinGameBtn = document.getElementById('joinGame');
        const playAgainBtn = document.getElementById('playAgain');
        const gameCodeInput = document.getElementById('gameCode');
        
        if (createGameBtn) {
            createGameBtn.addEventListener('click', () => this.createGame());
        }
        
        if (joinGameBtn) {
            joinGameBtn.addEventListener('click', () => this.joinGame());
        }
        
        if (playAgainBtn) {
            playAgainBtn.addEventListener('click', () => this.playAgain());
        }
        
        // Enter key support for game code
        if (gameCodeInput) {
            gameCodeInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.joinGame();
            });
        }
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
                if (this.selectedGameMode === 'goose') {
                    this.socket.emit('requestGooseGamesList');
                } else {
                    this.socket.emit('requestGamesList');
                }
            }
        }, 3000);
        
        // Request immediately on load
        if (this.selectedGameMode === 'goose') {
            this.socket.emit('requestGooseGamesList');
        } else {
            this.socket.emit('requestGamesList');
        }
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

        // Goose Game Socket Listeners
        this.socket.on('gooseGameCreated', (data: { gameId: string; gameState: any }) => {
            console.log('🎮 Game created:', data.gameId);
            this.currentGameId = data.gameId;
            // Import and initialize GooseUIManager dynamically
            import('../games/goose-duel/GooseDuelUI.js').then(({ GooseUIManager }) => {
                const gooseUI = new GooseUIManager();
                this.gooseGame = new GooseGameClient(this.socket, gooseUI, data.gameId);
                this.gooseGame.setPlayerId(this.socket.id);
                console.log('GooseGameClient initialized for creator');
            });
            this.ui.showWaitingRoom(data.gameId);
        });

        this.socket.on('gooseGameJoined', (data: { gameId: string; gameState: any }) => {
            console.log('🎮✅ Successfully joined game:', data.gameId);
            console.log('📊 Game state on join:', data.gameState);
            this.currentGameId = data.gameId;
            // Import and initialize GooseUIManager dynamically
            import('../games/goose-duel/GooseDuelUI.js').then(({ GooseUIManager }) => {
                console.log('📦 GooseUIManager module loaded');
                const gooseUI = new GooseUIManager();
                console.log('🎨 GooseUIManager instance created');
                this.gooseGame = new GooseGameClient(this.socket, gooseUI, data.gameId);
                console.log('🎮 GooseGameClient instance created');
                this.gooseGame.setPlayerId(this.socket.id);
                console.log('✅ GooseGameClient initialized for joining player, playerID:', this.socket.id);
                
                // Check if game is already playing when we join
                if (data.gameState.gameStatus === 'playing') {
                    console.log('🎮 Game already started! Showing game screen immediately...');
                    // Game is already playing, show the board immediately
                    gooseUI.showGameScreen();
                    gooseUI.updateGameState(data.gameState, this.socket.id);
                    gooseUI.showNotification('Joined game! 🦢', 'success');
                } else {
                    console.log('⏳ Game not started yet, showing waiting room');
                    // Show waiting room if waiting for more players
                    this.ui.showWaitingRoom(data.gameId);
                }
            }).catch(error => {
                console.error('❌ Failed to load GooseUIManager:', error);
            });
        });

        this.socket.on('gooseGameState', (gameState: any) => {
            console.log('📊 Game state update received:', gameState.gameStatus);
            // Game state updates are handled by GooseGameClient socket listeners
            // The GooseGameClient is already initialized by gooseGameCreated or gooseGameJoined
        });

        this.socket.on('gooseGameStarted', (gameState: any) => {
            console.log('🎮 Goose game started!', gameState);
            console.log('Current gameId:', this.currentGameId);
            console.log('Socket ID:', this.socket.id);
            console.log('GooseGame client exists:', !!this.gooseGame);
            
            // The GooseGameClient should already be initialized and listening
            // It will handle showing the game screen via its own listener
        });

        this.socket.on('gooseActionResult', (result: any) => {
            // Handled by GooseGameClient
            console.log('Goose action:', result.message);
        });

        this.socket.on('gooseGameOver', (data: { winner: string | null; reason: string }) => {
            const isWinner = data.winner === this.socket.id;
            
            // Update stats
            this.gamesPlayed++;
            if (isWinner) {
                this.gamesWon++;
            }

            // Add to history
            const opponent = 'Opponent';
            this.gameHistory.push({
                result: isWinner ? 'win' : 'loss',
                opponent: opponent,
                date: new Date().toLocaleDateString()
            });

            this.savePlayerData();
            this.updatePlayerStats();
            this.updateGameHistory();
        });

        this.socket.on('gooseGamesList', (games: GameListing[]) => {
            // Could display Goose games differently if needed
            this.displayGamesList(games);
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

    private selectGameMode(mode: GameMode): void {
        this.selectedGameMode = mode;
        console.log('Game mode selected:', mode);
        
        // Update button styles
        const numberLineBtn = document.getElementById('modeNumberLine')!;
        const gooseBtn = document.getElementById('modeGoose')!;
        
        if (mode === 'numberline') {
            numberLineBtn.classList.add('active');
            gooseBtn.classList.remove('active');
        } else {
            gooseBtn.classList.add('active');
            numberLineBtn.classList.remove('active');
        }
    }

    private showScreen(screenId: string): void {
        document.querySelectorAll('.screen').forEach(screen => {
            (screen as HTMLElement).classList.remove('active');
        });
        const screen = document.getElementById(screenId);
        if (screen) {
            screen.classList.add('active');
        }

        // Show/hide Leave Game button based on screen
        const leaveGameBtn = document.getElementById('leaveGameBtn');
        if (leaveGameBtn) {
            if (screenId === 'gameScreen' || screenId === 'gooseGameScreen') {
                leaveGameBtn.style.display = 'block';
            } else {
                leaveGameBtn.style.display = 'none';
            }
        }
    }

    private handleLogin(): void {
        console.log('handleLogin called');
        const loginInput = document.getElementById('loginPlayerName') as HTMLInputElement;
        const playerName = loginInput.value.trim();
        
        console.log('Player name:', playerName);
        
        if (!playerName) {
            alert('Please enter your name');
            return;
        }
        
        this.playerName = playerName;
        document.getElementById('playerNameDisplay')!.textContent = playerName;
        document.getElementById('playerNameHeader')!.textContent = playerName;
        
        // Save player name to localStorage
        localStorage.setItem('playerName', playerName);
        
        console.log('Showing main menu...');
        // Show main menu
        this.showScreen('mainMenu');
    }

    private selectGameModeFromMenu(mode: GameMode): void {
        this.selectedGameMode = mode;
        console.log('Game mode selected from menu:', mode);
        
        // Update lobby title based on mode
        const lobbyTitle = document.getElementById('lobbyTitle');
        if (lobbyTitle) {
            if (mode === 'goose') {
                lobbyTitle.textContent = '🦢 Modern Goose Duel';
            } else if (mode === 'artillery') {
                lobbyTitle.textContent = '🎯 Artillery Duel';
            } else {
                lobbyTitle.textContent = '🔢 Number Line Duel';
            }
        }
        
        // Show/hide appropriate lobby sections
        const artilleryLobby = document.getElementById('artilleryLobby');
        const standardLobby = document.getElementById('standardLobby');
        
        if (mode === 'artillery') {
            if (artilleryLobby) artilleryLobby.style.display = 'block';
            if (standardLobby) standardLobby.style.display = 'none';
        } else {
            if (artilleryLobby) artilleryLobby.style.display = 'none';
            if (standardLobby) standardLobby.style.display = 'block';
            // Request games list for the selected mode
            this.requestGamesList();
        }
        
        // Show lobby
        this.showScreen('lobby');
    }

    private createGame(): void {
        console.log('Creating game with mode:', this.selectedGameMode);
        
        if (!this.playerName) {
            alert('Please log in first');
            this.showScreen('loginScreen');
            return;
        }
        
        if (this.selectedGameMode === 'artillery') {
            // Artillery uses queue-based matchmaking
            alert('Artillery Duel uses automatic matchmaking. Please join the queue instead of creating a game.');
            return;
        } else if (this.selectedGameMode === 'goose') {
            console.log('Emitting createGooseGame');
            this.socket.emit('createGooseGame', this.playerName);
        } else {
            console.log('Emitting createGame (Number Line)');
            this.socket.emit('createGame', this.playerName);
        }
    }

    private joinArtilleryQueue(): void {
        console.log('Joining Artillery queue with difficulty:', this.selectedArtilleryDifficulty);
        
        if (!this.playerName) {
            alert('Please log in first');
            this.showScreen('loginScreen');
            return;
        }

        // Initialize Artillery UI and game if not already done
        if (!this.artilleryUI) {
            this.artilleryUI = new ArtilleryUIManager();
        }

        if (!this.artilleryGame) {
            this.artilleryGame = new ArtilleryGameClient(this.socket, this.artilleryUI, '');
            this.artilleryGame.setPlayerId(this.socket.id);
        }

        // Update queue status
        const queueStatus = document.getElementById('queueStatus');
        if (queueStatus) {
            queueStatus.textContent = 'Joining queue...';
        }

        // Join queue with selected difficulty
        this.artilleryGame.joinQueue(this.selectedArtilleryDifficulty);
    }

    private joinGame(): void {
        console.log('🔍 joinGame() called');
        const gameCode = (document.getElementById('gameCode') as HTMLInputElement).value.trim().toUpperCase();
        console.log('🔍 Game code from input:', gameCode);
        console.log('🔍 Player name:', this.playerName);
        console.log('🔍 Selected game mode:', this.selectedGameMode);
        
        if (!this.playerName) {
            alert('Please log in first');
            this.showScreen('loginScreen');
            return;
        }
        
        if (!gameCode) {
            alert('Please enter a game code');
            return;
        }
        
        if (this.selectedGameMode === 'goose') {
            this.currentGameId = gameCode;
            console.log('🎮 Joining goose game:', gameCode, 'as player:', this.playerName);
            this.socket.emit('joinGooseGame', gameCode, this.playerName);
        } else {
            console.log('🔢 Joining number line game:', gameCode);
            this.socket.emit('joinGame', gameCode, this.playerName);
            this.currentGameId = gameCode;
            this.game.setGameId(gameCode);
        }
    }

    private joinGameById(gameId: string): void {
        console.log('🎮 joinGameById called with:', gameId);
        console.log('🎮 Current player name:', this.playerName);
        console.log('🎮 Selected game mode:', this.selectedGameMode);
        
        if (!this.playerName) {
            alert('Please log in first');
            this.showScreen('loginScreen');
            return;
        }
        
        // Set the current game ID
        this.currentGameId = gameId;
        
        // Join based on game mode
        if (this.selectedGameMode === 'goose') {
            console.log('🎮 Joining Goose game from list:', gameId);
            this.socket.emit('joinGooseGame', gameId, this.playerName);
        } else {
            console.log('🔢 Joining Number Line game from list:', gameId);
            this.socket.emit('joinGame', gameId, this.playerName);
            this.game.setGameId(gameId);
        }
    }

    private playAgain(): void {
        // Go back to main menu to select game mode again
        this.showScreen('mainMenu');
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