<template>
  <div class="exam-reader">
    <!-- Usar el componente Navbar en lugar de header personalizado -->
    <Navbar @show-admin-login="showAdminLogin" @show-appointment-modal="showAppointmentModal" />

    <!-- Contenido Principal -->
    <main class="main-content">
      <div class="container">
        <div class="page-header">
          <h1 class="page-title">
            <i class="fas fa-robot"></i>
            ONKOS-View
          </h1>
          <p class="page-description" style="font-family: Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #333; text-align: justify; margin: 20px auto; max-width: 800px; padding: 0 20px;">
            Nuestro sistema le permite cargar imágenes de estudios médicos, resultados diagnósticos o fotografías de lesiones cutáneas, masas, protuberancias u otras alteraciones visibles, con el fin de obtener un análisis preliminar asistido por inteligencia artificial.
            <br><br>
            <span style="display: block; font-size: 14px; color: #b22222; font-weight: bold; margin-top: 10px;">
              ⚠️ Nota importante: Este servicio tiene únicamente un carácter de apoyo y orientación. No sustituye la valoración médica ni constituye un diagnóstico definitivo. Siempre debe ser complementado y validado por un profesional de la salud.
            </span>
          </p>
        </div>

        <!-- Área de Subida de Imágenes -->
        <div class="upload-section">
          <div class="upload-area" @drop="handleDrop" @dragover.prevent @dragenter.prevent
            :class="{ 'drag-over': isDragOver }">
            <div class="upload-content">
              <i class="fas fa-cloud-upload-alt upload-icon"></i>
              <h3>Sube tu imagen médica</h3>
              <p>Arrastra y suelta la imagen médica aquí o haz clic para seleccionar</p>
              <p class="upload-note">Solo se permite la carga de imágenes con carácter médico,<br> tales como exámenes, resultados diagnósticos, lesiones cutáneas,<br>  protuberancias u otras alteraciones visibles.</p>
              <button @click="triggerFileInput" class="upload-btn">
                Seleccionar Imagen Médica
              </button>
            </div>
            <input ref="fileInput" type="file" accept="image/*" multiple @change="handleFileSelect"
              style="display: none">
          </div>
        </div>

        <!-- Imágenes Subidas -->
        <div v-if="uploadedImages.length > 0" class="images-section">
          <h3>Imágenes subidas:</h3>
          <div class="images-grid">
            <div v-for="(image, index) in uploadedImages" :key="index" class="image-item">
              <img :src="image.preview" :alt="`Examen ${index + 1}`" class="exam-image" @click="showImageDetail(image.preview, `Examen ${index + 1}`)" title="Hacer clic para ver en detalle">
              <div class="image-actions">
                <button @click="removeImage(index)" class="remove-btn" title="Eliminar">
                  <i class="fas fa-trash"></i>
                </button>
                <button @click="analyzeImage(image)" class="analyze-btn" title="Analizar">
                  <i class="fas fa-brain"></i>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Análisis de IA -->
        <div v-if="isAnalyzing" class="analysis-section">
          <div class="analysis-status">
            <div class="loading-spinner">
              <i class="fas fa-cog fa-spin"></i>
            </div>
            <h3>Analizando examen con IA...</h3>
            <p>Esto puede tomar unos segundos</p>
          </div>
        </div>

        <!-- Resultados del Análisis -->
        <div v-if="analysisResults.length > 0" class="results-section">
          <h3>Resultados del Análisis:</h3>
          <div class="results-list">
            <div v-for="(result, index) in analysisResults" :key="index" class="result-item">
              <div class="result-header">
                <h4>Examen {{ index + 1 }}</h4>
                <button @click="copyToClipboard(result.content)" class="copy-btn" title="Copiar">
                  <i class="fas fa-copy"></i>
                </button>
              </div>
              <div class="result-content" v-html="formatResult(result.content)"></div>
              <div class="result-actions">
                <button @click="askFollowUpQuestion(index)" class="follow-up-btn">
                  <i class="fas fa-question-circle"></i>
                  Hacer pregunta adicional
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Modal para ver imagen en detalle -->
        <div v-if="showImageModal" class="modal-overlay" @click="closeImageModal">
          <div class="modal image-modal" @click.stop>
            <div class="modal-header">
              <h3>
                <i class="fas fa-image"></i>
                Vista Detallada
              </h3>
              <button @click="closeImageModal" class="close-btn">
                <i class="fas fa-times"></i>
              </button>
            </div>
            <div class="modal-content">
              <div class="image-detail-container">
                <img :src="selectedImageUrl" :alt="selectedImageAlt" class="detail-image">
              </div>
              <div class="modal-actions">
                <button @click="closeImageModal" class="btn btn-primary">
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Modal para mensajes de error/advertencia -->
        <div v-if="showErrorModal" class="modal-overlay" @click="closeErrorModal">
          <div class="modal error-modal" @click.stop>
            <div class="modal-header" :class="{ 
              'error-header': errorType === 'error', 
              'warning-header': errorType === 'warning',
              'success-header': errorType === 'success'
            }">
              <h3>
                <i :class="{
                  'fas fa-exclamation-triangle': errorType === 'error',
                  'fas fa-exclamation-circle': errorType === 'warning',
                  'fas fa-check-circle': errorType === 'success'
                }"></i>
                {{ 
                  errorType === 'error' ? 'Error' : 
                  errorType === 'warning' ? 'Advertencia' : 
                  'Éxito' 
                }}
              </h3>
              <button @click="closeErrorModal" class="close-btn">
                <i class="fas fa-times"></i>
              </button>
            </div>
            <div class="modal-content">
              <div class="error-message">
                <p>{{ errorMessage }}</p>
              </div>
              <div class="modal-actions">
                <button @click="closeErrorModal" class="btn btn-primary">
                  Entendido
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Modal para preguntas adicionales -->
        <div v-if="showFollowUpModal" class="modal-overlay" @click="closeFollowUpModal">
          <div class="modal" @click.stop>
            <div class="modal-header">
              <h3>Pregunta Adicional</h3>
              <button @click="closeFollowUpModal" class="close-btn">
                <i class="fas fa-times"></i>
              </button>
            </div>
            <div class="modal-content">
              <div class="form-group">
                <label for="followUpQuestion">Tu pregunta:</label>
                <textarea id="followUpQuestion" v-model="followUpQuestion"
                  placeholder="Ej: ¿Qué significa esto? ¿Es grave? ¿Qué debo hacer?" rows="3"
                  class="form-control"></textarea>
              </div>
            </div>
            <div class="modal-footer">
              <button @click="closeFollowUpModal" class="btn btn-secondary">
                Cancelar
              </button>
              <button @click="sendFollowUpQuestion" class="btn btn-primary" :disabled="!followUpQuestion.trim()">
                Enviar Pregunta
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Footer -->
    <footer class="footer">
      <div class="container">
        <div class="footer__content">
          <div class="footer__section">
            <h3>Onkos Instituto del Cáncer</h3>
            <p style="color: white;">Centro especializado en oncología comprometido con la excelencia médica y el cuidado compasivo de nuestros pacientes.</p>
            <div class="footer__social">
              <a href="#"><i class="fab fa-facebook"></i></a>
              <a href="#"><i class="fab fa-twitter"></i></a>
              <a href="#"><i class="fab fa-instagram"></i></a>
              <a href="#"><i class="fab fa-linkedin"></i></a>
            </div>
          </div>
          
          <div class="footer__section">
            <h4>Servicios</h4>
            <ul>
              <li><a href="/servicios">Consultas Oncológicas</a></li>
              <li><a href="/servicios">Quimioterapia</a></li>
              <li><a href="/servicios">Radioterapia</a></li>
              <li><a href="/servicios">Cirugía Oncológica</a></li>
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
          </div>
          
          <div class="footer__section">
            <h4>Enlaces Rápidos</h4>
            <ul>
              <li><router-link to="/">Inicio</router-link></li>
              <li><router-link to="/especialistas">Especialistas</router-link></li>
              <li><router-link to="/contacto">Contacto</router-link></li>
              <li><button @click="showAppointmentModal" class="footer-link">Agendar Cita</button></li>
            </ul>
          </div>
        </div>
        
        <div class="footer__bottom">
          <p style="color: white;">&copy; 2024 Onkos Instituto del Cáncer. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>

    <!-- Admin Login Modal -->
    <AdminLogin 
      :show-modal="showAdminLoginModal" 
      @close="showAdminLoginModal = false"
      @login-success="handleAdminLoginSuccess"
    />
  </div>
</template>

<script>
import Navbar from '@/components/Navbar.vue'
import AdminLogin from '@/components/AdminLogin.vue'

export default {
  name: 'ExamReader',
  components: {
    Navbar,
    AdminLogin
  },
  data() {
    return {
      uploadedImages: [],
      isAnalyzing: false,
      analysisResults: [],
      isDragOver: false,
      showFollowUpModal: false,
      followUpQuestion: '',
      selectedImageIndex: null,
      showAdminLoginModal: false,
      showAppointmentModal: false,
      showErrorModal: false,
      errorMessage: '',
      errorType: 'error', // 'error' o 'warning'
      showImageModal: false,
      selectedImageUrl: '',
      selectedImageAlt: ''
    }
  },
  methods: {
    // Métodos para Navbar
    showAdminLogin() {
      this.showAdminLoginModal = true
    },
    
    showAppointmentModal() {
      this.showAppointmentModal = true
    },

    // Métodos para modal de error
    showError(message, type = 'error') {
      this.errorMessage = message
      this.errorType = type
      this.showErrorModal = true
    },

    closeErrorModal() {
      this.showErrorModal = false
      this.errorMessage = ''
      this.errorType = 'error'
    },

    // Métodos para modal de imagen
    showImageDetail(imageUrl, imageAlt) {
      this.selectedImageUrl = imageUrl
      this.selectedImageAlt = imageAlt
      this.showImageModal = true
    },

    closeImageModal() {
      this.showImageModal = false
      this.selectedImageUrl = ''
      this.selectedImageAlt = ''
    },

    // Manejo de archivos
    triggerFileInput() {
      this.$refs.fileInput.click()
    },

    handleFileSelect(event) {
      const files = Array.from(event.target.files)
      this.processFiles(files)
    },

    handleDrop(event) {
      this.isDragOver = false
      const files = Array.from(event.dataTransfer.files)
      this.processFiles(files)
    },

    processFiles(files) {
      files.forEach(file => {
        if (file.type.startsWith('image/')) {
          const reader = new FileReader()
          reader.onload = (e) => {
            this.uploadedImages.push({
              file: file,
              preview: e.target.result,
              name: file.name
            })
          }
          reader.readAsDataURL(file)
        }
      })
    },

    removeImage(index) {
      this.uploadedImages.splice(index, 1)
      // También remover el resultado correspondiente si existe
      if (this.analysisResults[index]) {
        this.analysisResults.splice(index, 1)
      }
    },

    // Análisis con IA
    async analyzeImage(image) {
      this.isAnalyzing = true

      try {
        // Convertir imagen a base64
        const imageData = image.preview

        // Enviar a la API backend para análisis con Groq
        const response = await this.$http.post('/api/ai/analyze-exam', {
          image: imageData,
          prompt: `Eres una inteligencia artificial que analiza imágenes médicas y de rostros con fines interpretativos. 
Tu objetivo es ayudar a las personas a comprender mejor sus resultados médicos o características faciales, pero debes aclarar que tu análisis no reemplaza un diagnóstico médico.

Al generar tu respuesta, usa un lenguaje claro, sencillo y accesible para cualquier persona, incluso si no tiene conocimientos en medicina o ciencias.

Comienza siempre tu explicación con una frase que indique que eres una IA, que tu lectura es solo una ayuda y que no es un diagnóstico médico.

Si la imagen es un examen médico (radiografías, análisis de sangre, resonancias, etc.), explica de forma clara, paso a paso, lo que muestra el examen, evitando tecnicismos o explicándolos cuando no se puedan evitar. Utiliza ejemplos cotidianos si es útil.

Si la imagen es de un rostro, analiza las características faciales visibles, posibles signos de afecciones cutáneas, cambios en la piel, o cualquier aspecto que pueda ser relevante desde el punto de vista médico, siempre con la advertencia de que no es un diagnóstico.

Finaliza invitando a la persona a consultar a los médicos especialistas de Onkos si tiene cualquier duda o quiere una evaluación profesional.`
        });

        // Verificar si la respuesta indica que no es una imagen médica
        if (response.data.analysis.startsWith('ERROR:')) {
          // Mostrar error específico para imágenes no médicas
          this.showError(response.data.analysis, 'error')
          return
        }

        // Agregar resultado
        this.analysisResults.push({
          imageIndex: this.uploadedImages.indexOf(image),
          content: response.data.analysis,
          timestamp: new Date()
        })

      } catch (error) {
        console.error('Error analizando imagen:', error)
        this.showError('Error al analizar la imagen. Por favor, intenta de nuevo.', 'error')
      } finally {
        this.isAnalyzing = false
      }
    },

    // Preguntas adicionales
    askFollowUpQuestion(imageIndex) {
      this.selectedImageIndex = imageIndex
      this.showFollowUpModal = true
    },

    async sendFollowUpQuestion() {
      if (!this.followUpQuestion.trim()) return

      try {
        const image = this.uploadedImages[this.selectedImageIndex]
        const previousResult = this.analysisResults[this.selectedImageIndex]

        const response = await this.$http.post('/api/ai/follow-up', {
          image: image.preview,
          previousAnalysis: previousResult.content,
          question: this.followUpQuestion
        })

        // Actualizar el resultado existente
        this.analysisResults[this.selectedImageIndex].content = response.data.analysis

        this.closeFollowUpModal()
        this.followUpQuestion = ''

      } catch (error) {
        console.error('Error enviando pregunta:', error)
        this.showError('Error al enviar la pregunta. Por favor, intenta de nuevo.', 'error')
      }
    },

    closeFollowUpModal() {
      this.showFollowUpModal = false
      this.followUpQuestion = ''
      this.selectedImageIndex = null
    },

    // Utilidades
    formatResult(content) {
      // Convertir markdown a HTML básico
      return content
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n/g, '<br>')
    },

    async copyToClipboard(text) {
      try {
        await navigator.clipboard.writeText(text)
        this.showError('Resultado copiado al portapapeles', 'success')
      } catch (error) {
        console.error('Error copiando al portapapeles:', error)
        // Fallback para navegadores antiguos
        const textArea = document.createElement('textarea')
        textArea.value = text
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
        this.showError('Resultado copiado al portapapeles', 'success')
      }
    },

    handleAdminLoginSuccess() {
      this.showAdminLoginModal = false
      this.showError('Inicio de sesión exitoso como administrador.', 'success')
      // Aquí puedes redirigir al usuario a la página de administración
      // o mostrar un mensaje de bienvenida.
    }
  }
}
</script>

<style scoped lang="scss">
.exam-reader {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* Main Content */
.main-content {
  flex: 1;
  padding: 2rem 0;
  margin-top: 120px; /* Espacio para el header fijo */
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
}

.page-header {
  text-align: center;
  margin-bottom: 3rem;
  padding-top: 2rem; /* Espacio adicional en la parte superior */
}

.page-title {
  font-size: 2.5rem;
  color: #333;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}

.page-title i {
  color: #007bff;
  font-size: 2rem;
}

.page-description {
  font-size: 1.2rem;
  color: #666;
  max-width: 600px;
  margin: 0 auto;
}

/* Upload Section */
.upload-section {
  margin-bottom: 3rem;
}

.upload-area {
  border: 3px dashed #ddd;
  border-radius: 12px;
  padding: 3rem;
  text-align: center;
  transition: all 0.3s;
  cursor: pointer;
}

.upload-area:hover,
.upload-area.drag-over {
  border-color: #007bff;
  background-color: #f8f9ff;
}

.upload-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.upload-icon {
  font-size: 4rem;
  color: #007bff;
}

.upload-btn {
  background: #007bff;
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 8px;
  font-size: 1.1rem;
  cursor: pointer;
  transition: background 0.3s;
}

.upload-btn:hover {
  background: #0056b3;
}

.upload-note {
  font-size: 0.9rem;
  color: #666;
  font-style: italic;
  margin-top: 0.5rem;
}

/* Images Section */
.images-section {
  margin-bottom: 3rem;
}

.images-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-top: 1rem;
}

.image-item {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.exam-image {
  width: 100%;
  height: 200px;
  object-fit: cover;
  cursor: pointer;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  
  &:hover {
    transform: scale(1.02);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
}

.image-actions {
  position: absolute;
  top: 10px;
  right: 10px;
  display: flex;
  gap: 0.5rem;
}

.remove-btn,
.analyze-btn {
  background: rgba(0, 0, 0, 0.7);
  color: white;
  border: none;
  width: 35px;
  height: 35px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.3s;
}

.remove-btn:hover {
  background: rgba(220, 53, 69, 0.9);
}

.analyze-btn:hover {
  background: rgba(0, 123, 255, 0.9);
}

/* Analysis Section */
.analysis-section {
  text-align: center;
  margin: 2rem 0;
  padding: 2rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.loading-spinner {
  font-size: 3rem;
  color: #007bff;
  margin-bottom: 1rem;
}

/* Results Section */
.results-section {
  margin-top: 3rem;
}

.results-list {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.result-item {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  border-left: 4px solid #007bff;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #eee;
}

.result-header h4 {
  margin: 0;
  color: #333;
}

.copy-btn {
  background: #6c757d;
  color: white;
  border: none;
  padding: 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.3s;
}

.copy-btn:hover {
  background: #545b62;
}

.result-content {
  line-height: 1.6;
  color: #333;
  margin-bottom: 1.5rem;
}

.result-actions {
  text-align: center;
}

.follow-up-btn {
  background: #28a745;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.3s;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.follow-up-btn:hover {
  background: #218838;
}

/* Modal */
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
  width: 500px;
  max-width: 90vw;
  max-height: 90vh;
  overflow: hidden;
}

.modal-header {
  padding: 1.5rem;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
}

.modal-content {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #333;
}

.form-control {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  resize: vertical;
}

.form-control:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
}

.modal-footer {
  padding: 1.5rem;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  transition: background 0.3s;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #0056b3;
}

.btn-primary:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #545b62;
}

/* Modal de Error/Advertencia/Éxito */
.error-modal {
  max-width: 500px;
  width: 90%;
}

.error-header {
  background: #dc3545;
  color: white;
}

.warning-header {
  background: #ffc107;
  color: #212529;
}

.success-header {
  background: #28a745;
  color: white;
}

.error-header h3,
.warning-header h3,
.success-header h3 {
  color: inherit;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.error-header .close-btn,
.success-header .close-btn {
  color: white;
}

.warning-header .close-btn {
  color: #212529;
}

.error-message {
  text-align: center;
  padding: 1rem 0;
}

.error-message p {
  margin: 0;
  font-size: 1.1rem;
  line-height: 1.5;
}

.modal-actions {
  display: flex;
  justify-content: center;
  padding-top: 1rem;
}

/* Modal de Imagen */
.image-modal {
  max-width: 90vw;
  max-height: 90vh;
  width: auto;
  height: auto;
}

.image-detail-container {
  display: flex;
  justify-content: center;
  align-items: center;
  max-height: 70vh;
  overflow: hidden;
  border-radius: 8px;
  background: #f8f9fa;
  padding: 1rem;
}

.detail-image {
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  object-fit: contain;
  border-radius: 4px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

@media (max-width: 768px) {
  .image-modal {
    max-width: 95vw;
    max-height: 95vh;
    margin: 1rem;
  }
  
  .image-detail-container {
    max-height: 60vh;
    padding: 0.5rem;
  }
}

/* Footer */
.footer {
  background: #0f172a;  /* $bg-dark */
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
      color: #1e3a8a !important;  /* $primary-color - forzar especificidad */
    }
    
    p {
      margin-bottom: 1rem;
      opacity: 0.8;
    }
    
    ul {
      list-style: none;
      
      li {
        margin-bottom: 0.5rem;
        
        a, .footer-link {
          color: white;
          text-decoration: none;
          opacity: 0.8;
          transition: opacity 0.3s ease;
          background: none;
          border: none;
          cursor: pointer;
          font-size: inherit;
          font-family: inherit;
          
          &:hover {
            opacity: 1;
            color: #1e3a8a !important;  /* $primary-color - forzar especificidad */
          }
        }
        
        /* Estilo específico para el botón Agendar Cita */
        .footer-link {
          &:hover {
            color: #1e3a8a !important;
            text-decoration: underline;
          }
        }
        
        i {
          margin-right: 0.5rem;
          color: #1e3a8a !important;  /* $primary-color - forzar especificidad */
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
      background: #1e3a8a;  /* $primary-color */
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      text-decoration: none;
      transition: all 0.3s ease;
      
      &:hover {
        background: #0f766e;  /* $secondary-color */
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
    margin-top: 100px; /* Menos espacio en móviles */
  }
  
  .page-header {
    padding-top: 1rem; /* Menos padding en móviles */
  }
  
  .page-title {
    font-size: 2rem;
  }

  .upload-area {
    padding: 2rem 1rem;
  }

  .images-grid {
    grid-template-columns: 1fr;
  }

  .modal {
    width: 95%;
  }
}

@media (max-width: 480px) {
  .main-content {
    margin-top: 80px; /* Aún menos espacio en pantallas muy pequeñas */
  }
  
  .page-header {
    padding-top: 0.5rem;
  }
}
</style>