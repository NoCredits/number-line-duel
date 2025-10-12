"use strict";
// 🦢 Goose Duel - Type Definitions
Object.defineProperty(exports, "__esModule", { value: true });
exports.SPECIAL_SPACES = exports.GOOSE_CARDS = void 0;
exports.generateBoard = generateBoard;
// Card Database
exports.GOOSE_CARDS = {
    // Movement Cards (40%)
    move3: { type: 'movement', name: 'Move 3', emoji: '🚶', description: 'Move 3 spaces forward', moveSpaces: 3 },
    move4: { type: 'movement', name: 'Move 4', emoji: '🏃', description: 'Move 4 spaces forward', moveSpaces: 4 },
    move5: { type: 'movement', name: 'Move 5', emoji: '🏃‍♂️', description: 'Move 5 spaces forward', moveSpaces: 5 },
    move6: { type: 'movement', name: 'Move 6', emoji: '💨', description: 'Move 6 spaces forward', moveSpaces: 6 },
    move8: { type: 'movement', name: 'Move 8', emoji: '⚡', description: 'Move 8 spaces forward', moveSpaces: 8 },
    move10: { type: 'movement', name: 'Move 10', emoji: '🚀', description: 'Move 10 spaces forward', moveSpaces: 10 },
    // Trap Cards (30%)
    pitfall: { type: 'trap', name: 'Pitfall', emoji: '🕳️', description: 'Send opponent back 5 spaces', trapType: 'pitfall', trapEffect: 'back5', trapDuration: 5 },
    ice: { type: 'trap', name: 'Ice Block', emoji: '🧊', description: 'Freeze opponent for 1 turn', trapType: 'ice', trapEffect: 'freeze', trapDuration: 5 },
    swap: { type: 'trap', name: 'Swap Portal', emoji: '🔄', description: 'Force position swap', trapType: 'swap', trapEffect: 'swap', trapDuration: 5 },
    reverse: { type: 'trap', name: 'Reverse', emoji: '↩️', description: 'Opponent moves backward', trapType: 'reverse', trapEffect: 'reverse', trapDuration: 3 },
    net: { type: 'trap', name: 'Net Trap', emoji: '🕸️', description: 'Opponent loses next turn', trapType: 'net', trapEffect: 'skip', trapDuration: 5 },
    bomb: { type: 'trap', name: 'Bomb', emoji: '💣', description: 'Send opponent to start', trapType: 'bomb', trapEffect: 'start', trapDuration: 5 },
    // Boost Cards (20%)
    sprint: { type: 'boost', name: 'Sprint', emoji: '🏃', description: 'Move +3 extra spaces', boostType: 'sprint', boostValue: 3 },
    teleport: { type: 'boost', name: 'Teleport', emoji: '✨', description: 'Jump to any space within 10', boostType: 'teleport', boostValue: 10 },
    double: { type: 'boost', name: 'Double Move', emoji: '⏭️', description: 'Take two turns', boostType: 'double', boostValue: 2 },
    shield: { type: 'boost', name: 'Shield', emoji: '🛡️', description: 'Immune to next trap', boostType: 'shield', boostValue: 1 },
    gooseBoost: { type: 'boost', name: 'Goose Boost', emoji: '🦢', description: 'Jump to next Goose space', boostType: 'goose', boostValue: 0 },
    // Power-Up Cards (10%)
    detector: { type: 'powerup', name: 'Trap Detector', emoji: '🔍', description: 'See all traps for 3 turns', powerUpType: 'detector', powerUpDuration: 3 },
    removal: { type: 'powerup', name: 'Trap Removal', emoji: '🧹', description: 'Remove 1 trap from board', powerUpType: 'removal', powerUpDuration: 1 },
    steal: { type: 'powerup', name: 'Steal Card', emoji: '🃏', description: 'Take random card from opponent', powerUpType: 'steal', powerUpDuration: 1 },
    undo: { type: 'powerup', name: 'Undo', emoji: '↶', description: 'Reverse last move', powerUpType: 'undo', powerUpDuration: 1 },
    mirror: { type: 'powerup', name: 'Mirror', emoji: '🪞', description: 'Reflect trap back', powerUpType: 'mirror', powerUpDuration: 1 },
};
// Board Space Definitions
exports.SPECIAL_SPACES = [5, 10, 15, 20, 25, 30, 35, 40, 45]; // positions of special spaces
function generateBoard(length) {
    const board = [];
    for (let i = 0; i <= length; i++) {
        let space = { position: i, type: 'normal' };
        // Every 7 spaces is a Goose space
        if (i > 0 && i % 7 === 0 && i < length) {
            space = {
                position: i,
                type: 'goose',
                emoji: '🦢',
                description: 'Jump to next Goose space!',
                effect: { type: 'goose', description: 'Advance to next Goose space' }
            };
        }
        // Special spaces
        else if (i === 10) {
            space = { position: i, type: 'bridge', emoji: '🌉', description: 'Bridge: Skip ahead 5 spaces', effect: { type: 'advance', value: 5, description: 'Move forward 5 spaces' } };
        }
        else if (i === 20) {
            space = { position: i, type: 'star', emoji: '⭐', description: 'Star: Draw 2 cards', effect: { type: 'draw', value: 2, description: 'Draw 2 extra cards' } };
        }
        else if (i === 30) {
            space = { position: i, type: 'shuffle', emoji: '🔀', description: 'Shuffle: Swap with opponent', effect: { type: 'swap', description: 'Swap positions with opponent' } };
        }
        else if (i === 40) {
            space = { position: i, type: 'rest', emoji: '💤', description: 'Rest: Skip turn, draw 2 cards', effect: { type: 'rest', value: 2, description: 'Skip turn but draw 2 cards' } };
        }
        else if (i === 25 || i === 45) {
            space = { position: i, type: 'checkpoint', emoji: '🎯', description: 'Checkpoint: Safe zone', effect: { type: 'safe', description: 'Immune to traps here' } };
        }
        board.push(space);
    }
    return board;
}
