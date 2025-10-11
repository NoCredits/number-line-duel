/**
 * Number Line Duel - Server Module Entry Point
 * 
 * This module exports the server-side game logic for Number Line Duel.
 */

export { Game } from './NumberLineGame';
export { Player } from './Player';

export const GAME_CONFIG = {
  id: 'number-line',
  name: 'Number Line Duel',
  minPlayers: 2,
  maxPlayers: 2
};
