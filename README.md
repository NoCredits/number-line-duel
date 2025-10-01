# Number Line Duel

A strategic math game where players compete to move a token to a target number on a number line using operation cards.

## Game Rules

1. **Objective**: Be the first to move the shared token to land exactly on the target number
2. **Setup**: 
   - Token starts at position 0
   - Target number is randomly generated (15-35)
   - Each player starts with 2 cards
   - 5 cards are placed in the central row
3. **Turn Actions**: On your turn, choose ONE action:
   - **Draft**: Take a card from the central row (it gets replaced)
   - **Play**: Play a card from your hand to move the token
4. **Winning**: First player to land the token exactly on the target wins
5. **Illegal Moves**: If a move would take the token below 0 or above 50, the move is illegal and your turn is skipped

## Cards Types
- **Add Cards**: +1, +2, +3, +4, +5 (most common)
- **Subtract Cards**: -1, -2, -3 (less common)
- **Multiply Cards**: ×2, ×3 (rare but powerful)

## Strategy Tips
- **Hate-drafting**: Take cards your opponent needs to block their winning moves
- **Hand management**: Balance keeping useful cards vs. taking cards to deny opponent
- **Timing**: Sometimes it's better to draft first, then play on the next turn

## Development Setup

### Prerequisites
- Node.js (v18 or higher)
- npm

### Installation
1. Clone the repository
2. Install dependencies for both server and client:
   ```bash
   npm run install:all
   ```

### Running the Game
1. **Development mode** (runs both server and client):
   ```bash
   npm run dev
   ```
   - Server runs on http://localhost:3001
   - Client runs on http://localhost:3000

2. **Production mode**:
   ```bash
   npm run build
   npm start
   ```

### Project Structure
```
number-line-duel/
├── server/          # Node.js + Socket.io server
│   ├── src/
│   │   ├── Card.ts      # Card class and deck generation
│   │   ├── Game.ts      # Game logic and state management
│   │   ├── Player.ts    # Player class
│   │   └── Server.ts    # Socket.io server setup
│   └── package.json
├── client/          # Vite + TypeScript client
│   ├── src/
│   │   ├── client.ts    # Main client application
│   │   ├── game.ts      # Client-side game logic
│   │   └── ui.ts        # UI management
│   ├── public/
│   │   ├── index.html   # Game interface
│   │   └── style.css    # Styling
│   └── package.json
├── shared/
│   └── types.ts     # Shared TypeScript interfaces
└── package.json     # Root package.json with convenience scripts
```

## Future Enhancements
- Add special card abilities
- Implement multiple token mechanics
- Add tournament mode
- Create AI opponents
- Add spectator mode