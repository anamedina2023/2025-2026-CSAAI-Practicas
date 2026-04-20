/* jshint esversion: 8 */

const levelsConfig = {
    set1: {
        words: ["Pato", "Plato"],
        patterns: [
            [0,0,0,0,1,1,1,1], // Nivel 1: 4 y 4
            [0,1,0,1,0,1,0,1], // Nivel 2: Alternado
            [0,0,1,1,0,0,1,1], // Nivel 3: Pares
            [1,0,1,1,0,1,0,0], // Nivel 4: Aleatorio manual
            [0,1,1,0,1,0,0,1]  // Nivel 5: Espejo
        ]
    },
    set2: {
        words: ["Luna", "Lupa"],
        patterns: [
            [0,0,0,0,1,1,1,1], [0,1,0,1,0,1,0,1], [0,0,1,1,0,0,1,1], [1,0,0,1,0,1,1,0], [0,1,1,0,0,1,1,0]
        ]
    }
};

const speeds = [1000, 800, 600, 400, 250]; // Velocidad en ms por nivel

// Variables de estado
let currentLevel = 1;
let timer = 0;
let timerInterval = null;
let gameInterval = null;
let isMusicOn = false;

// Elementos DOM
const grid = document.getElementById('grid');
const btnStart = document.getElementById('btn-start');
const btnStop = document.getElementById('btn-stop');
const btnMusic = document.getElementById('btn-music');
const audio = document.getElementById('bg-music');
const wordHint = document.getElementById('word-hint');

// Inicializar cuadrícula vacía
function createGrid() {
    grid.innerHTML = '';
    for (let i = 0; i < 8; i++) {
        const div = document.createElement('div');
        div.classList.add('cell');
        
        // Dentro de tu bucle for en createGrid:
        const img = document.createElement('img');
        img.src = ""; // La dejamos vacía por ahora
        img.alt = "Imagen del reto";
        img.id = `img-${i}`; // Le ponemos un ID para encontrarla luego
        div.appendChild(img);
        grid.appendChild(div);
    }
}

function updateUI() {
    document.getElementById('val-level').innerText = currentLevel;
    document.getElementById('val-time').innerText = timer;
}

async function startLevel(levelNum) {
    if (levelNum > 5) return finishGame();
    
    currentLevel = levelNum;
    updateUI();
    document.getElementById('val-status').innerText = "Jugando";
    
    const setKey = document.getElementById('select-set').value;
    const pattern = levelsConfig[setKey].patterns[levelNum - 1];
    const words = levelsConfig[setKey].words;

    wordHint.innerText = "¡NIVEL " + levelNum + "!";
    await new Promise(r => setTimeout(r, 1500)); // Breve preparación

    let step = 0;
    const cells = document.querySelectorAll('.cell');

    return new Promise((resolve) => {
        gameInterval = setInterval(() => {
            // Limpiar anterior
            cells.forEach(c => c.classList.remove('active'));
            
            if (step < 8) {
                const wordIndex = pattern[step];
                wordHint.innerText = words[wordIndex];
                const currentWord = words[wordIndex].toLowerCase();
                const imgElement = cells[step].querySelector('img'); 
                imgElement.src = `img/${currentWord}${step % 4}.jpg`;
                cells[step].classList.add('active');
                step++;
            } else {
                clearInterval(gameInterval);
                resolve();
            }
        }, speeds[levelNum - 1]);
    });
}

async function startGame() {
    const startLvl = parseInt(document.getElementById('select-level').value);
    
    // Bloquear controles
    btnStart.disabled = true;
    btnStop.disabled = false;
    document.getElementById('select-set').disabled = true;
    document.getElementById('select-level').disabled = true;
    
    timer = 0;
    timerInterval = setInterval(() => { timer++; updateUI(); }, 1000);
    
    if (isMusicOn) audio.play();

    for (let l = startLvl; l <= 5; l++) {
        if (btnStart.disabled === false) break; // Si se detuvo manualmente
        await startLevel(l);
    }
    
    if (btnStart.disabled) finishGame();
}

function stopGame() {
    clearInterval(timerInterval);
    clearInterval(gameInterval);
    audio.pause();
    audio.currentTime = 0;
    
    btnStart.disabled = false;
    btnStop.disabled = true;
    document.getElementById('select-set').disabled = false;
    document.getElementById('select-level').disabled = false;
    document.getElementById('val-status').innerText = "Detenido";
    wordHint.innerText = "JUEGO PARADO";
    document.querySelectorAll('.cell img').forEach(img => img.src = "");
}

function finishGame() {
    stopGame();
    document.getElementById('val-status').innerText = "¡FIN!";
    wordHint.innerText = "¡Reto completado!";
    alert("¡Felicidades! Has terminado todos los niveles.");
}

// Eventos
btnStart.addEventListener('click', startGame);
btnStop.addEventListener('click', stopGame);
btnMusic.addEventListener('click', () => {
    isMusicOn = !isMusicOn;
    btnMusic.innerText = isMusicOn ? "Música: ON" : "Música: OFF";
    if (isMusicOn && btnStart.disabled) audio.play();
    else audio.pause();
});

// Inicialización
createGrid();