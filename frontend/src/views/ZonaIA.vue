<template>
  <div class="zona-ia">
    <Navbar @show-admin-login="showAdminLogin" @show-appointment-modal="showAppointmentModal" />

    <main class="main-content">
      <div class="container">
        <div class="page-header">
          <h1 class="page-title">
            <i class="fas fa-brain"></i>
            Oncosapien 
          </h1>
          <p class="page-description">
            Explora nuestras herramientas potenciadas por inteligencia artificial para ayudarte en diferentes tareas clínicas y administrativas.
          </p>
        </div>

        <div class="ia-tools-grid">
          <!-- Onkos View -->
          <div class="ia-tool-card">
            <div class="ia-tool-image">
              <img src="@/assets/images/onkos_view.jpg" alt="Onkos View" class="tool-image">
            </div>
            <h3 class="ia-tool-title">Analizador de Imágenes</h3>
            <p class="ia-tool-desc">Análisis de imágenes médicas asistido por IA. Sube radiografías, resonancias, tomografías o fotos clínicas.</p>
            <div class="tool-button-container">
              <router-link to="/exam-reader" class="btn btn-primary">Abrir</router-link>
            </div>
          </div>

          <!-- Onkos Sapiens -->
          <div class="ia-tool-card coming-soon">
            <div class="coming-soon-banner">PRÓXIMAMENTE</div>
            <div class="ia-tool-image">
              <img src="@/assets/images/onkos_sapiens.jpg" alt="Onkos Sapiens" class="tool-image">
            </div>
            <h3 class="ia-tool-title">Asistente Clínico</h3>
            <p class="ia-tool-desc">Asistente clínico guiado por IA con analisis de datos en apoyo a la toma de decisiones.</p>
            <div class="tool-button-container">
              <button class="btn btn-secondary" disabled>Abrir</button>
            </div>
          </div>

          <!-- Onkos Entrevistador -->
          <div class="ia-tool-card coming-soon">
            <div class="coming-soon-banner">PRÓXIMAMENTE</div>
            <div class="ia-tool-image">
              <img src="@/assets/images/onkos_entrevistador.jpg" alt="Onkos Entrevistador" class="tool-image">
            </div>
            <h3 class="ia-tool-title">Entrevistador de Pacientes</h3>
            <p class="ia-tool-desc">Asistente conversacional guiado por IA para pre-consultas y recopilación de antecedentes.</p>
            <div class="tool-button-container">
              <button class="btn btn-secondary" disabled>Abrir</button>
            </div>
          </div>
        </div>
      </div>
    </main>

    <footer class="footer">
      <div class="container">
        <div class="footer__content">
          <div class="footer__section">
            <h3>Onkos Instituto del Cáncer</h3>
            <p style="color: white;">Centro especializado en oncología comprometido con la excelencia médica y el cuidado compasivo de nuestros pacientes.</p>
           
          </div>

          <div class="footer__section">
            <h4>Servicios</h4>
            <ul>
              <li><a href="/servicios">Consultas Oncológicas</a></li>
              <li><a href="/servicios">Quimioterapia</a></li>
              <li><a href="/servicios">Radioterapia</a></li>
              <li><a href="/servicios">Cirugía Oncológica</a></li>
            </ul>
            <h4>Enlaces Rápidos</h4>
            <ul>
              <li><router-link to="/">Inicio</router-link></li>
              <li><router-link to="/especialistas">Especialistas</router-link></li>
              <li><router-link to="/blog">Blog</router-link></li>
              <li><router-link to="/investigacion">Investigación</router-link></li>
              <li><router-link to="/contacto">Contacto</router-link></li>
            </ul>
          </div>

          <div class="footer__section">
            <h4>Contacto</h4>
            <ul>
              <li><i class="fas fa-phone"></i> (+51) 933 598 495</li>
              <li><i class="fas fa-envelope"></i> contacto@onkos.com</li>
              <li><i class="fas fa-map-marker-alt"></i> Av Brasil 3621, Magdalena del Mar. Lima - Perú</li>
              <li><i class="fas fa-clock"></i> Lunes-Viernes, 9am a 6pm</li>
            </ul>
            <div class="footer__social">
              <a href="#"><i class="fab fa-facebook"></i></a>
              <a href="#"><i class="fab fa-twitter"></i></a>
              <a href="#"><i class="fab fa-instagram"></i></a>
              <a href="#"><i class="fab fa-linkedin"></i></a>
            </div>
          </div>

          
        </div>
        <div class="footer__bottom">
          <p style="color: white;">&copy; 2024 Onkos Instituto del Cáncer. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  </div>
</template>

<script>
import Navbar from '@/components/Navbar.vue'
import eventBus from '@/utils/eventBus'

export default {
  name: 'ZonaIA',
  components: { Navbar },
  methods: {
    showAdminLogin() {
      this.$emit('show-admin-login')
    },
    showAppointmentModal() {
      this.$emit('show-appointment-modal')
    },
    openChatbot() {
      eventBus.emit('open-chatbot', 'abrir onkos sapiens')
    },
    startInterviewer() {
      eventBus.emit('open-chatbot', 'entrevista inicial de preconsulta')
    }
  }
}
</script>

<style lang="scss" scoped>
.main-content {
  padding: 2rem 0 4rem;
}

.page-header {
  margin: 1.3rem 0 1.3rem;
  text-align: center;
}

.page-title {
  font-size: 2rem;
  font-weight: 800;
  color: #1e3a8a;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.page-description {
  max-width: 800px;
  margin: 0.75rem auto 0;
  color: #374151;
}

.ia-tools-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
}

.ia-tool-card {
  background: #fff;
  border: 1px solid rgba(0,0,0,.08);
  border-radius: 12px;
  padding: 1.25rem;
  box-shadow: 0 6px 18px rgba(0,0,0,.06);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  min-height: 400px;
  position: relative;
}

/* Cinta diagonal "Próximamente" */
.coming-soon {
  position: relative;
  overflow: hidden;
}

.coming-soon-banner {
  position: absolute;
  top: 40px;
  right: -50px;
  background: #fbbf24;
  color: #92400e;
  padding: 6px 45px;
  font-size: 0.8rem;
  font-weight: 700;
  transform: rotate(45deg);
  text-transform: uppercase;
  letter-spacing: 1px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  z-index: 10;
  white-space: nowrap;
}

.ia-tool-image {
  width: 100%;
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  border-radius: 8px;
  margin-bottom: 1rem;
  overflow: hidden;
}

.tool-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.ia-tool-icon { 
  font-size: 1.75rem; 
  color: #1e3a8a; 
  text-align: center;
}

.ia-tool-title { 
  margin: 0; 
  color: #111827; 
  text-align: center;
  font-size: 1.25rem;
  font-weight: 700;
}

.ia-tool-desc { 
  margin: 0; 
  color: #4b5563; 
  text-align: center;
  flex-grow: 1;
}

.tool-button-container {
  display: flex;
  justify-content: center;
  margin-top: auto;
  padding-top: 1rem;
}

.btn { 
  display: inline-flex; 
  align-items: center; 
  justify-content: center; 
  padding: 0.75rem 1.5rem; 
  border-radius: 8px; 
  cursor: pointer; 
  text-decoration: none; 
  font-weight: 600; 
  transition: all 0.3s ease;
  border: none;
  font-size: 1rem;
  min-width: 120px;
}

.btn-primary { 
  background: #1e40af; 
  color: #fff; 
}

.btn-primary:hover { 
  background: #1e3a8a; 
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(30, 64, 175, 0.3);
}

.btn-secondary { 
  background: #3b82f6; 
  color: #fff; 
}

.btn-secondary:hover { 
  background: #2563eb; 
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

/* Botones deshabilitados */
.btn:disabled {
  background: #9ca3af !important;
  color: #6b7280 !important;
  cursor: not-allowed !important;
  transform: none !important;
  box-shadow: none !important;
}

.btn:disabled:hover {
  background: #9ca3af !important;
  transform: none !important;
  box-shadow: none !important;
}

/* Footer */
.footer {
  background: #0f172a;
  color: white;
  padding: 4rem 0 2rem;
  margin-top: auto;
  
  &__content {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 2rem;
    margin-bottom: 2rem;
  }
  
  &__section {
    h3, h4 {
      margin-bottom: 1rem;
      color: #1e3a8a !important;
    }
    
    p {
      margin-bottom: 1rem;
      opacity: 0.8;
    }
    
    ul {
      list-style: none;
      
      li {
        margin-bottom: 0.5rem;
        
        a {
          color: white;
          text-decoration: none;
          opacity: 0.8;
          transition: opacity 0.3s ease;
          
          &:hover {
            opacity: 1;
            color: #1e3a8a !important;
          }
        }
        
        i {
          margin-right: 0.5rem;
          color: #1e3a8a !important;
        }
      }
    }
  }
  
  &__social {
    display: flex;
    gap: 1rem;
    
    a {
      width: 40px;
      height: 40px;
      background: #1e3a8a;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      text-decoration: none;
      transition: all 0.3s ease;
      
      &:hover {
        background: #0f766e;
        transform: translateY(-2px);
      }
    }
  }
  
  &__bottom {
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    padding-top: 2rem;
    text-align: center;
    opacity: 0.6;
  }
}

/* Responsive */
@media (max-width: 768px) {
  .main-content {
    margin-top: 100px;
  }
  
  .page-header {
    padding-top: 1rem;
  }
  
  .page-title {
    font-size: 1.75rem;
  }

  .ia-tools-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .ia-tool-card {
    min-height: 350px;
  }
}
</style>
