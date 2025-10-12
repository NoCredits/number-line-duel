import { ArtilleryGameState, TrajectoryPoint, ArtilleryPlayer, Position } from '../../../../shared/types/artillery-duel.js';

export class ArtilleryUIManager {
    private canvas: HTMLCanvasElement | null = null;
    private ctx: CanvasRenderingContext2D | null = null;
    private currentGameState: ArtilleryGameState | null = null;
    private playerId: string = '';
    private onFire: ((angle: number, power: number) => void) | null = null;
    private onJoinQueue: ((difficulty: 'easy' | 'medium' | 'hard') => void) | null = null;

    constructor() {
        this.initializeUI();
    }

    private initializeUI(): void {
        // Get canvas
        this.canvas = document.getElementById('artilleryCanvas') as HTMLCanvasElement;
        if (this.canvas) {
            this.ctx = this.canvas.getContext('2d');
        }
    }

    showGameScreen(): void {
        this.showScreen('artilleryGameScreen');
    }

    showLobby(): void {
        this.showScreen('lobby');
    }

    private showScreen(screenId: string): void {
        document.querySelectorAll('.screen').forEach(screen => {
            (screen as HTMLElement).classList.remove('active');
        });
        const screen = document.getElementById(screenId);
        if (screen) {
            screen.classList.add('active');
        }
    }

    updateGameState(gameState: ArtilleryGameState, playerId: string): void {
        this.currentGameState = gameState;
        this.playerId = playerId;
        this.drawGame();
        this.updateControls();
    }

    private drawGame(): void {
        if (!this.ctx || !this.canvas || !this.currentGameState) return;

        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw sky gradient
        const skyGradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        skyGradient.addColorStop(0, '#87CEEB');
        skyGradient.addColorStop(1, '#E0F6FF');
        this.ctx.fillStyle = skyGradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw clouds
        this.drawClouds();

        // Draw terrain
        this.drawTerrain();

        // Draw vegetation
        this.drawVegetation();

        // Draw players
        if (this.currentGameState.players.length >= 2) {
            this.drawPlayer(this.currentGameState.players[0], 'blue');
            this.drawPlayer(this.currentGameState.players[1], 'red');
        }

        // Draw wind indicator
        this.drawWindIndicator();
    }

    private drawClouds(): void {
        if (!this.ctx || !this.currentGameState) return;

        for (const cloud of this.currentGameState.clouds) {
            this.ctx.fillStyle = `rgba(255, 255, 255, ${cloud.opacity})`;
            this.ctx.beginPath();
            this.ctx.ellipse(cloud.x, cloud.y, cloud.width / 2, cloud.height / 2, 0, 0, 2 * Math.PI);
            this.ctx.fill();
        }
    }

    private drawTerrain(): void {
        if (!this.ctx || !this.canvas || !this.currentGameState) return;

        this.ctx.beginPath();
        this.ctx.moveTo(0, this.currentGameState.terrain[0]);

        for (let x = 1; x < this.currentGameState.terrain.length; x++) {
            this.ctx.lineTo(x, this.currentGameState.terrain[x]);
        }

        this.ctx.lineTo(this.canvas.width, this.canvas.height);
        this.ctx.lineTo(0, this.canvas.height);
        this.ctx.closePath();

        const terrainGradient = this.ctx.createLinearGradient(0, 400, 0, this.canvas.height);
        terrainGradient.addColorStop(0, '#8B7355');
        terrainGradient.addColorStop(1, '#654321');
        this.ctx.fillStyle = terrainGradient;
        this.ctx.fill();

        // Draw grass on top
        this.ctx.strokeStyle = '#228B22';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
    }

    private drawVegetation(): void {
        if (!this.ctx || !this.currentGameState) return;

        for (const veg of this.currentGameState.vegetation) {
            const size = veg.size || 1;
            
            switch (veg.type) {
                case 'tree':
                    this.drawTree(veg.x, veg.y, size);
                    break;
                case 'bush':
                    this.drawBush(veg.x, veg.y, size);
                    break;
                case 'rock':
                    this.drawRock(veg.x, veg.y, size);
                    break;
                case 'grass':
                    this.drawGrass(veg.x, veg.y, size);
                    break;
                case 'flowers':
                    this.drawFlowers(veg.x, veg.y, size);
                    break;
                case 'stone':
                    this.drawStone(veg.x, veg.y, size);
                    break;
            }
        }
    }

    private drawTree(x: number, y: number, size: number): void {
        if (!this.ctx) return;
        
        // Trunk
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(x - 2 * size, y - 15 * size, 4 * size, 15 * size);
        
        // Leaves
        this.ctx.fillStyle = '#228B22';
        this.ctx.beginPath();
        this.ctx.arc(x, y - 15 * size, 8 * size, 0, 2 * Math.PI);
        this.ctx.fill();
    }

    private drawBush(x: number, y: number, size: number): void {
        if (!this.ctx) return;
        
        this.ctx.fillStyle = '#32CD32';
        this.ctx.beginPath();
        this.ctx.arc(x, y - 5 * size, 6 * size, 0, 2 * Math.PI);
        this.ctx.fill();
    }

    private drawRock(x: number, y: number, size: number): void {
        if (!this.ctx) return;
        
        this.ctx.fillStyle = '#696969';
        this.ctx.beginPath();
        this.ctx.arc(x, y - 4 * size, 5 * size, 0, 2 * Math.PI);
        this.ctx.fill();
    }

    private drawGrass(x: number, y: number, size: number): void {
        if (!this.ctx) return;
        
        this.ctx.strokeStyle = '#228B22';
        this.ctx.lineWidth = 1 * size;
        for (let i = 0; i < 3; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(x + (i - 1) * 2 * size, y);
            this.ctx.lineTo(x + (i - 1) * 2 * size, y - 5 * size);
            this.ctx.stroke();
        }
    }

    private drawFlowers(x: number, y: number, size: number): void {
        if (!this.ctx) return;
        
        this.ctx.fillStyle = '#FF69B4';
        this.ctx.beginPath();
        this.ctx.arc(x, y - 3 * size, 2 * size, 0, 2 * Math.PI);
        this.ctx.fill();
    }

    private drawStone(x: number, y: number, size: number): void {
        if (!this.ctx) return;
        
        this.ctx.fillStyle = '#808080';
        this.ctx.fillRect(x - 2 * size, y - 2 * size, 4 * size, 2 * size);
    }

    private drawPlayer(player: ArtilleryPlayer, color: string): void {
        if (!this.ctx || !this.currentGameState) return;

        const x = player.pos.x;
        const terrainY = this.currentGameState.terrain[Math.floor(x)] || 500;
        const y = terrainY - 30;

        const tankColor = color === 'blue' ? '#1E3A8A' : '#DC2626';
        const metalColor = color === 'blue' ? '#374151' : '#4B5563';
        const trackColor = '#1F2937';

        // Draw tank tracks
        this.ctx.fillStyle = trackColor;
        this.ctx.fillRect(x - 18, y + 20, 36, 8);

        // Draw track wheels
        this.ctx.fillStyle = '#111827';
        for (let i = 0; i < 5; i++) {
            this.ctx.beginPath();
            this.ctx.arc(x - 14 + i * 7, y + 24, 2.5, 0, 2 * Math.PI);
            this.ctx.fill();
        }

        // Draw tank body
        this.ctx.fillStyle = tankColor;
        this.ctx.fillRect(x - 15, y + 8, 30, 15);

        // Draw turret
        this.ctx.beginPath();
        this.ctx.arc(x, y + 8, 12, 0, 2 * Math.PI);
        this.ctx.fill();

        this.ctx.fillStyle = metalColor;
        this.ctx.beginPath();
        this.ctx.arc(x, y + 8, 8, 0, 2 * Math.PI);
        this.ctx.fill();

        // Draw barrel
        const isCurrentPlayer = player.id === this.currentGameState.currentPlayerId;
        const barrelAngle = isCurrentPlayer ? this.getCurrentPlayerAngle() : 45;
        const barrelLength = 25;
        const barrelRad = barrelAngle * Math.PI / 180;

        const barrelEndX = x + Math.cos(barrelRad) * (barrelLength + 8);
        const barrelEndY = y + 8 - Math.sin(barrelRad) * (barrelLength + 8);

        this.ctx.strokeStyle = metalColor;
        this.ctx.lineWidth = 3;
        this.ctx.lineCap = 'round';
        this.ctx.beginPath();
        this.ctx.moveTo(x + Math.cos(barrelRad) * 8, y + 8 - Math.sin(barrelRad) * 8);
        this.ctx.lineTo(barrelEndX, barrelEndY);
        this.ctx.stroke();

        // Draw health bar
        const healthBarWidth = 30;
        const healthBarHeight = 4;
        const healthPercentage = player.health / 100;

        this.ctx.fillStyle = '#374151';
        this.ctx.fillRect(x - healthBarWidth / 2, y - 8, healthBarWidth, healthBarHeight);

        const healthColor = healthPercentage > 0.6 ? '#10B981' :
            healthPercentage > 0.3 ? '#F59E0B' : '#EF4444';
        this.ctx.fillStyle = healthColor;
        this.ctx.fillRect(x - healthBarWidth / 2, y - 8, healthBarWidth * healthPercentage, healthBarHeight);

        // Draw health text
        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`${player.health}`, x, y - 12);

        // Highlight current player
        if (isCurrentPlayer) {
            const time = Date.now() / 1000;
            const glowIntensity = 0.7 + 0.3 * Math.sin(time * 3);

            this.ctx.shadowColor = '#FBBF24';
            this.ctx.shadowBlur = 8 * glowIntensity;
            this.ctx.strokeStyle = '#FBBF24';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(x - 20, y - 2, 40, 32);

            this.ctx.shadowBlur = 0;
        }

        this.ctx.textAlign = 'left';
        this.ctx.lineWidth = 1;
    }

    private drawWindIndicator(): void {
        if (!this.ctx || !this.currentGameState) return;

        const wind = this.currentGameState.wind;
        const x = 900;
        const y = 50;

        // Draw wind arrow
        const windRad = (wind.direction - 90) * Math.PI / 180;
        const arrowLength = 20 + wind.speed * 2;

        this.ctx.strokeStyle = '#333';
        this.ctx.fillStyle = '#333';
        this.ctx.lineWidth = 2;

        // Arrow shaft
        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
        this.ctx.lineTo(x + Math.cos(windRad) * arrowLength, y + Math.sin(windRad) * arrowLength);
        this.ctx.stroke();

        // Arrow head
        const headAngle = Math.atan2(Math.sin(windRad), Math.cos(windRad));
        this.ctx.beginPath();
        this.ctx.moveTo(x + Math.cos(windRad) * arrowLength, y + Math.sin(windRad) * arrowLength);
        this.ctx.lineTo(
            x + Math.cos(windRad) * arrowLength + Math.cos(headAngle + 2.5) * 8,
            y + Math.sin(windRad) * arrowLength + Math.sin(headAngle + 2.5) * 8
        );
        this.ctx.lineTo(
            x + Math.cos(windRad) * arrowLength + Math.cos(headAngle - 2.5) * 8,
            y + Math.sin(windRad) * arrowLength + Math.sin(headAngle - 2.5) * 8
        );
        this.ctx.closePath();
        this.ctx.fill();

        // Wind speed text
        this.ctx.fillStyle = '#333';
        this.ctx.font = 'bold 14px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Wind: ${wind.speed.toFixed(1)}`, x + 40, y + 5);
    }

    private getCurrentPlayerAngle(): number {
        const angleInput = document.getElementById('artilleryAngle') as HTMLInputElement;
        return angleInput ? parseInt(angleInput.value) || 45 : 45;
    }

    private updateControls(): void {
        if (!this.currentGameState) return;

        const isMyTurn = this.isMyTurn();
        const fireBtn = document.getElementById('artilleryFireBtn') as HTMLButtonElement;
        const angleInput = document.getElementById('artilleryAngle') as HTMLInputElement;
        const powerInput = document.getElementById('artilleryPower') as HTMLInputElement;

        if (fireBtn) fireBtn.disabled = !isMyTurn;
        if (angleInput) angleInput.disabled = !isMyTurn;
        if (powerInput) powerInput.disabled = !isMyTurn;

        // Update turn indicator
        const turnIndicator = document.getElementById('artilleryTurnIndicator');
        if (turnIndicator) {
            turnIndicator.textContent = isMyTurn ? 'Your Turn!' : "Opponent's Turn";
            turnIndicator.className = isMyTurn ? 'your-turn' : 'opponent-turn';
        }
    }

    animateTrajectory(trajectory: TrajectoryPoint[], onComplete: () => void): void {
        if (!this.ctx) return;

        let index = 0;
        const trailLength = 8;
        const projectileTrail: TrajectoryPoint[] = [];

        const animate = () => {
            if (index >= trajectory.length) {
                this.drawGame();
                onComplete();
                return;
            }

            this.drawGame();

            const currentPoint = trajectory[index];
            projectileTrail.push(currentPoint);

            if (projectileTrail.length > trailLength) {
                projectileTrail.shift();
            }

            // Draw trail
            for (let i = 0; i < projectileTrail.length; i++) {
                const trailPoint = projectileTrail[i];
                const alpha = (i + 1) / projectileTrail.length;
                const size = 2 + (alpha * 2);

                this.ctx!.beginPath();
                this.ctx!.arc(trailPoint.x, trailPoint.y, size, 0, 2 * Math.PI);
                this.ctx!.fillStyle = `rgba(255, 165, 0, ${alpha * 0.7})`;
                this.ctx!.fill();
            }

            // Draw projectile
            this.ctx!.beginPath();
            this.ctx!.arc(currentPoint.x, currentPoint.y, 4, 0, 2 * Math.PI);
            this.ctx!.fillStyle = '#FF4500';
            this.ctx!.fill();

            index++;
            requestAnimationFrame(animate);
        };

        animate();
    }

    showNotification(message: string, type: 'success' | 'error' | 'info'): void {
        console.log(`[${type.toUpperCase()}] ${message}`);
        // You can implement a proper notification system here
    }

    showGameOver(isWinner: boolean, reason: string): void {
        alert(isWinner ? `You Win! ${reason}` : `Game Over! ${reason}`);
    }

    setOnFire(callback: (angle: number, power: number) => void): void {
        this.onFire = callback;
    }

    setOnJoinQueue(callback: (difficulty: 'easy' | 'medium' | 'hard') => void): void {
        this.onJoinQueue = callback;
    }

    private isMyTurn(): boolean {
        if (!this.currentGameState) return false;
        const currentPlayerIndex = this.currentGameState.turn === 'p1' ? 0 : 1;
        return this.currentGameState.players[currentPlayerIndex]?.id === this.playerId;
    }
}
