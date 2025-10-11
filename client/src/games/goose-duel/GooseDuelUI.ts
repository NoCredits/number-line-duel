import { GooseGameState, GooseCard, GoosePlayer, BoardSpace, PlacedTrap } from '../../../../shared/types/goose-duel.js';

export class GooseUIManager {
    private selectedCard: GooseCard | null = null;
    private selectedPosition: number | null = null;
    private onCardPlay: ((cardId: string) => void) | null = null;
    private onTrapPlace: ((cardId: string, position: number) => void) | null = null;
    private onBoostUse: ((cardId: string, targetPosition?: number) => void) | null = null;
    private onPowerUpUse: ((cardId: string, targetPlayerId?: string) => void) | null = null;
    private onEndTurn: (() => void) | null = null;
    private onSkipTurn: (() => void) | null = null;

    constructor() {
        this.initializeUI();
    }

    private initializeUI(): void {
        // UI is already in HTML
    }

    showGameScreen(): void {
        this.showScreen('gooseGameScreen');
    }

    showLobby(): void {
        this.showScreen('lobby');
    }

    private showScreen(screenId: string): void {
        document.querySelectorAll('.screen').forEach(screen => {
            (screen as HTMLElement).classList.remove('active');
        });
        const screen = document.getElementById(screenId);
        if (screen) {
            screen.classList.add('active');
        }
    }

    updateGameState(gameState: GooseGameState, playerId: string): void {
        // Safety check
        if (!gameState || !gameState.players || gameState.players.length < 2) {
            console.warn('Invalid game state received:', gameState);
            return;
        }
        
        const player = gameState.players.find(p => p.id === playerId);
        const opponent = gameState.players.find(p => p.id !== playerId);

        if (!player || !opponent) {
            console.warn('Could not find player or opponent in game state');
            return;
        }

        // Update player info
        this.updatePlayerInfo(player, opponent, gameState);

        // Update board (pass playerId to show player's own traps)
        this.updateBoard(gameState, playerId);

        // Update hand
        this.updateHand(player, gameState.currentPlayerId === playerId);

        // Update action log
        this.updateActionLog(gameState.lastAction || '');

        // Update turn indicator
        this.updateTurnIndicator(gameState.currentPlayerId === playerId);
    }

    private updatePlayerInfo(player: GoosePlayer, opponent: GoosePlayer, gameState: GooseGameState): void {
        const playerInfo = document.getElementById('goosePlayerInfo');
        if (!playerInfo) return;

        const playerEffects = player.activeEffects.map(e => `${e.description} (${e.turnsRemaining})`).join(', ');
        const opponentEffects = opponent.activeEffects.map(e => `${e.description} (${e.turnsRemaining})`).join(', ');

        playerInfo.innerHTML = `
            <div class="goose-player-card ${player.isCurrentPlayer ? 'active' : ''}">
                <div class="player-token">${player.token.emoji}</div>
                <div class="player-details">
                    <div class="player-name">${player.name} (You)</div>
                    <div class="player-position">Position: ${player.token.position}/${gameState.boardLength}</div>
                    <div class="player-cards">🃏 ${player.hand.length} cards</div>
                    ${player.hasShield ? '<div class="player-shield">🛡️ Shield Active</div>' : ''}
                    ${playerEffects ? `<div class="player-effects">${playerEffects}</div>` : ''}
                </div>
            </div>
            <div class="goose-player-card ${opponent.isCurrentPlayer ? 'active' : ''}">
                <div class="player-token">${opponent.token.emoji}</div>
                <div class="player-details">
                    <div class="player-name">${opponent.name}</div>
                    <div class="player-position">Position: ${opponent.token.position}/${gameState.boardLength}</div>
                    <div class="player-cards">🃏 ${opponent.hand.length} cards</div>
                    ${opponent.hasShield ? '<div class="player-shield">🛡️ Shield Active</div>' : ''}
                    ${opponentEffects ? `<div class="player-effects">${opponentEffects}</div>` : ''}
                </div>
            </div>
        `;
    }

    private updateBoard(gameState: GooseGameState, playerId?: string): void {
        const boardContainer = document.getElementById('gooseBoardTrack');
        if (!boardContainer) return;

        const player = gameState.players[0];
        const opponent = gameState.players[1];

        let boardHTML = '<div class="board-track">';
        
        // Generate board spaces
        for (let i = 0; i <= gameState.boardLength; i++) {
            const space = gameState.board[i];
            const isPlayerHere = player.token.position === i;
            const isOpponentHere = opponent.token.position === i;
            
            // Show visible traps OR traps placed by this player
            const trap = gameState.placedTraps.find(t => 
                t.position === i && (t.isVisible || (playerId && t.playerId === playerId))
            );
            
            let spaceClass = 'board-space';
            if (space.type !== 'normal') spaceClass += ' special-space';
            if (isPlayerHere) spaceClass += ' player-here';
            if (isOpponentHere) spaceClass += ' opponent-here';
            if (trap) spaceClass += ' has-trap';

            let spaceContent = '';
            if (isPlayerHere && isOpponentHere) {
                spaceContent = `${player.token.emoji}${opponent.token.emoji}`;
            } else if (isPlayerHere) {
                spaceContent = player.token.emoji;
            } else if (isOpponentHere) {
                spaceContent = opponent.token.emoji;
            } else if (trap) {
                spaceContent = trap.trapCard.emoji;
            } else if (space.emoji) {
                spaceContent = space.emoji;
            } else {
                spaceContent = i.toString();
            }

            boardHTML += `
                <div class="${spaceClass}" data-position="${i}" title="${space.description || `Space ${i}`}">
                    <div class="space-number">${i === 0 ? 'START' : i === gameState.boardLength ? 'FINISH' : i}</div>
                    <div class="space-content">${spaceContent}</div>
                </div>
            `;

            // Add spacing/newline every 10 spaces for visual layout
            if ((i + 1) % 10 === 0 && i < gameState.boardLength) {
                boardHTML += '<div class="board-break"></div>';
            }
        }
        
        boardHTML += '</div>';
        boardContainer.innerHTML = boardHTML;

        // Add click handlers for trap placement
        const spaces = boardContainer.querySelectorAll('.board-space');
        spaces.forEach(space => {
            space.addEventListener('click', (e) => {
                const pos = parseInt((e.currentTarget as HTMLElement).dataset.position || '0');
                this.onSpaceClick(pos);
            });
        });
    }

    private updateHand(player: GoosePlayer, isMyTurn: boolean): void {
        const handContainer = document.getElementById('goosePlayerHand');
        if (!handContainer) return;

        // Check if player has any movement cards
        const hasMovementCards = player.hand.some(c => c.type === 'movement');

        let handHTML = player.hand.map(card => `
            <div class="goose-card ${this.selectedCard?.id === card.id ? 'selected' : ''} ${!isMyTurn ? 'disabled' : ''}" 
                 data-card-id="${card.id}"
                 data-card-type="${card.type}">
                <div class="card-emoji">${card.emoji}</div>
                <div class="card-name">${card.name}</div>
                <div class="card-description">${card.description}</div>
            </div>
        `).join('');

        // Add skip turn button if player has no movement cards and it's their turn
        if (!hasMovementCards && isMyTurn) {
            handHTML += `
                <div class="skip-turn-card" id="skipTurnBtn">
                    <div class="card-emoji">🔄</div>
                    <div class="card-name">Discard & Draw</div>
                    <div class="card-description">No movement cards? Discard hand & draw new cards</div>
                </div>
            `;
        }

        handContainer.innerHTML = handHTML;

        // Add card click handlers
        const cards = handContainer.querySelectorAll('.goose-card');
        cards.forEach(card => {
            card.addEventListener('click', (e) => {
                const cardId = (e.currentTarget as HTMLElement).dataset.cardId;
                const cardObj = player.hand.find(c => c.id === cardId);
                if (cardObj && isMyTurn) {
                    this.onCardClick(cardObj);
                }
            });
        });

        // Add skip turn button handler
        const skipBtn = document.getElementById('skipTurnBtn');
        if (skipBtn) {
            skipBtn.addEventListener('click', () => {
                if (this.onSkipTurn && confirm('Discard all cards and draw new ones? This will end your turn.')) {
                    this.onSkipTurn();
                }
            });
        }
    }

    private onCardClick(card: GooseCard): void {
        this.selectedCard = card;
        
        // Update UI to show selection
        document.querySelectorAll('.goose-card').forEach(c => c.classList.remove('selected'));
        document.querySelector(`[data-card-id="${card.id}"]`)?.classList.add('selected');

        // Show appropriate action buttons
        this.updateActionButtons(card);
    }

    private updateActionButtons(card: GooseCard): void {
        const actionsContainer = document.getElementById('gooseActions');
        if (!actionsContainer) return;

        let buttonsHTML = '';

        if (card.type === 'movement') {
            buttonsHTML = `<button class="action-btn" id="playMoveBtn">Move ${card.moveSpaces} Spaces</button>`;
        } else if (card.type === 'trap') {
            buttonsHTML = `<button class="action-btn" id="placeTrapBtn">Place Trap (Click Board)</button>`;
        } else if (card.type === 'boost') {
            if (card.boostType === 'teleport') {
                buttonsHTML = `<button class="action-btn" id="useBoostBtn">Teleport (Click Board)</button>`;
            } else {
                buttonsHTML = `<button class="action-btn" id="useBoostBtn">Use ${card.name}</button>`;
            }
        } else if (card.type === 'powerup') {
            buttonsHTML = `<button class="action-btn" id="usePowerUpBtn">Use ${card.name}</button>`;
        }

        buttonsHTML += `<button class="action-btn secondary" id="deselectBtn">Deselect</button>`;
        
        actionsContainer.innerHTML = buttonsHTML;

        // Add button listeners
        document.getElementById('playMoveBtn')?.addEventListener('click', () => {
            if (this.selectedCard && this.onCardPlay) {
                this.onCardPlay(this.selectedCard.id);
                this.selectedCard = null;
            }
        });

        document.getElementById('placeTrapBtn')?.addEventListener('click', () => {
            this.showNotification('Click on a board space to place the trap', 'info');
        });

        document.getElementById('useBoostBtn')?.addEventListener('click', () => {
            if (this.selectedCard && this.onBoostUse) {
                if (this.selectedCard.boostType === 'teleport') {
                    this.showNotification('Click on a board space within 10 spaces', 'info');
                } else {
                    this.onBoostUse(this.selectedCard.id);
                    this.selectedCard = null;
                }
            }
        });

        document.getElementById('usePowerUpBtn')?.addEventListener('click', () => {
            if (this.selectedCard && this.onPowerUpUse) {
                this.onPowerUpUse(this.selectedCard.id);
                this.selectedCard = null;
            }
        });

        document.getElementById('deselectBtn')?.addEventListener('click', () => {
            this.selectedCard = null;
            document.querySelectorAll('.goose-card').forEach(c => c.classList.remove('selected'));
            this.updateActionButtons(null as any);
        });
    }

    private onSpaceClick(position: number): void {
        if (!this.selectedCard) return;

        if (this.selectedCard.type === 'trap' && this.onTrapPlace) {
            this.onTrapPlace(this.selectedCard.id, position);
            this.selectedCard = null;
        } else if (this.selectedCard.type === 'boost' && this.selectedCard.boostType === 'teleport' && this.onBoostUse) {
            this.onBoostUse(this.selectedCard.id, position);
            this.selectedCard = null;
        }
    }

    private updateActionLog(action: string): void {
        const logContainer = document.getElementById('gooseActionLog');
        if (!logContainer) return;

        const logEntry = document.createElement('div');
        logEntry.className = 'log-entry';
        logEntry.textContent = action;
        
        logContainer.insertBefore(logEntry, logContainer.firstChild);

        // Keep only last 10 entries
        while (logContainer.children.length > 10) {
            logContainer.removeChild(logContainer.lastChild!);
        }
    }

    private updateTurnIndicator(isMyTurn: boolean): void {
        const indicator = document.getElementById('gooseTurnIndicator');
        if (!indicator) return;

        indicator.textContent = isMyTurn ? '🟢 Your Turn!' : '🔴 Opponent\'s Turn';
        indicator.className = `turn-indicator ${isMyTurn ? 'my-turn' : 'opponent-turn'}`;
    }

    showNotification(message: string, type: 'success' | 'error' | 'info'): void {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);

        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    showGameOver(isWinner: boolean, winnerName: string): void {
        const overlay = document.createElement('div');
        overlay.className = 'game-over-overlay';
        overlay.innerHTML = `
            <div class="game-over-modal">
                <div class="game-over-emoji">${isWinner ? '🎉' : '💫'}</div>
                <h2>${isWinner ? 'Victory!' : 'Game Over'}</h2>
                <p>${winnerName} wins the race!</p>
                <button class="action-btn" onclick="location.reload()">Play Again</button>
            </div>
        `;
        document.body.appendChild(overlay);
    }

    setOnCardPlay(callback: (cardId: string) => void): void {
        this.onCardPlay = callback;
    }

    setOnTrapPlace(callback: (cardId: string, position: number) => void): void {
        this.onTrapPlace = callback;
    }

    setOnBoostUse(callback: (cardId: string, targetPosition?: number) => void): void {
        this.onBoostUse = callback;
    }

    setOnPowerUpUse(callback: (cardId: string, targetPlayerId?: string) => void): void {
        this.onPowerUpUse = callback;
    }

    setOnEndTurn(callback: () => void): void {
        this.onEndTurn = callback;
        
        const endTurnBtn = document.getElementById('gooseEndTurnBtn');
        if (endTurnBtn) {
            endTurnBtn.addEventListener('click', () => {
                if (this.onEndTurn) this.onEndTurn();
            });
        }
    }

    setOnSkipTurn(callback: () => void): void {
        this.onSkipTurn = callback;
    }
}
