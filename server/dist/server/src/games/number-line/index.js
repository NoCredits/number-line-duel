"use strict";
/**
 * Number Line Duel - Server Module Entry Point
 *
 * This module exports the server-side game logic for Number Line Duel.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GAME_CONFIG = exports.Player = exports.Game = void 0;
var NumberLineGame_1 = require("./NumberLineGame");
Object.defineProperty(exports, "Game", { enumerable: true, get: function () { return NumberLineGame_1.Game; } });
var Player_1 = require("./Player");
Object.defineProperty(exports, "Player", { enumerable: true, get: function () { return Player_1.Player; } });
exports.GAME_CONFIG = {
    id: 'number-line',
    name: 'Number Line Duel',
    minPlayers: 2,
    maxPlayers: 2
};
