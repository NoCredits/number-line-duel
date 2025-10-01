// Simple client without ES modules for debugging
console.log('Client script loading...');

// Check if io is available
if (typeof io === 'undefined') {
    console.error('Socket.io not loaded!');
    document.body.innerHTML += '<p style="color: red;">Socket.io not loaded!</p>';
} else {
    console.log('Socket.io is available');
    document.body.innerHTML += '<p style="color: green;">Socket.io loaded successfully!</p>';
    
    // Test connection
    const socket = io('http://localhost:3001');
    
    socket.on('connect', () => {
        console.log('Connected to server');
        document.body.innerHTML += '<p style="color: green;">Connected to server!</p>';
    });
    
    socket.on('disconnect', () => {
        console.log('Disconnected from server');
        document.body.innerHTML += '<p style="color: orange;">Disconnected from server</p>';
    });
}

// Simple game functionality
function setupSimpleGame() {
    const createBtn = document.getElementById('createGame');
    const joinBtn = document.getElementById('joinGame');
    
    if (createBtn && typeof io !== 'undefined') {
        createBtn.addEventListener('click', () => {
            const playerName = document.getElementById('playerName').value;
            if (playerName) {
                const socket = io('http://localhost:3001');
                socket.emit('createGame', playerName);
                
                socket.on('gameCreated', (data) => {
                    console.log('Game created:', data);
                    alert(`Game created! Code: ${data.gameId}`);
                });
            }
        });
    }
}

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', setupSimpleGame);