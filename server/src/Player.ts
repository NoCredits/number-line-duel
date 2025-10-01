import { Player as PlayerType, Card as CardInterface } from '../../shared/types';
import { Card } from './Card';

export class Player implements PlayerType {
  public hand: Card[] = [];
  public isCurrentPlayer: boolean = false;

  constructor(
    public readonly id: string,
    public readonly name: string
  ) {}

  addToHand(card: Card): void {
    this.hand.push(card);
  }

  removeFromHand(cardId: string): Card | null {
    const index = this.hand.findIndex(card => card.id === cardId);
    if (index !== -1) {
      return this.hand.splice(index, 1)[0];
    }
    return null;
  }

  hasCard(cardId: string): boolean {
    return this.hand.some(card => card.id === cardId);
  }
}