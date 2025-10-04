# Skip Turn Feature Implementation

## Overview
Added a "Discard & Draw" feature that allows players to skip their turn when they have no playable movement cards.

## How It Works

### User Experience
1. When it's a player's turn and they have **zero movement cards** in their hand
2. A special animated "Discard & Draw" card appears in their hand
3. Clicking it shows a confirmation dialog
4. Upon confirmation:
   - All cards in hand are discarded
   - Player draws 3 new cards
   - Turn automatically ends
   - Next player's turn begins

### Technical Implementation

#### Client Side
- **goose-ui.ts**: 
  - Added `onSkipTurn` callback property
  - Modified `updateHand()` to detect when player has no movement cards
  - Renders special skip turn card with pulsing animation
  - Added `setOnSkipTurn()` setter method

- **goose-game.ts**:
  - Added `skipTurn()` method that emits `gooseSkipTurn` socket event
  - Wired up UI callback in `setupUICallbacks()`

- **style.css**:
  - Added `.skip-turn-card` styling with:
    - Purple gradient background (#667eea to #764ba2)
    - Gold border
    - Pulsing animation to draw attention
    - White text for high contrast

#### Server Side
- **GooseGame.ts**:
  - Added `skipTurn(playerId)` method that:
    - Validates it's the player's turn
    - Discards all cards to discard pile
    - Draws 3 new cards (up to hand limit of 5)
    - Calls `endTurn()` automatically
    - Returns success/failure response

- **Server.ts**:
  - Added `gooseSkipTurn` socket event handler
  - Emits game state update to all players
  - Emits action result confirmation

## Benefits
- **Prevents Game Deadlock**: Players can always take an action even with bad cards
- **Strategic Depth**: Players must decide whether to skip or try to place traps/use boosts
- **Clear Visual Feedback**: Animated card makes it obvious when skip is available
- **Smooth Flow**: Automatic turn ending keeps gameplay moving

## Testing
To test the feature:
1. Play until a player has no movement cards (only traps, boosts, powerups)
2. The purple "Discard & Draw" card should appear
3. Click it and confirm the dialog
4. Observe that cards are discarded, new cards drawn, and turn ends

## Files Modified
- `client/src/goose-ui.ts` - UI logic and card rendering
- `client/src/goose-game.ts` - Client game controller
- `client/style.css` - Visual styling
- `server/src/GooseGame.ts` - Game logic
- `server/src/Server.ts` - Socket event handling
