# Artillery Duel - Quick Visual Reference

## 🎮 Main Menu
The main menu now has THREE game cards:

```
┌─────────────────────────────────────────────────────────────┐
│                   Welcome to Game Arena!                     │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   🎯 Number  │  │   🦢 Modern  │  │  💣 Artillery│     │
│  │   Line Duel  │  │  Goose Duel  │  │     Duel     │     │
│  │              │  │              │  │              │     │
│  │ Math-based   │  │ Board game   │  │ Turn-based   │     │
│  │ card battles │  │ with traps   │  │ tank combat  │     │
│  │              │  │              │  │              │     │
│  │   [PLAY]     │  │   [PLAY]     │  │   [PLAY]     │  ← NEW! │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

## 🎯 Artillery Duel Game Screen

```
┌─────────────────────────────────────────────────────────────────┐
│ ☰ Menu                    ARTILLERY DUEL                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐│
│ │  ☁️  ☁️     Sky                              ☁️  ☁️          ││
│ │                                                             ││
│ │                                                             ││
│ │      🔵 ←── Your Tank                    Enemy Tank ──→ 🔴  ││
│ │       ▮                                               ▮     ││
│ │    ███████                    /\  Hills            ███████  ││
│ │   ▓▓▓▓▓▓▓▓▓▓              ▓▓▓▓▓▓▓▓▓▓▓           ▓▓▓▓▓▓▓▓▓▓ ││
│ │  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓      ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓││
│ └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│ ┌──────────────────────┐  ┌──────────────────────┐            │
│ │ 👤 YOU               │  │ 👤 OPPONENT          │            │
│ │ Health: ███████░░░   │  │ Health: █████░░░░░   │            │
│ │        70/100        │  │        50/100        │            │
│ └──────────────────────┘  └──────────────────────┘            │
│                                                                 │
│ 🎯 Your Turn!                                                   │
│                                                                 │
│ Angle: [45]°  (0-90)        Power: [75]  (1-100)              │
│                                                                 │
│                    [🔥 FIRE! 🔥]                               │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐│
│ │ 📜 Game Log:                                                ││
│ │ • Match found! Get ready for battle! 💥                     ││
│ │ • Wind: +3 💨 (pushes right)                                ││
│ │ • Your turn! Aim carefully! 🎯                              ││
│ │ • You fired! Angle: 45°, Power: 75                         ││
│ │ • 💥 HIT! Enemy lost 20 health!                            ││
│ │ • Enemy's turn...                                           ││
│ └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

## 🔥 Projectile Animation

When you fire, you'll see a smooth animation:

```
Frame 1:     Frame 2:     Frame 3:     Frame 4:
   🔵           🔵           🔵           🔵
    \            \            \            \
     ●            ·●           ··●          ···●
                   \            \            \
                    \            ●            ·●
                                  \            \
                                   \            ●  💥 BOOM!
```

## 💥 Hit Detection

When a projectile hits a tank:
1. **Impact Animation**: Red explosion effect at hit point
2. **Health Update**: Victim's health bar decreases by 20
3. **Log Message**: "💥 HIT! [Player] lost 20 health!"
4. **Turn Switch**: Next player's turn begins
5. **Wind Change**: Wind adjusts slightly (shown in UI)

## 🏆 Victory Screen

When a player's health reaches 0:

```
┌─────────────────────────────────────────┐
│         🎉 GAME OVER! 🎉                │
│                                         │
│       You destroyed the enemy tank!     │
│                                         │
│           💥💥💥💥💥                       │
│                                         │
│         Final Score:                    │
│         Your Health: 60                 │
│         Enemy Health: 0                 │
│                                         │
│        [Back to Main Menu]              │
└─────────────────────────────────────────┘
```

## 🎮 Controls Summary

| Control | Description | Range |
|---------|-------------|-------|
| **Angle Slider** | Projectile launch angle | 0° (flat) to 90° (straight up) |
| **Power Slider** | Launch velocity | 1 (weak) to 100 (maximum) |
| **Fire Button** | Launch projectile | Only enabled on your turn |
| **Menu Button** | Return to main menu | Always available |

## 🌪️ Wind Effects

Wind affects projectile trajectory:
- **Positive Wind** (e.g., +5): Pushes projectile RIGHT ➡️
- **Negative Wind** (e.g., -3): Pushes projectile LEFT ⬅️
- **Zero Wind**: No horizontal effect
- Wind changes slightly each turn for variety!

## 📊 Gameplay Tips

1. **High Angle + High Power**: Lob shots over hills
2. **Low Angle + Medium Power**: Fast direct shots
3. **Watch the Wind**: Adjust aim to compensate
4. **Near Miss**: Try adjusting angle by 5-10°
5. **Distance Matters**: Closer targets need less power

## 🎨 Color Coding

- **Blue Tank** 🔵: Your tank (left side)
- **Red Tank** 🔴: Enemy tank (right side)
- **Green Health** 🟢: Above 60 health
- **Yellow Health** 🟡: 30-60 health
- **Red Health** 🔴: Below 30 health (critical!)
- **Orange Fire Button** 🟠: Ready to shoot
- **Gray Fire Button** ⚪: Not your turn

## 🚀 Matchmaking

Artillery Duel uses automatic matchmaking:

```
1. Click "Artillery Duel" card
   ↓
2. "Searching for opponent..." 🔍
   ↓
3. Match Found! 🎯
   ↓
4. Game Starts Immediately! 💥
```

No lobby codes needed - just click and play!

## 🔧 Technical Notes

- **Physics Engine**: Real gravity simulation (0.5 g)
- **Server-Side**: All calculations done on server (fair play!)
- **Canvas Rendering**: 1000x600 pixel game board
- **Smooth Animation**: 60 FPS trajectory rendering
- **Real-Time**: Socket.io for instant updates
- **Auto-Save**: No manual saves needed
- **Disconnect Handling**: Game ends gracefully if player leaves

Enjoy your new Artillery Duel game mode! 🎉💣🎯
