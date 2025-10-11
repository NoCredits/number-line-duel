/**
 * Goose Duel - Server Module Entry Point
 * 
 * This module exports the server-side game logic for Goose Duel.
 */

export { GooseGame } from './GooseGame';

export const GAME_CONFIG = {
  id: 'goose-duel',
  name: 'Goose Duel',
  minPlayers: 2,
  maxPlayers: 2
};
