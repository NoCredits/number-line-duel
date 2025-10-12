import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { Game } from '../games/number-line/NumberLineGame';
import { GooseGame } from '../games/goose-duel/GooseGame';
import { ArtilleryGame } from '../games/artillery-duel/ArtilleryGame';
import { GameListing, ChatMessage } from '../../../shared/types/common';
import { FireData, TrajectoryPoint, Position } from '../../../shared/types/artillery-duel';
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
const artilleryQueue: Map<string, { socket: any; difficulty: 'easy' | 'medium' | 'hard' }> = new Map();
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

// Helper function to calculate projectile trajectory
function calculateTrajectory(
  angle: number,
  power: number,
  startPos: Position,
  terrain: number[],
  isPlayer1: boolean,
  wind?: { speed: number; direction: number }
): TrajectoryPoint[] {
  const GRAVITY = 9.81;
  const TIME_STEP = 0.1;
  const CANVAS_WIDTH = 1000;
  const CANVAS_HEIGHT = 600;

  const points: TrajectoryPoint[] = [];
  
  // Calculate nozzle position
  const terrainY = terrain[Math.floor(startPos.x)] || 500;
  const tankY = terrainY - 30;
  const barrelLength = 25;
  const adjustedAngle = isPlayer1 ? angle : (180 - angle);
  const barrelRad = adjustedAngle * Math.PI / 180;
  
  const nozzleX = startPos.x + Math.cos(barrelRad) * (barrelLength + 8);
  const nozzleY = tankY + 8 - Math.sin(barrelRad) * (barrelLength + 8);
  
  const rad = adjustedAngle * Math.PI / 180;
  const vx = power * Math.cos(rad) * 2;
  const vy = -power * Math.sin(rad) * 2;
  
  let windVx = 0;
  let windVy = 0;
  if (wind) {
    const windRad = wind.direction * Math.PI / 180;
    windVx = Math.cos(windRad) * wind.speed * 0.3;
    windVy = -Math.sin(windRad) * wind.speed * 0.1;
  }
  
  let t = 0;
  
  while (true) {
    t += TIME_STEP;
    
    const x = nozzleX + vx * t + windVx * t * t;
    const y = nozzleY + vy * t + 0.5 * GRAVITY * t * t + windVy * t * t;
    
    if (x >= CANVAS_WIDTH || x < 0 || y >= CANVAS_HEIGHT) {
      break;
    }
    
    if (x >= 0 && x < terrain.length && y >= terrain[Math.floor(x)]) {
      points.push({ x: Math.round(x), y: Math.round(y) });
      break;
    }
    
    points.push({ x: Math.round(x), y: Math.round(y) });
  }
  
  return points;
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

  // ==========================================
  // 🎯 ARTILLERY DUEL SOCKET HANDLERS
  // ==========================================

  socket.on('artilleryJoinQueue', (data: { difficulty?: 'easy' | 'medium' | 'hard' }) => {
    const difficulty = data?.difficulty || 'medium';
    console.log(`🎯 Player ${socket.id} joining Artillery queue (${difficulty})`);
    
    // Add to queue
    artilleryQueue.set(socket.id, { socket, difficulty });
    
    // Try to match with someone in the same difficulty
    let matched = false;
    artilleryQueue.forEach((queuedPlayer, playerId) => {
      if (playerId !== socket.id && queuedPlayer.difficulty === difficulty && !matched) {
        matched = true;
        
        // Create game
        const gameId = Math.random().toString(36).substr(2, 6).toUpperCase();
        const game = new ArtilleryGame(gameId, `artillery_${Date.now()}`, difficulty);
        
        // Add both players
        game.addPlayer(socket.id, `Player 1`);
        game.addPlayer(playerId, `Player 2`);
        
        // Join both to room
        socket.join(gameId);
        queuedPlayer.socket.join(gameId);
        
        // Remove from queue
        artilleryQueue.delete(socket.id);
        artilleryQueue.delete(playerId);
        
        // Store game
        artilleryGames.set(gameId, game);
        
        // Notify both players
        io.to(gameId).emit('artilleryMatchFound', {
          roomId: gameId,
          state: game.getGameState()
        });
        
        console.log(`🎯 Artillery match created: ${gameId} (${difficulty})`);
      }
    });
    
    if (!matched) {
      socket.emit('artilleryQueueJoined', {
        position: artilleryQueue.size,
        difficulty,
        message: 'Waiting for opponent...'
      });
    }
  });

  socket.on('artilleryFire', (data: FireData) => {
    const game = artilleryGames.get(data.gameId);
    if (!game) {
      socket.emit('error', { message: 'Game not found' });
      return;
    }

    const currentPlayer = game.getCurrentPlayer();
    if (currentPlayer.id !== socket.id) {
      socket.emit('error', { message: 'Not your turn' });
      return;
    }

    if (data.angle < 0 || data.angle > 90 || data.power < 1 || data.power > 100) {
      socket.emit('error', { message: 'Invalid angle or power' });
      return;
    }

    game.pauseTimer();
    const shotId = `${data.gameId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    game.setCurrentShotId(shotId);

    // Calculate trajectory
    const trajectory = calculateTrajectory(
      data.angle,
      data.power,
      currentPlayer.pos,
      game.getTerrain(),
      game.getGameState().turn === 'p1',
      game.getWind()
    );

    // Emit trajectory
    io.to(data.gameId).emit('artilleryShotFired', {
      trajectory,
      shooter: game.getGameState().turn,
      shooterId: currentPlayer.id,
      shotId,
      angle: data.angle,
      power: data.power
    });
  });

  socket.on('artilleryHitConfirmed', (data: { roomId: string; victim: 'p1' | 'p2'; damage: number; health: number; shotId?: string }) => {
    const game = artilleryGames.get(data.roomId);
    if (!game) return;

    const currentPlayer = game.getCurrentPlayer();
    if (currentPlayer.id !== socket.id) return;

    if (data.shotId && game.hasProcessedShot(data.shotId)) return;
    if (game.isWaitingForTurnEnd()) return;

    game.setWaitingForTurnEnd(true);
    if (data.shotId) game.addProcessedShotId(data.shotId);

    // Apply damage
    const victim = game.getGameState().players.find(p => 
      (data.victim === 'p1' && p === game.getGameState().players[0]) ||
      (data.victim === 'p2' && p === game.getGameState().players[1])
    );

    if (victim) {
      victim.health = data.health;
      
      io.to(data.roomId).emit('artilleryHit', {
        victim: data.victim,
        damage: data.damage,
        health: data.health,
        isDead: data.health <= 0
      });

      if (data.health <= 0) {
        const winner = game.checkGameOver();
        io.to(data.roomId).emit('artilleryGameOver', {
          winner,
          reason: 'elimination'
        });
        artilleryGames.delete(data.roomId);
        return;
      }
    }

    // Switch turns
    setTimeout(() => {
      const oldWind = { ...game.getWind() };
      game.switchTurn();
      const windChanged = oldWind.speed !== game.getWind().speed || oldWind.direction !== game.getWind().direction;

      io.to(data.roomId).emit('artilleryTurnChanged', {
        turn: game.getGameState().turn,
        windChanged,
        newWind: game.getWind()
      });

      io.to(data.roomId).emit('artilleryGameState', game.getGameState());
    }, 1000);
  });

  socket.on('artilleryMissConfirmed', (data: { roomId: string; shotId?: string }) => {
    const game = artilleryGames.get(data.roomId);
    if (!game) return;

    const currentPlayer = game.getCurrentPlayer();
    if (currentPlayer.id !== socket.id) return;

    if (data.shotId && game.hasProcessedShot(data.shotId)) return;
    if (game.isWaitingForTurnEnd()) return;

    game.setWaitingForTurnEnd(true);
    if (data.shotId) game.addProcessedShotId(data.shotId);

    // Switch turns
    setTimeout(() => {
      const oldWind = { ...game.getWind() };
      game.switchTurn();
      const windChanged = oldWind.speed !== game.getWind().speed || oldWind.direction !== game.getWind().direction;

      io.to(data.roomId).emit('artilleryTurnChanged', {
        turn: game.getGameState().turn,
        windChanged,
        newWind: game.getWind()
      });

      io.to(data.roomId).emit('artilleryGameState', game.getGameState());
    }, 1000);
  });

  socket.on('disconnect', () => {
    console.log('Player disconnected:', socket.id);
    
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

    // Clean up Artillery games when players disconnect
    artilleryQueue.delete(socket.id);
    
    artilleryGames.forEach((game, gameId) => {
      const state = game.getGameState();
      const hasPlayer = state.players.some(p => p.id === socket.id);
      
      if (hasPlayer) {
        artilleryGames.delete(gameId);
        io.to(gameId).emit('artilleryGameOver', {
          winner: null,
          reason: 'player_disconnected'
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