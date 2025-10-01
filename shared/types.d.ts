export interface Card {
    id: string;
    value: string;
    display: string;
    numericValue: number;
    operation: 'add' | 'multiply' | 'subtract';
}
export interface Player {
    id: string;
    name: string;
    hand: Card[];
    isCurrentPlayer: boolean;
}
export interface GameState {
    players: Player[];
    currentPlayerId: string;
    tokenPosition: number;
    targetNumber: number;
    centralRow: Card[];
    gameStatus: 'waiting' | 'playing' | 'finished';
    winnerId?: string;
    maxPosition?: number;
}
export type GameAction = {
    type: 'draft';
    cardId: string;
} | {
    type: 'play';
    cardId: string;
};
//# sourceMappingURL=types.d.ts.map