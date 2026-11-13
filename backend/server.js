const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios');
const path = require('path');
const config = require('./config');
const { query, testConnection } = require('./database');

// Inicializar cliente de Groq (solo si está disponible)
let groq = null;
try {
  const Groq = require('groq-sdk');
  groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
  });
} catch (error) {
  console.log('Groq no disponible, usando respuestas predefinidas');
}

const app = express();
const PORT = config.server.port;

// Función para obtener datos dinámicos de la base de datos
async function getDynamicClinicData() {
  try {
    // Obtener médicos activos
    const medicos = await query(`
      SELECT m.id, m.nombre, m.especialidad_id, e.nombre as especialidad_nombre
      FROM medicos m
      LEFT JOIN especialidades e ON m.especialidad_id = e.id
      WHERE m.estado = 'activo'
      ORDER BY e.nombre, m.nombre
    `);
    
    // Obtener especialidades disponibles
    const especialidades = await query(`
      SELECT DISTINCT e.nombre as especialidad_nombre
      FROM especialidades e
      INNER JOIN medicos m ON e.id = m.especialidad_id
      WHERE m.estado = 'activo'
      ORDER BY m.especialidad_id
    `);
    
    return {
      medicos: medicos.rows,
      especialidades: especialidades.rows
    };
  } catch (error) {
    console.error('Error obteniendo datos dinámicos:', error);
    return {
      medicos: [],
      especialidades: []
    };
  }
}

// Función para generar prompt dinámico
async function generateDynamicPrompt() {
  const clinicData = await getDynamicClinicData();
  
  // Generar lista de médicos
  const medicosList = clinicData.medicos.map(medico => 
    `• ${medico.nombre} (${medico.especialidad_nombre})`
  ).join('\n');
  
  // Generar lista de especialidades
  const especialidadesList = clinicData.especialidades.map(esp => 
    `• ${esp.especialidad_nombre}`
  ).join('\n');
  
  return `Eres LucIA, recepcionista del Onkos Instituto del Cáncer en Perú. Tu trabajo es ayudar a los pacientes con información y agendar citas.

PERSONALIDAD Y TONO:
- Habla como una persona real, natural y amigable
- Sé directa pero cálida, como una recepcionista experimentada
- Usa un tono conversacional, cercano pero profesional
- Evita ser excesivamente formal o robótica
- Sé empática pero sin exagerar

ESTRUCTURA DE MENSAJES:
- Mensajes cortos: Una sola respuesta clara
- Mensajes medianos: Usa puntos o listas para organizar
- Mensajes largos: Divide en 2-3 mensajes separados
- Información densa: Envía en partes para mejor digestión

AGENDAMIENTO DE CITAS MEJORADO:
Cuando alguien quiera agendar una cita, sigue este flujo natural:

1. NOMBRE: "Perfecto, te ayudo a agendar tu cita. ¿Cuál es tu nombre completo?"

2. DOCUMENTO: "¿Cuál es tu tipo de documento y número? (DNI, Carnet de Extranjería, Pasaporte, etc.)"

3. CONTACTO: "¿Cuál es tu número de teléfono y correo electrónico?"

4. FECHA NACIMIENTO: "¿Cuál es tu fecha de nacimiento?"

5. ESPECIALIDAD: "¿Qué especialidad necesitas?

${especialidadesList}"

6. FECHA CITA: "¿Para cuándo te gustaría la cita?"

7. HORA: "¿A qué hora prefieres? (horario de atención: 8:00 AM - 6:00 PM)"

8. MOTIVO: "¿En qué podemos ayudarte hoy? (Cuéntanos brevemente el motivo de tu consulta)"

9. CONFIRMACIÓN: Mostrar resumen estructurado y preguntar confirmación

VALIDACIONES INTELIGENTES:
- Documentos: Acepta DNI, CE, Pasaporte, etc. y valida formato según tipo
- Teléfono: Valida formato peruano (+51 9XXXXXXXX)
- Email: Valida formato de correo electrónico
- Fechas: Interpreta formatos naturales (15/03/1990, 15 de marzo de 1990, etc.)
- Horas: Interpreta expresiones naturales (9 de la mañana, 2 de la tarde, etc.)

ESPECIALIDADES DISPONIBLES:
${especialidadesList}

INFORMACIÓN DE LA CLÍNICA:
- Servicios: Consultas, Quimioterapia, Radioterapia, Cirugía, Psicología, Nutrición
- Especialistas: 
${medicosList}
- Horarios: Lunes a Viernes 9:00 AM - 6:00 PM
- Para citas: Puedes usar nuestro formulario en "Agendar Cita" o llamarnos al (+51) 933 598 495
- Para emergencias: (+51) 933 598 495

Recuerda: Eres una persona real, habla naturalmente y maneja el agendamiento de forma inteligente y amigable.`;
}

// Función para respuestas predefinidas del chatbot
async function getChatbotResponse(message) {
  if (message.includes('hola') || message.includes('buenos días') || message.includes('buenas')) {
    return '¡Hola! Soy LucIA, recepcionista del Onkos Instituto del Cáncer. ¿En qué puedo ayudarte hoy?';
  }
  
  if (message.includes('información') || message.includes('clínica') || message.includes('servicios')) {
    return 'Te cuento sobre nuestra clínica:\n\n🏥 **Onkos Instituto del Cáncer**\n\n**Servicios que ofrecemos:**\n• Consultas médicas\n• Quimioterapia\n• Radioterapia\n• Cirugía oncológica\n• Psicología oncológica\n• Nutrición especializada\n\n**Horarios:** Lunes a Viernes 8:00 AM - 6:00 PM\n\n**Contacto:** +51 1 234 5678\n**Emergencias:** +51 300 123 4567';
  }
  
  if (message.includes('especialidad') || message.includes('especialidades') || message.includes('médico') || 
      message.includes('medicos') || message.includes('doctor') || message.includes('doctores') ||
      message.includes('staff') || message.includes('equipo médico') || message.includes('trabajan') ||
      message.includes('personal médico') || message.includes('especialistas')) {
    
    const clinicData = await getDynamicClinicData();
    
    // Generar lista de médicos con mejor formato
    const medicosList = clinicData.medicos.map(medico => 
      `• ${medico.nombre} (${medico.especialidad_nombre})`
    ).join('\n');
    
    return `Contamos con este staff médico:\n\n${medicosList}`;
  }
  
  if (message.includes('cita') || message.includes('agendar') || message.includes('consulta')) {
    return 'Perfecto, te ayudo a agendar tu cita. ¿Cuál es tu nombre completo?';
  }
  
  if (message.includes('horario') || message.includes('horarios') || message.includes('cuándo')) {
    return 'Nuestros horarios de atención:\n\n📅 **Horarios de la clínica:**\n• Lunes a Viernes: 9:00 AM - 6:00 PM\n• Sábados: 8:00 AM - 12:00 PM\n• Domingos: Cerrado\n\n📞 **Para citas:** (+51) 933 598 495\n🚨 **Emergencias:** (+51) 933 598 495';
  }
  
  if (message.includes('dirección') || message.includes('dónde') || message.includes('ubicación')) {
    return 'Nos encuentras en:\n\n📍 **Dirección:**\nAv Brasil 3621, Magdalena del Mar. Lima - Perú\n\n🚗 **Cómo llegar:**\n• Metro: Estación Central\n• Bus: Líneas 1, 2, 3\n• Taxi: 10 min desde el centro';
  }
  
  if (message.includes('precio') || message.includes('costo') || message.includes('tarifa')) {
    return 'Los precios varían según el tipo de consulta y tratamiento. Te recomiendo que llames al (+51) 933 598 495 para obtener información específica sobre costos y cobertura de seguros.';
  }
  
  if (message.includes('emergencia') || message.includes('urgente')) {
    return '🚨 **Para emergencias médicas:**\n\n📞 Llama inmediatamente al: (+51) 933 598 495\n\n⏰ **Atención 24/7 para emergencias oncológicas**\n\nSi es una emergencia grave, también puedes acudir directamente a nuestra clínica.';
  }
  
  if (message.includes('laboratorio') || message.includes('lab') || message.includes('examen') || 
      message.includes('análisis') || message.includes('analisis') || message.includes('resultado')) {
    return '🔬 **Información sobre Laboratorios:**\n\n**Laboratorios recomendados en Lima:**\n\n• **Laboratorio Clínico Sanitas**\n  📍 Av. Javier Prado Este 4200, San Borja\n  📞 (01) 475-0000\n  🌐 www.sanitas.com.pe\n\n• **Laboratorio Clínico Sabogal**\n  📍 Av. Arequipa 2080, Lince\n  📞 (01) 470-2000\n  🌐 www.sabogal.com.pe\n\n• **Laboratorio Clínico Internacional**\n  📍 Av. El Derby 254, Santiago de Surco\n  📞 (01) 372-1000\n  🌐 www.lci.com.pe\n\n• **Laboratorio Clínico San Pablo**\n  📍 Av. Angamos Este 1800, Miraflores\n  📞 (01) 610-5000\n  🌐 www.sanpablo.com.pe\n\n**Tipos de exámenes disponibles:**\n• Hemograma completo\n• Química sanguínea\n• Marcadores tumorales\n• Perfil lipídico\n• Función renal y hepática\n• Exámenes de coagulación\n\n¿Necesitas información específica sobre algún examen?';
  }
  
  if (message.includes('farmacia') || message.includes('medicamento') || message.includes('medicina') || 
      message.includes('fármaco') || message.includes('farmaco') || message.includes('droga')) {
    return '💊 **Información sobre Farmacias:**\n\n**Farmacias especializadas en oncología en Lima:**\n\n• **Farmacia Oncológica San Borja**\n  📍 Av. Javier Prado Este 4200, San Borja\n  📞 (01) 475-0000\n  🌐 www.farmaciaonco.com.pe\n  ⭐ Especializada en quimioterapia\n\n• **Farmacia del Instituto Nacional de Enfermedades Neoplásicas (INEN)**\n  📍 Av. Angamos Este 2525, Surquillo\n  📞 (01) 201-9700\n  🌐 www.inen.sld.pe\n  ⭐ Medicamentos oncológicos especializados\n\n• **Farmacia Oncológica Miraflores**\n  📍 Av. Larco 1234, Miraflores\n  📞 (01) 444-5000\n  🌐 www.farmaciaonco-miraflores.com.pe\n  ⭐ Medicamentos de alta especialidad\n\n• **Farmacia del Hospital Nacional Dos de Mayo**\n  📍 Jr. Paruro 262, Lima\n  📞 (01) 328-1414\n  🌐 www.hospitaldosdemayo.gob.pe\n  ⭐ Medicamentos a precios sociales\n\n**Servicios especializados:**\n• Medicamentos oncológicos\n• Quimioterapia oral\n• Medicamentos de soporte\n• Asesoría farmacéutica especializada\n• Entrega a domicilio\n\n¿Necesitas información sobre algún medicamento específico?';
  }
  
  if (message.includes('gracias') || message.includes('thank')) {
    return '¡De nada! Estoy aquí para ayudarte. Si tienes más preguntas, no dudes en preguntarme. 😊';
  }
  
  // Respuesta por defecto
      return 'Hola, soy LucIA de Onkos Instituto del Cáncer. Puedo ayudarte con información sobre nuestros servicios, especialidades, horarios, laboratorios, farmacias o agendar citas. ¿Qué necesitas saber?';
}

// Probar conexión a la base de datos al iniciar
testConnection().then(connected => {
  if (!connected) {
    console.log('Continuando sin conexión a base de datos...');
  }
});

// Configuración de CORS
app.use(cors({
  origin: config.cors.origin,
  credentials: config.cors.credentials,
  methods: config.cors.methods,
  allowedHeaders: config.cors.allowedHeaders
}));

// Middleware
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Servir archivos estáticos para uploads con CORS mejorado
app.use('/uploads', (req, res, next) => {
  // Agregar headers CORS específicos para imágenes
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Range');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  res.header('Cross-Origin-Embedder-Policy', 'unsafe-none');
  res.header('Access-Control-Expose-Headers', 'Content-Length, Content-Range');
  
  // Headers adicionales para evitar bloqueos
  res.header('Cache-Control', 'public, max-age=31536000');
  res.header('X-Content-Type-Options', 'nosniff');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
}, express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res, path) => {
    // Configurar headers específicos para diferentes tipos de archivo
    if (path.endsWith('.jpg') || path.endsWith('.jpeg') || path.endsWith('.png') || path.endsWith('.gif')) {
      res.setHeader('Content-Type', 'image/' + path.split('.').pop());
      res.setHeader('Cache-Control', 'public, max-age=31536000');
    }
  }
}));

// Ruta de prueba
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Servidor de Onkos Instituto del Cáncer funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

// Endpoint para el chatbot con Groq
app.post('/api/chat', async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Mensaje requerido' });
    }

    // Generar prompt dinámico con datos de la base de datos
    const systemPrompt = await generateDynamicPrompt();

    // Preparar el historial de conversación
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory,
      { role: 'user', content: message }
    ];

    // Verificar si es una consulta específica que debe usar respuestas predefinidas
    const messageLower = message.toLowerCase();
    const isSpecificQuery = messageLower.includes('medicos') || messageLower.includes('doctores') || 
                           messageLower.includes('especialistas') || messageLower.includes('staff') ||
                           messageLower.includes('trabajan') || messageLower.includes('personal') ||
                           messageLower.includes('equipo') || messageLower.includes('hay');
    
    let botResponse;
    
    // Para consultas específicas sobre médicos, usar respuestas predefinidas
    if (isSpecificQuery) {
      botResponse = await getChatbotResponse(messageLower);
    } else if (groq && process.env.GROQ_API_KEY && process.env.GROQ_API_KEY !== 'tu_api_key_de_groq_aqui') {
      try {
        const completion = await groq.chat.completions.create({
          messages: messages,
          model: 'moonshotai/kimi-k2-instruct',
          temperature: 0.7,
          max_tokens: 1000,
        });
        
        botResponse = completion.choices[0]?.message?.content || 'Lo siento, no pude procesar tu mensaje.';
      } catch (error) {
        console.error('Error con Groq:', error);
        // Fallback a respuestas predefinidas
        botResponse = await getChatbotResponse(messageLower);
      }
    } else {
      // Usar respuestas predefinidas si no hay API key configurada o Groq no está disponible
      botResponse = await getChatbotResponse(messageLower);
    }

    res.json({
      response: botResponse,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error en el chatbot:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      message: 'No se pudo procesar tu mensaje. Por favor, intenta de nuevo.'
    });
  }
});

// Endpoint para programar citas
app.post('/api/appointments', async (req, res) => {
  try {
    const { 
      patientName, 
      patientEmail, 
      patientPhone, 
      preferredDate, 
      preferredTime, 
      specialty,
      reason 
    } = req.body;

    // Validaciones básicas
    if (!patientName || !patientEmail || !patientPhone) {
      return res.status(400).json({ 
        error: 'Información del paciente requerida' 
      });
    }

    // Aquí normalmente se conectaría con una base de datos
    // Por ahora simulamos el proceso
    const appointment = {
      id: Date.now(),
      patientName,
      patientEmail,
      patientPhone,
      preferredDate,
      preferredTime,
      specialty,
      reason,
      status: 'pendiente',
      createdAt: new Date().toISOString()
    };

    // Simular procesamiento
    await new Promise(resolve => setTimeout(resolve, 1000));

    res.json({
      success: true,
      message: 'Cita solicitada exitosamente. Nos pondremos en contacto contigo pronto.',
      appointment
    });

  } catch (error) {
    console.error('Error al programar cita:', error);
    res.status(500).json({ 
      error: 'Error al procesar la solicitud de cita' 
    });
  }
});

// Endpoint para obtener información de la clínica
app.get('/api/clinic-info', (req, res) => {
  res.json({
          name: 'Clínica Onkos Instituto del Cáncer',
    description: 'Centro especializado en oncología con más de 15 años de experiencia',
    services: [
      'Consultas oncológicas',
      'Quimioterapia',
      'Radioterapia',
      'Cirugía oncológica',
      'Medicina nuclear',
      'Psicología oncológica',
      'Nutrición oncológica'
    ],
    specialists: [
      {
        name: 'Dr. Antonio Camargo',
        specialty: 'Oncólogo médico',
        experience: '20 años',
        image: '/images/doctor1.jpg'
      },
      {
        name: 'Dr. Cárdenas',
        specialty: 'Oncólogo',
        experience: '15 años',
        image: '/images/doctor2.jpg'
      },
      {
        name: 'Dr. Cavero',
        specialty: 'Radiología Intervencionista',
        experience: '18 años',
        image: '/images/doctor3.jpg'
      },
      {
        name: 'Lic. Edgardo Palma',
        specialty: 'Nutricionista Oncólogo',
        experience: '12 años',
        image: '/images/doctor4.jpg'
      }
    ],
    contact: {
          phone: '(+51) 933 598 495',
    email: 'contacto@onkos.com',
    address: 'Av Brasil 3621, Magdalena del Mar. Lima - Perú',
      hours: 'Lunes a Viernes 9:00 AM - 6:00 PM'
    }
  });
});

// ====================================
// ENDPOINTS DE ADMINISTRACIÓN
// ====================================

// Middleware para verificar token de admin
const verifyAdminToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Token requerido' });
  }
  
  // Aquí normalmente verificarías el token con JWT
  // Por ahora usamos una verificación simple
  if (token === 'admin-token-123') {
    next();
  } else {
    res.status(401).json({ error: 'Token inválido' });
  }
};

// Login de administrador
app.post('/api/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validaciones
    if (!email || !password) {
      return res.status(400).json({ error: 'Email/usuario y contraseña requeridos' });
    }
    
    // Verificar credenciales en la base de datos
    // Buscar por correo O por nombre de usuario
    const result = await query(
      `SELECT u.id, u.nombre, u.correo, u.contraseña, array_agg(r.nombre) as roles 
       FROM usuarios u 
       LEFT JOIN usuario_rol ur ON u.id = ur.usuario_id 
       LEFT JOIN roles r ON ur.rol_id = r.id 
       WHERE (u.correo = $1 OR u.nombre = $1) AND u.estado = $2 
       GROUP BY u.id, u.nombre, u.correo, u.contraseña`,
      [email, 'activo']
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    
    const user = result.rows[0];
    
    // Verificar la contraseña usando bcrypt
    const bcrypt = require('bcrypt');
    const passwordMatch = await bcrypt.compare(password, user.contraseña);
    
    if (passwordMatch) {
      res.json({
        success: true,
        token: 'admin-token-123',
        user: {
          id: user.id,
          nombre: user.nombre,
          email: user.correo,
          roles: user.roles.filter(role => role !== null)
        }
      });
    } else {
      res.status(401).json({ error: 'Credenciales inválidas' });
    }
  } catch (error) {
    console.error('Error en login admin:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener médicos
app.get('/api/admin/medicos', verifyAdminToken, async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        m.id,
        m.nombre,
        m.dni,
        m.correo,
        m.telefono,
        m.estado,
        e.nombre as especialidad
      FROM medicos m
      LEFT JOIN especialidades e ON m.especialidad_id = e.id
      ORDER BY m.nombre
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error obteniendo médicos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener usuarios
app.get('/api/admin/usuarios', verifyAdminToken, async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        u.id,
        u.nombre,
        u.correo,
        u.estado,
        u.fecha_creacion,
        array_agg(r.nombre) as roles
      FROM usuarios u
      LEFT JOIN usuario_rol ur ON u.id = ur.usuario_id
      LEFT JOIN roles r ON ur.rol_id = r.id
      GROUP BY u.id, u.nombre, u.correo, u.estado, u.fecha_creacion
      ORDER BY u.nombre
    `);
    
    // Filtrar roles nulos
    const usuarios = result.rows.map(user => ({
      ...user,
      roles: user.roles.filter(role => role !== null)
    }));
    
    res.json(usuarios);
  } catch (error) {
    console.error('Error obteniendo usuarios:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener lista de pacientes
app.get('/api/admin/pacientes', verifyAdminToken, async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        id,
        nombre,
        dni,
        telefono,
        correo,
        fecha_nacimiento,
        estado,
        fecha_registro
      FROM pacientes
      ORDER BY nombre
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error obteniendo pacientes:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Eliminar médico
app.delete('/api/admin/medicos/:id', verifyAdminToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM medicos WHERE id = $1 RETURNING id', [id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Médico no encontrado' });
    }
    
    res.json({ success: true, message: 'Médico eliminado exitosamente' });
  } catch (error) {
    console.error('Error eliminando médico:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Eliminar usuario
app.delete('/api/admin/usuarios/:id', verifyAdminToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM usuarios WHERE id = $1 RETURNING id', [id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    res.json({ success: true, message: 'Usuario eliminado exitosamente' });
  } catch (error) {
    console.error('Error eliminando usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener lista de roles
app.get('/api/admin/roles', verifyAdminToken, async (req, res) => {
  try {
    const result = await query('SELECT id, nombre, descripcion FROM roles ORDER BY nombre');
    res.json(result.rows);
  } catch (error) {
    console.error('Error obteniendo roles:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Crear nuevo usuario
app.post('/api/admin/usuarios', verifyAdminToken, async (req, res) => {
  try {
    const { nombre, correo, contraseña, estado = 'activo', roles = [] } = req.body;
    
    // Validaciones
    if (!nombre || !correo || !contraseña) {
      return res.status(400).json({ error: 'Faltan campos requeridos: nombre, correo, contraseña' });
    }
    
    // Verificar si el correo ya existe
    const existingUser = await query('SELECT id FROM usuarios WHERE correo = $1', [correo]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'El correo ya está en uso' });
    }
    
    // Hash de la contraseña
    const bcrypt = require('bcrypt');
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(contraseña, saltRounds);
    
    // Crear usuario
    const userResult = await query(
      'INSERT INTO usuarios (nombre, correo, contraseña, estado) VALUES ($1, $2, $3, $4) RETURNING id, nombre, correo, estado, fecha_creacion',
      [nombre, correo, hashedPassword, estado]
    );
    
    const newUser = userResult.rows[0];
    
    // Asignar roles si se proporcionaron
    if (roles.length > 0) {
      for (const rolId of roles) {
        await query('INSERT INTO usuario_rol (usuario_id, rol_id) VALUES ($1, $2)', [newUser.id, rolId]);
      }
    }
    
    // Obtener roles asignados
    const rolesResult = await query(`
      SELECT r.nombre 
      FROM roles r 
      JOIN usuario_rol ur ON r.id = ur.rol_id 
      WHERE ur.usuario_id = $1
    `, [newUser.id]);
    
    newUser.roles = rolesResult.rows.map(row => row.nombre);
    
    res.status(201).json({ success: true, message: 'Usuario creado exitosamente', user: newUser });
  } catch (error) {
    console.error('Error creando usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Actualizar usuario
app.put('/api/admin/usuarios/:id', verifyAdminToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, correo, contraseña, estado, roles = [] } = req.body;
    
    // Validaciones
    if (!nombre || !correo) {
      return res.status(400).json({ error: 'Faltan campos requeridos: nombre, correo' });
    }
    
    // Verificar si el usuario existe
    const existingUser = await query('SELECT id FROM usuarios WHERE id = $1', [id]);
    if (existingUser.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    // Verificar si el correo ya existe en otro usuario
    const emailCheck = await query('SELECT id FROM usuarios WHERE correo = $1 AND id != $2', [correo, id]);
    if (emailCheck.rows.length > 0) {
      return res.status(400).json({ error: 'El correo ya está en uso por otro usuario' });
    }
    
    // Preparar datos para actualizar
    let updateFields = ['nombre = $2', 'correo = $3', 'estado = $4'];
    let values = [id, nombre, correo, estado];
    let paramIndex = 5;
    
    // Si se proporciona nueva contraseña, hashearla
    if (contraseña) {
      const bcrypt = require('bcrypt');
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(contraseña, saltRounds);
      updateFields.push(`contraseña = $${paramIndex}`);
      values.push(hashedPassword);
      paramIndex++;
    }
    
    // Actualizar usuario
    const updateQuery = `UPDATE usuarios SET ${updateFields.join(', ')} WHERE id = $1 RETURNING id, nombre, correo, estado, fecha_creacion`;
    const userResult = await query(updateQuery, values);
    const updatedUser = userResult.rows[0];
    
    // Actualizar roles si se proporcionaron
    if (roles.length >= 0) { // Array vacío significa eliminar todos los roles
      // Eliminar roles existentes
      await query('DELETE FROM usuario_rol WHERE usuario_id = $1', [id]);
      
      // Asignar nuevos roles
      if (roles.length > 0) {
        for (const rolId of roles) {
          await query('INSERT INTO usuario_rol (usuario_id, rol_id) VALUES ($1, $2)', [id, rolId]);
        }
      }
    }
    
    // Obtener roles asignados
    const rolesResult = await query(`
      SELECT r.nombre 
      FROM roles r 
      JOIN usuario_rol ur ON r.id = ur.rol_id 
      WHERE ur.usuario_id = $1
    `, [id]);
    
    updatedUser.roles = rolesResult.rows.map(row => row.nombre);
    
    res.json({ success: true, message: 'Usuario actualizado exitosamente', user: updatedUser });
  } catch (error) {
    console.error('Error actualizando usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Eliminar paciente
app.delete('/api/admin/pacientes/:id', verifyAdminToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM pacientes WHERE id = $1 RETURNING id', [id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Paciente no encontrado' });
    }
    
    res.json({ success: true, message: 'Paciente eliminado exitosamente' });
  } catch (error) {
    console.error('Error eliminando paciente:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ====================================
// ENDPOINTS PARA CHATBOT - VALIDACIÓN DE PACIENTES
// ====================================

// Validar paciente existente
app.post('/api/chatbot/validar-paciente', async (req, res) => {
  try {
    const { tipo_documento, numero_documento, nombre, telefono, correo } = req.body;
    
    // Validar datos requeridos
    if (!tipo_documento || !numero_documento || !nombre || !telefono || !correo) {
      return res.status(400).json({
        error: 'Faltan datos requeridos. Debe especificar tipo_documento, numero_documento, nombre, telefono y correo.',
        campo: 'datos_faltantes'
      });
    }
    
    // Buscar paciente existente por DNI (combinando tipo y número)
    const dniCompleto = `${tipo_documento} ${numero_documento}`;
    const pacienteExistente = await query(`
      SELECT id, nombre, dni, telefono, correo, fecha_nacimiento
      FROM pacientes 
      WHERE dni = $1
    `, [dniCompleto]);
    
    if (pacienteExistente.rows.length > 0) {
      const paciente = pacienteExistente.rows[0];
      
      // Comparar datos
      const diferencias = [];
      if (paciente.nombre.toLowerCase() !== nombre.toLowerCase()) {
        diferencias.push('nombre');
      }
      if (paciente.telefono !== telefono) {
        diferencias.push('telefono');
      }
      if (paciente.correo !== correo) {
        diferencias.push('correo');
      }
      
      if (diferencias.length > 0) {
        return res.json({
          tipo: 'datos_diferentes',
          paciente: paciente,
          diferencias: diferencias,
          mensaje: `Paciente encontrado pero los siguientes datos son diferentes: ${diferencias.join(', ')}. ¿Deseas actualizar la información?`
        });
      }
      
      // Datos coinciden perfectamente
      return res.json({
        tipo: 'paciente_existente',
        paciente: paciente,
        mensaje: 'Paciente encontrado. Usando datos existentes.'
      });
      
    } else {
      // Paciente nuevo
      return res.json({
        tipo: 'paciente_nuevo',
        mensaje: 'Paciente nuevo. Procediendo con el registro.'
      });
    }
    
  } catch (error) {
    console.error('Error validando paciente:', error);
    res.status(500).json({ error: 'Error validando paciente' });
  }
});

// Actualizar datos de paciente existente
app.put('/api/chatbot/actualizar-paciente/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, telefono, correo, fecha_nacimiento } = req.body;
    
    const pacienteActualizado = await query(`
      UPDATE pacientes 
      SET nombre = $1, telefono = $2, correo = $3, fecha_nacimiento = $4
      WHERE id = $5
      RETURNING id, nombre, tipo_documento, numero_documento, telefono, correo, fecha_nacimiento
    `, [nombre, telefono, correo, fecha_nacimiento, id]);
    
    res.json({
      success: true,
      paciente: pacienteActualizado.rows[0],
      mensaje: 'Datos del paciente actualizados correctamente'
    });
    
  } catch (error) {
    console.error('Error actualizando paciente:', error);
    res.status(500).json({ error: 'Error actualizando paciente' });
  }
});

// Reactivar paciente inactivo
app.put('/api/chatbot/reactivar-paciente/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const pacienteReactivado = await query(`
      UPDATE pacientes 
      SET fecha_registro = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING id, nombre, tipo_documento, numero_documento, telefono, correo, fecha_nacimiento
    `, [id]);
    
    res.json({
      success: true,
      paciente: pacienteReactivado.rows[0],
      mensaje: 'Paciente reactivado correctamente'
    });
    
  } catch (error) {
    console.error('Error reactivando paciente:', error);
    res.status(500).json({ error: 'Error reactivando paciente' });
  }
});

// Importar el modelo NLU de LucIA
const LuciaNLU = require('./models/lucia-nlu');
const luciaNLU = new LuciaNLU();

// Endpoint NLU mejorado con modelo especializado
app.post('/api/chatbot/nlu', async (req, res) => {
  try {
    const { mensaje } = req.body;
    
    if (!mensaje) {
      return res.status(400).json({ error: 'Mensaje requerido' });
    }
    
    console.log('🧠 Procesando con modelo NLU:', mensaje);
    
    // Procesar mensaje con el modelo NLU
    const nluResult = await luciaNLU.processMessage(mensaje);
    
    // Extraer datos específicos
    const extractedData = luciaNLU.extractData(mensaje, nluResult);
    
    // Obtener confianza de la intención
    const intentConfidence = luciaNLU.getIntentConfidence(nluResult);
    
    const result = {
      intent: nluResult.intent,
      confidence: nluResult.score,
      entities: nluResult.entities,
      extractedData: extractedData,
      answer: nluResult.answer,
      isConfident: intentConfidence.isConfident
    };
    
    console.log('📊 Resultado NLU completo:', result);
    
    res.json(result);
    
  } catch (error) {
    console.error('Error en modelo NLU:', error);
    res.status(500).json({ error: 'Error procesando mensaje con NLU' });
  }
});

// Extraer datos inteligente con IA (mantener compatibilidad)
app.post('/api/chatbot/extraer-datos', async (req, res) => {
  try {
    const { mensaje, contexto } = req.body;
    
    if (!mensaje) {
      return res.status(400).json({ error: 'Mensaje requerido' });
    }
    
    console.log('Extrayendo datos de:', mensaje);
    
    // Crear prompt específico para extracción de datos
    const prompt = `Analiza este mensaje del usuario: "${mensaje}"

Extrae la siguiente información y responde SOLO con JSON válido:

{
  "nombre": "nombre completo si se menciona",
  "especialidad": "especialidad médica si se menciona",
  "telefono": "número de teléfono en formato +519XXXXXXXX",
  "correo": "correo electrónico si se menciona",
  "documento": {
    "tipo": "DNI/CE/Pasaporte",
    "numero": "número del documento"
  },
  "fecha": "fecha en formato YYYY-MM-DD si se menciona",
  "intencion": "agendar/consultar/saludar/desconocido"
}

Reglas importantes:
- ESPECIALIDADES:
  * "cirugia oncologica" o "cirugía oncológica" → "Cirugía Oncológica"
  * "oncólogo" → "Oncología Médica"
  * "radioterapia" o "radiología" → "Radioterapia"
  * "psicología" → "Psicología Oncológica"
  * "nutrición" → "Nutrición Oncológica"
  * "medicina nuclear" → "Medicina Nuclear"
  * "hematología" → "Hematología Oncológica"

- TELÉFONOS:
  * Si tiene 9 dígitos (ej: 984526789), convertir a +51984526789
  * NO agregar dígitos extra, mantener exactamente 9 dígitos después del +51

- INTENCIONES:
  * "quiero cita", "necesito cita", "agendar", "para el [día]", "para mañana" → "agendar"
  * "tienen", "hay", "ofrecen", "laboratorio", "servicios" → "consultar"
  * "hola", "buenos días", "buenas tardes" → "saludar"

- FECHAS:
  * "mañana" → día siguiente
  * "miércoles", "jueves", etc. → próximo día de la semana
  * Convertir a formato YYYY-MM-DD

- Si no se encuentra información, usar null
- NO incluyas texto adicional, solo el JSON`

    // Usar la IA para extraer datos
    const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
      model: 'moonshotai/kimi-k2-instruct',
      messages: [
        {
          role: 'system',
          content: 'Eres un asistente especializado en extraer información estructurada de mensajes de texto. Responde únicamente con JSON válido.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.1,
      max_tokens: 500
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const aiResponse = response.data.choices[0].message.content;
    console.log('Respuesta de IA para extracción:', aiResponse);

    try {
      // Intentar parsear el JSON de la respuesta
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const datosExtraidos = JSON.parse(jsonMatch[0]);
        
        // Validar y limpiar los datos
        const datosLimpios = {
          nombre: datosExtraidos.nombre || null,
          especialidad: datosExtraidos.especialidad || null,
          telefono: datosExtraidos.telefono || null,
          correo: datosExtraidos.correo || null,
          documento: datosExtraidos.documento || null,
          fecha: datosExtraidos.fecha || null,
          intencion: datosExtraidos.intencion || 'desconocido'
        };
        
        console.log('Datos extraídos:', datosLimpios);
        return res.json({ datos: datosLimpios });
      }
    } catch (parseError) {
      console.error('Error parseando JSON de IA:', parseError);
    }
    
    // Fallback: extracción manual básica
    const datosManuales = {
      nombre: null,
      especialidad: null,
      telefono: null,
      correo: null,
      documento: null,
      fecha: null,
      intencion: 'desconocido'
    };
    
    return res.json({ datos: datosManuales });
    
  } catch (error) {
    console.error('Error en extracción de datos:', error);
    res.status(500).json({ error: 'Error extrayendo datos' });
  }
});

// Crear nuevo paciente
app.post('/api/chatbot/crear-paciente', async (req, res) => {
  try {
    const { nombre, tipo_documento, numero_documento, telefono, correo, fecha_nacimiento } = req.body;
    
    // Validar datos requeridos
    if (!nombre || !tipo_documento || !numero_documento || !telefono || !correo) {
      return res.status(400).json({
        error: 'Faltan datos requeridos. Debe especificar nombre, tipo_documento, numero_documento, telefono y correo.'
      });
    }
    
    // Verificar que el documento no exista (usar dni que combina tipo y número)
    const dniCompleto = `${tipo_documento} ${numero_documento}`;
    const pacienteExistente = await query(`
      SELECT id FROM pacientes WHERE dni = $1
    `, [dniCompleto]);
    
    if (pacienteExistente.rows.length > 0) {
      return res.status(400).json({
        error: 'Ya existe un paciente con ese documento'
      });
    }
    
    // Convertir fecha_nacimiento vacía a null para PostgreSQL
    const fechaNacimiento = fecha_nacimiento && fecha_nacimiento.trim() !== '' ? fecha_nacimiento : null;
    
    const nuevoPaciente = await query(`
      INSERT INTO pacientes (nombre, dni, telefono, correo, fecha_nacimiento)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, nombre, dni, telefono, correo, fecha_nacimiento
    `, [nombre, dniCompleto, telefono, correo, fechaNacimiento]);
    
    res.json({
      success: true,
      paciente: nuevoPaciente.rows[0],
      mensaje: 'Paciente creado exitosamente'
    });
    
  } catch (error) {
    console.error('Error creando paciente:', error);
    res.status(500).json({ error: 'Error creando paciente' });
  }
});

// Obtener médicos por especialidad
// Endpoint para obtener todos los médicos disponibles
app.get('/api/chatbot/medicos', async (req, res) => {
  try {
    console.log('Obteniendo lista de médicos disponibles');
    
    const medicos = await query(`
      SELECT m.id, m.nombre, m.especialidad_id, e.nombre as especialidad_nombre
      FROM medicos m
      LEFT JOIN especialidades e ON m.especialidad_id = e.id
      WHERE m.estado = 'activo'
      ORDER BY m.especialidad_id, m.nombre
    `);
    
    console.log('Médicos encontrados:', medicos.rows.length);
    console.log('Resultados:', medicos.rows);
    
    res.json(medicos.rows);
    
  } catch (error) {
    console.error('Error obteniendo médicos:', error);
    res.status(500).json({ error: 'Error obteniendo médicos' });
  }
});

// Obtener especialidades disponibles
app.get('/api/chatbot/especialidades', async (req, res) => {
  try {
    console.log('Obteniendo lista de especialidades disponibles');
    
    const especialidades = await query(`
      SELECT id, nombre
      FROM especialidades
      ORDER BY id
    `);
    
    console.log('Especialidades encontradas:', especialidades.rows.length);
    console.log('Resultados:', especialidades.rows);
    
    res.json(especialidades.rows);
    
  } catch (error) {
    console.error('Error obteniendo especialidades:', error);
    res.status(500).json({ error: 'Error obteniendo especialidades' });
  }
});

app.get('/api/chatbot/medicos/:especialidad', async (req, res) => {
  try {
    const { especialidad } = req.params;
    
    console.log('Buscando médicos para especialidad:', especialidad);
    
    const medicos = await query(`
      SELECT m.id, m.nombre, m.especialidad_id, e.nombre as especialidad_nombre
      FROM medicos m
      LEFT JOIN especialidades e ON m.especialidad_id = e.id
      WHERE LOWER(e.nombre) LIKE LOWER($1) AND m.estado = 'activo'
      ORDER BY m.nombre
    `, [`%${especialidad}%`]);
    
    console.log('Médicos encontrados:', medicos.rows.length);
    console.log('Resultados:', medicos.rows);
    
    res.json(medicos.rows);
    
  } catch (error) {
    console.error('Error obteniendo médicos:', error);
    res.status(500).json({ error: 'Error obteniendo médicos' });
  }
});

// Verificar disponibilidad de horarios
app.post('/api/chatbot/verificar-disponibilidad', async (req, res) => {
  try {
    const { fecha, hora, medico_id } = req.body;
    
    // Validar datos requeridos
    if (!fecha || !hora || !medico_id) {
      return res.status(400).json({
        error: 'Faltan datos requeridos. Debe especificar fecha, hora y medico_id.'
      });
    }
    
    // Validar que la fecha sea futura
    const fechaCita = new Date(fecha);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    if (fechaCita < hoy) {
      return res.json({
        disponible: false,
        mensaje: 'La fecha debe ser futura'
      });
    }
    
    // Verificar si hay citas existentes en esa fecha y hora
    const citasExistentes = await query(`
      SELECT id, paciente_id, medico_id, fecha, estado
      FROM citas 
      WHERE medico_id = $1 
      AND DATE(fecha) = $2 
      AND EXTRACT(HOUR FROM fecha) = $3
      AND estado IN ('agendada', 'reprogramada')
    `, [medico_id, fecha, parseInt(hora.split(':')[0])]);
    
    const disponible = citasExistentes.rows.length === 0;
    
    res.json({
      disponible: disponible,
      citas_existentes: citasExistentes.rows,
      mensaje: disponible ? 'Horario disponible' : 'Horario ocupado'
    });
    
  } catch (error) {
    console.error('Error verificando disponibilidad:', error);
    res.status(500).json({ error: 'Error verificando disponibilidad' });
  }
});

// Obtener citas de un médico en una fecha específica
app.post('/api/chatbot/obtener-citas-medico', async (req, res) => {
  try {
    const { fecha, medico_id } = req.body;
    
    // Validar datos requeridos
    if (!fecha || !medico_id) {
      return res.status(400).json({
        error: 'Faltan datos requeridos. Debe especificar fecha y medico_id.'
      });
    }
    
    // Obtener todas las citas del médico en esa fecha
    const citasExistentes = await query(`
      SELECT id, paciente_id, medico_id, fecha, estado, motivo
      FROM citas 
      WHERE medico_id = $1 
      AND DATE(fecha) = $2 
      AND estado IN ('agendada', 'reprogramada')
      ORDER BY fecha ASC
    `, [medico_id, fecha]);
    
    res.json({
      citas_existentes: citasExistentes.rows,
      total_citas: citasExistentes.rows.length
    });
    
  } catch (error) {
    console.error('Error obteniendo citas del médico:', error);
    res.status(500).json({ error: 'Error obteniendo citas del médico' });
  }
});

// Crear cita desde chatbot
app.post('/api/chatbot/agendar-cita', async (req, res) => {
  try {
    const { paciente_id, medico_id, fecha, hora, motivo, duracion = 20, hora_automatica = false } = req.body;
    
    // Validar datos requeridos
    if (!paciente_id || !medico_id || !fecha || !hora || !motivo) {
      return res.status(400).json({
        error: 'Faltan datos requeridos. Debe especificar paciente_id, medico_id, fecha, hora y motivo.'
      });
    }
    
    // Validar duración
    if (duracion <= 0) {
      return res.status(400).json({
        error: 'La duración debe ser mayor a 0'
      });
    }
    
    // Combinar fecha y hora
    const fechaHora = new Date(`${fecha}T${hora}`);
    
    // Verificar disponibilidad solo si la hora NO fue asignada automáticamente
    if (!hora_automatica) {
      const citasExistentes = await query(`
        SELECT id FROM citas 
        WHERE medico_id = $1 
        AND DATE(fecha) = $2 
        AND EXTRACT(HOUR FROM fecha) = $3
        AND estado IN ('agendada', 'reprogramada')
      `, [medico_id, fecha, parseInt(hora.split(':')[0])]);
      
      if (citasExistentes.rows.length > 0) {
        return res.status(400).json({
          error: 'Horario no disponible'
        });
      }
    }
    
    // Crear la cita
    const nuevaCita = await query(`
      INSERT INTO citas (paciente_id, medico_id, fecha, motivo, estado, duracion)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, paciente_id, medico_id, fecha, motivo, estado
    `, [paciente_id, medico_id, fechaHora, motivo, 'agendada', duracion]);
    
    res.json({
      success: true,
      cita: nuevaCita.rows[0],
      mensaje: 'Cita agendada exitosamente'
    });
    
  } catch (error) {
    console.error('Error agendando cita:', error);
    res.status(500).json({ error: 'Error agendando cita' });
  }
});

// Obtener citas para el panel de administración
app.get('/api/admin/citas', verifyAdminToken, async (req, res) => {
  try {
    const { medico_id, fecha } = req.query;
    
    let sqlQuery = `
      SELECT 
        c.id,
        c.fecha,
        c.motivo,
        c.estado,
        c.duracion,
        p.nombre as paciente_nombre,
        p.dni as paciente_dni,
        p.telefono as paciente_telefono,
        m.nombre as medico_nombre,
        e.nombre as especialidad_nombre
      FROM citas c
      LEFT JOIN pacientes p ON c.paciente_id = p.id
      LEFT JOIN medicos m ON c.medico_id = m.id
      LEFT JOIN especialidades e ON m.especialidad_id = e.id
    `;
    
    const params = [];
    let whereConditions = [];
    
    if (medico_id) {
      params.push(medico_id);
      whereConditions.push(`c.medico_id = $${params.length}`);
    }
    
    if (fecha) {
      params.push(fecha);
      whereConditions.push(`DATE(c.fecha) = $${params.length}`);
    }
    
    if (whereConditions.length > 0) {
      sqlQuery += ` WHERE ${whereConditions.join(' AND ')}`;
    }
    
    sqlQuery += ' ORDER BY c.fecha DESC';
    
    console.log('📊 Query ejecutada:', { text: sqlQuery, params });
    
    const result = await query(sqlQuery, params);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error obteniendo citas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Cancelar cita
app.put('/api/admin/citas/:id/cancelar', verifyAdminToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await query(
      'UPDATE citas SET estado = $1 WHERE id = $2 RETURNING *',
      ['cancelada', id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cita no encontrada' });
    }
    
    res.json({ 
      success: true, 
      mensaje: 'Cita cancelada exitosamente',
      cita: result.rows[0]
    });
  } catch (error) {
    console.error('Error cancelando cita:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ==================== RUTAS DEL BLOG/CMS ====================

// Importar rutas del blog
const blogRoutes = require('./routes/blog');

// Importar rutas de IA
const aiRoutes = require('./routes/ai');

// Usar rutas del blog
app.use('/api/blog', blogRoutes);

// Usar rutas de IA
app.use('/api/ai', aiRoutes);

// Endpoint para corregir URLs de imágenes (solo en producción)
if (process.env.NODE_ENV === 'production') {
  app.post('/api/fix-image-urls', async (req, res) => {
    try {
      console.log('🔧 Iniciando corrección de URLs de imágenes...');
      
      // Obtener todas las entradas con imágenes
      const entries = await query(`
        SELECT id, titulo, imagen_principal, contenido
        FROM blog_entradas 
        WHERE imagen_principal IS NOT NULL 
        OR contenido LIKE '%/uploads/%'
      `);
      
      console.log(`📊 Encontradas ${entries.rows.length} entradas con imágenes`);
      
      let updatedCount = 0;
      
      for (const entry of entries.rows) {
        let needsUpdate = false;
        let newImagenPrincipal = entry.imagen_principal;
        let newContenido = entry.contenido;
        
        // Corregir imagen_principal
        if (entry.imagen_principal && entry.imagen_principal.startsWith('/uploads/')) {
          newImagenPrincipal = `https://webiacontrol-back.onrender.com${entry.imagen_principal}`;
          needsUpdate = true;
          console.log(`🖼️  Corrigiendo imagen principal: ${entry.titulo}`);
        }
        
        // Corregir URLs en el contenido
        if (entry.contenido && entry.contenido.includes('/uploads/')) {
          // Reemplazar URLs relativas con URLs completas del backend
          newContenido = entry.contenido.replace(
            /\/uploads\//g, 
            'https://webiacontrol-back.onrender.com/uploads/'
          );
          
          // También corregir URLs del frontend local
          newContenido = newContenido.replace(
            /https:\/\/onkosweb\.onrender\.com\/uploads\//g,
            'https://webiacontrol-back.onrender.com/uploads/'
          );
          
          // Corregir URLs del backend local
          newContenido = newContenido.replace(
            /http:\/\/onkosweb\.com:8080\/uploads\//g,
            'https://webiacontrol-back.onrender.com/uploads/'
          );
          
          needsUpdate = true;
          console.log(`📝 Corrigiendo contenido: ${entry.titulo}`);
        }
        
        if (needsUpdate) {
          await query(`
            UPDATE blog_entradas 
            SET imagen_principal = $1, contenido = $2
            WHERE id = $3
          `, [newImagenPrincipal, newContenido, entry.id]);
          
          updatedCount++;
          console.log(`✅ Actualizada: ${entry.titulo}`);
        }
      }
      
      console.log(`🎉 Corrección completada: ${updatedCount} entradas actualizadas`);
      res.json({ 
        success: true, 
        message: `URLs de imágenes corregidas exitosamente. ${updatedCount} entradas actualizadas.`,
        updated: updatedCount,
        total: entries.rows.length
      });
    } catch (error) {
      console.error('Error corrigiendo URLs:', error);
      res.status(500).json({ error: 'Error corrigiendo URLs de imágenes', details: error.message });
    }
  });
}

// Endpoint específico para validación de fechas con JSON estructurado
app.post('/api/chatbot/validar-fecha', async (req, res) => {
  try {
    const { mensaje } = req.body;
    
    if (!mensaje) {
      return res.status(400).json({ error: 'Mensaje requerido' });
    }

    // Calcular la fecha de hoy para el contexto
    const hoy = new Date()
    const fechaHoy = hoy.toISOString().split('T')[0] // YYYY-MM-DD
    const diaSemana = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'][hoy.getDay()]
    
    const systemPrompt = `Eres un asistente especializado en interpretar fechas de citas médicas. 
    
    CONTEXTO ACTUAL: Hoy es ${diaSemana} ${fechaHoy}
    
    Responde SOLO con JSON válido en este formato exacto: {"fecha": "2025-01-21", "error": null} o {"fecha": null, "error": "mensaje de error"}. 
  
    Reglas importantes:
    - "mañana" = día siguiente al actual (${fechaHoy} → ${new Date(hoy.getTime() + 24*60*60*1000).toISOString().split('T')[0]})
    - "pasado mañana" = día después de mañana
    - "próximo martes" = martes de la próxima semana
    - "martes que viene" = martes de la próxima semana  
    - "el martes" = martes de esta semana si aún no pasó, sino de la próxima
    - "para el viernes" = viernes de esta semana si aún no pasó, sino de la próxima
    - "jueves" = jueves de esta semana si aún no pasó, sino de la próxima semana
    - Fecha debe ser futura (no puede ser en el pasado)
    - Formato de respuesta: YYYY-MM-DD
    - Calcula correctamente considerando que hoy es ${fechaHoy}
    
    NO incluyas texto adicional, solo el JSON.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Interpreta esta fecha de cita: "${mensaje}".` }
    ];

    let botResponse;
    
    if (groq && process.env.GROQ_API_KEY && process.env.GROQ_API_KEY !== 'tu_api_key_de_groq_aqui') {
      try {
        const completion = await groq.chat.completions.create({
          messages: messages,
          model: 'moonshotai/kimi-k2-instruct',
          temperature: 0.1, // Baja temperatura para respuestas más consistentes
          max_tokens: 200,
        });
        
        botResponse = completion.choices[0]?.message?.content || '{"error": "No se pudo procesar la fecha"}';
      } catch (error) {
        console.error('Error con Groq en validación de fecha:', error);
        botResponse = '{"error": "Error al procesar la fecha"}';
      }
    } else {
      // Fallback: interpretación manual
      botResponse = interpretarFechaManual(mensaje);
    }

    // Intentar parsear el JSON
    try {
      const jsonMatch = botResponse.match(/\{[^{}]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        
        // Validar que la fecha sea futura si se proporcionó
        if (parsed.fecha) {
          const fechaCita = new Date(parsed.fecha);
          const hoy = new Date();
          hoy.setHours(0, 0, 0, 0);
          
          if (fechaCita < hoy) {
            return res.json({ fecha: null, error: 'La fecha debe ser futura. Por favor, especifica una fecha válida.' });
          }
        }
        
        res.json(parsed);
      } else {
        // Si no se puede parsear, usar interpretación manual
        const resultadoManual = interpretarFechaManual(mensaje);
        res.json(resultadoManual);
      }
    } catch (e) {
      console.error('Error parsing JSON de fecha:', e);
      const resultadoManual = interpretarFechaManual(mensaje);
      res.json(resultadoManual);
    }

  } catch (error) {
    console.error('Error en validación de fecha:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      fecha: null
    });
  }
});

// Función de interpretación manual de fechas (fallback)
function interpretarFechaManual(mensaje) {
  const mensajeLower = mensaje.toLowerCase().trim();
  
  // Manejar "pasado mañana" primero (prioridad alta)
  if (mensajeLower.includes('pasado mañana')) {
    const pasadoMañana = new Date();
    pasadoMañana.setDate(pasadoMañana.getDate() + 2);
    const fechaFormateada = pasadoMañana.toISOString().split('T')[0];
    return { fecha: fechaFormateada, error: null };
  }
  
  // Manejar "mañana"
  if (mensajeLower.includes('mañana')) {
    const mañana = new Date();
    mañana.setDate(mañana.getDate() + 1);
    const fechaFormateada = mañana.toISOString().split('T')[0];
    return { fecha: fechaFormateada, error: null };
  }
  
  // Manejar días de la semana con lógica mejorada
  const diasSemana = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
  const diaEncontrado = diasSemana.find(dia => mensajeLower.includes(dia));
  
  if (diaEncontrado) {
    const hoy = new Date();
    const diaActual = hoy.getDay(); // 0 = domingo, 1 = lunes, ..., 6 = sábado
    const indiceDia = diasSemana.indexOf(diaEncontrado);
    const indiceDiaJS = indiceDia === 6 ? 0 : indiceDia + 1; // Convertir a formato JS (domingo = 0)
    
    // Calcular días hasta el día solicitado
    let diasHastaDia = indiceDiaJS - diaActual;
    
    // Si es "que viene" o "próximo", siempre ir a la próxima semana
    if (mensajeLower.includes('que viene') || mensajeLower.includes('próximo')) {
      if (diasHastaDia <= 0) {
        diasHastaDia += 7; // Si ya pasó esta semana, ir a la próxima
      } else {
        diasHastaDia += 7; // Siempre ir a la próxima semana para "que viene" o "próximo"
      }
    } else {
      // Para expresiones normales ("para el miércoles", "miércoles", etc.)
      if (diasHastaDia <= 0) {
        diasHastaDia += 7; // Si ya pasó esta semana, ir a la próxima
      }
    }
    
    const fechaDeseada = new Date();
    fechaDeseada.setDate(hoy.getDate() + diasHastaDia);
    const fechaFormateada = fechaDeseada.toISOString().split('T')[0];
    
    return { fecha: fechaFormateada, error: null };
  }
  
  // Si no se encontró un día de la semana
  return { fecha: null, error: 'No pude entender la fecha. Por favor, especifica para cuándo quieres la cita de forma más clara.' };
}

app.listen(PORT, '0.0.0.0', () => {
console.log(`Servidor Onkos Instituto del Cáncer ejecutándose en puerto ${PORT}`);
console.log(`API disponible en:`);
console.log(`   Local: http://localhost:${PORT}`);
console.log(`   Red: http://192.168.1.123:${PORT}`);
console.log(`Blog/CMS API: http://localhost:${PORT}/api/blog`);
}); 