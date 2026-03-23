/* jshint esversion: 6 */
/* exported startCrono, resetCrono, stopCrono */

let segundos = 0;
let minutos = 0;
let idIntervalo = null; // Aquí guardamos el "motor" para poder pararlo luego

function actualizarCrono() {
    segundos++;
    if (segundos === 60) {
        segundos = 0;
        minutos++;
    }

    // Formateamos para que siempre se vean dos dígitos (ej: 05 en vez de 5)
    let s = segundos < 10 ? "0" + segundos : segundos;
    let m = minutos < 10 ? "0" + minutos : minutos;

    // Lo pintamos en el HTML (asegúrate de tener un id="crono")
    document.getElementById("crono").innerText = m + ":" + s;
}

function startCrono() {
    // Si ya está corriendo, no hacemos nada (evita que el tiempo vaya al doble de velocidad)
    if (idIntervalo !== null) return;

    // Arrancamos el motor: ejecuta actualizarCrono cada 1000ms
    idIntervalo = setInterval(actualizarCrono, 1000);
}

function stopCrono() {
    // Paramos el motor usando el ID que guardamos
    clearInterval(idIntervalo);
    idIntervalo = null; 
}

function resetCrono() {
    stopCrono(); // Primero paramos
    segundos = 0;
    minutos = 0;
    document.getElementById("crono").innerText = "00:00"; // Limpiamos la pantalla
}