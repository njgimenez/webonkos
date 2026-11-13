<template>
  <!-- Chatbot v1.2.0 - Sin fecha_nacimiento -->
  <div class="chatbot" :class="{ 'chatbot--open': isOpen }">
    <!-- Botón flotante del chatbot -->
    <button class="chatbot__toggle" @click="toggleChat" :class="{ 'chatbot__toggle--hidden': isOpen }">
      <i class="fas fa-comments"></i>
      <span class="chatbot__notification" v-if="hasUnreadMessages"></span>
    </button>
    
    <!-- Ventana del chat -->
    <div class="chatbot__window" v-if="isOpen">
              <div class="chatbot__header">
          <div class="chatbot__header-info">
            <i class="fas fa-headset"></i>
            <div>
              <h4>LucIA <span class="ai-badge"><i class="fas fa-robot"></i> IA</span></h4>
              <span>Recepcionista Inteligente</span>
            </div>
          </div>
          <button class="chatbot__close" @click="closeChat">
            <i class="fas fa-times"></i>
          </button>
        </div>
      
      <div class="chatbot__messages" ref="messagesContainer">
        <div 
          v-for="(message, index) in messages" 
          :key="index"
          class="chatbot__message"
          :class="message.type"
        >
          <div class="chatbot__message-avatar" v-if="message.type === 'bot'">
            <i class="fas fa-headset"></i>
          </div>
          <div class="chatbot__message-content">
            <div class="chatbot__message-text" v-html="formatMessage(message.text)"></div>
            <div class="chatbot__message-time">{{ formatTime(message.timestamp) }}</div>
          </div>
        </div>
        
        <div v-if="isTyping" class="chatbot__message bot">
          <div class="chatbot__message-avatar">
            <i class="fas fa-headset"></i>
          </div>
          <div class="chatbot__message-content">
            <div class="chatbot__typing">
              <div class="chatbot__typing-text">LucIA está escribiendo...</div>
              <div class="chatbot__typing-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="chatbot__input">
        <form @submit.prevent="sendMessage">
          <input
            v-model="currentMessage"
            type="text"
            placeholder="Escribe tu mensaje..."
            :disabled="isTyping"
            ref="messageInput"
          />
          <button type="submit" :disabled="!currentMessage.trim() || isTyping">
            <i class="fas fa-paper-plane"></i>
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'
import eventBus from '@/utils/eventBus'

export default {
  name: 'ChatBot',
  data() {
    return {
      isOpen: false,
      messages: [],
      currentMessage: '',
      isTyping: false,
      hasUnreadMessages: false,
      conversationHistory: [],
      // Variables para agendamiento de citas
      isSchedulingAppointment: false,
      appointmentData: {
        nombre: '',
        tipo_documento: '',
        numero_documento: '',
        telefono: '',
        correo: '',
        especialidad: '',
        fecha: '',
        hora: '',
        motivo: ''
      },
      currentStep: '',
      pacienteValidado: null,
      // Memoria de sesión para datos del paciente
      sessionMemory: {
        hasPatientData: false,
        patientData: {
          nombre: '',
          tipo_documento: '',
          numero_documento: '',
          telefono: '',
          correo: '',
        },
        lastAppointment: null
      }
    }
  },
  mounted() {
    // Mensaje de bienvenida
    let welcomeMessage = 'Hola, soy LucIA. ¿En qué puedo ayudarte hoy?'
    
    // Si hay datos de sesión, mencionarlos
    if (this.sessionMemory.hasPatientData) {
      welcomeMessage += `\n\nVeo que ya tienes datos guardados en esta sesión. Si quieres agendar otra cita, puedo usar la misma información.`
    }
    
    this.addMessage({
      type: 'bot',
      text: welcomeMessage,
      timestamp: new Date()
    })
    
    // Escuchar eventos para abrir el chatbot
    eventBus.on('open-chatbot', this.openChatbotWithMessage)
  },
  
  beforeUnmount() {
    // Limpiar el listener
    eventBus.off('open-chatbot', this.openChatbotWithMessage)
  },
  methods: {
    toggleChat() {
      const wasClosed = !this.isOpen
      this.isOpen = !this.isOpen
      
      if (this.isOpen) {
        this.hasUnreadMessages = false
        
        // Si estaba cerrado, reiniciar el chat
        if (wasClosed) {
          this.resetChat()
        }
        
        this.$nextTick(() => {
          this.$refs.messageInput?.focus()
          this.scrollToBottom()
        })
      }
    },
    
    closeChat() {
      this.isOpen = false
      // Reiniciar el chat cuando se cierra
      this.resetChat()
    },
    
    resetChat() {
      // Limpiar todos los mensajes
      this.messages = []
      
      // Resetear variables de agendamiento (pero mantener memoria de sesión)
      this.isSchedulingAppointment = false
      this.appointmentData = {
        nombre: '',
        tipo_documento: '',
        numero_documento: '',
        telefono: '',
        correo: '',
        especialidad: '',
        fecha: '',
        hora: '',
        motivo: ''
      }
      this.currentStep = ''
      this.pacienteValidado = null
      
      // Limpiar historial de conversación
      this.conversationHistory = []
      
      // Resetear estado de escritura
      this.isTyping = false
      this.currentMessage = ''
      
      // Agregar mensaje de bienvenida nuevamente
      let welcomeMessage = 'Hola, soy LucIA. ¿En qué puedo ayudarte hoy?'
      
      // Si hay datos de sesión, mencionarlos
      if (this.sessionMemory.hasPatientData) {
        welcomeMessage += `\n\nVeo que ya tienes datos guardados en esta sesión. Si quieres agendar otra cita, puedo usar la misma información.`
      }
      
      this.addMessage({
        type: 'bot',
        text: welcomeMessage,
        timestamp: new Date()
      })
    },
    
    openChatbotWithMessage(message) {
      // Reiniciar el chat antes de abrirlo
      this.resetChat()
      
      // Abrir el chatbot
      this.isOpen = true
      this.hasUnreadMessages = false
      
      // Enviar el mensaje automáticamente
      this.$nextTick(() => {
          this.currentMessage = message
          this.sendMessage()
      })
    },
    
    async sendMessage() {
      if (!this.currentMessage.trim() || this.isTyping) return
      
      const userMessage = this.currentMessage.trim()
      this.addMessage({
        type: 'user',
        text: userMessage,
        timestamp: new Date()
      })
      
      this.currentMessage = ''
      this.isTyping = true
      
      try {
        // 🧠 SISTEMA NLU CON MODELO ESPECIALIZADO - Detectar intención del usuario
        const intencion = await this.detectarIntencion(userMessage)
        console.log('🎯 Intención detectada:', intencion)
        
        let botResponse = null
        
        // Manejar según la intención detectada
        if (intencion === 'agendar' || this.isSchedulingAppointment) {
          // Flujo de agendamiento de citas
          botResponse = await this.handleAppointmentScheduling(userMessage)
        } else if (intencion === 'consultar_medicos') {
          // Responder preguntas sobre médicos
          botResponse = await this.responderPreguntaMedicos(userMessage)
        } else if (intencion === 'consultar') {
          // Responder preguntas sobre servicios
          botResponse = this.responderPreguntaServicios(userMessage)
        } else if (intencion === 'saludar') {
          // Responder saludos
          botResponse = '¡Hola! Bienvenido al Onkos Instituto del Cáncer. Soy Lucía, ¿en qué puedo ayudarte hoy?'
        } else {
          // Verificar si hay estado de agendamiento que recuperar
          const recoveryResponse = this.recoverAppointmentState()
          if (recoveryResponse) {
            botResponse = recoveryResponse
        } else {
          // Verificar si el usuario pregunta sobre su última cita
          const lastAppointmentResponse = this.handleLastAppointmentQuery(userMessage)
          if (lastAppointmentResponse) {
              botResponse = lastAppointmentResponse
            } else {
              // Usar el chatbot normal para otras consultas
          const response = await axios.post('/api/chat', {
            message: userMessage,
            conversationHistory: this.conversationHistory
          })
          
              botResponse = response.data.response
          
          // Agregar la conversación al historial
          this.conversationHistory.push(
            { role: 'user', content: userMessage },
                { role: 'assistant', content: botResponse }
          )
          
          // Limitar el historial a los últimos 10 mensajes
          if (this.conversationHistory.length > 10) {
            this.conversationHistory = this.conversationHistory.slice(-10)
              }
            }
          }
          }
          
        if (botResponse) {
          // Procesar respuesta y enviar mensajes instantáneamente
          const messages = this.processLongResponse(botResponse)
          
          for (let i = 0; i < messages.length; i++) {
            const message = messages[i]
            
            // Agregar el mensaje inmediatamente
            this.addMessage({
              type: 'bot',
              text: message,
              timestamp: new Date()
            })
          }
        }
        
      } catch (error) {
        console.error('Error al enviar mensaje:', error)
        this.addMessage({
          type: 'bot',
          text: 'Lo siento, he tenido un problema técnico. Por favor, intenta de nuevo en unos momentos o contacta directamente con la clínica.',
          timestamp: new Date()
        })
      } finally {
        this.isTyping = false
        this.$nextTick(() => {
          this.scrollToBottom()
          this.restoreFocus()
        })
      }
    },
    
    // Procesar respuestas largas y dividirlas en múltiples mensajes
    processLongResponse(text) {
      // Si el texto es corto, devolver como un solo mensaje
      if (text.length <= 200) {
        return [text]
      }
      
      // Dividir por párrafos si existen
      const paragraphs = text.split('\n\n').filter(p => p.trim())
      
      if (paragraphs.length > 1) {
        return paragraphs.map(p => p.trim())
      }
      
      // Dividir por oraciones si es muy largo
      const sentences = text.match(/[^.!?]+[.!?]+/g) || [text]
      
      if (sentences.length <= 3) {
        return [text]
      }
      
      // Agrupar oraciones en mensajes de tamaño razonable
      const messages = []
      let currentMessage = ''
      
      for (const sentence of sentences) {
        if ((currentMessage + sentence).length > 300) {
          if (currentMessage.trim()) {
            messages.push(currentMessage.trim())
          }
          currentMessage = sentence
        } else {
          currentMessage += sentence
        }
      }
      
      if (currentMessage.trim()) {
        messages.push(currentMessage.trim())
      }
      
      return messages.length > 0 ? messages : [text]
    },
    
    addMessage(message) {
      this.messages.push(message)
      this.$nextTick(() => {
        this.scrollToBottom()
        // Restaurar foco al input después de cada mensaje del bot
        if (message.type === 'bot') {
          this.restoreFocus()
        }
      })
      
      // Mostrar notificación si el chat está cerrado
      if (!this.isOpen && message.type === 'bot') {
        this.hasUnreadMessages = true
      }
    },
    
    scrollToBottom() {
      const container = this.$refs.messagesContainer
      if (container) {
        container.scrollTop = container.scrollHeight
      }
    },
    
    restoreFocus() {
      this.$nextTick(() => {
        if (this.isOpen && this.$refs.messageInput) {
          this.$refs.messageInput.focus()
        }
      })
    },
    
    formatMessage(text) {
      // Convertir saltos de línea en <br>
      let formattedText = text.replace(/\n/g, '<br>')
      
      // Convertir URLs en enlaces
      formattedText = formattedText.replace(
        /(https?:\/\/[^\s]+)/g,
        '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
      )
      
      return formattedText
    },
    
    formatTime(timestamp) {
      return new Date(timestamp).toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
      })
    },
    
    // Extraer información del mensaje inicial usando NLU híbrido
    async extractInitialData(userMessage) {
      try {
        console.log('🧠 Extrayendo datos del mensaje inicial:', userMessage)
        
        // Usar el sistema NLU híbrido
        const datosExtraidos = await this.extraerDatosInteligente(userMessage)
        
        console.log('📊 Datos extraídos por NLU:', datosExtraidos)
        
        // Convertir al formato esperado
        const resultado = {
          nombre: datosExtraidos.nombre || null,
          especialidad: datosExtraidos.especialidad || null,
          telefono: datosExtraidos.telefono || null,
          correo: datosExtraidos.correo || null,
          documento: datosExtraidos.documento ? 
            `${datosExtraidos.documento.tipo} ${datosExtraidos.documento.numero}` : null,
          fecha: datosExtraidos.fecha || null,
          hora: null, // No se extrae hora en el mensaje inicial típicamente
          error: null
        }
        
        // Si tenemos datos útiles, aplicarlos al appointmentData
        if (resultado.nombre) {
          this.appointmentData.nombre = resultado.nombre
        }
        
        if (resultado.especialidad) {
          this.appointmentData.especialidad = resultado.especialidad
        }
        
        if (resultado.telefono) {
          this.appointmentData.telefono = resultado.telefono
        }
        
        if (resultado.correo) {
          this.appointmentData.correo = resultado.correo
        }
        
        if (resultado.documento) {
          const docMatch = resultado.documento.match(/(\w+)\s+(.+)/)
          if (docMatch) {
            this.appointmentData.tipo_documento = docMatch[1]
            this.appointmentData.numero_documento = docMatch[2]
          }
        }
        
        if (resultado.fecha) {
          this.appointmentData.fecha = resultado.fecha
        }
        
        return resultado
        
      } catch (error) {
        console.error('Error extrayendo datos iniciales:', error)
        return this.extractInitialDataManual(userMessage)
      }
    },
    
    // Extracción manual de datos iniciales (fallback)
    extractInitialDataManual(userMessage) {
      const mensaje = userMessage.toLowerCase()
      const extracted = {
        nombre: null,
        especialidad: null,
        telefono: null,
        correo: null,
        documento: null,
        fecha: null,
        hora: null,
        error: null
      }
      
      // Extraer especialidad (mejorado con más variaciones)
      const especialidades = {
        'radiologia': 'Radioterapia',
        'radioligia': 'Radioterapia', // Manejar error de escritura
        'radioterapia': 'Radioterapia',
        'oncologia': 'Oncología Médica',
        'oncólogo': 'Oncología Médica',
        'oncolo': 'Oncología Médica',
        'cirugia': 'Cirugía Oncológica',
        'cirugía': 'Cirugía Oncológica',
        'cirujano': 'Cirugía Oncológica',
        'psicologia': 'Psicología Oncológica',
        'psicólogo': 'Psicología Oncológica',
        'psicologo': 'Psicología Oncológica',
        'nutricion': 'Nutrición Oncológica',
        'nutrición': 'Nutrición Oncológica',
        'nutricionista': 'Nutrición Oncológica',
        'medicina nuclear': 'Medicina Nuclear',
        'nuclear': 'Medicina Nuclear',
        'hematologia': 'Hematología Oncológica',
        'hematología': 'Hematología Oncológica',
        'hematólogo': 'Hematología Oncológica'
      }
      
      for (const [key, value] of Object.entries(especialidades)) {
        if (mensaje.includes(key)) {
          extracted.especialidad = value
          break
        }
      }
      
      // Extraer nombre (mejorado - buscar patrones de nombres)
      const nombrePatterns = [
        /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g, // Juan Pérez
        /soy\s+([A-Z][a-z]+ [A-Z][a-z]+)/i, // soy Juan Pérez
        /mi nombre es\s+([A-Z][a-z]+ [A-Z][a-z]+)/i, // mi nombre es Juan Pérez
        /me llamo\s+([A-Z][a-z]+ [A-Z][a-z]+)/i // me llamo Juan Pérez
      ]
      
      for (const pattern of nombrePatterns) {
        const match = userMessage.match(pattern)
        if (match) {
          extracted.nombre = match[1] || match[0]
          break
        }
      }
      
      // Extraer teléfono (mejorado para manejar espacios)
      const telefonoPatterns = [
        /(\+51\s*9\d{2}\s*\d{3}\s*\d{3})/g, // +51 9 12 3 45 67
        /(\+51\s*9\d{8})/g, // +51912345678
        /(9\d{2}\s*\d{3}\s*\d{3})/g, // 9 12 3 45 67
        /(9\d{8})/g // 912345678
      ]
      
      for (const pattern of telefonoPatterns) {
        const match = userMessage.match(pattern)
        if (match) {
          // Limpiar espacios y formatear
          const telefonoLimpio = match[0].replace(/\s/g, '')
          extracted.telefono = telefonoLimpio.startsWith('+51') ? telefonoLimpio : `+51${telefonoLimpio}`
          break
        }
      }
      
      // Extraer correo (mejorado para validar formato)
      const emailPatterns = [
        /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, // Formato válido
        /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]*\.[a-zA-Z]{2,}/g // Formato con dominio incompleto
      ]
      
      for (const pattern of emailPatterns) {
        const match = userMessage.match(pattern)
        if (match) {
          const email = match[0]
          // Validar que el dominio tenga al menos un carácter antes del punto
          if (email.includes('@') && email.split('@')[1].includes('.') && email.split('@')[1].split('.')[0].length > 0) {
            extracted.correo = email
            break
          }
        }
      }
      
      // Extraer documento (mejorado)
      const documentoPatterns = [
        /(DNI|CE|Pasaporte)\s*[\d\w]+/gi, // DNI 12345678
        /mi\s+(DNI|CE|Pasaporte)\s+es\s+([\d\w]+)/i, // mi DNI es 12345678
        /(DNI|CE|Pasaporte)\s*:?\s*([\d\w]+)/i // DNI: 12345678
      ]
      
      for (const pattern of documentoPatterns) {
        const match = userMessage.match(pattern)
        if (match) {
          if (match[2]) {
            extracted.documento = `${match[1]} ${match[2]}`
          } else {
            extracted.documento = match[0]
          }
          break
        }
      }
      
      return extracted
    },
    
    // Métodos para agendamiento de citas
    async handleAppointmentScheduling(userMessage) {
      if (!this.isSchedulingAppointment) {
        // Detectar si el usuario quiere agendar una cita
        const appointmentKeywords = [
          'agendar', 'cita', 'cita médica', 'consulta', 'turno', 'hora médica',
          'quiero una cita', 'necesito una cita', 'me gustaría agendar',
          'reservar cita', 'programar cita', 'hacer una cita',
          'cita con el doctor', 'cita con el médico', 'ver al doctor',
          'consulta médica', 'revisión médica', 'chequeo médico'
        ]
        const wantsAppointment = appointmentKeywords.some(keyword => 
          userMessage.toLowerCase().includes(keyword)
        )
        
        if (wantsAppointment) {
          this.isSchedulingAppointment = true
          
          // Extraer información del mensaje inicial
          const extractedData = await this.extractInitialData(userMessage)
          
          // Verificar si ya tenemos datos del paciente en la sesión
          if (this.sessionMemory.hasPatientData) {
            this.currentStep = 'usar_datos_existentes'
            return `Veo que ya tienes datos guardados en esta sesión:\n\n` +
                   `Nombre: ${this.sessionMemory.patientData.nombre}\n` +
                   `Documento: ${this.sessionMemory.patientData.tipo_documento} ${this.sessionMemory.patientData.numero_documento}\n` +
                   `Teléfono: ${this.sessionMemory.patientData.telefono}\n` +
                   `Correo: ${this.sessionMemory.patientData.correo}\n\n` +
                   `¿Quieres usar estos mismos datos para la nueva cita? (responde sí o no)`
          } else {
            // Usar datos extraídos del mensaje inicial
            if (extractedData.nombre) {
              this.appointmentData.nombre = extractedData.nombre
            }
            if (extractedData.especialidad) {
              this.appointmentData.especialidad = extractedData.especialidad
            }
            if (extractedData.medico) {
              this.appointmentData.medico_solicitado = extractedData.medico
            }
            
            // Determinar el siguiente paso basado en los datos extraídos
            if (extractedData.nombre) {
              this.currentStep = 'documento'
              let response = `Perfecto, te ayudo a agendar tu cita`
              if (extractedData.medico) {
                response += ` con ${extractedData.medico}`
              } else if (extractedData.especialidad) {
                response += ` para ${extractedData.especialidad}`
              }
              response += `. Veo que tu nombre es ${extractedData.nombre}. ¿Cuál es tu tipo de documento y número? (DNI, Carnet de Extranjería, Pasaporte, etc.)`
              return response
          } else {
            this.currentStep = 'nombre'
              let response = 'Perfecto, te ayudo a agendar tu cita'
              if (extractedData.medico) {
                response += ` con ${extractedData.medico}`
              } else if (extractedData.especialidad) {
                response += ` para ${extractedData.especialidad}`
              }
              response += '. ¿Cuál es tu nombre completo?'
              return response
            }
          }
        }
        return null
      }
      
      // Validar que estamos en un estado válido de agendamiento
      if (!this.isSchedulingAppointment || !this.currentStep) {
        console.warn('Estado inválido de agendamiento, reiniciando...')
        this.isSchedulingAppointment = true
        this.currentStep = 'nombre'
        return 'Parece que hubo un problema con el flujo de agendamiento. Empecemos de nuevo. ¿Cuál es tu nombre completo?'
      }
      
      // Procesar el paso actual del agendamiento
      return await this.processAppointmentStep(userMessage)
    },
    
    async processAppointmentStep(userMessage) {
      console.log(`🔄 Procesando paso: ${this.currentStep} con mensaje: "${userMessage}"`)
      console.log('📊 Estado actual:', {
        isSchedulingAppointment: this.isSchedulingAppointment,
        currentStep: this.currentStep,
        appointmentData: this.appointmentData
      })
      
      switch (this.currentStep) {
        case 'usar_datos_existentes':
          if (userMessage.toLowerCase().includes('sí') || userMessage.toLowerCase().includes('si') || userMessage.toLowerCase().includes('correcto') || userMessage.toLowerCase().includes('ok')) {
            // Usar datos existentes
            this.appointmentData.nombre = this.sessionMemory.patientData.nombre
            this.appointmentData.tipo_documento = this.sessionMemory.patientData.tipo_documento
            this.appointmentData.numero_documento = this.sessionMemory.patientData.numero_documento
            this.appointmentData.telefono = this.sessionMemory.patientData.telefono
            this.appointmentData.correo = this.sessionMemory.patientData.correo
            
            // Ir directo a especialidad
              this.currentStep = 'especialidad'
            const especialidadesGuardados = await this.obtenerEspecialidades()
            return `Perfecto, usaré tus datos guardados. ¿Qué especialidad necesitas?\n\n${this.formatearEspecialidades(especialidadesGuardados)}`
          } else {
            // No usar datos existentes, empezar desde cero
            this.currentStep = 'nombre'
            return 'Entendido, vamos a recopilar tus datos nuevamente. ¿Cuál es tu nombre completo?'
          }
          
        case 'nombre':
          this.appointmentData.nombre = userMessage
          this.currentStep = 'documento'
          return '¿Cuál es tu tipo de documento y número? (DNI, Carnet de Extranjería, Pasaporte, etc.)'
          
        case 'documento':
          // Usar IA para validar documento
          const documentoValidado = await this.validarDocumentoConIA(userMessage)
          if (documentoValidado.error) {
            return documentoValidado.error
          }
          this.appointmentData.tipo_documento = documentoValidado.tipo
          this.appointmentData.numero_documento = documentoValidado.numero
          this.currentStep = 'contacto'
          return '¿Cuál es tu número de teléfono y correo electrónico?'
          
        case 'contacto':
          // Detectar si es una pregunta sobre servicios
          if (this.esPreguntaServicios(userMessage)) {
            return this.responderPreguntaServicios(userMessage)
          }
          
          // Procesar datos de contacto (pueden ser parciales)
          const resultadoContacto = await this.procesarContactoParcial(userMessage)
          if (resultadoContacto.error) {
            return resultadoContacto.error
          }
          if (resultadoContacto.telefono) {
            this.appointmentData.telefono = resultadoContacto.telefono
          }
          if (resultadoContacto.correo) {
            this.appointmentData.correo = resultadoContacto.correo
          }
          
          // Verificar si tenemos ambos datos
          if (this.appointmentData.telefono && this.appointmentData.correo) {
          this.currentStep = 'validar_paciente'
          return await this.validarPaciente()
          } else {
            // Pedir el dato que falta
            if (!this.appointmentData.telefono) {
              return 'Perfecto, he guardado tu correo. ¿Cuál es tu número de teléfono?'
            } else {
              return 'Perfecto, he guardado tu teléfono. ¿Cuál es tu correo electrónico?'
            }
          }
          
        case 'especialidad':
          // Verificar si el usuario envió un número
          const numeroEspecialidad = parseInt(userMessage)
          if (!isNaN(numeroEspecialidad)) {
            // El usuario seleccionó por número
            const especialidades = await this.obtenerEspecialidades()
            if (numeroEspecialidad >= 1 && numeroEspecialidad <= especialidades.length) {
              this.appointmentData.especialidad = especialidades[numeroEspecialidad - 1].nombre
              console.log('Especialidad seleccionada por número:', numeroEspecialidad, '->', this.appointmentData.especialidad)
            } else {
              const especialidadesError = await this.obtenerEspecialidades()
              return `Por favor, selecciona un número válido del 1 al ${especialidades.length}:\n\n${this.formatearEspecialidades(especialidadesError)}`
            }
          } else {
            // El usuario escribió el nombre de la especialidad
            this.appointmentData.especialidad = userMessage
            console.log('Especialidad guardada por nombre:', this.appointmentData.especialidad)
          }
          
          // Buscar médicos para esta especialidad
          try {
            const response = await axios.get(`/api/chatbot/medicos/${encodeURIComponent(this.appointmentData.especialidad)}`)
            const medicos = response.data
            
            if (!medicos || medicos.length === 0) {
              this.currentStep = 'especialidad'
              const especialidadesError = await this.obtenerEspecialidades()
              return `Lo siento, no hay médicos disponibles para esa especialidad en este momento. ¿Podrías elegir otra especialidad?\n\n${this.formatearEspecialidades(especialidadesError)}`
            }
            
            // Si hay un médico específico solicitado, verificar si está disponible
            if (this.appointmentData.medico_solicitado) {
              const medicoEncontrado = medicos.find(medico => 
                medico.nombre.toLowerCase().includes(this.appointmentData.medico_solicitado.toLowerCase())
              )
              
              if (medicoEncontrado) {
                this.appointmentData.medico_id = medicoEncontrado.id
                this.appointmentData.medico_nombre = medicoEncontrado.nombre
          this.currentStep = 'fecha_cita'
                return `Perfecto, he encontrado a ${medicoEncontrado.nombre} para ${this.appointmentData.especialidad}. ¿Para cuándo te gustaría la cita?`
              }
            }
            
            // Si hay múltiples médicos, permitir selección
            if (medicos.length > 1) {
              this.currentStep = 'seleccionar_medico'
              this.appointmentData.medicos_disponibles = medicos
              let response = `Tenemos ${medicos.length} médicos disponibles para ${this.appointmentData.especialidad}:\n\n`
              medicos.forEach((medico, index) => {
                response += `${index + 1}. ${medico.nombre}\n`
              })
              response += '\n¿Con cuál te gustaría agendar? (responde el número)'
              return response
            } else {
              // Solo hay un médico, asignarlo automáticamente
              this.appointmentData.medico_id = medicos[0].id
              this.appointmentData.medico_nombre = medicos[0].nombre
              this.currentStep = 'fecha_cita'
              return `Perfecto, te asignaré con ${medicos[0].nombre} para ${this.appointmentData.especialidad}. ¿Para cuándo te gustaría la cita?`
            }
          } catch (error) {
            console.error('Error obteniendo médicos:', error)
            this.currentStep = 'especialidad'
            const especialidadesErrorMedicos = await this.obtenerEspecialidades()
            return `Error obteniendo médicos. ¿Podrías elegir otra especialidad?\n\n${this.formatearEspecialidades(especialidadesErrorMedicos)}`
          }
          
        case 'seleccionar_medico':
          const numeroSeleccionado = parseInt(userMessage)
          if (isNaN(numeroSeleccionado) || numeroSeleccionado < 1 || numeroSeleccionado > this.appointmentData.medicos_disponibles.length) {
            return 'Por favor, selecciona un número válido de la lista.'
          }
          
          const medicoSeleccionado = this.appointmentData.medicos_disponibles[numeroSeleccionado - 1]
          this.appointmentData.medico_id = medicoSeleccionado.id
          this.appointmentData.medico_nombre = medicoSeleccionado.nombre
          this.currentStep = 'fecha_cita'
          return `Perfecto, te asignaré con ${medicoSeleccionado.nombre}. ¿Para cuándo te gustaría la cita?`
          
        case 'fecha_cita':
          // Usar IA para interpretar fecha de cita
          const fechaCitaValidada = await this.validarFechaCitaConIA(userMessage)
          if (fechaCitaValidada.error) {
            return fechaCitaValidada.error
          }
          this.appointmentData.fecha = fechaCitaValidada.fecha
          this.currentStep = 'confirmar_fecha'
          return `Perfecto, he entendido que quieres la cita para el ${fechaCitaValidada.fecha.split('-').reverse().join('/')}. ¿Es correcta esta fecha? (responde sí o no)`
          
        case 'confirmar_fecha':
          if (userMessage.toLowerCase().includes('sí') || userMessage.toLowerCase().includes('si') || userMessage.toLowerCase().includes('correcto') || userMessage.toLowerCase().includes('ok')) {
            // Asignar horario automáticamente (cada 15 minutos)
            console.log('🕐 ANTES de llamar asignarHorarioAutomatico')
            this.appointmentData.hora = await this.asignarHorarioAutomatico()
            this.appointmentData.hora_automatica = true // Marcar que fue asignada automáticamente
            console.log('🕐 DESPUÉS de llamar asignarHorarioAutomatico, hora asignada:', this.appointmentData.hora)
            this.currentStep = 'motivo'
            return `Perfecto, tu cita está programada para las ${this.appointmentData.hora}. ¿Cuál es el motivo de tu consulta?`
          } else {
            this.currentStep = 'fecha_cita'
            return 'Entendido, vamos a corregir la fecha. ¿Para cuándo te gustaría la cita?'
          }
          
        case 'hora':
          console.log('🕐 Procesando corrección de hora:', userMessage)
          // Procesar la hora proporcionada por el usuario
          const horaProcesada = this.procesarHoraUsuario(userMessage)
          console.log('🕐 Resultado procesamiento hora:', horaProcesada)
          if (horaProcesada.error) {
            return horaProcesada.error
          }
          this.appointmentData.hora = horaProcesada.hora
          this.appointmentData.hora_automatica = false // Marcar que fue proporcionada manualmente
          this.currentStep = 'confirmacion'
          return this.generarResumenCita()
          
        case 'motivo':
          this.appointmentData.motivo = userMessage
          this.currentStep = 'confirmacion'
          return this.generarResumenCita()
          
        case 'confirmacion':
          if (userMessage.toLowerCase().includes('sí') || userMessage.toLowerCase().includes('si') || userMessage.toLowerCase().includes('correcto') || userMessage.toLowerCase().includes('ok')) {
            return await this.confirmarCita()
          } else {
            // Permitir corrección específica
            const correccion = await this.detectarCorreccion(userMessage)
            if (correccion.campo) {
              this.currentStep = correccion.campo
              return correccion.mensaje
          } else {
              // Si no se puede detectar, preguntar qué corregir
              this.currentStep = 'que_corregir'
              return '¿Qué dato quieres corregir?\n\n• Nombre\n• Documento\n• Teléfono y correo\n• Especialidad\n• Fecha de cita\n• Hora\n• Motivo'
            }
          }
          
        case 'que_corregir':
          const correccion = await this.detectarCorreccion(userMessage)
          if (correccion.campo) {
            this.currentStep = correccion.campo
            return correccion.mensaje
          } else {
            return 'No entendí qué quieres corregir. Por favor, especifica: Nombre, Documento, Teléfono, Especialidad, Fecha de cita, Hora, o Motivo.'
          }
          
        default:
          return 'Disculpa, hubo un error. ¿Podrías repetir tu respuesta?'
      }
    },
    
    async validarPaciente() {
      try {
        const response = await axios.post('/api/chatbot/validar-paciente', {
          tipo_documento: this.appointmentData.tipo_documento,
          numero_documento: this.appointmentData.numero_documento,
          nombre: this.appointmentData.nombre,
          telefono: this.appointmentData.telefono,
          correo: this.appointmentData.correo
        })
        
        const resultado = response.data
        
        switch (resultado.tipo) {
          case 'paciente_nuevo':
            this.currentStep = 'especialidad'
            const especialidadesNuevo = await this.obtenerEspecialidades()
            return `Perfecto, eres un paciente nuevo. ¿Qué especialidad necesitas?\n\n${this.formatearEspecialidades(especialidadesNuevo)}`
            
          case 'paciente_existente':
            this.pacienteValidado = resultado.paciente
            this.currentStep = 'especialidad'
            const especialidadesExistente = await this.obtenerEspecialidades()
            return `¡Hola ${resultado.paciente.nombre}! Te he encontrado en nuestro sistema. ¿Qué especialidad necesitas?\n\n${this.formatearEspecialidades(especialidadesExistente)}`
            
          case 'paciente_inactivo':
            this.pacienteValidado = resultado.paciente
            this.currentStep = 'reactivar'
            return 'Te he encontrado en nuestro sistema pero tu cuenta está inactiva. ¿Deseas reactivarla? (responde sí o no)'
            
          case 'datos_diferentes':
            this.pacienteValidado = resultado.paciente
            this.currentStep = 'actualizar'
            return `Te he encontrado en nuestro sistema pero algunos datos son diferentes: ${resultado.diferencias.join(', ')}. ¿Deseas actualizar tu información? (responde sí o no)`
            
          default:
            return 'Error en la validación. Por favor, intenta nuevamente.'
        }
      } catch (error) {
        console.error('Error validando paciente:', error)
        return 'Error en la validación. Por favor, intenta nuevamente.'
      }
    },
    
    // Nuevos métodos de validación con IA
    async validarDocumentoConIA(userMessage) {
      try {
        console.log('Validando documento:', userMessage)
        
        const response = await axios.post('/api/chat', {
          message: `Valida este documento de identidad: "${userMessage}". 

INSTRUCCIONES:
- Si dice "DNI" o solo números de 8-9 dígitos, es DNI
- Si dice "CE", "carnet", "carne" o "Carnet de Extranjería", es CE
- Si dice "Pasaporte", es Pasaporte
- Para CE, si no tiene letra al inicio, agrega "A" al número
- Para DNI, acepta números de 8 o 9 dígitos
- Para CE, acepta formato A12345678 o similar
- Para Pasaporte, acepta cualquier combinación de letras y números

Responde SOLO con JSON válido en este formato exacto: 
{"tipo": "DNI", "numero": "12345678", "error": null} 
o 
{"tipo": null, "numero": null, "error": "mensaje de error"}

Tipos válidos: DNI, CE, Pasaporte. NO incluyas texto adicional, solo el JSON.`,
          conversationHistory: []
        })
        
        const botResponse = response.data.response
        console.log('Respuesta de IA:', botResponse)
        
        try {
          // Buscar JSON en la respuesta
          const jsonMatch = botResponse.match(/\{[^{}]*\}/)
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0])
            console.log('JSON parseado:', parsed)
            
            if (parsed.error) {
              return { error: parsed.error }
            }
            
            if (parsed.tipo && parsed.numero) {
              return { tipo: parsed.tipo, numero: parsed.numero }
            } else {
              return { error: 'Faltan tipo o número de documento en la respuesta' }
            }
          }
        } catch (e) {
          console.error('Error parsing JSON:', e)
          console.error('Respuesta que causó error:', botResponse)
        }
        
        // Si la IA no pudo procesar, devolver error
        console.log('La IA no pudo procesar el documento, usando fallback')
        
        return { error: 'No pude entender el formato del documento. Por favor, especifica el tipo (DNI, CE, Pasaporte) y el número.' }
      } catch (error) {
        console.error('Error validando documento:', error)
        // NO resetear datos, solo devolver error para permitir corrección
        return { error: 'Error al validar el documento. Por favor, intenta de nuevo con el formato: "DNI 12345678" o "CE A12345678".' }
      }
    },
    
    async procesarContactoParcial(userMessage) {
      try {
        console.log('Procesando contacto parcial:', userMessage)
        
        // Primero intentar extraer manualmente (mejorado para espacios)
        const telefonoPatterns = [
          /(\+51\s*9\d{2}\s*\d{3}\s*\d{3})/g, // +51 9 12 3 45 67
          /(\+51\s*9\d{8})/g, // +51912345678
          /(9\d{2}\s*\d{3}\s*\d{3})/g, // 9 12 3 45 67
          /(9\d{8})/g // 912345678
        ]
        
        const emailPatterns = [
          /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, // Formato válido estándar
          /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]*\.[a-zA-Z]{2,}/g, // Formato con dominio incompleto
          /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+/g // Formato más flexible (sin validación estricta de dominio)
        ]
        
        let telefono = null
        let correo = null
        
        // Extraer teléfono
        for (const pattern of telefonoPatterns) {
          const match = userMessage.match(pattern)
          if (match) {
            const telefonoLimpio = match[0].replace(/\s/g, '')
            telefono = telefonoLimpio.startsWith('+51') ? telefonoLimpio : `+51${telefonoLimpio}`
            break
          }
        }
        
        // Extraer correo con validación más flexible
        for (const pattern of emailPatterns) {
          const match = userMessage.match(pattern)
          if (match) {
            const email = match[0].toLowerCase()
            
            // Validación básica: debe tener @ y al menos un carácter después
            if (email.includes('@')) {
              const [usuario, dominio] = email.split('@')
              
              // Validar que el usuario no esté vacío
              if (usuario && usuario.length > 0) {
                // Si tiene punto, validar que el dominio tenga contenido antes y después del punto
                if (dominio.includes('.')) {
                  const [dominioBase, extension] = dominio.split('.')
                  if (dominioBase && dominioBase.length > 0 && extension && extension.length > 0) {
                    correo = email
                    break
                  }
                } else {
                  // Si no tiene punto, aceptarlo de todas formas (ej: jose@jose.com -> jose@jose)
                  if (dominio && dominio.length > 0) {
                    correo = email
                    break
                  }
                }
              }
            }
          }
        }
        
        // Si tenemos al menos uno, devolverlo
        if (telefono || correo) {
          return { telefono: telefono, correo: correo }
        }
        
        // Si no encontramos nada, usar IA para interpretar
        const response = await axios.post('/api/chat', {
          message: `Extrae teléfono y/o correo de: "${userMessage}". Responde SOLO con JSON válido en este formato exacto: {"telefono": "+51987654321", "correo": "ejemplo@email.com", "error": null} o {"telefono": null, "correo": "ejemplo@email.com", "error": null}. Puede tener solo teléfono, solo correo, o ambos. Teléfono debe ser formato peruano (+51 9XXXXXXXX). NO incluyas texto adicional, solo el JSON.`,
          conversationHistory: []
        })
        
        const botResponse = response.data.response
        console.log('Respuesta de IA para contacto:', botResponse)
        
        try {
          // Buscar JSON en la respuesta
          const jsonMatch = botResponse.match(/\{[^{}]*\}/)
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0])
            console.log('JSON parseado para contacto:', parsed)
            
            if (parsed.error) {
              return { error: parsed.error }
            }
            
            return { 
              telefono: parsed.telefono || null, 
              correo: parsed.correo || null 
            }
          }
        } catch (e) {
          console.error('Error parsing JSON de contacto:', e)
          console.error('Respuesta que causó error:', botResponse)
        }
        
        return { error: 'No pude entender el teléfono o correo. Por favor, proporciona al menos uno de los dos datos.' }
      } catch (error) {
        console.error('Error procesando contacto:', error)
        return { error: 'Error al procesar el contacto. Por favor, intenta de nuevo.' }
      }
    },
    
    async validarContactoConIA(userMessage) {
      try {
        console.log('Validando contacto:', userMessage)
        
        const response = await axios.post('/api/chat', {
          message: `Extrae y valida teléfono y correo de: "${userMessage}". Responde SOLO con JSON válido en este formato exacto: {"telefono": "+51987654321", "correo": "ejemplo@email.com", "error": null} o {"telefono": null, "correo": null, "error": "mensaje de error"}. Teléfono debe ser formato peruano (+51 9XXXXXXXX). NO incluyas texto adicional, solo el JSON.`,
          conversationHistory: []
        })
        
        const botResponse = response.data.response
        console.log('Respuesta de IA:', botResponse)
        
        try {
          // Buscar JSON en la respuesta
          const jsonMatch = botResponse.match(/\{[^{}]*\}/)
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0])
            console.log('JSON parseado:', parsed)
            
            if (parsed.error) {
              return { error: parsed.error }
            }
            
            if (parsed.telefono && parsed.correo) {
              return { telefono: parsed.telefono, correo: parsed.correo }
            } else {
              return { error: 'Faltan teléfono o correo en la respuesta' }
            }
          }
        } catch (e) {
          console.error('Error parsing JSON:', e)
          console.error('Respuesta que causó error:', botResponse)
        }
        
        // Fallback: intentar extraer manualmente
        const telefonoMatch = userMessage.match(/(\+51\s*9\d{8}|\d{9})/)
        const emailMatch = userMessage.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)
        
        if (telefonoMatch && emailMatch) {
          const telefono = telefonoMatch[0].startsWith('+51') ? telefonoMatch[0] : `+51${telefonoMatch[0]}`
          return { telefono: telefono, correo: emailMatch[0] }
        }
        
        return { error: 'No pude extraer teléfono y correo válidos. Por favor, proporciona ambos datos claramente.' }
      } catch (error) {
        console.error('Error validando contacto:', error)
        return { error: 'Error al validar el contacto. Por favor, intenta de nuevo.' }
      }
    },
    
    
    async validarFechaCitaConIA(userMessage) {
      try {
        console.log('Validando fecha de cita:', userMessage)
        
        // Usar el nuevo endpoint específico para validación de fechas
        const response = await axios.post('/api/chatbot/validar-fecha', {
          mensaje: userMessage
        })
        
        console.log('🤖 Respuesta del endpoint de fecha:', response.data)
        
        // El endpoint ya devuelve el formato correcto
        if (response.data.error) {
          return { error: response.data.error }
        }
        
        if (response.data.fecha) {
          return { fecha: response.data.fecha }
        }
        
        // Si no hay fecha ni error, usar fallback manual
        return this.interpretarFechaManual(userMessage)
      } catch (error) {
        console.error('Error en validación de fecha con IA:', error)
        return this.interpretarFechaManual(userMessage)
      }
    },

    // Interpretación manual de fechas (Fallback robusto)
    interpretarFechaManual(userMessage) {
      const mensaje = userMessage.toLowerCase().trim()
      
      // Manejar "pasado mañana" primero (prioridad alta)
      if (mensaje.includes('pasado mañana')) {
        const pasadoMañana = new Date()
        pasadoMañana.setDate(pasadoMañana.getDate() + 2)
        const fechaFormateada = pasadoMañana.toISOString().split('T')[0]
        return { fecha: fechaFormateada }
      }
      
      // Manejar "mañana"
      if (mensaje.includes('mañana')) {
        const mañana = new Date()
        mañana.setDate(mañana.getDate() + 1)
        const fechaFormateada = mañana.toISOString().split('T')[0]
        return { fecha: fechaFormateada }
      }
      
      // Manejar días de la semana con lógica mejorada
      const diasSemana = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo']
      const diaEncontrado = diasSemana.find(dia => mensaje.includes(dia))
      
      if (diaEncontrado) {
              const hoy = new Date()
        const diaActual = hoy.getDay() // 0 = domingo, 1 = lunes, ..., 6 = sábado
        const indiceDia = diasSemana.indexOf(diaEncontrado)
        const indiceDiaJS = indiceDia === 6 ? 0 : indiceDia + 1 // Convertir a formato JS (domingo = 0)
        
        // Calcular días hasta el día solicitado
        let diasHastaDia = indiceDiaJS - diaActual
        
        // Si es "que viene" o "próximo", siempre ir a la próxima semana
        if (mensaje.includes('que viene') || mensaje.includes('próximo')) {
          if (diasHastaDia <= 0) {
            diasHastaDia += 7 // Si ya pasó esta semana, ir a la próxima
          } else {
            diasHastaDia += 7 // Siempre ir a la próxima semana para "que viene" o "próximo"
          }
        } else {
          // Para expresiones normales ("para el miércoles", "miércoles", etc.)
          if (diasHastaDia <= 0) {
            diasHastaDia += 7 // Si ya pasó esta semana, ir a la próxima
          }
        }
        
        const fechaDeseada = new Date()
        fechaDeseada.setDate(hoy.getDate() + diasHastaDia)
        const fechaFormateada = fechaDeseada.toISOString().split('T')[0]
        
        return { fecha: fechaFormateada }
      }
      
      // Si no se encontró un día de la semana
        return { error: 'No pude entender la fecha. Por favor, especifica para cuándo quieres la cita de forma más clara.' }
    },
    
    async validarHoraConIA(userMessage) {
      try {
        const response = await axios.post('/api/chat', {
          message: `Convierte esta hora a formato HH:MM en horario de 24h: "${userMessage}". Responde solo con JSON: {"hora": "09:30", "error": null} o {"hora": null, "error": "mensaje de error"}. Valida que esté entre 8:00 y 18:00.`,
          conversationHistory: []
        })
        
        const botResponse = response.data.response
        try {
          const jsonMatch = botResponse.match(/\{.*\}/)
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0])
            if (parsed.error) {
              return { error: parsed.error }
            }
            return { hora: parsed.hora }
          }
        } catch (e) {
          console.error('Error parsing JSON:', e)
        }
        
        return { error: 'No pude entender la hora. Por favor, especifica a qué hora prefieres la cita.' }
      } catch (error) {
        console.error('Error validando hora:', error)
        return { error: 'Error al validar la hora. Por favor, intenta de nuevo.' }
      }
    },
    
    generarResumenCita() {
      const especialidades = {
        'Oncología Médica': 'Oncología Médica',
        'Radioterapia': 'Radioterapia',
        'Cirugía Oncológica': 'Cirugía Oncológica',
        'Psicología Oncológica': 'Psicología Oncológica',
        'Nutrición Oncológica': 'Nutrición Oncológica',
        'Medicina Nuclear': 'Medicina Nuclear',
        'Hematología Oncológica': 'Hematología Oncológica'
      }
      
      const especialidadNombre = especialidades[this.appointmentData.especialidad] || this.appointmentData.especialidad
      
      return `Resumen de tu cita:\n\n` +
             `Paciente: ${this.appointmentData.nombre}\n` +
             `Documento: ${this.appointmentData.tipo_documento} ${this.appointmentData.numero_documento}\n` +
             `Teléfono: ${this.appointmentData.telefono}\n` +
             `Correo: ${this.appointmentData.correo}\n` +
             `Médico: ${this.appointmentData.medico_nombre}\n` +
             `Especialidad: ${especialidadNombre}\n` +
             `Fecha: ${this.appointmentData.fecha.split('-').reverse().join('/')}\n` +
             `Hora: ${this.appointmentData.hora}\n` +
             `Motivo: ${this.appointmentData.motivo || 'No especificado'}\n\n` +
             `¿Estos datos son correctos? (responde sí o no)`
    },
    
    // Asignar horario automáticamente basado en la última cita + 20 minutos
    async asignarHorarioAutomatico() {
      try {
        console.log('🕐 INICIANDO asignarHorarioAutomatico')
        console.log('🕐 Asignando horario automático para médico:', this.appointmentData.medico_id, 'fecha:', this.appointmentData.fecha)
        
        // Obtener todas las citas del médico en esa fecha
        const response = await axios.post('/api/chatbot/obtener-citas-medico', {
          fecha: this.appointmentData.fecha,
          medico_id: this.appointmentData.medico_id
        })
        
        const citasExistentes = response.data.citas_existentes || []
        console.log('🕐 Citas existentes encontradas:', citasExistentes.length, citasExistentes)
        
        if (citasExistentes.length === 0) {
          // Si no hay citas para ese médico en esa fecha, asignar la primera hora
          console.log('🕐 No hay citas existentes, asignando 08:00')
          return '08:00'
        }
        
        // Encontrar la última cita del día (ordenadas por fecha ASC)
        const ultimaCita = citasExistentes[citasExistentes.length - 1]
        console.log('🕐 Última cita encontrada:', ultimaCita)
        
        // Extraer la hora de la fecha
        const fechaCompleta = new Date(ultimaCita.fecha)
        const hora = fechaCompleta.getHours()
        const minuto = fechaCompleta.getMinutes()
        
        console.log('🕐 Fecha completa de la cita:', ultimaCita.fecha)
        console.log('🕐 Fecha parseada:', fechaCompleta)
        console.log('🕐 Hora de última cita:', hora + ':' + minuto.toString().padStart(2, '0'))
        console.log('🕐 Zona horaria offset:', fechaCompleta.getTimezoneOffset())
        
        // Calcular la siguiente hora (última hora + 20 minutos)
        const totalMinutos = hora * 60 + minuto + 20
        
        console.log('🕐 Cálculo: hora original =', hora, 'minuto original =', minuto)
        console.log('🕐 Total minutos después de +20:', totalMinutos)
        
        // Verificar que no exceda el horario de atención (6:00 PM = 18:00)
        if (totalMinutos >= 18 * 60) {
          console.log('🕐 Excede horario de atención, asignando 08:00')
          return '08:00'
        }
        
        const nuevaHora = Math.floor(totalMinutos / 60)
        const nuevoMinuto = totalMinutos % 60
        
        console.log('🕐 Nueva hora calculada:', nuevaHora, 'nuevo minuto:', nuevoMinuto)
        
        // NO redondear - usar exactamente 20 minutos después
        const horaFinal = nuevaHora
        const minutoFinal = nuevoMinuto
        
        console.log('🕐 Hora final (sin redondeo):', horaFinal, ':', minutoFinal)
        
        // Verificar que no exceda el horario de atención
        if (horaFinal >= 18) {
          console.log('🕐 Hora final excede horario, asignando 08:00')
          return '08:00'
        }
        
        const horaAsignada = `${horaFinal.toString().padStart(2, '0')}:${minutoFinal.toString().padStart(2, '0')}`
        console.log('🕐 Hora asignada final:', horaAsignada)
        return horaAsignada
        
      } catch (error) {
        console.error('Error asignando horario:', error)
        return '08:00'
      }
    },
    
    // Generar horarios disponibles cada 15 minutos
    generarHorariosDisponibles() {
      const horarios = []
      for (let hora = 8; hora < 18; hora++) {
        for (let minuto = 0; minuto < 60; minuto += 15) {
          const horaStr = hora.toString().padStart(2, '0')
          const minutoStr = minuto.toString().padStart(2, '0')
          horarios.push(`${horaStr}:${minutoStr}`)
        }
      }
      return horarios
    },
    
    async detectarCorreccion(userMessage) {
      const mensaje = userMessage.toLowerCase()
      
      // Detectar correcciones específicas
      if (mensaje.includes('fecha') || mensaje.includes('próximo') || mensaje.includes('martes') || mensaje.includes('miércoles') || mensaje.includes('jueves') || mensaje.includes('viernes') || mensaje.includes('sábado') || mensaje.includes('domingo') || mensaje.includes('lunes') || mensaje.includes('agosto') || mensaje.includes('septiembre') || mensaje.includes('octubre') || mensaje.includes('noviembre') || mensaje.includes('diciembre') || mensaje.includes('enero') || mensaje.includes('febrero') || mensaje.includes('marzo') || mensaje.includes('abril') || mensaje.includes('mayo') || mensaje.includes('junio') || mensaje.includes('julio')) {
        return {
          campo: 'fecha_cita',
          mensaje: 'Entendido, vamos a corregir la fecha. ¿Para cuándo te gustaría la cita?'
        }
      }
      
      // Detectar respuestas de hora (9:00, 9am, 10:30, etc.)
      const horaRegex = /(\d{1,2}):?(\d{0,2})\s*(am|pm|AM|PM)?/
      if (horaRegex.test(mensaje) || mensaje.includes('hora') || mensaje.includes('horario') || mensaje.includes('mañana') || mensaje.includes('tarde') || mensaje.includes('noche')) {
        console.log('🕐 Detectada corrección de hora:', mensaje)
        return {
          campo: 'hora',
          mensaje: 'Entendido, vamos a corregir la hora. ¿A qué hora prefieres? (horario de atención: 8:00 AM - 6:00 PM)'
        }
      }
      
      if (mensaje.includes('nombre') || mensaje.includes('llamo')) {
        return {
          campo: 'nombre',
          mensaje: 'Entendido, vamos a corregir el nombre. ¿Cuál es tu nombre completo?'
        }
      }
      
      if (mensaje.includes('documento') || mensaje.includes('dni') || mensaje.includes('ce') || mensaje.includes('pasaporte')) {
        return {
          campo: 'documento',
          mensaje: 'Entendido, vamos a corregir el documento. ¿Cuál es tu tipo de documento y número? (DNI, Carnet de Extranjería, Pasaporte, etc.)'
        }
      }
      
      if (mensaje.includes('teléfono') || mensaje.includes('correo') || mensaje.includes('email') || mensaje.includes('contacto')) {
        return {
          campo: 'contacto',
          mensaje: 'Entendido, vamos a corregir el contacto. ¿Cuál es tu número de teléfono y correo electrónico?'
        }
      }
      
      if (mensaje.includes('especialidad') || mensaje.includes('médico') || mensaje.includes('doctor')) {
        const especialidadesCorreccion = await this.obtenerEspecialidades()
        return {
          campo: 'especialidad',
          mensaje: `Entendido, vamos a corregir la especialidad. ¿Qué especialidad necesitas?\n\n${this.formatearEspecialidades(especialidadesCorreccion)}`
        }
      }
      
      if (mensaje.includes('motivo') || mensaje.includes('consulta') || mensaje.includes('problema')) {
        return {
          campo: 'motivo',
          mensaje: 'Entendido, vamos a corregir el motivo. ¿Cuál es el motivo de tu consulta?'
        }
      }
      
      
      // Si no se detecta nada específico, usar IA para detectar
      try {
        const response = await axios.post('/api/chat', {
          message: `Detecta qué campo quiere corregir el usuario: "${userMessage}". Responde SOLO con JSON: {"campo": "fecha_cita", "mensaje": "Entendido, vamos a corregir la fecha. ¿Para cuándo te gustaría la cita?"} o {"campo": null, "mensaje": null}. Campos disponibles: nombre, documento, contacto, especialidad, fecha_cita, hora, motivo.`,
          conversationHistory: []
        })
        
        const botResponse = response.data.response
        try {
          const jsonMatch = botResponse.match(/\{[^{}]*\}/)
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0])
            if (parsed.campo && parsed.mensaje) {
              return { campo: parsed.campo, mensaje: parsed.mensaje }
            }
          }
        } catch (e) {
          console.error('Error parsing JSON de corrección:', e)
        }
      } catch (error) {
        console.error('Error detectando corrección:', error)
      }
      
      return { campo: null, mensaje: null }
    },
    
    // Obtener especialidades dinámicamente desde la base de datos
    async obtenerEspecialidades() {
      try {
        console.log('🔍 ChatBot: Obteniendo especialidades...')
        const response = await axios.get('/api/chatbot/especialidades')
        console.log('🔍 ChatBot: Response recibida:', response)
        console.log('🔍 ChatBot: Response data:', response.data)
        console.log('✅ ChatBot: Especialidades obtenidas:', response.data.length)
        return response.data
      } catch (error) {
        console.error('❌ ChatBot: Error obteniendo especialidades:', error)
        console.error('❌ ChatBot: Error response:', error.response)
        // Fallback a especialidades hardcodeadas si falla la consulta
        return [
        { id: 1, nombre: 'Oncología Médica' },
        { id: 2, nombre: 'Radiología Oncológica' },
        { id: 3, nombre: 'Ginecología Oncológica' },
        { id: 4, nombre: 'Medicina Intensiva Oncológica' },
        { id: 5, nombre: 'Patología Oncológica' },
        { id: 6, nombre: 'Cirugía Oncológica' },
        { id: 7, nombre: 'Psico-oncología' },
        { id: 8, nombre: 'Farmacia Oncológica' }
        ]
      }
    },
    
    // Formatear especialidades para mostrar en el chat
    formatearEspecialidades(especialidades) {
      console.log('🔍 ChatBot: Formateando especialidades:', especialidades)
      console.log('🔍 ChatBot: Tipo de especialidades:', typeof especialidades)
      console.log('🔍 ChatBot: Es array:', Array.isArray(especialidades))
      if (Array.isArray(especialidades)) {
        console.log('🔍 ChatBot: Longitud del array:', especialidades.length)
      }
      // Mantener el orden original y usar números para selección
      const resultado = especialidades.map((esp, index) => `${index + 1}. ${esp.nombre}`).join('\n')
      console.log('✅ ChatBot: Especialidades formateadas:', resultado)
      return resultado
    },
    
    // Procesar la hora proporcionada por el usuario
    procesarHoraUsuario(userMessage) {
      const mensaje = userMessage.toLowerCase().trim()
      
      // Detectar formatos de hora comunes
      const horaRegex = /(\d{1,2}):?(\d{0,2})?\s*(am|pm)?/
      const match = mensaje.match(horaRegex)
      console.log('🕐 Regex match para hora:', match, 'en mensaje:', mensaje)
      
      if (match) {
        let hora = parseInt(match[1])
        let minuto = match[2] ? parseInt(match[2]) : 0
        const periodo = match[3] ? match[3].toLowerCase() : null
        
        // Convertir a formato 24 horas si es necesario
        if (periodo === 'pm' && hora !== 12) {
          hora += 12
        } else if (periodo === 'am' && hora === 12) {
          hora = 0
        }
        
        // Validar rango de horarios (8:00 AM - 6:00 PM)
        if (hora < 8 || hora > 18) {
          return { error: 'El horario debe estar entre 8:00 AM y 6:00 PM' }
        }
        
        // Redondear a los 15 minutos más cercanos
        if (minuto % 15 !== 0) {
          minuto = Math.round(minuto / 15) * 15
          if (minuto === 60) {
            hora += 1
            minuto = 0
          }
        }
        
        // Formatear la hora
        const horaStr = hora.toString().padStart(2, '0')
        const minutoStr = minuto.toString().padStart(2, '0')
        const horaFormateada = `${horaStr}:${minutoStr}`
        
        return { hora: horaFormateada }
      }
      
      // Detectar palabras clave de tiempo
      if (mensaje.includes('mañana') || mensaje.includes('temprano')) {
        return { hora: '08:00' }
      } else if (mensaje.includes('tarde')) {
        return { hora: '14:00' }
      } else if (mensaje.includes('noche')) {
        return { hora: '17:00' }
      }
      
      return { error: 'No pude entender la hora. Por favor, especifica la hora en formato 24 horas (ej: 9:00, 14:30) o 12 horas (ej: 9am, 2pm)' }
    },
    
    async confirmarCita() {
      console.log('Procediendo a crear cita con especialidad:', this.appointmentData.especialidad)
      
      // Guardar datos en la memoria de sesión
      this.savePatientDataToSession()
      
      // Proceder directamente a crear la cita
      return await this.crearCita()
    },
    
    async crearCita() {
      try {
        console.log('Buscando médicos para especialidad:', this.appointmentData.especialidad)
        console.log('Datos completos de la cita:', this.appointmentData)
        
        // Validar que todos los datos requeridos estén presentes
        const datosRequeridos = [
          'nombre', 'tipo_documento', 'numero_documento', 'telefono', 'correo',
          'especialidad', 'fecha', 'hora', 'motivo'
        ]
        
        const datosFaltantes = datosRequeridos.filter(campo => !this.appointmentData[campo])
        
        if (datosFaltantes.length > 0) {
          console.error('Datos faltantes:', datosFaltantes)
          this.currentStep = 'confirmacion'
          return `Faltan algunos datos requeridos: ${datosFaltantes.join(', ')}. Por favor, completa todos los campos.`
        }
        
        // Usar el médico ya seleccionado
        if (!this.appointmentData.medico_id) {
          this.currentStep = 'especialidad'
          return 'Error: No se ha seleccionado un médico. Por favor, elige una especialidad nuevamente.'
        }
        
        const medico = {
          id: this.appointmentData.medico_id,
          nombre: this.appointmentData.medico_nombre
        }
        
        // Verificar disponibilidad solo si la hora NO fue asignada automáticamente
        // Si fue asignada automáticamente, ya se consideraron las citas existentes
        if (!this.appointmentData.hora_automatica) {
        const disponibilidadResponse = await axios.post('/api/chatbot/verificar-disponibilidad', {
          fecha: this.appointmentData.fecha,
          hora: this.appointmentData.hora,
          medico_id: medico.id
        })
        
        if (!disponibilidadResponse.data.disponible) {
            // NO resetear datos, solo cambiar paso para permitir corrección
            this.currentStep = 'fecha_cita'
            return 'Lo siento, ese horario no está disponible. ¿Podrías seleccionar otra fecha u hora?'
          }
        }
        
        // Validar o crear paciente
        let pacienteId = this.pacienteValidado ? this.pacienteValidado.id : null
        
        if (!pacienteId) {
          // Primero intentar validar si el paciente ya existe
          try {
            const validacionResponse = await axios.post('/api/chatbot/validar-paciente', {
              tipo_documento: this.appointmentData.tipo_documento,
              numero_documento: this.appointmentData.numero_documento,
              nombre: this.appointmentData.nombre,
              telefono: this.appointmentData.telefono,
              correo: this.appointmentData.correo
            })
            
            const resultado = validacionResponse.data
            
            if (resultado.tipo === 'paciente_existente' || resultado.tipo === 'paciente_inactivo' || resultado.tipo === 'datos_diferentes') {
              // Usar el paciente existente
              pacienteId = resultado.paciente.id
              this.pacienteValidado = resultado.paciente
              console.log('✅ Usando paciente existente:', resultado.paciente)
            } else {
          // Crear paciente nuevo
          const pacienteResponse = await axios.post('/api/chatbot/crear-paciente', {
            nombre: this.appointmentData.nombre,
            tipo_documento: this.appointmentData.tipo_documento,
            numero_documento: this.appointmentData.numero_documento,
            telefono: this.appointmentData.telefono,
            correo: this.appointmentData.correo,
          })
          pacienteId = pacienteResponse.data.paciente.id
              console.log('✅ Paciente nuevo creado:', pacienteResponse.data.paciente)
            }
          } catch (error) {
            console.error('Error validando/creando paciente:', error)
            // Si falla la validación, intentar crear paciente nuevo
            const pacienteResponse = await axios.post('/api/chatbot/crear-paciente', {
              nombre: this.appointmentData.nombre,
              tipo_documento: this.appointmentData.tipo_documento,
              numero_documento: this.appointmentData.numero_documento,
              telefono: this.appointmentData.telefono,
              correo: this.appointmentData.correo,
            })
            pacienteId = pacienteResponse.data.paciente.id
            console.log('✅ Paciente creado después de error:', pacienteResponse.data.paciente)
          }
        }
        
        const citaResponse = await axios.post('/api/chatbot/agendar-cita', {
          paciente_id: pacienteId,
          medico_id: medico.id,
          fecha: this.appointmentData.fecha,
          hora: this.appointmentData.hora,
          motivo: this.appointmentData.motivo,
          duracion: 20,
          hora_automatica: this.appointmentData.hora_automatica || false
        })
        
        // Guardar los datos antes de resetear
        const fechaCita = this.appointmentData.fecha
        const horaCita = this.appointmentData.hora
        
        // Guardar información de la cita en la memoria de sesión
        this.sessionMemory.lastAppointment = {
          id: citaResponse.data.cita.id,
          medico: medico.nombre,
          especialidad: this.appointmentData.especialidad,
          fecha: fechaCita,
          hora: horaCita,
          motivo: this.appointmentData.motivo
        }
        
        // SOLO resetear después de confirmar éxito
        this.resetAppointmentData()
        
        return `¡Perfecto! Tu cita ha sido agendada exitosamente.\n\n` +
               `Número de cita: #${citaResponse.data.cita.id}\n` +
               `Médico: ${medico.nombre}\n` +
               `Especialidad: ${this.appointmentData.especialidad}\n` +
               `Fecha: ${fechaCita.split('-').reverse().join('/')}\n` +
               `Hora: ${horaCita}\n\n` +
               `📋 IMPORTANTE: Las citas se asignan por orden de llegada. Te recomendamos llegar 15 minutos antes de tu hora programada.\n\n` +
               `Te enviaremos un recordatorio por correo electrónico. Si necesitas cambiar o cancelar tu cita, contacta directamente con la clínica.\n\n` +
               `¿En qué más puedo ayudarte?`
        
      } catch (error) {
        console.error('Error creando cita:', error)
        console.error('Error response:', error.response)
        console.error('Error message:', error.message)
        
        // NO resetear datos en caso de error, permitir corrección
        this.currentStep = 'confirmacion'
        
        // Mostrar error específico si está disponible
        let errorMessage = 'Lo siento, hubo un error al agendar tu cita. Los datos que proporcionaste están guardados. ¿Quieres intentar nuevamente o corregir algún dato?'
        
        if (error.response && error.response.data && error.response.data.error) {
          errorMessage = `Error: ${error.response.data.error}. Los datos que proporcionaste están guardados. ¿Quieres intentar nuevamente o corregir algún dato?`
        } else if (error.message) {
          errorMessage = `Error: ${error.message}. Los datos que proporcionaste están guardados. ¿Quieres intentar nuevamente o corregir algún dato?`
        }
        
        return errorMessage
      }
    },
    
    resetAppointmentData() {
      this.isSchedulingAppointment = false
      this.currentStep = ''
      this.pacienteValidado = null
      this.appointmentData = {
        nombre: '',
        tipo_documento: '',
        numero_documento: '',
        telefono: '',
        correo: '',
        especialidad: '',
        fecha: '',
        hora: '',
        motivo: ''
      }
    },
    
    // Sistema NLU - Detección de Intenciones con Modelo Especializado
    async detectarIntencion(userMessage) {
      try {
        // Usar axios para aprovechar el proxy en desarrollo
        const response = await axios.post('/api/chatbot/nlu', {
          mensaje: userMessage
        })
        
        if (response.data) {
          const result = response.data
          console.log('🎯 Intención detectada por NLU:', result.intent, 'Confianza:', result.confidence)
          
          // Mapear intenciones del NLU a las del sistema
          const intentMapping = {
            'agendar_cita': 'agendar',
            'consultar_medicos': 'consultar_medicos',
            'consultar_servicios': 'consultar',
            'saludar': 'saludar',
            'proporcionar_datos': 'agendar', // Los datos se proporcionan en contexto de agendamiento
            'confirmar': 'agendar',
            'corregir': 'agendar',
            'despedirse': 'saludar'
          }
          
          return intentMapping[result.intent] || 'desconocido'
        }
      } catch (error) {
        console.error('Error detectando intención con NLU:', error)
      }
      
      // Fallback: detección manual básica
      return this.detectarIntencionManual(userMessage)
    },

    // Detección manual de intenciones (Fallback)
    detectarIntencionManual(userMessage) {
      const mensaje = userMessage.toLowerCase().trim()
      
      // Patrones de intención de agendar cita
      const patronesAgendar = [
        'quiero una cita', 'necesito una cita', 'agendar cita', 'solicitar cita',
        'cita con', 'consulta con', 'ver a', 'ver al', 'ver a la',
        'cita para', 'consulta para', 'agendar para'
      ]
      
      // Patrones de consulta de servicios
      const patronesConsultar = [
        'tienen', 'hay', 'ofrecen', 'realizan', 'hacen', 'disponen',
        'qué servicios', 'cuáles servicios', 'qué tienen', 'qué ofrecen',
        'horarios', 'precios', 'costos', 'laboratorio', 'radiología'
      ]
      
      // Detectar intención de agendar
      const quiereAgendar = patronesAgendar.some(patron => mensaje.includes(patron))
      if (quiereAgendar) return 'agendar'
      
      // Detectar intención de consultar
      const quiereConsultar = patronesConsultar.some(patron => mensaje.includes(patron))
      if (quiereConsultar) return 'consultar'
      
      // Detectar intención de saludar
      const patronesSaludo = ['hola', 'buenos días', 'buenas tardes', 'buenas noches', 'hi', 'hello']
      const esSaludo = patronesSaludo.some(patron => mensaje.includes(patron))
      if (esSaludo) return 'saludar'
      
      return 'desconocido'
    },

    // Extracción Inteligente de Datos con Modelo NLU
    async extraerDatosInteligente(userMessage) {
      try {
        console.log('🧠 Usando modelo NLU para:', userMessage)
        
        const response = await axios.post('/api/chatbot/nlu', {
          mensaje: userMessage
        })
        
        if (!response.data) {
          console.log('⚠️ Fallback a extracción manual')
          return this.extraerDatosManual(userMessage)
        }
        
        const result = response.data
        console.log('📊 Resultado del modelo NLU:', result)
        
        // Convertir resultado del NLU al formato esperado
        const datosExtraidos = {
          nombre: result.extractedData?.nombre || null,
          especialidad: result.extractedData?.especialidad || null,
          telefono: result.extractedData?.telefono || null,
          correo: result.extractedData?.correo || null,
          documento: result.extractedData?.documento || null,
          fecha: result.extractedData?.fecha || null,
          intencion: result.intent || 'desconocido'
        }
        
        console.log('✅ Datos extraídos por NLU:', datosExtraidos)
        return datosExtraidos
        
      } catch (error) {
        console.error('Error en modelo NLU:', error)
        return this.extraerDatosManual(userMessage)
      }
    },

    // Extracción Manual de Datos (Fallback)
    extraerDatosManual(userMessage) {
      const datos = {
        nombre: null,
        especialidad: null,
        telefono: null,
        correo: null,
        documento: null,
        fecha: null,
        intencion: this.detectarIntencion(userMessage)
      }
      
      const mensaje = userMessage.toLowerCase()
      
      // Extraer especialidad
      const especialidades = {
        'radiologia': 'Radioterapia', 'radioligia': 'Radioterapia', 'radioterapia': 'Radioterapia',
        'oncologia': 'Oncología Médica', 'oncólogo': 'Oncología Médica', 'oncolo': 'Oncología Médica',
        'cirugia': 'Cirugía Oncológica', 'cirugía': 'Cirugía Oncológica', 'cirujano': 'Cirugía Oncológica',
        'cirugia oncologica': 'Cirugía Oncológica', 'cirugía oncológica': 'Cirugía Oncológica',
        'psicologia': 'Psicología Oncológica', 'psicólogo': 'Psicología Oncológica', 'psicologo': 'Psicología Oncológica',
        'nutricion': 'Nutrición Oncológica', 'nutrición': 'Nutrición Oncológica', 'nutricionista': 'Nutrición Oncológica',
        'medicina nuclear': 'Medicina Nuclear', 'nuclear': 'Medicina Nuclear',
        'hematologia': 'Hematología Oncológica', 'hematología': 'Hematología Oncológica', 'hematólogo': 'Hematología Oncológica'
      }
      
      for (const [clave, valor] of Object.entries(especialidades)) {
        if (mensaje.includes(clave)) {
          datos.especialidad = valor
          break
        }
      }
      
      // Extraer teléfono (más flexible)
      const telefonoMatch = mensaje.match(/(\d{3}[\s\-]?\d{3}[\s\-]?\d{3}|\d{9})/)
      if (telefonoMatch) {
        let telefono = telefonoMatch[1].replace(/\s+/g, '')
        if (!telefono.startsWith('+51') && telefono.length === 9) {
          telefono = '+51' + telefono
        }
        datos.telefono = telefono
      }
      
      // Extraer email (más flexible)
      const emailMatch = mensaje.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/)
      if (emailMatch) {
        datos.correo = emailMatch[1]
      }
      
      // Extraer documento
      const docMatch = mensaje.match(/(dni|carnet|pasaporte|ce)\s*(\d{6,12})/i)
      if (docMatch) {
        datos.documento = {
          tipo: docMatch[1].toUpperCase(),
          numero: docMatch[2]
        }
      }
      
      // Extraer nombre (después de "soy", "me llamo", "mi nombre es")
      const nombreMatch = mensaje.match(/(?:soy|me llamo|mi nombre es|nombre)\s+([a-záéíóúñ\s]+)/i)
      if (nombreMatch) {
        datos.nombre = nombreMatch[1].trim()
      }
      
      return datos
    },

    // Detectar si el mensaje es una pregunta sobre servicios
    esPreguntaServicios(userMessage) {
      return this.detectarIntencion(userMessage) === 'consultar'
    },
    
    // Responder preguntas sobre servicios
    responderPreguntaServicios(userMessage) {
      const mensaje = userMessage.toLowerCase()
      
      // Respuestas específicas según el servicio consultado
      if (mensaje.includes('laboratorio') || mensaje.includes('lab') || 
          mensaje.includes('examen') || mensaje.includes('análisis')) {
        return `Sí, contamos con laboratorio clínico completo para análisis de sangre, orina, heces y otros estudios especializados en oncología. 

Ahora continuemos con tu cita. ¿Cuál es tu número de teléfono y correo electrónico?`
      }
      
      if (mensaje.includes('radiología') || mensaje.includes('rayos') || 
          mensaje.includes('tomografía') || mensaje.includes('resonancia') ||
          mensaje.includes('tomografias')) {
        return `Sí, tenemos servicio completo de radiología e imágenes médicas:
• Rayos X
• Tomografía computarizada (TAC)
• Resonancia magnética
• Ecografías
• Mamografías

Ahora continuemos con tu cita. ¿Cuál es tu número de teléfono y correo electrónico?`
      }
      
      if (mensaje.includes('especialidad') || mensaje.includes('consulta')) {
        return `Nuestras especialidades oncológicas incluyen:
• Oncología Médica
• Radioterapia  
• Cirugía Oncológica
• Psicología Oncológica
• Nutrición Oncológica
• Medicina Nuclear
• Hematología Oncológica

Ahora continuemos con tu cita. ¿Cuál es tu número de teléfono y correo electrónico?`
      }
      
      if (mensaje.includes('horario')) {
        return `Nuestros horarios de atención son:
• Lunes a Viernes: 8:00 AM - 6:00 PM
• Sábados: 8:00 AM - 2:00 PM

Ahora continuemos con tu cita. ¿Cuál es tu número de teléfono y correo electrónico?`
      }
      
      // Respuesta general para otros servicios
      return `Somos un instituto especializado en cáncer con servicios completos de:
• Consultas oncológicas especializadas
• Laboratorio clínico
• Radiología e imágenes médicas  
• Tratamientos de quimioterapia y radioterapia
• Apoyo psicológico y nutricional

Ahora continuemos con tu cita. ¿Cuál es tu número de teléfono y correo electrónico?`
    },
    
    // Responder preguntas sobre médicos
    async responderPreguntaMedicos(userMessage) {
      try {
        // Obtener lista de médicos del backend
        const response = await axios.get('/api/chatbot/medicos')
        const medicos = response.data
        
        if (!medicos || medicos.length === 0) {
          return 'No hay médicos disponibles en este momento. Por favor, contacta directamente con la clínica.'
        }
        
        // Agrupar médicos por especialidad
        const medicosPorEspecialidad = {}
        medicos.forEach(medico => {
          const especialidad = medico.especialidad_nombre || 'Sin especialidad'
          if (!medicosPorEspecialidad[especialidad]) {
            medicosPorEspecialidad[especialidad] = []
          }
          medicosPorEspecialidad[especialidad].push(medico.nombre)
        })
        
        // Construir respuesta
        let respuesta = 'Nuestro equipo médico especializado incluye:\n\n'
        
        Object.keys(medicosPorEspecialidad).forEach(especialidad => {
          respuesta += `**${especialidad}:**\n`
          medicosPorEspecialidad[especialidad].forEach(nombre => {
            respuesta += `• ${nombre}\n`
          })
          respuesta += '\n'
        })
        
        respuesta += '¿Te gustaría agendar una cita con alguno de nuestros especialistas?'
        
        return respuesta
        
      } catch (error) {
        console.error('Error obteniendo médicos:', error)
        return 'No pude obtener la información de nuestros médicos en este momento. Por favor, contacta directamente con la clínica o intenta de nuevo más tarde.'
      }
    },
    
    // Guardar datos del paciente en la memoria de sesión
    savePatientDataToSession() {
      this.sessionMemory.hasPatientData = true
      this.sessionMemory.patientData = {
        nombre: this.appointmentData.nombre,
        tipo_documento: this.appointmentData.tipo_documento,
        numero_documento: this.appointmentData.numero_documento,
        telefono: this.appointmentData.telefono,
        correo: this.appointmentData.correo,
      }
      console.log('Datos del paciente guardados en memoria de sesión:', this.sessionMemory.patientData)
    },
    
    // Limpiar memoria de sesión
    clearSessionMemory() {
      this.sessionMemory = {
        hasPatientData: false,
        patientData: {
          nombre: '',
          tipo_documento: '',
          numero_documento: '',
          telefono: '',
          correo: '',
        },
        lastAppointment: null
      }
      console.log('Memoria de sesión limpiada')
    },
    
    // Recuperar estado del agendamiento
    recoverAppointmentState() {
      if (this.isSchedulingAppointment && this.currentStep) {
        // Si estamos en proceso de agendamiento, mostrar resumen
        const datosCompletos = Object.values(this.appointmentData).every(val => val && val.trim() !== '')
        
        if (datosCompletos) {
          return this.generarResumenCita()
        } else {
          // Mostrar qué datos faltan
          const datosFaltantes = []
          if (!this.appointmentData.nombre) datosFaltantes.push('Nombre')
          if (!this.appointmentData.tipo_documento) datosFaltantes.push('Documento')
          if (!this.appointmentData.telefono) datosFaltantes.push('Teléfono y correo')
          if (!this.appointmentData.especialidad) datosFaltantes.push('Especialidad')
          if (!this.appointmentData.fecha) datosFaltantes.push('Fecha de cita')
          if (!this.appointmentData.hora) datosFaltantes.push('Hora')
          if (!this.appointmentData.motivo) datosFaltantes.push('Motivo')
          
          return `Continuemos con tu agendamiento. Aún necesitamos: ${datosFaltantes.join(', ')}. ¿Por cuál quieres empezar?`
        }
      }
      return null
    },
    
    // Manejar consultas sobre la última cita y comandos de memoria
    handleLastAppointmentQuery(userMessage) {
      const message = userMessage.toLowerCase()
      
      // Comandos para limpiar memoria
      const clearMemoryKeywords = [
        'limpiar datos', 'borrar datos', 'eliminar datos', 'resetear datos',
        'nuevos datos', 'cambiar datos', 'limpiar memoria', 'borrar memoria'
      ]
      
      const isClearingMemory = clearMemoryKeywords.some(keyword => 
        message.includes(keyword)
      )
      
      if (isClearingMemory) {
        this.clearSessionMemory()
        return 'Perfecto, he limpiado todos los datos guardados en esta sesión. Si quieres agendar una nueva cita, empezaremos desde cero.'
      }
      
      // Palabras clave para consultar sobre la última cita
      const lastAppointmentKeywords = [
        'mi última cita', 'mi cita anterior', 'la cita que agendé', 'mi cita',
        'cuándo es mi cita', 'dónde es mi cita', 'con quién es mi cita',
        'información de mi cita', 'detalles de mi cita', 'resumen de mi cita'
      ]
      
      const isAskingAboutLastAppointment = lastAppointmentKeywords.some(keyword => 
        message.includes(keyword)
      )
      
      if (isAskingAboutLastAppointment && this.sessionMemory.lastAppointment) {
        const appointment = this.sessionMemory.lastAppointment
        return `Aquí tienes la información de tu última cita:\n\n` +
               `Número de cita: #${appointment.id}\n` +
               `Médico: ${appointment.medico}\n` +
               `Especialidad: ${appointment.especialidad}\n` +
               `Fecha: ${appointment.fecha.split('-').reverse().join('/')}\n` +
               `Hora: ${appointment.hora}\n` +
               `Motivo: ${appointment.motivo}\n\n` +
               `¿Necesitas agendar otra cita o tienes alguna otra consulta?`
      } else if (isAskingAboutLastAppointment && !this.sessionMemory.lastAppointment) {
        return `No tengo registro de una cita anterior en esta sesión. Si quieres agendar una nueva cita, solo dime "quiero agendar una cita" y te ayudo con el proceso.`
      }
      
      return null
    }
  }
}
</script>

<style lang="scss" scoped>
.chatbot {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1000;
  
  &__toggle {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: linear-gradient(135deg, $primary-color 0%, $secondary-color 100%);
    border: none;
    color: white;
    font-size: 24px;
    cursor: pointer;
    box-shadow: 0 4px 20px rgba(102, 126, 234, 0.3);
    transition: all 0.3s ease;
    position: relative;
    
    &:hover {
      transform: scale(1.1);
      box-shadow: 0 6px 25px rgba(102, 126, 234, 0.4);
    }
    
    &--hidden {
      opacity: 0;
      visibility: hidden;
    }
  }
  
  &__notification {
    position: absolute;
    top: -5px;
    right: -5px;
    width: 20px;
    height: 20px;
    background: $error-color;
    border-radius: 50%;
    border: 2px solid white;
    animation: pulse 2s infinite;
  }
  
  &__window {
    position: absolute;
    bottom: 0;
    right: 0;
    width: 450px;
    height: 750px;
    background: white;
    border-radius: 16px 16px 0 0;
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    
    @media (max-width: 480px) {
      width: calc(100vw - 40px);
      height: 70vh;
      bottom: 0;
      right: 0;
      border-radius: 16px 16px 0 0;
    }
  }
  
  &__header {
    background: linear-gradient(135deg, $primary-color 0%, $secondary-color 100%);
    color: white;
    padding: 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  
  &__header-info {
    display: flex;
    align-items: center;
    gap: 12px;
    
    i {
      font-size: 20px;
    }
    
    h4 {
      margin: 0;
      font-size: 16px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    span {
      font-size: 12px;
      opacity: 0.8;
    }
  }
  
  .ai-badge {
    background: rgba(255, 255, 255, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 12px;
    padding: 2px 6px;
    font-size: 10px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 4px;
    backdrop-filter: blur(10px);
    
    i {
      font-size: 8px;
      color: #22d3ee;
    }
  }
  
  &__close {
    background: none;
    border: none;
    color: white;
    font-size: 18px;
    cursor: pointer;
    padding: 4px;
    
    &:hover {
      opacity: 0.8;
    }
  }
  
  &__messages {
    flex: 1;
    padding: 16px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  
  &__message {
    display: flex;
    gap: 12px;
    max-width: 90%;
    
    &.user {
      align-self: flex-end;
      flex-direction: row-reverse;
      
      .chatbot__message-content {
        background: $primary-color;
        color: white;
        border-radius: 18px 18px 4px 18px;
        min-width: 200px;
      }
    }
    
    &.bot {
      align-self: flex-start;
      
      .chatbot__message-content {
        background: $bg-light;
        color: $text-primary;
        border-radius: 18px 18px 18px 4px;
        min-width: 200px;
      }
    }
  }
  
  &__message-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: $primary-color;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    flex-shrink: 0;
  }
  
  &__message-content {
    padding: 16px 20px;
    word-wrap: break-word;
    max-width: 100%;
  }
  
  &__message-text {
    margin-bottom: 4px;
    line-height: 1.4;
    
    a {
      color: inherit;
      text-decoration: underline;
    }
  }
  
  &__message-time {
    font-size: 11px;
    opacity: 0.7;
  }
  
  &__typing {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 8px 0;
    
    &-text {
      font-size: 13px;
      color: $text-light;
      font-style: italic;
    }
    
    &-dots {
      display: flex;
      gap: 4px;
      
      span {
        width: 8px;
        height: 8px;
        background: $text-light;
        border-radius: 50%;
        animation: typing 1.4s infinite ease-in-out;
        
        &:nth-child(1) { animation-delay: -0.32s; }
        &:nth-child(2) { animation-delay: -0.16s; }
        &:nth-child(3) { animation-delay: 0s; }
      }
    }
  }
  
  &__input {
    padding: 16px;
    border-top: 1px solid $border-color;
    
    form {
      display: flex;
      gap: 8px;
    }
    
    input {
      flex: 1;
      padding: 12px 16px;
      border: 1px solid $border-color;
      border-radius: 24px;
      font-size: 14px;
      outline: none;
      transition: border-color 0.3s ease;
      
      &:focus {
        border-color: $primary-color;
      }
      
      &:disabled {
        background: $bg-light;
        cursor: not-allowed;
      }
    }
    
    button {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: $primary-color;
      border: none;
      color: white;
      cursor: pointer;
      transition: all 0.3s ease;
      
      &:hover:not(:disabled) {
        background: $secondary-color;
        transform: scale(1.1);
      }
      
      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }
  }
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
  }
}

@keyframes typing {
  0%, 80%, 100% {
    transform: scale(0.8);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}
</style> 