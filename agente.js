// // agente.js (versión final con simulación configurable)

// const express = require('express');
// const { SerialPort } = require('serialport');
// const { ReadlineParser } = require('@serialport/parser-readline');
// const cors = require('cors');
// require('dotenv').config();

// const app = express();

// // --- LECTURA DE VARIABLES DE ENTORNO ---
// const AGENTE_PORT = process.env.AGENTE_PORT || 12345;
// const PUERTO_BALANZA = process.env.PUERTO_BALANZA || 'COM3';
// const BAUDRATE_BALANZA = parseInt(process.env.BAUDRATE_BALANZA) || 9600;
// const ORIGIN_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// // Leemos la variable de simulación. La comparamos con 'true' para obtener un booleano.
// const MODO_SIMULACION_ACTIVO = process.env.SIMULACION_BALANZA === 'true';

// app.use(cors({ origin: ORIGIN_URL }));

// let ultimoPesoRecibido = "0.000";

// // --- LÓGICA DE CONEXIÓN O SIMULACIÓN ---

// if (MODO_SIMULACION_ACTIVO) {
//   // Si la simulación está activada en .env, entramos directamente aquí.
//   console.log('----------------------------------------------------');
//   console.log('*** MODO SIMULACIÓN FORZADO DESDE .env ***');
//   console.log('Generando pesos aleatorios cada 3 segundos...');
//   console.log('----------------------------------------------------');
  
//   setInterval(() => {
//     const pesoSimulado = (Math.random() * 20).toFixed(3);
//     ultimoPesoRecibido = pesoSimulado;
//     console.log(`Peso simulado generado: ${ultimoPesoRecibido}`);
//   }, 3000);

// } else {
//   // Si la simulación está en false, intentamos conectar con la balanza real.
//   try {
//     if (!PUERTO_BALANZA) {
//       throw new Error("PUERTO_BALANZA no está definido en el archivo .env");
//     }

//     const port = new SerialPort({
//       path: PUERTO_BALANZA,
//       baudRate: BAUDRATE_BALANZA,
//     });

//     const parser = port.pipe(new ReadlineParser({ delimiter: '\r\n' }));

//     parser.on('data', (line) => {
//       const pesoNumerico = line.replace(/[^0-9.]/g, '').trim();
//       if (!isNaN(parseFloat(pesoNumerico))) {
//         ultimoPesoRecibido = parseFloat(pesoNumerico).toFixed(3);
//         console.log(`Peso real recibido: ${ultimoPesoRecibido}`);
//       }
//     });

//     port.on('error', (err) => {
//       console.error(`Error en el puerto serie: ${err.message}. El agente no podrá leer datos reales.`);
//       // En modo no-simulación, un error significa que no hay datos.
//       ultimoPesoRecibido = "Error";
//     });
    
//     port.on('open', () => {
//       console.log(`Conexión exitosa con el puerto ${PUERTO_BALANZA}. Escuchando datos de la balanza.`);
//     });

//   } catch (err) {
//       console.error(`Error crítico al intentar abrir el puerto ${PUERTO_BALANZA}. Verifique la configuración.`, err);
//       ultimoPesoRecibido = "Error Puerto";
//   }
// }


// // Endpoint para que la aplicación de React pida el peso
// app.get('/peso', (req, res) => {
//   console.log(`Petición de peso recibida. Enviando: ${ultimoPesoRecibido}`);
//   res.json({
//     success: true,
//     peso: ultimoPesoRecibido
//   });
// });

// // Iniciar el servidor del agente
// app.listen(AGENTE_PORT, () => {
//   console.log(`*** Agente de Balanza corriendo en http://localhost:${AGENTE_PORT} ***`);
//   if (!MODO_SIMULACION_ACTIVO) {
//     console.log(`Intentando conectar con el puerto ${PUERTO_BALANZA} a ${BAUDRATE_BALANZA} baudios...`);
//   }
// });







// // agente.js (versión final con configuración completa del puerto)

// const express = require('express');
// const { SerialPort } = require('serialport');
// const { ReadlineParser } = require('@serialport/parser-readline');
// const cors = require('cors');
// require('dotenv').config();

// const app = express();

// // --- LECTURA DE VARIABLES DE ENTORNO ---
// const AGENTE_PORT = process.env.AGENTE_PORT || 12345;
// const PUERTO_BALANZA = process.env.PUERTO_BALANZA || 'COM3';
// const BAUDRATE_BALANZA = parseInt(process.env.BAUDRATE_BALANZA) || 9600;
// const DATA_BITS_BALANZA = parseInt(process.env.DATA_BITS) || 8; // Leer los Data Bits
// const ORIGIN_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
// const MODO_SIMULACION_ACTIVO = process.env.SIMULACION_BALANZA === 'true';

// app.use(cors({ origin: ORIGIN_URL }));

// let ultimoPesoRecibido = "0.000";

// if (MODO_SIMULACION_ACTIVO) {
//   // ... (La lógica de simulación no cambia)
// } else {
//   try {
//     if (!PUERTO_BALANZA) {
//       throw new Error("PUERTO_BALANZA no está definido en el archivo .env");
//     }

//     console.log(`Configurando puerto: ${PUERTO_BALANZA}, Baudios: ${BAUDRATE_BALANZA}, Data Bits: ${DATA_BITS_BALANZA}`);

//     // --- ¡AQUÍ ESTÁ LA CONFIGURACIÓN COMPLETA! ---
//     const port = new SerialPort({
//       path: PUERTO_BALANZA,
//       baudRate: BAUDRATE_BALANZA,
//       dataBits: DATA_BITS_BALANZA, // Añadido
//       parity: 'none',          // Valor estándar, asumiendo que no hay paridad
//       stopBits: 1,             // Valor estándar
//       autoOpen: true           // Intentar abrir el puerto automáticamente
//     });

//     const parser = port.pipe(new ReadlineParser({ delimiter: '\r\n' }));

//     parser.on('data', (line) => {
//       // La lógica de C# hacía un substring(1, 6) a la lectura cruda.
//       // Esto sugiere que la balanza envía un formato fijo, ej: "S 012.345 K"
//       // Vamos a intentar replicar la limpieza y luego el substring.
//       console.log(`Línea cruda recibida: [${line}]`); // Log para ver qué llega
      
//       // Limpiamos todo lo que no sea número o punto decimal
//       let pesoNumerico = line.replace(/[^0-9.]/g, '').trim();

//       // Si después de limpiar aún tenemos datos
//       if (pesoNumerico && !isNaN(parseFloat(pesoNumerico))) {
//         ultimoPesoRecibido = parseFloat(pesoNumerico).toFixed(3);
//         console.log(`Peso real procesado: ${ultimoPesoRecibido}`);
//       }
//     });

//     port.on('error', (err) => {
//       console.error(`Error en el puerto serie: ${err.message}.`);
//       ultimoPesoRecibido = "Error";
//     });
    
//     port.on('open', () => {
//       console.log(`Conexión exitosa con el puerto ${PUERTO_BALANZA}. Escuchando datos de la balanza.`);
//     });

//   } catch (err) {
//       console.error(`Error crítico al intentar abrir el puerto ${PUERTO_BALANZA}.`, err);
//       ultimoPesoRecibido = "Error Puerto";
//   }
// }

// // ... (El resto del archivo, app.get y app.listen, no cambia)
// app.get('/peso', (req, res) => {
//   res.json({ success: true, peso: ultimoPesoRecibido });
// });
// app.listen(AGENTE_PORT, () => {
//   console.log(`*** Agente de Balanza corriendo en http://localhost:${AGENTE_PORT} ***`);
//   // ...
// });










// // agente.js (MODO DEPURACIÓN PROFUNDA)

// const express = require('express');
// const { SerialPort } = require('serialport');
// const cors = require('cors');
// require('dotenv').config();

// const app = express();
// const AGENTE_PORT = process.env.AGENTE_PORT || 12345;
// const PUERTO_BALANZA = process.env.PUERTO_BALANZA || 'COM3';
// const BAUDRATE_BALANZA = parseInt(process.env.BAUDRATE_BALANZA) || 9600;
// const DATA_BITS_BALANZA = parseInt(process.env.DATA_BITS) || 8;
// const ORIGIN_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
// const MODO_SIMULACION_ACTIVO = process.env.SIMULACION_BALANZA === 'true';

// app.use(cors({ origin: ORIGIN_URL }));

// let ultimoPesoRecibido = "0.000";

// if (MODO_SIMULACION_ACTIVO) {
//   // ... (La lógica de simulación no cambia)
// } else {
//   try {
//     const port = new SerialPort({
//       path: PUERTO_BALANZA,
//       baudRate: BAUDRATE_BALANZA,
//       dataBits: DATA_BITS_BALANZA,
//       parity: 'none',
//       stopBits: 1,
//     });

//     port.on('open', () => {
//       console.log(`\n*** Conexión exitosa con ${PUERTO_BALANZA}. ESPERANDO DATOS CRUDOS... ***`);
//       console.log("Coloca algo en la balanza y espera a que envíe datos.\n");
//     });
    
//     // --- ¡AQUÍ ESTÁ LA CLAVE DE LA DEPURACIÓN! ---
//     // Escuchamos el evento 'data' directamente del puerto, sin ningún parser.
//     // Esto nos dará los datos en formato Buffer (crudo).
//     port.on('data', function (data) {
//       console.log('--- ¡DATO CRUDO RECIBIDO! ---');
//       console.log('Buffer (hex):', data.toString('hex')); // Muestra los bytes en hexadecimal
//       console.log('Buffer (texto):', data.toString('ascii')); // Intenta interpretarlo como texto ASCII
//       console.log('-----------------------------\n');
      
//       // Intentamos procesar el texto recibido
//       const textoRecibido = data.toString('ascii');
//       const pesoNumerico = textoRecibido.replace(/[^0-9.]/g, '').trim();
//       if (pesoNumerico && !isNaN(parseFloat(pesoNumerico))) {
//         ultimoPesoRecibido = parseFloat(pesoNumerico).toFixed(3);
//       }
//     });

//     port.on('error', (err) => {
//       console.error(`Error en el puerto serie: ${err.message}.`);
//       ultimoPesoRecibido = "Error";
//     });

//   } catch (err) {
//     console.error(`Error crítico al intentar abrir el puerto.`, err);
//     ultimoPesoRecibido = "Error Puerto";
//   }
// }

// // ... (El resto del archivo, app.get y app.listen, no cambia)
// app.get('/peso', (req, res) => { res.json({ success: true, peso: ultimoPesoRecibido }); });
// app.listen(AGENTE_PORT, () => { console.log(`*** Agente corriendo en http://localhost:${AGENTE_PORT} ***`); });








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