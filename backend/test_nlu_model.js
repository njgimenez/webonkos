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

console.log(`${colors.cyan}${colors.bright}🧠 Testing Modelo NLU Especializado - Bot LucIA${colors.reset}`);
console.log('======================================================================');

async function testNLUModel() {
  const testCases = [
    {
      name: 'Caso 1: Agendar cita con especialidad',
      message: 'Quiero una cita con cirugía oncológica',
      expected: {
        intent: 'agendar_cita',
        extractedData: {
          especialidad: 'cirugía oncológica'
        }
      }
    },
    {
      name: 'Caso 2: Consultar servicios',
      message: '¿Tienen laboratorio?',
      expected: {
        intent: 'consultar_servicios'
      }
    },
    {
      name: 'Caso 3: Saludo',
      message: 'Hola, buenos días',
      expected: {
        intent: 'saludar'
      }
    },
    {
      name: 'Caso 4: Datos personales completos',
      message: 'Jose perez DNI 45612378 984526789 jose@jose.com',
      expected: {
        intent: 'proporcionar_datos',
        extractedData: {
          nombre: 'Jose perez',
          telefono: '+51984526789',
          correo: 'jose@jose.com',
          documento: { tipo: 'DNI', numero: '45612378' }
        }
      }
    },
    {
      name: 'Caso 5: Fecha específica',
      message: 'para mañana',
      expected: {
        intent: 'agendar_cita',
        extractedData: {
          fecha: 'mañana'
        }
      }
    },
    {
      name: 'Caso 6: Confirmación',
      message: 'sí, está correcto',
      expected: {
        intent: 'confirmar'
      }
    },
    {
      name: 'Caso 7: Corrección',
      message: 'quiero cambiar el nombre',
      expected: {
        intent: 'corregir'
      }
    },
    {
      name: 'Caso 8: Despedida',
      message: 'gracias, hasta luego',
      expected: {
        intent: 'despedirse'
      }
    }
  ];

  let passed = 0;
  let total = testCases.length;

  for (const testCase of testCases) {
    console.log(`\n${colors.yellow}📋 ${testCase.name}${colors.reset}`);
    console.log(`Mensaje: "${testCase.message}"`);
    
    try {
      const response = await axios.post('http://localhost:3001/api/chatbot/nlu', {
        mensaje: testCase.message
      });
      
      const result = response.data;
      console.log(`${colors.blue}📊 Resultado NLU:${colors.reset}`);
      console.log(`   Intención: ${result.intent} (confianza: ${result.confidence.toFixed(2)})`);
      console.log(`   Entidades: ${result.entities?.length || 0}`);
      console.log(`   Datos extraídos:`, JSON.stringify(result.extractedData, null, 4));
      
      // Verificar intención
      let testPassed = true;
      if (result.intent !== testCase.expected.intent) {
        testPassed = false;
        console.log(`${colors.red}❌ Error en intención: esperado "${testCase.expected.intent}", obtenido "${result.intent}"${colors.reset}`);
      }
      
      // Verificar datos extraídos si se especifican
      if (testCase.expected.extractedData) {
        for (const [key, expectedValue] of Object.entries(testCase.expected.extractedData)) {
          const actualValue = result.extractedData?.[key];
          
          if (key === 'documento' && expectedValue) {
            if (!actualValue || 
                actualValue.tipo !== expectedValue.tipo || 
                actualValue.numero !== expectedValue.numero) {
              testPassed = false;
              console.log(`${colors.red}❌ Error en documento: esperado ${JSON.stringify(expectedValue)}, obtenido ${JSON.stringify(actualValue)}${colors.reset}`);
            }
          } else if (actualValue !== expectedValue) {
            testPassed = false;
            console.log(`${colors.red}❌ Error en ${key}: esperado "${expectedValue}", obtenido "${actualValue}"${colors.reset}`);
          }
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
    console.log(`${colors.green}🎉 ¡Todos los tests pasaron! El modelo NLU está funcionando perfectamente.${colors.reset}`);
  } else {
    console.log(`${colors.yellow}⚠️  ${total - passed} tests fallaron. El modelo puede necesitar más entrenamiento.${colors.reset}`);
  }
}

// Ejecutar tests
testNLUModel().catch(console.error);