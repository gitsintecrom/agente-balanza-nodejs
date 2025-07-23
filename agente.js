// agente.js (versión final con rango de simulación configurable)

const express = require('express');
const { SerialPort } = require('serialport');
const cors = require('cors');
require('dotenv').config();

const app = express();

// --- LECTURA DE VARIABLES DE ENTORNO ---
const AGENTE_PORT = process.env.AGENTE_PORT || 12345;
const PUERTO_BALANZA = process.env.PUERTO_BALANZA || 'COM3';
const BAUDRATE_BALANZA = parseInt(process.env.BAUDRATE_BALANZA) || 9600;
const DATA_BITS_BALANZA = parseInt(process.env.DATA_BITS) || 8;
const MODO_SIMULACION_ACTIVO = process.env.SIMULACION_BALANZA === 'true';

// Nuevas variables para el rango de simulación, con valores por defecto
const SIMULACION_MIN = parseFloat(process.env.SIMULACION_MIN) || 0;
const SIMULACION_MAX = parseFloat(process.env.SIMULACION_MAX) || 20;

const allowedOrigins = [
  'http://localhost:5173',
  'http://192.168.10.69',
];
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('La política de CORS no permite el acceso desde este origen.'));
    }
  }
};
app.use(cors(corsOptions));

let ultimoPesoRecibido = "0.000";

// --- LÓGICA DE CONEXIÓN O SIMULACIÓN ---
if (MODO_SIMULACION_ACTIVO) {
  console.log('----------------------------------------------------');
  console.log('*** MODO SIMULACIÓN FORZADO DESDE .env ***');
  console.log(`Generando pesos aleatorios entre ${SIMULACION_MIN} y ${SIMULACION_MAX} Kg...`);
  console.log('----------------------------------------------------');
  
  setInterval(() => {
    // Usamos las nuevas variables para generar el peso en el rango deseado
    const pesoSimulado = (Math.random() * (SIMULACION_MAX - SIMULACION_MIN) + SIMULACION_MIN).toFixed(3);
    ultimoPesoRecibido = pesoSimulado;
    console.log(`Peso simulado generado: ${ultimoPesoRecibido}`);
  }, 3000);

} else {
  try {
    if (!PUERTO_BALANZA) {
      throw new Error("PUERTO_BALANZA no está definido en el archivo .env");
    }

    const port = new SerialPort({
      path: PUERTO_BALANZA,
      baudRate: BAUDRATE_BALANZA,
      dataBits: DATA_BITS_BALANZA,
      parity: 'none',
      stopBits: 1,
    });

    let tramaDeDatos = '';

    port.on('open', () => {
      console.log(`\n*** Conexión exitosa con ${PUERTO_BALANZA}. Esperando datos... ***\n`);
    });

    port.on('data', function (data) {
      const caracterRecibido = data.toString('ascii');
      if (caracterRecibido.includes('\r')) {
        console.log(`Trama completa recibida: [${tramaDeDatos}]`);
        if (tramaDeDatos.length >= 7) {
          const pesoExtraido = tramaDeDatos.substring(1, 7);
          const pesoNumerico = parseFloat(pesoExtraido.replace(',', '.')).toFixed(3);
          if (!isNaN(pesoNumerico)) {
            ultimoPesoRecibido = pesoNumerico;
            console.log(`>>> PESO PROCESADO: ${ultimoPesoRecibido} Kg <<<`);
          }
        }
        tramaDeDatos = ''; 
      } else {
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

// Endpoint para que la aplicación de React pida el peso
app.get('/peso', (req, res) => {
  res.json({ success: true, peso: ultimoPesoRecibido });
});

// Iniciar el servidor del agente
app.listen(AGENTE_PORT, () => {
  console.log(`*** Agente de Balanza corriendo en http://localhost:${AGENTE_PORT} ***`);
  if (MODO_SIMULACION_ACTIVO) {
    console.log(`Modo simulación activado. Rango de peso: ${SIMULACION_MIN}-${SIMULACION_MAX} Kg.`);
  } else {
    console.log(`Intentando conectar con el puerto ${PUERTO_BALANZA} a ${BAUDRATE_BALANZA} baudios...`);
  }
});