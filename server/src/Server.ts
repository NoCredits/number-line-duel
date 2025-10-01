import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { Game } from './Game';
import path from 'path';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*", // Allow all origins during development
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Serve static files from client dist in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../client/dist')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
  });
}

const games = new Map<string, Game>();

io.on('connection', (socket) => {
  console.log('Player connected:', socket.id);

  socket.on('createGame', (playerName: string) => {
    const gameId = Math.random().toString(36).substr(2, 6).toUpperCase();
    const game = new Game();
    game.addPlayer(socket.id, playerName);
    games.set(gameId, game);
    
    socket.join(gameId);
    socket.emit('gameCreated', { gameId, gameState: game.getState() });
    console.log(`Game ${gameId} created by ${playerName}`);
  });

  socket.on('joinGame', (gameId: string, playerName: string) => {
    const game = games.get(gameId);
    if (!game) {
      socket.emit('error', 'Game not found');
      return;
    }

    if (game.addPlayer(socket.id, playerName)) {
      socket.join(gameId);
      io.to(gameId).emit('gameStateUpdate', game.getState());
      console.log(`Player ${playerName} joined game ${gameId}`);
    } else {
      socket.emit('error', 'Game is full');
    }
  });

  socket.on('draftCard', (data: { gameId: string; cardId: string }) => {
    const game = games.get(data.gameId);
    if (game && game.draftCard(socket.id, data.cardId)) {
      io.to(data.gameId).emit('gameStateUpdate', game.getState());
    }
  });

  socket.on('playCard', (data: { gameId: string; cardId: string }) => {
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