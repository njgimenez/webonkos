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

console.log(`${colors.cyan}${colors.bright}📅 Testing Validación de Fechas${colors.reset}`);
console.log('======================================================================');

async function testDateValidation() {
  const testMessages = [
    "para mañana",
    "mañana", 
    "para el viernes",
    "el jueves",
    "jueves",
    "próximo martes"
  ];
  
  for (const testMessage of testMessages) {
    console.log(`\n${colors.yellow}📝 Probando: "${testMessage}"${colors.reset}`);
    
    try {
      // Paso 1: Probar el endpoint NLU
      const nluResponse = await axios.post('http://localhost:3001/api/chatbot/nlu', {
        mensaje: testMessage
      });
      
      const nluResult = nluResponse.data;
      console.log(`${colors.blue}📊 Resultado NLU:${colors.reset}`);
      console.log(`   Fecha detectada: ${nluResult.extractedData?.fecha || 'null'}`);
      
      // Paso 2: Probar validación de fecha con IA
      const aiResponse = await axios.post('http://localhost:3001/api/chat', {
        message: `Interpreta esta fecha de cita: "${testMessage}". Responde SOLO con JSON válido en este formato exacto: {"fecha": "2025-08-19", "error": null} o {"fecha": null, "error": "mensaje de error"}. 
        
        Reglas importantes:
        - "mañana" = día siguiente al actual
        - "pasado mañana" = día después de mañana
        - "próximo martes" = martes de la próxima semana
        - "martes que viene" = martes de la próxima semana  
        - "el martes" = martes de esta semana si aún no pasó, sino de la próxima
        - "el lunes", "el miércoles", "el jueves", "el viernes", "el sábado", "el domingo" = día de esta semana si aún no pasó, sino de la próxima
        - "para el viernes" = viernes de esta semana si aún no pasó, sino de la próxima
        - "para el lunes", "para el martes", "para el miércoles", "para el jueves", "para el viernes", "para el sábado", "para el domingo" = día de esta semana si aún no pasó, sino de la próxima
        - "jueves" = jueves de esta semana si aún no pasó, sino de la próxima semana
        - "lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo" = día de esta semana si aún no pasó, sino de la próxima
        - "este viernes" = viernes de esta semana si aún no pasó, sino de la próxima
        - "este lunes", "este martes", "este miércoles", "este jueves", "este viernes", "este sábado", "este domingo" = día de esta semana si aún no pasó, sino de la próxima
        - Fecha debe ser futura (no puede ser en el pasado)
        - Formato de respuesta: YYYY-MM-DD
        - Si es "próximo martes" y hoy es martes, debe ser el martes de la próxima semana
        - Si es "mañana" y hoy es domingo, debe ser lunes
        - Si es "para el viernes" y hoy es lunes, debe ser el viernes de esta semana
        - Si es "para el viernes" y hoy es sábado, debe ser el viernes de la próxima semana
        - Si es "jueves" y hoy es lunes, debe ser el jueves de esta semana
        - Si es "jueves" y hoy es viernes, debe ser el jueves de la próxima semana
        
        NO incluyas texto adicional, solo el JSON.`,
        conversationHistory: []
      });
      
      const aiResult = aiResponse.data.response;
      console.log(`${colors.blue}🤖 Respuesta IA:${colors.reset}`);
      console.log(`   ${aiResult}`);
      
      // Intentar parsear el JSON
      try {
        const jsonMatch = aiResult.match(/\{[^{}]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          console.log(`${colors.green}✅ JSON parseado:${colors.reset}`);
          console.log(`   ${JSON.stringify(parsed, null, 2)}`);
          
          if (parsed.error) {
            console.log(`${colors.red}❌ Error detectado: ${parsed.error}${colors.reset}`);
          } else if (parsed.fecha) {
            // Validar que la fecha sea futura
            const fechaCita = new Date(parsed.fecha);
            const hoy = new Date();
            hoy.setHours(0, 0, 0, 0);
            
            if (fechaCita < hoy) {
              console.log(`${colors.red}❌ Fecha en el pasado: ${parsed.fecha}${colors.reset}`);
            } else {
              console.log(`${colors.green}✅ Fecha válida: ${parsed.fecha}${colors.reset}`);
            }
          }
        } else {
          console.log(`${colors.red}❌ No se encontró JSON válido en la respuesta${colors.reset}`);
        }
      } catch (parseError) {
        console.log(`${colors.red}❌ Error parseando JSON: ${parseError.message}${colors.reset}`);
      }
      
    } catch (error) {
      console.log(`${colors.red}❌ Error en test: ${error.message}${colors.reset}`);
    }
  }
}

// Ejecutar test
testDateValidation().catch(console.error);