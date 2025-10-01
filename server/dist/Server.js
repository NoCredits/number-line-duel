"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const Game_1 = require("./Game");
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});
const games = new Map();
io.on('connection', (socket) => {
    console.log('Player connected:', socket.id);
    socket.on('createGame', (playerName) => {
        const gameId = Math.random().toString(36).substr(2, 6).toUpperCase();
        const game = new Game_1.Game();
        game.addPlayer(socket.id, playerName);
        games.set(gameId, game);
        socket.join(gameId);
        socket.emit('gameCreated', { gameId, gameState: game.getState() });
        console.log(`Game ${gameId} created by ${playerName}`);
    });
    socket.on('joinGame', (gameId, playerName) => {
        const game = games.get(gameId);
        if (!game) {
            socket.emit('error', 'Game not found');
            return;
        }
        if (game.addPlayer(socket.id, playerName)) {
            socket.join(gameId);
            io.to(gameId).emit('gameStateUpdate', game.getState());
            console.log(`Player ${playerName} joined game ${gameId}`);
        }
        else {
            socket.emit('error', 'Game is full');
        }
    });
    socket.on('draftCard', (data) => {
        const game = games.get(data.gameId);
        if (game && game.draftCard(socket.id, data.cardId)) {
            io.to(data.gameId).emit('gameStateUpdate', game.getState());
        }
    });
    socket.on('playCard', (data) => {
        const game = games.get(data.gameId);
        if (game && game.playCard(socket.id, data.cardId)) {
            io.to(data.gameId).emit('gameStateUpdate', game.getState());
        }
    });
    socket.on('disconnect', () => {
        console.log('Player disconnected:', socket.id);
        // Clean up games when players disconnect
        games.forEach((game, gameId) => {
            if (game.getPlayer(socket.id)) {
                game.removePlayer(socket.id);
                io.to(gameId).emit('gameStateUpdate', game.getState());
                // Remove empty games
                if (game.getState().players.length === 0) {
                    games.delete(gameId);
                }
            }
        });
    });
});
const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
