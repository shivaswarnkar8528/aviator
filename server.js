import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = createServer(app);
const io = new Server(server);

app.use(express.static('public'));

const TICK_RATE = 50; // 20 times per second
// const CRASH_PROBABILITY = 0.005; // 0.5% chance of crash per tick
const CRASH_PROBABILITY = 0.0019; // 0.5% chance of crash per tick
let altitude = 1.00;
let gameState = 'waiting';
let players = new Map();
let gameInterval;

function resetGame() {
  altitude = 1.00;
  gameState = 'waiting';
  players.clear();
  io.emit('gameReset');
}

function startGame() {
  gameState = 'flying';
  io.emit('gameStarted');
  gameInterval = setInterval(() => {
    if (gameState === 'flying') {
      altitude += 0.005;
      if (Math.random() < CRASH_PROBABILITY) {
        gameState = 'crashed';
        io.emit('gameCrashed', altitude);
        clearInterval(gameInterval);
        setTimeout(resetGame, 5000);
      } else {
        io.emit('altitudeUpdate', altitude);
      }
    } else {
      clearInterval(gameInterval);
    }
  }, TICK_RATE);
}

io.on('connection', (socket) => {
  console.log('A user connected');
  socket.emit('gameState', { state: gameState, altitude: altitude });

  socket.on('placeBet', (amount) => {
    if (gameState === 'waiting') {
      players.set(socket.id, { bet: amount, cashedOut: false });
      socket.emit('betPlaced', amount);
      if (players.size >= 2 && gameState === 'waiting') {
        setTimeout(startGame, 5000);
      }
    }
  });

  socket.on('cashOut', () => {
    if (gameState === 'flying' && players.has(socket.id) && !players.get(socket.id).cashedOut) {
      const player = players.get(socket.id);
      player.cashedOut = true;
      const winnings = player.bet * altitude;
      socket.emit('cashOutSuccess', { altitude, winnings });
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
    players.delete(socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

console.log("Server is set up and running!");