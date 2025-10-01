"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Game = void 0;
const Card_1 = require("./Card");
const Player_1 = require("./Player");
class Game {
    constructor() {
        this.players = [];
        this.centralRow = [];
        this.deck = [];
        this.tokenPosition = 0;
        this.gameStatus = 'waiting';
        this.maxPosition = 50;
        this.targetNumber = this.generateTargetNumber();
        this.initializeDeck();
    }
    generateTargetNumber() {
        return Math.floor(Math.random() * 21) + 15; // 15-35
    }
    initializeDeck() {
        this.deck = Card_1.Card.createDeck();
        this.drawCentralRow();
    }
    drawCentralRow() {
        while (this.centralRow.length < 5 && this.deck.length > 0) {
            this.centralRow.push(this.deck.pop());
        }
    }
    addPlayer(playerId, playerName) {
        if (this.players.length >= 2)
            return false;
        const player = new Player_1.Player(playerId, playerName);
        this.players.push(player);
        if (this.players.length === 2) {
            this.startGame();
        }
        return true;
    }
    removePlayer(playerId) {
        this.players = this.players.filter(p => p.id !== playerId);
        this.gameStatus = 'waiting';
    }
    startGame() {
        this.gameStatus = 'playing';
        this.players[0].isCurrentPlayer = true;
        // Deal initial hands
        this.players.forEach(player => {
            for (let i = 0; i < 2; i++) {
                if (this.deck.length > 0) {
                    player.addToHand(this.deck.pop());
                }
            }
        });
    }
    draftCard(playerId, cardId) {
        const player = this.players.find(p => p.id === playerId);
        const cardIndex = this.centralRow.findIndex(card => card.id === cardId);
        if (!player || !player.isCurrentPlayer || cardIndex === -1) {
            return false;
        }
        // Take card from central row
        const card = this.centralRow.splice(cardIndex, 1)[0];
        player.addToHand(card);
        // Replace with new card from deck
        if (this.deck.length > 0) {
            this.centralRow.push(this.deck.pop());
        }
        this.nextTurn();
        return true;
    }
    playCard(playerId, cardId) {
        const player = this.players.find(p => p.id === playerId);
        if (!player || !player.isCurrentPlayer || !player.hasCard(cardId)) {
            return false;
        }
        const card = player.removeFromHand(cardId);
        if (!card)
            return false;
        // Calculate new position
        const newPosition = card.applyOperation(this.tokenPosition);
        // Check for illegal moves (overshooting bounds)
        if (newPosition < 0 || newPosition > this.maxPosition) {
            // Return card to hand and skip turn
            player.addToHand(card);
            this.nextTurn();
            return false;
        }
        // Apply card operation
        this.tokenPosition = newPosition;
        // Check win condition
        if (this.tokenPosition === this.targetNumber) {
            this.gameStatus = 'finished';
            this.winnerId = playerId;
        }
        else {
            this.nextTurn();
        }
        return true;
    }
    nextTurn() {
        this.players.forEach(player => {
            player.isCurrentPlayer = !player.isCurrentPlayer;
        });
    }
    getState() {
        return {
            players: this.players,
            currentPlayerId: this.players.find(p => p.isCurrentPlayer)?.id || '',
            tokenPosition: this.tokenPosition,
            targetNumber: this.targetNumber,
            centralRow: this.centralRow,
            gameStatus: this.gameStatus,
            winnerId: this.winnerId,
            maxPosition: this.maxPosition
        };
    }
    getPlayer(playerId) {
        return this.players.find(p => p.id === playerId);
    }
}
exports.Game = Game;
