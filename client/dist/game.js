export class GameClient {
    constructor(socket, ui) {
        this.socket = socket;
        this.ui = ui;
        this.currentGameId = '';
        this.playerId = socket.id || '';
        this.setupCardEventListeners();
        // Update playerId when socket connects
        socket.on('connect', () => {
            this.playerId = socket.id || '';
        });
    }
    setGameId(gameId) {
        this.currentGameId = gameId;
    }
    updateGameState(gameState) {
        this.currentGameState = gameState;
        this.ui.updateGameState(gameState, this.playerId);
        if (gameState.gameStatus === 'finished') {
            this.ui.showGameOver(gameState.winnerId === this.playerId);
        }
    }
    setupCardEventListeners() {
        // Central row card clicks (drafting)
        this.ui.onCentralCardClick((cardId) => {
            if (!this.currentGameState || this.currentGameState.currentPlayerId !== this.playerId)
                return;
            this.socket.emit('draftCard', {
                gameId: this.currentGameId,
                cardId: cardId
            });
        });
        // Hand card clicks (playing)
        this.ui.onHandCardClick((cardId) => {
            if (!this.currentGameState || this.currentGameState.currentPlayerId !== this.playerId)
                return;
            this.socket.emit('playCard', {
                gameId: this.currentGameId,
                cardId: cardId
            });
        });
    }
}
//# sourceMappingURL=game.js.map