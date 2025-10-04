# 🧪 Testing Goose Duel - Quick Guide

## 🔧 Fixes Applied

### 1. **Import Issues** ✅
- Changed import from `'./goose-ui'` to `'./goose-ui.js'` for runtime compatibility
- Fixed dynamic imports in client.ts

### 2. **Game Initialization** ✅
- Added `gameId` parameter to `GooseGameClient` constructor
- Wired up all socket event parameters properly
- Server now emits `gooseGameStarted` when second player joins

### 3. **UI Callbacks** ✅
- Connected all UI callbacks in `GooseGameClient`:
  - `setOnCardPlay` → `playMovementCard`
  - `setOnTrapPlace` → `placeTrap`
  - `setOnBoostUse` → `useBoost`
  - `setOnEndTurn` → `endTurn`

### 4. **Socket Events** ✅
- Fixed all socket emissions to include `gameId`
- Server properly handles game start and state broadcasting

## 🎮 How to Test

### Testing Locally (2 Browser Windows)

1. **Open First Browser Window**
   - Navigate to: http://localhost:3000
   - Click "🦢 Goose Duel" button
   - Enter name: "Player 1"
   - Click "Create Game"
   - **Copy the game code** (e.g., "ABC123")

2. **Open Second Browser Window (Incognito/Private)**
   - Navigate to: http://localhost:3000
   - Click "🦢 Goose Duel" button
   - Enter name: "Player 2"
   - Paste the game code
   - Click "Join Game"

3. **Game Should Start!**
   - Both windows should show the Goose game board
   - Player 1 starts (indicated by green glow)
   - You should see:
     - 🎴 Your hand of 3 cards at bottom
     - 🎯 50-space board track
     - 👥 Player info cards showing positions
     - 🔘 "End Turn" button

### Basic Gameplay Test

**Player 1's Turn:**
1. Click a movement card (e.g., "Move 3 🚶")
2. Token should move forward
3. Click "End Turn"

**Player 2's Turn:**
1. Click a movement card
2. Token moves forward
3. Click "End Turn"

**Continue alternating** until someone reaches space 50!

### Advanced Features to Test

#### Trap Placement
1. Click a trap card (e.g., "Pitfall 🕳️")
2. Click "Place Trap" button
3. Click a board space to place trap
4. When opponent lands there, trap triggers!

#### Boost Cards
1. Click a boost card (e.g., "Sprint ⚡")
2. Click "Use Boost" button
3. Effect applies (extra movement, shield, etc.)

#### Special Spaces
- **🦢 Goose** (every 9th): Jump ahead to next goose
- **🌉 Bridge** (space 6): Skip to space 12
- **⭐ Star** (space 19): Draw 2 extra cards
- **🔄 Swap** (space 31): Swap positions
- **😴 Rest** (space 42): Skip next turn

## 🐛 What to Watch For

### Expected Behaviors
- ✅ Game code displays after creation
- ✅ Waiting room shows until second player joins
- ✅ Game screen appears for both players simultaneously
- ✅ Turn indicator shows active player
- ✅ Cards can be clicked and selected
- ✅ Action buttons appear based on card type
- ✅ Tokens move on board
- ✅ Notifications appear for actions
- ✅ Game ends when player reaches space 50

### Potential Issues to Report
- ❌ Game doesn't start after second player joins
- ❌ Cards not clickable
- ❌ Tokens not moving
- ❌ Actions don't trigger
- ❌ Console errors (check F12 Developer Tools)

## 🔍 Debugging Tips

### Check Browser Console (F12)
Look for:
- Socket connection messages: "Player connected"
- Game state updates
- Any red error messages

### Check Server Console
Should see:
```
Goose Game ABC123 created by Player 1
Player Player 2 joined Goose Game ABC123
```

### Common Issues & Solutions

**Issue**: "Cannot find module './goose-ui'"
- **Solution**: Already fixed - restart dev server if needed

**Issue**: Cards not doing anything when clicked
- **Solution**: Check browser console for errors
- **Verify**: Game status is 'playing' not 'waiting'

**Issue**: Turn doesn't change
- **Solution**: Click "End Turn" button
- **Verify**: You're clicking during your turn (green glow)

**Issue**: Game doesn't start when second player joins
- **Solution**: Check both browser consoles
- **Verify**: Server emitted 'gooseGameStarted' event

## 📊 Testing Checklist

- [ ] Can create Goose game
- [ ] Game code displays
- [ ] Second player can join with code
- [ ] Both players see waiting room
- [ ] Game screen appears for both players
- [ ] Turn indicator shows correctly
- [ ] Can click and select cards
- [ ] Movement cards move tokens
- [ ] Can place traps on board
- [ ] Can use boost cards
- [ ] Special spaces trigger effects
- [ ] Traps trigger when opponent lands on them
- [ ] Turn changes after "End Turn"
- [ ] Game ends when reaching space 50
- [ ] Winner announcement appears

## 🚀 Next Steps After Testing

If basic gameplay works:
1. Test all 20+ card types
2. Test all special board spaces
3. Test trap collision detection
4. Test win condition
5. Test player disconnect handling
6. Test mobile responsiveness

If issues found:
1. Note specific steps to reproduce
2. Check browser console for errors
3. Check server console for backend errors
4. Report with screenshots if possible

---

**Status**: ✅ All known issues fixed - Ready for testing!

**Last Updated**: After fixing import issues, game initialization, and UI callbacks
