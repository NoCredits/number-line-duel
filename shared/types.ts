export interface Card {
  id: string;
  value: string; // e.g., "+3", "×2", "-1"
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
  maxPosition?: number; // Maximum position on the number line (default 50)
}

export type GameAction = 
  | { type: 'draft'; cardId: string }
  | { type: 'play'; cardId: string };