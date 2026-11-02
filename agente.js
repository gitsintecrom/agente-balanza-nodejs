// // agente.js (versión final con rango de simulación configurable)

// const express = require('express');
// const { SerialPort } = require('serialport');
// const cors = require('cors');
// require('dotenv').config();

// const app = express();

// // --- LECTURA DE VARIABLES DE ENTORNO ---
// const AGENTE_PORT = process.env.AGENTE_PORT || 12345;
// const PUERTO_BALANZA = process.env.PUERTO_BALANZA || 'COM3';
// const BAUDRATE_BALANZA = parseInt(process.env.BAUDRATE_BALANZA) || 9600;
// const DATA_BITS_BALANZA = parseInt(process.env.DATA_BITS) || 8;
// const MODO_SIMULACION_ACTIVO = process.env.SIMULACION_BALANZA === 'true';

// // Nuevas variables para el rango de simulación, con valores por defecto
// const SIMULACION_MIN = parseFloat(process.env.SIMULACION_MIN) || 0;
// const SIMULACION_MAX = parseFloat(process.env.SIMULACION_MAX) || 20;

// const allowedOrigins = [
//   'http://localhost:5173',
//   'http://192.168.10.69',
// ];
// const corsOptions = {
//   origin: function (origin, callback) {
//     if (!origin || allowedOrigins.indexOf(origin) !== -1) {
//       callback(null, true);
//     } else {
//       callback(new Error('La política de CORS no permite el acceso desde este origen.'));
//     }
//   }
// };
// app.use(cors(corsOptions));

// let ultimoPesoRecibido = "0.000";

// // --- LÓGICA DE CONEXIÓN O SIMULACIÓN ---
// if (MODO_SIMULACION_ACTIVO) {
//   console.log('----------------------------------------------------');
//   console.log('*** MODO SIMULACIÓN FORZADO DESDE .env ***');
//   console.log(`Generando pesos aleatorios entre ${SIMULACION_MIN} y ${SIMULACION_MAX} Kg...`);
//   console.log('----------------------------------------------------');
  
//   setInterval(() => {
//     // Usamos las nuevas variables para generar el peso en el rango deseado
//     //const pesoSimulado = (Math.random() * (SIMULACION_MAX - SIMULACION_MIN) + SIMULACION_MIN).toFixed(3);
//     const pesoSimulado = 100;
//     // const pesoSimulado = 3750;
//     //const pesoSimulado = 100
//     // const pesoSimulado = 1000;
//     ultimoPesoRecibido = pesoSimulado;
//     console.log(`Peso simulado generado: ${ultimoPesoRecibido}`);
//   }, 3000);

// } else {
//   try {
//     if (!PUERTO_BALANZA) {
//       throw new Error("PUERTO_BALANZA no está definido en el archivo .env");
//     }

//     const port = new SerialPort({
//       path: PUERTO_BALANZA,
//       baudRate: BAUDRATE_BALANZA,
//       dataBits: DATA_BITS_BALANZA,
//       parity: 'none',
//       stopBits: 1,
//     });

//     let tramaDeDatos = '';

//     port.on('open', () => {
//       console.log(`\n*** Conexión exitosa con ${PUERTO_BALANZA}. Esperando datos... ***\n`);
//     });

//     port.on('data', function (data) {
//       const caracterRecibido = data.toString('ascii');
//       if (caracterRecibido.includes('\r')) {
//         console.log(`Trama completa recibida: [${tramaDeDatos}]`);
//         if (tramaDeDatos.length >= 7) {
//           const pesoExtraido = tramaDeDatos.substring(1, 7);
//           const pesoNumerico = parseFloat(pesoExtraido.replace(',', '.')).toFixed(3);
//           if (!isNaN(pesoNumerico)) {
//             ultimoPesoRecibido = pesoNumerico;
//             console.log(`>>> PESO PROCESADO: ${ultimoPesoRecibido} Kg <<<`);
//           }
//         }
//         tramaDeDatos = ''; 
//       } else {
//         tramaDeDatos += caracterRecibido;
//       }
//     });

//     port.on('error', (err) => {
//       console.error(`Error en el puerto serie: ${err.message}.`);
//       ultimoPesoRecibido = "Error";
//     });

//   } catch (err) {
//     console.error(`Error crítico al abrir el puerto.`, err);
//     ultimoPesoRecibido = "Error Puerto";
//   }
// }

// // Endpoint para que la aplicación de React pida el peso
// app.get('/peso', (req, res) => {
//   res.json({ success: true, peso: ultimoPesoRecibido });
// });

// // Iniciar el servidor del agente
// const server = app.listen(AGENTE_PORT, () => {
//   console.log(`*** Agente de Balanza corriendo en http://localhost:${AGENTE_PORT} ***`);
//   if (MODO_SIMULACION_ACTIVO) {
//     console.log(`Modo simulación activado. Rango de peso: ${SIMULACION_MIN}-${SIMULACION_MAX} Kg.`);
//   } else {
//     console.log(`Intentando conectar con el puerto ${PUERTO_BALANZA} a ${BAUDRATE_BALANZA} baudios...`);
//   }
// });

// // Manejo de señales para cierre limpio
// process.on('SIGINT', () => {
//   console.log('\n🔻 Recibida señal SIGINT - Cerrando servidor...');
//   server.close(() => {
//     console.log('✅ Servidor cerrado correctamente');
//     if (!MODO_SIMULACION_ACTIVO) {
//       // Cierra el puerto serie si existe
//       if (port) {
//         port.close(() => {
//           console.log('✅ Puerto serie cerrado');
//           process.exit(0);
//         });
//       } else {
//         process.exit(0);
//       }
//     } else {
//       process.exit(0);
//     }
//   });

//   // Forzar cierre después de 5 segundos si no responde
//   setTimeout(() => {
//     console.log('⚠️  Forzando cierre del proceso...');
//     process.exit(1);
//   }, 5000);
// });

// process.on('SIGTERM', () => {
//   console.log('\n🔻 Recibida señal SIGTERM - Cerrando servidor...');
//   server.close(() => {
//     console.log('✅ Servidor cerrado correctamente');
//     process.exit(0);
//   });
// });




























const express = require('express');
const { SerialPort } = require('serialport');
const cors = require('cors');
require('dotenv').config();

const app = express();

// --- LECTURA DE VARIABLES DE ENTORNO ---
const AGENTE_PORT = process.env.AGENTE_PORT || 12345;
const BAUDRATE_BALANZA = parseInt(process.env.BAUDRATE_BALANZA) || 9600;
const DATA_BITS_BALANZA = parseInt(process.env.DATA_BITS) || 8;
const MODO_SIMULACION_ACTIVO = process.env.SIMULACION_BALANZA === 'true';

// ✅✅ NUEVO: qué balanza(s) simular → '1', '2' o 'AMBAS' (default)
const SIMULAR_BALANZA = String(process.env.SIMULAR_BALANZA || 'AMBAS').trim().toUpperCase();
const IDS_A_SIMULAR = (SIMULAR_BALANZA === '1' || SIMULAR_BALANZA === '2') ? [SIMULAR_BALANZA] : ['1', '2'];

// Configuración de las balanzas
const balanzasConfig = [
  {
    id: '1',
    nombre: 'Balanza 1 (5 Ton)',
    puerto: process.env.PUERTO_BALANZA_1 || 'COM3',
    simMin: parseFloat(process.env.SIMULACION_MIN_1) || 0,
    simMax: parseFloat(process.env.SIMULACION_MAX_1) || 100
  },
  {
    id: '2',
    nombre: 'Balanza 2 (15 Ton)',
    puerto: process.env.PUERTO_BALANZA_2 || 'COM2',
    simMin: parseFloat(process.env.SIMULACION_MIN_2) || 0,
    simMax: parseFloat(process.env.SIMULACION_MAX_2) || 15000
  }
];

// ✅ En simulación: solo las elegidas. En modo real: ambas conectan al puerto serie.
const balanzasActivas = MODO_SIMULACION_ACTIVO
  ? balanzasConfig.filter(b => IDS_A_SIMULAR.includes(b.id))
  : balanzasConfig;

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

// Estado de TODAS las balanzas (activas e inactivas)
const estadoBalanzas = {};
balanzasConfig.forEach(config => {
  estadoBalanzas[config.id] = {
    nombre: config.nombre,
    ultimoPeso: '0.000',
    port: null,
    tramaDeDatos: '',
    activa: false
  };
});

// --- LÓGICA DE CONEXIÓN O SIMULACIÓN (solo balanzas activas) ---
balanzasActivas.forEach(config => {
  estadoBalanzas[config.id].activa = true;

  if (MODO_SIMULACION_ACTIVO) {
    console.log(`*** MODO SIMULACIÓN PARA ${config.nombre} (${config.puerto}) ***`);
    console.log(`Generando pesos aleatorios entre ${config.simMin} y ${config.simMax} Kg...`);

    setInterval(() => {
      // Descomenta la línea de abajo si querés un valor fijo en vez de aleatorio
      // const pesoSimulado = 100;
      const pesoSimulado = (Math.random() * (config.simMax - config.simMin) + config.simMin).toFixed(3);
      estadoBalanzas[config.id].ultimoPeso = pesoSimulado;
      console.log(`[${config.nombre}] Peso simulado: ${pesoSimulado}`);
    }, 3000);

  } else {
    try {
      const port = new SerialPort({
        path: config.puerto,
        baudRate: BAUDRATE_BALANZA,
        dataBits: DATA_BITS_BALANZA,
        parity: 'none',
        stopBits: 1,
      });

      estadoBalanzas[config.id].port = port;

      port.on('open', () => {
        console.log(`\n*** Conexión exitosa con ${config.puerto} (${config.nombre}). Esperando datos... ***\n`);
      });

      port.on('data', function (data) {
        const caracterRecibido = data.toString('ascii');
        estadoBalanzas[config.id].tramaDeDatos += caracterRecibido;

        if (estadoBalanzas[config.id].tramaDeDatos.includes('\r')) {
          const trama = estadoBalanzas[config.id].tramaDeDatos;
          console.log(`[${config.nombre}] Trama completa recibida: [${trama}]`);
          if (trama.length >= 7) {
            const pesoExtraido = trama.substring(1, 7);
            const pesoNumerico = parseFloat(pesoExtraido.replace(',', '.')).toFixed(3);
            if (!isNaN(pesoNumerico)) {
              estadoBalanzas[config.id].ultimoPeso = pesoNumerico;
              console.log(`[${config.nombre}] >>> PESO PROCESADO: ${pesoNumerico} Kg <<<`);
            }
          }
          estadoBalanzas[config.id].tramaDeDatos = '';
        }
      });

      port.on('error', (err) => {
        console.error(`[${config.nombre}] Error en el puerto serie ${config.puerto}: ${err.message}.`);
        estadoBalanzas[config.id].ultimoPeso = 'Error';
      });

    } catch (err) {
      console.error(`[${config.nombre}] Error crítico al abrir el puerto ${config.puerto}.`, err);
      estadoBalanzas[config.id].ultimoPeso = 'Error Puerto';
    }
  }
});

// Balanzas inactivas en simulación: aviso en consola
balanzasConfig.forEach(config => {
  if (!estadoBalanzas[config.id].activa) {
    console.log(`⏸️  ${config.nombre} (id=${config.id}) NO se simula (SIMULAR_BALANZA=${SIMULAR_BALANZA}).`);
  }
});

// --- ENDPOINTS ---

// ✅ Helper de respuesta
function responderPeso(id, res) {
  const estado = estadoBalanzas[id];
  if (!estado) {
    return res.status(404).json({ success: false, error: 'Balanza no encontrada' });
  }
  res.json({
    success: true,
    balanza: id,
    nombre: estado.nombre,
    activa: estado.activa,
    peso: estado.ultimoPeso
  });
}

// /peso  → sin parámetros devuelve la PRIMERA BALANZA ACTIVA
//          (así el front que ya llama a /peso sigue funcionando aunque simules solo la 2)
// /peso?balanza=2 → balanza específica
app.get('/peso', (req, res) => {
  const idPedido = req.query.balanza;
  if (idPedido) return responderPeso(String(idPedido), res);
  const primeraActiva = balanzasActivas[0];
  return responderPeso(primeraActiva ? primeraActiva.id : '1', res);
});

// /peso/1  o  /peso/2
app.get('/peso/:id', (req, res) => {
  responderPeso(req.params.id, res);
});

// /balanzas → estado de todas (útil para ver cuál está activa/simulada)
app.get('/balanzas', (req, res) => {
  res.json({
    success: true,
    simulacion: MODO_SIMULACION_ACTIVO,
    simularBalanza: MODO_SIMULACION_ACTIVO ? SIMULAR_BALANZA : 'N/A (modo real)',
    balanzas: Object.keys(estadoBalanzas).map(id => ({
      id,
      nombre: estadoBalanzas[id].nombre,
      activa: estadoBalanzas[id].activa,
      peso: estadoBalanzas[id].ultimoPeso
    }))
  });
});

// Iniciar el servidor
const server = app.listen(AGENTE_PORT, () => {
  console.log(`\n*** Agente de Balanza corriendo en http://localhost:${AGENTE_PORT} ***`);
  if (MODO_SIMULACION_ACTIVO) {
    console.log(`Modo simulación activado. SIMULAR_BALANZA=${SIMULAR_BALANZA}`);
    console.log(`Balanzas simuladas: ${balanzasActivas.map(b => b.nombre).join(', ') || 'NINGUNA'}`);
  } else {
    console.log(`Modo REAL: conectando puertos ${balanzasConfig.map(b => b.puerto).join(', ')} a ${BAUDRATE_BALANZA} baudios...`);
  }
});

// Manejo de señales para cierre limpio
process.on('SIGINT', () => {
  console.log('\n🔻 Recibida señal SIGINT - Cerrando servidor...');
  server.close(() => {
    console.log('✅ Servidor HTTP cerrado correctamente');
    const puertosAbiertos = Object.values(estadoBalanzas).filter(b => b.port && b.port.isOpen);
    if (puertosAbiertos.length > 0) {
      let cerrados = 0;
      puertosAbiertos.forEach(b => {
        b.port.close(() => {
          console.log(`✅ Puerto serie de ${b.nombre} cerrado`);
          cerrados++;
          if (cerrados === puertosAbiertos.length) process.exit(0);
        });
      });
    } else {
      process.exit(0);
    }
  });

  setTimeout(() => {
    console.log('⚠️  Forzando cierre del proceso...');
    process.exit(1);
  }, 5000);
});

process.on('SIGTERM', () => {
  console.log('\n🔻 Recibida señal SIGTERM - Cerrando servidor...');
  server.close(() => process.exit(0));
});