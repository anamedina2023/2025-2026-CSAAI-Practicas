/* jshint esversion: 6 */
/* jshint browser: true */

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 800;
canvas.height = 600;

// --- CONFIGURACIÓN DEL CAMPO ---
const FIELD_X = 50;
const FIELD_Y = 120; 
const FIELD_W = 700;
const FIELD_H = 400;

// ESTADOS
const STATE_MENU = 'MENU';
const STATE_PLAYING = 'PLAYING';
const STATE_COUNTDOWN = 'COUNTDOWN';
const STATE_GOAL = 'GOAL';
const STATE_GAMEOVER = 'GAMEOVER';

let gameState = STATE_MENU;
let gameMode = '3GOLES';
let scorePlayer = 0;
let scoreCPU = 0;
let countdownValue = 3;
let message = "";

const keys = {};
window.addEventListener('keydown', e => {
    keys[e.code] = true;
    if (gameState === STATE_MENU) {
        if (e.key === '1') { gameMode = '3GOLES'; startMatch(); }
        if (e.key === '2') { gameMode = 'GOLDEN'; startMatch(); }
    }
    if (gameState === STATE_GAMEOVER && (e.key === 'r' || e.key === 'R')) resetAll();
});
window.addEventListener('keyup', e => keys[e.code] = false);

// --- CLASE JUGADOR ---
class Player {
    constructor(x, y, color, isBot, isMain) {
        this.startX = x; this.startY = y;
        this.x = x; this.y = y;
        this.color = color;
        this.isBot = isBot;
        this.isMain = isMain;
        this.radius = 15;
        this.speed = 4;
        this.angle = isBot ? Math.PI : 0;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.strokeStyle = "white";
        ctx.lineWidth = 2;
        ctx.stroke();

        // Triángulo de dirección
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        ctx.beginPath();
        ctx.moveTo(this.radius + 2, 0);
        ctx.lineTo(this.radius + 8, -5);
        ctx.lineTo(this.radius + 8, 5);
        ctx.fillStyle = "white";
        ctx.fill();
        ctx.restore();
    }

    update() {
        if (!this.isMain) {
            // IA básica
            let dx = ball.x - this.x;
            let dy = ball.y - this.y;
            let dist = Math.sqrt(dx*dx + dy*dy);
            if (dist < 250) {
                this.x += (dx/dist) * 2.5;
                this.y += (dy/dist) * 2.5;
                this.angle = Math.atan2(dy, dx);
                if (dist < 25) this.kick();
            }
        } else {
            // Controles Jugador
            if (keys.ArrowUp) this.y -= this.speed;
            if (keys.ArrowDown) this.y += this.speed;
            if (keys.ArrowLeft) this.x -= this.speed;
            if (keys.ArrowRight) this.x += this.speed;
            if (keys.KeyA) this.angle -= 0.1;
            if (keys.KeyD) this.angle += 0.1;
            if (keys.Space) this.kick();
        }

        // LÍMITES DENTRO DEL CAMPO VERDE
        this.x = Math.max(FIELD_X + this.radius, Math.min(FIELD_X + FIELD_W - this.radius, this.x));
        this.y = Math.max(FIELD_Y + this.radius, Math.min(FIELD_Y + FIELD_H - this.radius, this.y));
    }

    kick() {
        let dx = ball.x - this.x;
        let dy = ball.y - this.y;
        let dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < this.radius + ball.radius + 5) {
            ball.dx = Math.cos(this.angle) * 10;
            ball.dy = Math.sin(this.angle) * 10;
        }
    }
}

const ball = {
    x: 400, y: 320, radius: 10, dx: 0, dy: 0, friction: 0.98,
    update() {
        this.x += this.dx; this.y += this.dy;
        this.dx *= this.friction; this.dy *= this.friction;

        // Rebotes Verticales
        if (this.y - this.radius < FIELD_Y || this.y + this.radius > FIELD_Y + FIELD_H) this.dy *= -1;

        // Paredes laterales y Goles
        if (this.x - this.radius < FIELD_X || this.x + this.radius > FIELD_X + FIELD_W) {
            if (this.y > FIELD_Y + 130 && this.y < FIELD_Y + 270) {
                if (this.x < 400) scoreCPU++; else scorePlayer++;
                message = this.x < 400 ? "¡Gol rival!" : "¡GOOOL!";
                goalScored();
            } else {
                this.dx *= -1;
            }
        }
    },
    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = "white"; ctx.fill();
        ctx.strokeStyle = "black"; ctx.stroke();
    }
};

const entities = [
    new Player(200, 320, '#2b7fff', false, true),  // Principal (Azul)
    new Player(380, 320, '#55ccff', true, false),  // Aliado (Celeste)
    new Player(550, 320, '#ff4444', true, false),  // Rival 1 (Rojo)
    new Player(650, 320, '#ff4444', true, false)   // Rival 2
];

function startMatch() {
    gameState = STATE_COUNTDOWN;
    countdownValue = 3;
    let timer = setInterval(() => {
        countdownValue--;
        if (countdownValue <= 0) { clearInterval(timer); gameState = STATE_PLAYING; }
    }, 1000);
}

function goalScored() {
    gameState = STATE_GOAL;
    setTimeout(() => {
        if ((gameMode === '3GOLES' && (scorePlayer >= 3 || scoreCPU >= 3)) || gameMode === 'GOLDEN') {
            gameState = STATE_GAMEOVER;
        } else {
            resetPositions();
            startMatch();
        }
    }, 2000);
}

function resetPositions() {
    ball.x = 400; ball.y = FIELD_Y + (FIELD_H/2);
    ball.dx = 0; ball.dy = 0;
    entities.forEach(e => { e.x = e.startX; e.y = e.startY; });
}

function resetAll() {
    scorePlayer = 0; scoreCPU = 0;
    resetPositions();
    gameState = STATE_MENU;
}

function draw() {
    // Fondo negro
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Títulos (Fuera del campo)
    ctx.fillStyle = "white"; ctx.textAlign = "center";
    ctx.font = "bold 36px Arial"; ctx.fillText("Bot League", 400, 50);
    ctx.font = "16px Arial"; ctx.fillText("Versión 0 · Movimiento, dirección y chut", 400, 80);

    // Campo Verde
    ctx.fillStyle = "#2e7d32";
    ctx.fillRect(FIELD_X, FIELD_Y, FIELD_W, FIELD_H);
    ctx.strokeStyle = "white"; ctx.lineWidth = 4;
    ctx.strokeRect(FIELD_X, FIELD_Y, FIELD_W, FIELD_H);
    
    // Líneas campo
    ctx.beginPath(); ctx.moveTo(400, FIELD_Y); ctx.lineTo(400, FIELD_Y + FIELD_H); ctx.stroke();
    ctx.beginPath(); ctx.arc(400, FIELD_Y + (FIELD_H/2), 60, 0, Math.PI*2); ctx.stroke();
    
    // Porterías
    ctx.fillStyle = "#ccc";
    ctx.fillRect(FIELD_X - 10, FIELD_Y + 130, 10, 140);
    ctx.fillRect(FIELD_X + FIELD_W, FIELD_Y + 130, 10, 140);

    // Marcador
    if (gameState !== STATE_MENU) {
        ctx.font = "bold 40px Arial";
        ctx.fillText(`${scorePlayer} - ${scoreCPU}`, 400, FIELD_Y - 30);
        ctx.font = "16px Arial";
        ctx.fillText(gameMode === '3GOLES' ? "A 3 goles" : "Gol de oro", 400, FIELD_Y - 10);
    }

    // dibujar elementos
    if (gameState !== STATE_MENU) {
        ball.draw();
        entities.forEach(e => e.draw());
    }

    // HUD según estado
    if (gameState === STATE_MENU) {
        ctx.fillStyle = "rgba(0,0,0,0.7)"; ctx.fillRect(FIELD_X, FIELD_Y, FIELD_W, FIELD_H);
        ctx.fillStyle = "white"; ctx.font = "bold 30px Arial";
        ctx.fillText("Elige modo de juego", 400, 300);
        ctx.font = "20px Arial";
        ctx.fillText("Pulsa 1: Partido a 3 goles | Pulsa 2: Gol de oro", 400, 340);
    }
    
    if (gameState === STATE_COUNTDOWN) {
        ctx.font = "bold 80px Arial"; ctx.fillText(countdownValue, 400, 350);
    }

    if (gameState === STATE_GOAL) {
        ctx.font = "bold 70px Arial"; ctx.fillText(message, 400, 350);
    }

    if (gameState === STATE_GAMEOVER) {
        ctx.font = "bold 50px Arial";
        ctx.fillText(scorePlayer > scoreCPU ? "¡Has ganado!" : "¡Has perdido!", 400, 300);
        ctx.font = "20px Arial"; ctx.fillText("Pulsa R para reiniciar", 400, 360);
    }

    // controles abajo
    ctx.font = "bold 14px Arial";
    ctx.fillText("Controles: Flechas para mover · A/D para girar la dirección · Espacio para chutar", 400, 580);
}

function loop() {
    if (gameState === STATE_PLAYING) {
        ball.update();
        entities.forEach(e => e.update());
    }
    draw();
    requestAnimationFrame(loop);
}

loop();