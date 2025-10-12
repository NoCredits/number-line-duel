"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GooseGame = void 0;
const goose_types_1 = require("../../shared/goose-types");
class GooseGame {
    constructor(gameId, boardLength = 50) {
        this.gameId = gameId;
        this.players = new Map();
        this.boardLength = boardLength;
        this.board = (0, goose_types_1.generateBoard)(boardLength);
        this.placedTraps = [];
        this.deck = this.createDeck();
        this.discardPile = [];
        this.currentPlayerIndex = 0;
        this.turnNumber = 1;
        this.phase = 'draw';
        this.lastAction = 'Game started!';
        this.shuffleDeck();
    }
    createDeck() {
        const deck = [];
        let cardId = 0;
        // Movement cards (40% - 40 cards)
        const movementCards = ['move3', 'move4', 'move5', 'move6', 'move8', 'move10'];
        for (let i = 0; i < 40; i++) {
            const cardKey = movementCards[Math.floor(Math.random() * movementCards.length)];
            deck.push({ id: `card-${cardId++}`, ...goose_types_1.GOOSE_CARDS[cardKey] });
        }
        // Trap cards (30% - 30 cards)
        const trapCards = ['pitfall', 'ice', 'swap', 'reverse', 'net', 'bomb'];
        for (let i = 0; i < 30; i++) {
            const cardKey = trapCards[Math.floor(Math.random() * trapCards.length)];
            deck.push({ id: `card-${cardId++}`, ...goose_types_1.GOOSE_CARDS[cardKey] });
        }
        // Boost cards (20% - 20 cards)
        const boostCards = ['sprint', 'teleport', 'double', 'shield', 'gooseBoost'];
        for (let i = 0; i < 20; i++) {
            const cardKey = boostCards[Math.floor(Math.random() * boostCards.length)];
            deck.push({ id: `card-${cardId++}`, ...goose_types_1.GOOSE_CARDS[cardKey] });
        }
        // Power-up cards (10% - 10 cards)
        const powerupCards = ['detector', 'removal', 'steal', 'undo', 'mirror'];
        for (let i = 0; i < 10; i++) {
            const cardKey = powerupCards[Math.floor(Math.random() * powerupCards.length)];
            deck.push({ id: `card-${cardId++}`, ...goose_types_1.GOOSE_CARDS[cardKey] });
        }
        return deck;
    }
    shuffleDeck() {
        for (let i = this.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
        }
    }
    addPlayer(playerId, playerName) {
        if (this.players.size >= 2)
            return false;
        const token = {
            playerId,
            position: 0,
            emoji: this.players.size === 0 ? '🔵' : '🔴',
            color: this.players.size === 0 ? 'blue' : 'red',
            isActive: true
        };
        const player = {
            id: playerId,
            name: playerName,
            token,
            hand: [],
            activeEffects: [],
            isCurrentPlayer: this.players.size === 0,
            skipNextTurn: false,
            hasShield: false
        };
        // Deal starting hand (3 cards)
        for (let i = 0; i < 3; i++) {
            const card = this.drawCard();
            if (card)
                player.hand.push(card);
        }
        this.players.set(playerId, player);
        return true;
    }
    drawCard() {
        if (this.deck.length === 0) {
            if (this.discardPile.length === 0)
                return null;
            this.deck = [...this.discardPile];
            this.discardPile = [];
            this.shuffleDeck();
        }
        return this.deck.pop() || null;
    }
    playMovementCard(playerId, cardId) {
        const player = this.players.get(playerId);
        if (!player || !player.isCurrentPlayer) {
            return { success: false, message: 'Not your turn!' };
        }
        const cardIndex = player.hand.findIndex(c => c.id === cardId);
        if (cardIndex === -1) {
            return { success: false, message: 'Card not found!' };
        }
        const card = player.hand[cardIndex];
        if (card.type !== 'movement' || !card.moveSpaces) {
            return { success: false, message: 'Not a movement card!' };
        }
        // Move the token
        const oldPosition = player.token.position;
        player.token.position = Math.min(player.token.position + card.moveSpaces, this.boardLength);
        // Remove card from hand
        player.hand.splice(cardIndex, 1);
        this.discardPile.push(card);
        this.lastAction = `${player.name} moved from ${oldPosition} to ${player.token.position} using ${card.name}`;
        // Trigger space effect
        this.triggerSpaceEffect(player);
        // Check for traps
        this.checkTraps(player);
        // Check win condition
        if (player.token.position >= this.boardLength) {
            this.phase = 'finished';
            this.lastAction = `${player.name} wins! 🎉`;
            return { success: true, message: this.lastAction };
        }
        // Automatically end turn after movement
        this.endTurn();
        return { success: true, message: this.lastAction };
    }
    placeTrap(playerId, cardId, position) {
        const player = this.players.get(playerId);
        if (!player || !player.isCurrentPlayer) {
            return { success: false, message: 'Not your turn!' };
        }
        const cardIndex = player.hand.findIndex(c => c.id === cardId);
        if (cardIndex === -1) {
            return { success: false, message: 'Card not found!' };
        }
        const card = player.hand[cardIndex];
        if (card.type !== 'trap') {
            return { success: false, message: 'Not a trap card!' };
        }
        // Check if position is valid
        if (position < 0 || position > this.boardLength) {
            return { success: false, message: 'Invalid position!' };
        }
        // Check if space is occupied
        const occupiedByPlayer = Array.from(this.players.values()).some(p => p.token.position === position);
        if (occupiedByPlayer) {
            return { success: false, message: 'Cannot place trap on occupied space!' };
        }
        // Check if special space
        const space = this.board[position];
        if (space.type !== 'normal') {
            return { success: false, message: 'Cannot place trap on special space!' };
        }
        // Check trap limit (3 per player)
        const playerTraps = this.placedTraps.filter(t => t.playerId === playerId);
        if (playerTraps.length >= 3) {
            return { success: false, message: 'Maximum 3 traps on board!' };
        }
        // Place the trap
        const trap = {
            id: `trap-${Date.now()}`,
            position,
            playerId,
            trapCard: card,
            turnsRemaining: card.trapDuration || 5,
            isVisible: card.trapType === 'bomb' // bombs are visible
        };
        this.placedTraps.push(trap);
        player.hand.splice(cardIndex, 1);
        this.discardPile.push(card);
        this.lastAction = `${player.name} placed ${card.name} at position ${position}`;
        // Automatically end turn after placing trap
        this.endTurn();
        return { success: true, message: this.lastAction };
    }
    useBoost(playerId, cardId, targetPosition) {
        const player = this.players.get(playerId);
        if (!player || !player.isCurrentPlayer) {
            return { success: false, message: 'Not your turn!' };
        }
        const cardIndex = player.hand.findIndex(c => c.id === cardId);
        if (cardIndex === -1) {
            return { success: false, message: 'Card not found!' };
        }
        const card = player.hand[cardIndex];
        if (card.type !== 'boost') {
            return { success: false, message: 'Not a boost card!' };
        }
        let message = '';
        switch (card.boostType) {
            case 'sprint':
                player.token.position = Math.min(player.token.position + (card.boostValue || 3), this.boardLength);
                message = `${player.name} sprinted ${card.boostValue} extra spaces!`;
                break;
            case 'teleport':
                if (targetPosition === undefined) {
                    return { success: false, message: 'Target position required for teleport!' };
                }
                if (Math.abs(targetPosition - player.token.position) > (card.boostValue || 10)) {
                    return { success: false, message: 'Target too far for teleport!' };
                }
                player.token.position = Math.min(targetPosition, this.boardLength);
                message = `${player.name} teleported to position ${targetPosition}!`;
                break;
            case 'shield':
                player.hasShield = true;
                message = `${player.name} activated shield! 🛡️`;
                break;
            case 'goose':
                const nextGoose = this.findNextGooseSpace(player.token.position);
                if (nextGoose) {
                    player.token.position = nextGoose.position;
                    message = `${player.name} boosted to Goose space at ${nextGoose.position}!`;
                }
                else {
                    message = `${player.name} boosted to finish!`;
                    player.token.position = this.boardLength;
                }
                break;
            case 'double':
                player.activeEffects.push({
                    type: 'double_move',
                    turnsRemaining: 1,
                    description: 'Take another turn'
                });
                message = `${player.name} gets another turn!`;
                break;
        }
        player.hand.splice(cardIndex, 1);
        this.discardPile.push(card);
        this.lastAction = message;
        // Check win condition
        if (player.token.position >= this.boardLength) {
            this.phase = 'finished';
            this.lastAction = `${player.name} wins! 🎉`;
            return { success: true, message: this.lastAction };
        }
        // Automatically end turn after using boost (unless it's double move)
        if (card.boostType !== 'double') {
            this.endTurn();
        }
        return { success: true, message: this.lastAction };
    }
    usePowerUp(playerId, cardId, targetPlayerId) {
        const player = this.players.get(playerId);
        if (!player || !player.isCurrentPlayer) {
            return { success: false, message: 'Not your turn!' };
        }
        const cardIndex = player.hand.findIndex(c => c.id === cardId);
        if (cardIndex === -1) {
            return { success: false, message: 'Card not found!' };
        }
        const card = player.hand[cardIndex];
        if (card.type !== 'powerup' || !card.powerUpType) {
            return { success: false, message: 'Not a powerup card!' };
        }
        let message = '';
        switch (card.powerUpType) {
            case 'detector':
                // Reveal all traps for 3 turns
                player.activeEffects.push({
                    type: 'detector',
                    turnsRemaining: card.powerUpDuration || 3,
                    description: 'Can see all traps'
                });
                // Make all traps visible to this player temporarily
                this.placedTraps.forEach(trap => {
                    if (!trap.isVisible) {
                        trap.isVisible = true;
                    }
                });
                message = `${player.name} can now see all traps!`;
                break;
            case 'removal':
                // Remove a trap - implementation would need UI to select trap
                // For now, remove the first hidden trap
                const trapIndex = this.placedTraps.findIndex(t => !t.isVisible);
                if (trapIndex !== -1) {
                    const trap = this.placedTraps[trapIndex];
                    this.placedTraps.splice(trapIndex, 1);
                    message = `${player.name} removed a trap at position ${trap.position}!`;
                }
                else {
                    message = `${player.name} used Trap Removal, but no traps to remove!`;
                }
                break;
            case 'steal':
                // Steal a random card from opponent
                const opponent = Array.from(this.players.values()).find(p => p.id !== playerId);
                if (opponent && opponent.hand.length > 0) {
                    const randomIndex = Math.floor(Math.random() * opponent.hand.length);
                    const stolenCard = opponent.hand.splice(randomIndex, 1)[0];
                    if (player.hand.length < 5) {
                        player.hand.push(stolenCard);
                        message = `${player.name} stole a ${stolenCard.name} from ${opponent.name}!`;
                    }
                    else {
                        this.discardPile.push(stolenCard);
                        message = `${player.name} tried to steal but hand is full!`;
                    }
                }
                else {
                    message = `${player.name} tried to steal but opponent has no cards!`;
                }
                break;
            case 'undo':
                // Undo last move - move player back to previous position
                // This would need to track move history - for now just move back a few spaces
                if (player.token.position > 0) {
                    player.token.position = Math.max(0, player.token.position - 3);
                    message = `${player.name} undid their last move!`;
                }
                else {
                    message = `${player.name} is already at the start!`;
                }
                break;
            case 'mirror':
                // Reflect trap back - add effect for 1 turn
                player.activeEffects.push({
                    type: 'mirror',
                    turnsRemaining: 1,
                    description: 'Next trap is reflected'
                });
                message = `${player.name} will reflect the next trap!`;
                break;
        }
        player.hand.splice(cardIndex, 1);
        this.discardPile.push(card);
        this.lastAction = message;
        // Automatically end turn after using powerup
        this.endTurn();
        return { success: true, message: this.lastAction };
    }
    triggerSpaceEffect(player) {
        const space = this.board[player.token.position];
        if (!space || !space.effect)
            return;
        switch (space.effect.type) {
            case 'goose':
                const nextGoose = this.findNextGooseSpace(player.token.position);
                if (nextGoose) {
                    player.token.position = nextGoose.position;
                    this.lastAction += ` → Goose! Jumped to ${nextGoose.position}`;
                }
                break;
            case 'advance':
                player.token.position = Math.min(player.token.position + (space.effect.value || 0), this.boardLength);
                this.lastAction += ` → Bridge! Skipped ahead ${space.effect.value}`;
                break;
            case 'draw':
                for (let i = 0; i < (space.effect.value || 0); i++) {
                    const card = this.drawCard();
                    if (card && player.hand.length < 5)
                        player.hand.push(card);
                }
                this.lastAction += ` → Star! Drew ${space.effect.value} cards`;
                break;
            case 'swap':
                const opponent = this.getOpponent(player.id);
                if (opponent) {
                    const temp = player.token.position;
                    player.token.position = opponent.token.position;
                    opponent.token.position = temp;
                    this.lastAction += ` → Shuffle! Swapped positions with ${opponent.name}`;
                }
                break;
            case 'rest':
                player.skipNextTurn = true;
                for (let i = 0; i < 2; i++) {
                    const card = this.drawCard();
                    if (card && player.hand.length < 5)
                        player.hand.push(card);
                }
                this.lastAction += ` → Rest! Skips next turn but drew 2 cards`;
                break;
        }
    }
    checkTraps(player) {
        if (player.hasShield) {
            this.lastAction += ` 🛡️ Shield protected from traps!`;
            player.hasShield = false;
            return;
        }
        const trapIndex = this.placedTraps.findIndex(t => t.position === player.token.position && t.playerId !== player.id);
        if (trapIndex === -1)
            return;
        const trap = this.placedTraps[trapIndex];
        const trapCard = trap.trapCard;
        switch (trapCard.trapType) {
            case 'pitfall':
                player.token.position = Math.max(0, player.token.position - 5);
                this.lastAction += ` 🕳️ Fell in pitfall! Back 5 spaces`;
                break;
            case 'ice':
                player.skipNextTurn = true;
                this.lastAction += ` 🧊 Frozen! Skip next turn`;
                break;
            case 'swap':
                const opponent = this.getOpponent(player.id);
                if (opponent) {
                    const temp = player.token.position;
                    player.token.position = opponent.token.position;
                    opponent.token.position = temp;
                    this.lastAction += ` 🔄 Swap trap! Positions swapped`;
                }
                break;
            case 'net':
                player.skipNextTurn = true;
                this.lastAction += ` 🕸️ Caught in net! Skip next turn`;
                break;
            case 'bomb':
                player.token.position = 0;
                this.lastAction += ` 💣 BOOM! Back to start!`;
                break;
            case 'reverse':
                player.activeEffects.push({
                    type: 'reverse',
                    turnsRemaining: 1,
                    description: 'Next move is backward'
                });
                this.lastAction += ` ↩️ Reverse trap! Next move backward`;
                break;
        }
        // Remove triggered trap
        this.placedTraps.splice(trapIndex, 1);
    }
    findNextGooseSpace(currentPosition) {
        return this.board.find(space => space.position > currentPosition && space.type === 'goose') || null;
    }
    getOpponent(playerId) {
        for (const [id, player] of this.players) {
            if (id !== playerId)
                return player;
        }
        return null;
    }
    endTurn() {
        const currentPlayer = this.getCurrentPlayer();
        if (currentPlayer) {
            currentPlayer.isCurrentPlayer = false;
            // Check for double move effect
            const doubleMove = currentPlayer.activeEffects.find(e => e.type === 'double_move');
            if (doubleMove) {
                currentPlayer.activeEffects = currentPlayer.activeEffects.filter(e => e.type !== 'double_move');
                currentPlayer.isCurrentPlayer = true;
                this.phase = 'draw';
                this.lastAction = `${currentPlayer.name} takes another turn!`;
                return;
            }
        }
        // Move to next player
        this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.size;
        const nextPlayer = this.getPlayerByIndex(this.currentPlayerIndex);
        if (nextPlayer) {
            // Check if player should skip turn
            if (nextPlayer.skipNextTurn) {
                nextPlayer.skipNextTurn = false;
                this.lastAction = `${nextPlayer.name} skips their turn`;
                this.endTurn(); // Skip to next player
                return;
            }
            nextPlayer.isCurrentPlayer = true;
            // Draw phase - draw 1 card
            const card = this.drawCard();
            if (card && nextPlayer.hand.length < 5) {
                nextPlayer.hand.push(card);
            }
            // Update trap durations
            this.placedTraps = this.placedTraps.filter(trap => {
                trap.turnsRemaining--;
                return trap.turnsRemaining > 0;
            });
            // Update active effects
            for (const player of this.players.values()) {
                player.activeEffects = player.activeEffects.filter(effect => {
                    effect.turnsRemaining--;
                    return effect.turnsRemaining > 0;
                });
            }
        }
        this.turnNumber++;
        this.phase = 'action';
    }
    skipTurn(playerId) {
        const player = this.players.get(playerId);
        if (!player || !player.isCurrentPlayer) {
            return { success: false, message: 'Not your turn!' };
        }
        // Discard all cards in hand
        while (player.hand.length > 0) {
            const card = player.hand.pop();
            if (card) {
                this.discardPile.push(card);
            }
        }
        // Draw new cards (up to 3)
        for (let i = 0; i < 3; i++) {
            const card = this.drawCard();
            if (card && player.hand.length < 5) {
                player.hand.push(card);
            }
        }
        this.lastAction = `${player.name} discarded all cards and drew new ones`;
        this.endTurn();
        return { success: true, message: 'Skipped turn and drew new cards' };
    }
    getCurrentPlayer() {
        return this.getPlayerByIndex(this.currentPlayerIndex);
    }
    getPlayerByIndex(index) {
        let i = 0;
        for (const player of this.players.values()) {
            if (i === index)
                return player;
            i++;
        }
        return null;
    }
    getGameState() {
        return {
            gameId: this.gameId,
            players: Array.from(this.players.values()),
            currentPlayerId: this.getCurrentPlayer()?.id || '',
            board: this.board,
            placedTraps: this.placedTraps,
            boardLength: this.boardLength,
            turnNumber: this.turnNumber,
            phase: this.phase,
            gameStatus: this.phase === 'finished' ? 'finished' : (this.players.size === 2 ? 'playing' : 'waiting'),
            winnerId: this.phase === 'finished' ? this.getCurrentPlayer()?.id : undefined,
            lastAction: this.lastAction,
            deck: [] // Don't send full deck to clients
        };
    }
    canStart() {
        return this.players.size === 2;
    }
}
exports.GooseGame = GooseGame;
