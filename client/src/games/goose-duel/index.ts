/**
 * Goose Duel - Game Module Entry Point
 * 
 * This module exports the game implementation for Goose Duel.
 */

export { GooseGameClient } from './GooseDuelGame.js';
export { GooseUIManager } from './GooseDuelUI.js';

export const GAME_INFO = {
  id: 'goose-duel',
  name: 'Goose Duel',
  description: 'Card-based board game with PowerUps',
  minPlayers: 2,
  maxPlayers: 2
};
