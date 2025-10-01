"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Player = void 0;
class Player {
    constructor(id, name) {
        this.id = id;
        this.name = name;
        this.hand = [];
        this.isCurrentPlayer = false;
    }
    addToHand(card) {
        this.hand.push(card);
    }
    removeFromHand(cardId) {
        const index = this.hand.findIndex(card => card.id === cardId);
        if (index !== -1) {
            return this.hand.splice(index, 1)[0];
        }
        return null;
    }
    hasCard(cardId) {
        return this.hand.some(card => card.id === cardId);
    }
}
exports.Player = Player;
