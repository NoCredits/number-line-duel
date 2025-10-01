export class UIManager {
    constructor() {
        this.centralCardCallbacks = [];
        this.handCardCallbacks = [];
        this.initializeUI();
    }
    initializeUI() {
        // Basic UI is already set up in HTML
    }
    showLobby() {
        this.showScreen('lobby');
    }
    showWaitingRoom(gameCode) {
        document.getElementById('displayGameCode').textContent = gameCode;
        this.showScreen('waitingRoom');
    }
    showGameScreen() {
        this.showScreen('gameScreen');
    }
    showGameOver(isWinner) {
        const resultElement = document.getElementById('gameResult');
        resultElement.textContent = isWinner ? 'You Win! 🎉' : 'You Lost! 💫';
        resultElement.style.color = isWinner ? '#4CAF50' : '#f44336';
        this.showScreen('gameOverScreen');
    }
    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(screenId).classList.add('active');
    }
    updateGameState(gameState, playerId) {
        this.showGameScreen();
        // Update basic game info
        document.getElementById('targetNumber').textContent = gameState.targetNumber.toString();
        document.getElementById('tokenPosition').textContent = gameState.tokenPosition.toString();
        // Update turn indicator
        const turnIndicator = document.getElementById('turnIndicator');
        const isMyTurn = gameState.currentPlayerId === playerId;
        turnIndicator.textContent = isMyTurn ? 'Your Turn!' : "Opponent's Turn";
        turnIndicator.className = `turn-indicator ${isMyTurn ? 'your-turn' : ''}`;
        // Update number line visualization
        this.updateNumberLine(gameState.tokenPosition, gameState.targetNumber);
        // Update cards
        this.updateCentralRow(gameState.centralRow, isMyTurn);
        this.updatePlayerHand(gameState, playerId);
        this.updateOpponentInfo(gameState, playerId);
    }
    updateNumberLine(tokenPosition, targetNumber) {
        const lineElement = document.querySelector('.line');
        const tokenElement = document.getElementById('gameToken');
        const targetMarker = document.getElementById('targetMarker');
        const lineRect = lineElement.getBoundingClientRect();
        const lineWidth = lineRect.width;
        const maxNumber = Math.max(targetNumber, tokenPosition) + 5;
        // Calculate positions as percentages
        const tokenPercent = (tokenPosition / maxNumber) * 100;
        const targetPercent = (targetNumber / maxNumber) * 100;
        tokenElement.style.left = `calc(${tokenPercent}% + 20px)`;
        targetMarker.style.left = `calc(${targetPercent}% + 20px)`;
        targetMarker.textContent = targetNumber.toString();
    }
    updateCentralRow(cards, isInteractive) {
        const container = document.getElementById('centralCards');
        container.innerHTML = '';
        cards.forEach(card => {
            const cardElement = this.createCardElement(card, isInteractive);
            container.appendChild(cardElement);
        });
    }
    updatePlayerHand(gameState, playerId) {
        const player = gameState.players.find(p => p.id === playerId);
        const container = document.getElementById('playerHand');
        container.innerHTML = '';
        if (player) {
            const isMyTurn = gameState.currentPlayerId === playerId;
            const maxPosition = gameState.maxPosition || 50;
            player.hand.forEach(card => {
                const cardElement = this.createCardElement(card, isMyTurn);
                // Check if this card would be an illegal move
                if (isMyTurn) {
                    const newPosition = this.calculateNewPosition(gameState.tokenPosition, card);
                    if (newPosition < 0 || newPosition > maxPosition) {
                        cardElement.classList.add('illegal-move');
                        cardElement.title = `This move would go to position ${newPosition}, which is out of bounds (0-${maxPosition})`;
                    }
                }
                container.appendChild(cardElement);
            });
        }
    }
    calculateNewPosition(currentPosition, card) {
        switch (card.operation) {
            case 'add':
                return currentPosition + card.numericValue;
            case 'subtract':
                return currentPosition - card.numericValue;
            case 'multiply':
                return currentPosition * card.numericValue;
            default:
                return currentPosition;
        }
    }
    updateOpponentInfo(gameState, playerId) {
        const opponent = gameState.players.find(p => p.id !== playerId);
        const container = document.getElementById('opponentHand');
        container.innerHTML = '';
        if (opponent) {
            // Show opponent's card count as facedown cards
            for (let i = 0; i < opponent.hand.length; i++) {
                const cardElement = document.createElement('div');
                cardElement.className = 'card disabled';
                cardElement.textContent = '?';
                container.appendChild(cardElement);
            }
        }
    }
    createCardElement(card, isInteractive) {
        const cardElement = document.createElement('div');
        cardElement.className = `card ${this.getCardType(card)}`;
        cardElement.textContent = card.display;
        cardElement.dataset.cardId = card.id;
        if (isInteractive) {
            cardElement.style.cursor = 'pointer';
            cardElement.addEventListener('click', () => this.handleCardClick(card.id));
        }
        else {
            cardElement.classList.add('disabled');
        }
        return cardElement;
    }
    getCardType(card) {
        if (card.operation === 'multiply')
            return 'multiply';
        return card.numericValue >= 0 ? 'positive' : 'negative';
    }
    handleCardClick(cardId) {
        // This will be connected to the callbacks by the GameClient
        this.centralCardCallbacks.forEach(callback => callback(cardId));
        this.handCardCallbacks.forEach(callback => callback(cardId));
    }
    onCentralCardClick(callback) {
        this.centralCardCallbacks.push(callback);
    }
    onHandCardClick(callback) {
        this.handCardCallbacks.push(callback);
    }
}
//# sourceMappingURL=ui.js.map