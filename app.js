import * as dbFunctions from './helpers/dbfunctions.js';
import * as uiUtils from './helpers/uiUtils.js';

const lobbyDiv = document.getElementById('lobby');
const gameDiv = document.getElementById('game');

const playerNameInput = document.getElementById('playerName');
const createGameBtn = document.getElementById('createGameBtn');
const joinBtn = document.getElementById('joinBtn');
const joinCodeInput = document.getElementById('joinCode');

const waitingRoomDiv = document.getElementById('waitingRoom');
const waitingGameCodeSpan = document.getElementById('waitingGameCode');
const waitingPlayersDiv = document.getElementById('waitingPlayersList');
const addBotBtn = document.getElementById('addBotBtn');
const startGameBtn = document.getElementById('startGameBtn');
const leaveWaitingRoomBtn = document.getElementById('leaveWaitingRoomBtn');

createGameBtn.addEventListener('click', async () => {
    console.log('Create Game button clicked');
    const player = {
        name: playerNameInput.value.trim(),
        id: Date.now().toString() // Simple unique ID based on timestamp
    };
    await createGame(player);
});

joinBtn.addEventListener('click', async () => {
    console.log('Join Game button clicked');
});

async function createGame(player) {
    const game = {
        id: Math.random().toString(36).substring(2, 8).toUpperCase(), // Generate a random 6-character game code
        host: player,
        players: [player],
        gameState: 'waiting', // waiting, started, finished
    };
    const createGameResponse = await dbFunctions.createItem('games', game);
    if (!createGameResponse.success) {
        console.error(createGameResponse);
        await uiUtils.showMessageBox('Feil ved opprettelse av spill: ' + createGameResponse.error, 'error', 5000);
        return;
    }
    const gameCode = createGameResponse.id; // Store the game code for later use
    localStorage.setItem('gameCode', gameCode); // Store game code in localStorage for persistence
    localStorage.setItem('player', JSON.stringify(player)); // Store player name for later use
    uiUtils.showMessageBox('Spill opprettet! Din spillkode er: ' + gameCode, 'success', 3000);

    // kode eller vise til funksjon som oppdaterer UI.
    // vise kode og spillere som har blitt med i spillet.
    // Vert får også en knapp for å starte spillet når alle spillere har blitt med.
}

async function getGameData(code) {
    const getGameResponse = await dbFunctions.getItemById('games', code);
    if (!getGameResponse.success) {
        console.error(getGameResponse);
        await uiUtils.showMessageBox('Feil ved innhenting av spill: ' + getGameResponse.error, 'error', 5000);
        return;
    }
    const game = getGameResponse.data;
    return game;
}

async function joinGame(player, code) {
    const game = await getGameData(code);
    if (!game) {
        await uiUtils.showMessageBox('Spill ikke funnet med kode: ' + code, 'error', 5000);
        return;
    }
    if (game.gameState !== 'waiting') {
        await uiUtils.showMessageBox('Spillet har allerede startet eller er avsluttet.', 'warning', 5000);
        return;
    }
    if (game.players.length >= 20) { // Assuming max 20 players
        await uiUtils.showMessageBox('Spillet er fullt.', 'warning', 5000);
        return;
    }

    game.players.push(player);
    const updateGameResponse = await dbFunctions.updateItem('games', code, game);
    if (!updateGameResponse.success) {
        console.error(updateGameResponse);
        await uiUtils.showMessageBox('Feil ved oppdatering av spill: ' + updateGameResponse.error, 'error', 5000);
        return;
    }
    uiUtils.showMessageBox('Du har blitt med i spi  llet! Vent på at verten starter spillet.', 'success', 3000);
    localStorage.setItem('gameCode', code); // Store game code in localStorage for persistence
    localStorage.setItem('player', JSON.stringify(player)); // Store player name for later use

    // kode eller vise til funksjon som oppdaterer UI.
    // vise kode og spillere som har blitt med i spillet.
}

async function waitingRoom() {
    const gameCode = localStorage.getItem('gameCode');
    const player = JSON.parse(localStorage.getItem('player'));
    if (!gameCode || !player) {
        await uiUtils.showMessageBox('Ingen spillkode eller spillerdata funnet. Vennligst opprett eller bli med i et spill først.', 'error', 5000);
        return;
    }
    lobbyDiv.hidden = true;
    waitingRoomDiv.hidden = false;
    waitingGameCodeSpan.textContent = gameData.id;
    let loadingData = false;
    const intervalId = setInterval(async () => {
        if (loadingData) return; // Prevent overlapping calls
        loadingData = true;
        const gameData = await getGameData(localStorage.getItem('gameCode'));
        if (!gameData) {
            await uiUtils.showMessageBox('Feil ved innhenting av spilldata: Spill ikke funnet.', 'error', 5000);
            return;
        }
        loadingData = false;
        if (!gameData.Gamestate === 'waiting' || !gameData.gameState === 'started') {
            await uiUtils.showMessageBox('Spillet er ikke i en gyldig tilstand.', 'error', 5000);
            waitingRoomDiv.hidden = true;
            lobbyDiv.hidden = false;
            clearInterval(intervalId);
            return;
        }
        waitingPlayersDiv.innerHTML = '';
        gameData.players.forEach(p => {
            const playerDiv = document.createElement('div');
            playerDiv.textContent = p.name + (p.id === gameData.host.id ? ' (Vert)' : '');
            waitingPlayersDiv.appendChild(playerDiv);
        });
        // Sjekke om spillet er startet
        if (gameData.gameState === 'started') {
            // Gå til spillvisning
            waitingRoomDiv.hidden = true;
            gameDiv.hidden = false;
            clearInterval(intervalId); // Stop polling for game data

            // Kjøre funksjon for å starte spillet, f.eks. startGame();
            
        }
    }, 5000);
 }