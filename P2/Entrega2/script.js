/* jshint esversion: 6 */
/* exported presionarDigito */

// Variables del juego
let claveSecreta = [];
let intentosRestantes = 7;
let aciertos = 0;
let tiempoSegundos = 0;
let intervaloCrono = null;

const elCrono = document.getElementById('crono');
const elIntentos = document.getElementById('intentos');
const elMensaje = document.getElementById('mensaje');
const botonesNumericos = document.querySelectorAll('.btn-num');

window.onload = function() {
    resetJuego();
};

function generarClave() {
    let digitos = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    digitos.sort(function() { return Math.random() - 0.5; });
    return digitos.slice(0, 4);
}

function presionarDigito(num) {
    if (intentosRestantes <= 0 || aciertos === 4) { return; }
    if (!intervaloCrono) { startCrono(); }

    intentosRestantes--;
    elIntentos.textContent = intentosRestantes;

    botonesNumericos.forEach(function(boton) {
        if (parseInt(boton.textContent) === num) { boton.disabled = true; }
    });

    claveSecreta.forEach(function(digitoSecreto, indice) {
        if (digitoSecreto === num) {
            const elDigito = document.getElementById(`d${indice}`);
            elDigito.textContent = num;
            elDigito.classList.add('acierto');
            aciertos++;
        }
    });

    verificarEstadoFinal();
}

function verificarEstadoFinal() {
    if (aciertos === 4) {
        stopCrono();
        const tiempoFinal = elCrono.textContent;
        const consumidos = 7 - intentosRestantes;
        
        elMensaje.innerHTML = `¡Clave descubierta! Tiempo: ${tiempoFinal} · Intentos consumidos: ${consumidos} · Intentos restantes: ${intentosRestantes}`;
        elMensaje.style.color = 'var(--azul-brillante)';
        desactivarTodo();
    } 
    else if (intentosRestantes === 0) {
        stopCrono();
        claveSecreta.forEach(function(digito, indice) {
            const el = document.getElementById(`d${indice}`);
            el.textContent = digito;
            if (!el.classList.contains('acierto')) {
                el.classList.add('fallo');
            }
        });

        elMensaje.innerHTML = `BOOM. Has agotado los intentos. La clave correcta era ${claveSecreta.join('')}. Pulsa Reset para jugar otra vez.`;
        elMensaje.style.color = 'var(--morado-retro)';
        desactivarTodo();
    }
}

function startCrono() {
    if (!intervaloCrono) {
        intervaloCrono = setInterval(function() {
            tiempoSegundos++;
            actualizarCronoUI();
        }, 1000);
    }
}

function stopCrono() {
    clearInterval(intervaloCrono);
    intervaloCrono = null;
}

function actualizarCronoUI() {
    const horas = Math.floor(tiempoSegundos / 3600);
    const minutos = Math.floor((tiempoSegundos % 3600) / 60);
    const segundos = tiempoSegundos % 60;
    elCrono.textContent = `${horas}:${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`;
}

function desactivarTodo() {
    botonesNumericos.forEach(function(b) { b.disabled = true; });
}

function resetJuego() {
    stopCrono();
    tiempoSegundos = 0;
    intentosRestantes = 7;
    aciertos = 0;
    claveSecreta = generarClave();
    
    elCrono.textContent = "0:00:00";
    elIntentos.textContent = "7";
    elMensaje.textContent = "Nueva partida preparada. Pulsa Start o un número para comenzar.";
    elMensaje.style.color = 'var(--azul-brillante)';
    
    document.querySelectorAll('.digito-clave').forEach(function(el) {
        el.textContent = "*";
        el.classList.remove('acierto');
        el.classList.remove('fallo');
        el.style.color = ''; 
    });
    botonesNumericos.forEach(function(b) { b.disabled = false; });
}