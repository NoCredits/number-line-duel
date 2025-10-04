# 🦢 Modern Goose Duel - Game Design Document

## 🎮 Overview
A modern reimagining of the classic Game of Goose with strategic trap-laying, two independent tokens, and competitive racing mechanics.

## 🎯 Core Concept
- Two players race their tokens along a winding track (50-100 spaces)
- Each player controls their own token independently
- Players can lay traps, blocks, and bonuses on spaces
- Special event spaces trigger powerful effects
- First to reach the finish line wins!

## 🎲 Game Mechanics

### Turn Structure
1. **Draw Phase**: Draw 1-2 action cards
2. **Action Phase**: Play trap/boost cards OR use power-ups
3. **Movement Phase**: Roll dice (or play movement card) to advance
4. **Event Phase**: Trigger any space effects where you land

### Movement System
- **Dice Roll**: 1-6 spaces (or card-based movement)
- **Movement Cards**: Fixed movement (3, 4, 5, 6, 8, 10 spaces)
- **Combo Moves**: Chain multiple small moves

### Card Types

#### 🎴 Trap Cards
- **Pitfall Trap** 🕳️ - Send opponent back 5 spaces
- **Ice Block** 🧊 - Freeze opponent for 1 turn
- **Swap Portal** 🔄 - Force position swap with opponent
- **Reverse** ↩️ - Opponent moves backward next turn
- **Net Trap** 🕸️ - Opponent loses next turn
- **Bomb** 💣 - Sends opponent back to start (rare, powerful)

#### ⚡ Boost Cards
- **Sprint** 🏃 - Move +3 extra spaces
- **Teleport** ✨ - Jump to any space within 10
- **Double Move** ⏭️ - Take two turns in a row
- **Shield** 🛡️ - Immune to next trap
- **Goose Boost** 🦢 - Jump to next Goose space

#### 🎁 Power-Up Cards
- **Trap Detector** 🔍 - See all hidden traps for 3 turns
- **Trap Removal** 🧹 - Remove 1 trap from the board
- **Steal Card** 🃏 - Take a random card from opponent
- **Undo** ↶ - Reverse last move
- **Mirror** 🪞 - Reflect trap back to opponent

### Special Board Spaces

#### Fixed Event Spaces (Every 5-10 spaces)
- **🦢 Goose Space** - Jump forward to next Goose space
- **🌉 Bridge** - Skip ahead 5 spaces
- **🌀 Whirlpool** - Return to previous checkpoint
- **⭐ Star Space** - Draw 2 extra cards
- **🎲 Dice Space** - Roll again
- **🔀 Shuffle** - Swap positions with opponent
- **💤 Rest Stop** - Skip 1 turn but draw 2 cards
- **🎯 Checkpoint** - Safe zone, immune to traps

#### Dynamic Spaces
- **Player-Placed Traps** - Visible or hidden (card type dependent)
- **Temporary Boosts** - Last 3 turns
- **Mine Fields** - Placed by players

## 🎨 Visual Design

### Board Layout
```
[START] → → → 🦢 → → 🌉 → → → 🦢 → → ⭐ → → 🔀 → → 🦢 → → 💤 → → 🎯 → [FINISH]
         ↑                    ↓
         └──── winding path ──┘
```

### Token Design
- **Player 1**: 🔵 Blue Knight/Runner
- **Player 2**: 🔴 Red Knight/Runner
- Animated movement along the track
- Trail effects when moving
- Impact animations for traps

### Visual Effects
- **Trap Trigger**: Explosion/trap animation
- **Boost**: Sparkle/speed lines
- **Swap**: Portal/teleport effect
- **Freeze**: Ice crystals
- **Goose Jump**: Flying animation

## 🎲 Game Balance

### Starting Conditions
- Both players start at position 0
- Each player starts with 3 random cards
- 5-card hand limit
- Draw 1 card per turn (2 on Star space)

### Card Distribution
- **40% Movement Cards** (3-10 spaces)
- **30% Trap Cards** (various effects)
- **20% Boost Cards** (speed/position)
- **10% Power-Up Cards** (special abilities)

### Trap Rules
- Maximum 3 active traps per player on board
- Traps expire after 5 turns if not triggered
- Cannot place trap on occupied space
- Cannot place trap on special event spaces
- Own traps don't affect you

### Bumping Rule
- Landing on opponent's space: Send them back 3 spaces
- Opponent landing on you: They bounce back 3 spaces
- Creates blocking strategy

## 🏆 Win Conditions

### Primary
- First player to reach or pass the FINISH space wins

### Alternative (Optional Modes)
- **Time Attack**: Most progress in 10 minutes
- **Survival**: Last player standing after trap damage
- **Collection**: Gather special tokens along the way

## 🎮 UI/UX Design

### Main Game Screen
```
┌─────────────────────────────────────────────┐
│  Player 1: 🔵 Pos 23  ❤️❤️❤️  🃏 x5        │
│  Player 2: 🔴 Pos 18  ❤️❤️    🃏 x4        │
├─────────────────────────────────────────────┤
│                                             │
│     [Winding Track Visual Board]            │
│                                             │
├─────────────────────────────────────────────┤
│  Your Hand: [Card] [Card] [Card] [Card]    │
│                                             │
│  [Play Card] [Roll Dice] [End Turn]        │
└─────────────────────────────────────────────┘
```

### Card Display
- Hover to see full effect description
- Drag-and-drop to play cards
- Animated card flip on draw
- Glow effect on playable cards

## 🔧 Technical Implementation Plan

### Phase 1: Core Game Loop ✅
- [x] Basic game state management
- [ ] Turn system implementation
- [ ] Card deck and hand management
- [ ] Movement system

### Phase 2: Board & Tokens
- [ ] Dynamic board generation
- [ ] Token movement animation
- [ ] Special space implementation
- [ ] Position tracking

### Phase 3: Card System
- [ ] Card types and effects
- [ ] Trap placement system
- [ ] Boost application
- [ ] Power-up abilities

### Phase 4: Interactions
- [ ] Trap triggering
- [ ] Bumping mechanics
- [ ] Special space events
- [ ] Win condition checking

### Phase 5: Polish & Effects
- [ ] Animations for all actions
- [ ] Sound effects
- [ ] Particle effects
- [ ] Victory screen

## 🎯 Future Enhancements

### Additional Features
- **Multiple Board Themes**: Space, Medieval, Cyberpunk
- **Character Selection**: Different avatars with unique abilities
- **Daily Challenges**: Special rule modifications
- **Tournament Mode**: Best of 3/5 matches
- **Spectator Mode**: Watch other players' games
- **Replay System**: Review past games
- **Achievement System**: Unlock cards/themes

### Advanced Mechanics
- **Weather Effects**: Random board modifiers
- **Team Mode**: 2v2 racing
- **Handicap System**: Balance for skill differences
- **Custom Boards**: User-created tracks
- **Card Crafting**: Combine cards for new effects

---

**Status**: Ready for implementation!
**Target**: Transform Number Line Duel → Goose Duel
**Timeline**: Iterative development in phases
