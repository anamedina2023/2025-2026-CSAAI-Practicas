
/* jshint esversion: 6 */

// --- CONFIGURACIÓN DEL CANVAS ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// dimensiones fijas para el juego
canvas.width = 800;
canvas.height = 600;

// --- VARIABLES DEL JUEGO ---
let score = 0;
let lives = 3;
let energy = 100;
const MAX_ENERGY = 100;
const SHOT_COST = 20;
let gameRunning = true;
let win = false;

// --- CARGA DE SONIDOS ---
const laserSound = new Audio('https://cdn.pixabay.com/audio/2022/03/15/audio_2e2c836967.mp3'); 
const explosionSound = new Audio('https://cdn.pixabay.com/audio/2022/03/19/audio_2e6f491e84.mp3'); 
const winSound = new Audio('https://cdn.pixabay.com/audio/2022/03/15/audio_1e3e8f85d2.mp3'); 
const gameOverSound = new Audio('https://cdn.pixabay.com/audio/2022/03/15/audio_8e7c1a8e1e.mp3'); 
laserSound.volume = 0.3;
explosionSound.volume = 0.5;

// --- CARGA DE IMÁGENES ---
const playerImg = new Image();
playerImg.src = 'assets/nave.png'; 

const alienImg = new Image();
alienImg.src = 'assets/alien.png';

const explosionImg = new Image();
explosionImg.src = 'assets/explosion.png';

let imagesLoaded = 0;
const totalImages = 3;

function imageLoaded() {
    imagesLoaded++;
    if (imagesLoaded === totalImages) {
        initGame(); 
        update();
    }
}

playerImg.onload = imageLoaded;
alienImg.onload = imageLoaded;
explosionImg.onload = imageLoaded;

// --- OBJETOS DEL JUEGO ---


const player = {
    x: canvas.width / 2 - 25,
    y: canvas.height - 70,
    w: 50,
    h: 50,
    speed: 7,
    dx: 0
};


let bullets = [];
let enemyBullets = [];
let explosions = []; 


let aliens = [];
const alienRows = 3;
const alienCols = 8;
let alienSpeed = 1;


function initGame() {
    aliens = [];
    bullets = [];
    enemyBullets = [];
    explosions = [];
    score = 0;
    lives = 3;
    energy = 100;
    alienSpeed = 1;
    gameRunning = true;
    win = false;

    for (let r = 0; r < alienRows; r++) {
        for (let c = 0; c < alienCols; c++) {
            aliens.push({
                x: 150 + c * 60, 
                y: 100 + r * 60, 
                w: 40,
                h: 40,
                alive: true
            });
        }
    }
}

// --- CONTROLES DE TECLADO ---
document.addEventListener('keydown', (e) => {
    if (!gameRunning) {
        if (e.key === 'r' || e.key === 'R') initGame(); 
        return;
    }
    if (e.key === 'ArrowLeft') player.dx = -player.speed;
    if (e.key === 'ArrowRight') player.dx = player.speed;
    if (e.key === ' ' || e.key === 'Spacebar') {
        if (energy >= SHOT_COST) shoot();
    }
});

document.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') player.dx = 0;
});

// disparo del jugador
function shoot() {
    bullets.push({ 
        x: player.x + player.w / 2 - 2, 
        y: player.y, 
        w: 4, 
        h: 15 
    });
    energy -= SHOT_COST;
    laserSound.currentTime = 0; // para reiniciar el sonido si ya sonaba
    laserSound.play();
}


function update() {
    if (!gameRunning) {
        draw(); 
        return;
    }

    // 1. mover nave
    player.x += player.dx;
    // limites del canvas
    if (player.x < 10) player.x = 10;
    if (player.x + player.w > canvas.width - 10) player.x = canvas.width - player.w - 10;

    // 2. para mover las balas de la nave
    bullets.forEach((b, i) => {
        b.y -= 10; 
        if (b.y < 0) bullets.splice(i, 1); 
    });

    // 3. mover a los aliens y aumentar su velocidad
    let totalAliens = aliens.filter(a => a.alive).length;
    let speedFactor = 1 + (alienRows * alienCols - totalAliens) * 0.1; 
    
    let moveDown = false;
    aliens.forEach(a => {
        if (!a.alive) return;
        a.x += alienSpeed * speedFactor;
        
        if (a.x + a.w > canvas.width - 10 || a.x < 10) moveDown = true;
        
        // pierde si aliens nos alcanzan
        if (a.y + a.h > player.y) endGame(false);
    });

    if (moveDown) {
        alienSpeed *= -1; 
        aliens.forEach(a => a.y += 20); 
    }

    // 4. disparo alien 
    if (Math.random() < 0.015 && totalAliens > 0) { 
        let activeAliens = aliens.filter(a => a.alive);
        // elegir alien
        let shooter = activeAliens[Math.floor(Math.random() * activeAliens.length)];
        enemyBullets.push({ 
            x: shooter.x + shooter.w / 2 - 2, 
            y: shooter.y + shooter.h, 
            w: 4, 
            h: 10 
        });
    }

    // 5. para mover las colisiones de balas de los aliens
    enemyBullets.forEach((eb, i) => {
        eb.y += 5; 
        
        // choque con la nave del jugador
        if (eb.x < player.x + player.w && eb.x + eb.w > player.x && 
            eb.y < player.y + player.h && eb.y + eb.h > player.y) {
            lives--;
            enemyBullets.splice(i, 1);
            if (lives <= 0) endGame(false);
        }
        
        // eliminar si sale de pantalla
        if (eb.y > canvas.height) enemyBullets.splice(i, 1);
    });

    // 6. disparos jugador a aliens
    bullets.forEach((b, bi) => {
        aliens.forEach((a) => {
            if (a.alive && b.x < a.x + a.w && b.x + b.w > a.x && 
                b.y < a.y + a.h && b.y + b.h > a.y) {
                
                a.alive = false; 
                bullets.splice(bi, 1); 
                score += 10; 
                
                // efecto de explosión temporal 
                explosions.push({ x: a.x, y: a.y, w: a.w, h: a.h, timer: 15 });
                
                explosionSound.currentTime = 0;
                explosionSound.play();
                
                // victoria si no quedan aliens
                if (aliens.every(al => !al.alive)) endGame(true);
            }
        });
    });

    // 7. actualizamos temporizador de explosiones
    explosions.forEach((exp, i) => {
        exp.timer--;
        if (exp.timer <= 0) explosions.splice(i, 1);
    });

    // 8. recarga de energia
    if (energy < MAX_ENERGY) energy += 0.5; // velocidad de recarga

    draw();
    requestAnimationFrame(update); // bucle infinito del juego
}

// --- FUNCIONES DE DIBUJO ---
function draw() {
    // Limpiar pantalla
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Dibujar UI (Puntuación, Vidas, Energía)
    ctx.fillStyle = '#fff';
    ctx.font = '16px "Press Start 2P"';
    ctx.textAlign = 'left';
    ctx.fillText('Puntuación: ' + score, 20, 40);
    ctx.fillText('Vidas: ' + lives, canvas.width - 160, 40);

    // Barra de Energía
    ctx.fillText('Energía:', 20, canvas.height - 20);
    ctx.strokeStyle = '#fff';
    ctx.strokeRect(140, canvas.height - 35, 100, 20);
    ctx.fillStyle = energy < SHOT_COST ? 'red' : '#00f2ff';
    ctx.fillRect(142, canvas.height - 33, Math.max(0, energy - 4), 16);

    // Dibujar Jugador 
    ctx.drawImage(playerImg, player.x, player.y, player.w, player.h);

    // Dibujar Balas del Jugador 
    ctx.fillStyle = '#ff0000';
    bullets.forEach(b => ctx.fillRect(b.x, b.y, b.w, b.h));
    
    // Dibujar Balas Enemigas 
    ctx.fillStyle = '#ffcc00';
    enemyBullets.forEach(eb => ctx.fillRect(eb.x, eb.y, eb.w, eb.h));

    // Dibujar Alienígenas 
    aliens.forEach(a => {
        if (a.alive) {
            ctx.drawImage(alienImg, a.x, a.y, a.w, a.h);
        }
    });

    // Dibujar Efectos de Explosión
    explosions.forEach(exp => {
        ctx.drawImage(explosionImg, exp.x, exp.y, exp.w, exp.h);
    });

    // Pantallas de Fin de Juego (Victory / Game Over)
    if (!gameRunning) {
        ctx.textAlign = 'center';
        if (win) {
            ctx.fillStyle = '#00ff00'; 
            ctx.font = '40px "Press Start 2P"';
            ctx.fillText('VICTORY!', canvas.width / 2, canvas.height / 2);
        } else {
            ctx.fillStyle = '#ff0000'; 
            ctx.font = '40px "Press Start 2P"';
            ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2);
        }
    }
}

// para terminar el juego y reproducir sonido
function endGame(isWin) {
    gameRunning = false;
    win = isWin;
    if (win) {
        winSound.play();
    } else {
        gameOverSound.play();
    }
}

// --- FUNCIÓN PARA DESBLOQUEAR EL AUDIO ---
function resumeAudioContext() {
    // para los navegadores que necesitan que el audio siga despues de dar a una tecla
    if (laserSound.paused) {
        laserSound.play().then(() => {
            laserSound.pause();
            laserSound.currentTime = 0;
        }).catch(e => console.log("Esperando interacción para audio..."));
    }
}

document.addEventListener('keydown', (e) => {
    // LLAMADA AL DESBLOQUEADOR: se ejecuta en el primer pulso de la tecla
    resumeAudioContext();

    if (!gameRunning) {
        if (e.key === 'r' || e.key === 'R') initGame();
        return;
    }
    
    if (e.key === 'ArrowLeft') player.dx = -player.speed;
    if (e.key === 'ArrowRight') player.dx = player.speed;
    
    if (e.key === ' ' || e.key === 'Spacebar') {
        if (energy >= SHOT_COST) shoot();
    }
});

// para forzar el desbloqueo del audio
window.addEventListener('mousedown', () => {
    [laserSound, explosionSound, winSound, gameOverSound].forEach(s => {
        s.play().then(() => {
            s.pause();
            s.currentTime = 0;
        }).catch(e => {});
    });
    console.log("Audio desbloqueado");
}, { once: true }); 