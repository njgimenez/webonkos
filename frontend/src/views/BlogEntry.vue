<template>
  <div class="blog-entry-page">
    <div v-if="loading" class="loading">
      <i class="fas fa-spinner fa-spin"></i>
      <p>Cargando entrada...</p>
    </div>
    
    <div v-else-if="!entrada" class="not-found">
      <i class="fas fa-exclamation-triangle"></i>
      <h2>Entrada no encontrada</h2>
      <p>La entrada que buscas no existe o ha sido eliminada.</p>
      <router-link to="/blog" class="btn btn--primary">
        Volver al Blog
      </router-link>
    </div>
    
    <!-- Layout para Páginas Web -->
    <div v-else-if="entrada.tipo_entrada === 'pagina'" class="pagina-web-layout">
      <!-- Header del Home -->
      <Navbar @show-admin-login="showAdminLogin" @show-appointment-modal="showAppointmentModal" />
      
      <!-- Contenido de la página -->
      <div class="pagina-content">
        <div class="container">
          <!-- Hero section con título e imagen fusionados -->
          <div class="pagina-hero">
            <div v-if="entrada.imagen_principal" class="hero-background">
              <img :src="buildImageUrl(entrada.imagen_principal)" :alt="entrada.titulo">
            </div>
            <div class="hero-overlay">
              <h1 class="hero-title">{{ entrada.titulo }}</h1>
            </div>
          </div>
          
          <!-- Contenido principal -->
          <div class="pagina-body">
            <div class="pagina-content" v-html="processContentImages(entrada.contenido)"></div>
          </div>
        </div>
      </div>
      
      <!-- Footer del Home -->
      <footer class="footer">
        <div class="container">
          <div class="footer-content">
            <div class="footer-section">
              <h3>Onkos Instituto del Cáncer</h3>
              <p style="color: white;">Centro especializado en oncología comprometido con la excelencia médica y el cuidado compasivo de nuestros pacientes.</p>
              <div class="social-links">
                <a href="#" class="social-link"><i class="fab fa-facebook-f"></i></a>
                <a href="#" class="social-link"><i class="fab fa-twitter"></i></a>
                <a href="#" class="social-link"><i class="fab fa-instagram"></i></a>
                <a href="#" class="social-link"><i class="fab fa-linkedin-in"></i></a>
              </div>
            </div>
            
            <div class="footer-section">
              <h4>Servicios</h4>
              <ul>
                <li><a href="#">Consultas Oncológicas</a></li>
                <li><a href="#">Quimioterapia</a></li>
                <li><a href="#">Radioterapia</a></li>
                <li><a href="#">Cirugía Oncológica</a></li>
              </ul>
            </div>
            
            <div class="footer-section">
              <h4>Contacto</h4>
              <ul>
                <li><i class="fas fa-phone"></i> (+51) 933 598 495</li>
                <li><i class="fas fa-envelope"></i> contacto@onkos.com</li>
                <li><i class="fas fa-map-marker-alt"></i> Av Brasil 3621, Magdalena del Mar. Lima - Perú</li>
                <li><i class="fas fa-clock"></i> Lunes-Viernes, 9am a 6pm</li>
              </ul>
            </div>
            
            <div class="footer-section">
              <h4>Enlaces Rápidos</h4>
              <ul>
                <li><router-link to="/">Inicio</router-link></li>
                <li><router-link to="/doctors">Especialistas</router-link></li>
                <li><router-link to="/contact">Contacto</router-link></li>
                <li><router-link to="/appointment">Agendar Cita</router-link></li>
              </ul>
            </div>
          </div>
          
          <div class="footer-bottom">
            <p style="color: white;">&copy; 2024 Onkos Instituto del Cáncer. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
    
    <!-- Layout para Entradas de Blog -->
    <div v-else class="entry-content">
      <!-- Header del Home -->
      <Navbar @show-admin-login="showAdminLogin" @show-appointment-modal="showAppointmentModal" />
      
      <!-- Header de la entrada -->
      <div class="entry-header">
        <div class="container">
          <nav class="breadcrumb">
            <router-link to="/">Inicio</router-link>
            <span class="separator">/</span>
            <router-link to="/blog">Blog</router-link>
            <span class="separator">/</span>
            <span class="current">{{ entrada.titulo }}</span>
          </nav>
          
          <div class="entry-meta">
            <div class="categorias-container">
              <span 
                v-for="cat in entrada.categorias_multiples" 
                :key="cat.id" 
                class="categoria categoria-multiple" 
                :style="{ backgroundColor: cat.color_hex }"
              >
                {{ cat.nombre }}
              </span>
              <span v-if="!entrada.categorias_multiples || entrada.categorias_multiples.length === 0" class="categoria sin-categoria">
                Sin categoría
              </span>
            </div>
            <span class="fecha">
              <i class="fas fa-calendar-alt"></i>
              {{ formatDate(entrada.fecha_publicacion || entrada.created_at) }}
            </span>
            <span class="autor" v-if="entrada.autor_nombre">
              <i class="fas fa-user"></i>
              {{ entrada.autor_nombre }}
            </span>
            <span class="vistas">
              <i class="fas fa-eye"></i>
              {{ entrada.vistas }} vistas
            </span>
          </div>
          
          <h1 class="entry-title">{{ entrada.titulo }}</h1>
          
          <p v-if="entrada.resumen" class="entry-excerpt">
            {{ entrada.resumen }}
          </p>
        </div>
      </div>
      
      <!-- Imagen principal -->
      <div v-if="entrada.imagen_principal" class="entry-hero">
        <div class="container">
          <img :src="buildImageUrl(entrada.imagen_principal)" :alt="entrada.titulo">
        </div>
      </div>
      
      <!-- Contenido principal -->
      <div class="entry-main">
        <div class="container">
          <div class="content-grid">
            <!-- Contenido de la entrada -->
            <article class="entry-body">
              <div class="entry-content" v-html="processContentImages(entrada.contenido)"></div>
              
              <!-- Tags -->
              <div v-if="entrada.tags && entrada.tags.length > 0" class="entry-tags">
                <h4>Tags:</h4>
                <div class="tags-list">
                  <span 
                    v-for="tag in entrada.tags" 
                    :key="tag"
                    class="tag"
                    @click="buscarPorTag(tag)"
                  >
                    #{{ tag }}
                  </span>
                </div>
              </div>
              
              <!-- Compartir -->
              <div class="entry-share">
                <h4>Compartir:</h4>
                <div class="share-buttons">
                  <button @click="compartirFacebook" class="share-btn facebook">
                    <i class="fab fa-facebook-f"></i>
                    Facebook
                  </button>
                  <button @click="compartirTwitter" class="share-btn twitter">
                    <i class="fab fa-twitter"></i>
                    Twitter
                  </button>
                  <button @click="compartirLinkedIn" class="share-btn linkedin">
                    <i class="fab fa-linkedin-in"></i>
                    LinkedIn
                  </button>
                  <button @click="copiarEnlace" class="share-btn copy">
                    <i class="fas fa-link"></i>
                    Copiar Enlace
                  </button>
                </div>
              </div>
            </article>
            
            <!-- Sidebar -->
            <aside class="entry-sidebar">
              <!-- Entradas relacionadas -->
              <div v-if="entradasRelacionadas.length > 0" class="sidebar-widget">
                <h3>Entradas Relacionadas</h3>
                <div class="related-entries">
                  <article 
                    v-for="relacionada in entradasRelacionadas" 
                    :key="relacionada.id"
                    class="related-entry"
                    @click="verEntrada(relacionada.slug)"
                  >
                    <div class="related-image">
                      <img 
                        v-if="relacionada.imagen_principal" 
                        :src="buildImageUrl(relacionada.imagen_principal)" 
                        :alt="relacionada.titulo"
                      >
                      <div v-else class="no-image">
                        <i class="fas fa-image"></i>
                      </div>
                    </div>
                    <div class="related-content">
                      <h4>{{ relacionada.titulo }}</h4>
                      <span class="related-date">
                        {{ formatDate(relacionada.fecha_publicacion || relacionada.created_at) }}
                      </span>
                    </div>
                  </article>
                </div>
              </div>
              
              <!-- Categorías -->
              <div class="sidebar-widget">
                <h3>Categorías</h3>
                <ul class="categories-list">
                  <li v-for="categoria in categorias" :key="categoria.id">
                    <button 
                      @click="filtrarPorCategoria(categoria.id)"
                      :class="['category-link', { active: entrada.categoria_id === categoria.id }]"
                    >
                      <span 
                        class="category-color" 
                        :style="{ backgroundColor: categoria.color_hex }"
                      ></span>
                      {{ categoria.nombre }}
                    </button>
                  </li>
                </ul>
              </div>
              
              <!-- Entradas recientes -->
              <div v-if="entradasRecientes.length > 0" class="sidebar-widget">
                <h3>Entradas Recientes</h3>
                <div class="recent-entries">
                  <article 
                    v-for="reciente in entradasRecientes" 
                    :key="reciente.id"
                    class="recent-entry"
                    @click="verEntrada(reciente.slug)"
                  >
                    <div class="recent-image">
                      <img 
                        v-if="reciente.imagen_principal" 
                        :src="buildImageUrl(reciente.imagen_principal)" 
                        :alt="reciente.titulo"
                      >
                      <div v-else class="no-image">
                        <i class="fas fa-image"></i>
                      </div>
                    </div>
                    <div class="recent-content">
                      <h4>{{ reciente.titulo }}</h4>
                      <span class="recent-date">
                        {{ formatDate(reciente.fecha_publicacion || reciente.created_at) }}
                      </span>
                    </div>
                  </article>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
      
      <!-- Navegación entre entradas -->
      <div class="entry-navigation">
        <div class="container">
          <div class="nav-links">
            <router-link 
              v-if="entradaAnterior" 
              :to="`/blog/${entradaAnterior.slug}`"
              class="nav-link prev"
            >
              <i class="fas fa-chevron-left"></i>
              <div class="nav-content">
                <span class="nav-label">Entrada Anterior</span>
                <span class="nav-title">{{ entradaAnterior.titulo }}</span>
              </div>
            </router-link>
            
            <div v-else class="nav-link prev disabled">
              <i class="fas fa-chevron-left"></i>
              <div class="nav-content">
                <span class="nav-label">Entrada Anterior</span>
                <span class="nav-title">No hay entrada anterior</span>
              </div>
            </div>
            
            <router-link 
              v-if="entradaSiguiente" 
              :to="`/blog/${entradaSiguiente.slug}`"
              class="nav-link next"
            >
              <div class="nav-content">
                <span class="nav-label">Entrada Siguiente</span>
                <span class="nav-title">{{ entradaSiguiente.titulo }}</span>
              </div>
              <i class="fas fa-chevron-right"></i>
            </router-link>
            
            <div v-else class="nav-link next disabled">
              <div class="nav-content">
                <span class="nav-label">Entrada Siguiente</span>
                <span class="nav-title">No hay entrada siguiente</span>
              </div>
              <i class="fas fa-chevron-right"></i>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Footer del Home -->
      <footer class="footer">
        <div class="container">
          <div class="footer-content">
            <div class="footer-section">
              <h3>Onkos Instituto del Cáncer</h3>
              <p style="color: white;">Centro especializado en oncología comprometido con la excelencia médica y el cuidado compasivo de nuestros pacientes.</p>
              <div class="social-links">
                <a href="#" class="social-link"><i class="fab fa-facebook-f"></i></a>
                <a href="#" class="social-link"><i class="fab fa-twitter"></i></a>
                <a href="#" class="social-link"><i class="fab fa-instagram"></i></a>
                <a href="#" class="social-link"><i class="fab fa-linkedin-in"></i></a>
              </div>
            </div>
            
            <div class="footer-section">
              <h4>Servicios</h4>
              <ul>
                <li><a href="#">Consultas Oncológicas</a></li>
                <li><a href="#">Quimioterapia</a></li>
                <li><a href="#">Radioterapia</a></li>
                <li><a href="#">Cirugía Oncológica</a></li>
              </ul>
            </div>
            
            <div class="footer-section">
              <h4>Contacto</h4>
              <ul>
                <li><i class="fas fa-phone"></i> (+51) 933 598 495</li>
                <li><i class="fas fa-envelope"></i> contacto@onkos.com</li>
                <li><i class="fas fa-map-marker-alt"></i> Av Brasil 3621, Magdalena del Mar. Lima - Perú</li>
                <li><i class="fas fa-clock"></i> Lunes-Viernes, 9am a 6pm</li>
              </ul>
            </div>
            
            <div class="footer-section">
              <h4>Enlaces Rápidos</h4>
              <ul>
                <li><router-link to="/">Inicio</router-link></li>
                <li><router-link to="/doctors">Especialistas</router-link></li>
                <li><router-link to="/contact">Contacto</router-link></li>
                <li><router-link to="/appointment">Agendar Cita</router-link></li>
              </ul>
            </div>
          </div>
          
          <div class="footer-bottom">
            <p style="color: white;">&copy; 2024 Onkos Instituto del Cáncer. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import Navbar from '@/components/Navbar.vue';

export default {
  name: 'BlogEntry',
  components: {
    Navbar
  },
  data() {
    return {
      entrada: null,
      categorias: [],
      entradasRelacionadas: [],
      entradasRecientes: [],
      entradaAnterior: null,
      entradaSiguiente: null,
      loading: true
    }
  },
  
  async mounted() {
    await this.loadEntrada();
  },
  
  watch: {
    '$route.params.slug'() {
      this.loadEntrada();
    }
  },
  
  methods: {
    buildImageUrl(pathOrUrl) {
      if (!pathOrUrl) return '';
      
      // Si es una URL de Cloudinary, devolverla tal como está
      if (pathOrUrl.includes('cloudinary.com')) {
        return pathOrUrl;
      }
      
      // Si es una URL del frontend, corregirla al backend
      if (pathOrUrl.startsWith('https://onkosweb.onrender.com/uploads/')) {
        return pathOrUrl.replace('https://onkosweb.onrender.com/', 'https://webiacontrol-back.onrender.com/');
      }
      
      // Si es una URL del backend local, corregirla al backend de producción
      if (pathOrUrl.startsWith('http://onkosweb.com:8080/uploads/')) {
        return pathOrUrl.replace('http://onkosweb.com:8080/', 'https://webiacontrol-back.onrender.com/');
      }
      
      // Si es una URL del backend incorrecto, corregirla
      if (pathOrUrl.startsWith('https://onkos-backend.onrender.com/uploads/')) {
        return pathOrUrl.replace('https://onkos-backend.onrender.com/', 'https://webiacontrol-back.onrender.com/');
      }
      
      const isAbsolute = /^https?:\/\//i.test(pathOrUrl);
      const isDev = window.location && window.location.port === '8080';
      
      if (isAbsolute) {
        try {
          const url = new URL(pathOrUrl);
          if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
            // En desarrollo, usar ruta relativa para evitar CORS
            return url.pathname;
          }
          return pathOrUrl;
        } catch (e) {
          return pathOrUrl;
        }
      }
      
      // Relativa como "/uploads/..." - construir URL completa
      if (process.env.NODE_ENV === 'production') {
        // En producción, usar la URL del backend
        const backendUrl = process.env.VUE_APP_API_URL || 'https://webiacontrol-back.onrender.com';
        return `${backendUrl}${pathOrUrl}`;
      } else {
        // En desarrollo, usar ruta relativa para el proxy
        return pathOrUrl;
      }
    },
    
    // Función para procesar contenido HTML y corregir URLs de imágenes
    processContentImages(htmlContent) {
      if (!htmlContent) return '';
      
      // En producción, corregir todas las URLs de imágenes en el contenido
      if (process.env.NODE_ENV === 'production') {
        const backendUrl = process.env.VUE_APP_API_URL || 'https://webiacontrol-back.onrender.com';
        
        // Corregir URLs del frontend al backend
        htmlContent = htmlContent.replace(
          /src="https:\/\/onkosweb\.onrender\.com\/uploads\//g,
          `src="${backendUrl}/uploads/`
        );
        
        // Corregir URLs del backend local al backend de producción
        htmlContent = htmlContent.replace(
          /src="http:\/\/onkosweb\.com:8080\/uploads\//g,
          `src="${backendUrl}/uploads/`
        );
        
        // Corregir URLs relativas
        htmlContent = htmlContent.replace(
          /src="\/uploads\//g,
          `src="${backendUrl}/uploads/`
        );
      }
      
      return htmlContent;
    },
    async loadEntrada() {
      const slug = this.$route.params.slug;
      const cacheKey = `blog_entry_${slug}`;
      
      // Intentar cargar del caché primero
      const cachedData = sessionStorage.getItem(cacheKey);
      if (cachedData) {
        try {
          const { data, timestamp } = JSON.parse(cachedData);
          // Validez del caché: 30 minutos para entradas individuales (contenido estático)
          if (Date.now() - timestamp < 30 * 60 * 1000) {
            this.entrada = data;
            this.loading = false;
            
            // Cargar datos relacionados en segundo plano si no están en caché o para refrescar
            this.loadRelatedData();
            
            // Actualizar SEO inmediatamente
            this.updateMetaTags();
            return;
          }
        } catch (e) {
          console.warn('Error al leer caché de entrada', e);
          sessionStorage.removeItem(cacheKey);
        }
      }

      this.loading = true;
      
      try {
        const response = await axios.get(`/api/blog/entradas/slug/${slug}`);
        this.entrada = response.data;
        
        // Cargar categorías múltiples para la entrada
        try {
          const categoriasResponse = await axios.get(`/api/blog/entradas/${this.entrada.id}/categorias`);
          this.entrada.categorias_multiples = categoriasResponse.data;
        } catch (error) {
          console.error('Error cargando categorías múltiples:', error);
          this.entrada.categorias_multiples = [];
        }
        
        // Guardar en caché
        sessionStorage.setItem(cacheKey, JSON.stringify({
          data: this.entrada,
          timestamp: Date.now()
        }));
        
        // Cargar datos relacionados
        await this.loadRelatedData();
        
        // Actualizar SEO
        this.updateMetaTags();
        
      } catch (error) {
        console.error('Error cargando entrada:', error);
        this.entrada = null;
      } finally {
        this.loading = false;
      }
    },
    
    async loadRelatedData() {
      await Promise.all([
        this.loadCategorias(),
        this.loadEntradasRelacionadas(),
        this.loadEntradasRecientes(),
        this.loadNavegacion()
      ]);
    },

    updateMetaTags() {
      if (!this.entrada) return;

      // Título
      document.title = `${this.entrada.titulo} - Blog de Onkos`;

      // Meta Description
      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.name = 'description';
        document.head.appendChild(metaDesc);
      }
      metaDesc.content = this.entrada.meta_description || this.entrada.resumen || this.entrada.titulo;

      // Open Graph Tags (Facebook, LinkedIn)
      this.setMetaTag('property', 'og:title', this.entrada.titulo);
      this.setMetaTag('property', 'og:description', this.entrada.meta_description || this.entrada.resumen);
      this.setMetaTag('property', 'og:image', this.buildImageUrl(this.entrada.imagen_principal));
      this.setMetaTag('property', 'og:url', window.location.href);
      this.setMetaTag('property', 'og:type', 'article');

      // Twitter Cards
      this.setMetaTag('name', 'twitter:card', 'summary_large_image');
      this.setMetaTag('name', 'twitter:title', this.entrada.titulo);
      this.setMetaTag('name', 'twitter:description', this.entrada.meta_description || this.entrada.resumen);
      this.setMetaTag('name', 'twitter:image', this.buildImageUrl(this.entrada.imagen_principal));
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
    
    async loadCategorias() {
      try {
        const response = await axios.get('/api/blog/categorias');
        this.categorias = response.data;
      } catch (error) {
        console.error('Error cargando categorías:', error);
        this.categorias = [];
      }
    },
    
    async loadEntradasRelacionadas() {
      if (!this.entrada) return;
      
      try {
        const response = await axios.get('/api/blog/entradas', {
          params: {
            categoria_id: this.entrada.categoria_id,
            estado: 'publicado',
            limit: 3
          }
        });
        
        // Excluir la entrada actual
        this.entradasRelacionadas = response.data
          .filter(e => e.id !== this.entrada.id)
          .slice(0, 3);
      } catch (error) {
        console.error('Error cargando entradas relacionadas:', error);
        this.entradasRelacionadas = [];
      }
    },
    
    async loadEntradasRecientes() {
      try {
        const response = await axios.get('/api/blog/entradas', {
          params: {
            estado: 'publicado',
            limit: 5
          }
        });
        
        // Excluir la entrada actual
        this.entradasRecientes = response.data
          .filter(e => e.id !== this.entrada?.id)
          .slice(0, 5);
      } catch (error) {
        console.error('Error cargando entradas recientes:', error);
        this.entradasRecientes = [];
      }
    },
    
    async loadNavegacion() {
      if (!this.entrada) return;
      
      try {
        const response = await axios.get('/api/blog/entradas', {
          params: {
            estado: 'publicado',
            limit: 100 // Para obtener más entradas para navegación
          }
        });
        
        const entradas = response.data;
        const currentIndex = entradas.findIndex(e => e.id === this.entrada.id);
        
        if (currentIndex > 0) {
          this.entradaAnterior = entradas[currentIndex - 1];
        }
        
        if (currentIndex < entradas.length - 1) {
          this.entradaSiguiente = entradas[currentIndex + 1];
        }
      } catch (error) {
        console.error('Error cargando navegación:', error);
      }
    },
    
    getCategoriaNombre(categoriaId) {
      const categoria = this.categorias.find(c => c.id === categoriaId);
      return categoria ? categoria.nombre : 'Sin categoría';
    },
    
    getCategoriaColor(categoriaId) {
      const categoria = this.categorias.find(c => c.id === categoriaId);
      return categoria ? categoria.color_hex : '#ccc';
    },
    
    formatDate(date) {
      return new Date(date).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    },
    
    verEntrada(slug) {
      this.$router.push(`/blog/${slug}`);
    },
    
    buscarPorTag(tag) {
      this.$router.push(`/blog?tag=${encodeURIComponent(tag)}`);
    },
    
    filtrarPorCategoria(categoriaId) {
      this.$router.push(`/blog?categoria=${categoriaId}`);
    },
    
    compartirFacebook() {
      const url = encodeURIComponent(window.location.href);
      const text = encodeURIComponent(this.entrada.titulo);
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
    },
    
    compartirTwitter() {
      const url = encodeURIComponent(window.location.href);
      const text = encodeURIComponent(this.entrada.titulo);
      window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, '_blank');
    },
    
    compartirLinkedIn() {
      const url = encodeURIComponent(window.location.href);
      const title = encodeURIComponent(this.entrada.titulo);
      window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank');
    },
    
    async copiarEnlace() {
      try {
        await navigator.clipboard.writeText(window.location.href);
        alert('Enlace copiado al portapapeles');
      } catch (error) {
        console.error('Error copiando enlace:', error);
        alert('Error al copiar el enlace');
      }
    },
    
    showAdminLogin() {
      // Emitir evento para mostrar login de admin
      this.$emit('show-admin-login');
    },
    
    showAppointmentModal() {
      // Emitir evento para mostrar modal de citas
      this.$emit('show-appointment-modal');
    }
  }
}
</script>

<style lang="scss" scoped>
.blog-entry-page {
  min-height: 100vh;
  background: #f8f9fa;
}

.loading, .not-found {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  text-align: center;
  color: #666;
  
  i {
    font-size: 3rem;
    margin-bottom: 1rem;
    color: #ccc;
  }
  
  h2 {
    margin: 0 0 1rem 0;
    color: #333;
  }
  
  p {
    margin: 0 0 2rem 0;
  }
}

.entry-content {
  .entry-header {
    background: white;
    padding: 3rem 0;
    border-bottom: 1px solid #eee;
    
    .breadcrumb {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 2rem;
      font-size: 0.9rem;
      
      a {
        color: #667eea;
        text-decoration: none;
        
        &:hover {
          text-decoration: underline;
        }
      }
      
      .separator {
        color: #ccc;
      }
      
      .current {
        color: #666;
        font-weight: 500;
      }
    }
    
    .entry-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      margin-bottom: 1.5rem;
      align-items: center;
      
      .categorias-container {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        margin-bottom: 0.5rem;
        
        .categoria {
          padding: 0.25rem 0.75rem;
          border-radius: 15px;
          color: white;
          font-size: 0.8rem;
          font-weight: 500;
          
          &.categoria-multiple {
            margin-right: 0.25rem;
          }
          
          &.sin-categoria {
            background: #6b7280;
            color: white;
          }
        }
      }
      
      .categoria {
        padding: 0.25rem 0.75rem;
        border-radius: 15px;
        color: white;
        font-size: 0.8rem;
        font-weight: 500;
      }
      
      .fecha, .autor, .vistas {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        color: #666;
        font-size: 0.9rem;
        
        i {
          color: #999;
        }
      }
    }
    
    .entry-title {
      font-size: 2.5rem;
      font-weight: 700;
      margin: 0 0 1rem 0;
      color: #333;
      line-height: 1.2;
    }
    
    .entry-excerpt {
      font-size: 1.2rem;
      color: #666;
      line-height: 1.6;
      margin: 0;
    }
  }
  
  .entry-hero {
    padding: 3rem 0;
    
    img {
      width: 100%;
      max-height: 500px;
      object-fit: cover;
      border-radius: 12px;
      background: transparent;
      image-rendering: -webkit-optimize-contrast;
      image-rendering: crisp-edges;
      -webkit-backface-visibility: hidden;
      backface-visibility: hidden;
      transform: translateZ(0);
    }
  }
  
  .entry-main {
    padding: 3rem 0;
    
    .content-grid {
      display: grid;
      gap: 3rem;
      
      @media (min-width: 1024px) {
        grid-template-columns: 1fr 300px;
      }
    }
  }
  
  .entry-body {
    background: white;
    border-radius: 12px;
    padding: 2rem;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    
    .entry-content {
      font-size: 1.1rem;
      line-height: 1.8;
      color: #333;
      
      h1, h2, h3, h4, h5, h6 {
        margin: 2rem 0 1rem 0;
        color: #333;
        font-weight: 600;
      }
      
      h1 { font-size: 2rem; }
      h2 { font-size: 1.75rem; }
      h3 { font-size: 1.5rem; }
      h4 { font-size: 1.25rem; }
      
      p {
        margin: 0 0 1.5rem 0;
      }
      
      ul, ol {
        margin: 0 0 1.5rem 0;
        padding-left: 2rem;
        
        li {
          margin-bottom: 0.5rem;
        }
      }
      
      blockquote {
        border-left: 4px solid #667eea;
        padding-left: 1.5rem;
        margin: 2rem 0;
        font-style: italic;
        color: #666;
      }
      
      img {
        max-width: 100%;
        height: auto;
        border-radius: 8px;
        margin: 1.5rem 0;
        background: transparent;
        image-rendering: -webkit-optimize-contrast;
        image-rendering: crisp-edges;
        -webkit-backface-visibility: hidden;
        backface-visibility: hidden;
        transform: translateZ(0);
      }
      
      // Regla específica para imágenes PNG con transparencia
      img[src*=".png"], img[src*=".PNG"] {
        border-radius: 0;
        box-shadow: none;
      }
      
      a {
        color: #667eea;
        text-decoration: none;
        
        &:hover {
          text-decoration: underline;
        }
      }
    }
    
    .entry-tags {
      margin-top: 3rem;
      padding-top: 2rem;
      border-top: 1px solid #eee;
      
      h4 {
        margin: 0 0 1rem 0;
        color: #333;
      }
      
      .tags-list {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        
        .tag {
          padding: 0.25rem 0.75rem;
          background: #f8f9fa;
          color: #667eea;
          border-radius: 15px;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.3s ease;
          
          &:hover {
            background: #667eea;
            color: white;
          }
        }
      }
    }
    
    .entry-share {
      margin-top: 3rem;
      padding-top: 2rem;
      border-top: 1px solid #eee;
      
      h4 {
        margin: 0 0 1rem 0;
        color: #333;
      }
      
      .share-buttons {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
        
        .share-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 6px;
          color: white;
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 0.9rem;
          
          &.facebook {
            background: #1877f2;
            
            &:hover {
              background: #166fe5;
            }
          }
          
          &.twitter {
            background: #1da1f2;
            
            &:hover {
              background: #1a91da;
            }
          }
          
          &.linkedin {
            background: #0077b5;
            
            &:hover {
              background: #006097;
            }
          }
          
          &.copy {
            background: #6c757d;
            
            &:hover {
              background: #5a6268;
            }
          }
        }
      }
    }
  }
  
  .entry-sidebar {
    .sidebar-widget {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      margin-bottom: 2rem;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      
      h3 {
        margin: 0 0 1rem 0;
        color: #333;
        font-size: 1.2rem;
        font-weight: 600;
      }
    }
    
    .categories-list {
      list-style: none;
      padding: 0;
      margin: 0;
      
      li {
        margin-bottom: 0.5rem;
        
        &:last-child {
          margin-bottom: 0;
        }
      }
      
      .category-link {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.5rem;
        border: none;
        background: none;
        color: #666;
        cursor: pointer;
        width: 100%;
        text-align: left;
        border-radius: 6px;
        transition: all 0.3s ease;
        
        &:hover, &.active {
          background: #f8f9fa;
          color: #333;
        }
        
        .category-color {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          flex-shrink: 0;
        }
      }
    }
    
    .related-entries, .recent-entries {
      .related-entry, .recent-entry {
        display: flex;
        gap: 1rem;
        padding: 1rem 0;
        border-bottom: 1px solid #eee;
        cursor: pointer;
        transition: transform 0.3s ease;
        
        &:hover {
          transform: translateX(5px);
        }
        
        &:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }
        
        .related-image, .recent-image {
          width: 80px;
          height: 60px;
          border-radius: 8px;
          overflow: hidden;
          flex-shrink: 0;
          
          img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            background: transparent;
          }
          
          .no-image {
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #f5f5f5;
            color: #ccc;
            font-size: 1.5rem;
          }
        }
        
        .related-content, .recent-content {
          flex: 1;
          
          h4 {
            margin: 0 0 0.5rem 0;
            font-size: 1rem;
            color: #333;
            line-height: 1.4;
          }
          
          .related-date, .recent-date {
            font-size: 0.9rem;
            color: #666;
          }
        }
      }
    }
  }
  
  .entry-navigation {
    background: white;
    border-top: 1px solid #eee;
    padding: 3rem 0;
    
    .nav-links {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
      
      .nav-link {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 1.5rem;
        border: 1px solid #eee;
        border-radius: 8px;
        text-decoration: none;
        color: #333;
        transition: all 0.3s ease;
        
        &:hover:not(.disabled) {
          border-color: #667eea;
          background: #f8f9fa;
        }
        
        &.disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        &.next {
          text-align: right;
          flex-direction: row-reverse;
        }
        
        i {
          font-size: 1.5rem;
          color: #667eea;
        }
        
        .nav-content {
          flex: 1;
          
          .nav-label {
            display: block;
            font-size: 0.9rem;
            color: #666;
            margin-bottom: 0.25rem;
          }
          
          .nav-title {
            display: block;
            font-weight: 600;
            line-height: 1.4;
          }
        }
      }
    }
  }
}

// Layout para Páginas Web
.pagina-web-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  
  .pagina-content {
    flex: 1;
    padding: 120px 0 120px 0; // Mismo espacio arriba y abajo
    background: #f8f9fa;
    
    .pagina-hero {
      position: relative;
      height: 400px;
      margin-bottom: 3rem;
      border-radius: 0.5rem;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      
      .hero-background {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        
        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          background: transparent;
        }
      }
      
      .hero-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(
          to bottom,
          rgba(0, 0, 0, 0.3) 0%,
          rgba(0, 0, 0, 0.5) 50%,
          rgba(0, 0, 0, 0.7) 100%
        );
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
        padding: 2rem;
        
        .hero-title {
          font-size: 3rem;
          font-weight: 700;
          color: white;
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
          margin: 0;
          line-height: 1.2;
        }
      }
      
      // Fallback para cuando no hay imagen
      &:not(:has(.hero-background)) {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        
        .hero-overlay {
          background: none;
        }
      }
    }
    
    .pagina-body {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      padding: 1rem;
      border-radius: 0.5rem;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      
      .pagina-content {
        font-size: 1.1rem;
        line-height: 1.8;
        color: #374151;
        padding: 50px;
        
        h1, h2, h3, h4, h5, h6 {
          color: #667eea;
          margin-top: 2rem;
          margin-bottom: 1rem;
        }
        
        p {
          margin-bottom: 1.5rem;
        }
        
        img {
          max-width: 100%;
          height: auto;
          border-radius: 0.5rem;
          margin: 1.5rem 0;
          background: transparent;
          image-rendering: -webkit-optimize-contrast;
          image-rendering: crisp-edges;
          -webkit-backface-visibility: hidden;
          backface-visibility: hidden;
          transform: translateZ(0);
        }
        
        // Regla específica para imágenes PNG con transparencia
        img[src*=".png"], img[src*=".PNG"] {
          border-radius: 0;
          box-shadow: none;
        }
        
        ul, ol {
          margin-bottom: 1.5rem;
          padding-left: 2rem;
        }
        
        li {
          margin-bottom: 0.5rem;
        }
      }
    }
  }
  
  
  // Responsive
  @media (max-width: 768px) {
    .pagina-content {
      padding: 80px 0 80px 0;
      
      .pagina-hero {
        height: 300px;
        margin-bottom: 2rem;
        
        .hero-overlay {
          padding: 1.5rem;
          
          .hero-title {
            font-size: 2.5rem;
          }
        }
      }
      
      .pagina-body {
        margin: 0 0.5rem;
        padding: 0.75rem;
        
        .pagina-content {
          padding: 1.5rem 1rem;
        }
      }
    }
    
    .footer {
      .footer-content {
        grid-template-columns: 1fr;
        gap: 1.5rem;
      }
    }
  }
  
  @media (max-width: 480px) {
    .pagina-content {
      padding: 70px 0 70px 0;
      
      .pagina-hero {
        height: 250px;
        margin-bottom: 1.5rem;
        
        .hero-overlay {
          padding: 1rem;
          
          .hero-title {
            font-size: 2rem;
          }
        }
      }
      
      .pagina-body {
        margin: 0 0.25rem;
        padding: 0.5rem;
        
        .pagina-content {
          padding: 1rem 0.75rem;
        }
      }
    }
  }
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
  
  // Optimización para móviles
  @media (max-width: 768px) {
    padding: 0 0.5rem;
  }
  
  @media (max-width: 480px) {
    padding: 0 0.25rem;
  }
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  text-decoration: none;
  display: inline-block;
  transition: all 0.3s ease;
  
  &--primary {
    background: #667eea;
    color: white;
    
    &:hover {
      background: #5a67d8;
    }
  }
}

// Footer del Home - Estilos globales
.footer {
  background: #0a1930;
  color: white;
  padding: 3rem 0 1rem;
  margin-top: auto;
  
  .footer-content {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 2rem;
    margin-bottom: 2rem;
    
    .footer-section {
      h3 {
        color: #667eea;
        font-size: 1.3rem;
        margin-bottom: 1rem;
      }
      
      h4 {
        color: #667eea;
        font-size: 1.1rem;
        margin-bottom: 1rem;
      }
      
      p {
        color: #cbd5e0;
        line-height: 1.6;
        margin-bottom: 1rem;
      }
      
      ul {
        list-style: none;
        padding: 0;
        
        li {
          margin-bottom: 0.5rem;
          
          a {
            color: #cbd5e0;
            text-decoration: none;
            transition: color 0.3s ease;
            
            &:hover {
              color: #667eea;
            }
          }
          
          i {
            margin-right: 0.5rem;
            color: #667eea;
          }
        }
      }
      
      .social-links {
        display: flex;
        gap: 1rem;
        
        .social-link {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          background: #1e3a8a;
          color: white;
          border-radius: 50%;
          text-decoration: none;
          transition: background 0.3s ease;
          
          &:hover {
            background: #667eea;
          }
        }
      }
    }
  }
  
  .footer-bottom {
    border-top: 1px solid #1e3a8a;
    padding-top: 1rem;
    text-align: center;
    
    p {
      color: #9ca3af;
      margin: 0;
    }
  }
  
  // Responsive para footer
  @media (max-width: 768px) {
    .footer-content {
      grid-template-columns: 1fr;
      gap: 1.5rem;
    }
  }
}
</style> 