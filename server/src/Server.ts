import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { Game } from './Game';
import { GameListing, ChatMessage } from '../../shared/types';
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
const gameCreators = new Map<string, { playerName: string; createdAt: number }>();

// Helper function to get available games list
function getAvailableGames(): GameListing[] {
  const availableGames: GameListing[] = [];
  games.forEach((game, gameId) => {
    if (game.getState().gameStatus === 'waiting' && game.getState().players.length === 1) {
      const creatorInfo = gameCreators.get(gameId);
      if (creatorInfo) {
        availableGames.push({
          gameId,
          playerName: creatorInfo.playerName,
          createdAt: creatorInfo.createdAt
        });
      }
    }
  });
  return availableGames.sort((a, b) => b.createdAt - a.createdAt);
}

io.on('connection', (socket) => {
  console.log('Player connected:', socket.id);

  socket.on('createGame', (playerName: string) => {
    const gameId = Math.random().toString(36).substr(2, 6).toUpperCase();
    const game = new Game();
    game.addPlayer(socket.id, playerName);
    games.set(gameId, game);
    gameCreators.set(gameId, { playerName, createdAt: Date.now() });
    
    socket.join(gameId);
    socket.emit('gameCreated', { gameId, gameState: game.getState() });
    console.log(`Game ${gameId} created by ${playerName}`);
    
    // Broadcast updated games list to all clients in lobby
    io.emit('gamesList', getAvailableGames());
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
      
      // Remove from available games list once full
      io.emit('gamesList', getAvailableGames());
    } else {
      socket.emit('error', 'Game is full');
    }
  });

  socket.on('requestGamesList', () => {
    socket.emit('gamesList', getAvailableGames());
  });

  socket.on('chatMessage', (data: { gameId: string; message: string }) => {
    const game = games.get(data.gameId);
    if (game) {
      const player = game.getPlayer(socket.id);
      if (player) {
        const chatMessage: ChatMessage = {
          playerId: socket.id,
          playerName: player.name,
          message: data.message,
          timestamp: Date.now()
        };
        io.to(data.gameId).emit('chatMessage', chatMessage);
      }
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
          gameCreators.delete(gameId);
        }
      }
    });
    
    // Broadcast updated games list
    io.emit('gamesList', getAvailableGames());
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});