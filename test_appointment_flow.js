/**
 * Script de Testing para Flujo Completo de Agendamiento
 * Simula el proceso completo para identificar dónde falla
 */

const axios = require('axios');

console.log('🧪 Testing de Flujo Completo de Agendamiento - Bot LucIA');
console.log('='.repeat(70));

// Simular datos de cita
const appointmentData = {
  nombre: 'Nelson Gus',
  tipo_documento: 'CE',
  numero_documento: '004300122',
  telefono: '+51981256412',
  correo: 'njgimenez@gmail.com',
  fecha_nacimiento: '1979-07-20',
  especialidad: 'Oncología Médica',
  fecha: '2025-09-19', // Jueves
  hora: '10:30',
  motivo: 'Consulta de seguimiento'
};

// Simular flujo de agendamiento
async function simulateAppointmentFlow() {
  console.log('\n📋 SIMULANDO FLUJO COMPLETO DE AGENDAMIENTO');
  console.log('='.repeat(50));
  
  console.log('\n📊 Datos de la cita:');
  console.log(JSON.stringify(appointmentData, null, 2));
  
  try {
    // Paso 1: Obtener médicos por especialidad
    console.log('\n🔄 Paso 1: Obteniendo médicos para Oncología Médica...');
    const medicosResponse = await axios.get('http://localhost:3000/api/chatbot/medicos?especialidad=Oncología%20Médica');
    
    const medicos = medicosResponse.data;
    console.log(`✅ Médicos encontrados: ${medicos.medicos.length}`);
    
    if (medicos.medicos.length === 0) {
      console.log('❌ PROBLEMA: No hay médicos disponibles para Oncología Médica');
      return;
    }
    
    const medico = medicos.medicos[0];
    console.log(`👨‍⚕️ Médico seleccionado: ${medico.nombre} (ID: ${medico.id})`);
    
    // Paso 2: Verificar disponibilidad
    console.log('\n🔄 Paso 2: Verificando disponibilidad...');
    const disponibilidadResponse = await axios.post('http://localhost:3000/api/chatbot/verificar-disponibilidad', {
      fecha: appointmentData.fecha,
      hora: appointmentData.hora,
      medico_id: medico.id
    });
    
    const disponibilidad = disponibilidadResponse.data;
    console.log(`✅ Disponibilidad: ${disponibilidad.disponible ? 'Disponible' : 'No disponible'}`);
    
    if (!disponibilidad.disponible) {
      console.log('❌ PROBLEMA: Horario no disponible');
      console.log(`   Razón: ${disponibilidad.mensaje}`);
      return;
    }
    
    // Paso 3: Crear paciente
    console.log('\n🔄 Paso 3: Creando paciente...');
    const pacienteResponse = await axios.post('http://localhost:3000/api/chatbot/crear-paciente', {
      nombre: appointmentData.nombre,
      tipo_documento: appointmentData.tipo_documento,
      numero_documento: appointmentData.numero_documento,
      telefono: appointmentData.telefono,
      correo: appointmentData.correo,
      fecha_nacimiento: appointmentData.fecha_nacimiento
    });
    
    const paciente = pacienteResponse.data;
    console.log(`✅ Paciente creado: ${paciente.paciente.nombre} (ID: ${paciente.paciente.id})`);
    
    // Paso 4: Agendar cita
    console.log('\n🔄 Paso 4: Agendando cita...');
    const citaResponse = await axios.post('http://localhost:3000/api/chatbot/agendar-cita', {
      paciente_id: paciente.paciente.id,
      medico_id: medico.id,
      fecha: appointmentData.fecha,
      hora: appointmentData.hora,
      motivo: appointmentData.motivo,
      duracion: 30
    });
    
    const cita = citaResponse.data;
    console.log(`✅ Cita agendada exitosamente!`);
    console.log(`   ID de cita: ${cita.cita.id}`);
    console.log(`   Médico: ${medico.nombre}`);
    console.log(`   Fecha: ${appointmentData.fecha}`);
    console.log(`   Hora: ${appointmentData.hora}`);
    
    console.log('\n🎉 FLUJO COMPLETO EXITOSO!');
    
  } catch (error) {
    console.log(`\n❌ ERROR EN EL FLUJO: ${error.message}`);
    console.log('Stack trace:', error.stack);
  }
}

// Función para probar conexión con el backend
async function testBackendConnection() {
  console.log('\n🔗 TESTING CONEXIÓN CON BACKEND');
  console.log('='.repeat(50));
  
  try {
    const response = await axios.get('http://localhost:3000/api/chatbot/medicos');
    
    console.log('✅ Backend conectado correctamente');
    console.log(`   Médicos disponibles: ${response.data.medicos.length}`);
    return true;
  } catch (error) {
    console.log(`❌ No se puede conectar al backend: ${error.message}`);
    console.log('   Verifica que el servidor esté corriendo en http://localhost:3000');
    return false;
  }
}

// Ejecutar pruebas
async function runTests() {
  console.log('🚀 Iniciando pruebas de agendamiento...');
  
  const backendConnected = await testBackendConnection();
  
  if (backendConnected) {
    await simulateAppointmentFlow();
  } else {
    console.log('\n⚠️  No se pueden ejecutar las pruebas sin conexión al backend');
  }
  
  console.log('\n🏁 Testing completado');
  console.log('='.repeat(70));
}

// Ejecutar si se llama directamente
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { simulateAppointmentFlow, testBackendConnection };