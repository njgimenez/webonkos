#!/usr/bin/env node

const axios = require('axios');

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

console.log(`${colors.cyan}${colors.bright}🧪 Testing Sistema NLU Híbrido - Bot LucIA${colors.reset}`);
console.log('======================================================================');

async function testNLUSystem() {
  const testCases = [
    {
      name: 'Caso 1: Solicitud completa con cirugía oncológica',
      message: 'Quiero una cita con cirugia oncologica para mañana',
      expected: {
        intencion: 'agendar',
        especialidad: 'Cirugía Oncológica'
      }
    },
    {
      name: 'Caso 2: Datos personales completos',
      message: 'Jose perez DNI 45612378 984526789 jose@jose.com para mañana',
      expected: {
        intencion: 'agendar',
        nombre: 'Jose perez',
        telefono: '+51984526789',
        correo: 'jose@jose.com',
        documento: { tipo: 'DNI', numero: '45612378' }
      }
    },
    {
      name: 'Caso 3: Pregunta sobre servicios',
      message: '¿Tienen laboratorio?',
      expected: {
        intencion: 'consultar'
      }
    },
    {
      name: 'Caso 4: Saludo',
      message: 'Hola, buenos días',
      expected: {
        intencion: 'saludar'
      }
    },
    {
      name: 'Caso 5: Fecha miércoles',
      message: 'para el miércoles',
      expected: {
        intencion: 'agendar'
      }
    }
  ];

  let passed = 0;
  let total = testCases.length;

  for (const testCase of testCases) {
    console.log(`\n${colors.yellow}📋 ${testCase.name}${colors.reset}`);
    console.log(`Mensaje: "${testCase.message}"`);
    
    try {
      const response = await axios.post('http://localhost:3001/api/chatbot/extraer-datos', {
        mensaje: testCase.message,
        contexto: 'agendamiento_cita'
      });
      
      const datos = response.data.datos;
      console.log(`${colors.blue}📊 Datos extraídos:${colors.reset}`, JSON.stringify(datos, null, 2));
      
      // Verificar resultados esperados
      let testPassed = true;
      for (const [key, expectedValue] of Object.entries(testCase.expected)) {
        if (key === 'documento' && expectedValue) {
          if (!datos.documento || 
              datos.documento.tipo !== expectedValue.tipo || 
              datos.documento.numero !== expectedValue.numero) {
            testPassed = false;
            console.log(`${colors.red}❌ Error en documento: esperado ${JSON.stringify(expectedValue)}, obtenido ${JSON.stringify(datos.documento)}${colors.reset}`);
          }
        } else if (datos[key] !== expectedValue) {
          testPassed = false;
          console.log(`${colors.red}❌ Error en ${key}: esperado "${expectedValue}", obtenido "${datos[key]}"${colors.reset}`);
        }
      }
      
      if (testPassed) {
        console.log(`${colors.green}✅ Test pasado${colors.reset}`);
        passed++;
      } else {
        console.log(`${colors.red}❌ Test falló${colors.reset}`);
      }
      
    } catch (error) {
      console.log(`${colors.red}❌ Error en test: ${error.message}${colors.reset}`);
    }
  }
  
  console.log(`\n${colors.cyan}======================================================================${colors.reset}`);
  console.log(`${colors.bright}📊 Resultados: ${passed}/${total} tests pasaron${colors.reset}`);
  
  if (passed === total) {
    console.log(`${colors.green}🎉 ¡Todos los tests pasaron! El sistema NLU está funcionando correctamente.${colors.reset}`);
  } else {
    console.log(`${colors.red}⚠️  Algunos tests fallaron. Revisar la implementación.${colors.reset}`);
  }
}

// Ejecutar tests
testNLUSystem().catch(console.error);