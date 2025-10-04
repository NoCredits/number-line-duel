import { Socket } from 'socket.io-client';

interface Position {
    x: number;
    y: number;
}

interface Wind {
    speed: number;
    direction: number;
}

interface VegetationItem {
    x: number;
    y: number;
    type: 'tree' | 'bush' | 'rock' | 'flowers' | 'grass' | 'stone';
    size?: number;
}

interface Cloud {
    x: number;
    y: number;
    width: number;
    height: number;
    speed: number;
    opacity: number;
}

interface Player {
    id: string;
    health: number;
    pos: Position;
}

interface GameState {
    roomId: string;
    players: {
        p1: Player;
        p2: Player;
    };
    terrain: number[];
    vegetation: VegetationItem[];
    clouds: Cloud[];
    wind: Wind;
    turn: 'p1' | 'p2';
    isActive: boolean;
}

interface TrajectoryPoint {
    x: number;
    y: number;
}

export class ArtilleryGameClient {
    private socket: Socket;
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private roomId: string | null = null;
    private gameState: GameState | null = null;
    private isMyTurn: boolean = false;

    constructor(socket: Socket) {
        this.socket = socket;
        this.canvas = document.getElementById('artilleryCanvas') as HTMLCanvasElement;
        this.ctx = this.canvas.getContext('2d')!;
        
        this.setupSocketListeners();
        this.setupEventListeners();
    }

    private setupSocketListeners(): void {
        this.socket.on('artilleryMatchFound', (data: any) => {
            console.log('🎯 Match found:', data.roomId);
            this.roomId = data.roomId;
            this.gameState = data.state;
            this.updateTurnStatus();
            this.drawGame();
            this.addLog('Match found! Get ready for battle! 💥');
        });

        this.socket.on('artilleryShotFired', (data: any) => {
            console.log('💥 Shot fired');
            this.animateTrajectory(data.trajectory);
        });

        this.socket.on('artilleryHit', (data: any) => {
            console.log('🎯 Hit!', data);
            if (this.gameState) {
                const victim = this.gameState.players[data.victim as 'p1' | 'p2'];
                victim.health = data.health;
                this.addLog(`💥 HIT! ${data.victim === this.getMyPlayerKey() ? 'You' : 'Enemy'} lost 20 health!`);
                this.drawGame();
            }
        });

        this.socket.on('artilleryTurnChanged', (data: any) => {
            console.log('🔄 Turn changed to:', data.turn);
            if (this.gameState) {
                this.gameState.turn = data.turn;
                if (data.wind) {
                    this.gameState.wind = data.wind;
                }
                this.updateTurnStatus();
                this.drawGame();
            }
        });

        this.socket.on('artilleryGameOver', (data: any) => {
            console.log('🏆 Game over!', data);
            const isWinner = (this.getMyPlayerKey() === data.winner);
            this.showGameOver(isWinner);
        });

        this.socket.on('artilleryWindChanged', (data: any) => {
            if (this.gameState) {
                this.gameState.wind = data.wind;
                this.drawGame();
            }
        });
    }

    private setupEventListeners(): void {
        const fireBtn = document.getElementById('artilleryFireBtn') as HTMLButtonElement;
        const angleInput = document.getElementById('artilleryAngle') as HTMLInputElement;
        const powerInput = document.getElementById('artilleryPower') as HTMLInputElement;

        if (fireBtn) {
            fireBtn.addEventListener('click', () => {
                if (!this.canFire()) return;

                const angle = parseInt(angleInput.value);
                const power = parseInt(powerInput.value);

                if (isNaN(angle) || isNaN(power)) {
                    this.addLog('❌ Invalid angle or power!');
                    return;
                }

                this.fire(angle, power);
            });
        }

        // Update fire button state when inputs change
        if (angleInput && powerInput) {
            [angleInput, powerInput].forEach(input => {
                input.addEventListener('input', () => this.updateTurnStatus());
            });
        }
    }

    private canFire(): boolean {
        return !!(this.roomId && this.gameState && this.isMyTurn);
    }

    private fire(angle: number, power: number): void {
        this.socket.emit('artilleryFire', {
            roomId: this.roomId,
            angle,
            power
        });
        this.addLog(`🔥 You fired! Angle: ${angle}°, Power: ${power}`);
    }

    joinQueue(): void {
        console.log('🎯 Joining artillery queue...');
        this.socket.emit('joinArtilleryQueue');
        this.addLog('Searching for opponent...');
    }

    private getMyPlayerKey(): 'p1' | 'p2' | null {
        if (!this.gameState) return null;
        if (this.gameState.players.p1.id === this.socket.id) return 'p1';
        if (this.gameState.players.p2.id === this.socket.id) return 'p2';
        return null;
    }

    private updateTurnStatus(): void {
        if (!this.gameState) return;

        const myKey = this.getMyPlayerKey();
        this.isMyTurn = myKey === this.gameState.turn;

        const fireBtn = document.getElementById('artilleryFireBtn') as HTMLButtonElement;
        const turnIndicator = document.getElementById('artilleryTurnIndicator');

        if (fireBtn) {
            fireBtn.disabled = !this.isMyTurn;
        }

        if (turnIndicator) {
            turnIndicator.textContent = this.isMyTurn ? '🎯 Your Turn!' : "⏳ Opponent's Turn";
            turnIndicator.style.color = this.isMyTurn ? '#4CAF50' : '#FF9800';
        }

        // Update player cards
        const updatePlayerCard = (key: 'p1' | 'p2', elementPrefix: string) => {
            const player = this.gameState!.players[key];
            const healthElement = document.querySelector(`${elementPrefix} .artillery-health-value`);
            if (healthElement) {
                healthElement.textContent = `${player.health}/100`;
            }
        };

        updatePlayerCard('p1', '#artilleryPlayer1');
        updatePlayerCard('p2', '#artilleryPlayer2');
    }

    private drawGame(): void {
        if (!this.gameState) return;

        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw sky gradient
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(1, '#E0F6FF');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw clouds
        this.drawClouds();

        // Draw terrain
        this.drawTerrain();

        // Draw vegetation
        this.drawVegetation();

        // Draw players
        this.drawPlayer(this.gameState.players.p1, 'blue');
        this.drawPlayer(this.gameState.players.p2, 'red');

        // Draw wind indicator
        this.drawWindIndicator();
    }

    private drawClouds(): void {
        if (!this.gameState || !this.gameState.clouds) return;

        for (const cloud of this.gameState.clouds) {
            this.ctx.fillStyle = `rgba(255, 255, 255, ${cloud.opacity})`;
            this.ctx.beginPath();
            this.ctx.ellipse(cloud.x, cloud.y, cloud.width, cloud.height, 0, 0, 2 * Math.PI);
            this.ctx.fill();
        }
    }

    private drawTerrain(): void {
        if (!this.gameState) return;

        this.ctx.beginPath();
        this.ctx.moveTo(0, this.gameState.terrain[0]);

        for (let x = 1; x < this.gameState.terrain.length; x++) {
            this.ctx.lineTo(x, this.gameState.terrain[x]);
        }

        this.ctx.lineTo(this.canvas.width, this.canvas.height);
        this.ctx.lineTo(0, this.canvas.height);
        this.ctx.closePath();
        
        // Create green gradient like original game
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#9B7653');    // Brown/yellow top
        gradient.addColorStop(0.3, '#7FA54E');  // Light green
        gradient.addColorStop(0.6, '#5E8C3A');  // Medium green
        gradient.addColorStop(1, '#3D5A27');    // Dark green bottom
        
        this.ctx.fillStyle = gradient;
        this.ctx.fill();

        // Add brown base layer at bottom
        this.ctx.fillStyle = '#543A2A';
        this.ctx.fillRect(0, this.canvas.height - 50, this.canvas.width, 50);
    }

    private drawVegetation(): void {
        if (!this.gameState || !this.gameState.vegetation) return;

        for (const item of this.gameState.vegetation) {
            const size = item.size || 1;
            
            switch (item.type) {
                case 'tree':
                    // Tree trunk
                    this.ctx.fillStyle = '#8B4513';
                    this.ctx.fillRect(item.x - 3 * size, item.y - 15 * size, 6 * size, 15 * size);
                    // Tree foliage
                    this.ctx.fillStyle = '#228B22';
                    this.ctx.beginPath();
                    this.ctx.arc(item.x, item.y - 20 * size, 10 * size, 0, 2 * Math.PI);
                    this.ctx.fill();
                    break;
                case 'bush':
                    this.ctx.fillStyle = '#32CD32';
                    this.ctx.beginPath();
                    this.ctx.arc(item.x, item.y, 5 * size, 0, 2 * Math.PI);
                    this.ctx.fill();
                    break;
                case 'rock':
                    this.ctx.fillStyle = '#808080';
                    this.ctx.beginPath();
                    this.ctx.arc(item.x, item.y, 4 * size, 0, 2 * Math.PI);
                    this.ctx.fill();
                    break;
                case 'grass':
                    this.ctx.strokeStyle = '#90EE90';
                    this.ctx.lineWidth = 1;
                    for (let i = 0; i < 3; i++) {
                        this.ctx.beginPath();
                        this.ctx.moveTo(item.x + i * 2, item.y);
                        this.ctx.lineTo(item.x + i * 2, item.y - 5 * size);
                        this.ctx.stroke();
                    }
                    break;
            }
        }
    }

    private drawPlayer(player: Player, color: string): void {
        if (!this.gameState) return;

        const x = player.pos.x;
        const terrainY = this.gameState.terrain[Math.floor(x)] || 500;
        const y = terrainY - 30;

        // Tank colors
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
            this.ctx.arc(x - 14 + i * 7, y + 24, 3, 0, 2 * Math.PI);
            this.ctx.fill();
        }

        // Draw main tank body
        this.ctx.fillStyle = tankColor;
        this.ctx.fillRect(x - 15, y + 8, 30, 15);

        // Draw turret
        this.ctx.beginPath();
        this.ctx.arc(x, y + 8, 12, 0, 2 * Math.PI);
        this.ctx.fill();

        // Calculate barrel angle
        const myKey = this.getMyPlayerKey();
        const isCurrentPlayer = (myKey === 'p1' && player.id === this.gameState.players.p1.id) ||
                                (myKey === 'p2' && player.id === this.gameState.players.p2.id);
        const isMyTank = player.id === this.socket.id;
        const barrelAngle = isCurrentPlayer && isMyTank ? this.getCurrentPlayerAngle() : 45;
        const isPlayer1 = player.id === this.gameState.players.p1.id;
        const adjustedAngle = isPlayer1 ? barrelAngle : (180 - barrelAngle);
        const barrelRad = adjustedAngle * Math.PI / 180;

        // Draw barrel
        const barrelLength = 25;
        const barrelStartX = x + Math.cos(barrelRad) * 8;
        const barrelStartY = y + 8 - Math.sin(barrelRad) * 8;
        const barrelEndX = x + Math.cos(barrelRad) * (barrelLength + 8);
        const barrelEndY = y + 8 - Math.sin(barrelRad) * (barrelLength + 8);

        this.ctx.strokeStyle = metalColor;
        this.ctx.lineWidth = 3;
        this.ctx.lineCap = 'round';
        this.ctx.beginPath();
        this.ctx.moveTo(barrelStartX, barrelStartY);
        this.ctx.lineTo(barrelEndX, barrelEndY);
        this.ctx.stroke();

        // Draw health bar
        const healthBarWidth = 30;
        const healthBarHeight = 4;
        const healthPercentage = player.health / 100;

        this.ctx.fillStyle = '#374151';
        this.ctx.fillRect(x - healthBarWidth/2, y - 8, healthBarWidth, healthBarHeight);

        const healthColor = healthPercentage > 0.6 ? '#10B981' :
                           healthPercentage > 0.3 ? '#F59E0B' : '#EF4444';
        this.ctx.fillStyle = healthColor;
        this.ctx.fillRect(x - healthBarWidth/2, y - 8, healthBarWidth * healthPercentage, healthBarHeight);

        // Health text
        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`${player.health}`, x, y - 12);

        // Highlight current player
        if (isCurrentPlayer && this.gameState.turn === myKey) {
            this.ctx.strokeStyle = 'rgba(255, 215, 0, 0.8)';
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.arc(x, y + 15, 25, 0, 2 * Math.PI);
            this.ctx.stroke();
        }
    }

    private getCurrentPlayerAngle(): number {
        const angleInput = document.getElementById('artilleryAngle') as HTMLInputElement;
        return angleInput ? parseInt(angleInput.value) || 45 : 45;
    }

    private drawWindIndicator(): void {
        if (!this.gameState || !this.gameState.wind) return;

        const wind = this.gameState.wind;
        const windX = this.canvas.width - 100;
        const windY = 30;

        // Draw wind arrow
        this.ctx.save();
        this.ctx.translate(windX, windY);
        this.ctx.rotate(wind.direction * Math.PI / 180);

        // Arrow shaft
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(-15, 0);
        this.ctx.lineTo(15, 0);
        this.ctx.stroke();

        // Arrow head
        this.ctx.fillStyle = '#333';
        this.ctx.beginPath();
        this.ctx.moveTo(15, 0);
        this.ctx.lineTo(10, -5);
        this.ctx.lineTo(10, 5);
        this.ctx.closePath();
        this.ctx.fill();

        this.ctx.restore();

        // Wind speed text
        this.ctx.fillStyle = '#333';
        this.ctx.font = 'bold 14px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`💨 ${wind.speed.toFixed(1)}`, windX, windY + 25);
    }

    private animateTrajectory(trajectory: TrajectoryPoint[]): void {
        let index = 0;
        const trailLength = 8;
        const projectileTrail: TrajectoryPoint[] = [];

        const animate = () => {
            if (index >= trajectory.length) {
                // Animation complete, redraw game
                this.drawGame();
                return;
            }

            // Redraw game
            this.drawGame();

            // Add current point to trail
            projectileTrail.push(trajectory[index]);
            if (projectileTrail.length > trailLength) {
                projectileTrail.shift();
            }

            // Draw projectile trail
            for (let i = 0; i < projectileTrail.length; i++) {
                const point = projectileTrail[i];
                const opacity = (i + 1) / projectileTrail.length;
                this.ctx.fillStyle = `rgba(0, 0, 0, ${opacity})`;
                this.ctx.beginPath();
                this.ctx.arc(point.x, point.y, 3, 0, 2 * Math.PI);
                this.ctx.fill();
            }

            // Draw current projectile
            const point = trajectory[index];
            this.ctx.fillStyle = '#000';
            this.ctx.beginPath();
            this.ctx.arc(point.x, point.y, 5, 0, 2 * Math.PI);
            this.ctx.fill();

            index++;
            requestAnimationFrame(animate);
        };

        animate();
    }

    private addLog(message: string): void {
        const log = document.getElementById('artilleryActionLog');
        if (log) {
            const p = document.createElement('p');
            p.textContent = `• ${message}`;
            log.appendChild(p);
            log.scrollTop = log.scrollHeight;
        }
    }

    private showGameOver(isWinner: boolean): void {
        const message = isWinner ? '🎉 You Won!' : '💀 You Lost!';
        this.addLog(message);
        
        setTimeout(() => {
            if (confirm(`${message}\n\nPlay again?`)) {
                window.location.reload();
            } else {
                // Go back to main menu
                const mainMenu = document.getElementById('mainMenu');
                const artilleryScreen = document.getElementById('artilleryGameScreen');
                if (mainMenu && artilleryScreen) {
                    artilleryScreen.classList.remove('active');
                    mainMenu.classList.add('active');
                }
            }
        }, 1000);
    }
}
