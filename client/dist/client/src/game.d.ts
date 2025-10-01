import { GameState } from '../../shared/types';
import { UIManager } from './ui';
export declare class GameClient {
    private socket;
    private ui;
    private currentGameState?;
    private playerId;
    private currentGameId;
    constructor(socket: any, ui: UIManager);
    setGameId(gameId: string): void;
    updateGameState(gameState: GameState): void;
    private setupCardEventListeners;
}
//# sourceMappingURL=game.d.ts.map