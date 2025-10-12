"use strict";
/**
 * Goose Duel - Server Module Entry Point
 *
 * This module exports the server-side game logic for Goose Duel.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GAME_CONFIG = exports.GooseGame = void 0;
var GooseGame_1 = require("./GooseGame");
Object.defineProperty(exports, "GooseGame", { enumerable: true, get: function () { return GooseGame_1.GooseGame; } });
exports.GAME_CONFIG = {
    id: 'goose-duel',
    name: 'Goose Duel',
    minPlayers: 2,
    maxPlayers: 2
};
