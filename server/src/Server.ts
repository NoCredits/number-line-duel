import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { Game } from './Game';
import { GooseGame } from './GooseGame';
import { ArtilleryGame } from './ArtilleryGame';
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
const gooseGames = new Map<string, GooseGame>();
const artilleryGames = new Map<string, ArtilleryGame>();
const artilleryQueue: string[] = []; // Queue of players waiting for artillery match
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

// Helper function to get available Goose games list
function getAvailableGooseGames(): GameListing[] {
  const availableGames: GameListing[] = [];
  gooseGames.forEach((game, gameId) => {
    const state = game.getGameState();
    if (state.gameStatus === 'waiting' && state.players.length === 1) {
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

  // ==========================================
  // 🦢 GOOSE GAME SOCKET HANDLERS
  // ==========================================

  socket.on('createGooseGame', (playerName: string) => {
    const gameId = Math.random().toString(36).substr(2, 6).toUpperCase();
    const game = new GooseGame(gameId);
    game.addPlayer(socket.id, playerName);
    gooseGames.set(gameId, game);
    gameCreators.set(gameId, { playerName, createdAt: Date.now() });
    
    socket.join(gameId);
    socket.emit('gooseGameCreated', { gameId, gameState: game.getGameState() });
    console.log(`Goose Game ${gameId} created by ${playerName}`);
    
    // Broadcast updated games list
    io.emit('gooseGamesList', getAvailableGooseGames());
  });

  socket.on('joinGooseGame', (gameId: string, playerName: string) => {
    console.log(`🎮 Player ${playerName} (${socket.id}) attempting to join Goose Game ${gameId}`);
    const game = gooseGames.get(gameId);
    if (!game) {
      console.log(`❌ Game ${gameId} not found`);
      socket.emit('error', 'Goose game not found');
      return;
    }

    console.log(`📊 Current game state:`, game.getGameState());
    
    if (game.addPlayer(socket.id, playerName)) {
      socket.join(gameId);
      const gameState = game.getGameState();
      
      console.log(`✅ Player ${playerName} added successfully`);
      console.log(`📊 New game state:`, gameState);
      
      // Send confirmation to the joining player first
      socket.emit('gooseGameJoined', { gameId, gameState });
      
      // Send state update to all players
      io.to(gameId).emit('gooseGameState', gameState);
      
      // If game is now ready (2 players), start the game
      if (gameState.gameStatus === 'playing') {
        console.log(`🎮 Game ${gameId} is now starting with 2 players!`);
        io.to(gameId).emit('gooseGameStarted', gameState);
      }
      
      console.log(`Player ${playerName} joined Goose Game ${gameId}`);
      
      // Remove from available games list once full
      io.emit('gooseGamesList', getAvailableGooseGames());
    } else {
      console.log(`❌ Failed to add player - game is full`);
      socket.emit('error', 'Goose game is full');
    }
  });

  socket.on('requestGooseGamesList', () => {
    socket.emit('gooseGamesList', getAvailableGooseGames());
  });

  socket.on('goosePlayMovement', (data: { gameId: string; cardId: string }) => {
    const game = gooseGames.get(data.gameId);
    if (!game) {
      socket.emit('gooseActionResult', { success: false, message: 'Game not found' });
      return;
    }

    const result = game.playMovementCard(socket.id, data.cardId);
    if (result.success) {
      io.to(data.gameId).emit('gooseGameState', game.getGameState());
      io.to(data.gameId).emit('gooseActionResult', result);
      
      // Check for game over
      const state = game.getGameState();
      if (state.gameStatus === 'finished') {
        io.to(data.gameId).emit('gooseGameOver', {
          winner: state.winnerId,
          reason: 'reached_finish'
        });
      }
    } else {
      socket.emit('gooseActionResult', result);
    }
  });

  socket.on('goosePlaceTrap', (data: { gameId: string; cardId: string; space: number }) => {
    const game = gooseGames.get(data.gameId);
    if (!game) {
      socket.emit('gooseActionResult', { success: false, message: 'Game not found' });
      return;
    }

    const result = game.placeTrap(socket.id, data.cardId, data.space);
    if (result.success) {
      io.to(data.gameId).emit('gooseGameState', game.getGameState());
      io.to(data.gameId).emit('gooseActionResult', result);
    } else {
      socket.emit('gooseActionResult', result);
    }
  });

  socket.on('gooseUseBoost', (data: { gameId: string; cardId: string; targetSpace?: number }) => {
    const game = gooseGames.get(data.gameId);
    if (!game) {
      socket.emit('gooseActionResult', { success: false, message: 'Game not found' });
      return;
    }

    const result = game.useBoost(socket.id, data.cardId, data.targetSpace);
    if (result.success) {
      io.to(data.gameId).emit('gooseGameState', game.getGameState());
      io.to(data.gameId).emit('gooseActionResult', result);
    } else {
      socket.emit('gooseActionResult', result);
    }
  });

  socket.on('gooseUsePowerUp', (data: { gameId: string; cardId: string; targetPlayerId?: string }) => {
    console.log(`⚡ PowerUp use requested for game ${data.gameId} by ${socket.id}`);
    const game = gooseGames.get(data.gameId);
    if (!game) {
      socket.emit('gooseActionResult', { success: false, message: 'Game not found' });
      return;
    }

    const result = game.usePowerUp(socket.id, data.cardId, data.targetPlayerId);
    console.log(`⚡ PowerUp result:`, result);
    
    if (result.success) {
      io.to(data.gameId).emit('gooseGameState', game.getGameState());
      io.to(data.gameId).emit('gooseActionResult', result);
    } else {
      socket.emit('gooseActionResult', result);
    }
  });

  socket.on('gooseEndTurn', (gameId: string) => {
    const game = gooseGames.get(gameId);
    if (!game) {
      socket.emit('gooseActionResult', { success: false, message: 'Game not found' });
      return;
    }

    const state = game.getGameState();
    if (state.currentPlayerId !== socket.id) {
      socket.emit('gooseActionResult', { success: false, message: 'Not your turn' });
      return;
    }

    game.endTurn();
    io.to(gameId).emit('gooseGameState', game.getGameState());
    io.to(gameId).emit('gooseActionResult', { 
      success: true, 
      message: 'Turn ended',
      action: 'endTurn'
    });
  });

  socket.on('gooseSkipTurn', (gameId: string) => {
    console.log(`🔄 Skip turn requested for game ${gameId} by ${socket.id}`);
    const game = gooseGames.get(gameId);
    if (!game) {
      socket.emit('gooseActionResult', { success: false, message: 'Game not found' });
      return;
    }

    const result = game.skipTurn(socket.id);
    console.log(`🔄 Skip turn result:`, result);
    
    io.to(gameId).emit('gooseGameState', game.getGameState());
    io.to(gameId).emit('gooseActionResult', { 
      success: result.success, 
      message: result.message,
      action: 'skipTurn'
    });
  });

  // Artillery Game Handlers
  socket.on('joinArtilleryQueue', () => {
    console.log('🎯 Player joined artillery queue:', socket.id);
    
    // Check if player is already in queue
    if (artilleryQueue.includes(socket.id)) {
      return;
    }

    artilleryQueue.push(socket.id);
    console.log('🎯 Queue length:', artilleryQueue.length);

    // Try to match players
    if (artilleryQueue.length >= 2) {
      const player1 = artilleryQueue.shift()!;
      const player2 = artilleryQueue.shift()!;
      
      const roomId = Math.random().toString(36).substr(2, 6).toUpperCase();
      const game = new ArtilleryGame(roomId, player1, player2);
      
      artilleryGames.set(roomId, game);
      
      // Add both players to room
      io.sockets.sockets.get(player1)?.join(roomId);
      io.sockets.sockets.get(player2)?.join(roomId);
      
      // Notify both players
      io.to(roomId).emit('artilleryMatchFound', {
        roomId,
        state: game.getGameState()
      });
      
      console.log(`🎯 Artillery match created: ${roomId}`);
      console.log(`🎯 Player 1: ${player1}`);
      console.log(`🎯 Player 2: ${player2}`);
      console.log(`🎯 Game state:`, game.getGameState());
    }
  });

  socket.on('artilleryFire', (data: { roomId: string; angle: number; power: number }) => {
    const { roomId, angle, power } = data;
    console.log(`🎯 Artillery fire from ${socket.id}: angle=${angle}, power=${power}`);
    
    const game = artilleryGames.get(roomId);
    if (!game) {
      socket.emit('error', 'Game not found');
      return;
    }

    // Check if it's player's turn
    const currentPlayer = game.getCurrentPlayer();
    if (currentPlayer.id !== socket.id) {
      socket.emit('error', 'Not your turn');
      return;
    }

    // Get player key (p1 or p2)
    const playerKey = game.getPlayerKey(socket.id);
    if (!playerKey) {
      socket.emit('error', 'Player not found');
      return;
    }

    // Get player position
    const playerPos = game.getPlayerPosition(socket.id);
    if (!playerPos) {
      socket.emit('error', 'Player position not found');
      return;
    }

    // Pause timer during shot
    game.pauseTimer();

    // Calculate trajectory with player1/player2 flag
    const isPlayer1 = playerKey === 'p1';
    const trajectory = game.calculateTrajectory(angle, power, playerPos.x, playerPos.y, isPlayer1);
    
    // Send trajectory to all players in room
    io.to(roomId).emit('artilleryShotFired', {
      trajectory,
      shooter: playerKey,
      shooterId: currentPlayer.id,
      angle,
      power
    });

    // Check for hit
    const hitPlayerKey = game.checkHit(trajectory);
    
    if (hitPlayerKey) {
      game.applyDamage(hitPlayerKey);
      const victim = game.getGameState().players[hitPlayerKey];
      
      io.to(roomId).emit('artilleryHit', {
        victim: hitPlayerKey,
        health: victim.health,
        damage: 20
      });

      // Check if game is over
      if (game.isGameOver()) {
        const winner = game.getWinner();
        if (winner) {
          io.to(roomId).emit('artilleryGameOver', {
            winner: game.checkGameOver(),
            winnerId: winner.id
          });
          
          // Clean up game after a delay
          setTimeout(() => {
            artilleryGames.delete(roomId);
          }, 5000);
        }
        return;
      }
    }

    // Next turn
    setTimeout(() => {
      game.nextTurn();
      io.to(roomId).emit('artilleryTurnChanged', {
        turn: game.getTurn(),
        currentPlayer: game.getCurrentPlayer().id,
        wind: game.getWind()
      });
    }, 500);
  });

  socket.on('disconnect', () => {
    console.log('Player disconnected:', socket.id);
    
    // Remove from artillery queue
    const queueIndex = artilleryQueue.indexOf(socket.id);
    if (queueIndex > -1) {
      artilleryQueue.splice(queueIndex, 1);
      console.log('🎯 Player removed from artillery queue');
    }

    // Clean up artillery games
    artilleryGames.forEach((game, roomId) => {
      const state = game.getGameState();
      const hasPlayer = state.players.p1.id === socket.id || state.players.p2.id === socket.id;
      if (hasPlayer) {
        // End the game if a player disconnects
        const winnerId = state.players.p1.id === socket.id ? state.players.p2.id : state.players.p1.id;
        const winnerKey = state.players.p1.id === socket.id ? 'p2' : 'p1';
        io.to(roomId).emit('artilleryGameOver', {
          winner: winnerKey,
          winnerId: winnerId
        });
        artilleryGames.delete(roomId);
        console.log(`🎯 Artillery game ${roomId} ended due to disconnect`);
      }
    });
    
    // Clean up Number Line Duel games when players disconnect
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
    
    // Clean up Goose games when players disconnect
    gooseGames.forEach((game, gameId) => {
      const state = game.getGameState();
      const hasPlayer = state.players.some(p => p.id === socket.id);
      
      if (hasPlayer) {
        // For now, remove the entire Goose game if any player disconnects
        // TODO: Implement graceful player removal/replacement
        gooseGames.delete(gameId);
        gameCreators.delete(gameId);
        io.to(gameId).emit('gooseGameOver', {
          winner: null,
          reason: 'Player disconnected'
        });
      }
    });
    
    // Broadcast updated games lists
    io.emit('gamesList', getAvailableGames());
    io.emit('gooseGamesList', getAvailableGooseGames());
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});