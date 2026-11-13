<template>
  <div class="contact">
    <Navbar />
    
    <!-- Hero Section -->
    <section class="section section--hero">
      <div class="container">
        <div class="text-center">
          <h1>Contáctanos</h1>
          <p style="color: white;">Estamos aquí para ayudarte. Ponte en contacto con nosotros</p>
        </div>
      </div>
    </section>
    
    <!-- Información de Contacto -->
    <section class="section">
      <div class="container">
        <div class="contact-grid">
          <div class="contact-info">
            <h2>Información de Contacto</h2>
            <p>Nuestro equipo está disponible para responder tus preguntas y brindarte la atención que necesitas.</p>
            
            <div class="contact-items">
              <div class="contact-item">
                <div class="contact-item__icon">
                  <i class="fas fa-map-marker-alt"></i>
                </div>
                <div class="contact-item__content">
                  <h4>Dirección</h4>
                  <p>Av Brasil 3621, Magdalena del Mar<br>Lima - Perú</p>
                </div>
              </div>
              
              <div class="contact-item">
                <div class="contact-item__icon">
                  <i class="fas fa-phone"></i>
                </div>
                <div class="contact-item__content">
                  <h4>Teléfono</h4>
                  <p>(+51) 933 598 495<br>WhatsApp +51 933 598 495</p>
                </div>
              </div>
              
              <div class="contact-item">
                <div class="contact-item__icon">
                  <i class="fas fa-envelope"></i>
                </div>
                <div class="contact-item__content">
                  <h4>Email</h4>
                  <p>contacto@onkos.com<br>citas@onkos.com</p>
                </div>
              </div>
              
              <div class="contact-item">
                <div class="contact-item__icon">
                  <i class="fas fa-clock"></i>
                </div>
                <div class="contact-item__content">
                  <h4>Horarios</h4>
                  <p>Lunes a Viernes: 8:00 AM - 6:00 PM<br>Sábados: 8:00 AM - 12:00 PM</p>
                </div>
              </div>
            </div>
            
            <div class="emergency-contact">
              <h3>Emergencias</h3>
              <p>Para emergencias médicas, llama inmediatamente:</p>
                          <a href="tel:+51933598495" class="emergency-phone">
              <i class="fas fa-phone"></i>
              (+51) 933 598 495
              </a>
            </div>
          </div>
          
          <div class="contact-form">
            <h2>Envíanos un Mensaje</h2>
            <form @submit.prevent="submitForm">
              <div class="form-group">
                <label for="name">Nombre completo *</label>
                <input 
                  type="text" 
                  id="name" 
                  v-model="form.name" 
                  required
                  placeholder="Tu nombre completo"
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
                <label for="phone">Teléfono</label>
                <input 
                  type="tel" 
                  id="phone" 
                  v-model="form.phone" 
                  placeholder="(+51) 933 598 495"
                />
              </div>
              
              <div class="form-group">
                <label for="subject">Asunto *</label>
                <select id="subject" v-model="form.subject" required>
                  <option value="">Selecciona un asunto</option>
                  <option value="consulta">Consulta médica</option>
                  <option value="cita">Agendar cita</option>
                  <option value="informacion">Información general</option>
                  <option value="emergencia">Emergencia</option>
                  <option value="otro">Otro</option>
                </select>
              </div>
              
              <div class="form-group">
                <label for="message">Mensaje *</label>
                <textarea 
                  id="message" 
                  v-model="form.message" 
                  required
                  rows="5"
                  placeholder="Describe tu consulta o mensaje..."
                ></textarea>
              </div>
              
              <div class="form-group">
                <label class="checkbox-label">
                  <input 
                    type="checkbox" 
                    v-model="form.newsletter"
                  />
                  <span class="checkmark"></span>
                  Suscribirme al boletín de noticias
                </label>
              </div>
              
              <button type="submit" class="btn btn--cta btn--large" :disabled="isSubmitting">
                <i class="fas fa-paper-plane"></i>
                {{ isSubmitting ? 'Enviando...' : 'Enviar Mensaje' }}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
    
    <!-- Mapa -->
    <section class="section section--light">
      <div class="container">
        <div class="map-section">
          <h2 class="text-center mb-8">Ubicación</h2>
          <div class="map-container">
            <iframe
              src="https://www.google.com/maps?q=Av+Brasil+3621,+Magdalena+del+Mar,+Lima,+Perú&hl=es&z=20&output=embed"
              width="100%"
              height="400"
              style="border:0;"
              allowfullscreen=""
              loading="lazy"
              referrerpolicy="no-referrer-when-downgrade"
              class="google-map"
            ></iframe>
            <p class="map-address">Av Brasil 3621, Magdalena del Mar. Lima - Perú</p>
          </div>
          
          <!-- Botones de Navegación -->
          <div class="navigation-buttons">
            <h3 class="navigation-title">Llegar con:</h3>
            <div class="navigation-grid">
              <a 
                href="https://www.google.com/maps/dir/?api=1&destination=Av+Brasil+3621,+Magdalena+del+Mar,+Lima,+Perú"
                target="_blank"
                rel="noopener noreferrer"
                class="nav-button nav-button--maps"
              >
                <i class="fab fa-google"></i>
                <span>Google Maps</span>
              </a>
              
              <a 
                href="https://m.uber.com/looking?dropoff[formatted_address]=Av+Brasil+3621,+Magdalena+del+Mar,+Lima,+Perú"
                target="_blank"
                rel="noopener noreferrer"
                class="nav-button nav-button--uber"
              >
                <i class="fab fa-uber"></i>
                <span>Uber</span>
              </a>
              
              <a 
                href="https://waze.com/ul?q=Av+Brasil+3621,+Magdalena+del+Mar,+Lima,+Perú&navigate=yes"
                target="_blank"
                rel="noopener noreferrer"
                class="nav-button nav-button--waze"
              >
                <i class="fab fa-waze"></i>
                <span>Waze</span>
              </a>
              
              <a 
                href="https://indriver.com/es/pe/ride?destination=Av+Brasil+3621,+Magdalena+del+Mar,+Lima,+Perú"
                target="_blank"
                rel="noopener noreferrer"
                class="nav-button nav-button--indriver"
              >
                <i class="fas fa-car"></i>
                <span>Indrive</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
    
    <!-- FAQ -->
    <section class="section">
      <div class="container">
        <h2 class="text-center mb-8">Preguntas Frecuentes</h2>
        <div class="faq-grid">
          <div class="faq-item" v-for="(faq, index) in faqs" :key="index">
            <div class="faq-question" @click="toggleFaq(index)">
              <h4>{{ faq.question }}</h4>
              <i class="fas fa-chevron-down" :class="{ 'faq-icon--rotated': faq.isOpen }"></i>
            </div>
            <div class="faq-answer" :class="{ 'faq-answer--open': faq.isOpen }">
              <p>{{ faq.answer }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
import Navbar from '@/components/Navbar.vue'

export default {
  name: 'Contact',
  components: {
    Navbar
  },
  data() {
    return {
      isSubmitting: false,
      form: {
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
        newsletter: false
      },
      faqs: [
        {
          question: '¿Cómo puedo agendar una cita?',
          answer: 'Puedes agendar una cita llamando al (+51) 933 598 495, enviando un email a citas@onkos.com, o usando nuestro formulario en línea en la sección "Agendar Cita".',
          isOpen: false
        },
        {
          question: '¿Qué documentos necesito para mi primera consulta?',
          answer: 'Para tu primera consulta necesitas: documento de identidad, historia clínica previa, resultados de exámenes recientes, y autorización de tu EPS si aplica.',
          isOpen: false
        },
        {
          question: '¿Trabajan con todas las EPS?',
          answer: 'Trabajamos con la mayoría de EPS del país. Te recomendamos contactarnos para confirmar la cobertura de tu plan específico.',
          isOpen: false
        },
        {
          question: '¿Ofrecen atención de emergencia?',
          answer: 'Sí, contamos con atención de emergencia 24/7. Para emergencias llama al (+51) 933 598 495.',
          isOpen: false
        },
        {
          question: '¿Cuánto tiempo dura una consulta oncológica?',
          answer: 'Una consulta oncológica típicamente dura entre 60-90 minutos, dependiendo de la complejidad del caso y las pruebas necesarias.',
          isOpen: false
        },
        {
          question: '¿Puedo traer un acompañante a la consulta?',
          answer: 'Sí, recomendamos que vengas acompañado por un familiar o persona de confianza, especialmente para la primera consulta.',
          isOpen: false
        }
      ]
    }
  },
  mounted() {
    this.updateMetaTags();
  },
  methods: {
    async submitForm() {
      this.isSubmitting = true
      
      try {
        // Simular envío del formulario
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        // Aquí normalmente se enviaría a un endpoint del backend
        console.log('Formulario enviado:', this.form)
        
        // Mostrar mensaje de éxito
        alert('¡Mensaje enviado exitosamente! Nos pondremos en contacto contigo pronto.')
        
        // Limpiar formulario
        this.form = {
          name: '',
          email: '',
          phone: '',
          subject: '',
          message: '',
          newsletter: false
        }
        
      } catch (error) {
        console.error('Error al enviar formulario:', error)
        alert('Hubo un error al enviar el mensaje. Por favor, intenta de nuevo.')
      } finally {
        this.isSubmitting = false
      }
    },
    
    toggleFaq(index) {
      this.faqs[index].isOpen = !this.faqs[index].isOpen
    },

    updateMetaTags() {
      document.title = 'Contacto - Onkos';
      
      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.name = 'description';
        document.head.appendChild(metaDesc);
      }
      metaDesc.content = 'Ponte en contacto con Onkos. Estamos aquí para ayudarte con tus consultas oncológicas.';
      
      // Open Graph
      this.setMetaTag('property', 'og:title', 'Contacto - Onkos');
      this.setMetaTag('property', 'og:description', 'Ponte en contacto con Onkos. Estamos aquí para ayudarte con tus consultas oncológicas.');
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
.contact-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
}

.contact-info {
  h2 {
    margin-bottom: 1rem;
    color: $primary-color;
  }
  
  p {
    margin-bottom: 2rem;
    color: $text-secondary;
    line-height: 1.6;
  }
}

.contact-items {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  margin-bottom: 3rem;
}

.contact-item {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
  
  &__icon {
    width: 50px;
    height: 50px;
    background: linear-gradient(135deg, $primary-color 0%, $secondary-color 100%);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 1.2rem;
    flex-shrink: 0;
  }
  
  &__content {
    h4 {
      margin-bottom: 0.5rem;
      color: $primary-color;
    }
    
    p {
      margin: 0;
      color: $text-secondary;
      line-height: 1.5;
    }
  }
}

.emergency-contact {
  background: $bg-light;
  padding: 2rem;
  border-radius: 16px;
  border-left: 4px solid $error-color;
  
  h3 {
    color: $error-color;
    margin-bottom: 1rem;
  }
  
  p {
    margin-bottom: 1rem;
    color: $text-secondary;
  }
  
  .emergency-phone {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    background: $error-color;
    color: white;
    padding: 1rem 2rem;
    border-radius: 8px;
    text-decoration: none;
    font-weight: 600;
    font-size: 1.1rem;
    transition: all 0.3s ease;
    
    &:hover {
      background: darken($error-color, 10%);
      transform: translateY(-2px);
    }
  }
}

.contact-form {
  background: white;
  padding: 2rem;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  
  h2 {
    margin-bottom: 2rem;
    color: $primary-color;
  }
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
    transition: border-color 0.3s ease;
    
    &:focus {
      outline: none;
      border-color: $primary-color;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }
  }
  
  textarea {
    resize: vertical;
    min-height: 120px;
  }
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  color: $text-secondary;
  
  input[type="checkbox"] {
    width: auto;
    margin-right: 0.5rem;
  }
}

.map-section {
  .map-container {
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  }
  
  .google-map {
    width: 100%;
    height: 400px;
    border-radius: 16px;
  }
  
  .map-address {
    text-align: center;
    margin-top: 1rem;
    color: $text-secondary;
    font-size: 0.9rem;
  }
  
  .navigation-buttons {
    margin-top: 2rem;
    text-align: center;
    
    .navigation-title {
      margin-bottom: 1.5rem;
      color: $primary-color;
      font-size: 1.2rem;
      font-weight: 600;
    }
  }
}

.navigation-grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 1rem;
  max-width: 800px;
  margin: 0 auto;
  
  @media (max-width: 768px) {
    flex-wrap: wrap;
    gap: 0.75rem;
  }
}

.nav-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem 1.5rem;
  border-radius: 12px;
  text-decoration: none;
  color: white;
  font-weight: 600;
  font-size: 0.9rem;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  flex: 1;
  min-width: 140px;
  max-width: 180px;
  
  @media (max-width: 768px) {
    min-width: 120px;
    max-width: 150px;
    padding: 0.875rem 1rem;
  }
  
  i {
    font-size: 1.75rem;
    margin-bottom: 0.25rem;
    
    @media (max-width: 768px) {
      font-size: 1.5rem;
    }
  }
  
  span {
    font-size: 0.85rem;
    
    @media (max-width: 768px) {
      font-size: 0.75rem;
    }
  }
  
  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
  }
  
  &--maps {
    background: linear-gradient(135deg, #4285F4 0%, #34A853 100%);
    
    &:hover {
      background: linear-gradient(135deg, #357AE8 0%, #2E8E47 100%);
    }
  }
  
  &--uber {
    background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%);
    
    &:hover {
      background: linear-gradient(135deg, #1a1a1a 0%, #000000 100%);
    }
  }
  
  &--waze {
    background: linear-gradient(135deg, #33CCFF 0%, #0066CC 100%);
    
    &:hover {
      background: linear-gradient(135deg, #1AB2E6 0%, #0055AA 100%);
    }
  }
  
  &--indriver {
    background: linear-gradient(135deg, #FF6B35 0%, #F7931E 100%);
    
    &:hover {
      background: linear-gradient(135deg, #E55A2B 0%, #E0841A 100%);
    }
  }
}

.faq-grid {
  display: grid;
  gap: 1rem;
  max-width: 800px;
  margin: 0 auto;
}

.faq-item {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.faq-question {
  padding: 1.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: background-color 0.3s ease;
  
  &:hover {
    background: $bg-light;
  }
  
  h4 {
    margin: 0;
    color: $primary-color;
  }
  
  .faq-icon {
    transition: transform 0.3s ease;
    
    &--rotated {
      transform: rotate(180deg);
    }
  }
}

.faq-answer {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease;
  
  &--open {
    max-height: 200px;
  }
  
  p {
    padding: 0 1.5rem 1.5rem;
    margin: 0;
    color: $text-secondary;
    line-height: 1.6;
  }
}
</style> 