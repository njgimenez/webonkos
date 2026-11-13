<template>
  <div class="blog-page">
    <Navbar @show-admin-login="showAdminLogin" @show-appointment-modal="showAppointmentModal" />
    
    <!-- Header del Blog -->
    <div class="blog-header">
      <div class="container">
        <h1>Blog de Onkos</h1>
        <p>Información actualizada sobre oncología, tratamientos y noticias médicas</p>
      </div>
    </div>

    <!-- Filtros y Búsqueda -->
    <div class="blog-filters">
      <div class="container">
        <div class="filters-content">
          <div class="search-box">
            <input 
              v-model="filters.busqueda" 
              @input="loadEntradas"
              placeholder="Buscar en el blog..."
              class="search-input"
            >
            <i class="fas fa-search"></i>
          </div>
          
          <!-- Botón de filtros móvil -->
          <button 
            @click="toggleMobileFilters"
            class="mobile-filters-toggle"
            :class="{ active: showMobileFilters }"
          >
            <i class="fas fa-filter"></i>
            Filtros
            <span v-if="filters.categoria" class="filter-count">1</span>
          </button>
          
          <div class="category-filters" :class="{ 'mobile-visible': showMobileFilters }">
            <button 
              @click="clearFilters"
              :class="['filter-btn', { active: !filters.categoria }]"
            >
              Todas las categorías
            </button>
            
            <!-- Filtros por subcategorías -->
            <div v-for="subcategoria in subcategorias" :key="subcategoria.id" class="subcategory-group">
            <button 
              @click="selectCategory(subcategoria.id)"
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
                  @click="selectCategory(subsubcategoria.id)"
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
    <div class="blog-content">
      <div class="container">
        <div class="blog-grid">
          <!-- Entradas del Blog -->
          <div class="blog-entries">
            <div v-if="loading" class="loading">
              <i class="fas fa-spinner fa-spin"></i>
              <p>Cargando entradas...</p>
            </div>
            
            <div v-else-if="entradas.length === 0" class="no-entries">
              <i class="fas fa-newspaper"></i>
              <h3>No se encontraron entradas</h3>
              <p>Intenta con otros filtros o vuelve más tarde.</p>
            </div>
            
            <div v-else class="entries-grid">
              <article 
                v-for="entrada in entradas" 
                :key="entrada.id" 
                class="blog-entry"
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
                    <i class="fas fa-newspaper"></i>
                  </div>
                  <!-- Indicador de tipo de entrada -->
                  <div class="entry-type-badge" :class="entrada.tipo_entrada || 'entrada'">
                    <i :class="(entrada.tipo_entrada || 'entrada') === 'pagina' ? 'fas fa-file-alt' : 'fas fa-newspaper'"></i>
                    {{ (entrada.tipo_entrada || 'entrada') === 'pagina' ? 'Página' : 'Entrada' }}
                  </div>
                </div>
                
                <div class="entry-content">
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
                    <span class="vistas" v-if="entrada.vistas">
                      <i class="fas fa-eye"></i>
                      {{ entrada.vistas }} vistas
                    </span>
                  </div>
                  
                  <h2 class="entry-title">{{ entrada.titulo }}</h2>
                  
                  <p class="entry-excerpt">
                    {{ entrada.resumen || truncateText(entrada.contenido, 150) }}
                  </p>
                  
                  <div class="entry-footer">
                    <div class="entry-stats">
                      <span v-if="entrada.destacado" class="destacado">
                        <i class="fas fa-star"></i>
                        Destacado
                      </span>
                    </div>
                    
                    <button class="read-more">
                      Leer más
                      <i class="fas fa-arrow-right"></i>
                    </button>
                  </div>
                </div>
              </article>
            </div>
            
            <!-- Paginación -->
            <div v-if="totalPages > 1" class="pagination">
              <!-- Navegación Móvil Circular -->
              <div class="pagination__mobile">
                <div class="pagination__content">
                  <div class="pagination__info">
                    <span class="pagination__current">{{ currentPage }}</span>
                    <span class="pagination__separator">de</span>
                    <span class="pagination__total">{{ totalPages }}</span>
                  </div>
                  
                  <!-- Botones circulares superpuestos -->
                  <button 
                    @click="changePage(currentPage - 1)"
                    :disabled="currentPage === 1"
                    class="pagination__circular-btn pagination__circular-btn--prev"
                    :class="{ 'pagination__circular-btn--disabled': currentPage === 1 }"
                  >
                    <i class="fas fa-chevron-left"></i>
                  </button>
                  
                  <button 
                    @click="changePage(currentPage + 1)"
                    :disabled="currentPage === totalPages"
                    class="pagination__circular-btn pagination__circular-btn--next"
                    :class="{ 'pagination__circular-btn--disabled': currentPage === totalPages }"
                  >
                    <i class="fas fa-chevron-right"></i>
                  </button>
                </div>
              </div>
              
              <!-- Navegación Desktop -->
              <div class="pagination__desktop">
                <button 
                  @click="changePage(currentPage - 1)"
                  :disabled="currentPage === 1"
                  class="page-btn"
                >
                  <i class="fas fa-chevron-left"></i>
                  Anterior
                </button>
                
                <div class="page-numbers">
                  <button 
                    v-for="page in visiblePages" 
                    :key="page"
                    @click="changePage(page)"
                    :class="['page-number', { active: page === currentPage }]"
                  >
                    {{ page }}
                  </button>
                </div>
                
                <button 
                  @click="changePage(currentPage + 1)"
                  :disabled="currentPage === totalPages"
                  class="page-btn"
                >
                  Siguiente
                  <i class="fas fa-chevron-right"></i>
                </button>
              </div>
            </div>
          </div>
          
          <!-- Sidebar -->
          <aside class="blog-sidebar">
            <!-- Entradas Destacadas -->
            <div v-if="entradasDestacadas.length > 0" class="sidebar-widget">
              <h3>
                <i class="fas fa-star"></i>
                Entradas Destacadas
              </h3>
              <div class="destacadas-list">
                <article 
                  v-for="entrada in entradasDestacadas" 
                  :key="entrada.id" 
                  class="destacada-item"
                  @click="verEntrada(entrada.slug)"
                >
                  <div class="destacada-image">
                    <img 
                      v-if="entrada.imagen_principal" 
                      :src="buildImageUrl(entrada.imagen_principal)" 
                      :alt="entrada.titulo"
                      @error="handleImageError"
                      @load="handleImageLoad"
                    >
                    <div v-else class="no-image-small">
                      <i class="fas fa-newspaper"></i>
                    </div>
                  </div>
                  
                  <div class="destacada-content">
                    <div class="destacada-meta">
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
                        {{ formatDate(entrada.fecha_publicacion || entrada.created_at) }}
                      </span>
                    </div>
                    
                    <h4 class="destacada-titulo">{{ entrada.titulo }}</h4>
                    <p class="destacada-resumen">
                      {{ entrada.resumen || truncateText(entrada.contenido, 100) }}
                    </p>
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
                    @click="filters.categoria = categoria.id; loadEntradas()"
                    :class="['category-link', { active: filters.categoria == categoria.id }]"
                  >
                    <span 
                      class="category-color" 
                      :style="{ backgroundColor: categoria.color_hex }"
                    ></span>
                    {{ categoria.nombre }}
                    <span class="category-count">({{ categoria.entradas_count || 0 }})</span>
                  </button>
                </li>
              </ul>
            </div>
            
            <!-- Tags Populares -->
            <div v-if="tagsPopulares.length > 0" class="sidebar-widget">
              <h3>Tags Populares</h3>
              <div class="tags-cloud">
                <span 
                  v-for="tag in tagsPopulares" 
                  :key="tag"
                  class="tag"
                  @click="buscarPorTag(tag)"
                >
                  {{ tag }}
                </span>
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
  name: 'Blog',
  components: {
    Navbar
  },
  data() {
    return {
      entradas: [],
      categorias: [],
      subcategorias: [],
      entradasDestacadas: [],
      tagsPopulares: [],
      loading: true,
      currentPage: 1,
      totalPages: 1,
      itemsPerPage: 9,
      showMobileFilters: false,
      filters: {
        busqueda: '',
        categoria: '',
        tag: ''
      }
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
        this.loadEntradas(),
        this.loadCategorias(),
        this.loadSubcategorias(),
        this.loadEntradasDestacadas(),
        this.loadTagsPopulares()
      ]);
      this.loading = false;
    },
    
    async loadEntradas() {
      const cacheKey = `blog_entries_${JSON.stringify({
        estado: 'publicado',
        limit: this.itemsPerPage,
        offset: (this.currentPage - 1) * this.itemsPerPage,
        categoria: this.filters.categoria,
        busqueda: this.filters.busqueda
      })}`;

      // Intentar cargar del caché primero
      const cachedData = sessionStorage.getItem(cacheKey);
      if (cachedData) {
        try {
          const { data, timestamp } = JSON.parse(cachedData);
          // Validez del caché: 5 minutos
          if (Date.now() - timestamp < 5 * 60 * 1000) {
            this.entradas = data;
            // Calcular total de páginas basado en caché si es posible, o mantener el actual
            // Si es la primera carga y hay caché, asumimos que el totalPages es correcto o se recalcula
            if (this.entradas.length > 0 && this.totalPages === 1) {
               // Estimación conservadora si no tenemos el total real guardado
               this.totalPages = Math.ceil(this.entradas.length / this.itemsPerPage) || 1;
            }
            this.loading = false; // Quitar loading inmediatamente
            return; // Salir si usamos caché
          }
        } catch (e) {
          console.warn('Error al leer caché', e);
          sessionStorage.removeItem(cacheKey);
        }
      }

      try {
        this.loading = true; // Solo mostrar loading si no hay caché
        const params = {
          estado: 'publicado',
          limit: this.itemsPerPage,
          offset: (this.currentPage - 1) * this.itemsPerPage
        };
        
        if (this.filters.categoria) {
          params.categoria_id = this.filters.categoria;
        }
        
        if (this.filters.busqueda) {
          params.busqueda = this.filters.busqueda;
        }
        
        // Excluir entradas de las categorías "Investigación" (ID: 26) y "Casos" (ID: 40)
        params.exclude_categoria_ids = '26,40';
        
        const response = await axios.get('/api/blog/entradas', { params });
        this.entradas = response.data;
        
        // Cargar categorías múltiples para cada entrada
        // Esto se hace en paralelo para acelerar
        const categoriasPromises = this.entradas.map(async (entrada) => {
          try {
            // Intentar caché para categorías también
            const catCacheKey = `entry_cats_${entrada.id}`;
            const cachedCats = sessionStorage.getItem(catCacheKey);
            
            if (cachedCats) {
              entrada.categorias_multiples = JSON.parse(cachedCats);
            } else {
              const res = await axios.get(`/api/blog/entradas/${entrada.id}/categorias`);
              entrada.categorias_multiples = res.data;
              sessionStorage.setItem(catCacheKey, JSON.stringify(entrada.categorias_multiples));
            }
          } catch (error) {
            console.error(`Error cargando categorías para entrada ${entrada.id}:`, error);
            entrada.categorias_multiples = [];
          }
        });
        
        await Promise.all(categoriasPromises);
        
        // Guardar en caché
        sessionStorage.setItem(cacheKey, JSON.stringify({
          data: this.entradas,
          timestamp: Date.now()
        }));
        
        // Calcular total de páginas (esto requeriría un endpoint que devuelva el total)
        // Por ahora, asumimos que hay más páginas si tenemos el máximo de items
        this.totalPages = Math.ceil(response.data.length / this.itemsPerPage) || 1;
      } catch (error) {
        console.error('Error cargando entradas:', error);
        this.entradas = [];
      } finally {
        this.loading = false;
      }
    },
    
    async loadCategorias() {
      try {
        const response = await axios.get('/api/blog/categorias');
        // Filtrar las categorías de investigación (ID: 26) y casos (ID: 40) del blog principal
        this.categorias = response.data.filter(categoria => categoria.id !== 26 && categoria.id !== 40);
      } catch (error) {
        console.error('Error cargando categorías:', error);
        this.categorias = [];
      }
    },
    
    async loadSubcategorias() {
      try {
        const response = await axios.get('/api/blog/categorias');
        // Filtrar las categorías de investigación (ID: 26) y casos (ID: 40) del blog principal
        this.subcategorias = response.data.filter(categoria => categoria.id !== 26 && categoria.id !== 40);
      } catch (error) {
        console.error('Error cargando subcategorías:', error);
        this.subcategorias = [];
      }
    },
    
    async loadEntradasDestacadas() {
      try {
        const response = await axios.get('/api/blog/entradas', {
          params: {
            estado: 'publicado',
            destacado: 'true',
            limit: 5,
            exclude_categoria_ids: '26,40'
          }
        });
        this.entradasDestacadas = response.data;
        
        // Cargar categorías múltiples para cada entrada destacada
        for (let entrada of this.entradasDestacadas) {
          try {
            const categoriasResponse = await axios.get(`/api/blog/entradas/${entrada.id}/categorias`);
            entrada.categorias_multiples = categoriasResponse.data;
          } catch (error) {
            console.error(`Error cargando categorías para entrada destacada ${entrada.id}:`, error);
            entrada.categorias_multiples = [];
          }
        }
      } catch (error) {
        console.error('Error cargando entradas destacadas:', error);
        this.entradasDestacadas = [];
      }
    },
    
    async loadTagsPopulares() {
      try {
        // Por ahora, extraemos tags de las entradas existentes
        const response = await axios.get('/api/blog/entradas', {
          params: { estado: 'publicado', limit: 50, exclude_categoria_ids: '26,40' }
        });
        
        const allTags = [];
        response.data.forEach(entrada => {
          if (entrada.tags && Array.isArray(entrada.tags)) {
            allTags.push(...entrada.tags);
          }
        });
        
        // Contar frecuencia de tags
        const tagCount = {};
        allTags.forEach(tag => {
          tagCount[tag] = (tagCount[tag] || 0) + 1;
        });
        
        // Obtener los 10 tags más populares
        this.tagsPopulares = Object.entries(tagCount)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 10)
          .map(([tag]) => tag);
      } catch (error) {
        console.error('Error cargando tags populares:', error);
        this.tagsPopulares = [];
      }
    },
    
    changePage(page) {
      if (page >= 1 && page <= this.totalPages) {
        this.currentPage = page;
        this.loadEntradas();
      }
    },
    
    verEntrada(slug) {
      this.$router.push(`/blog/${slug}`);
    },
    
    openEntrada(entrada) {
      this.$router.push(`/blog/${entrada.slug}`);
    },
    
    clearFilters() {
      this.filters.categoria = '';
      this.filters.busqueda = '';
      this.loadEntradas();
      this.showMobileFilters = false;
    },
    
    toggleMobileFilters() {
      this.showMobileFilters = !this.showMobileFilters;
    },
    
    selectCategory(categoryId) {
      this.filters.categoria = categoryId;
      this.loadEntradas();
      this.showMobileFilters = false;
    },
    
    buscarPorTag(tag) {
      this.filters.busqueda = tag;
      this.loadEntradas();
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
        year: '2-digit',
        month: 'short',
        day: 'numeric'
      });
    },
    
    truncateText(text, maxLength) {
      if (!text) return '';
      const plainText = text.replace(/<[^>]*>/g, '');
      return plainText.length > maxLength 
        ? plainText.substring(0, maxLength) + '...' 
        : plainText;
    },
    
    handleImageError(event) {
      console.error('Error cargando imagen:', event.target.src);
      // Mostrar placeholder cuando falla la carga
      event.target.style.display = 'none';
      const noImageDiv = event.target.parentElement.querySelector('.no-image');
      if (noImageDiv) {
        noImageDiv.style.display = 'flex';
      }
    },
    
    handleImageLoad(event) {
      console.log('Imagen cargada exitosamente:', event.target.src);
      // Ocultar placeholder cuando la imagen carga correctamente
      const noImageDiv = event.target.parentElement.querySelector('.no-image');
      if (noImageDiv) {
        noImageDiv.style.display = 'none';
      }
    },
    
    showAdminLogin() {
      // Emitir evento para mostrar login de admin
      this.$emit('show-admin-login');
    },
    
    showAppointmentModal() {
      // Emitir evento para mostrar modal de citas
      this.$emit('show-appointment-modal');
    },

    updateMetaTags() {
      document.title = 'Blog - Onkos';
      
      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.name = 'description';
        document.head.appendChild(metaDesc);
      }
      metaDesc.content = 'Información actualizada sobre oncología, tratamientos y noticias médicas.';
      
      // Open Graph
      this.setMetaTag('property', 'og:title', 'Blog - Onkos');
      this.setMetaTag('property', 'og:description', 'Información actualizada sobre oncología, tratamientos y noticias médicas.');
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
.blog-page {
  min-height: 100vh;
  background: #f8f9fa;
}

.blog-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 6rem 0 4rem 0;
  text-align: center;
  margin-top: 80px;
  
  @media (max-width: 768px) {
    padding: 3rem 0 2rem 0;
    margin-top: 70px;
  }
  
  @media (max-width: 480px) {
    padding: 2rem 0 1.5rem 0;
  }
  
  h1 {
    font-size: 3rem;
    font-weight: 700;
    margin: 0 0 1rem 0;
    
    @media (max-width: 768px) {
      font-size: 2.2rem;
      margin: 0 0 0.75rem 0;
    }
    
    @media (max-width: 480px) {
      font-size: 1.8rem;
      margin: 0 0 0.5rem 0;
    }
  }
  
  p {
    font-size: 1.2rem;
    color: white;
    opacity: 0.9;
    margin: 0;
    
    @media (max-width: 768px) {
      font-size: 1rem;
    }
    
    @media (max-width: 480px) {
      font-size: 0.9rem;
    }
  }
}

.blog-filters {
  background: white;
  border-bottom: 1px solid #eee;
  padding: 2rem 0;
  
  @media (max-width: 768px) {
    padding: 1.5rem 0;
  }
  
  .filters-content {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    
    @media (min-width: 768px) {
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
    }
  }
  
  .mobile-filters-toggle {
    display: none;
    
    @media (max-width: 767px) {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      background: #667eea;
      color: white;
      border: none;
      border-radius: 25px;
      font-size: 0.9rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s ease;
      align-self: center;
      
      &:hover {
        background: #5a67d8;
        transform: translateY(-1px);
      }
      
      &.active {
        background: #4c51bf;
      }
      
      .filter-count {
        background: rgba(255, 255, 255, 0.2);
        padding: 0.2rem 0.5rem;
        border-radius: 10px;
        font-size: 0.8rem;
        font-weight: 600;
      }
    }
  }
  
  .search-box {
    position: relative;
    max-width: 400px;
    
    @media (max-width: 768px) {
      max-width: 100%;
    }
    
    .search-input {
      width: 100%;
      padding: 0.75rem 1rem 0.75rem 3rem;
      border: 2px solid #eee;
      border-radius: 50px;
      font-size: 1rem;
      transition: border-color 0.3s ease;
      -webkit-appearance: none;
      appearance: none;
      -webkit-tap-highlight-color: transparent;
      touch-action: manipulation;
      
      @media (max-width: 480px) {
        padding: 0.65rem 0.85rem 0.65rem 2.5rem;
        font-size: 0.9rem;
        min-height: 44px;
      }
      
      &:focus {
        outline: none;
        border-color: #667eea;
      }
    }
    
    i {
      position: absolute;
      left: 1rem;
      top: 50%;
      transform: translateY(-50%);
      color: #999;
      
      @media (max-width: 480px) {
        left: 0.85rem;
        font-size: 0.9rem;
      }
    }
  }
  
  .category-filters {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    
    @media (max-width: 768px) {
      gap: 0.4rem;
      justify-content: center;
    }
    
    @media (max-width: 767px) {
      display: none;
      flex-direction: column;
      gap: 0.75rem;
      margin-top: 1rem;
      padding: 1.5rem;
      background: #f8f9fa;
      border-radius: 12px;
      border: 1px solid #e9ecef;
      
      &.mobile-visible {
        display: flex;
      }
    }
    
    @media (max-width: 480px) {
      gap: 0.3rem;
      padding: 1rem;
    }
    
    .filter-btn {
      padding: 0.5rem 1rem;
      border: 2px solid #eee;
      border-radius: 25px;
      background: white;
      color: #666;
      cursor: pointer;
      transition: all 0.3s ease;
      font-size: 0.9rem;
      white-space: nowrap;
      -webkit-tap-highlight-color: transparent;
      touch-action: manipulation;
      min-height: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
      
      @media (max-width: 768px) {
        padding: 0.4rem 0.8rem;
        font-size: 0.85rem;
        border-radius: 20px;
      }
      
      @media (max-width: 480px) {
        padding: 0.35rem 0.7rem;
        font-size: 0.8rem;
        border-radius: 18px;
      }
      
      &:hover, &.active {
        border-color: #667eea;
        background: #667eea;
        color: white;
      }
    }
    
    .subcategory-group {
      @media (max-width: 768px) {
        width: 100%;
        margin-bottom: 0.5rem;
      }
      
      @media (max-width: 767px) {
        width: 100%;
        margin-bottom: 0.75rem;
      }
      
      .subcategory-btn {
        @media (max-width: 768px) {
          width: 100%;
          text-align: center;
          margin-bottom: 0.3rem;
        }
        
        @media (max-width: 767px) {
          width: 100%;
          text-align: left;
          margin-bottom: 0.5rem;
          padding: 0.6rem 1rem;
          font-size: 0.9rem;
        }
      }
      
      .sub-subcategory-filters {
        @media (max-width: 768px) {
          display: flex;
          flex-wrap: wrap;
          gap: 0.3rem;
          margin-top: 0.3rem;
        }
        
        @media (max-width: 767px) {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-top: 0.5rem;
        }
        
        .sub-subcategory-btn {
          @media (max-width: 480px) {
            font-size: 0.75rem;
            padding: 0.3rem 0.6rem;
          }
          
          @media (max-width: 767px) {
            font-size: 0.8rem;
            padding: 0.4rem 0.8rem;
          }
        }
      }
    }
  }
}

.blog-content {
  padding: 3rem 0;
  
  @media (max-width: 768px) {
    padding: 2rem 0;
  }
  
  .blog-grid {
    display: grid;
    gap: 3rem;
    
    @media (min-width: 1024px) {
      grid-template-columns: 1fr 300px;
    }
    
    @media (max-width: 1023px) {
      gap: 2rem;
    }
    
    @media (max-width: 768px) {
      gap: 1.5rem;
    }
  }
}

.blog-entries {
  .loading, .no-entries {
    text-align: center;
    padding: 4rem 2rem;
    color: #666;
    
    i {
      font-size: 3rem;
      margin-bottom: 1rem;
      color: #ccc;
    }
    
    h3 {
      margin: 0 0 0.5rem 0;
      color: #333;
    }
    
    p {
      margin: 0;
    }
  }
  
  .entries-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 2rem;
    
    @media (max-width: 768px) {
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1.5rem;
    }
    
    @media (max-width: 480px) {
      grid-template-columns: 1fr;
      gap: 1rem;
    }
  }
}

.blog-entry {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
  
  @media (max-width: 768px) {
    border-radius: 10px;
    box-shadow: 0 2px 15px rgba(0, 0, 0, 0.08);
  }
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
    
    @media (max-width: 768px) {
      transform: translateY(-2px);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
    }
  }
  
  .entry-image {
    height: 200px;
    overflow: hidden;
    position: relative;
    
    @media (max-width: 768px) {
      height: 180px;
    }
    
    @media (max-width: 480px) {
      height: 160px;
    }
    
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.3s ease;
    }
    
    .no-image {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f5f5f5;
      color: #ccc;
      font-size: 3rem;
      
      @media (max-width: 768px) {
        font-size: 2.5rem;
      }
      
      @media (max-width: 480px) {
        font-size: 2rem;
      }
    }
    
    .entry-type-badge {
      position: absolute;
      top: 10px;
      right: 10px;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 500;
      color: white;
      display: flex;
      align-items: center;
      gap: 0.25rem;
      backdrop-filter: blur(4px);
      
      @media (max-width: 480px) {
        top: 8px;
        right: 8px;
        padding: 0.2rem 0.4rem;
        font-size: 0.7rem;
      }
      
      &.pagina {
        background: rgba(59, 130, 246, 0.9); // Azul
      }
      
      &.entrada {
        background: rgba(16, 185, 129, 0.9); // Verde
      }
      
      i {
        font-size: 0.7rem;
        
        @media (max-width: 480px) {
          font-size: 0.65rem;
        }
      }
    }
  }
  
  &:hover .entry-image img {
    transform: scale(1.05);
    
    @media (max-width: 768px) {
      transform: scale(1.02);
    }
  }
  
  .entry-content {
    padding: 1.5rem;
    
    @media (max-width: 768px) {
      padding: 1.25rem;
    }
    
    @media (max-width: 480px) {
      padding: 1rem;
    }
  }
  
  .entry-meta {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1rem;
    flex-wrap: wrap;
    gap: 0.5rem;
    
    @media (max-width: 768px) {
      flex-direction: column;
      gap: 0.75rem;
    }
    
    .categorias-container {
      display: flex;
      flex-wrap: wrap;
      gap: 0.25rem;
      margin-bottom: 0.5rem;
      
      @media (max-width: 768px) {
        margin-bottom: 0.25rem;
      }
      
      .categoria {
        display: inline-block;
        padding: 0.25rem 0.5rem;
        border-radius: 0.25rem;
        font-size: 0.75rem;
        font-weight: 500;
        color: white;
        white-space: nowrap;
        max-width: 200px;
        overflow: hidden;
        text-overflow: ellipsis;
        
        @media (max-width: 480px) {
          font-size: 0.7rem;
          padding: 0.2rem 0.4rem;
          max-width: 150px;
        }
        
        &.categoria-multiple {
          margin-right: 0.25rem;
        }
        
        &.sin-categoria {
          background: #6b7280;
          color: white;
        }
      }
    }
    
    .fecha {
      color: #666;
      font-size: 0.9rem;
      
      @media (max-width: 768px) {
        font-size: 0.85rem;
      }
      
      @media (max-width: 480px) {
        font-size: 0.8rem;
      }
    }
  }
  
  .entry-title {
    font-size: 1.3rem;
    font-weight: 600;
    margin: 0 0 1rem 0;
    color: #333;
    line-height: 1.4;
    
    @media (max-width: 768px) {
      font-size: 1.2rem;
      margin: 0 0 0.75rem 0;
    }
    
    @media (max-width: 480px) {
      font-size: 1.1rem;
      margin: 0 0 0.5rem 0;
    }
  }
  
  .entry-excerpt {
    color: #666;
    line-height: 1.6;
    margin: 0 0 1.5rem 0;
    
    @media (max-width: 768px) {
      font-size: 0.95rem;
      margin: 0 0 1.25rem 0;
    }
    
    @media (max-width: 480px) {
      font-size: 0.9rem;
      margin: 0 0 1rem 0;
    }
  }
  
  .entry-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    @media (max-width: 768px) {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.75rem;
    }
    
    .entry-stats {
      display: flex;
      gap: 1rem;
      font-size: 0.9rem;
      color: #999;
      
      @media (max-width: 768px) {
        font-size: 0.85rem;
        gap: 0.75rem;
      }
      
      @media (max-width: 480px) {
        font-size: 0.8rem;
        gap: 0.5rem;
      }
      
      .vistas, .destacado {
        display: flex;
        align-items: center;
        gap: 0.25rem;
        
        i {
          font-size: 0.8rem;
          
          @media (max-width: 480px) {
            font-size: 0.75rem;
          }
        }
      }
      
      .destacado {
        color: #f59e0b;
      }
    }
    
    .read-more {
      background: none;
      border: none;
      color: #667eea;
      font-weight: 500;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      transition: gap 0.3s ease;
      padding: 0.5rem 0;
      
      @media (max-width: 768px) {
        font-size: 0.9rem;
        align-self: flex-end;
      }
      
      @media (max-width: 480px) {
        font-size: 0.85rem;
        padding: 0.4rem 0;
      }
      
      &:hover {
        gap: 0.75rem;
      }
    }
  }
}

.pagination {
  margin-top: 3rem;
  
  @media (max-width: 768px) {
    margin-top: 2rem;
  }
  
  @media (max-width: 480px) {
    margin-top: 1.5rem;
  }
  
  // Navegación Móvil - Solo visible en móviles
  &__mobile {
    display: none;
    
    @media (max-width: 768px) {
      display: block;
      position: relative;
      margin: 2rem 0;
    }
  }
  
  &__content {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    background: white;
    border-radius: 15px;
    padding: 1.5rem 2rem;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    border: 1px solid #e5e7eb;
    margin: 0 1rem;
    
    @media (max-width: 480px) {
      padding: 1.25rem 1.5rem;
      border-radius: 12px;
      margin: 0 0.5rem;
    }
  }
  
  // Navegación Desktop - Solo visible en desktop
  &__desktop {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 1rem;
    
    @media (max-width: 768px) {
      display: none;
    }
  }
  
  // Botones circulares superpuestos
  &__circular-btn {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    width: 48px;
    height: 48px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 50%;
    color: #475569;
    cursor: pointer;
    transition: all 0.3s ease;
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    z-index: 10;
    
    @media (max-width: 480px) {
      width: 44px;
      height: 44px;
    }
    
    &:hover:not(.pagination__circular-btn--disabled) {
      background: #667eea;
      border-color: #667eea;
      color: white;
      transform: translateY(-50%) scale(1.05);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
    }
    
    &:active:not(.pagination__circular-btn--disabled) {
      transform: translateY(-50%) scale(0.95);
    }
    
    &--prev {
      left: -24px;
      
      @media (max-width: 480px) {
        left: -22px;
      }
    }
    
    &--next {
      right: -24px;
      
      @media (max-width: 480px) {
        right: -22px;
      }
    }
    
    &--disabled {
      opacity: 0.4;
      cursor: not-allowed;
      background: #f1f5f9;
      border-color: #e2e8f0;
      color: #94a3b8;
      
      &:hover {
        transform: translateY(-50%);
        background: #f1f5f9;
        border-color: #e2e8f0;
        color: #94a3b8;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }
    }
    
    i {
      font-size: 0.9rem;
      font-weight: 600;
      
      @media (max-width: 480px) {
        font-size: 0.8rem;
      }
    }
  }
  
  // Información de página móvil
  &__info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    background: #667eea;
    border-radius: 25px;
    color: white;
    font-weight: 600;
    font-size: 0.95rem;
    box-shadow: 0 2px 8px rgba(102, 126, 234, 0.2);
    
    @media (max-width: 480px) {
      padding: 0.6rem 1.25rem;
      font-size: 0.9rem;
      gap: 0.4rem;
      border-radius: 20px;
    }
  }
  
  &__current {
    font-size: 1.1rem;
    font-weight: 700;
    
    @media (max-width: 480px) {
      font-size: 1rem;
    }
  }
  
  &__separator {
    opacity: 0.8;
    font-size: 0.8rem;
    
    @media (max-width: 480px) {
      font-size: 0.75rem;
    }
  }
  
  &__total {
    font-size: 0.9rem;
    opacity: 0.9;
    
    @media (max-width: 480px) {
      font-size: 0.85rem;
    }
  }
  
  // Estilos para desktop (mantener compatibilidad)
  .page-btn {
    padding: 0.5rem 1rem;
    border: 1px solid #ddd;
    background: white;
    color: #666;
    border-radius: 6px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    transition: all 0.3s ease;
    font-size: 0.9rem;
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
    min-height: 44px;
    
    &:hover:not(:disabled) {
      border-color: #667eea;
      color: #667eea;
    }
    
    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
  
  .page-numbers {
    display: flex;
    gap: 0.25rem;
    
    .page-number {
      width: 40px;
      height: 40px;
      border: 1px solid #ddd;
      background: white;
      color: #666;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.9rem;
      -webkit-tap-highlight-color: transparent;
      touch-action: manipulation;
      min-height: 44px;
      min-width: 44px;
      
      &:hover, &.active {
        border-color: #667eea;
        background: #667eea;
        color: white;
      }
    }
  }
}

.blog-sidebar {
  @media (max-width: 1023px) {
    display: none;
  }
  
  .sidebar-widget {
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    margin-bottom: 2rem;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    
    @media (max-width: 1023px) {
      padding: 1.25rem;
      margin-bottom: 1.5rem;
    }
    
    h3 {
      margin: 0 0 1rem 0;
      color: #333;
      font-size: 1.2rem;
      font-weight: 600;
      
      @media (max-width: 1023px) {
        font-size: 1.1rem;
      }
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
  
  .destacadas-list {
    .destacada-item {
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
      
      .destacada-image {
        width: 80px;
        height: 60px;
        border-radius: 8px;
        overflow: hidden;
        flex-shrink: 0;
        
        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .no-image-small {
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
      
      .destacada-content {
        flex: 1;
        
        .destacada-meta {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          margin-bottom: 0.5rem;
          
          .categorias-container {
            display: flex;
            flex-wrap: wrap;
            gap: 0.25rem;
            
            .categoria {
              display: inline-block;
              padding: 0.2rem 0.4rem;
              border-radius: 0.25rem;
              font-size: 0.7rem;
              font-weight: 500;
              color: white;
              white-space: nowrap;
              max-width: 150px;
              overflow: hidden;
              text-overflow: ellipsis;
              
              &.categoria-multiple {
                margin-right: 0.25rem;
              }
              
              &.sin-categoria {
                background: #6b7280;
                color: white;
              }
            }
          }
          
          .fecha {
            font-size: 0.8rem;
            color: #666;
          }
        }
        
        .destacada-titulo {
          margin: 0 0 0.5rem 0;
          font-size: 1rem;
          color: #333;
          line-height: 1.4;
        }
        
        .destacada-resumen {
          font-size: 0.9rem;
          color: #666;
          line-height: 1.4;
        }
      }
    }
  }
  
  .tags-cloud {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    
    .tag {
      padding: 0.25rem 0.75rem;
      background: #f8f9fa;
      color: #666;
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

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
  
  @media (max-width: 768px) {
    padding: 0 0.75rem;
  }
  
  @media (max-width: 480px) {
    padding: 0 0.5rem;
  }
}
</style> 