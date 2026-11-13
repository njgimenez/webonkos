<template>
  <div class="blog-admin">
    <div class="admin-header">
      <div class="admin-header-left">
        <router-link to="/" class="admin-home-link">
          <i class="fas fa-home"></i>
          <span>Volver al Home</span>
        </router-link>
        <h2>Administración del <br></br>Contenido</h2>
      </div>
      <div class="admin-actions">
        <button @click="createNewEntry" class="btn btn--primary">
          <i class="fas fa-plus"></i> Nueva Entrada
        </button>
        <button @click="showCategoryForm = true" class="btn btn--secondary">
          <i class="fas fa-folder-plus"></i> Nueva Categoría
        </button>
      </div>
    </div>

    <!-- Tabs de navegación -->
    <div class="admin-tabs">
      <button 
        @click="activeTab = 'entradas'" 
        :class="['tab-btn', { active: activeTab === 'entradas' }]"
      >
        <i class="fas fa-file-alt"></i> Entradas
      </button>
      <button 
        @click="activeTab = 'categorias'" 
        :class="['tab-btn', { active: activeTab === 'categorias' }]"
      >
        <i class="fas fa-folder"></i> Categorías
      </button>
      <button 
        @click="activeTab = 'media'" 
        :class="['tab-btn', { active: activeTab === 'media' }]"
      >
        <i class="fas fa-images"></i> Media
      </button>
      <button 
        @click="activeTab = 'menu'" 
        :class="['tab-btn', { active: activeTab === 'menu' }]"
      >
        <i class="fas fa-bars"></i> Menú
      </button>
    </div>

    <!-- Contenido de las tabs -->
    <div class="tab-content">
      <!-- Tab Entradas -->
      <div v-if="activeTab === 'entradas'" class="tab-panel">
        <div class="filters">
          <select v-model="filters.categoria" @change="loadEntradas">
            <option value="">Todas las categorías</option>
            <option v-for="cat in categorias" :key="cat.id" :value="cat.id">
              {{ cat.nombre }}
            </option>
          </select>
          <select v-model="filters.estado" @change="loadEntradas">
            <option value="">Todos los estados</option>
            <option value="borrador">Borrador</option>
            <option value="publicado">Publicado</option>
            <option value="archivado">Archivado</option>
          </select>
          <input 
            v-model="filters.busqueda" 
            @input="loadEntradas"
            placeholder="Buscar entradas..."
            class="search-input"
          >
        </div>

        <div class="entradas-list">
          <div v-for="entrada in entradas" :key="entrada.id" class="entrada-card">
            <div class="entrada-image">
              <img 
                v-if="entrada.imagen_principal" 
                :src="buildImageUrl(entrada.imagen_principal)" 
                :alt="entrada.titulo"
                @error="handleImageError"
                @load="handleImageLoad"
                class="entrada-thumbnail"
              >
              <div v-else class="no-image">
                <i class="fas fa-image"></i>
              </div>
            </div>
            <div class="entrada-content">
              <h3 class="entrada-titulo">
                <span class="tipo-indicator" :class="entrada.tipo_entrada">
                  <i :class="getTipoIcon(entrada.tipo_entrada)"></i>
                  <span class="tipo-text">{{ getTipoLabel(entrada.tipo_entrada) }}</span>
                </span>
                {{ entrada.titulo }}
              </h3>
              <p class="entrada-meta">
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
                <span class="estado" :class="entrada.estado">
                  {{ entrada.estado }}
                </span>
                <span class="fecha">{{ formatDate(entrada.fecha_publicacion || entrada.created_at) }}</span>
                <span class="vistas">{{ entrada.vistas }} vistas</span>
              </p>
              <p class="entrada-resumen">{{ entrada.resumen || 'Sin resumen' }}</p>
            </div>
            <div class="entrada-actions">
              <button @click="editEntry(entrada)" class="btn btn--small btn--primary">
                <i class="fas fa-edit"></i>
              </button>
              <button @click="deleteEntrada(entrada.id)" class="btn btn--small btn--danger">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>
        </div>

        <!-- Paginación -->
        <div class="pagination">
          <button 
            @click="changePage(currentPage - 1)" 
            :disabled="currentPage <= 1"
            class="btn btn--small"
          >
            <i class="fas fa-chevron-left"></i> Anterior
          </button>
          <span class="page-info">Página {{ currentPage }} de {{ totalPages }}</span>
          <button 
            @click="changePage(currentPage + 1)" 
            :disabled="currentPage >= totalPages"
            class="btn btn--small"
          >
            Siguiente <i class="fas fa-chevron-right"></i>
          </button>
        </div>
      </div>

      <!-- Tab Categorías -->
      <div v-if="activeTab === 'categorias'" class="tab-panel">
        <div class="categorias-list">
          <div v-for="categoria in categorias" :key="categoria.id" class="categoria-card">
            <div class="categoria-info">
              <h3>{{ categoria.nombre }}</h3>
              <p>{{ categoria.descripcion || 'Sin descripción' }}</p>
              <span class="slug">{{ categoria.slug }}</span>
            </div>
            <div class="categoria-actions">
              <button @click="editCategoria(categoria)" class="btn btn--small btn--primary">
                <i class="fas fa-edit"></i>
              </button>
              <button @click="deleteCategoria(categoria.id)" class="btn btn--small btn--danger">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Tab Media -->
      <div v-if="activeTab === 'media'" class="tab-panel">
        <div class="media-upload">
          <input 
            type="file" 
            ref="mediaInput" 
            @change="uploadMedia" 
            multiple
            accept="image/*"
            style="display: none"
          >
          <button @click="$refs.mediaInput.click()" class="btn btn--primary">
            <i class="fas fa-upload"></i> Subir Imágenes
          </button>
        </div>

        <div class="media-grid">
          <div v-for="item in media" :key="item.id" class="media-item">
            <img :src="buildImageUrl(item.url)" :alt="item.nombre">
            <div class="media-overlay">
              <button @click="selectMedia(item)" class="btn btn--small btn--primary">
                <i class="fas fa-check"></i>
              </button>
              <button @click="deleteMedia(item.id)" class="btn btn--small btn--danger">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Tab Menú -->
      <div v-if="activeTab === 'menu'" class="tab-panel">
        <div class="menu-items-list">
          <div v-for="item in menuItems" :key="item.id" class="menu-item-card">
            <div class="menu-item-info">
              <h3>{{ item.titulo }}</h3>
              <p>{{ item.url }}</p>
              <span class="orden">Orden: {{ item.orden }}</span>
              </div>
            <div class="menu-item-actions">
                <button @click="editMenuItem(item)" class="btn btn--small btn--primary">
                  <i class="fas fa-edit"></i>
                </button>
                <button @click="deleteMenuItem(item.id)" class="btn btn--small btn--danger">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'BlogAdmin',
  data() {
    return {
      activeTab: 'entradas',
      entradas: [],
      categorias: [],
      media: [],
      menuItems: [],
      currentPage: 1,
      totalPages: 1,
      itemsPerPage: 50,
      filters: {
        categoria: '',
        estado: '',
        busqueda: ''
      }
    }
  },
  mounted() {
    console.log('BlogAdmin montado, verificando autenticación...')
    
    // Verificar si hay token de admin
    const token = localStorage.getItem('adminToken')
    if (!token) {
      console.log('No hay token de admin, redirigiendo...')
      this.$router.push('/')
      return
    }
    
    // Configurar axios para incluir el token
    this.$http.defaults.headers.common['Authorization'] = `Bearer ${token}`
    
    console.log('Token configurado, cargando datos...')
    this.loadData()
  },
  methods: {
    async loadData() {
      console.log('Iniciando carga de datos...')
      await Promise.all([
        this.loadEntradas(),
        this.loadCategorias(),
        this.loadMedia(),
        this.loadMenuItems()
      ])
      console.log('Carga de datos completada')
    },
    async loadEntradas() {
      try {
        const params = {
          page: this.currentPage,
          limit: this.itemsPerPage,
          categoria: this.filters.categoria,
          estado: this.filters.estado,
          busqueda: this.filters.busqueda
        }
        
        // Usar axios sin el token para las peticiones del blog
        const response = await this.$http.get('/api/blog/admin/entradas', { 
          params,
          headers: {
            'Authorization': undefined
          }
        })
        console.log('Respuesta del backend:', response.data)
        
        // Verificar si la respuesta es un array directo o tiene estructura
        if (Array.isArray(response.data)) {
          this.entradas = response.data
          this.totalPages = 1 // Si no hay paginación, solo una página
        } else {
          this.entradas = response.data.entradas || response.data
          this.totalPages = Math.ceil((response.data.total || response.data.length) / this.itemsPerPage)
        }
        
        // Cargar categorías múltiples para cada entrada
        for (let entrada of this.entradas) {
          try {
            const categoriasResponse = await this.$http.get(`/api/blog/entradas/${entrada.id}/categorias`)
            entrada.categorias_multiples = categoriasResponse.data
          } catch (error) {
            console.error(`Error cargando categorías para entrada ${entrada.id}:`, error)
            entrada.categorias_multiples = []
          }
        }
        
        console.log('Entradas cargadas:', this.entradas.length)
        console.log('Estado de entradas:', this.entradas)
      } catch (error) {
        console.error('Error cargando entradas:', error)
        console.error('Error cargando entradas:', error)
      }
    },
    async loadCategorias() {
      try {
        const response = await this.$http.get('/api/blog/categorias')
        this.categorias = response.data
      } catch (error) {
        console.error('Error cargando categorías:', error)
      }
    },
    async loadMedia() {
      try {
        const response = await this.$http.get('/api/blog/media')
        this.media = response.data
      } catch (error) {
        console.error('Error cargando media:', error)
      }
    },
    async loadMenuItems() {
      try {
        const response = await this.$http.get('/api/blog/menu')
        this.menuItems = response.data
      } catch (error) {
        console.error('Error cargando menú:', error)
      }
    },
    changePage(page) {
      if (page >= 1 && page <= this.totalPages) {
        this.currentPage = page
        this.loadEntradas()
      }
    },
    createNewEntry() {
      this.$router.push('/admin/blog/editor')
    },
    
    editEntry(entrada) {
      this.$router.push(`/admin/blog/editor/${entrada.id}`)
    },

    async deleteEntrada(id) {
      if (confirm('¿Estás seguro de que quieres eliminar esta entrada?')) {
        try {
          await this.$http.delete(`/api/blog/admin/entradas/${id}`)
          console.log('Entrada eliminada correctamente')
          this.loadEntradas()
        } catch (error) {
                  console.error('Error eliminando entrada:', error)
        }
      }
    },
    async deleteCategoria(id) {
      if (confirm('¿Estás seguro de que quieres eliminar esta categoría?')) {
        try {
          await this.$http.delete(`/api/blog/categorias/${id}`)
          console.log('Categoría eliminada correctamente')
          this.loadCategorias()
        } catch (error) {
                  console.error('Error eliminando categoría:', error)
        }
      }
    },
    async deleteMedia(id) {
      if (confirm('¿Estás seguro de que quieres eliminar esta imagen?')) {
        try {
          await this.$http.delete(`/api/blog/media/${id}`)
          console.log('Imagen eliminada correctamente')
          this.loadMedia()
        } catch (error) {
                  console.error('Error eliminando imagen:', error)
        }
      }
    },
    async deleteMenuItem(id) {
      if (confirm('¿Estás seguro de que quieres eliminar este item del menú?')) {
        try {
          await this.$http.delete(`/api/blog/menu/${id}`)
          console.log('Item eliminado correctamente')
          this.loadMenuItems()
      } catch (error) {
                  console.error('Error eliminando item:', error)
        }
      }
    },

    formatDate(date) {
      return new Date(date).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    },
    
    getTipoIcon(tipo) {
      switch (tipo) {
        case 'entrada':
          return 'fas fa-newspaper'
        case 'pagina':
          return 'fas fa-file-alt'
        default:
          return 'fas fa-question-circle'
      }
    },
    
    getTipoLabel(tipo) {
      switch (tipo) {
        case 'entrada':
          return 'Entrada'
        case 'pagina':
          return 'Página'
        default:
          return 'Desconocido'
      }
    },
    getCategoriaNombre(categoriaId) {
      const categoria = this.categorias.find(c => c.id === categoriaId)
      return categoria ? categoria.nombre : 'Sin categoría'
    },
    getCategoriaColor(categoriaId) {
      const categoria = this.categorias.find(c => c.id === categoriaId)
      return categoria ? categoria.color_hex : '#6c757d'
    },
    buildImageUrl(url) {
      if (!url) return '';
      
      // Si es una URL de Cloudinary, devolverla tal como está
      if (url.includes('cloudinary.com')) {
        return url;
      }
      
      // Si es una URL del frontend, corregirla al backend
      if (url.startsWith('https://onkosweb.onrender.com/uploads/')) {
        return url.replace('https://onkosweb.onrender.com/', 'https://webiacontrol-back.onrender.com/');
      }
      
      // Si es una URL del backend local, corregirla al backend de producción
      if (url.startsWith('http://onkosweb.com:8080/uploads/')) {
        return url.replace('http://onkosweb.com:8080/', 'https://webiacontrol-back.onrender.com/');
      }
      
      // Si es una URL del backend incorrecto, corregirla
      if (url.startsWith('https://onkos-backend.onrender.com/uploads/')) {
        return url.replace('https://onkos-backend.onrender.com/', 'https://webiacontrol-back.onrender.com/');
      }
      
      if (url.startsWith('http')) return url;
      
      // En producción, usar la URL del backend
      if (process.env.NODE_ENV === 'production') {
        const backendUrl = process.env.VUE_APP_API_URL || 'https://webiacontrol-back.onrender.com';
        if (url.startsWith('/uploads/')) {
          return `${backendUrl}${url}`;
        }
        return `${backendUrl}/uploads/${url}`;
      } else {
        // En desarrollo, usar el proxy de Vue CLI
        if (url.startsWith('/uploads/')) {
          return url; // El proxy manejará la redirección
        }
        return `/uploads/${url}`;
      }
    },
    handleImageError(event) {
      if (event.target) {
        event.target.style.display = 'none'
      }
      if (event.target && event.target.nextElementSibling) {
        event.target.nextElementSibling.style.display = 'block'
      }
    },
    handleImageLoad(event) {
      if (event.target) {
        event.target.style.display = 'block'
      }
      if (event.target && event.target.nextElementSibling) {
        event.target.nextElementSibling.style.display = 'none'
      }
    },
    selectImageFile() {
      this.$refs.imageInput.click()
    },
    async uploadMainImage(event) {
      const file = event.target.files[0]
      if (!file) return
      
      try {
        const formData = new FormData()
        formData.append('image', file)
        
        const response = await this.$http.post('/api/blog/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        
        this.entradaForm.imagen_principal = response.data.url
        console.log('Imagen subida correctamente')
      } catch (error) {
        console.error('Error subiendo imagen:', error)
      }
    },
    removeMainImage() {
      this.entradaForm.imagen_principal = ''
    },
    selectMediaImage(item) {
      this.entradaForm.imagen_principal = item.url
      this.showMediaSelector = false
    },
    async uploadMedia(event) {
      const files = Array.from(event.target.files)
      if (files.length === 0) return
      
      try {
        for (const file of files) {
          const formData = new FormData()
          formData.append('image', file)
          
          await this.$http.post('/api/blog/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          })
        }
        
        console.log(`${files.length} imagen(es) subida(s) correctamente`)
        this.loadMedia()
      } catch (error) {
        console.error('Error subiendo imágenes:', error)
      }
    },
    selectMedia(item) {
      // Implementar selección de media
      console.log('Media seleccionada:', item)
    },
    editMenuItem(item) {
      // Implementar edición de item de menú
      console.log('Editando item:', item)
    },

    

    

  }
}
</script>

<style lang="scss" scoped>
@import "@/assets/styles/variables.scss";

.blog-admin {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  
  .admin-header-left {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    
    .admin-home-link {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: $primary-color;
      text-decoration: none;
      font-weight: 500;
      padding: 0.5rem 1rem;
      border: 1px solid $primary-color;
      border-radius: 6px;
      transition: all 0.3s ease;
      
      &:hover {
        background: $primary-color;
        color: white;
        transform: translateY(-1px);
      }
      
      i {
        font-size: 1rem;
      }
    }
  }
  
  h1 {
    color: $primary-color;
    margin: 0;
  }
  
  .admin-actions {
    display: flex;
    gap: 1rem;
  }
}

.admin-tabs {
  display: flex;
  border-bottom: 2px solid #e5e7eb;
  margin-bottom: 2rem;
  
  .tab-btn {
    padding: 1rem 2rem;
    border: none;
    background: none;
    cursor: pointer;
    font-weight: 500;
    color: #6b7280;
    border-bottom: 2px solid transparent;
    transition: all 0.3s ease;
    
    &:hover {
      color: $primary-color;
    }
    
    &.active {
      color: $primary-color;
      border-bottom-color: $primary-color;
    }
    
    i {
      margin-right: 0.5rem;
    }
  }
}

.tab-content {
  .tab-panel {
    min-height: 400px;
  }
}

.filters {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  
  select, .search-input {
    padding: 0.5rem 1rem;
    border: 1px solid #d1d5db;
    border-radius: 0.375rem;
    background: white;
    min-width: 200px;
  }
  
  .search-input {
    flex: 1;
    min-width: 300px;
  }
}

.entradas-list {
  display: grid;
  gap: 1.5rem;
}

.entrada-card {
  display: flex;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  overflow: hidden;
  transition: all 0.3s ease;
  
  &:hover {
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }
  
  .entrada-image {
    width: 120px;
    height: 120px;
    flex-shrink: 0;
    
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    
    .no-image {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f3f4f6;
      color: #9ca3af;
      font-size: 2rem;
    }
  }
  
  .entrada-content {
    flex: 1;
    padding: 1rem;
    
    h3 {
      margin: 0 0 0.5rem 0;
      color: #1f2937;
      font-size: 1.125rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-wrap: wrap;
    }
    
    .tipo-indicator {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.25rem 0.5rem;
      border-radius: 0.375rem;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.025em;
      
      &.entrada {
        background: linear-gradient(135deg, #3b82f6, #1d4ed8);
        color: white;
        box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);
      }
      
      &.pagina {
        background: linear-gradient(135deg, #10b981, #059669);
        color: white;
        box-shadow: 0 2px 4px rgba(16, 185, 129, 0.3);
      }
      
      i {
        font-size: 0.625rem;
      }
      
      .tipo-text {
        font-size: 0.625rem;
      }
    }
    
    .entrada-meta {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
      flex-wrap: wrap;
      
      span {
        padding: 0.25rem 0.5rem;
        border-radius: 0.25rem;
        font-size: 0.75rem;
        font-weight: 500;
        
        &.categoria {
          color: white;
        }
      }
      
      .categorias-container {
        display: flex;
        flex-wrap: wrap;
        gap: 0.25rem;
        margin-bottom: 0.5rem;
        
        .categoria {
          display: inline-block;
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
          font-size: 0.75rem;
          font-weight: 500;
          color: white;
          
          &.categoria-multiple {
            margin-right: 0.25rem;
          }
          
          &.sin-categoria {
            background: #6b7280;
            color: white;
          }
        }
      }
      
      .entrada-meta {
        .categoria {
          display: inline-block;
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
          font-size: 0.75rem;
          font-weight: 500;
          color: white;
        }
        
        &.estado {
          &.borrador { background: #fbbf24; color: #92400e; }
          &.publicado { background: #10b981; color: white; }
          &.archivado { background: #6b7280; color: white; }
        }
        
        &.fecha, &.vistas {
          background: #f3f4f6;
          color: #6b7280;
        }
      }
    }
    
    .entrada-resumen {
      color: #6b7280;
      font-size: 0.875rem;
      margin: 0;
      line-height: 1.5;
    }
  }
  
  .entrada-actions {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 1rem;
    justify-content: center;
  }
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 2rem;
  
  .page-info {
    font-weight: 500;
    color: #6b7280;
  }
}

.categorias-list {
  display: grid;
  gap: 1rem;
}

.categoria-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
    padding: 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  
  .categoria-info {
    h3 {
      margin: 0 0 0.25rem 0;
      color: #1f2937;
    }
    
    p {
      margin: 0 0 0.25rem 0;
      color: #6b7280;
      font-size: 0.875rem;
    }
    
    .slug {
      background: #f3f4f6;
      color: #6b7280;
      padding: 0.25rem 0.5rem;
      border-radius: 0.25rem;
      font-size: 0.75rem;
      font-family: monospace;
    }
  }
  
  .categoria-actions {
    display: flex;
    gap: 0.5rem;
  }
}

.media-upload {
  margin-bottom: 2rem;
}

.media-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}

.media-item {
  position: relative;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  overflow: hidden;
  
  img {
    width: 100%;
    height: 150px;
    object-fit: cover;
  }
  
  .media-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  
  &:hover .media-overlay {
    opacity: 1;
  }
}

.menu-items-list {
  display: grid;
  gap: 1rem;
}

.menu-item-card {
    display: flex;
    justify-content: space-between;
    align-items: center;
  background: white;
    padding: 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  
  .menu-item-info {
    h3 {
      margin: 0 0 0.25rem 0;
      color: #1f2937;
    }
    
    p {
      margin: 0 0 0.25rem 0;
      color: #6b7280;
      font-size: 0.875rem;
    }
    
    .orden {
      background: #f3f4f6;
      color: #6b7280;
      padding: 0.25rem 0.5rem;
      border-radius: 0.25rem;
      font-size: 0.75rem;
    }
  }
  
  .menu-item-actions {
      display: flex;
      gap: 0.5rem;
  }
}

// Modal styles
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
  padding: 2rem;
}

.modal-content {
  background: white;
  border-radius: 0.5rem;
  max-width: 800px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  
  &.media-selector-modal {
    max-width: 1000px;
  }
}
  
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    border-bottom: 1px solid #e5e7eb;
    
    h2 {
      margin: 0;
    color: #1f2937;
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
  border-top: 1px solid #e5e7eb;
}

// Form styles
.entrada-form {
  .form-section {
    margin-bottom: 2rem;
    
    h3 {
      margin: 0 0 1rem 0;
      color: #1f2937;
      font-size: 1.125rem;
      border-bottom: 2px solid #e5e7eb;
      padding-bottom: 0.5rem;
  }
}

.form-group {
    margin-bottom: 1rem;
  
  label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: #374151;
  }
  
  input, select, textarea {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 0.375rem;
      font-size: 0.875rem;
    
    &:focus {
      outline: none;
      border-color: $primary-color;
      box-shadow: 0 0 0 3px rgba($primary-color, 0.1);
    }
  }
  
  textarea {
    resize: vertical;
    min-height: 100px;
  }
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

  .radio-group {
  display: flex;
    gap: 2rem;
    
    .radio-option {
      display: flex;
  align-items: center;
  gap: 0.5rem;
      cursor: pointer;
      
      input[type="radio"] {
        width: auto;
        margin: 0;
      }
      
      span {
        font-weight: 500;
        color: #374151;
      }
    }
  }
}

// Image upload styles
.image-upload-container {
  .image-preview {
    position: relative;
    display: inline-block;
    
    img {
      max-width: 300px;
      max-height: 200px;
      border-radius: 0.375rem;
      border: 1px solid #d1d5db;
    }
    
    button {
      position: absolute;
      top: 0.5rem;
      right: 0.5rem;
    }
  }
  
  .image-upload-area {
    border: 2px dashed #d1d5db;
    border-radius: 0.5rem;
    padding: 2rem;
    text-align: center;
    cursor: pointer;
    transition: all 0.3s ease;
    
    &:hover {
    border-color: $primary-color;
      background: rgba($primary-color, 0.05);
    }
    
    i {
      font-size: 3rem;
      color: #9ca3af;
      margin-bottom: 1rem;
    }
    
    p {
      margin: 0 0 0.5rem 0;
      color: #374151;
      font-weight: 500;
    }
    
    .upload-hint {
    color: #6b7280;
      font-size: 0.875rem;
    }
  }
}

.media-selector {
  margin-top: 1rem;
}

.media-grid-selector {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 1rem;
}

.media-item-selector {
  position: relative;
  cursor: pointer;
  border-radius: 0.375rem;
  overflow: hidden;
  transition: all 0.3s ease;
    
    &:hover {
    transform: scale(1.05);
  }
  
  img {
    width: 100%;
    height: 120px;
    object-fit: cover;
  }
  
  .media-item-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba($primary-color, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.3s ease;
    
    i {
      color: white;
      font-size: 1.5rem;
    }
  }
  
  &:hover .media-item-overlay {
    opacity: 1;
  }
}

// Editor styles
.editor-container {
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  overflow: hidden;
}

.editor-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: 0.75rem;
  background: #f9fafb;
  border-bottom: 1px solid #d1d5db;
}
  
  .toolbar-group {
    display: flex;
    gap: 0.25rem;
  padding-right: 0.75rem;
  border-right: 1px solid #d1d5db;
    
    &:last-child {
      border-right: none;
    }
  }

  .toolbar-btn {
    padding: 0.5rem;
    border: 1px solid transparent;
  background: white;
    border-radius: 0.25rem;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 0.875rem;
    
    &:hover {
    background: #f3f4f6;
    border-color: #d1d5db;
    }
    
    &:active {
    background: #e5e7eb;
  }
  
  i {
    color: #374151;
  }
}

.content-editor {
  min-height: 400px;
  padding: 1rem;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 0.875rem;
  line-height: 1.6;
  outline: none;
  
  &:empty:before {
    content: attr(placeholder);
    color: #9ca3af;
    pointer-events: none;
  }
  
  h1, h2, h3, h4, h5, h6 {
    margin: 1rem 0 0.5rem 0;
    color: #1f2937;
    font-weight: 600;
  }
  
  p {
    margin: 0 0 1rem 0;
  }
  
  ul, ol {
    margin: 0 0 1rem 0;
    padding-left: 2rem;
  }
  
  blockquote {
    border-left: 4px solid $primary-color;
    padding: 1rem 1.5rem;
    margin: 1rem 0;
    background: #f9fafb;
    font-style: italic;
    color: #6b7280;
  }
  
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 1rem 0;
    
    th, td {
      border: 1px solid #d1d5db;
      padding: 0.5rem;
      text-align: left;
    }
    
    th {
      background: #f9fafb;
    font-weight: 600;
  }
  }
  
  img {
    max-width: 100%;
    height: auto;
    border-radius: 0.25rem;
    margin: 1rem 0;
  }
}

// Button styles
.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.375rem;
    font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  &--primary {
      background: $primary-color;
      color: white;
    
    &:hover:not(:disabled) {
      background: darken($primary-color, 10%);
    }
  }
  
  &--secondary {
    background: #6b7280;
    color: white;
    
    &:hover:not(:disabled) {
      background: #4b5563;
    }
  }
  
  &--danger {
    background: #ef4444;
    color: white;
    
    &:hover:not(:disabled) {
      background: #dc2626;
    }
  }
  
  &--small {
    padding: 0.25rem 0.5rem;
    font-size: 0.75rem;
  }
  
  &--icon {
    padding: 0.5rem;
    min-width: 2.5rem;
    justify-content: center;
  }
  
  i {
    font-size: 0.875em;
  }
}

// Responsive
@media (max-width: 768px) {
  .blog-admin {
    padding: 1rem;
  }
  
  .admin-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
    
    .admin-actions {
      justify-content: center;
    }
  }
  
  .admin-tabs {
    flex-wrap: wrap;
    
    .tab-btn {
      flex: 1;
      min-width: 120px;
    }
  }
  
  .entrada-card {
    flex-direction: column;
    
    .entrada-image {
      width: 100%;
      height: 200px;
    }
    
    .entrada-actions {
      flex-direction: row;
      justify-content: center;
    }
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .radio-group {
    flex-direction: column;
    gap: 1rem;
  }
  
  .modal-overlay {
    padding: 1rem;
  }
  
  .modal-content {
    max-height: 95vh;
  }
  
  .editor-toolbar {
    flex-direction: column;
    gap: 0.75rem;
    
    .toolbar-group {
      border-right: none;
      border-bottom: 1px solid #d1d5db;
      padding-bottom: 0.75rem;
      
      &:last-child {
        border-bottom: none;
      }
    }
  }
}
</style> 