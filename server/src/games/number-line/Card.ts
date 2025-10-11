import { GameState, Card as CardType } from '../../../../shared/types/common';

export class Card implements CardType {
  public readonly id: string;
  
  constructor(
    public readonly value: string,
    public readonly display: string,
    public readonly numericValue: number,
    public readonly operation: 'add' | 'multiply' | 'subtract'
  ) {
    this.id = Math.random().toString(36).substr(2, 9);
  }

  applyOperation(currentValue: number): number {
    switch (this.operation) {
      case 'add':
        return currentValue + this.numericValue;
      case 'subtract':
        return currentValue - this.numericValue;
      case 'multiply':
        return currentValue * this.numericValue;
      default:
        return currentValue;
    }
  }

  static createDeck(): Card[] {
    const cards: Card[] = [];
    
    // Add cards - balanced distribution
    [1, 2, 3, 4, 5].forEach(value => {
      cards.push(new Card(`+${value}`, `+${value}`, value, 'add'));
      cards.push(new Card(`+${value}`, `+${value}`, value, 'add')); // Two of each
    });
    
    // Subtract cards - fewer than add cards
    [1, 2, 3].forEach(value => {
      cards.push(new Card(`-${value}`, `−${value}`, value, 'subtract'));
    });
    
    // Multiply cards - powerful but rare
    cards.push(new Card('×2', '×2', 2, 'multiply'));
    cards.push(new Card('×3', '×3', 3, 'multiply'));
    
    return this.shuffle(cards);
  }

  private static shuffle<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}