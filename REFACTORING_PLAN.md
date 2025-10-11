# 🏗️ Modular Architecture Refactoring Plan

## 🎯 Goal
Transform the codebase into a scalable, modular structure where each game is self-contained and new games can be easily added.

## 📁 New Structure

```
client/
├── src/
│   ├── core/                    # Core system files
│   │   ├── App.ts              # Main application coordinator (renamed from client.ts)
│   │   ├── MenuManager.ts      # Menu system & navigation
│   │   └── AuthManager.ts      # Login/authentication
│   │
│   ├── games/                   # Game modules (each self-contained)
│   │   ├── number-line/
│   │   │   ├── NumberLineGame.ts
│   │   │   ├── NumberLineUI.ts
│   │   │   └── index.ts        # Export entry point
│   │   │
│   │   └── goose-duel/
│   │       ├── GooseDuelGame.ts
│   │       ├── GooseDuelUI.ts
│   │       └── index.ts
│   │
│   └── shared/                  # Shared utilities
│       └── types.ts
│
├── styles/                      # Modular CSS
│   ├── core.css                # Core system styles
│   ├── number-line.css         # Number Line specific
│   └── goose-duel.css          # Goose Duel specific
│
└── index.html                   # Main HTML

server/
├── src/
│   ├── core/
│   │   └── Server.ts           # Main server coordinator
│   │
│   └── games/
│       ├── number-line/
│       │   ├── NumberLineGame.ts
│       │   └── Player.ts
│       │
│       └── goose-duel/
│           ├── GooseGame.ts
│           └── GoosePlayer.ts

shared/
├── types/
│   ├── common.ts               # Common interfaces
│   ├── number-line.ts          # Number Line types
│   └── goose-duel.ts           # Goose Duel types
```

## 📝 Step-by-Step Migration

### Phase 1: Prepare (✅ DONE)
- [x] Create new directory structure
- [x] Backup current working code

### Phase 2: Split Types
- [ ] Extract common types to `shared/types/common.ts`
- [ ] Move Number Line types to `shared/types/number-line.ts`
- [ ] Move Goose Duel types to `shared/types/goose-duel.ts`

### Phase 3: Server-Side Refactor
- [ ] Move `Game.ts` → `server/src/games/number-line/NumberLineGame.ts`
- [ ] Move `Player.ts` → `server/src/games/number-line/Player.ts`
- [ ] Move `GooseGame.ts` → `server/src/games/goose-duel/GooseGame.ts`
- [ ] Update imports in `server/src/core/Server.ts`

### Phase 4: Client-Side Refactor
- [ ] Move `game.ts` → `client/src/games/number-line/NumberLineGame.ts`
- [ ] Move `ui.ts` → `client/src/games/number-line/NumberLineUI.ts`
- [ ] Move `goose-game.ts` → `client/src/games/goose-duel/GooseDuelGame.ts`
- [ ] Move `goose-ui.ts` → `client/src/games/goose-duel/GooseDuelUI.ts`
- [ ] Create index.ts files for each game module

### Phase 5: Extract Core Logic
- [ ] Rename `client.ts` → `client/src/core/App.ts`
- [ ] Extract menu logic → `client/src/core/MenuManager.ts`
- [ ] Extract auth logic → `client/src/core/AuthManager.ts`

### Phase 6: Split CSS
- [ ] Extract core styles → `client/styles/core.css`
- [ ] Extract Number Line styles → `client/styles/number-line.css`
- [ ] Extract Goose Duel styles → `client/styles/goose-duel.css`
- [ ] Update HTML to import all CSS files

### Phase 7: Test & Validate
- [ ] Test Number Line game
- [ ] Test Goose Duel game
- [ ] Test login flow
- [ ] Test menu navigation
- [ ] Test game switching

### Phase 8: Cleanup
- [ ] Delete old files from `client/src/`
- [ ] Delete old files from `server/src/`
- [ ] Update documentation

## 🎮 Game Module Pattern

Each game module will follow this pattern:

### Client Side
```typescript
// games/my-game/index.ts
export { MyGameClient } from './MyGameGame';
export { MyGameUI } from './MyGameUI';
export const GAME_INFO = {
    id: 'my-game',
    name: 'My Game',
    emoji: '🎮',
    description: 'An awesome game'
};
```

### Server Side
```typescript
// games/my-game/MyGame.ts
export class MyGame {
    // Game logic
}
```

## 🔄 Dynamic Game Loading

The core App will dynamically load games:

```typescript
// core/App.ts
async loadGame(gameId: string) {
    switch(gameId) {
        case 'number-line':
            const { NumberLineGame, NumberLineUI } = await import('../games/number-line/index.js');
            // Initialize game
            break;
        case 'goose-duel':
            const { GooseDuelGame, GooseDuelUI } = await import('../games/goose-duel/index.js');
            // Initialize game
            break;
    }
}
```

## ✨ Benefits

1. **Scalability**: Add new games by creating a new folder
2. **Maintainability**: Each game is self-contained
3. **Code Reuse**: Shared utilities in one place
4. **Clear Structure**: Easy to understand and navigate
5. **Testing**: Test games independently
6. **Team Work**: Different developers can work on different games

## 🚀 Adding New Games (Future)

To add a new game:

1. Create `client/src/games/new-game/` folder
2. Create `server/src/games/new-game/` folder
3. Create types in `shared/types/new-game.ts`
4. Add menu option in `core/MenuManager.ts`
5. Add route in `core/App.ts`
6. Done! ✨

## 📌 Important Notes

- Keep all files working during refactoring
- Test after each phase
- Update imports incrementally
- Keep backup of working code
- Don't break existing functionality
