const { Nlp } = require('@nlpjs/nlp');

class LuciaNLU {
  constructor() {
    this.manager = new Nlp({ 
      languages: ['es'],
      autoSave: false
    });
    
    this.isTrained = false;
  }

  async initialize() {
    console.log('🤖 Inicializando modelo NLU de LucIA...');
    
    // Definir intenciones
    this.defineIntents();
    
    // Entrenar el modelo
    await this.train();
    
    this.isTrained = true;
    console.log('✅ Modelo NLU de LucIA entrenado exitosamente');
  }

  defineIntents() {
    // Intención: Agendar cita
    this.manager.addDocument('es', 'quiero una cita', 'agendar_cita');
    this.manager.addDocument('es', 'necesito una cita', 'agendar_cita');
    this.manager.addDocument('es', 'agendar cita', 'agendar_cita');
    this.manager.addDocument('es', 'solicitar cita', 'agendar_cita');
    this.manager.addDocument('es', 'cita con oncólogo', 'agendar_cita');
    this.manager.addDocument('es', 'cita para mañana', 'agendar_cita');
    this.manager.addDocument('es', 'consulta médica', 'agendar_cita');
    this.manager.addDocument('es', 'ver al doctor', 'agendar_cita');
    this.manager.addDocument('es', 'para el miércoles', 'agendar_cita');
    this.manager.addDocument('es', 'para mañana', 'agendar_cita');
    this.manager.addDocument('es', 'quiero ver al médico', 'agendar_cita');
    this.manager.addDocument('es', 'necesito consulta', 'agendar_cita');
    this.manager.addDocument('es', 'cita con cirugía oncológica', 'agendar_cita');
    this.manager.addDocument('es', 'cita con radioterapia', 'agendar_cita');
    this.manager.addDocument('es', 'cita con psicología', 'agendar_cita');
    this.manager.addDocument('es', 'cita con nutrición', 'agendar_cita');

    // Intención: Consultar médicos
    this.manager.addDocument('es', '¿qué médicos tienes?', 'consultar_medicos');
    this.manager.addDocument('es', 'que medicos tienes', 'consultar_medicos');
    this.manager.addDocument('es', '¿qué médicos atienden?', 'consultar_medicos');
    this.manager.addDocument('es', 'que medicos atienden', 'consultar_medicos');
    this.manager.addDocument('es', '¿quiénes son los doctores?', 'consultar_medicos');
    this.manager.addDocument('es', 'quienes son los doctores', 'consultar_medicos');
    this.manager.addDocument('es', '¿cuáles son los médicos?', 'consultar_medicos');
    this.manager.addDocument('es', 'cuales son los medicos', 'consultar_medicos');
    this.manager.addDocument('es', 'lista de médicos', 'consultar_medicos');
    this.manager.addDocument('es', 'lista de doctores', 'consultar_medicos');
    this.manager.addDocument('es', 'equipo médico', 'consultar_medicos');
    this.manager.addDocument('es', 'staff médico', 'consultar_medicos');
    this.manager.addDocument('es', 'personal médico', 'consultar_medicos');
    this.manager.addDocument('es', 'médicos disponibles', 'consultar_medicos');
    this.manager.addDocument('es', 'doctores disponibles', 'consultar_medicos');

    // Intención: Consultar servicios
    this.manager.addDocument('es', '¿tienen laboratorio?', 'consultar_servicios');
    this.manager.addDocument('es', 'tienen laboratorio', 'consultar_servicios');
    this.manager.addDocument('es', '¿hay laboratorio?', 'consultar_servicios');
    this.manager.addDocument('es', 'ofrecen radiología', 'consultar_servicios');
    this.manager.addDocument('es', '¿qué servicios tienen?', 'consultar_servicios');
    this.manager.addDocument('es', 'qué especialidades tienen', 'consultar_servicios');
    this.manager.addDocument('es', 'horarios de atención', 'consultar_servicios');
    this.manager.addDocument('es', 'precios de consultas', 'consultar_servicios');
    this.manager.addDocument('es', 'costos de tratamiento', 'consultar_servicios');
    this.manager.addDocument('es', '¿hacen tomografías?', 'consultar_servicios');
    this.manager.addDocument('es', '¿tienen resonancia?', 'consultar_servicios');
    this.manager.addDocument('es', 'servicios disponibles', 'consultar_servicios');

    // Intención: Saludar
    this.manager.addDocument('es', 'hola', 'saludar');
    this.manager.addDocument('es', 'buenos días', 'saludar');
    this.manager.addDocument('es', 'buenas tardes', 'saludar');
    this.manager.addDocument('es', 'buenas noches', 'saludar');
    this.manager.addDocument('es', 'hi', 'saludar');
    this.manager.addDocument('es', 'hello', 'saludar');
    this.manager.addDocument('es', 'buen día', 'saludar');
    this.manager.addDocument('es', 'saludos', 'saludar');

    // Intención: Proporcionar datos personales
    this.manager.addDocument('es', 'mi nombre es juan pérez', 'proporcionar_datos');
    this.manager.addDocument('es', 'soy maría garcía', 'proporcionar_datos');
    this.manager.addDocument('es', 'dni 12345678', 'proporcionar_datos');
    this.manager.addDocument('es', 'carnet 004200468', 'proporcionar_datos');
    this.manager.addDocument('es', '984526789', 'proporcionar_datos');
    this.manager.addDocument('es', 'juan@email.com', 'proporcionar_datos');
    this.manager.addDocument('es', '15 de marzo de 1980', 'proporcionar_datos');
    this.manager.addDocument('es', '20 de julio del 79', 'proporcionar_datos');

    // Intención: Confirmar datos
    this.manager.addDocument('es', 'sí', 'confirmar');
    this.manager.addDocument('es', 'si', 'confirmar');
    this.manager.addDocument('es', 'correcto', 'confirmar');
    this.manager.addDocument('es', 'ok', 'confirmar');
    this.manager.addDocument('es', 'perfecto', 'confirmar');
    this.manager.addDocument('es', 'está bien', 'confirmar');
    this.manager.addDocument('es', 'de acuerdo', 'confirmar');

    // Intención: Corregir datos
    this.manager.addDocument('es', 'no', 'corregir');
    this.manager.addDocument('es', 'incorrecto', 'corregir');
    this.manager.addDocument('es', 'está mal', 'corregir');
    this.manager.addDocument('es', 'quiero cambiar', 'corregir');
    this.manager.addDocument('es', 'corregir nombre', 'corregir');
    this.manager.addDocument('es', 'cambiar fecha', 'corregir');
    this.manager.addDocument('es', 'modificar hora', 'corregir');

    // Intención: Despedirse
    this.manager.addDocument('es', 'adiós', 'despedirse');
    this.manager.addDocument('es', 'hasta luego', 'despedirse');
    this.manager.addDocument('es', 'nos vemos', 'despedirse');
    this.manager.addDocument('es', 'chao', 'despedirse');
    this.manager.addDocument('es', 'gracias', 'despedirse');
    this.manager.addDocument('es', 'muchas gracias', 'despedirse');

    // Definir respuestas
    this.manager.addAnswer('es', 'agendar_cita', 'Perfecto, te ayudo a agendar tu cita. Vamos a recopilar la información necesaria.');
    this.manager.addAnswer('es', 'consultar_medicos', 'Te puedo ayudar con información sobre nuestros médicos especialistas. ¿Qué te interesa saber?');
    this.manager.addAnswer('es', 'consultar_servicios', 'Te puedo ayudar con información sobre nuestros servicios. ¿Qué te interesa saber?');
    this.manager.addAnswer('es', 'saludar', '¡Hola! Bienvenido al Onkos Instituto del Cáncer. Soy Lucía, ¿en qué puedo ayudarte hoy?');
    this.manager.addAnswer('es', 'proporcionar_datos', 'Perfecto, he recibido tu información.');
    this.manager.addAnswer('es', 'confirmar', 'Excelente, continuemos.');
    this.manager.addAnswer('es', 'corregir', 'Por supuesto, podemos corregir esa información.');
    this.manager.addAnswer('es', 'despedirse', '¡Gracias por contactarnos! Que tengas un excelente día.');
  }

  // Extraer entidades manualmente usando regex
  extractEntities(message) {
    const entities = [];
    
    // Especialidades médicas
    const especialidades = {
      'oncología médica': ['oncología', 'oncológica', 'oncólogo', 'oncolo', 'médica'],
      'radioterapia': ['radioterapia', 'radiología', 'radiologia', 'radioligia', 'radio'],
      'cirugía oncológica': ['cirugía oncológica', 'cirugia oncologica', 'cirujano', 'cirugía'],
      'psicología oncológica': ['psicología', 'psicólogo', 'psicologo', 'psicológica'],
      'nutrición oncológica': ['nutrición', 'nutrición', 'nutricionista', 'nutricional'],
      'medicina nuclear': ['medicina nuclear', 'nuclear'],
      'hematología oncológica': ['hematología', 'hematólogo', 'hematologo', 'hematológica']
    };
    
    for (const [especialidad, patrones] of Object.entries(especialidades)) {
      for (const patron of patrones) {
        if (message.toLowerCase().includes(patron.toLowerCase())) {
          entities.push({
            entity: 'especialidad',
            option: especialidad,
            sourceText: patron
          });
          break;
        }
      }
    }
    
    // Teléfono
    const telefonoMatch = message.match(/\b(9\d{8}|\+51\s*9\d{8})\b/g);
    if (telefonoMatch) {
      entities.push({
        entity: 'telefono',
        option: telefonoMatch[0],
        sourceText: telefonoMatch[0]
      });
    }
    
    // Email
    const emailMatch = message.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g);
    if (emailMatch) {
      entities.push({
        entity: 'email',
        option: emailMatch[0],
        sourceText: emailMatch[0]
      });
    }
    
    // Tipo de documento
    const docTypeMatch = message.match(/\b(dni|ce|carnet|pasaporte)\b/gi);
    if (docTypeMatch) {
      entities.push({
        entity: 'tipo_documento',
        option: docTypeMatch[0].toUpperCase(),
        sourceText: docTypeMatch[0]
      });
    }
    
    // Número de documento
    const docNumMatch = message.match(/\b\d{8,12}\b/g);
    if (docNumMatch) {
      entities.push({
        entity: 'numero_documento',
        option: docNumMatch[0],
        sourceText: docNumMatch[0]
      });
    }
    
    // Fechas relativas
    const fechasRelativas = ['mañana', 'pasado mañana', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
    for (const fecha of fechasRelativas) {
      if (message.toLowerCase().includes(fecha)) {
        entities.push({
          entity: 'fecha_relativa',
          option: fecha,
          sourceText: fecha
        });
        break;
      }
    }
    
    return entities;
  }

  async train() {
    console.log('🧠 Entrenando modelo NLU...');
    await this.manager.train();
    console.log('✅ Modelo entrenado exitosamente');
  }

  async processMessage(message) {
    if (!this.isTrained) {
      await this.initialize();
    }

    console.log(`🤖 Procesando mensaje: "${message}"`);
    
    const response = await this.manager.process('es', message);
    
    // Extraer entidades manualmente
    const entities = this.extractEntities(message);
    
    console.log('📊 Resultado del NLU:', {
      intent: response.intent,
      score: response.score,
      entities: entities
    });

    return {
      intent: response.intent,
      score: response.score,
      entities: entities,
      answer: response.answer,
      originalMessage: message
    };
  }

  // Método para extraer datos específicos del mensaje
  extractData(message, nluResult) {
    const data = {
      nombre: null,
      especialidad: null,
      telefono: null,
      correo: null,
      documento: null,
      fecha: null,
      hora: null,
      medico: null
    };

    // Extraer especialidad de las entidades
    if (nluResult.entities) {
      nluResult.entities.forEach(entity => {
        if (entity.entity === 'especialidad') {
          data.especialidad = entity.option;
        } else if (entity.entity === 'telefono') {
          let telefono = entity.sourceText;
          if (!telefono.startsWith('+51') && telefono.length === 9) {
            telefono = '+51' + telefono;
          }
          data.telefono = telefono;
        } else if (entity.entity === 'email') {
          data.correo = entity.sourceText;
        } else if (entity.entity === 'tipo_documento') {
          data.documento = {
            tipo: entity.option,
            numero: null
          };
        } else if (entity.entity === 'numero_documento') {
          if (data.documento) {
            data.documento.numero = entity.sourceText;
          } else {
            data.documento = {
              tipo: null,
              numero: entity.sourceText
            };
          }
        } else if (entity.entity === 'fecha_relativa') {
          data.fecha = entity.option;
        } else if (entity.entity === 'hora') {
          data.hora = entity.sourceText;
        }
      });
    }

    // Extraer nombre usando regex mejorado y más específico
    const nombrePatterns = [
      /(?:soy|me llamo|mi nombre es|nombre)\s+([a-záéíóúñ\s]+)/i,
      /^([A-Z][a-záéíóúñ]+\s+[A-Z][a-záéíóúñ]+)(?:\s|$)/, // Patrón: Nombre Apellido
      /^([a-záéíóúñ]+\s+[a-záéíóúñ]+)(?:\s|$)/i // Patrón más flexible
    ];
    
    // Palabras que NO son nombres válidos
    const palabrasInvalidas = [
      'quiero', 'necesito', 'hacer', 'agendar', 'solicitar', 'cita', 'consulta',
      'ver', 'al', 'con', 'para', 'el', 'la', 'del', 'de', 'en', 'por',
      'tienen', 'hay', 'ofrecen', 'servicios', 'laboratorio', 'radiología',
      'medicos', 'doctores', 'médicos', 'doctor', 'médico', 'atención',
      'atienden', 'cuáles', 'cuales', 'quienes', 'quiénes', 'lista',
      'equipo', 'staff', 'personal', 'disponibles', 'especialistas'
    ];
    
    for (const pattern of nombrePatterns) {
      const nombreMatch = message.match(pattern);
      if (nombreMatch) {
        const nombre = nombreMatch[1].trim();
        
        // Validaciones más estrictas
        const esNombreValido = 
          !/^\d+$/.test(nombre) && // No es solo números
          nombre.length > 2 && // Tiene más de 2 caracteres
          nombre.length < 50 && // No es muy largo
          !palabrasInvalidas.some(palabra => 
            nombre.toLowerCase().includes(palabra.toLowerCase())
          ) && // No contiene palabras inválidas
          /^[a-záéíóúñ\s]+$/i.test(nombre); // Solo letras y espacios
        
        if (esNombreValido) {
          data.nombre = nombre;
          break;
        }
      }
    }

    // Extraer nombre de médico si está presente
    const medicoPatterns = [
      /(?:con|al|a la|con el|con la)\s+(dr\.?\s+[a-záéíóúñ\s]+)/i,
      /(?:doctor|dra\.?|dr\.?)\s+([a-záéíóúñ\s]+)/i,
      /([a-záéíóúñ]+\s+[a-záéíóúñ]+\s+[a-záéíóúñ]+)/i // Patrón para nombres completos de médicos
    ];

    for (const pattern of medicoPatterns) {
      const medicoMatch = message.match(pattern);
      if (medicoMatch) {
        const medico = medicoMatch[1].trim();
        // Validar que no sea un nombre de paciente
        if (!data.nombre || medico !== data.nombre) {
          data.medico = medico;
          break;
        }
      }
    }

    return data;
  }

  // Método para obtener la intención con confianza
  getIntentConfidence(nluResult) {
    return {
      intent: nluResult.intent,
      confidence: nluResult.score,
      isConfident: nluResult.score > 0.7
    };
  }
}

module.exports = LuciaNLU;