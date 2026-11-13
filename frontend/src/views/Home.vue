<template>
  <div class="home">
    <Navbar @show-admin-login="showAdminLogin" @show-appointment-modal="showAppointmentModal" />
    
    <!-- Admin Login Modal -->
    <AdminLogin 
      :show-modal="showAdminLoginModal" 
      @close="showAdminLoginModal = false"
      @login-success="handleAdminLoginSuccess"
    />
    
    <!-- Características Discretas -->
    <DiscreteFeatures />
    
    <!-- Hero Section -->
    <section class="hero-section">
      <div class="hero-background"></div>
      <div class="hero-gradient-overlay"></div>
      
      <div class="container">
        <div class="hero-content">
          
          <!-- Text Content -->
          <div class="hero-text-container">
                        <div class="hero-text-backdrop">
              
              <div class="hero-category-tag">
                BIENVENIDOS
              </div>
              
              <h1 class="hero-title">
                Centro de Investigación y Tratamientos
            </h1>
              
              <h2 class="hero-subtitle">
                contra el cáncer
              </h2>
              
              <p class="hero-description">
                El Cáncer es una enfermedad individual y su tratamiento debe de ser siempre personalizado
              </p>
              
              <div class="hero-features">
                <div class="hero-feature">
                  <div class="hero-feature-icon">
                    <i class="fas fa-dna"></i>
                  </div>
                  <div class="hero-feature-content">
                    <h3 class="hero-feature-title">LABORATORIO MOLECULAR</h3>
                    <p class="hero-feature-text">Secuenciamiento genético tumoral avanzado</p>
                  </div>
                </div>
                
                <div class="hero-feature">
                  <div class="hero-feature-icon">
                    <i class="fas fa-user-md"></i>
                  </div>
                  <div class="hero-feature-content">
                    <h3 class="hero-feature-title">AYUDA ESPECIALIZADA</h3>
                    <p class="hero-feature-text">Consultas con personal experto</p>
                  </div>
                </div>
                
                <div class="hero-feature">
                  <div class="hero-feature-icon">
                    <i class="fas fa-stethoscope"></i>
                  </div>
                  <div class="hero-feature-content">
                    <h3 class="hero-feature-title">TRATAMIENTOS ESPECÍFICOS</h3>
                    <p class="hero-feature-text">Quimioterapias y terapias personalizadas</p>
                  </div>
                </div>
              </div>
              
                            <div class="hero-actions">
                <button @click="showAppointmentModal" class="btn btn--cta">
                <i class="fas fa-calendar-alt"></i>
                Agendar Cita
                </button>
                
                <router-link to="/servicios" class="btn btn--cta">
                <i class="fas fa-stethoscope"></i>
                Nuestros Servicios
              </router-link>
            </div>
              
          </div>
          </div>
          
          <!-- Floating Image -->
          <div class="hero-image-container">
            <div class="hero-image-wrapper">
              <img 
                src="@/assets/images/banner2.png" 
                alt="Onkos Instituto del Cáncer" 
                class="hero-floating-image"
              >
            </div>
          </div>
          
        </div>
      </div>
    </section>

    <!-- Modal de Agendar Cita -->
    <div v-if="showModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">¿Cómo te gustaría agendar tu cita?</h3>
          <button @click="closeModal" class="modal-close">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div class="modal-body">
          <div class="modal-options">
            <div class="modal-option" @click="goToForm">
              <div class="modal-option-icon">
                <i class="fas fa-file-alt"></i>
              </div>
              <div class="modal-option-content">
                <h4 class="modal-option-title">Formulario Tradicional</h4>
                <p class="modal-option-description">Completa nuestro formulario de agendamiento paso a paso</p>
              </div>
            </div>
            
            <div class="modal-option" @click="openChatbot">
              <div class="modal-option-icon">
                <i class="fas fa-robot"></i>
              </div>
              <div class="modal-option-content">
                <h4 class="modal-option-title">Recepcionista IA</h4>
                <p class="modal-option-description">Conversa con nuestra IA para agendar tu cita de forma natural</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    


    <!-- Blog Entries Section -->
    <section class="blog-section">
      <div class="container">
        <div class="blog-grid">
          
          <!-- ¿Qué es Onkos? -->
          <article class="blog-card">
            <div class="blog-image">
              <img src="@/assets/images/onkos.png" alt="Onkos Instituto del Cáncer" class="blog-img">
            </div>
            <div class="blog-content">
              <h3 class="blog-title">¿QUÉ ES ONKOS?</h3>
              <p class="blog-excerpt">
                Onkos Instituto del Cáncer, es una institución médica dedicada exclusivamente al tratamiento e investigación del cáncer con enfoque integral y personalizado para cada paciente.
              </p>
              <router-link to="/blog/que-es-onkos" class="blog-link">
                Leer más
              </router-link>
            </div>
          </article>
          
          <!-- Terapia Dinámica Adaptativa -->
          <article class="blog-card">
            <div class="blog-image">
              <img src="@/assets/images/tda.png" alt="Terapia Dinámica Adaptativa" class="blog-img">
            </div>
            <div class="blog-content">
              <h3 class="blog-title">TERAPIA DINÁMICA ADAPTATIVA (TDA)</h3>
              <p class="blog-excerpt">
                Este sistema complementa nuestras TBRs (Terapia Basada en Respuesta) y se fundamenta en los principios de adaptación continua al progreso del tratamiento.
              </p>
              <router-link to="/blog/terapia-dinamica-adaptativa" class="blog-link">
                Leer más
              </router-link>
            </div>
          </article>
          
          <!-- Terapia Basada en Genómica -->
          <article class="blog-card">
            <div class="blog-image">
              <img src="@/assets/images/tbg.jpg" alt="Terapia Basada en Genómica" class="blog-img">
            </div>
            <div class="blog-content">
              <h3 class="blog-title">TERAPIA BASADA EN GENÓMICA (TBG)</h3>
              <p class="blog-excerpt">
                Este sistema consiste en estudiar la naturaleza más íntima del cáncer, acceder a la información genética para personalizar el tratamiento.
              </p>
              <router-link to="/blog/terapia-basada-genomica" class="blog-link">
                Leer más
              </router-link>
            </div>
          </article>
          
        </div>
      </div>
        </section>

    <!-- Departamentos -->
    <section class="departments-section">
      <div class="container">
        <div class="section-header">
          <h2 class="section-title">Departamentos</h2>
          <p class="section-subtitle">Especialidades oncológicas con tratamientos de vanguardia</p>
        </div>
        
        <div class="departments-grid">
          
          <!-- Cáncer de Estómago -->
          <div class="department-card">
            <div class="department-icon">
              <img src="@/assets/images/stomach.svg" alt="Estómago" class="department-svg-icon">
            </div>
            <div class="department-content">
              <h3 class="department-title">Cáncer de Estómago</h3>
              <p class="department-description">Tratamiento de tumores y carcinomatosis.</p>
            </div>
          </div>
          
          <!-- Cáncer de Pulmón -->
          <div class="department-card">
            <div class="department-icon">
              <i class="fas fa-lungs"></i>
            </div>
            <div class="department-content">
              <h3 class="department-title">Cáncer de Pulmón</h3>
              <p class="department-description">Terapias con radiofrecuencia e intratumorales.</p>
            </div>
          </div>
          
          <!-- Cáncer de Huesos -->
          <div class="department-card">
            <div class="department-icon">
              <i class="fas fa-bone"></i>
            </div>
            <div class="department-content">
              <h3 class="department-title">Cáncer de Huesos</h3>
              <p class="department-description">Tratamientos de inmunoterapia amplificada.</p>
            </div>
          </div>
          
          <!-- Cáncer Linfático -->
          <div class="department-card">
            <div class="department-icon">
              <i class="fas fa-network-wired"></i>
            </div>
            <div class="department-content">
              <h3 class="department-title">Cáncer Linfático</h3>
              <p class="department-description">Terapias dinámica adaptativa.</p>
            </div>
          </div>
          
          <!-- Cáncer de Tejidos Blandos -->
          <div class="department-card">
            <div class="department-icon">
              <i class="fas fa-microscope"></i>
            </div>
            <div class="department-content">
              <h3 class="department-title">Cáncer de Tejidos Blandos</h3>
              <p class="department-description">Terapias intraperitoneales.</p>
            </div>
          </div>
          
        </div>
      </div>
    </section>
    
    <!-- Servicios Destacados -->
    <section class="section section--light">
      <div class="container">
        <div class="text-center mb-8">
          <h2>Servicios Especializados</h2>
          <p>Ofrecemos una atención integral y personalizada para el tratamiento del cáncer</p>
        </div>
        
        <div class="grid grid--3">
          <div class="card card--feature fade-in-up">
            <div class="icon">
              <i class="fas fa-microscope"></i>
            </div>
            <h3>Consultas Oncológicas</h3>
            <p>Evaluación integral y diagnóstico especializado con los mejores oncólogos de la región.</p>
          </div>
          
          <div class="card card--feature fade-in-up">
            <div class="icon">
              <i class="fas fa-pills"></i>
            </div>
            <h3>Quimioterapia</h3>
            <p>Tratamiento farmacológico personalizado con tecnología avanzada y monitoreo constante.</p>
          </div>
          
          <div class="card card--feature fade-in-up">
            <div class="icon">
              <i class="fas fa-radiation"></i>
            </div>
            <h3>Radioterapia</h3>
            <p>Terapia de radiación de precisión con equipos de última generación para máxima efectividad.</p>
          </div>
          
          <div class="card card--feature fade-in-up">
            <div class="icon">
              <i class="fas fa-user-md"></i>
            </div>
            <h3>Cirugía Oncológica</h3>
            <p>Intervenciones quirúrgicas especializadas con técnicas mínimamente invasivas.</p>
          </div>
          
          <div class="card card--feature fade-in-up">
            <div class="icon">
              <i class="fas fa-brain"></i>
            </div>
            <h3>Psicología Oncológica</h3>
            <p>Apoyo emocional y psicológico para pacientes y familiares durante todo el proceso.</p>
          </div>
          
          <div class="card card--feature fade-in-up">
            <div class="icon">
              <i class="fas fa-apple-alt"></i>
            </div>
            <h3>Nutrición Oncológica</h3>
            <p>Planes nutricionales especializados para optimizar el tratamiento y la recuperación.</p>
          </div>
        </div>
      </div>
    </section>
    
    <!-- Estadísticas -->
    <section class="section section--dark">
      <div class="container">
        <div class="stats">
          <div class="stats__item fade-in-up">
            <div class="stats__number">15+</div>
            <div class="stats__label">Años de Experiencia</div>
          </div>
          <div class="stats__item fade-in-up">
            <div class="stats__number">5000+</div>
            <div class="stats__label">Pacientes Atendidos</div>
          </div>
          <div class="stats__item fade-in-up">
            <div class="stats__number">95%</div>
            <div class="stats__label">Satisfacción del Paciente</div>
          </div>
          <div class="stats__item fade-in-up">
            <div class="stats__number">24/7</div>
            <div class="stats__label">Atención de Emergencias</div>
          </div>
        </div>
      </div>
    </section>
    
    <!-- Por qué elegirnos -->
    <section class="section">
      <div class="container">
        <div class="grid grid--2">
          <div class="why-us__content fade-in-left">
                    <h2>¿Por qué elegir Onkos Instituto del Cáncer?</h2>
        <p>En Onkos Instituto del Cáncer, entendemos que cada paciente es único y merece una atención personalizada y compasiva.</p>
            
            <div class="why-us__features">
              <div class="why-us__feature">
                <i class="fas fa-check-circle"></i>
                <div>
                  <h4>Equipo Médico Experto</h4>
                  <p>Oncólogos certificados con más de 15 años de experiencia en el tratamiento del cáncer.</p>
                </div>
              </div>
              
              <div class="why-us__feature">
                <i class="fas fa-check-circle"></i>
                <div>
                  <h4>Tecnología de Vanguardia</h4>
                  <p>Equipos médicos de última generación para diagnósticos precisos y tratamientos efectivos.</p>
                </div>
              </div>
              
              <div class="why-us__feature">
                <i class="fas fa-check-circle"></i>
                <div>
                  <h4>Atención Integral</h4>
                  <p>Enfoque holístico que incluye tratamiento médico, apoyo psicológico y nutricional.</p>
                </div>
              </div>
              
              <div class="why-us__feature">
                <i class="fas fa-check-circle"></i>
                <div>
                  <h4>Horarios Flexibles</h4>
                  <p>Consultas disponibles de lunes a viernes con opciones de citas de emergencia.</p>
                </div>
              </div>
            </div>
          </div>
          
          <div class="why-us__image fade-in-right">
            <div class="why-us__image-placeholder">
              <i class="fas fa-hospital"></i>
            </div>
          </div>
        </div>
      </div>
    </section>
    
    <!-- CTA Section -->
    <section class="section section--light">
      <div class="container">
        <div class="cta text-center">
          <h2>¿Necesitas una consulta?</h2>
          <p>Nuestro equipo está listo para ayudarte. Agenda tu cita hoy mismo y da el primer paso hacia tu recuperación.</p>
          <div class="cta__actions">
            <button @click="showAppointmentModal" class="btn btn--cta btn--large">
              <i class="fas fa-calendar-alt"></i>
              Agendar Cita
            </button>
            <a href="tel:+51933598495" class="btn btn--secondary btn--large">
              <i class="fas fa-phone"></i>
              Llamar Ahora
            </a>
          </div>
        </div>
      </div>
    </section>
    
    <!-- Footer -->
    <footer class="footer">
      <div class="container">
        <!-- CTA Principal para Móviles -->
        <div class="footer__cta-mobile">
          <div class="footer__cta-content">
            <h3>¿Necesitas una consulta médica?</h3>
            <p>Agenda tu cita con nuestros especialistas en oncología</p>
            <button @click="showAppointmentModal" class="footer__cta-btn">
              <i class="fas fa-calendar-alt"></i>
              Agendar Cita
            </button>
          </div>
        </div>

        <div class="footer__content">
          <!-- Información Principal -->
          <div class="footer__section footer__section--main">
            <div class="footer__brand">
              <img src="@/assets/LOGO2.png" alt="Onkos Instituto del Cáncer" class="footer__logo">
              <h3>Onkos Instituto del Cáncer</h3>
            </div>
            <p style="color: white;">Centro especializado en oncología comprometido con la excelencia médica y el cuidado compasivo de nuestros pacientes.</p>
            <div class="footer__social">
              <a href="#" class="footer__social-link" title="Facebook">
                <i class="fab fa-facebook"></i>
              </a>
              <a href="#" class="footer__social-link" title="Twitter">
                <i class="fab fa-twitter"></i>
              </a>
              <a href="#" class="footer__social-link" title="Instagram">
                <i class="fab fa-instagram"></i>
              </a>
              <a href="#" class="footer__social-link" title="LinkedIn">
                <i class="fab fa-linkedin"></i>
              </a>
            </div>
          </div>
          
          <!-- Servicios -->
          <div class="footer__section">
            <h4>Servicios</h4>
            <ul class="footer__links">
              <li><a href="/servicios">Consultas Oncológicas</a></li>
              <li><a href="/servicios">Quimioterapia</a></li>
              <li><a href="/servicios">Radioterapia</a></li>
              <li><a href="/servicios">Cirugía Oncológica</a></li>
              <li><a href="/servicios">Terapias Moleculares</a></li>
              <li><a href="/servicios">Inmunoterapia</a></li>
            </ul>
          </div>
          
          <!-- Contacto -->
          <div class="footer__section">
            <h4>Contacto</h4>
            <ul class="footer__contact">
              <li class="footer__contact-item">
                <i class="fas fa-phone"></i>
                <a href="tel:+51933598495">(+51) 933 598 495</a>
              </li>
              <li class="footer__contact-item">
                <i class="fas fa-envelope"></i>
                <a href="mailto:contacto@onkos.com">contacto@onkos.com</a>
              </li>
              <li class="footer__contact-item">
                <i class="fas fa-map-marker-alt"></i>
                <span>Av Brasil 3621, Magdalena del Mar. Lima - Perú</span>
              </li>
              <li class="footer__contact-item">
                <i class="fas fa-clock"></i>
                <span>Lunes-Viernes, 9am a 6pm</span>
              </li>
            </ul>
          </div>
          
          <!-- Enlaces Rápidos -->
          <div class="footer__section">
            <h4>Enlaces Rápidos</h4>
            <ul class="footer__links">
              <li><router-link to="/">Inicio</router-link></li>
              <li><router-link to="/especialistas">Especialistas</router-link></li>
              <li><router-link to="/blog">Blog</router-link></li>
              <li><router-link to="/investigacion">Investigación</router-link></li>
              <li><router-link to="/contacto">Contacto</router-link></li>
            </ul>
          </div>
        </div>
        
        <!-- Footer Bottom -->
        <div class="footer__bottom">
          <div class="footer__bottom-content">
            <p style="color: white;">&copy; 2024 Onkos Instituto del Cáncer. Todos los derechos reservados.</p>
            <div class="footer__legal">
              <a href="#" class="footer__legal-link">Política de Privacidad</a>
              <a href="#" class="footer__legal-link">Términos de Uso</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<script>
import Navbar from '@/components/Navbar.vue'
import AdminLogin from '@/components/AdminLogin.vue'
import DiscreteFeatures from '@/components/DiscreteFeatures.vue'
import eventBus from '@/utils/eventBus'

export default {
  name: 'Home',
  components: {
    Navbar,
    AdminLogin,
    DiscreteFeatures
  },
  data() {
    return {
      showAdminLoginModal: false,
      showModal: false
    }
  },
  mounted() {
    this.updateMetaTags();
  },
  methods: {
    showAdminLogin() {
      this.showAdminLoginModal = true
    },
    handleAdminLoginSuccess(user) {
      // Redirigir al panel de administración
      this.$router.push('/admin')
    },
    showAppointmentModal() {
      // Comentado: redirigir directamente al formulario sin mostrar modal
      // this.showModal = true;
      // document.body.style.overflow = 'hidden';
      this.$router.push('/cita');
    },
    closeModal() {
      this.showModal = false;
      document.body.style.overflow = 'auto';
    },
    goToForm() {
      this.closeModal();
      this.$router.push('/cita');
    },
    openChatbot() {
      this.closeModal();
      // Usar el bus de eventos global
      eventBus.emit('open-chatbot', 'quiero agendar una cita');
    },

    updateMetaTags() {
      document.title = 'Onkos - Centro de Investigación y Tratamientos contra el cáncer';
      
      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.name = 'description';
        document.head.appendChild(metaDesc);
      }
      metaDesc.content = 'Centro especializado en oncología comprometido con la excelencia médica y el cuidado compasivo de nuestros pacientes.';
      
      // Open Graph
      this.setMetaTag('property', 'og:title', 'Onkos - Centro de Investigación y Tratamientos contra el cáncer');
      this.setMetaTag('property', 'og:description', 'Centro especializado en oncología comprometido con la excelencia médica y el cuidado compasivo de nuestros pacientes.');
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
    }
  }
}
</script>

<style lang="scss" scoped>
/* Hero Section Modern Design */
.hero-section {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  overflow: hidden;
  padding-top: 0;
  margin-top: 0;
  z-index: 1;
}

.hero-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: url('@/assets/images/banner.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  z-index: 1;
}

.hero-gradient-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(30, 58, 138, 0.7) 0%, rgba(30, 64, 175, 0.5) 50%, transparent 100%);
  z-index: 2;
}

.hero-content {
  position: relative;
  z-index: 3;
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 4rem;
  align-items: center;
  min-height: 100vh;
  padding: 2rem 0;
}

.hero-text-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.hero-text-backdrop {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(25px);
  border-radius: 20px;
  padding: 3.5rem;
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  animation: fadeInUp 0.8s ease-out 0.2s forwards;
}

.hero-category-tag {
  display: inline-block;
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  color: white;
  font-size: 0.75rem;
    font-weight: 700;
  padding: 0.4rem 0.8rem;
  border-radius: 20px;
  margin-bottom: 2rem;
  letter-spacing: 1px;
  text-transform: uppercase;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
  animation: fadeInUp 0.8s ease-out 0.1s forwards;
  opacity: 0;
  align-self: flex-start;
}

.hero-title {
  font-size: clamp(2.2rem, 3.5vw, 3rem);
  font-weight: 800;
  color: white;
  line-height: 1.2;
  margin-bottom: 0.75rem;
  letter-spacing: -0.02em;
}

.hero-title-accent {
  background: linear-gradient(135deg, #60a5fa 0%, #22d3ee 50%, #14b8a6 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

.hero-subtitle {
  font-size: clamp(1.3rem, 2.5vw, 2rem);
  font-weight: 700;
  color: #1e40af;
  line-height: 1.2;
  margin-bottom: 1.5rem;
  animation: fadeInUp 0.8s ease-out 0.3s forwards;
  opacity: 0;
}

.hero-description {
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.9);
    line-height: 1.6;
  margin-bottom: 3rem;
  animation: fadeInUp 0.8s ease-out 0.4s forwards;
  opacity: 0;
}

.hero-features {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.25rem;
  margin-bottom: 3rem;
  animation: fadeInUp 0.8s ease-out 0.5s forwards;
  opacity: 0;
}

.hero-feature {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  padding: 1.25rem 1.5rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

.hero-feature:hover {
  background: rgba(255, 255, 255, 0.15);
  transform: translateX(5px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
}

.hero-feature-icon {
  width: 50px;
  height: 50px;
  background: linear-gradient(135deg, #60a5fa 0%, #22d3ee 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 6px 15px rgba(96, 165, 250, 0.3);
}

.hero-feature-icon i {
  font-size: 1.4rem;
  color: white;
}

.hero-feature-content {
  flex: 1;
}

.hero-feature-title {
  font-size: 1rem;
  font-weight: 700;
  color: white;
  margin-bottom: 0.5rem;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.hero-feature-text {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.8);
  margin: 0;
  line-height: 1.5;
}

.hero-actions {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
  animation: fadeInUp 0.8s ease-out 0.6s forwards;
  opacity: 0;
}
    


.hero-image-container {
    display: flex;
      justify-content: center;
    align-items: center;
  animation: fadeInRight 0.8s ease-out 0.6s forwards;
  opacity: 0;
}

.hero-image-wrapper {
  position: relative;
}

.hero-floating-image {
  width: 100%;
  max-width: 400px;
  height: auto;
  border-radius: 24px;
  box-shadow: 0 30px 60px rgba(0, 0, 0, 0.4);
  border: 4px solid rgba(255, 255, 255, 0.3);
  transition: all 0.3s ease;
  object-fit: cover;
}

.hero-floating-image:hover {
  transform: translateY(-5px) scale(1.02);
  box-shadow: 0 30px 60px rgba(0, 0, 0, 0.4);
}

/* Animations */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInRight {
  from {
    opacity: 0;
    transform: translateX(30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* Features Section */
.features-section {
  padding: 4rem 0;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  position: relative;
  overflow: hidden;
}

.features-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="50" cy="50" r="1" fill="%23ffffff" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
  opacity: 0.3;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem;
  position: relative;
  z-index: 2;
}

.feature-card {
  background: white;
  border-radius: 20px;
  padding: 2.5rem 2rem;
  text-align: center;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.8);
  transition: all 0.4s ease;
  position: relative;
  overflow: hidden;
}

.feature-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #2563eb 0%, #0891b2 100%);
  transform: scaleX(0);
  transition: transform 0.4s ease;
}

.feature-card:hover {
  transform: translateY(-10px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
}

.feature-card:hover::before {
  transform: scaleX(1);
}

.feature-icon {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #2563eb 0%, #0891b2 100%);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  margin: 0 auto 1.5rem;
  box-shadow: 0 10px 25px rgba(37, 99, 235, 0.3);
  transition: all 0.4s ease;
}

.feature-card:hover .feature-icon {
  transform: scale(1.1) rotate(5deg);
  box-shadow: 0 15px 35px rgba(37, 99, 235, 0.4);
}

.feature-icon i {
  font-size: 2rem;
  color: white;
}

.feature-content {
  position: relative;
  z-index: 2;
}

.feature-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 0.5rem;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.feature-subtitle {
  font-size: 1rem;
  color: #64748b;
  font-weight: 500;
  margin: 0;
  line-height: 1.5;
}

/* Blog Section */
.blog-section {
  padding: 4rem 0;
  background: white;
  position: relative;
}

.blog-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2.5rem;
  position: relative;
  z-index: 2;
}

.blog-card {
  background: white;
  border-radius: 12px;
  padding: 2.5rem 2rem;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.blog-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
}

.blog-image {
  width: 100%;
  height: 200px;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 1.5rem;
  position: relative;
  transition: all 0.3s ease;
}

.blog-card:hover .blog-image {
  transform: scale(1.02);
}

.blog-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  transition: all 0.3s ease;
}

.blog-card:hover .blog-img {
  transform: scale(1.05);
}

.blog-content {
  position: relative;
  z-index: 2;
}

.blog-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: #1e40af;
  margin-bottom: 1rem;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  line-height: 1.3;
}

.blog-excerpt {
  font-size: 0.95rem;
  color: #64748b;
  font-weight: 400;
  margin: 0 0 1.5rem 0;
  line-height: 1.6;
  text-align: left;
}

.blog-link {
  display: inline-block;
  color: #2563eb;
  font-weight: 600;
  font-size: 0.9rem;
  text-decoration: none;
  transition: all 0.3s ease;
  position: relative;
}

.blog-link::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 0;
  height: 2px;
  background: #2563eb;
  transition: width 0.3s ease;
}

.blog-link:hover {
  color: #1d4ed8;
}

.blog-link:hover::after {
  width: 100%;
}

/* Modal Styles */
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
  z-index: 10020;
  backdrop-filter: blur(5px);
}

.modal-content {
  background: white;
  border-radius: 20px;
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
  animation: modalSlideIn 0.3s ease-out;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 2rem 2rem 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.modal-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #64748b;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.modal-close:hover {
  background: #f1f5f9;
  color: #1e293b;
}

.modal-body {
  padding: 2rem;
}

.modal-options {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.modal-option {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 1.5rem;
  border: 2px solid #e5e7eb;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: white;
}

.modal-option:hover {
  border-color: #2563eb;
  background: #f8fafc;
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(37, 99, 235, 0.15);
}

.modal-option-icon {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 6px 15px rgba(37, 99, 235, 0.3);
}

.modal-option-icon i {
  font-size: 1.5rem;
  color: white;
}

.modal-option-content {
  flex: 1;
}

.modal-option-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 0.5rem;
}

.modal-option-description {
  font-size: 0.9rem;
  color: #64748b;
  margin: 0;
  line-height: 1.5;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-50px) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* Departments Section */
.departments-section {
  padding: 5rem 0;
  background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
  position: relative;
  overflow: hidden;
}

.departments-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="dots" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="10" cy="10" r="1" fill="%23cbd5e1" opacity="0.3"/></pattern></defs><rect width="100" height="100" fill="url(%23dots)"/></svg>');
  opacity: 0.5;
}

.section-header {
  text-align: center;
  margin-bottom: 4rem;
  position: relative;
  z-index: 2;
}

.section-title {
  font-size: clamp(2rem, 4vw, 3rem);
  font-weight: 800;
  color: #1e293b;
  margin-bottom: 1rem;
  letter-spacing: -0.02em;
}

.section-subtitle {
  font-size: 1.25rem;
  color: #64748b;
  font-weight: 500;
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.6;
}

.departments-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 1.5rem;
  position: relative;
  z-index: 2;
  max-width: 1400px;
  margin: 0 auto;
}

.department-card {
  background: white;
  border-radius: 16px;
  padding: 2.5rem 2rem;
  text-align: center;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.8);
  transition: all 0.4s ease;
  position: relative;
  overflow: hidden;
}

.department-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #0891b2 0%, #0ea5e9 100%);
  transform: scaleX(0);
  transition: transform 0.4s ease;
}

.department-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.12);
}

.department-card:hover::before {
  transform: scaleX(1);
}

.department-icon {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #0891b2 0%, #0ea5e9 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.5rem;
  box-shadow: 0 10px 25px rgba(8, 145, 178, 0.3);
  transition: all 0.4s ease;
}

.department-card:hover .department-icon {
  transform: scale(1.1) rotate(5deg);
  box-shadow: 0 15px 35px rgba(8, 145, 178, 0.4);
}

.department-icon i {
  font-size: 2rem;
  color: white;
}

.department-svg-icon {
  width: 2rem;
  height: 2rem;
  filter: brightness(0) invert(1);
  transition: all 0.4s ease;
}

.department-content {
  position: relative;
  z-index: 2;
}

.department-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 1rem;
  letter-spacing: 0.5px;
}

.department-description {
  font-size: 1rem;
  color: #64748b;
  font-weight: 500;
  margin: 0;
  line-height: 1.6;
}

/* Responsive Design */
@media (max-width: 1024px) {
  .hero-content {
    grid-template-columns: 1fr;
    text-align: center;
    gap: 3rem;
  }
  
  .hero-text-backdrop {
    padding: 3rem;
  }
  
  .hero-category-tag {
    font-size: 0.7rem;
    padding: 0.35rem 0.7rem;
    margin-bottom: 1.5rem;
  }
  
  .hero-actions {
    justify-content: center;
  }
  
  .hero-floating-image {
    max-width: 350px;
  }
  
  .hero-features {
    gap: 1rem;
    margin-bottom: 2.5rem;
  }
  
  .hero-feature {
    padding: 1rem 1.25rem;
  }
  
  .hero-feature-icon {
    width: 45px;
    height: 45px;
  }
  
  .hero-feature-icon i {
    font-size: 1.2rem;
  }
  
  .hero-feature-title {
    font-size: 0.9rem;
  }
  
  .hero-feature-text {
    font-size: 0.85rem;
  }
  
  .features-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 1.5rem;
  }
  
  .feature-card {
    padding: 2rem 1.5rem;
  }
  
  .blog-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 2rem;
  }
  
  .blog-card {
    padding: 2rem 1.5rem;
  }
  
  .blog-image {
    height: 180px;
  }
  
  .departments-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 1.5rem;
  }
  
  .department-card {
    padding: 2rem 1.5rem;
  }
}
    
    @media (max-width: 768px) {
  .features-section {
    padding: 3rem 0;
  }
  
  .features-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
  
  .feature-card {
    padding: 2rem 1.5rem;
  }
  
  .feature-icon {
    width: 70px;
    height: 70px;
  }
  
  .feature-icon i {
    font-size: 1.75rem;
  }
  
  .feature-title {
    font-size: 1rem;
  }
  
  .feature-subtitle {
    font-size: 0.9rem;
  }
  
  .blog-section {
    padding: 3rem 0;
  }
  
  .blog-grid {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
  
  .blog-card {
    padding: 2rem 1.5rem;
  }
  
  .blog-image {
    height: 180px;
  }
  
  .blog-title {
    font-size: 1rem;
  }
  
  .blog-excerpt {
    font-size: 0.9rem;
  }
  
  .departments-section {
    padding: 3rem 0;
  }
  
  .departments-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 1.5rem;
  }
  
  .department-card {
    padding: 2rem 1.5rem;
  }
  
  .department-icon {
    width: 70px;
    height: 70px;
  }
  
  .department-icon i {
    font-size: 1.75rem;
  }
  
  .department-svg-icon {
    width: 1.75rem;
    height: 1.75rem;
  }
  
  .department-title {
    font-size: 1.1rem;
  }
  
  .department-description {
    font-size: 0.9rem;
  }
}

@media (max-width: 480px) {
  .departments-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
  
  .department-card {
    padding: 1.5rem 1rem;
  }
  
  .department-icon {
    width: 60px;
    height: 60px;
  }
  
  .department-icon i {
    font-size: 1.5rem;
  }
  
  .department-svg-icon {
    width: 1.5rem;
    height: 1.5rem;
  }
  
  .department-title {
    font-size: 1rem;
  }
  
  .department-description {
    font-size: 0.85rem;
  }
}

@media (max-width: 768px) {
  .hero-section {
    min-height: 80vh;
  }
  
  .hero-content {
    min-height: 80vh;
    padding: 1rem 0;
  }
  
  .hero-text-backdrop {
    padding: 2rem;
  }
  
  .hero-category-tag {
    font-size: 0.65rem;
    padding: 0.3rem 0.6rem;
    margin-bottom: 1.25rem;
  }
  
  .hero-title {
    font-size: 2.5rem;
  }
  
  .hero-subtitle {
    font-size: 1.1rem;
  }
  
  .hero-btn {
    padding: 0.875rem 1.5rem;
    font-size: 1rem;
  }
  
  .hero-floating-image {
    max-width: 280px;
  }
  
  .hero-features {
    gap: 0.75rem;
    margin-bottom: 2rem;
  }
  
  .hero-feature {
    padding: 0.75rem 1rem;
  }
  
  .hero-feature-icon {
    width: 40px;
    height: 40px;
  }
  
  .hero-feature-icon i {
    font-size: 1.1rem;
  }
  
  .hero-feature-title {
    font-size: 0.8rem;
  }
  
  .hero-feature-text {
    font-size: 0.75rem;
  }
}







.stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 2rem;
  text-align: center;
  
  &__item {
    padding: 2rem;
  }
  
  &__number {
    font-size: 3rem;
    font-weight: 700;
    color: $accent-color;
    margin-bottom: 0.5rem;
  }
  
  &__label {
    font-size: 1.1rem;
    opacity: 0.8;
  }
}

.why-us {
  &__content {
    h2 {
      margin-bottom: 1.5rem;
    }
    
    p {
      font-size: 1.1rem;
      margin-bottom: 2rem;
    }
  }
  
  &__features {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }
  
  &__feature {
    display: flex;
    gap: 1rem;
    align-items: flex-start;
    
    i {
      color: $success-color;
      font-size: 1.5rem;
      margin-top: 0.25rem;
    }
    
    h4 {
      margin-bottom: 0.5rem;
      color: $primary-color;
    }
    
    p {
      margin: 0;
      color: $text-secondary;
    }
  }
  
  &__image {
    display: flex;
    justify-content: center;
    align-items: center;
  }
  
  &__image-placeholder {
    width: 400px;
    height: 400px;
    background: linear-gradient(135deg, $primary-color 0%, $secondary-color 100%);
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 8rem;
    color: white;
    opacity: 0.8;
    
    @media (max-width: 768px) {
      width: 300px;
      height: 300px;
      font-size: 6rem;
    }
  }
}

.cta {
  &__actions {
    display: flex;
    gap: 1rem;
    justify-content: center;
    flex-wrap: wrap;
    margin-top: 2rem;
  }
}

.footer {
  background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
  color: white;
  padding: 0;
  position: relative;
  overflow: hidden;
  
  // Patrón de fondo sutil
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="footer-pattern" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="10" cy="10" r="1" fill="white" opacity="0.05"/></pattern></defs><rect width="100" height="100" fill="url(%23footer-pattern)"/></svg>');
    pointer-events: none;
  }
  
  // CTA Móvil - Solo visible en móviles
  &__cta-mobile {
    display: none;
    background: rgba(255, 255, 255, 0.1);
    padding: 2rem 1rem;
    text-align: center;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    
    @media (max-width: 768px) {
      display: block;
    }
    
    @media (max-width: 480px) {
      padding: 1.5rem 0.75rem;
    }
  }
  
  &__cta-content {
    h3 {
      font-size: 1.25rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
      color: white;
      
      @media (max-width: 480px) {
        font-size: 1.1rem;
      }
    }
    
    p {
      font-size: 0.9rem;
      opacity: 0.9;
      margin-bottom: 1.5rem;
      
      @media (max-width: 480px) {
        font-size: 0.85rem;
      }
    }
  }
  
  &__cta-btn {
    background: #f87171;
    color: white;
    border: none;
    padding: 0.75rem 2rem;
    border-radius: 25px;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    transition: all 0.3s ease;
    box-shadow: 0 4px 15px rgba(248, 113, 113, 0.3);
    
    &:hover {
      background: #ef4444;
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(248, 113, 113, 0.4);
    }
    
    @media (max-width: 480px) {
      padding: 0.65rem 1.5rem;
      font-size: 0.85rem;
    }
  }
  
  &__content {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 2rem;
    padding: 3rem 0 2rem;
    
    @media (max-width: 768px) {
      grid-template-columns: 1fr;
      gap: 2.5rem;
      padding: 2rem 0 1.5rem;
    }
    
    @media (max-width: 480px) {
      gap: 2rem;
      padding: 1.5rem 0 1rem;
    }
  }
  
  &__section {
    position: relative;
    z-index: 1;
    
    h3, h4 {
      margin-bottom: 1rem;
      color: white;
      font-weight: 600;
    }
    
    h3 {
      font-size: 1.1rem;
      
      @media (max-width: 768px) {
        font-size: 1rem;
      }
    }
    
    h4 {
      font-size: 1rem;
      color: #60a5fa;
      
      @media (max-width: 768px) {
        font-size: 0.95rem;
      }
    }
    
    p {
      margin-bottom: 1rem;
      opacity: 0.9;
      line-height: 1.6;
      font-size: 0.9rem;
      
      @media (max-width: 768px) {
        font-size: 0.85rem;
      }
    }
  }
  
  // Sección principal con logo
  &__section--main {
    @media (max-width: 768px) {
      text-align: center;
    }
  }
  
  &__brand {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1rem;
    
    @media (max-width: 768px) {
      justify-content: center;
      flex-direction: column;
      gap: 0.75rem;
    }
  }
  
  &__logo {
    height: 50px;
    width: auto;
    filter: brightness(0) invert(1);
    
    @media (max-width: 768px) {
      height: 40px;
    }
  }
  
  &__links {
    list-style: none;
    padding: 0;
    margin: 0;
    
    li {
      margin-bottom: 0.75rem;
      
      @media (max-width: 768px) {
        margin-bottom: 0.5rem;
      }
      
      a {
        color: white;
        text-decoration: none;
        opacity: 0.8;
        transition: all 0.3s ease;
        font-size: 0.9rem;
        display: block;
        padding: 0.25rem 0;
        
        @media (max-width: 768px) {
          font-size: 0.85rem;
          padding: 0.5rem 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          
          &:last-child {
            border-bottom: none;
          }
        }
        
        &:hover {
          opacity: 1;
          color: #60a5fa;
          transform: translateX(5px);
          
          @media (max-width: 768px) {
            transform: none;
          }
        }
      }
    }
  }
  
  &__contact {
    list-style: none;
    padding: 0;
    margin: 0;
    
    .footer__contact-item {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      margin-bottom: 1rem;
      
      @media (max-width: 768px) {
        margin-bottom: 0.75rem;
        justify-content: center;
        text-align: center;
      }
      
      i {
        color: #60a5fa;
        font-size: 1rem;
        margin-top: 0.1rem;
        flex-shrink: 0;
        
        @media (max-width: 768px) {
          font-size: 0.9rem;
        }
      }
      
      a, span {
        color: white;
        text-decoration: none;
        opacity: 0.9;
        font-size: 0.9rem;
        line-height: 1.4;
        
        @media (max-width: 768px) {
          font-size: 0.85rem;
        }
      }
      
      a {
        transition: all 0.3s ease;
        
        &:hover {
          opacity: 1;
          color: #60a5fa;
        }
      }
    }
  }
  
  &__social {
    display: flex;
    gap: 1rem;
    margin-top: 1.5rem;
    
    @media (max-width: 768px) {
      justify-content: center;
      margin-top: 1rem;
    }
    
    @media (max-width: 480px) {
      gap: 0.75rem;
    }
  }
  
  &__social-link {
    width: 45px;
    height: 45px;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    text-decoration: none;
    transition: all 0.3s ease;
    backdrop-filter: blur(10px);
    
    @media (max-width: 480px) {
      width: 40px;
      height: 40px;
    }
    
    &:hover {
      background: #60a5fa;
      border-color: #60a5fa;
      transform: translateY(-3px);
      box-shadow: 0 5px 15px rgba(96, 165, 250, 0.3);
    }
    
    i {
      font-size: 1.1rem;
      
      @media (max-width: 480px) {
        font-size: 1rem;
      }
    }
  }
  
  &__bottom {
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    padding: 1.5rem 0;
    position: relative;
    z-index: 1;
    
    @media (max-width: 768px) {
      padding: 1rem 0;
    }
  }
  
  &__bottom-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    @media (max-width: 768px) {
      flex-direction: column;
      gap: 1rem;
      text-align: center;
    }
    
    p {
      margin: 0;
      opacity: 0.7;
      font-size: 0.85rem;
      
      @media (max-width: 768px) {
        font-size: 0.8rem;
      }
    }
  }
  
  &__legal {
    display: flex;
    gap: 1.5rem;
    
    @media (max-width: 768px) {
      gap: 1rem;
    }
    
    @media (max-width: 480px) {
      flex-direction: column;
      gap: 0.5rem;
    }
  }
  
  &__legal-link {
    color: white;
    text-decoration: none;
    opacity: 0.7;
    font-size: 0.8rem;
    transition: all 0.3s ease;
    
    @media (max-width: 768px) {
      font-size: 0.75rem;
    }
    
    &:hover {
      opacity: 1;
      color: #60a5fa;
    }
  }
}
</style> 