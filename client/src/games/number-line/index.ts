/**
 * Number Line Duel - Game Module Entry Point
 * 
 * This module exports the game implementation for Number Line Duel.
 */

export { GameClient } from './NumberLineGame.js';
export { UIManager } from './NumberLineUI.js';

export const GAME_INFO = {
  id: 'number-line',
  name: 'Number Line Duel',
  description: 'Mathematical strategy game on a number line',
  minPlayers: 2,
  maxPlayers: 2
};
