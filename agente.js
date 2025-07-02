// agente.js (Versión Final con Acumulación de Datos)

const express = require('express');
const { SerialPort } = require('serialport');
const cors = require('cors');
require('dotenv').config();

const app = express();

const AGENTE_PORT = process.env.AGENTE_PORT || 12345;
const PUERTO_BALANZA = process.env.PUERTO_BALANZA || 'COM3';
const BAUDRATE_BALANZA = parseInt(process.env.BAUDRATE_BALANZA) || 9600;
const DATA_BITS_BALANZA = parseInt(process.env.DATA_BITS) || 8;
const ORIGIN_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const MODO_SIMULACION_ACTIVO = process.env.SIMULACION_BALANZA === 'true';

app.use(cors({ origin: ORIGIN_URL }));

let ultimoPesoRecibido = "0.000";

if (MODO_SIMULACION_ACTIVO) {
    // La lógica de simulación no cambia
    console.log('*** MODO SIMULACIÓN ACTIVADO ***');
    setInterval(() => {
        ultimoPesoRecibido = (Math.random() * 20).toFixed(3);
        console.log(`Peso simulado generado: ${ultimoPesoRecibido}`);
    }, 3000);
} else {
    try {
        const port = new SerialPort({
            path: PUERTO_BALANZA,
            baudRate: BAUDRATE_BALANZA,
            dataBits: DATA_BITS_BALANZA,
            parity: 'none',
            stopBits: 1,
        });

        let tramaDeDatos = ''; // Variable para acumular los caracteres

        port.on('open', () => {
            console.log(`\n*** Conexión exitosa con ${PUERTO_BALANZA}. Esperando datos... ***\n`);
        });

        port.on('data', function (data) {
            const caracterRecibido = data.toString('ascii');

            // Comprobamos si hemos recibido el carácter de fin de transmisión (retorno de carro)
            if (caracterRecibido.includes('\r')) {
                console.log(`Trama completa recibida: [${tramaDeDatos}]`);

                // Procesamos la trama acumulada
                // El código C# hacía .Substring(1, 6). Lo replicamos.
                if (tramaDeDatos.length >= 7) { // Asegurarnos de que la trama es suficientemente larga
                    const pesoExtraido = tramaDeDatos.substring(1, 7);
                    const pesoNumerico = parseFloat(pesoExtraido.replace(',', '.')).toFixed(3);

                    if (!isNaN(pesoNumerico)) {
                        ultimoPesoRecibido = pesoNumerico;
                        console.log(`>>> PESO PROCESADO: ${ultimoPesoRecibido} Kg <<<`);
                    }
                }
                
                // Limpiamos la trama para la siguiente lectura
                tramaDeDatos = ''; 
            } else {
                // Si no es el fin, seguimos acumulando los caracteres
                tramaDeDatos += caracterRecibido;
            }
        });

        port.on('error', (err) => {
            console.error(`Error en el puerto serie: ${err.message}.`);
            ultimoPesoRecibido = "Error";
        });

    } catch (err) {
        console.error(`Error crítico al abrir el puerto.`, err);
        ultimoPesoRecibido = "Error Puerto";
    }
}

app.get('/peso', (req, res) => {
    res.json({ success: true, peso: ultimoPesoRecibido });
});

app.listen(AGENTE_PORT, () => {
    console.log(`*** Agente de Balanza corriendo en http://localhost:${AGENTE_PORT} ***`);
});