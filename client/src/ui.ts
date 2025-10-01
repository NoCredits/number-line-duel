import { GameState, Card as CardType } from '../../shared/types';

export class UIManager {
    private centralCardCallbacks: ((cardId: string) => void)[] = [];
    private handCardCallbacks: ((cardId: string) => void)[] = [];

    constructor() {
        this.initializeUI();
    }

    private initializeUI(): void {
        // Basic UI is already set up in HTML
    }

    showLobby(): void {
        this.showScreen('lobby');
    }

    showWaitingRoom(gameCode: string): void {
        document.getElementById('displayGameCode')!.textContent = gameCode;
        this.showScreen('waitingRoom');
    }

    showGameScreen(): void {
        this.showScreen('gameScreen');
    }

    showGameOver(isWinner: boolean): void {
        const resultElement = document.getElementById('gameResult')!;
        resultElement.textContent = isWinner ? 'You Win! 🎉' : 'You Lost! 💫';
        resultElement.style.color = isWinner ? '#4CAF50' : '#f44336';
        this.showScreen('gameOverScreen');
    }

    private showScreen(screenId: string): void {
        document.querySelectorAll('.screen').forEach(screen => {
            (screen as HTMLElement).classList.remove('active');
        });
        document.getElementById(screenId)!.classList.add('active');
    }

    updateGameState(gameState: GameState, playerId: string): void {
        this.showGameScreen();
        
        // Update basic game info
        document.getElementById('targetNumber')!.textContent = gameState.targetNumber.toString();
        document.getElementById('tokenPosition')!.textContent = gameState.tokenPosition.toString();
        
        // Update turn indicator
        const turnIndicator = document.getElementById('turnIndicator')!;
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

    private updateNumberLine(tokenPosition: number, targetNumber: number): void {
        const lineElement = document.querySelector('.line') as HTMLElement;
        const tokenElement = document.getElementById('gameToken') as HTMLElement;
        const targetMarker = document.getElementById('targetMarker') as HTMLElement;
        
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

    private updateCentralRow(cards: CardType[], isInteractive: boolean): void {
        const container = document.getElementById('centralCards')!;
        container.innerHTML = '';
        
        cards.forEach(card => {
            const cardElement = this.createCardElement(card, isInteractive);
            container.appendChild(cardElement);
        });
    }

    private updatePlayerHand(gameState: GameState, playerId: string): void {
        const player = gameState.players.find(p => p.id === playerId);
        const container = document.getElementById('playerHand')!;
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

    private calculateNewPosition(currentPosition: number, card: CardType): number {
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

    private updateOpponentInfo(gameState: GameState, playerId: string): void {
        const opponent = gameState.players.find(p => p.id !== playerId);
        const container = document.getElementById('opponentHand')!;
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

    private createCardElement(card: CardType, isInteractive: boolean): HTMLDivElement {
        const cardElement = document.createElement('div');
        cardElement.className = `card ${this.getCardType(card)}`;
        cardElement.textContent = card.display;
        cardElement.dataset.cardId = card.id;
        
        if (isInteractive) {
            cardElement.style.cursor = 'pointer';
            cardElement.addEventListener('click', () => this.handleCardClick(card.id));
        } else {
            cardElement.classList.add('disabled');
        }
        
        return cardElement;
    }

    private getCardType(card: CardType): string {
        if (card.operation === 'multiply') return 'multiply';
        return card.numericValue >= 0 ? 'positive' : 'negative';
    }

    private handleCardClick(cardId: string): void {
        // This will be connected to the callbacks by the GameClient
        this.centralCardCallbacks.forEach(callback => callback(cardId));
        this.handCardCallbacks.forEach(callback => callback(cardId));
    }

    onCentralCardClick(callback: (cardId: string) => void): void {
        this.centralCardCallbacks.push(callback);
    }

    onHandCardClick(callback: (cardId: string) => void): void {
        this.handCardCallbacks.push(callback);
    }
}