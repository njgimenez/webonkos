<template>
  <div class="bitacora-page">
    <Navbar @show-admin-login="showAdminLogin" @show-appointment-modal="showAppointmentModal" />
    
    <!-- Header de Bitácora -->
    <div class="bitacora-header">
      <div class="container">
        <h1>Bitácora Médica</h1>
        <p>Casos clínicos, experiencias y seguimientos médicos especializados</p>
      </div>
    </div>

    <!-- Filtros y Búsqueda -->
    <div class="bitacora-filters">
      <div class="container">
        <div class="filters-content">
          <div class="search-box">
            <input 
              v-model="filters.busqueda" 
              @input="loadEntradas"
              placeholder="Buscar en bitácora..."
              class="search-input"
            >
            <i class="fas fa-search"></i>
          </div>
          
          <div class="category-filters">
            <button 
              @click="clearFilters"
              :class="['filter-btn', { active: !filters.categoria }]"
            >
              Todas las categorías
            </button>
            
            <!-- Filtros por subcategorías -->
            <div v-for="subcategoria in subcategorias" :key="subcategoria.id" class="subcategory-group">
              <button 
                @click="filters.categoria = subcategoria.id; loadEntradas()"
                :class="['filter-btn', 'subcategory-btn', { active: filters.categoria == subcategoria.id }]"
                :style="{ borderColor: subcategoria.color_hex }"
              >
                {{ subcategoria.nombre }}
              </button>
              
              <!-- Sub-subcategorías -->
              <div v-if="subcategoria.children && subcategoria.children.length > 0" class="sub-subcategory-filters">
                <button 
                  v-for="subsubcategoria in subcategoria.children" 
                  :key="subsubcategoria.id"
                  @click="filters.categoria = subsubcategoria.id; loadEntradas()"
                  :class="['filter-btn', 'sub-subcategory-btn', { active: filters.categoria == subsubcategoria.id }]"
                  :style="{ borderColor: subsubcategoria.color_hex }"
                >
                  {{ subsubcategoria.nombre }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Contenido Principal -->
    <div class="bitacora-content">
      <div class="container">
        <div class="bitacora-grid">
          <!-- Entradas de Bitácora -->
          <div class="bitacora-entries">
            <div v-if="loading" class="loading">
              <i class="fas fa-spinner fa-spin"></i>
              <p>Cargando casos...</p>
            </div>
            
            <div v-else-if="entradas.length === 0" class="no-entries">
              <i class="fas fa-stethoscope"></i>
              <h3>No se encontraron casos</h3>
              <p>Intenta con otros filtros o vuelve más tarde.</p>
            </div>
            
            <div v-else class="entries-grid">
              <article 
                v-for="entrada in entradas" 
                :key="entrada.id" 
                class="bitacora-entry"
                @click="verEntrada(entrada.slug)"
              >
                <div class="entry-image">
                  <img 
                    v-if="entrada.imagen_principal" 
                    :src="buildImageUrl(entrada.imagen_principal)" 
                    :alt="entrada.titulo"
                    @error="handleImageError"
                    @load="handleImageLoad"
                  >
                  <div v-else class="no-image">
                    <i class="fas fa-stethoscope"></i>
                  </div>
                  <!-- Indicador de tipo de casos -->
                  <div class="entry-type-badge casos">
                    <i class="fas fa-stethoscope"></i>
                    Casos
                  </div>
                </div>
                
                <div class="entry-content">
                  <div class="entry-meta">
                    <span 
                      class="categoria" 
                      :style="{ backgroundColor: getCategoriaColor(entrada.categoria_id) }"
                    >
                      {{ getCategoriaNombre(entrada.categoria_id) }}
                    </span>
                    <span class="fecha">
                      {{ formatDate(entrada.fecha_publicacion || entrada.created_at) }}
                    </span>
                  </div>
                  
                  <h3 class="entry-title">{{ entrada.titulo }}</h3>
                  
                  <p class="entry-excerpt" v-html="getExcerpt(entrada.contenido)"></p>
                  
                  <div class="entry-footer">
                    <span class="entry-author">
                      <i class="fas fa-user"></i>
                      {{ entrada.autor_nombre || 'Onkos Team' }}
                    </span>
                    <span class="entry-views">
                      <i class="fas fa-eye"></i>
                      {{ entrada.vistas || 0 }}
                    </span>
                  </div>
                </div>
              </article>
            </div>
            
            <!-- Paginación -->
            <div v-if="totalPages > 1" class="pagination">
              <button 
                @click="changePage(currentPage - 1)"
                :disabled="currentPage === 1"
                class="pagination-btn"
              >
                <i class="fas fa-chevron-left"></i>
                Anterior
              </button>
              
              <div class="pagination-numbers">
                <button 
                  v-for="page in visiblePages" 
                  :key="page"
                  @click="changePage(page)"
                  :class="['pagination-number', { active: page === currentPage }]"
                >
                  {{ page }}
                </button>
              </div>
              
              <button 
                @click="changePage(currentPage + 1)"
                :disabled="currentPage === totalPages"
                class="pagination-btn"
              >
                Siguiente
                <i class="fas fa-chevron-right"></i>
              </button>
            </div>
          </div>
          
          <!-- Sidebar -->
          <aside class="bitacora-sidebar">
            <!-- Entradas Destacadas -->
            <div v-if="entradasDestacadas.length > 0" class="sidebar-widget">
              <h3>Casos Destacados</h3>
              <div class="featured-entries">
                <article 
                  v-for="entrada in entradasDestacadas" 
                  :key="entrada.id"
                  class="featured-entry"
                  @click="verEntrada(entrada.slug)"
                >
                  <div class="featured-image">
                    <img 
                      v-if="entrada.imagen_principal" 
                      :src="buildImageUrl(entrada.imagen_principal)" 
                      :alt="entrada.titulo"
                    >
                    <div v-else class="no-image">
                      <i class="fas fa-stethoscope"></i>
                    </div>
                  </div>
                  <div class="featured-content">
                    <h4>{{ entrada.titulo }}</h4>
                    <span class="featured-date">
                      {{ formatDate(entrada.fecha_publicacion || entrada.created_at) }}
                    </span>
                  </div>
                </article>
              </div>
            </div>
            
            <!-- Categorías de Casos -->
            <div v-if="subcategorias.length > 0" class="sidebar-widget">
              <h3>Categorías de Casos</h3>
              <div class="category-list">
                <button 
                  v-for="subcategoria in subcategorias" 
                  :key="subcategoria.id"
                  @click="filters.categoria = subcategoria.id; loadEntradas()"
                  :class="['category-item', { active: filters.categoria == subcategoria.id }]"
                >
                  <i class="fas fa-folder"></i>
                  {{ subcategoria.nombre }}
                  <span class="category-count">({{ getCategoriaCount(subcategoria.id) }})</span>
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import Navbar from '@/components/Navbar.vue';

export default {
  name: 'Bitacora',
  components: {
    Navbar
  },
  data() {
    return {
      entradas: [],
      subcategorias: [],
      entradasDestacadas: [],
      loading: true,
      currentPage: 1,
      totalPages: 1,
      itemsPerPage: 9,
      filters: {
        busqueda: '',
        categoria: ''
      },
      bitacoraCategoriaId: null,
      casosCategoriaId: null
    }
  },
  
  computed: {
    visiblePages() {
      const pages = [];
      const start = Math.max(1, this.currentPage - 2);
      const end = Math.min(this.totalPages, this.currentPage + 2);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      return pages;
    }
  },
  
  async mounted() {
    await this.loadData();
    this.updateMetaTags();
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
    
    async loadData() {
      await Promise.all([
        this.loadBitacoraCategoria(),
        this.loadSubcategorias(),
        this.loadEntradas(),
        this.loadEntradasDestacadas()
      ]);
      this.loading = false;
    },
    
    async loadBitacoraCategoria() {
      try {
        const response = await axios.get('/api/blog/categorias');
        const bitacoraCategoria = response.data.find(cat => cat.slug === 'bitacora');
        if (bitacoraCategoria) {
          this.bitacoraCategoriaId = bitacoraCategoria.id;
        }
        // También buscar la categoría "Casos" específicamente
        const casosCategoria = response.data.find(cat => cat.slug === 'casos');
        if (casosCategoria) {
          this.casosCategoriaId = casosCategoria.id;
        }
      } catch (error) {
        console.error('Error cargando categoría de bitácora:', error);
      }
    },
    
    async loadSubcategorias() {
      try {
        // Para Bitácora, solo necesitamos la categoría "Casos" directamente
        // No necesitamos subcategorías complejas como en Investigación
        this.subcategorias = [];
        
        // Si queremos mostrar la categoría "Casos" en el sidebar
        if (this.casosCategoriaId) {
          this.subcategorias = [{
            id: this.casosCategoriaId,
            nombre: 'Casos',
            slug: 'casos',
            color_hex: '#fa709a'
          }];
        }
      } catch (error) {
        console.error('Error cargando subcategorías:', error);
        this.subcategorias = [];
      }
    },
    
    async loadEntradas() {
      const cacheKey = `bitacora_entries_${JSON.stringify({
        page: this.currentPage,
        categoria: this.filters.categoria,
        busqueda: this.filters.busqueda,
        casosCatId: this.casosCategoriaId
      })}`;

      // Intentar cargar del caché primero
      const cachedData = sessionStorage.getItem(cacheKey);
      if (cachedData) {
        try {
          const { data, timestamp } = JSON.parse(cachedData);
          // Validez del caché: 5 minutos
          if (Date.now() - timestamp < 5 * 60 * 1000) {
            this.entradas = data;
            // Estimación conservadora si no tenemos el total real guardado
            if (this.entradas.length > 0 && this.totalPages === 1) {
               this.totalPages = Math.ceil(this.entradas.length / this.itemsPerPage) || 1;
            }
            this.loading = false;
            return;
          }
        } catch (e) {
          console.warn('Error al leer caché de bitácora', e);
          sessionStorage.removeItem(cacheKey);
        }
      }

      try {
        this.loading = true;
        const params = {
          estado: 'publicado',
          tipo_entrada: 'entrada', // Solo entradas de blog, no páginas
          limit: this.itemsPerPage,
          offset: (this.currentPage - 1) * this.itemsPerPage
        };
        
        // USAR CATEGORÍA "CASOS" (ID 40) DIRECTAMENTE
        if (this.casosCategoriaId) {
          if (this.filters.categoria) {
            // Si hay filtro específico, usar esa categoría
            params.categoria_id = this.filters.categoria;
          } else {
            // Si no hay filtro, usar la categoría "Casos" directamente
            params.categoria_id = this.casosCategoriaId;
          }
        } else {
          // Fallback: usar ID 40 directamente si no se ha cargado
          params.categoria_id = 40;
        }
        
        if (this.filters.busqueda) {
          params.busqueda = this.filters.busqueda;
        }
        
        console.log('🔍 Parámetros de búsqueda Bitácora:', params);
        
        const response = await axios.get('/api/blog/entradas', { params });
        this.entradas = response.data;
        
        // Guardar en caché
        sessionStorage.setItem(cacheKey, JSON.stringify({
          data: this.entradas,
          timestamp: Date.now()
        }));
        
        console.log('📊 Entradas de Bitácora encontradas:', this.entradas.length);
        
        // Calcular total de páginas
        this.totalPages = Math.ceil(response.data.length / this.itemsPerPage) || 1;
      } catch (error) {
        console.error('Error cargando entradas de bitácora:', error);
        this.entradas = [];
      } finally {
        this.loading = false;
      }
    },
    
    async loadEntradasDestacadas() {
      try {
        const params = {
          estado: 'publicado',
          tipo_entrada: 'entrada', // Solo entradas de blog, no páginas
          destacado: 'true',
          limit: 5
        };
        
        // USAR CATEGORÍA "CASOS" (ID 40) DIRECTAMENTE
        if (this.casosCategoriaId) {
          params.categoria_id = this.casosCategoriaId;
        } else {
          // Fallback: usar ID 40 directamente si no se ha cargado
          params.categoria_id = 40;
        }
        
        const response = await axios.get('/api/blog/entradas', { params });
        this.entradasDestacadas = response.data;
      } catch (error) {
        console.error('Error cargando entradas destacadas:', error);
        this.entradasDestacadas = [];
      }
    },
    
    clearFilters() {
      this.filters.categoria = '';
      this.filters.busqueda = '';
      this.currentPage = 1;
      this.loadEntradas();
    },
    
    changePage(page) {
      if (page >= 1 && page <= this.totalPages) {
        this.currentPage = page;
        this.loadEntradas();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    },
    
    verEntrada(slug) {
      this.$router.push(`/blog/${slug}`);
    },
    
    getExcerpt(content) {
      if (!content) return '';
      const div = document.createElement('div');
      div.innerHTML = content;
      const text = div.textContent || div.innerText || '';
      return text.length > 150 ? text.substring(0, 150) + '...' : text;
    },
    
    getCategoriaNombre(categoriaId) {
      const categoria = this.subcategorias.find(cat => cat.id === categoriaId);
      return categoria ? categoria.nombre : 'Casos';
    },
    
    getCategoriaColor(categoriaId) {
      const categoria = this.subcategorias.find(cat => cat.id === categoriaId);
      return categoria ? categoria.color_hex : '#fa709a';
    },
    
    getCategoriaCount(categoriaId) {
      // Esto requeriría un endpoint específico para contar entradas por categoría
      // Por ahora retornamos un número estimado
      return Math.floor(Math.random() * 10) + 1;
    },
    
    formatDate(dateString) {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    },
    
    handleImageError(event) {
      event.target.style.display = 'none';
    },
    
    handleImageLoad(event) {
      event.target.style.opacity = '1';
    },
    
    showAdminLogin() {
      this.$emit('show-admin-login');
    },
    
    showAppointmentModal() {
      this.$emit('show-appointment-modal');
    },

    updateMetaTags() {
      document.title = 'Bitácora Médica - Onkos';
      
      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.name = 'description';
        document.head.appendChild(metaDesc);
      }
      metaDesc.content = 'Casos clínicos, experiencias y seguimientos médicos especializados.';
      
      // Open Graph
      this.setMetaTag('property', 'og:title', 'Bitácora Médica - Onkos');
      this.setMetaTag('property', 'og:description', 'Casos clínicos, experiencias y seguimientos médicos especializados.');
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
@import "@/assets/styles/variables.scss";

.bitacora-page {
  min-height: 100vh;
  background: #f8f9fa;
}

.bitacora-header {
  background: linear-gradient(135deg, $primary-color 0%, $secondary-color 100%);
  color: white;
  padding: 120px 0 80px;
  text-align: center;
  
  h1 {
    font-size: 3rem;
    font-weight: 700;
    margin-bottom: 1rem;
    text-shadow: 0 2px 4px rgba(0,0,0,0.3);
  }
  
  p {
    font-size: 1.2rem;
    opacity: 0.9;
    max-width: 600px;
    margin: 0 auto;
    color: white;
  }
}

.bitacora-filters {
  background: white;
  padding: 2rem 0;
  border-bottom: 1px solid #e9ecef;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  
  .filters-content {
    display: flex;
    flex-direction: column;
    gap: 2rem;
    
    @media (min-width: 768px) {
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
    }
  }
  
  .search-box {
    position: relative;
    max-width: 400px;
    
    .search-input {
      width: 100%;
      padding: 0.75rem 1rem 0.75rem 3rem;
      border: 2px solid #e9ecef;
      border-radius: 50px;
      font-size: 1rem;
      transition: all 0.3s ease;
      
      &:focus {
        outline: none;
        border-color: $primary-color;
        box-shadow: 0 0 0 3px rgba($primary-color, 0.1);
      }
    }
    
    i {
      position: absolute;
      left: 1rem;
      top: 50%;
      transform: translateY(-50%);
      color: #6c757d;
    }
  }
  
  .category-filters {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    
    .filter-btn {
      padding: 0.5rem 1rem;
      border: 2px solid #e9ecef;
      background: white;
      border-radius: 25px;
      font-size: 0.9rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s ease;
      
      &:hover {
        border-color: $primary-color;
        color: $primary-color;
      }
      
      &.active {
        background: $primary-color;
        border-color: $primary-color;
        color: white;
      }
    }
    
    .subcategory-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      
      .subcategory-btn {
        font-weight: 600;
      }
      
      .sub-subcategory-filters {
        display: flex;
        flex-wrap: wrap;
        gap: 0.25rem;
        margin-left: 1rem;
        
        .sub-subcategory-btn {
          font-size: 0.8rem;
          padding: 0.25rem 0.75rem;
        }
      }
    }
  }
}

.bitacora-content {
  padding: 3rem 0;
}

.bitacora-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 3rem;
  
  @media (min-width: 1024px) {
    grid-template-columns: 2fr 1fr;
  }
}

.bitacora-entries {
  .loading, .no-entries {
    text-align: center;
    padding: 4rem 2rem;
    color: #6c757d;
    
    i {
      font-size: 3rem;
      margin-bottom: 1rem;
      color: $primary-color;
    }
    
    h3 {
      font-size: 1.5rem;
      margin-bottom: 1rem;
      color: #343a40;
    }
  }
  
  .entries-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 2rem;
  }
}

.bitacora-entry {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  transition: all 0.3s ease;
  cursor: pointer;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 25px rgba(0,0,0,0.15);
  }
  
  .entry-image {
    position: relative;
    height: 200px;
    overflow: hidden;
    
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.3s ease;
    }
    
    .no-image {
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, $primary-color, $secondary-color);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 3rem;
    }
    
    .entry-type-badge {
      position: absolute;
      top: 1rem;
      right: 1rem;
      background: rgba(0,0,0,0.8);
      color: white;
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 500;
      
      &.casos {
        background: $accent-color;
      }
    }
  }
  
  .entry-content {
    padding: 1.5rem;
    
    .entry-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
      
      .categoria {
        background: $primary-color;
        color: white;
        padding: 0.25rem 0.75rem;
        border-radius: 15px;
        font-size: 0.8rem;
        font-weight: 500;
      }
      
      .fecha {
        color: #6c757d;
        font-size: 0.9rem;
      }
    }
    
    .entry-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: #343a40;
      margin-bottom: 1rem;
      line-height: 1.4;
    }
    
    .entry-excerpt {
      color: #6c757d;
      line-height: 1.6;
      margin-bottom: 1rem;
    }
    
    .entry-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.9rem;
      color: #6c757d;
      
      span {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
    }
  }
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 3rem;
  
  .pagination-btn {
    padding: 0.5rem 1rem;
    border: 2px solid #e9ecef;
    background: white;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
    
    &:hover:not(:disabled) {
      border-color: $primary-color;
      color: $primary-color;
    }
    
    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
  
  .pagination-numbers {
    display: flex;
    gap: 0.5rem;
    
    .pagination-number {
      width: 40px;
      height: 40px;
      border: 2px solid #e9ecef;
      background: white;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s ease;
      
      &:hover {
        border-color: $primary-color;
        color: $primary-color;
      }
      
      &.active {
        background: $primary-color;
        border-color: $primary-color;
        color: white;
      }
    }
  }
}

.bitacora-sidebar {
  .sidebar-widget {
    background: white;
    border-radius: 12px;
    padding: 2rem;
    margin-bottom: 2rem;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    
    h3 {
      font-size: 1.25rem;
      font-weight: 600;
      color: #343a40;
      margin-bottom: 1.5rem;
      padding-bottom: 0.5rem;
      border-bottom: 2px solid $primary-color;
    }
  }
  
  .featured-entries {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    
    .featured-entry {
      display: flex;
      gap: 1rem;
      cursor: pointer;
      transition: all 0.3s ease;
      
      &:hover {
        transform: translateX(5px);
      }
      
      .featured-image {
        width: 80px;
        height: 80px;
        border-radius: 8px;
        overflow: hidden;
        flex-shrink: 0;
        
        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .no-image {
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, $primary-color, $secondary-color);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 1.5rem;
        }
      }
      
      .featured-content {
        flex: 1;
        
        h4 {
          font-size: 0.9rem;
          font-weight: 600;
          color: #343a40;
          margin-bottom: 0.5rem;
          line-height: 1.3;
        }
        
        .featured-date {
          font-size: 0.8rem;
          color: #6c757d;
        }
      }
    }
  }
  
  .category-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    
    .category-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.75rem 1rem;
      border: 2px solid #e9ecef;
      background: white;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s ease;
      
      &:hover {
        border-color: $primary-color;
        color: $primary-color;
      }
      
      &.active {
        background: $primary-color;
        border-color: $primary-color;
        color: white;
      }
      
      i {
        margin-right: 0.5rem;
      }
      
      .category-count {
        font-size: 0.8rem;
        opacity: 0.7;
      }
    }
  }
}

@media (max-width: 768px) {
  .bitacora-header {
    padding: 100px 0 60px;
    
    h1 {
      font-size: 2rem;
    }
    
    p {
      font-size: 1rem;
    }
  }
  
  .bitacora-filters {
    .filters-content {
      gap: 1rem;
    }
    
    .category-filters {
      .subcategory-group {
        .sub-subcategory-filters {
          margin-left: 0;
        }
      }
    }
  }
  
  .entries-grid {
    grid-template-columns: 1fr;
  }
}
</style>