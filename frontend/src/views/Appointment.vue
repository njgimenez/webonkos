<template>
  <div class="appointment">
    <Navbar />
    
    <!-- Hero Section -->
    <section class="section section--hero">
      <div class="container">
        <div class="text-center">
          <h1>Agendar Cita</h1>
          <p style="color: white;">Programa tu consulta con nuestros especialistas oncológicos</p>
        </div>
      </div>
    </section>
    
    <!-- Formulario de Cita -->
    <section class="section">
      <div class="container">
        <div class="appointment-container">
          <div class="appointment-form">
            <h2>Información de la Cita</h2>
            <form @submit.prevent="submitAppointment">
              <!-- Información Personal -->
              <div class="form-section">
                <h3>Información Personal</h3>
                <div class="form-grid">
                  <div class="form-group">
                    <label for="firstName">Nombre *</label>
                    <input 
                      type="text" 
                      id="firstName" 
                      v-model="form.firstName" 
                      required
                      placeholder="Tu nombre"
                    />
                  </div>
                  
                  <div class="form-group">
                    <label for="lastName">Apellido *</label>
                    <input 
                      type="text" 
                      id="lastName" 
                      v-model="form.lastName" 
                      required
                      placeholder="Tu apellido"
                    />
                  </div>
                  
                  <div class="form-group">
                    <label for="email">Email *</label>
                    <input 
                      type="email" 
                      id="email" 
                      v-model="form.email" 
                      required
                      placeholder="tu@email.com"
                    />
                  </div>
                  
                  <div class="form-group">
                    <label for="phone">Teléfono *</label>
                    <input 
                      type="tel" 
                      id="phone" 
                      v-model="form.phone" 
                      required
                      placeholder="(+51) 933 598 495"
                    />
                  </div>
                  
                                    
                  <div class="form-group">
                    <label for="documentType">Tipo de Documento *</label>
                    <select id="documentType" v-model="form.documentType" required>
                      <option value="">Selecciona tipo de documento</option>
                      <option value="cc">DNI</option>
                      <option value="ce">CE</option>
                      <option value="pp">PASAPORTE</option>
                    </select>
                  </div>
                  
                  <div class="form-group">
                    <label for="documentNumber">Número de Documento *</label>
                    <input 
                      type="text" 
                      id="documentNumber" 
                      v-model="form.documentNumber" 
                      required
                      placeholder="Número de documento"
                    />
                  </div>
                </div>
              </div>
              
              <!-- Información de la Cita -->
              <div class="form-section">
                <h3>Detalles de la Cita</h3>
                <div class="form-grid">
                  <div class="form-group">
                    <label for="appointmentType">Tipo de Cita *</label>
                    <select id="appointmentType" v-model="form.appointmentType" required>
                      <option value="">Selecciona tipo de cita</option>
                      <option value="primera">Primera Consulta</option>
                      <option value="seguimiento">Consulta de Seguimiento</option>
                      <option value="emergencia">Consulta de Emergencia</option>
                      <option value="segunda-opinion">Segunda Opinión</option>
                    </select>
                  </div>
                  
                  <div class="form-group">
                    <label for="specialty">Especialidad *</label>
                    <select id="specialty" v-model="form.specialty" required>
                      <option value="">Selecciona especialidad</option>
                      <option 
                        v-for="especialidad in especialidades" 
                        :key="especialidad.id" 
                        :value="especialidad.nombre"
                      >
                        {{ especialidad.nombre }}
                      </option>
                    </select>
                  </div>
                  
                  <div class="form-group">
                    <label for="preferredDoctor">Doctor Preferido *</label>
                    <select id="preferredDoctor" v-model="form.preferredDoctor" required>
                      <option value="">Sin preferencia</option>
                      <option 
                        v-for="medico in medicosFiltrados" 
                        :key="medico.id" 
                        :value="medico.id"
                      >
                        {{ medico.nombre }} - {{ medico.especialidad_nombre }}
                      </option>
                    </select>
                  </div>
                  
                  <div class="form-group form-group--date-picker">
                    <label for="preferredDate">Fecha Preferida *</label>
                    <DatePicker 
                      v-model="form.preferredDate"
                      :minDate="null"
                      :disableSundays="true"
                    />
                  </div>
                  
                  
                </div>
              </div>
              
                           
              <!-- Términos y Condiciones -->
              <div class="form-section">
                <div class="form-group">
                  <label class="checkbox-label">
                    <input 
                      type="checkbox" 
                      v-model="form.termsAccepted"
                      required
                    />
                    <span class="checkmark"></span>
                    Acepto los <a href="#" @click.prevent="showTerms">términos y condiciones</a> *
                  </label>
                </div>
                
                <div class="form-group">
                  <label class="checkbox-label">
                    <input 
                      type="checkbox" 
                      v-model="form.privacyAccepted"
                      required
                    />
                    <span class="checkmark"></span>
                    Autorizo el tratamiento de mis datos personales según la <a href="#" @click.prevent="showPrivacy">política de privacidad</a> *
                  </label>
                </div>
                
                <div class="form-group">
                  <label class="checkbox-label">
                    <input 
                      type="checkbox" 
                      v-model="form.newsletter"
                    />
                    <span class="checkmark"></span>
                    Deseo recibir información sobre servicios y novedades de la clínica
                  </label>
                </div>
              </div>
              
              <!-- Botones -->
              <div class="form-actions">
                <button type="button" class="btn btn--secondary" @click="resetForm">
                  <i class="fas fa-undo"></i>
                  Limpiar Formulario
                </button>
                <button type="submit" class="btn btn--cta btn--large" :disabled="isSubmitting">
                  <i class="fas fa-calendar-check"></i>
                  {{ isSubmitting ? 'Enviando Solicitud...' : 'Solicitar Cita' }}
                </button>
              </div>
            </form>
          </div>
          
          <div class="appointment-info">
            <div class="info-card">
              <h3>Información Importante</h3>
              <ul>
                <li>Llega 15 minutos antes de tu cita</li>
                <li>Trae tu documento de identidad</li>
                <li>Lleva exámenes médicos previos</li>
                <li>Usa mascarilla durante la consulta</li>
                <li>Puedes venir acompañado</li>
              </ul>
            </div>
            
            <div class="info-card">
              <h3>Horarios de Atención</h3>
              <div class="schedule-info">
                <div class="schedule-item">
                  <strong>Lunes a Viernes:</strong>
                  <span>8:00 AM - 6:00 PM</span>
                </div>
               <div class="schedule-item">
                  <strong>Emergencias:</strong>
                  <span>24/7</span>
                </div>
              </div>
            </div>
            
            <div class="info-card">
              <h3>Contacto de Emergencia</h3>
              <p>Para emergencias médicas:</p>
                          <a href="tel:+51933598495" class="emergency-phone">
              <i class="fas fa-phone"></i>
              (+51) 933 598 495
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
    
    <!-- Modal de Confirmación de Cita -->
    <div v-if="confirmationData.show" class="modal-overlay" @click="closeConfirmationModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>✅ Cita Agendada Exitosamente</h3>
          <button class="modal-close" @click="closeConfirmationModal">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div class="modal-body">
          <div class="confirmation-message">
            <pre>{{ confirmationData.resumen }}</pre>
          </div>
          
          <div class="confirmation-note">
            <p><strong>Hemos registrado tu solicitud.</strong></p>
            <p>Recibirás un correo de confirmación en breve con todos los detalles de tu cita.</p>
          </div>
        </div>
        
        <div class="modal-footer">
          <button class="btn btn--cta" @click="closeConfirmationModal">
            Entendido
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Navbar from '@/components/Navbar.vue'
import DatePicker from '@/components/DatePicker.vue'
import axios from 'axios'

export default {
  name: 'Appointment',
  components: {
    Navbar,
    DatePicker
  },
  data() {
    return {
      isSubmitting: false,
      especialidades: [],
      medicos: [],
      medicosFiltrados: [],
      loading: false,
      confirmationData: {
        show: false,
        resumen: '',
        cita: null,
        paciente: null
      },
      form: {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        dateOfBirth: '',
        documentType: '',
        documentNumber: '',
        appointmentType: '',
        specialty: '',
        preferredDoctor: '',
        preferredDate: '',
        preferredTime: '',
        medicalHistory: '',
        currentSymptoms: '',
        medications: '',
        allergies: '',
        insuranceType: '',
        insuranceCompany: '',
        policyNumber: '',
        termsAccepted: false,
        privacyAccepted: false,
        newsletter: false
      }
    }
  },
  computed: {
    // Computed removido - ya no necesitamos minDate ni isWeekday
    // El componente DatePicker maneja la validación de domingos
  },
  async mounted() {
    console.log('🚀 Appointment.vue mounted() iniciado')
    console.log('🚀 Componente montado correctamente')
    console.log('🚀 this.loading antes:', this.loading)
    this.loading = true
    console.log('🚀 this.loading después:', this.loading)
    try {
      console.log('🚀 Iniciando carga de datos...')
      console.log('🚀 Llamando a loadEspecialidades()...')
      await this.loadEspecialidades()
      console.log('🚀 loadEspecialidades() completado')
      console.log('🚀 Llamando a loadMedicos()...')
      await this.loadMedicos()
      console.log('🚀 loadMedicos() completado')
      console.log('🚀 Datos cargados exitosamente')
      // Reset form to initial state as specified
      this.form.specialty = ''
      this.form.preferredDoctor = ''
      this.medicosFiltrados = [...this.medicos]
    } catch (error) {
      console.error('Error cargando datos iniciales:', error)
    } finally {
      this.loading = false
    }
    this.updateMetaTags();
  },
  watch: {
    'form.specialty'(newSpecialty, oldSpecialty) {
      // SIEMPRE al cambiar especialidad filtrar primero
      if (newSpecialty && newSpecialty !== '') {
        this.filtrarMedicosPorEspecialidad(newSpecialty)
        
        // Luego aplicar lógica según cantidad de médicos filtrados
        if (this.medicosFiltrados.length > 1) {
          // Caso a) Más de uno: mantener "Sin preferencia"
          this.form.preferredDoctor = ''
        } else if (this.medicosFiltrados.length === 1) {
          // Caso b) Solo uno: auto-seleccionar
          this.form.preferredDoctor = this.medicosFiltrados[0].id
        } else {
          // Caso c) Cero: limpiar médico
          this.form.preferredDoctor = ''
        }
      } else {
        // Sin especialidad: reiniciar todo
        this.form.preferredDoctor = ''
        this.medicosFiltrados = [...this.medicos]
      }
    },
    'form.preferredDoctor'(newDoctor, oldDoctor) {
      if (newDoctor && newDoctor !== '') {
        // Auto-seleccionar especialidad del médico
        this.filtrarEspecialidadesPorMedico(newDoctor)
        
        // Mostrar TODOS los médicos cuando se selecciona uno
        this.medicosFiltrados = [...this.medicos]
      } else {
        // Sin médico: ver si necesitamos refiltrar por especialidad
        if (this.form.specialty && this.form.specialty !== '') {
          // Si hay especialidad, mantener filtro por especialidad
          this.filtrarMedicosPorEspecialidad(this.form.specialty)
        } else {
          // Sin especialidad, mostrar todos
          this.medicosFiltrados = [...this.medicos]
        }
      }
    },
    'form.preferredDate'(newDate) {
      // Validación secundaria solo para domingos
      if (newDate) {
        const date = new Date(newDate + 'T00:00:00')
        const dayOfWeek = date.getDay()
        
        // Solo bloquear domingos (0)
        if (dayOfWeek === 0) {
          this.$nextTick(() => {
            this.form.preferredDate = ''
            alert('⚠️ Los domingos no están disponibles para citas. Por favor selecciona otro día.')
          })
        }
      }
    }
  },
  methods: {
    updateMetaTags() {
      document.title = 'Agendar Cita - Onkos';
      
      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.name = 'description';
        document.head.appendChild(metaDesc);
      }
      metaDesc.content = 'Programa tu consulta con nuestros especialistas oncológicos. Atención personalizada y de calidad.';
      
      // Open Graph
      this.setMetaTag('property', 'og:title', 'Agendar Cita - Onkos');
      this.setMetaTag('property', 'og:description', 'Programa tu consulta con nuestros especialistas oncológicos. Atención personalizada y de calidad.');
      this.setMetaTag('property', 'og:url', window.location.href);
      this.setMetaTag('property', 'og:type', 'website');
    },

    setMetaTag(attrName, attrValue, content) {
      if (!content) return;
      let element = document.querySelector(`meta[${attrName}="${attrValue}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attrName, attrValue);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    },

    async loadEspecialidades() {
      try {
        console.log('🔍 Iniciando carga de especialidades...')
        const response = await axios.get('/api/chatbot/especialidades')
        console.log('🔍 Response recibida:', response)
        console.log('🔍 Response data:', response.data)
        this.especialidades = response.data
        console.log('✅ Especialidades cargadas:', this.especialidades)
        console.log('✅ Cantidad de especialidades:', this.especialidades.length)
      } catch (error) {
        console.error('❌ Error cargando especialidades:', error)
        console.error('❌ Error response:', error.response)
      }
    },
    
    async loadMedicos() {
      try {
        console.log('🔍 Iniciando carga de médicos...')
        const response = await axios.get('/api/chatbot/medicos')
        console.log('🔍 Response médicos recibida:', response)
        console.log('🔍 Response data médicos:', response.data)
        this.medicos = response.data
        this.medicosFiltrados = [...this.medicos]
        console.log('✅ Médicos cargados:', this.medicos)
        console.log('✅ Cantidad de médicos:', this.medicos.length)
      } catch (error) {
        console.error('❌ Error cargando médicos:', error)
        console.error('❌ Error response médicos:', error.response)
      }
    },
    
    filtrarMedicosPorEspecialidad(especialidadNombre) {
      this.medicosFiltrados = this.medicos.filter(medico => 
        medico.especialidad_nombre && 
        medico.especialidad_nombre.toLowerCase() === especialidadNombre.toLowerCase()
      )
    },
    
    filtrarEspecialidadesPorMedico(medicoId) {
      const medico = this.medicos.find(m => m.id === parseInt(medicoId))
      if (medico && medico.especialidad_nombre) {
        // Solo filtrar la especialidad del médico seleccionado (sin filtrar médicos)
        this.form.specialty = medico.especialidad_nombre
      }
    },

    async submitAppointment() {
      this.isSubmitting = true
      
      try {
        // Validar campos requeridos
        if (!this.validateRequiredFields()) {
          return
        }

        // Preparar datos del paciente
        const pacienteData = this.formatPatientData()
        
        // Crear/buscar paciente existente
        const paciente = await this.createOrFindPatient(pacienteData)
        
        // Preparar datos da cita
        const citasData = await this.formatAppointmentData(paciente.id)
        
        console.log('Datos de la cita a enviar:', citasData)
        
        // Guardar cita en backend
        const response = await axios.post('/api/chatbot/agendar-cita', citasData)
        
        if (response.data.success) {
          // Mostrar modal de confirmación con mensaje estilizado
          this.showConfirmationModal(response.data.cita, paciente, citasData)
        } else {
          throw new Error(response.data.error || 'Error al guardar la cita')
        }
        
      } catch (error) {
        console.error('Error al enviar solicitud:', error)
        const errorMessage = error.response?.data?.error || error.message || 'Hubo un error al enviar la solicitud. Por favor, intenta de nuevo.'
        alert(`Error: ${errorMessage}`)
      } finally {
        this.isSubmitting = false
      }
    },

    // Validar campos requeridos antes del envio
    validateRequiredFields() {
      const requiredFields = [
        { field: 'firstName', message: 'Nombre es requerido' },
        { field: 'lastName', message: 'Apellido es requerido' },
        { field: 'email', message: 'Email es requerido' },
        { field: 'phone', message: 'Teléfono es requerido' },
        { field: 'documentType', message: 'Tipo de documento es requerido' },
        { field: 'documentNumber', message: 'Número de documento es requerido' },
        { field: 'appointmentType', message: 'Tipo de cita es requerido' },
        { field: 'specialty', message: 'Especialidad es requerida' },
        { field: 'preferredDoctor', message: 'Doctor es requerido' },
        { field: 'preferredDate', message: 'Fecha es requerida' },
      ]

      for (const { field, message } of requiredFields) {
        if (!this.form[field]) {
          alert(message)
          return false
        }
      }

      // Verificar términos
      if (!this.form.termsAccepted) {
        alert('Debes aceptar los términos y condiciones')
        return false
      }

      if (!this.form.privacyAccepted) {
        alert('Debes aceptar la política de privacidad')
        return false
      }

      return true
    },

    // Formatear datos del paciente para guardar en BD
    formatPatientData() {
      return {
        nombre: `${this.form.firstName} ${this.form.lastName}`,
        dni: this.form.documentNumber,
        telefono: this.form.phone,
        correo: this.form.email,
        fecha_nacimiento: this.form.dateOfBirth,
        tipo_documento: this.form.documentType,
        numero_documento: this.form.documentNumber,
        estado_vital: 'vivo',
        estado: 'activo'
      }
    },

    // Crear o encontrar paciente existente
    async createOrFindPatient(pacienteData) {
      try {
        const { telefono, correo, nombre } = pacienteData
        
        // Primero verificar si existe paciente
        const dniCompleto = `${pacienteData.tipo_documento} ${pacienteData.numero_documento}`
        
        // Buscar por el endpoint existente de validar paciente
        const validateResponse = await axios.post('/api/chatbot/validar-paciente', {
          tipo_documento: pacienteData.tipo_documento,
          numero_documento: pacienteData.numero_documento,
          nombre,
          telefono,
          correo,
          fecha_nacimiento: pacienteData.fecha_nacimiento
        })
        
        if (validateResponse.data.tipo === 'paciente_existente') {
          // Paciente existe, usar datos existentes
          return validateResponse.data.paciente
        } else if (validateResponse.data.tipo === 'paciente_nuevo' || validateResponse.data.tipo === 'datos_diferentes') {
          // Crear nuevo paciente o usar existente de datos diferentes
          const createResponse = await axios.post('/api/chatbot/crear-paciente', pacienteData)
          
          if (!createResponse.data.success) {
            throw new Error(createResponse.data.error || 'Error al crear paciente')
          }
          
          return createResponse.data.paciente
        } else {
          throw new Error('Respuesta inesperada del servidor')
        }
        
      } catch (error) {
        console.error('Error procesando paciente:', error)
        
        // Si es error de "Ya existe un paciente" - intentar buscar de nuevo
        if (error.response?.data?.error?.includes('Ya existe un paciente')) {
          try {
            // Buscar el paciente existente de otra manera
            const searchResponse = await axios.post('/api/chatbot/validar-paciente', pacienteData)
            if (searchResponse.data.tipo === 'paciente_existente' || searchResponse.data.tipo === 'datos_diferentes') {
              return searchResponse.data.paciente
            }
          } catch (searchError) {
            console.error('Error en segunda validación:', searchError)
          }
        }
        
        throw new Error('No se pudo procesar la información del paciente. Por favor, verifica los datos.')
      }
    },

    // Formatear datos de la cita para guardar
    async formatAppointmentData(pacienteId) {
      // Encontrar el médico seleccionado
      const medicoSeleccionado = this.medicos.find(m => m.id === parseInt(this.form.preferredDoctor))
      
      if (!medicoSeleccionado) {
        throw new Error('Médico seleccionado no válido')
      }

      const fecha = this.form.preferredDate
      
      // Si no tiene hora específica, calcular automáticamente 
      let hora
      let hora_automatica = false
      
      if (this.form.preferredTime) {
        hora = this.form.preferredTime
      } else {
        // Obtener la siguiente hora disponible auto-asignada
        hora = await this.calcularHoraAutomatica(medicoSeleccionado.id, fecha)
        hora_automatica = true
      }

      // Tipo de Cita se mapea a motivo en la BD
      const tiposCita = {
        'primera': 'Primera Consulta',
        'seguimiento': 'Consulta de Seguimiento', 
        'emergencia': 'Consulta de Emergencia',
        'segunda-opinion': 'Segunda Opinión'
      }

      // Asegurar que la hora esté correctamente formateada para evitar problemas de timezone
      let horaFormateada = hora
      if (hora && hora.length === 5 && hora.includes(':')) {
        // Formatear HH:mm seguramente
        const [horas, minutos] = hora.split(':')
        horaFormateada = `${parseInt(horas).toString().padStart(2, '0')}:${parseInt(minutos).toString().padStart(2, '0')}`
      }
      
      // Crear timestamp completo que el backend usará directamente sin conversión timezone
      const finalTimestamp = `${fecha}T${horaFormateada}:00`
      console.log('🔍 Debug FINAL formatAppointmentData:', {
        fecha_original: fecha,
        hora_original: hora,
        hora_formateada: horaFormateada,
        timestamp_final: finalTimestamp,
        test_backend_date: new Date(finalTimestamp),
        test_backend_iso: new Date(finalTimestamp).toISOString()
      })

      return {
        paciente_id: pacienteId,
        medico_id: medicoSeleccionado.id,
        fecha: fecha, // solo fecha YYYY-MM-DD
        hora: horaFormateada, // hora bien formateada HH:mm 
        timestamp_para_backend: finalTimestamp, // Nuevo campo para pasar timestamp pre-formatado
        motivo: tiposCita[this.form.appointmentType] || this.form.appointmentType,
        duracion: 25, // duración por defecto 25 minutos según especificaciones
        hora_automatica: hora_automatica
      }
    },

    // Calcular la siguiente hora disponible (última cita del día + 25 minutos)
    async calcularHoraAutomatica(medicoId, fecha) {
      try {
        // Obtener todas las citas del médico para esa fecha
        const response = await axios.post('/api/chatbot/obtener-citas-medico', {
          medico_id: medicoId,
          fecha: fecha
        })
        
        const citas = response.data.citas_existentes || []
        console.log('🔍 Debug - Citas encontradas:', citas.length, citas)
        
        if (citas.length === 0) {
          // Si no hay citas, empezar a las 9:00 AM
          console.log('🔍 Debug - No hay citas, usando 09:00')
          return '09:00'
        }
        
        // Obtener la última cita del día (más reciente)
        const ultimaCita = citas[citas.length - 1]
        console.log('🔍 Debug - Última cita:', ultimaCita)
        
        // Usar directamente la hora de la BD evitando conversiones con timezone 
        const ultimaFechaf = ultimaCita.fecha
        let ultimaFecha
        
        console.log('🔍 Debug - Fecha sin parsear de la BD:', ultimaFechaf)
        
        if (ultimaFechaf.includes('T')) {
          // Es ISO string: usar directamente pero hacer parseo seguro
          const tempDate = new Date(ultimaFechaf)
          // Mantener solo la fecha y crear nueva fecha con timezone local
          const year = tempDate.getFullYear()
          const month = tempDate.getMonth()
          const day = tempDate.getDate()
          const hours = tempDate.getHours()
          const minutes = tempDate.getMinutes()
          
          ultimaFecha = new Date(year, month, day, hours, minutes, 0, 0)
        } else {
          // Fallback a medianoche
          ultimaFecha = new Date(ultimaFechaf + 'T00:00:00')
        }
        
        console.log('🔍 Debug - Última fecha parseada (safe):', ultimaFecha.toISOString())
        
        // Añadir 25 minutos a la última cita
        const nuevaHora = new Date(ultimaFecha.getTime() + 25 * 60 * 1000)
        console.log('🔍 Debug - Nueva hora calculada (UTC):', nuevaHora.toISOString())
        
        // Formatear hora sin timezone issues asegurando formato HH:mm consistente
        const horas = nuevaHora.getHours().toString().padStart(2, '0')
        const minutos = nuevaHora.getMinutes().toString().padStart(2, '0')
        const formattedHora = `${horas}:${minutos}`
        
        console.log('🔍 Debug - Hora final (components y date components):', formattedHora)
        console.log('🔍 Debug - Hora nuevaHora.getTime():', nuevaHora.getTime())
        console.log('🔍 Debug - Hora componentes:', { horas, minutos })
        
        return formattedHora
        
      } catch (error) {
        console.error('Error calculando hora automática:', error)
        // Fallback a 9:00 AM si hay error
        return '09:00'
      }
    },

    // Mostrar modal de confirmación con mensaje estilizado al estilo del chatbot
    showConfirmationModal(cita, paciente, citasData) {
      // Crear mensaje de resumen similar al chatbot Luci
      const resumen = this.generarResumenCitaModal(cita, paciente, citasData)
      
      // Guardar datos para el modal
      this.confirmationData = {
        show: true,
        resumen: resumen,
        cita: cita,
        paciente: paciente
      }
    },

    // Generar mensaje de resumen similar al chatbot
    generarResumenCitaModal(cita, paciente, citasData) {
      const medicoSeleccionado = this.medicos.find(m => m.id === citasData.medico_id)
      
      // Mapear correctamente las propiedades desde las diferentes fuentes
      const pacienteInfo = this.extractPatientInfo(paciente)
      const medicoInfo = this.extractDoctorInfo(medicoSeleccionado)
      
      // Formatear fecha en español para la vista
      const fechaFormateada = new Date(citasData.fecha + 'T' + citasData.hora).toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
      
      return `Resumen de tu cita:\n\n` +
             `Paciente: ${pacienteInfo.nombre}\n` +
             `Documento: ${pacienteInfo.documentoCompleto}\n` +
             `Teléfono: ${pacienteInfo.telefono}\n` +
             `Correo: ${pacienteInfo.correo}\n` +
             `Médico: ${medicoInfo.nombre}\n` +
             `Especialidad: ${medicoInfo.especialidad}\n` +
             `Fecha: ${fechaFormateada}\n` +
             `Hora: ${citasData.hora}\n` +
             `Motivo: ${citasData.motivo}\n`
    },

    // Extraer información del paciente desde diferentes fuentes posibles
    extractPatientInfo(paciente) {
      // El backend del validar-paciente devuelve un objeto con diferentes estructuras
      // Necesito revisar tanto paciente.tipo_documento/numero_documento como paciente.dni
      const docInfo = this.parseDocumentInfo(paciente)
      
      return {
        nombre: paciente.nombre || 'No disponible',
        telefono: paciente.telefono || 'No disponible', 
        correo: paciente.correo || 'No disponible',
        documentoCompleto: docInfo
      }
    },

    // Parsear información del documento desde diferentes fuentes
    parseDocumentInfo(paciente) {
      // Si tiene tipo_documento y numero_documento accesibles
      if (paciente.tipo_documento && paciente.numero_documento) {
        return `${this.getDocumentTypeLabel(paciente.tipo_documento)} ${paciente.numero_documento}`
      }
      
      // Si viene de formData que mapeamos
      const formData = this.form
      const tipoDoc = formData.documentType
      const numeroDoc = formData.documentNumber
      
      if (tipoDoc && numeroDoc) {
        return `${this.getDocumentTypeLabel(tipoDoc)} ${numeroDoc}`
      }
      
      // Si tiene el dni completo desde backend 
      if (paciente.dni) {
        return paciente.dni
      }
      
      return 'No especificado'
    },

    // Obtener etiqueta de tipo de documento
    getDocumentTypeLabel(tipo) {
      const tipos = {
        'cc': 'DNI',
        'ce': 'CE', 
        'pp': 'PASAPORTE'
      }
      return tipos[tipo] || tipo
    },

    // Extraer información del médico
    extractDoctorInfo(medico) {
      if (!medico) {
        return { nombre: 'No especificado', especialidad: 'No especificada' }
      }
      
      console.log('🔍 Debug - Estructura del médico:', medico)
      
      // Lógica mejorada para obtener especialidad:
      // Buscar en diferentes posibles propiedades de la BD
      let especialidad = null
      
      if (medico.especialidad) {
        especialidad = medico.especialidad
      } else if (medico.especialidad_nombre) {
        especialidad = medico.especialidad_nombre
      } else if (medico.especialidad_id) {
        // Si tenemos el ID, buscar en array de especialidades
        const especialidadObj = this.especialidades.find(e => e.id === medico.especialidad_id)
        especialidad = especialidadObj ? especialidadObj.nombre : null
      }
      
      // Si aún no tenemos especialidad, usar la seleccionada en el form 
      if (!especialidad && this.form.specialty) {
        const especialidadForm = this.especialidades.find(e => e.nombre === this.form.specialty)
        especialidad = especialidadForm ? especialidadForm.nombre : this.form.specialty
      }
      
      return {
        nombre: medico.nombre || 'No especificado',
        especialidad: especialidad || 'Consulta General'
      }
    },

    // Cerrar el modal y resetear el formulario 
    closeConfirmationModal() {
      this.confirmationData.show = false
      this.resetForm()
    },
    
    resetForm() {
      this.form = {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        dateOfBirth: '',
        documentType: '',
        documentNumber: '',
        appointmentType: '',
        specialty: '',
        preferredDoctor: '',
        preferredDate: '',
        preferredTime: '',
        medicalHistory: '',
        currentSymptoms: '',
        medications: '',
        allergies: '',
        insuranceType: '',
        insuranceCompany: '',
        policyNumber: '',
        termsAccepted: false,
        privacyAccepted: false,
        newsletter: false
      }
      // Reiniciar también los datos de filtros
      this.medicosFiltrados = [...this.medicos]
    },
    
    showTerms() {
      alert('Términos y condiciones de la clínica...')
    },
    
    showPrivacy() {
      alert('Política de privacidad de la clínica...')
    }
  }
}
</script>

<style lang="scss" scoped>
.appointment-container {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 3rem;
  
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
}

.appointment-form {
  background: white;
  padding: 2rem;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  
  h2 {
    margin-bottom: 2rem;
    color: $primary-color;
  }
}

.form-section {
  margin-bottom: 2rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid $border-color;
  
  &:last-of-type {
    border-bottom: none;
  }
  
  h3 {
    color: $primary-color;
    margin-bottom: 1.5rem;
    font-size: 1.25rem;
  }
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.form-group {
  margin-bottom: 1.5rem;
  
  label {
    display: block;
    margin-bottom: 0.5rem;
    color: $text-primary;
    font-weight: 500;
  }
  
  input,
  select,
  textarea {
    width: 100%;
    padding: 12px 16px;
    border: 1px solid $border-color;
    border-radius: 8px;
    font-size: 16px;
    height: 48px;
    line-height: normal;
    transition: all 0.3s ease;
    
    &:focus {
      outline: none;
      border-color: $primary-color;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }
  }
  
  textarea {
    resize: vertical;
    min-height: 100px;
  }
}

.checkbox-label {
  display: flex !important;
  align-items: flex-start;
  gap: 0.75rem;
  cursor: pointer;
  color: $text-secondary;
  line-height: 1.4;
  margin-bottom: 1rem;
  
  input[type="checkbox"] {
    width: 18px !important;
    height: 18px !important;
    margin: 0;
    margin-top: 2px;
    cursor: pointer;
    flex-shrink: 0;
  }
  
  .checkmark {
    display: none; // Removing if not used, or keep if custom design is intended
  }
  
  a {
    color: $primary-color;
    text-decoration: none;
    
    &:hover {
      text-decoration: underline;
    }
  }
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
}

.appointment-info {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.info-card {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  
  h3 {
    color: $primary-color;
    margin-bottom: 1rem;
    font-size: 1.1rem;
  }
  
  ul {
    list-style: none;
    
    li {
      padding: 0.5rem 0;
      color: $text-secondary;
      position: relative;
      padding-left: 1.5rem;
      
      &::before {
        content: '✓';
        position: absolute;
        left: 0;
        color: $success-color;
        font-weight: bold;
      }
    }
  }
}

.schedule-info {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.schedule-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid $border-color;
  
  &:last-child {
    border-bottom: none;
  }
  
  strong {
    color: $text-primary;
  }
  
  span {
    color: $text-secondary;
  }
}

.emergency-phone {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: $error-color;
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
  margin-top: 1rem;
  transition: all 0.3s ease;
  
  &:hover {
    background: darken($error-color, 10%);
    transform: translateY(-2px);
  }
}



/* Estilos del Modal de Confirmación */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-content {
  background: white;
  border-radius: 12px;
  max-width: 600px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  animation: modalSlideIn 0.3s ease-out;
}

@keyframes modalSlideIn {
  0% {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem 1rem;
  border-bottom: 1px solid #e9ecef;
  
  h3 {
    margin: 0;
    color: $primary-color;
    font-size: 1.25rem;
    font-weight: 600;
  }
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  color: #6c757d;
  padding: 0.25rem;
  transition: color 0.2s ease;
  
  &:hover {
    color: #dc3545;
  }
}

.modal-body {
  padding: 2rem;
}

.confirmation-message {
  margin-bottom: 1.5rem;
  
  pre {
    background: #f8f9fa;
    border: 1px solid #e9ecef;
    border-radius: 8px;
    padding: 1.5rem;
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 0.95rem;
    line-height: 1.6;
    white-space: pre-wrap;
    overflow-x: auto;
  }
}

.confirmation-note {
  background: linear-gradient(135deg, #667eea15, #764ba215);
  border: 1px solid #667eea40;
  border-radius: 8px;
  padding: 1rem;
  
  p {
    margin: 0.5rem 0;
    text-align: center;
    
    &:first-child {
      font-size: 1.1rem;
      color: $primary-color;
    }
    
    &:last-child {
      color: #6c757d;
      font-size: 0.95rem;
    }
  }
}

.modal-footer {
  padding: 1rem 2rem 1.5rem;
  display: flex;
  justify-content: center;
  
  .btn {
    min-width: 120px;
    padding: 0.75rem 2rem;
    font-size: 1rem;
    font-weight: 600;
  }
}
</style> 