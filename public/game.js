const socket = io();

const altitudeDisplay = document.getElementById('altitude');
const gameStateDisplay = document.getElementById('game-state');
const betInput = document.getElementById('bet-input');
const betButton = document.getElementById('bet-button');
const planeState = document.getElementById('plane-state');
const cashoutButton = document.getElementById('cashout-button');
const resultDisplay = document.getElementById('result');
// const planeContainer = document.querySelector('.plane-container');


let isCashout=false;


let currentAltitude = 1.00;
let placedBet = 0;

function updateAltitude(altitude) {
    currentAltitude = altitude;
    altitudeDisplay.textContent = altitude.toFixed(2) + 'x';
    // planeContainer.style.bottom = `${Math.min((altitude - 1) * 20, 80)}%`;
}
function updateGameState(state) {
    gameStateDisplay.textContent = state.charAt(0).toUpperCase() + state.slice(1);
    if (state === 'flying') {
        betButton.disabled = true;
        cashoutButton.disabled = false;
        planeState.src = 'plane.gif';
    } else {
        betButton.disabled = false;
        cashoutButton.disabled = true;
        planeState.src = 'plane waiting.png';
    }
}

betButton.addEventListener('click', () => {
   
    const betAmount = parseInt(betInput.value);
    if (betAmount > 0) {
        socket.emit('placeBet', betAmount);
        activegame.style.display = 'inline-block';
        inactivegame.style.display = 'none';
    }
});

cashoutButton.addEventListener('click', () => {
    socket.emit('cashOut');
    activegame.style.display = 'none';
    inactivegame.style.display = 'inline-block';
});
socket.on('gameState', (data) => {
    updateGameState(data.state);
    updateAltitude(data.altitude);
});

socket.on('altitudeUpdate', (altitude) => {
    updateAltitude(altitude);
});

socket.on('gameCrashed', (finalAltitude) => {
    activegame.style.display = 'none';
    inactivegame.style.display = 'inline-block';
    updateGameState('crashed');
    updateAltitude(finalAltitude);
   if(!isCashout){
    resultDisplay.textContent = `Game crashed at ${finalAltitude.toFixed(2)}x`;
    resultDisplay.style.color = 'red';
   }
});

socket.on('gameReset', () => {
    activegame.style.display = 'none';
    inactivegame.style.display = 'inline-block';
    isCashout=false;
    updateGameState('waiting');
    updateAltitude(1.00);
    placedBet = 0;
    resultDisplay.textContent = '';
});

socket.on('betPlaced', (amount) => {
    placedBet = amount;
    resultDisplay.textContent = `Bet placed: ₹${amount}`;
    resultDisplay.style.color = 'black';
});

socket.on('cashOutSuccess', (data) => {
    updateGameState('cashed out');
    isCashout=true;
    resultDisplay.textContent = `Cashed out at ${data.altitude.toFixed(2)}x. Winnings: ₹ ${data.winnings.toFixed(2)}`;
    resultDisplay.style.color = 'green';
});

socket.on('gameStarted', () => {
    updateGameState('flying');
});