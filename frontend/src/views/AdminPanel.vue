<template>
  <div class="admin-panel">
    <div class="admin-panel__header">
      <div class="admin-panel__title">
        <button @click="toggleSidebar" class="admin-panel__sidebar-toggle">
          <i class="fas fa-bars"></i>
        </button>
        <router-link to="/" class="admin-panel__logo">
          <img src="@/assets/LOGO2.png" alt="Onkos Instituto del Cáncer" />
        </router-link>
        <div class="admin-panel__title-text">
          <h1>Panel Administrativo</h1>
          <p>Gestión de médicos, usuarios y pacientes</p>
        </div>
      </div>
      <div class="admin-panel__user">
        <span>Bienvenido, {{ adminUser?.nombre }}</span>
        <button @click="logout" class="btn btn--secondary">
          <i class="fas fa-sign-out-alt"></i>
          Cerrar Sesión
        </button>
      </div>
    </div>
    
    <div class="admin-panel__layout">
      <!-- Panel Lateral -->
      <aside :class="['admin-panel__sidebar', { 'admin-panel__sidebar--collapsed': sidebarCollapsed }]">
        <div class="admin-panel__sidebar-header">
          <h3>Menú</h3>
          <button @click="toggleSidebar" class="admin-panel__sidebar-close">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <nav class="admin-panel__sidebar-nav">
          <button 
            v-for="tab in tabs" 
            :key="tab.id"
            @click="selectTab(tab.id)"
            :class="['admin-panel__sidebar-item', { 'admin-panel__sidebar-item--active': activeTab === tab.id }]"
          >
            <i :class="tab.icon"></i>
            <span class="admin-panel__sidebar-text">{{ tab.name }}</span>
          </button>
        </nav>
      </aside>
      
      <!-- Overlay para móviles -->
      <div 
        v-if="!sidebarCollapsed" 
        class="admin-panel__overlay" 
        @click="toggleSidebar"
      ></div>
      
      <!-- Contenido Principal -->
      <main class="admin-panel__main">
    
    <div class="admin-panel__content">
      <!-- Tab Médicos -->
      <div v-if="activeTab === 'medicos'" class="admin-panel__section">
        <div class="admin-panel__section-header">
          <h2>Gestión de Médicos</h2>
          <button @click="showMedicoForm = true" class="btn btn--primary">
            <i class="fas fa-plus"></i>
            Agregar Médico
          </button>
        </div>
        
        <div class="admin-panel__table">
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>DNI</th>
                <th>Especialidad</th>
                <th>Teléfono</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="medico in medicos" :key="medico.id">
                <td>{{ medico.nombre }}</td>
                <td>{{ medico.dni }}</td>
                <td>{{ medico.especialidad }}</td>
                <td>{{ medico.telefono }}</td>
                <td>
                  <span :class="['status', `status--${medico.estado}`]">
                    {{ medico.estado }}
                  </span>
                </td>
                <td>
                  <button @click="editMedico(medico)" class="btn btn--small">
                    <i class="fas fa-edit"></i>
                  </button>
                  <button @click="viewAgenda(medico)" class="btn btn--small btn--primary">
                    <i class="fas fa-calendar-alt"></i>
                  </button>
                  <button @click="deleteMedico(medico.id)" class="btn btn--small btn--danger">
                    <i class="fas fa-trash"></i>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      <!-- Tab Usuarios -->
      <div v-if="activeTab === 'usuarios'" class="admin-panel__section">
        <div class="admin-panel__section-header">
          <h2>Gestión de Usuarios</h2>
          <button @click="showUsuarioForm = true" class="btn btn--primary">
            <i class="fas fa-plus"></i>
            Agregar Usuario
          </button>
        </div>
        
        <div class="admin-panel__table">
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Roles</th>
                <th>Estado</th>
                <th>Fecha Creación</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="usuario in usuarios" :key="usuario.id">
                <td>{{ usuario.nombre }}</td>
                <td>{{ usuario.correo }}</td>
                <td>{{ usuario.roles?.join(', ') }}</td>
                <td>
                  <span :class="['status', `status--${usuario.estado}`]">
                    {{ usuario.estado }}
                  </span>
                </td>
                <td>{{ formatDate(usuario.fecha_creacion) }}</td>
                <td>
                  <button @click="editUsuario(usuario)" class="btn btn--small">
                    <i class="fas fa-edit"></i>
                  </button>
                  <button @click="deleteUsuario(usuario.id)" class="btn btn--small btn--danger">
                    <i class="fas fa-trash"></i>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      <!-- Tab Pacientes -->
      <div v-if="activeTab === 'pacientes'" class="admin-panel__section">
        <div class="admin-panel__section-header">
          <h2>Gestión de Pacientes</h2>
          <button class="btn btn--primary">
            <i class="fas fa-plus"></i>
            Agregar Paciente
          </button>
        </div>
        
        <div class="admin-panel__table">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>DNI</th>
                <th>Teléfono</th>
                <th>Correo</th>
                <th>Fecha Nacimiento</th>
                <th>Estado</th>
                <th>Fecha Registro</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="paciente in pacientes" :key="paciente.id">
                <td>{{ paciente.id }}</td>
                <td>{{ paciente.nombre }}</td>
                <td>{{ paciente.dni }}</td>
                <td>{{ paciente.telefono }}</td>
                <td>{{ paciente.correo }}</td>
                <td>{{ formatDate(paciente.fecha_nacimiento) }}</td>
                <td>
                  <span :class="['status', `status--${paciente.estado}`]">
                    {{ paciente.estado }}
                  </span>
                </td>
                <td>{{ formatDate(paciente.fecha_registro) }}</td>
                <td>
                  <button class="btn btn--small btn--secondary">
                    <i class="fas fa-edit"></i>
                  </button>
                  <button class="btn btn--small btn--danger" @click="deletePaciente(paciente.id)">
                    <i class="fas fa-trash"></i>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      <!-- Tab Agenda -->
      <div class="admin-panel__agenda-section" v-if="activeTab === 'agenda'">
        <div class="admin-panel__section-header">
          <h3>Agenda de Médicos</h3>
          <div class="admin-panel__agenda-controls">
            <select v-model="selectedMedico" @change="loadCitas" class="admin-panel__select">
              <option value="">Seleccionar médico</option>
              <option v-for="medico in medicos" :key="medico.id" :value="medico.id">
                {{ medico.nombre }} - {{ medico.especialidad }}
              </option>
            </select>
            <button @click="showHorarioModal = true" class="btn btn--secondary">
              <i class="fas fa-clock"></i> Configurar Horarios
            </button>
            <button @click="showCitaModal = true" class="btn btn--primary">
              <i class="fas fa-plus"></i> Nueva Cita
            </button>
          </div>
        </div>

        <div class="admin-panel__calendar-container">
          <div class="admin-panel__calendar-header">
            <button @click="previousMonth" class="btn btn--secondary">
              <i class="fas fa-chevron-left"></i>
            </button>
            <h4>{{ currentMonthYear }}</h4>
            <button @click="nextMonth" class="btn btn--secondary">
              <i class="fas fa-chevron-right"></i>
            </button>
            <button @click="refreshCalendar" class="btn btn--secondary" title="Actualizar">
              <i class="fas fa-sync-alt"></i>
            </button>
          </div>

          <div class="admin-panel__calendar">
            <div class="admin-panel__calendar-weekdays">
              <div v-for="day in weekDays" :key="day" class="admin-panel__calendar-weekday">
                {{ day }}
              </div>
            </div>
            <div class="admin-panel__calendar-grid">
              <div 
                v-for="day in calendarDays" 
                :key="day.date"
                class="admin-panel__calendar-day"
                :class="{
                  'today': day.isToday,
                  'has-appointments': day.appointments && day.appointments.length > 0,
                  'other-month': !day.isCurrentMonth
                }"
                @click="selectDate(day)"
              >
                <span class="admin-panel__calendar-day-number">{{ day.dayNumber }}</span>
                <div v-if="day.appointments && day.appointments.length > 0" class="admin-panel__calendar-appointments">
                  <div class="admin-panel__appointment-indicator">
                    {{ day.appointments.length }} cita{{ day.appointments.length > 1 ? 's' : '' }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Tab Blog -->
      <div v-if="activeTab === 'blog'" class="admin-panel__section">
        <div class="admin-panel__section-header">
          <h2>Administración del Blog</h2>
          <button @click="goToBlogAdmin" class="btn btn--primary">
            <i class="fas fa-external-link-alt"></i>
            Ir al Blog Admin
          </button>
        </div>
        
        <div class="admin-panel__blog-preview">
          <div class="blog-stats">
            <div class="stat-card">
              <i class="fas fa-file-alt"></i>
              <div class="stat-info">
                <h3>Entradas</h3>
                <p>Gestionar contenido del blog</p>
              </div>
            </div>
            <div class="stat-card">
              <i class="fas fa-folder"></i>
              <div class="stat-info">
                <h3>Categorías</h3>
                <p>Organizar contenido</p>
              </div>
            </div>
            <div class="stat-card">
              <i class="fas fa-images"></i>
              <div class="stat-info">
                <h3>Media</h3>
                <p>Gestionar imágenes</p>
              </div>
            </div>
            <div class="stat-card">
              <i class="fas fa-bars"></i>
              <div class="stat-info">
                <h3>Menú</h3>
                <p>Configurar navegación</p>
              </div>
            </div>
          </div>
          
          <div class="blog-actions">
            <p>Accede al panel completo de administración del blog para:</p>
            <ul>
              <li>Crear y editar entradas del blog</li>
              <li>Gestionar categorías y tags</li>
              <li>Subir y organizar imágenes</li>
              <li>Configurar el menú dinámico</li>
              <li>Optimizar SEO de las entradas</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Tab Categorías -->
      <div v-if="activeTab === 'categorias'" class="admin-panel__section">
        <div class="admin-panel__section-header">
          <h2>Administración de Categorías</h2>
          <button @click="goToCategoryAdmin" class="btn btn--primary">
            <i class="fas fa-external-link-alt"></i>
            Ir al Administrador de Categorías
          </button>
        </div>
        
        <div class="admin-panel__blog-preview">
          <div class="blog-stats">
            <div class="stat-card">
              <i class="fas fa-tags"></i>
              <div class="stat-info">
                <h3>Categorías Principales</h3>
                <p>Gestionar categorías de nivel 0</p>
              </div>
            </div>
            <div class="stat-card">
              <i class="fas fa-sitemap"></i>
              <div class="stat-info">
                <h3>Subcategorías</h3>
                <p>Crear jerarquías de categorías</p>
              </div>
            </div>
            <div class="stat-card">
              <i class="fas fa-palette"></i>
              <div class="stat-info">
                <h3>Colores</h3>
                <p>Personalizar apariencia</p>
              </div>
            </div>
            <div class="stat-card">
              <i class="fas fa-sort"></i>
              <div class="stat-info">
                <h3>Orden</h3>
                <p>Configurar orden del menú</p>
              </div>
            </div>
          </div>
          
          <div class="blog-actions">
            <p>Accede al administrador completo de categorías para:</p>
            <ul>
              <li>Crear categorías principales (Investigación, Bitácora)</li>
              <li>Crear subcategorías jerárquicas (CÁNCER, CONDICIÓN, MOLÉCULA)</li>
              <li>Crear subcategorías específicas (cuello-uterino, mama, etc.)</li>
              <li>Editar y eliminar categorías existentes</li>
              <li>Personalizar colores y orden de visualización</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Modal Configurar Horarios -->
    <div v-if="showHorarioModal" class="modal-overlay" @click="showHorarioModal = false">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>Configurar Horarios - {{ selectedMedicoNombre }}</h3>
          <button @click="showHorarioModal = false" class="btn btn--small">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <div class="horario-config">
            <div v-for="(day, index) in weekDays" :key="index" class="horario-day">
              <div class="day-header">
                <label class="checkbox-label">
                  <input type="checkbox" v-model="horariosConfig[index].activo">
                  <span>{{ day }}</span>
                </label>
              </div>
              <div v-if="horariosConfig[index].activo" class="day-hours">
                <div class="time-range">
                  <label>Inicio:</label>
                  <input type="time" v-model="horariosConfig[index].inicio" class="form-input">
                </div>
                <div class="time-range">
                  <label>Fin:</label>
                  <input type="time" v-model="horariosConfig[index].fin" class="form-input">
                </div>
                <div class="time-range">
                  <label>Duración cita (min):</label>
                  <input type="number" v-model="horariosConfig[index].duracion" min="15" max="120" step="15" class="form-input">
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="showHorarioModal = false" class="btn btn--secondary">Cancelar</button>
          <button @click="saveHorarios" class="btn btn--primary">Guardar Horarios</button>
        </div>
      </div>
    </div>
    
    <!-- Modal Nueva Cita -->
    <div v-if="showCitaModal" class="modal-overlay" @click="showCitaModal = false">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>Nueva Cita</h3>
          <button @click="showCitaModal = false" class="btn btn--small">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="createCita" class="cita-form">
            <div class="form-group">
              <label>Médico:</label>
              <select v-model="nuevaCita.medico_id" required class="form-select">
                <option value="">Seleccionar médico</option>
                <option v-for="medico in medicos" :key="medico.id" :value="medico.id">
                  {{ medico.nombre }} - {{ medico.especialidad }}
                </option>
              </select>
            </div>
            <div class="form-group">
              <label>Paciente:</label>
              <select v-model="nuevaCita.paciente_id" required class="form-select">
                <option value="">Seleccionar paciente</option>
                <option v-for="paciente in pacientes" :key="paciente.id" :value="paciente.id">
                  {{ paciente.nombre }} - {{ paciente.dni }}
                </option>
              </select>
            </div>
            <div class="form-group">
              <label>Fecha:</label>
              <input type="date" v-model="nuevaCita.fecha" required class="form-input">
            </div>
            <div class="form-group">
              <label>Hora:</label>
              <input type="time" v-model="nuevaCita.hora" required class="form-input">
            </div>
            <div class="form-group">
              <label>Duración (minutos):</label>
              <input type="number" v-model="nuevaCita.duracion" min="15" max="120" step="15" required class="form-input">
            </div>
            <div class="form-group">
              <label>Motivo:</label>
              <textarea v-model="nuevaCita.motivo" rows="3" class="form-input"></textarea>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button @click="showCitaModal = false" class="btn btn--secondary">Cancelar</button>
          <button @click="createCita" class="btn btn--primary">Crear Cita</button>
        </div>
      </div>
    </div>

    <!-- Modal Usuario -->
    <div v-if="showUsuarioForm" class="modal-overlay" @click="showUsuarioForm = false">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>{{ editingUsuario ? 'Editar Usuario' : 'Nuevo Usuario' }}</h3>
          <button @click="closeUsuarioForm" class="btn btn--small">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="saveUsuario" class="usuario-form">
            <div class="form-group">
              <label>Nombre:</label>
              <input 
                type="text" 
                v-model="usuarioForm.nombre" 
                required 
                class="form-input"
                placeholder="Nombre completo del usuario"
              >
            </div>
            <div class="form-group">
              <label>Correo electrónico:</label>
              <input 
                type="email" 
                v-model="usuarioForm.correo" 
                required 
                class="form-input"
                placeholder="correo@ejemplo.com"
              >
            </div>
            <div class="form-group">
              <label>Contraseña:</label>
              <input 
                type="password" 
                v-model="usuarioForm.contraseña" 
                :required="!editingUsuario"
                class="form-input"
                :placeholder="editingUsuario ? 'Dejar vacío para mantener la actual' : 'Contraseña del usuario'"
              >
            </div>
            <div class="form-group">
              <label>Estado:</label>
              <select v-model="usuarioForm.estado" required class="form-select">
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
              </select>
            </div>
            <div class="form-group">
              <label>Roles:</label>
              <div class="checkbox-group">
                <label v-for="rol in rolesDisponibles" :key="rol.id" class="checkbox-label">
                  <input 
                    type="checkbox" 
                    :value="rol.id" 
                    v-model="usuarioForm.roles"
                    class="checkbox-input"
                  >
                  <span class="checkbox-text">{{ rol.nombre }}</span>
                  <small v-if="rol.descripcion" class="checkbox-description">{{ rol.descripcion }}</small>
                </label>
              </div>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button @click="closeUsuarioForm" class="btn btn--secondary">Cancelar</button>
          <button @click="saveUsuario" class="btn btn--primary">
            {{ editingUsuario ? 'Actualizar' : 'Crear' }} Usuario
          </button>
        </div>
      </div>
    </div>

    <!-- Modal Detalles de Citas -->
    <div v-if="showCitasModal" class="modal-overlay" @click="showCitasModal = false">
      <div class="modal modal--large" @click.stop>
        <div class="modal-header">
          <h3>Citas del {{ selectedDateFormatted }}</h3>
          <button @click="showCitasModal = false" class="modal-close">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <div v-if="selectedDateCitas.length === 0" class="admin-panel__empty-state">
            <i class="fas fa-calendar-day"></i>
            <p>No hay citas programadas para este día</p>
          </div>
          <div v-else class="admin-panel__citas-list">
            <div v-for="cita in selectedDateCitas" :key="cita.id" class="admin-panel__cita-item">
              <div class="admin-panel__cita-header">
                <div class="admin-panel__cita-time">
                  <i class="fas fa-clock"></i>
                  {{ formatCitaTime(cita.fecha) }}
                </div>
                <div class="admin-panel__cita-status" :class="`status--${cita.estado}`">
                  {{ cita.estado }}
                </div>
              </div>
              <div class="admin-panel__cita-details">
                <div class="admin-panel__cita-patient">
                  <h4><i class="fas fa-user"></i> {{ cita.paciente_nombre }}</h4>
                  <p><strong>DNI:</strong> {{ cita.paciente_dni }}</p>
                  <p><strong>Teléfono:</strong> {{ cita.paciente_telefono }}</p>
                </div>
                <div class="admin-panel__cita-medical">
                  <p><strong>Médico:</strong> {{ cita.medico_nombre }}</p>
                  <p><strong>Especialidad:</strong> {{ cita.especialidad_nombre }}</p>
                  <p><strong>Duración:</strong> {{ cita.duracion }} minutos</p>
                </div>
                <div class="admin-panel__cita-motive" v-if="cita.motivo">
                  <p><strong>Motivo:</strong> {{ cita.motivo }}</p>
                </div>
              </div>
              <div class="admin-panel__cita-actions">
                <button @click="editCita(cita)" class="btn btn--small btn--secondary">
                  <i class="fas fa-edit"></i> Editar
                </button>
                <button @click="cancelCita(cita.id)" class="btn btn--small btn--danger">
                  <i class="fas fa-times"></i> Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
      </main>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'AdminPanel',
  data() {
    return {
      activeTab: 'medicos',
      sidebarCollapsed: false, // Panel lateral visible por defecto
      adminUser: null,
      medicos: [],
      usuarios: [],
      pacientes: [],
      citas: [],
      showMedicoForm: false,
      showUsuarioForm: false,
      editingUsuario: null, // Usuario que se está editando (null para nuevo usuario)
      usuarioForm: {
        nombre: '',
        correo: '',
        contraseña: '',
        estado: 'activo',
        roles: []
      },
      rolesDisponibles: [], // Lista de roles disponibles
      showPacienteForm: false,
      showHorarioModal: false,
      showCitaModal: false,
      showCitasModal: false, // Nuevo modal para detalles de citas
      selectedMedico: '',
      selectedDate: null,
      selectedDateCitas: [], // Citas del día seleccionado
      currentDate: new Date(),
      updateInterval: null, // Para las actualizaciones en tiempo real
      weekDays: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
      horariosConfig: [
        { activo: false, inicio: '09:00', fin: '17:00', duracion: 30 },
        { activo: false, inicio: '09:00', fin: '17:00', duracion: 30 },
        { activo: false, inicio: '09:00', fin: '17:00', duracion: 30 },
        { activo: false, inicio: '09:00', fin: '17:00', duracion: 30 },
        { activo: false, inicio: '09:00', fin: '17:00', duracion: 30 },
        { activo: false, inicio: '09:00', fin: '17:00', duracion: 30 },
        { activo: false, inicio: '09:00', fin: '17:00', duracion: 30 }
      ],
      nuevaCita: {
        medico_id: '',
        paciente_id: '',
        fecha: '',
        hora: '',
        duracion: 30,
        motivo: ''
      },
      tabs: [
        { id: 'medicos', name: 'Médicos', icon: 'fas fa-user-md' },
        { id: 'usuarios', name: 'Usuarios', icon: 'fas fa-users' },
        { id: 'pacientes', name: 'Pacientes', icon: 'fas fa-user-injured' },
        { id: 'agenda', name: 'Agenda', icon: 'fas fa-calendar-alt' },
        { id: 'blog', name: 'Blog', icon: 'fas fa-blog' },
        { id: 'categorias', name: 'Categorías', icon: 'fas fa-tags' }
      ]
    }
  },
  computed: {
    currentMonthYear() {
      return this.currentDate.toLocaleDateString('es-ES', { 
        month: 'long', 
        year: 'numeric' 
      }).replace(/^\w/, c => c.toUpperCase())
    },
    selectedMedicoNombre() {
      const medico = this.medicos.find(m => m.id == this.selectedMedico)
      return medico ? medico.nombre : ''
    },
    calendarDays() {
      const year = this.currentDate.getFullYear()
      const month = this.currentDate.getMonth()
      const firstDay = new Date(Date.UTC(year, month, 1))
      const lastDay = new Date(Date.UTC(year, month + 1, 0))
      
      // Obtener el día de la semana del primer día (0 = domingo, 1 = lunes, etc.)
      let firstDayOfWeek = firstDay.getUTCDay()
      // Convertir a lunes = 0, domingo = 6
      firstDayOfWeek = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1
      
      const days = []
      const today = new Date()
      
      // Agregar días del mes anterior para completar la primera semana
      const startDate = new Date(firstDay)
      startDate.setUTCDate(startDate.getUTCDate() - firstDayOfWeek)
      
      // Generar 42 días (6 semanas x 7 días)
      for (let i = 0; i < 42; i++) {
        const date = new Date(startDate)
        date.setUTCDate(startDate.getUTCDate() + i)
        
        const dateStr = date.toISOString().split('T')[0]
        const isToday = date.toISOString().split('T')[0] === today.toISOString().split('T')[0]
        const isCurrentMonth = date.getUTCMonth() === month
        
        // Buscar citas para este día
        const citasDelDia = this.citas.filter(cita => {
          const citaDate = new Date(cita.fecha)
          return citaDate.toISOString().split('T')[0] === dateStr
        })
        
        days.push({
          date: dateStr,
          dayNumber: date.getUTCDate(),
          isCurrentMonth,
          isToday,
          appointments: citasDelDia
        })
      }
      
      return days
    },
    selectedDateFormatted() {
      if (!this.selectedDate) return '';
      // Usamos la fecha directamente sin ajustes de zona horaria
      const [year, month, day] = this.selectedDate.date.split('-');
      const fecha = new Date(year, month - 1, day);
      return fecha.toLocaleDateString('es-ES', { 
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    }
  },
      watch: {
      selectedMedico: {
        immediate: true,
        handler(newValue) {
          if (this.activeTab === 'agenda') {
            this.loadCitas()
          }
        }
      },
      activeTab: {
        immediate: true,
        handler(newValue) {
          if (newValue === 'agenda') {
            this.loadCitas()
          }
        }
      },
      citas: {
        deep: true,
        handler() {
          if (this.activeTab === 'agenda') {
            this.$nextTick(() => {
              this.updateCalendarDays()
            })
          }
        }
      }
    },
  async mounted() {
    // Verificar si hay token de admin
    const token = localStorage.getItem('adminToken')
    if (!token) {
      this.$router.push('/')
      return
    }
    
    // Configurar axios para incluir el token
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    
    await this.loadData()
    
    // Iniciar actualización en tiempo real del calendario
    this.startRealTimeUpdates()
  },
  
  beforeDestroy() {
    // Limpiar el intervalo cuando se destruye el componente
    if (this.updateInterval) {
      clearInterval(this.updateInterval)
    }
  },
  methods: {
    // Métodos del Sidebar
    toggleSidebar() {
      this.sidebarCollapsed = !this.sidebarCollapsed
    },
    
    selectTab(tabId) {
      this.activeTab = tabId
      // En móviles, cerrar el sidebar después de seleccionar
      if (window.innerWidth <= 768) {
        this.sidebarCollapsed = true
      }
    },
    
    async loadData() {
      try {
        const [medicosRes, usuariosRes, pacientesRes, rolesRes] = await Promise.all([
          axios.get('/api/admin/medicos'),
          axios.get('/api/admin/usuarios'),
          axios.get('/api/admin/pacientes'),
          axios.get('/api/admin/roles')
        ])
        
        this.medicos = medicosRes.data
        this.usuarios = usuariosRes.data
        this.pacientes = pacientesRes.data
        this.rolesDisponibles = rolesRes.data
      } catch (error) {
        console.error('Error cargando datos:', error)
      }
    },
    
    async loadCitas() {
      try {
        let url = '/api/admin/citas'
        if (this.selectedMedico) {
          const medicoId = parseInt(this.selectedMedico)
          url = `/api/admin/citas?medico_id=${medicoId}`
          console.log('🔄 Cargando citas para médico ID:', medicoId)
        } else {
          url = '/api/admin/citas'
          console.log('🔄 Cargando todas las citas')
        }
        
        const response = await axios.get(url)
        console.log('📊 Citas cargadas:', response.data)
        this.citas = response.data
      } catch (error) {
        console.error('Error cargando citas:', error)
        this.citas = []
      }
    },
    
    updateCalendarDays() {
      // Actualizar las citas en los días del calendario
      this.calendarDays.forEach(day => {
        const citasDelDia = this.citas.filter(cita => {
          const citaDate = new Date(cita.fecha).toISOString().split('T')[0]
          return citaDate === day.date
        })
        day.appointments = citasDelDia
      })
    },
    
    editMedico(medico) {
      // Implementar edición de médico
      console.log('Editar médico:', medico)
    },
    
    async deleteMedico(id) {
      if (confirm('¿Estás seguro de eliminar este médico?')) {
        try {
          await axios.delete(`/api/admin/medicos/${id}`)
          await this.loadData()
        } catch (error) {
          console.error('Error eliminando médico:', error)
        }
      }
    },
    
    editUsuario(usuario) {
      this.editingUsuario = usuario
      this.usuarioForm = {
        nombre: usuario.nombre,
        correo: usuario.correo,
        contraseña: '', // No pre-llenar la contraseña por seguridad
        estado: usuario.estado,
        roles: this.getUsuarioRolesIds(usuario)
      }
      this.showUsuarioForm = true
    },
    
    getUsuarioRolesIds(usuario) {
      // Obtener los IDs de los roles del usuario
      if (!usuario.roles || !this.rolesDisponibles.length) return []
      
      return this.rolesDisponibles
        .filter(rol => usuario.roles.includes(rol.nombre))
        .map(rol => rol.id)
    },
    
    closeUsuarioForm() {
      this.showUsuarioForm = false
      this.editingUsuario = null
      this.usuarioForm = {
        nombre: '',
        correo: '',
        contraseña: '',
        estado: 'activo',
        roles: []
      }
    },
    
    async saveUsuario() {
      try {
        // Validaciones del frontend
        if (!this.usuarioForm.nombre.trim()) {
          alert('El nombre es requerido')
          return
        }
        if (!this.usuarioForm.correo.trim()) {
          alert('El correo es requerido')
          return
        }
        if (!this.editingUsuario && !this.usuarioForm.contraseña.trim()) {
          alert('La contraseña es requerida para nuevos usuarios')
          return
        }
        
        // Preparar datos para enviar
        const userData = {
          nombre: this.usuarioForm.nombre.trim(),
          correo: this.usuarioForm.correo.trim(),
          estado: this.usuarioForm.estado,
          roles: this.usuarioForm.roles
        }
        
        // Solo incluir contraseña si se proporcionó
        if (this.usuarioForm.contraseña.trim()) {
          userData.contraseña = this.usuarioForm.contraseña.trim()
        }
        
        let response
        if (this.editingUsuario) {
          // Actualizar usuario existente
          response = await axios.put(`/api/admin/usuarios/${this.editingUsuario.id}`, userData)
        } else {
          // Crear nuevo usuario
          response = await axios.post('/api/admin/usuarios', userData)
        }
        
        if (response.data.success) {
          alert(response.data.message)
          this.closeUsuarioForm()
          await this.loadData() // Recargar la lista de usuarios
        }
      } catch (error) {
        console.error('Error guardando usuario:', error)
        if (error.response && error.response.data && error.response.data.error) {
          alert(`Error: ${error.response.data.error}`)
        } else {
          alert('Error al guardar el usuario. Inténtalo de nuevo.')
        }
      }
    },
    
    async deleteUsuario(id) {
      if (confirm('¿Estás seguro de eliminar este usuario?')) {
        try {
          await axios.delete(`/api/admin/usuarios/${id}`)
          await this.loadData()
        } catch (error) {
          console.error('Error eliminando usuario:', error)
        }
      }
    },
    
    editPaciente(paciente) {
      // Implementar edición de paciente
      console.log('Editar paciente:', paciente)
    },
    
    async deletePaciente(id) {
      if (confirm('¿Estás seguro de eliminar este paciente?')) {
        try {
          await axios.delete(`/api/admin/pacientes/${id}`)
          await this.loadData()
        } catch (error) {
          console.error('Error eliminando paciente:', error)
        }
      }
    },
    
    goToBlogAdmin() {
      this.$router.push('/admin/blog')
    },
    
    goToCategoryAdmin() {
      this.$router.push('/admin/categorias')
    },
    
    formatDate(date) {
      if (!date) return '-'
      return new Date(date).toLocaleDateString('es-ES')
    },
    
    logout() {
      localStorage.removeItem('adminToken')
      localStorage.removeItem('adminUser')
      this.$router.push('/')
    },
    
    // Métodos para agenda
    viewAgenda(medico) {
      this.selectedMedico = medico.id
      this.activeTab = 'agenda'
      this.loadCitas() // Cargar citas al cambiar de médico
    },
    
    previousMonth() {
      this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() - 1, 1)
    },
    
    nextMonth() {
      this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 1)
    },
    
    selectDate(day) {
      this.selectedDate = day
      this.showCitasDetails() // Cargar citas para el día seleccionado
    },
    
    async saveHorarios() {
      try {
        // Aquí se enviaría la configuración de horarios al backend
        console.log('Guardando horarios:', this.horariosConfig)
        this.showHorarioModal = false
        // await axios.post(`/api/admin/medicos/${this.selectedMedico}/horarios`, this.horariosConfig)
      } catch (error) {
        console.error('Error guardando horarios:', error)
      }
    },
    
    async createCita() {
      try {
        // Aquí se enviaría la nueva cita al backend
        console.log('Creando cita:', this.nuevaCita)
        this.showCitaModal = false
        // await axios.post('/api/admin/citas', this.nuevaCita)
        
        // Limpiar formulario
        this.nuevaCita = {
          medico_id: '',
          paciente_id: '',
          fecha: '',
          hora: '',
          duracion: 30,
          motivo: ''
        }
      } catch (error) {
        console.error('Error creando cita:', error)
      }
    },

    // Nuevo método para mostrar detalles de citas
    async showCitasDetails() {
      if (this.selectedDate) {
        try {
          // Usamos directamente la fecha del día seleccionado sin ajustes de zona horaria
          const fechaStr = this.selectedDate.date;
          console.log('📅 Consultando citas para fecha:', fechaStr);
          
          const response = await axios.get(`/api/admin/citas?fecha=${fechaStr}`);
          this.selectedDateCitas = response.data;
          this.showCitasModal = true;
        } catch (error) {
          console.error('Error cargando citas del día:', error);
        }
      }
    },

    // Nuevo método para editar cita
    editCita(cita) {
      this.nuevaCita = {
        medico_id: cita.medico_id,
        paciente_id: cita.paciente_id,
        fecha: cita.fecha,
        hora: cita.hora,
        duracion: cita.duracion,
        motivo: cita.motivo
      };
      this.showCitaModal = true;
      this.showCitasModal = false; // Cerrar el modal de detalles
    },

    // Nuevo método para cancelar cita
    async cancelCita(id) {
      if (confirm('¿Estás seguro de cancelar esta cita?')) {
        try {
          await axios.put(`/api/admin/citas/${id}/cancelar`);
          await this.loadCitas(); // Recargar citas para actualizar el estado
          this.showCitasModal = false;
        } catch (error) {
          console.error('Error cancelando cita:', error);
        }
      }
    },

    formatCitaTime(dateString) {
      const date = new Date(dateString);
      // Extraemos solo la hora y minutos sin ajustes de zona horaria
      const hours = date.getUTCHours().toString().padStart(2, '0');
      const minutes = date.getUTCMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    },
    
    // Método para iniciar actualizaciones en tiempo real
    startRealTimeUpdates() {
      // Actualizar cada 30 segundos si hay un médico seleccionado
      this.updateInterval = setInterval(() => {
        if (this.selectedMedico && this.activeTab === 'agenda') {
          this.loadCitas()
        }
      }, 30000) // 30 segundos
    },
    
    // Método para actualizar el calendario inmediatamente
    async refreshCalendar() {
      if (this.selectedMedico) {
        await this.loadCitas()
        this.updateCalendarDays()
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.admin-panel {
  min-height: 100vh;
  background: $bg-light;
  
  &__header {
    background: white;
    padding: 2rem;
    border-bottom: 1px solid $border-color;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  &__title {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  
  &__sidebar-toggle {
    display: block;
    background: none;
    border: none;
    font-size: 1.5rem;
    color: $text-primary;
    cursor: pointer;
    padding: 0.5rem;
    border-radius: 4px;
    transition: background-color 0.2s;
    
    &:hover {
      background: $bg-light;
    }
  }
  
  &__layout {
    display: flex;
    min-height: calc(100vh - 100px);
  }
  
  &__sidebar {
    width: 280px;
    background: white;
    border-right: 1px solid $border-color;
    transition: all 0.3s ease;
    position: relative;
    z-index: 1000;
    
    &--collapsed {
      width: 0;
      overflow: hidden;
      border-right: none;
    }
    
    @media (max-width: 768px) {
      position: fixed;
      top: 0;
      left: 0;
      height: 100vh;
      z-index: 1001;
      
      &--collapsed {
        width: 0;
        transform: translateX(-100%);
      }
    }
  }
  
  &__sidebar-header {
    padding: 1.5rem;
    border-bottom: 1px solid $border-color;
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    h3 {
      margin: 0;
      color: $text-primary;
      font-size: 1.1rem;
    }
  }
  
  &__sidebar-close {
    display: none;
    background: none;
    border: none;
    font-size: 1.2rem;
    color: $text-secondary;
    cursor: pointer;
    padding: 0.25rem;
    border-radius: 4px;
    
    &:hover {
      background: $bg-light;
    }
    
    @media (max-width: 768px) {
      display: block;
    }
  }
  
  &__sidebar-nav {
    padding: 1rem 0;
  }
  
  &__sidebar-item {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem 1.5rem;
    background: none;
    border: none;
    text-align: left;
    cursor: pointer;
    transition: all 0.2s;
    color: $text-secondary;
    font-size: 0.95rem;
    
    &:hover {
      background: $bg-light;
      color: $text-primary;
    }
    
    &--active {
      background: $primary-color;
      color: white;
      
      &:hover {
        background: darken($primary-color, 10%);
      }
    }
    
    i {
      font-size: 1.1rem;
      width: 20px;
      text-align: center;
    }
  }
  
  &__sidebar-text {
    font-weight: 500;
  }
  
  &__overlay {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 999;
    
    @media (max-width: 768px) {
      display: block;
    }
  }
  
  &__main {
    flex: 1;
    background: $bg-light;
    overflow-x: auto;
  }
  
  &__logo {
    display: block;
    text-decoration: none;
    transition: transform 0.3s ease;
    
    &:hover {
      transform: scale(1.05);
    }
    
    img {
      height: 50px;
      width: auto;
      object-fit: contain;
    }
  }
  
  &__title-text {
    h1 {
      margin: 0 0 0.5rem 0;
      color: $text-primary;
      font-size: 1.5rem;
    }
    
    p {
      margin: 0;
      color: $text-secondary;
      font-size: 0.9rem;
    }
  }
  
  &__user {
    display: flex;
    align-items: center;
    gap: 1rem;
    
    span {
      color: $text-secondary;
    }
  }
  
  
  &__content {
    padding: 2rem;
  }
  
  &__section {
    background: white;
    border-radius: 12px;
    padding: 2rem;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  }
  
  &__section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
    
    h2 {
      margin: 0;
      color: $text-primary;
    }
  }
  
  &__table {
    overflow-x: auto;
    
    table {
      width: 100%;
      border-collapse: collapse;
      
      th, td {
        padding: 1rem;
        text-align: left;
        border-bottom: 1px solid $border-color;
      }
      
      th {
        background: $bg-light;
        font-weight: 600;
        color: $text-primary;
      }
      
      td {
        color: $text-secondary;
      }
    }
  }
}

.status {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
  
  &--activo {
    background: #dcfce7;
    color: #166534;
  }
  
  &--inactivo {
    background: #fef2f2;
    color: #dc2626;
  }
  
  &--suspendido {
    background: #fef3c7;
    color: #92400e;
  }
}

.btn--danger {
  background: $error-color;
  color: white;
  
  &:hover {
    background: darken($error-color, 10%);
  }
}

// Estilos para agenda
.admin-panel__agenda-controls {
  display: flex;
  gap: 1rem;
  align-items: center;
  margin-bottom: 1rem;
}

.admin-panel__select {
  padding: 0.5rem;
  border: 1px solid $border-color;
  border-radius: 4px;
  background: white;
  min-width: 250px;
}

.admin-panel__calendar-container {
  background: white;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.admin-panel__calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding: 0 1rem;
  
  h4 {
    margin: 0;
    font-size: 1.2rem;
    font-weight: 600;
    color: $text-primary;
  }
  
  button {
    padding: 0.5rem;
    min-width: 40px;
    
    &:hover {
      background: $primary-color;
      color: white;
    }
  }
}

.calendar-grid {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.calendar-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  background: $primary-color;
  color: white;
  
  .weekday {
    padding: 1rem;
    text-align: center;
    font-weight: 600;
    font-size: 0.9rem;
  }
}

.calendar-days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
}

.calendar-day {
  min-height: 80px;
  padding: 0.5rem;
  border: 1px solid $border-color;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  
  &:hover {
    background: $bg-light;
  }
  
  &.other-month {
    background: #f8f9fa;
    color: #6c757d;
  }
  
  &.today {
    background: $primary-color;
    color: white;
    
    .day-number {
      font-weight: bold;
    }
  }
  
  &.has-appointments {
    background: #e3f2fd;
    
    .appointment-indicator {
      background: $accent-color;
      color: white;
      font-size: 0.7rem;
      padding: 2px 6px;
      border-radius: 10px;
      position: absolute;
      bottom: 4px;
      right: 4px;
    }
  }
  
  .day-number {
    font-size: 0.9rem;
    font-weight: 500;
  }
}

.admin-panel__empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: $text-secondary;
  
  i {
    font-size: 3rem;
    margin-bottom: 1rem;
    color: $border-color;
  }
  
  h3 {
    margin: 0 0 0.5rem 0;
    color: $text-primary;
  }
  
  p {
    margin: 0;
  }
}

// Estilos para modales
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: 12px;
  max-width: 600px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.modal--large {
  max-width: 900px;
  max-height: 95vh;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid $border-color;
  
  h3 {
    margin: 0;
    color: $text-primary;
  }
}

.modal-body {
  padding: 1.5rem;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1.5rem;
  border-top: 1px solid $border-color;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding-top: 1rem;
}

.modal-close {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.5rem;
  color: $text-secondary;
  transition: color 0.2s ease;

  &:hover {
    color: $primary-color;
  }
}

// Estilos para configuración de horarios
.horario-config {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.horario-day {
  border: 1px solid $border-color;
  border-radius: 8px;
  padding: 1rem;
  
  .day-header {
    margin-bottom: 1rem;
  }
  
  .day-hours {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 1rem;
  }
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-weight: 500;
  
  input[type="checkbox"] {
    width: 18px;
    height: 18px;
  }
}

.time-range {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  
  label {
    font-size: 0.8rem;
    color: $text-secondary;
  }
}

// Estilos para formulario de citas
.cita-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  
  label {
    font-weight: 500;
    color: $text-primary;
  }
}

.form-input, .form-select {
  padding: 0.75rem;
  border: 1px solid $border-color;
  border-radius: 6px;
  font-size: 0.9rem;
  
  &:focus {
    outline: none;
    border-color: $primary-color;
    box-shadow: 0 0 0 2px rgba($primary-color, 0.1);
  }
}

textarea.form-input {
  resize: vertical;
  min-height: 80px;
}

.admin-panel__citas-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.admin-panel__cita-item {
  background: $bg-light;
  border: 1px solid $border-color;
  border-radius: 8px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.admin-panel__cita-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.admin-panel__cita-time {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: $text-primary;
}

.admin-panel__cita-status {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
  color: white;

  &--pendiente {
    background: $warning-color;
  }
  &--confirmada {
    background: $success-color;
  }
  &--cancelada {
    background: $error-color;
  }
}

.admin-panel__cita-details {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.5rem;
}

.admin-panel__cita-patient,
.admin-panel__cita-medical {
  flex: 1;
}

.admin-panel__cita-patient h4 {
  margin: 0 0 0.25rem 0;
  color: $text-primary;
}

.admin-panel__cita-patient p,
.admin-panel__cita-medical p {
  margin: 0;
  color: $text-secondary;
  font-size: 0.9rem;
}

.admin-panel__cita-motive {
  margin-top: 0.5rem;
  color: $text-secondary;
  font-size: 0.9rem;
}

.admin-panel__cita-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.admin-panel__calendar {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.admin-panel__calendar-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  background: $primary-color;
  color: white;
  font-weight: 600;
}

.admin-panel__calendar-weekday {
  padding: 1rem 0.5rem;
  text-align: center;
  border-right: 1px solid rgba(255, 255, 255, 0.2);
  
  &:last-child {
    border-right: none;
  }
}

.admin-panel__calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
  background: $border-color;
}

.admin-panel__calendar-day {
  background: white;
  min-height: 80px;
  padding: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;

  &:hover {
    background: $bg-light;
  }

  &.today {
    background: lighten($primary-color, 45%);
    border: 2px solid $primary-color;
  }

  &.has-appointments {
    background: lighten($success-color, 45%);
    border: 2px solid $success-color;
  }

  &.other-month {
    background: #f8f9fa;
    color: $text-secondary;
  }
}

.admin-panel__calendar-day-number {
  font-weight: 600;
  font-size: 1.1rem;
  color: $text-primary;
}

.admin-panel__calendar-appointments {
  margin-top: auto;
}

.admin-panel__appointment-indicator {
  background: $success-color;
  color: white;
  font-size: 0.7rem;
  padding: 0.2rem 0.4rem;
  border-radius: 10px;
  text-align: center;
  font-weight: 500;
}

// Estilos para el tab del blog
.admin-panel__blog-preview {
  padding: 2rem;
  
  .blog-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
    
    .stat-card {
      display: flex;
      align-items: center;
      padding: 1.5rem;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      transition: transform 0.2s ease;
      
      &:hover {
        transform: translateY(-2px);
      }
      
      i {
        font-size: 2rem;
        color: $primary-color;
        margin-right: 1rem;
      }
      
      .stat-info {
        h3 {
          margin: 0 0 0.5rem 0;
          color: $text-primary;
        }
        
        p {
          margin: 0;
          color: $text-secondary;
          font-size: 0.9rem;
        }
      }
    }
  }
  
  .blog-actions {
    background: white;
    padding: 2rem;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    
    p {
      margin: 0 0 1rem 0;
      color: $text-primary;
      font-weight: 500;
    }
    
    ul {
      margin: 0;
      padding-left: 1.5rem;
      
      li {
        margin-bottom: 0.5rem;
        color: $text-secondary;
        
        &:last-child {
          margin-bottom: 0;
        }
      }
    }
  }

  // Estilos para formulario de usuarios
  .usuario-form {
    .form-group {
      margin-bottom: 1rem;
      
      label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 600;
        color: #333;
      }
      
      .form-input, .form-select {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 1rem;
        
        &:focus {
          outline: none;
          border-color: #007bff;
          box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
        }
      }
    }
    
    .checkbox-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      
      .checkbox-label {
        display: flex;
        align-items: flex-start;
        gap: 0.5rem;
        cursor: pointer;
        padding: 0.5rem;
        border-radius: 4px;
        transition: background-color 0.2s;
        
        &:hover {
          background-color: #f8f9fa;
        }
        
        .checkbox-input {
          margin: 0;
          margin-top: 0.2rem;
        }
        
        .checkbox-text {
          font-weight: 500;
          color: #333;
        }
        
        .checkbox-description {
          display: block;
          color: #666;
          font-size: 0.875rem;
          margin-top: 0.25rem;
        }
      }
    }
  }
}
</style> 