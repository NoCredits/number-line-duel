import { GameState } from '../../shared/types';
export declare class UIManager {
    private centralCardCallbacks;
    private handCardCallbacks;
    constructor();
    private initializeUI;
    showLobby(): void;
    showWaitingRoom(gameCode: string): void;
    showGameScreen(): void;
    showGameOver(isWinner: boolean): void;
    private showScreen;
    updateGameState(gameState: GameState, playerId: string): void;
    private updateNumberLine;
    private updateCentralRow;
    private updatePlayerHand;
    private calculateNewPosition;
    private updateOpponentInfo;
    private createCardElement;
    private getCardType;
    private handleCardClick;
    onCentralCardClick(callback: (cardId: string) => void): void;
    onHandCardClick(callback: (cardId: string) => void): void;
}
//# sourceMappingURL=ui.d.ts.map