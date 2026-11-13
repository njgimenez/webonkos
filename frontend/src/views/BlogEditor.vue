<template>
  <div class="blog-editor">
    <!-- Header del Editor -->
    <div class="editor-header">
      <div class="header-left">
        <router-link to="/" class="home-btn">
          <i class="fas fa-home"></i>
          <span>Home</span>
        </router-link>
        <button @click="goBack" class="back-btn">
          <i class="fas fa-arrow-left"></i>
          Volver
        </button>
        <h1>{{ isEditing ? 'Editar Entrada' : 'Nueva Entrada' }}</h1>
      </div>
      <div class="header-right">
        <button @click="saveDraft" class="btn btn-secondary">
          <i class="fas fa-save"></i>
          Guardar Borrador
        </button>
        <button @click="publishEntry" class="btn btn-primary">
          <i class="fas fa-paper-plane"></i>
          Publicar
        </button>
      </div>
    </div>

    <!-- Contenido Principal -->
    <div class="editor-content">
      <!-- Panel Izquierdo - Formulario -->
      <div class="editor-sidebar">
        <div class="sidebar-section">
          <h3>Información Básica</h3>
          
          <div class="form-group">
            <label for="titulo">Título *</label>
            <input 
              id="titulo"
              v-model="entradaForm.titulo" 
              type="text" 
              placeholder="Título de la entrada"
              class="form-control"
            >
          </div>

          <div class="form-group">
            <label for="slug">Slug</label>
            <div class="input-group">
              <input 
                id="slug"
                v-model="entradaForm.slug" 
                type="text" 
                placeholder="URL amigable (se genera automáticamente)"
                class="form-control"
                @input="onSlugInput"
              >
              <button 
                type="button" 
                @click="regenerateSlug" 
                class="btn btn-outline-secondary"
                title="Regenerar slug del título"
              >
                <i class="fas fa-sync-alt"></i>
              </button>
            </div>
            <small class="form-text text-muted">
              Se genera automáticamente del título. Puedes editarlo manualmente o regenerarlo.
            </small>
          </div>

          <div class="form-group">
            <label for="resumen">Resumen</label>
            <textarea 
              id="resumen"
              v-model="entradaForm.resumen" 
              placeholder="Breve descripción de la entrada"
              class="form-control"
              rows="3"
            ></textarea>
          </div>

          <div class="form-group">
            <label>Categorías</label>
            
            <!-- Información de categorías asignadas -->
            <div v-if="selectedCategorias.length > 0" class="categories-info">
              <h4>Categorías asignadas ({{ selectedCategorias.length }}):</h4>
              <div class="assigned-categories">
                <span 
                  v-for="categoria in selectedCategorias" 
                  :key="categoria.id"
                  class="assigned-category-tag"
                  :style="{ backgroundColor: categoria.color_hex }"
                >
                  {{ categoria.nombre }}
                </span>
              </div>
            </div>
            
            <div class="category-multi-select">
              <div class="selected-categories">
                <span 
                  v-for="categoria in selectedCategorias" 
                  :key="categoria.id"
                  class="category-tag"
                  :style="{ backgroundColor: categoria.color_hex }"
                >
                  {{ categoria.nombre }}
                  <button 
                    type="button" 
                    @click="removeCategory(categoria.id)"
                    class="remove-category"
                  >
                    ×
                  </button>
                </span>
              </div>
              <select 
                v-model="newCategoryId" 
                @change="addCategory"
                class="form-control"
              >
                <option value="">Seleccionar categoría...</option>
                <option 
                  v-for="categoria in availableCategorias" 
                  :key="categoria.id"
                  :value="categoria.id"
                >
                  {{ categoria.nombre }}
                </option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label for="estado">Estado</label>
            <select v-model="entradaForm.estado" class="form-control">
              <option value="borrador">Borrador</option>
              <option value="publicado">Publicado</option>
            </select>
          </div>

          <div class="form-group">
            <label>Tipo de Entrada</label>
            <div class="radio-group">
              <label class="radio-option">
                <input 
                  type="radio" 
                  v-model="entradaForm.tipo_entrada" 
                  value="entrada"
                >
                <span class="radio-label">Entrada de Blog</span>
              </label>
              <label class="radio-option">
                <input 
                  type="radio" 
                  v-model="entradaForm.tipo_entrada" 
                  value="pagina"
                >
                <span class="radio-label">Página Web</span>
              </label>
            </div>
          </div>
        </div>

        <div class="sidebar-section">
          <h3>Imagen Principal</h3>
          <div 
            class="image-upload-area"
            @click="selectImageFile"
            @dragover.prevent
            @drop.prevent="handleImageDrop"
          >
            <div v-if="isUploadingImage" class="upload-loading">
              <i class="fas fa-spinner fa-spin"></i>
              <p>Subiendo imagen...</p>
            </div>
            <div v-else-if="!entradaForm.imagen_principal" class="upload-placeholder">
              <i class="fas fa-cloud-upload-alt"></i>
              <p>Haz clic o arrastra una imagen</p>
            </div>
            <div v-else class="image-preview">
              <img :src="buildImageUrl(entradaForm.imagen_principal)" alt="Preview">
              <button @click.stop="removeMainImage" class="remove-image">
                <i class="fas fa-times"></i>
              </button>
            </div>
          </div>
        </div>

        <div class="sidebar-section">
          <h3>Configuración SEO</h3>
          
          <div class="form-group">
            <label for="meta_title">Meta Título</label>
            <input 
              id="meta_title"
              v-model="entradaForm.meta_title" 
              type="text" 
              placeholder="Título para SEO"
              class="form-control"
            >
          </div>

          <div class="form-group">
            <label for="meta_description">Meta Descripción</label>
            <textarea 
              id="meta_description"
              v-model="entradaForm.meta_description" 
              placeholder="Descripción para SEO"
              class="form-control"
              rows="3"
            ></textarea>
          </div>


        </div>
      </div>

      <!-- Panel Principal - Editor -->
      <div class="editor-main">
        <div class="editor-toolbar">
          <div class="toolbar-group">
            <button type="button" @click="execCommand('bold')" class="toolbar-btn" title="Negrita">
              <i class="fas fa-bold"></i>
            </button>
            <button type="button" @click="execCommand('italic')" class="toolbar-btn" title="Cursiva">
              <i class="fas fa-italic"></i>
            </button>
            <button type="button" @click="execCommand('underline')" class="toolbar-btn" title="Subrayado">
              <i class="fas fa-underline"></i>
            </button>
            <button type="button" @click="execCommand('strikeThrough')" class="toolbar-btn" title="Tachado">
              <i class="fas fa-strikethrough"></i>
            </button>
          </div>
          
          <div class="toolbar-group">
            <select @change="setFontSize" class="font-size-select" title="Tamaño de texto">
              <option value="">Tamaño</option>
              <option value="1">Muy pequeño</option>
              <option value="2">Pequeño</option>
              <option value="3">Normal</option>
              <option value="4">Grande</option>
              <option value="5">Muy grande</option>
              <option value="6">Enorme</option>
              <option value="7">Máximo</option>
            </select>
            
            <select @change="setFontFamily" class="font-family-select" title="Tipo de fuente">
              <option value="">Fuente</option>
              <option value="Arial">Arial</option>
              <option value="Times New Roman">Times New Roman</option>
              <option value="Courier New">Courier New</option>
              <option value="Georgia">Georgia</option>
              <option value="Verdana">Verdana</option>
              <option value="Helvetica">Helvetica</option>
            </select>
          </div>
          
          <div class="toolbar-group">
            <div class="color-picker-container">
              <input 
                type="color" 
                @change="setTextColor" 
                class="color-picker" 
                title="Color de texto"
                value="#000000"
              >
              <i class="fas fa-palette"></i>
            </div>
            
            <div class="color-picker-container">
              <input 
                type="color" 
                @change="setBackgroundColor" 
                class="color-picker" 
                title="Color de fondo"
                value="#ffffff"
              >
              <i class="fas fa-fill-drip"></i>
            </div>
          </div>
          
          <div class="toolbar-group">
            <button type="button" @click="execCommand('justifyLeft')" class="toolbar-btn" title="Alinear Izquierda">
              <i class="fas fa-align-left"></i>
            </button>
            <button type="button" @click="execCommand('justifyCenter')" class="toolbar-btn" title="Centrar">
              <i class="fas fa-align-center"></i>
            </button>
            <button type="button" @click="execCommand('justifyRight')" class="toolbar-btn" title="Alinear Derecha">
              <i class="fas fa-align-right"></i>
            </button>
            <button type="button" @click="execCommand('justifyFull')" class="toolbar-btn" title="Justificar">
              <i class="fas fa-align-justify"></i>
            </button>
          </div>
          
          <div class="toolbar-group">
            <button type="button" @click="execCommand('insertUnorderedList')" class="toolbar-btn" title="Lista sin ordenar">
              <i class="fas fa-list-ul"></i>
            </button>
            <button type="button" @click="execCommand('insertOrderedList')" class="toolbar-btn" title="Lista ordenada">
              <i class="fas fa-list-ol"></i>
            </button>
            <button type="button" @click="execCommand('outdent')" class="toolbar-btn" title="Reducir sangría">
              <i class="fas fa-outdent"></i>
            </button>
            <button type="button" @click="execCommand('indent')" class="toolbar-btn" title="Aumentar sangría">
              <i class="fas fa-indent"></i>
            </button>
          </div>
          
          <div class="toolbar-group">
            <button type="button" @click="insertLink" class="toolbar-btn" title="Insertar enlace">
              <i class="fas fa-link"></i>
            </button>
            <button type="button" @click="insertImage" class="toolbar-btn" title="Insertar imagen">
              <i class="fas fa-image"></i>
            </button>
            <button type="button" @click="insertTable" class="toolbar-btn" title="Insertar tabla">
              <i class="fas fa-table"></i>
            </button>
          </div>
          
          <div class="toolbar-group">
            <button type="button" @click="execCommand('undo')" class="toolbar-btn" title="Deshacer">
              <i class="fas fa-undo"></i>
            </button>
            <button type="button" @click="execCommand('redo')" class="toolbar-btn" title="Rehacer">
              <i class="fas fa-redo"></i>
            </button>
          </div>
        </div>
        
        <div 
          ref="contentEditor"
          class="content-editor"
          contenteditable="true"
          @input="updateContent"
          @paste="handlePaste"
          @keydown="handleKeydown"
          placeholder="Escribe el contenido de tu entrada aquí..."
        ></div>
      </div>
    </div>

    <!-- Input oculto para subir archivos -->
    <input 
      ref="fileInput" 
      type="file" 
      accept="image/*" 
      style="display: none"
      @change="handleFileSelect"
    >
    
    <!-- Input oculto para imágenes del editor -->
    <input 
      ref="editorImageInput" 
      type="file" 
      accept="image/*" 
      style="display: none"
      @change="handleEditorImageSelect"
    >

    <!-- Modal de configuración de imagen -->
    <div v-if="showImageModal" class="image-modal-overlay" @click="closeImageModal">
      <div class="image-modal" @click.stop>
        <div class="modal-header">
          <h3>Configurar Imagen</h3>
          <button @click="closeImageModal" class="close-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-content">
          <div class="image-preview">
            <img :src="selectedImage.src" :alt="selectedImage.alt" class="preview-img">
          </div>
          <div class="image-controls">
            <div class="control-group">
              <label>Ancho:</label>
              <input 
                v-model.number="selectedImage.width" 
                type="number" 
                min="50" 
                max="800"
                @input="updateImageSize"
              >
              <span>px</span>
            </div>
            <div class="control-group">
              <label>Alto:</label>
              <input 
                v-model.number="selectedImage.height" 
                type="number" 
                min="50" 
                max="600"
                @input="updateImageSize"
              >
              <span>px</span>
            </div>
            <div class="control-group">
              <label>Alineación:</label>
              <select v-model="selectedImage.alignment" @change="updateImageAlignment">
                <option value="left">Izquierda</option>
                <option value="center">Centro</option>
                <option value="right">Derecha</option>
              </select>
            </div>
            <div class="control-group">
              <label>Texto alternativo:</label>
              <input 
                v-model="selectedImage.alt" 
                type="text" 
                placeholder="Descripción de la imagen"
                @input="updateImageAlt"
              >
            </div>
            <div class="control-group">
              <label>Mantener proporción:</label>
              <input 
                v-model="maintainAspectRatio" 
                type="checkbox"
              >
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="deleteSelectedImage" class="btn btn-danger">
            <i class="fas fa-trash"></i>
            Eliminar
          </button>
          <button @click="closeImageModal" class="btn btn-secondary">
            Cancelar
          </button>
          <button @click="applyImageChanges" class="btn btn-primary">
            Aplicar
          </button>
        </div>
      </div>
    </div>

    <!-- Modal de configuración de tabla -->
    <div v-if="showTableModal" class="table-modal-overlay" @click="closeTableModal">
      <div class="table-modal" @click.stop>
        <div class="modal-header">
          <h3>Configurar Tabla</h3>
          <button @click="closeTableModal" class="close-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-content">
          <div class="table-preview">
            <div class="table-preview-container" v-html="tablePreviewHTML"></div>
          </div>
          <div class="table-controls">
            <div class="control-group">
              <label>Filas:</label>
              <input 
                v-model.number="selectedTable.rows" 
                type="number" 
                min="1" 
                max="20"
                @input="updateTablePreview"
              >
            </div>
            <div class="control-group">
              <label>Columnas:</label>
              <input 
                v-model.number="selectedTable.columns" 
                type="number" 
                min="1" 
                max="10"
                @input="updateColumnsAndHeaders"
              >
            </div>
            <div class="control-group">
              <label>Ancho de tabla:</label>
              <select v-model="selectedTable.width" @change="updateTablePreview">
                <option value="100%">Ancho completo</option>
                <option value="75%">75% del ancho</option>
                <option value="50%">50% del ancho</option>
                <option value="25%">25% del ancho</option>
              </select>
            </div>
            <div class="control-group">
              <label>Estilo de borde:</label>
              <select v-model="selectedTable.borderStyle" @change="updateTablePreview">
                <option value="solid">Sólido</option>
                <option value="dashed">Punteado</option>
                <option value="dotted">Puntos</option>
                <option value="none">Sin borde</option>
              </select>
            </div>
            <div class="control-group">
              <label>Color de borde:</label>
              <input 
                v-model="selectedTable.borderColor" 
                type="color"
                @input="updateTablePreview"
              >
            </div>
            <div class="control-group">
              <label>Color de fondo del encabezado:</label>
              <input 
                v-model="selectedTable.headerBgColor" 
                type="color"
                @input="updateTablePreview"
              >
            </div>
            <div class="control-group">
              <label>Color de texto del encabezado:</label>
              <input 
                v-model="selectedTable.headerTextColor" 
                type="color"
                @input="updateTablePreview"
              >
            </div>
            <div class="control-group">
              <label>Encabezado:</label>
              <input 
                v-model="selectedTable.hasHeader" 
                type="checkbox"
                @change="updateTablePreview"
              >
              <span>Incluir fila de encabezado</span>
            </div>
            
            <!-- Controles para editar texto de encabezados -->
            <div v-if="selectedTable.hasHeader" class="header-text-controls">
              <label>Texto de encabezados:</label>
              <div class="header-inputs">
                <div 
                  v-for="(header, index) in selectedTable.headerTexts" 
                  :key="index" 
                  class="header-input-group"
                >
                  <label>Columna {{ index + 1 }}:</label>
                  <input 
                    v-model="selectedTable.headerTexts[index]" 
                    type="text" 
                    :placeholder="`Encabezado ${index + 1}`"
                    @input="updateTablePreview"
                  >
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="deleteSelectedTable" class="btn btn-danger">
            <i class="fas fa-trash"></i>
            Eliminar
          </button>
          <button @click="closeTableModal" class="btn btn-secondary">
            Cancelar
          </button>
          <button @click="applyTableChanges" class="btn btn-primary">
            Aplicar
          </button>
        </div>
      </div>
    </div>

    <!-- Modal de configuración de enlace -->
    <div v-if="showLinkModal" class="link-modal-overlay" @click="closeLinkModal">
      <div class="link-modal" @click.stop>
        <div class="modal-header">
          <h3>{{ isEditingLink ? 'Editar Enlace' : 'Insertar Enlace' }}</h3>
          <button @click="closeLinkModal" class="close-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-content">
          <div class="link-controls">
            <div class="control-group">
              <label for="linkText">Texto del enlace:</label>
              <input 
                id="linkText"
                v-model="selectedLink.text" 
                type="text" 
                placeholder="Texto que se mostrará"
                class="form-control"
              >
            </div>
            <div class="control-group">
              <label for="linkUrl">URL del enlace:</label>
              <input 
                id="linkUrl"
                v-model="selectedLink.url" 
                type="url" 
                placeholder="https://ejemplo.com"
                class="form-control"
              >
            </div>
            <div class="control-group">
              <label for="linkTarget">Abrir en:</label>
              <select id="linkTarget" v-model="selectedLink.target" class="form-control">
                <option value="_self">Misma ventana</option>
                <option value="_blank">Nueva ventana</option>
                <option value="_parent">Ventana padre</option>
                <option value="_top">Ventana superior</option>
              </select>
            </div>
            <div class="control-group">
              <label for="linkTitle">Título (tooltip):</label>
              <input 
                id="linkTitle"
                v-model="selectedLink.title" 
                type="text" 
                placeholder="Texto que aparece al pasar el mouse"
                class="form-control"
              >
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="closeLinkModal" class="btn btn-secondary">
            Cancelar
          </button>
          <button @click="applyLinkChanges" class="btn btn-primary">
            {{ isEditingLink ? 'Actualizar' : 'Insertar' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import CategorySelector from '@/components/CategorySelector.vue'

export default {
  name: 'BlogEditor',
  components: {
    CategorySelector
  },
  data() {
    return {
      isEditing: false,
      entradaId: null,
      entradaForm: {
        titulo: '',
        slug: '',
        resumen: '',
        contenido: '',
        categoria_id: null,
        estado: 'borrador',
        tipo_entrada: 'entrada',
        imagen_principal: '',
        meta_title: '',
        meta_description: '',
        tags: [],
        fecha_publicacion: null,
        destacado: false,
        autor_id: null,
        orden: 0,
        vistas: 0,
        created_at: null,
        updated_at: null,
        id: null
      },
      categorias: [],
      selectedCategorias: [],
      availableCategorias: [],
      newCategoryId: '',
      hasUnsavedChanges: false,
      isUploadingImage: false,
      showImageModal: false,
      selectedImage: {
        element: null,
        src: '',
        alt: '',
        width: 300,
        height: 200,
        alignment: 'center',
        originalWidth: 0,
        originalHeight: 0
      },
      maintainAspectRatio: true,
      showTableModal: false,
      selectedTable: {
        element: null,
        rows: 3,
        columns: 3,
        width: '100%',
        borderStyle: 'solid',
        borderColor: '#d1d5db',
        headerBgColor: '#f9fafb',
        headerTextColor: '#374151',
        hasHeader: true,
        headerTexts: ['Encabezado 1', 'Encabezado 2', 'Encabezado 3']
      },
      tablePreviewHTML: '',
      slugEditedManually: false,
      showLinkModal: false,
      selectedLink: {
        url: '',
        text: '',
        target: '_self',
        title: ''
      },
      isEditingLink: false,
      linkSelection: null
    }
  },
  watch: {
    'entradaForm.titulo': {
      handler(newTitle) {
        // Solo generar slug automáticamente si no ha sido editado manualmente
        if (!this.slugEditedManually && newTitle) {
          this.entradaForm.slug = this.generateSlug(newTitle)
        }
      },
      immediate: false
    }
  },
  async mounted() {
    this.loadCategorias()
    
    // Verificar si estamos editando
    if (this.$route.params.id) {
      this.isEditing = true
      this.entradaId = this.$route.params.id
      await this.loadEntrada()
    }
    
    // Configurar el contenido del editor
    if (this.entradaForm.contenido) {
      this.$nextTick(() => {
        this.$refs.contentEditor.innerHTML = this.processContentImages(this.entradaForm.contenido)
        this.setupImageEvents()
        this.setupTableEvents()
      })
    }
    
    // Detectar cambios no guardados
    window.addEventListener('beforeunload', this.handleBeforeUnload)
  },
  beforeDestroy() {
    window.removeEventListener('beforeunload', this.handleBeforeUnload)
    this.cleanupImageEvents()
    this.cleanupTableEvents()
    this.cleanupLinkEvents()
  },
  methods: {
    goBack() {
      if (this.hasUnsavedChanges) {
        if (confirm('¿Estás seguro de que quieres salir? Tienes cambios sin guardar.')) {
          this.$router.push('/admin/blog')
        }
      } else {
        this.$router.push('/admin/blog')
      }
    },
    
    handleBeforeUnload(e) {
      if (this.hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = ''
      }
    },
    
    async loadCategorias() {
      try {
        const response = await this.$http.get('/api/blog/categorias')
        this.categorias = response.data
        this.availableCategorias = response.data
      } catch (error) {
        console.error('Error cargando categorías:', error)
      }
    },

    onCategoryChange(categoryData) {
      console.log('Categoría seleccionada:', categoryData)
      this.hasUnsavedChanges = true
    },

    onCategoryError(errorMessage) {
      console.error('Error en selector de categorías:', errorMessage)
      // Aquí podrías mostrar una notificación al usuario
    },

    addCategory() {
      if (this.newCategoryId) {
        const categoria = this.availableCategorias.find(cat => cat.id == this.newCategoryId)
        if (categoria && !this.selectedCategorias.find(cat => cat.id == categoria.id)) {
          this.selectedCategorias.push(categoria)
          this.hasUnsavedChanges = true
        }
        this.newCategoryId = ''
      }
    },

    removeCategory(categoriaId) {
      this.selectedCategorias = this.selectedCategorias.filter(cat => cat.id != categoriaId)
      this.hasUnsavedChanges = true
    },

    async loadEntradaCategorias() {
      try {
        console.log('🔄 Cargando categorías para entrada:', this.entradaId)
        const response = await this.$http.get(`/api/blog/entradas/${this.entradaId}/categorias`)
        console.log('✅ Categorías cargadas:', response.data)
        this.selectedCategorias = response.data
      } catch (error) {
        console.error('❌ Error cargando categorías de entrada:', error)
        console.error('❌ Error response:', error.response?.data)
        console.error('❌ Error status:', error.response?.status)
        this.selectedCategorias = []
      }
    },
    
    async loadEntrada() {
      try {
        const response = await this.$http.get(`/api/blog/entradas/${this.entradaId}`)
        const entrada = response.data
        
        this.entradaForm = {
          titulo: entrada.titulo || '',
          slug: entrada.slug || '',
          resumen: entrada.resumen || '',
          contenido: entrada.contenido || '',
          categoria_id: entrada.categoria_id || '',
          estado: entrada.estado || 'borrador',
          tipo_entrada: entrada.tipo_entrada || 'entrada',
          imagen_principal: entrada.imagen_principal || '',
          meta_title: entrada.meta_title || '',
          meta_description: entrada.meta_description || '',
          tags: entrada.tags || [],
          fecha_publicacion: entrada.fecha_publicacion || null,
          destacado: entrada.destacado || false,
          categoria_id: entrada.categoria_id || null,
          resumen: entrada.resumen || null,
          imagen_principal: entrada.imagen_principal || null,
          meta_title: entrada.meta_title || null,
          meta_description: entrada.meta_description || null,
          autor_id: entrada.autor_id || null,
          orden: entrada.orden || 0,
          vistas: entrada.vistas || 0,
          created_at: entrada.created_at || null,
          updated_at: entrada.updated_at || null,
          id: entrada.id || null,
          slug: entrada.slug || null,
          estado: entrada.estado || 'borrador'
        }
        
        // Al cargar una entrada existente, considerar que el slug ya existe y no debe regenerarse automáticamente
        this.slugEditedManually = true
        
        // Cargar categorías múltiples
        await this.loadEntradaCategorias()
        
        // Configurar el contenido del editor
        this.$nextTick(() => {
          if (this.$refs.contentEditor) {
            this.$refs.contentEditor.innerHTML = this.processContentImages(this.entradaForm.contenido)
            // Reconfigurar eventos para las imágenes, tablas y enlaces existentes
            this.setupImageEvents()
            this.setupTableEvents()
            this.setupLinkEvents()
            
            // Configurar eventos nuevamente después de un pequeño delay para asegurar que se apliquen
            setTimeout(() => {
              this.setupTableEvents()
              this.setupLinkEvents()
            }, 100)
          }
        })
      } catch (error) {
        console.error('Error cargando entrada:', error)
      }
    },
    
    async saveDraft() {
      this.entradaForm.estado = 'borrador'
      await this.saveEntry()
    },
    
    async publishEntry() {
      console.log('🚀 Iniciando publicación de entrada...')
      console.log('📝 Estado actual del formulario:', this.entradaForm)
      
      // Validar campos requeridos
      if (!this.entradaForm.titulo || this.entradaForm.titulo.trim() === '') {
        alert('El título es requerido para publicar la entrada')
        return
      }
      
      // Obtener contenido actual del editor
      if (this.$refs.contentEditor) {
        this.entradaForm.contenido = this.$refs.contentEditor.innerHTML
      }
      
      // Validar contenido
      if (!this.entradaForm.contenido || this.entradaForm.contenido.trim() === '' || this.entradaForm.contenido === '<p><br></p>') {
        alert('El contenido es requerido para publicar la entrada')
        return
      }
      
      this.entradaForm.estado = 'publicado'
      console.log('✅ Estado cambiado a publicado')
      
      try {
        await this.saveEntry()
        console.log('✅ Entrada publicada exitosamente')
      } catch (error) {
        console.error('❌ Error al publicar entrada:', error)
        const errorMessage = error.response?.data?.error || error.message || 'Error desconocido'
        alert(`Error al publicar la entrada: ${errorMessage}`)
      }
    },
    
    async saveEntry() {
      try {
        // Limpiar botones de configuración antes de guardar
        this.cleanupTableEvents()
        
        // Actualizar contenido del editor
        this.entradaForm.contenido = this.$refs.contentEditor.innerHTML
        
        // Procesar imágenes en el contenido antes de guardar
        await this.processContentImages()
        
        // Preparar datos con categorías múltiples
        const dataToSend = {
          ...this.entradaForm,
          categorias: this.selectedCategorias.map(cat => cat.id)
        }
        
        // Debug: mostrar datos que se van a enviar
        console.log('📤 Datos a enviar:', JSON.stringify(dataToSend, null, 2))
        console.log('📤 URL de la petición:', `/api/blog/entradas/${this.entradaId}`)
        console.log('📤 Tipo de entrada:', dataToSend.tipo_entrada)
        console.log('📤 Tags:', dataToSend.tags)
        console.log('📤 Estado:', dataToSend.estado)
        console.log('📤 Categorías múltiples:', dataToSend.categorias)
        
        if (this.isEditing) {
          const response = await this.$http.put(`/api/blog/entradas/${this.entradaId}`, dataToSend)
          console.log('✅ Entrada actualizada correctamente:', response.data)
        } else {
          const response = await this.$http.post('/api/blog/entradas', dataToSend)
          console.log('✅ Entrada creada correctamente')
          // Redirigir a editar la entrada creada
          this.$router.push(`/admin/blog/editor/${response.data.id}`)
          return
        }
        
        this.hasUnsavedChanges = false
        this.$router.push('/admin/blog')
      } catch (error) {
        console.error('❌ Error guardando entrada:', error)
        console.error('❌ Error response:', error.response?.data)
        console.error('❌ Error status:', error.response?.status)
        throw error;
      }
    },
    
    async processContentImages() {
      // Procesar imágenes base64 en el contenido y convertirlas a archivos
      const content = this.entradaForm.contenido
      const imgRegex = /<img[^>]+src="data:image\/[^;]+;base64,[^"]+"/g
      const matches = content.match(imgRegex)
      
      if (matches) {
        for (let match of matches) {
          const srcMatch = match.match(/src="data:image\/[^;]+;base64,([^"]+)"/)
          if (srcMatch) {
            const base64Data = srcMatch[1]
            const mimeType = match.match(/data:([^;]+);/)[1]
            
            // Convertir base64 a archivo
            const byteCharacters = atob(base64Data)
            const byteNumbers = new Array(byteCharacters.length)
            for (let i = 0; i < byteCharacters.length; i++) {
              byteNumbers[i] = byteCharacters.charCodeAt(i)
            }
            const byteArray = new Uint8Array(byteNumbers)
            const file = new File([byteArray], `image_${Date.now()}.${mimeType.split('/')[1]}`, { type: mimeType })
            
            // Subir la imagen
            try {
              const formData = new FormData()
              formData.append('file', file)
              
              const response = await this.$http.post('/api/blog/media/upload', formData, {
                headers: {
                  'Content-Type': 'multipart/form-data'
                }
              })
              
              // Reemplazar la imagen base64 con la URL del servidor
              const newImageUrl = this.buildImageUrl(response.data.url)
              this.entradaForm.contenido = this.entradaForm.contenido.replace(
                `data:${mimeType};base64,${base64Data}`,
                newImageUrl
              )
            } catch (error) {
              console.error('Error procesando imagen del contenido:', error)
            }
          }
        }
      }
    },
    
    // Métodos del editor
    execCommand(command, value = null) {
      if (!this.$refs.contentEditor) return
      
      this.$refs.contentEditor.focus()
      document.execCommand(command, false, value)
      this.updateContent()
    },
    
    updateContent() {
      // Limpiar botones de configuración antes de guardar el contenido
      this.cleanupTableEvents()
      
      this.entradaForm.contenido = this.$refs.contentEditor.innerHTML
      this.hasUnsavedChanges = true
      
      // Reconfigurar eventos de imagen, tabla y enlaces después de actualizar contenido
      this.$nextTick(() => {
        this.setupImageEvents()
        this.setupTableEvents()
        this.setupLinkEvents()
      })
    },
    
    async handlePaste(event) {
      event.preventDefault()
      
      console.log('Pegando contenido...')
      
      // Verificar si hay imágenes en el portapapeles
      const items = event.clipboardData.items
      let hasImage = false
      
      for (let i = 0; i < items.length; i++) {
        console.log('Item del portapapeles:', items[i].type)
        if (items[i].type.startsWith('image/')) {
          hasImage = true
          const file = items[i].getAsFile()
          console.log('Imagen encontrada en portapapeles:', file)
          if (file) {
            await this.uploadEditorImage(file)
            return
          }
        }
      }
      
      // Si no hay imágenes, insertar texto
      if (!hasImage) {
        const text = event.clipboardData.getData('text/plain')
        document.execCommand('insertText', false, text)
      }
    },
    
    handleKeydown(event) {
      // Ctrl+A para seleccionar todo
      if (event.ctrlKey && event.key === 'a') {
        event.preventDefault()
        document.execCommand('selectAll')
      }
      
      // Ctrl+B para negrita
      if (event.ctrlKey && event.key === 'b') {
        event.preventDefault()
        this.execCommand('bold')
      }
      
      // Ctrl+I para cursiva
      if (event.ctrlKey && event.key === 'i') {
        event.preventDefault()
        this.execCommand('italic')
      }
      
      // Ctrl+U para subrayado
      if (event.ctrlKey && event.key === 'u') {
        event.preventDefault()
        this.execCommand('underline')
      }
    },
    
    insertImage() {
      this.$refs.editorImageInput.click()
    },
    
    insertTable() {
      const rows = prompt('Número de filas:', '3')
      const cols = prompt('Número de columnas:', '3')
      
      if (rows && cols) {
        const tableHTML = this.generateTableHTML(parseInt(rows), parseInt(cols))
        this.execCommand('insertHTML', tableHTML)
        
        // Configurar eventos para la nueva tabla
        this.$nextTick(() => {
          this.setupTableEvents()
        })
      }
    },
    
    // Métodos de imagen
    selectImageFile() {
      this.$refs.fileInput.click()
    },
    
    handleFileSelect(event) {
      const file = event.target.files[0]
      console.log('Archivo seleccionado para imagen principal:', file)
      if (file) {
        this.uploadMainImage(file)
      }
    },
    
    handleEditorImageSelect(event) {
      const file = event.target.files[0]
      console.log('Archivo seleccionado para editor:', file)
      if (file) {
        this.uploadEditorImage(file)
      }
    },
    
    handleImageDrop(event) {
      const file = event.dataTransfer.files[0]
      if (file && file.type.startsWith('image/')) {
        this.uploadMainImage(file)
      }
    },
    
    async uploadMainImage(file) {
      try {
        console.log('Iniciando upload de imagen principal:', file.name, file.type, file.size)
        this.isUploadingImage = true
        const formData = new FormData()
        formData.append('file', file)
        
        console.log('Enviando request a /api/blog/media/upload')
        const response = await this.$http.post('/api/blog/media/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })
        
        console.log('Respuesta del servidor:', response.data)
        this.entradaForm.imagen_principal = response.data.url
        console.log('Imagen principal subida correctamente:', response.data.url)
      } catch (error) {
        console.error('Error subiendo imagen principal:', error)
        console.error('Detalles del error:', error.response?.data)
      } finally {
        this.isUploadingImage = false
      }
    },
    
    async uploadEditorImage(file) {
      try {
        console.log('Iniciando upload de imagen del editor:', file.name, file.type, file.size)
        this.isUploadingImage = true
        const formData = new FormData()
        formData.append('file', file)
        
        console.log('Enviando request a /api/blog/media/upload')
        const response = await this.$http.post('/api/blog/media/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })
        
        console.log('Respuesta del servidor:', response.data)
        
        // Insertar la imagen en el editor con configuración inicial
        const imageUrl = this.buildImageUrl(response.data.url)
        console.log('URL de imagen para insertar:', imageUrl)
        
        // Insertar imagen con configuración inicial
        const imgHTML = `<img src="${imageUrl}" alt="" style="max-width: 100%; height: auto; cursor: pointer;" class="editor-image" data-editable="true">`
        this.execCommand('insertHTML', imgHTML)
        
        // Configurar eventos para la nueva imagen
        this.$nextTick(() => {
          this.setupImageEvents()
        })
        
        console.log('Imagen del editor subida correctamente')
      } catch (error) {
        console.error('Error subiendo imagen del editor:', error)
        console.error('Detalles del error:', error.response?.data)
      } finally {
        this.isUploadingImage = false
      }
    },
    
    removeMainImage() {
      this.entradaForm.imagen_principal = ''
    },
    
    buildImageUrl(path) {
      if (!path) return '';
      
      // Si es una URL de Cloudinary, devolverla tal como está
      if (path.includes('cloudinary.com')) {
        return path;
      }
      
      // Si es una URL del frontend, corregirla al backend
      if (path.startsWith('https://onkosweb.onrender.com/uploads/')) {
        return path.replace('https://onkosweb.onrender.com/', 'https://webiacontrol-back.onrender.com/');
      }
      
      // Si es una URL del backend local, corregirla al backend de producción
      if (path.startsWith('http://onkosweb.com:8080/uploads/')) {
        return path.replace('http://onkosweb.com:8080/', 'https://webiacontrol-back.onrender.com/');
      }
      
      // Si es una URL del backend incorrecto, corregirla
      if (path.startsWith('https://onkos-backend.onrender.com/uploads/')) {
        return path.replace('https://onkos-backend.onrender.com/', 'https://webiacontrol-back.onrender.com/');
      }
      
      if (path.startsWith('http')) return path;
      
      // En producción, usar la URL del backend
      if (process.env.NODE_ENV === 'production') {
        const backendUrl = process.env.VUE_APP_API_URL || 'https://webiacontrol-back.onrender.com';
        if (path.startsWith('/uploads/')) {
          return `${backendUrl}${path}`;
        }
        return `${backendUrl}/uploads/${path}`;
      } else {
        // En desarrollo, usar el proxy de Vue CLI
        if (path.startsWith('/uploads/')) {
          return path; // El proxy manejará la redirección
        }
        return `/uploads/${path}`;
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

    // Métodos para el manejo del slug
    generateSlug(text) {
      return text
        .toLowerCase()
        .trim()
        .replace(/[áàäâ]/g, 'a')
        .replace(/[éèëê]/g, 'e')
        .replace(/[íìïî]/g, 'i')
        .replace(/[óòöô]/g, 'o')
        .replace(/[úùüû]/g, 'u')
        .replace(/[ñ]/g, 'n')
        .replace(/[ç]/g, 'c')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
    },

    onSlugInput(event) {
      // Marcar que el slug ha sido editado manualmente
      this.slugEditedManually = true
    },

    regenerateSlug() {
      if (this.entradaForm.titulo) {
        this.entradaForm.slug = this.generateSlug(this.entradaForm.titulo)
        this.slugEditedManually = false // Permitir que se siga regenerando automáticamente
      }
    },

    // Métodos para el manejo de enlaces
    insertLink() {
      const selection = window.getSelection()
      const selectedText = selection.toString().trim()
      
      // Guardar la selección actual
      this.linkSelection = selection.rangeCount > 0 ? selection.getRangeAt(0).cloneRange() : null
      
      // Inicializar el modal de enlaces
      this.selectedLink = {
        url: '',
        text: selectedText || '',
        target: '_self',
        title: ''
      }
      
      this.isEditingLink = false
      this.showLinkModal = true
    },

    editLink(linkElement) {
      // Extraer información del enlace existente
      this.selectedLink = {
        url: linkElement.href || '',
        text: linkElement.textContent || '',
        target: linkElement.target || '_self',
        title: linkElement.title || ''
      }
      
      // Guardar referencia al elemento para editar
      this.selectedLink.element = linkElement
      this.isEditingLink = true
      this.showLinkModal = true
    },

    applyLinkChanges() {
      if (!this.selectedLink.url.trim()) {
        alert('Por favor, ingresa una URL válida')
        return
      }

      if (!this.selectedLink.text.trim()) {
        alert('Por favor, ingresa un texto para el enlace')
        return
      }

      const editor = this.$refs.contentEditor
      if (!editor) return

      // Crear el elemento de enlace
      const linkElement = document.createElement('a')
      linkElement.href = this.selectedLink.url
      linkElement.textContent = this.selectedLink.text
      linkElement.target = this.selectedLink.target
      
      if (this.selectedLink.title) {
        linkElement.title = this.selectedLink.title
      }

      if (this.isEditingLink && this.selectedLink.element) {
        // Reemplazar enlace existente
        this.selectedLink.element.href = this.selectedLink.url
        this.selectedLink.element.textContent = this.selectedLink.text
        this.selectedLink.element.target = this.selectedLink.target
        this.selectedLink.element.title = this.selectedLink.title
      } else {
        // Insertar nuevo enlace
        if (this.linkSelection) {
          // Usar la selección guardada
          this.linkSelection.deleteContents()
          this.linkSelection.insertNode(linkElement)
        } else {
          // Insertar al final del contenido seleccionado o al final del editor
          const selection = window.getSelection()
          if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0)
            range.deleteContents()
            range.insertNode(linkElement)
          } else {
            // Insertar al final del editor
            editor.appendChild(linkElement)
          }
        }
      }

      // Limpiar y cerrar modal
      this.closeLinkModal()
      
      // Actualizar contenido
      this.updateContent()
      
      // Restaurar foco al editor
      editor.focus()
    },

    closeLinkModal() {
      this.showLinkModal = false
      this.selectedLink = {
        url: '',
        text: '',
        target: '_self',
        title: ''
      }
      this.isEditingLink = false
      this.linkSelection = null
    },

    // Método para detectar clics en enlaces existentes
    setupLinkEvents() {
      const editor = this.$refs.contentEditor
      if (!editor) return

      // Limpiar eventos existentes
      this.cleanupLinkEvents()

      // Configurar eventos para enlaces existentes
      const links = editor.querySelectorAll('a')
      links.forEach(link => {
        link.addEventListener('dblclick', this.handleLinkDoubleClick)
        link.style.cursor = 'pointer'
      })
    },

    cleanupLinkEvents() {
      const editor = this.$refs.contentEditor
      if (!editor) return

      const links = editor.querySelectorAll('a')
      links.forEach(link => {
        link.removeEventListener('dblclick', this.handleLinkDoubleClick)
      })
    },

    handleLinkDoubleClick(e) {
      e.preventDefault()
      e.stopPropagation()
      this.editLink(e.target)
    },

    // Métodos para configuración de imágenes
    setupImageEvents() {
      const editor = this.$refs.contentEditor
      if (!editor) return

      // Limpiar eventos existentes primero
      this.cleanupImageEvents()

      // Configurar eventos para imágenes existentes
      const images = editor.querySelectorAll('img')
      images.forEach(img => {
        // Agregar clase editor-image si no la tiene
        if (!img.classList.contains('editor-image')) {
          img.classList.add('editor-image')
        }
        
        // Configurar nuevo evento
        img.addEventListener('click', this.handleImageClick)
        img.setAttribute('data-editable', 'true')
        img.style.cursor = 'pointer'
      })
    },

    cleanupImageEvents() {
      const editor = this.$refs.contentEditor
      if (!editor) return

      const images = editor.querySelectorAll('img')
      images.forEach(img => {
        img.removeEventListener('click', this.handleImageClick)
      })
    },

    handleImageClick(e) {
      e.preventDefault()
      e.stopPropagation()
      this.selectImage(e.target)
    },

    selectImage(imgElement) {
      this.selectedImage.element = imgElement
      this.selectedImage.src = imgElement.src
      this.selectedImage.alt = imgElement.alt || ''
      this.selectedImage.width = imgElement.width || 300
      this.selectedImage.height = imgElement.height || 200
      this.selectedImage.originalWidth = imgElement.naturalWidth || 300
      this.selectedImage.originalHeight = imgElement.naturalHeight || 200
      
      // Determinar alineación actual
      const style = window.getComputedStyle(imgElement)
      if (style.textAlign === 'center' || imgElement.style.textAlign === 'center') {
        this.selectedImage.alignment = 'center'
      } else if (style.float === 'right' || imgElement.style.float === 'right') {
        this.selectedImage.alignment = 'right'
      } else {
        this.selectedImage.alignment = 'left'
      }
      
      this.showImageModal = true
    },

    updateImageSize() {
      if (this.maintainAspectRatio && this.selectedImage.originalWidth && this.selectedImage.originalHeight) {
        const ratio = this.selectedImage.originalWidth / this.selectedImage.originalHeight
        
        // Si se cambió el ancho, ajustar el alto
        if (this.selectedImage.width !== this.selectedImage.element?.width) {
          this.selectedImage.height = Math.round(this.selectedImage.width / ratio)
        }
        // Si se cambió el alto, ajustar el ancho
        else if (this.selectedImage.height !== this.selectedImage.element?.height) {
          this.selectedImage.width = Math.round(this.selectedImage.height * ratio)
        }
      }
    },

    updateImageAlignment() {
      // La alineación se aplicará cuando se haga clic en "Aplicar"
    },

    updateImageAlt() {
      // El alt se aplicará cuando se haga clic en "Aplicar"
    },

    applyImageChanges() {
      if (!this.selectedImage.element) return

      const img = this.selectedImage.element
      
      // Aplicar dimensiones
      img.width = this.selectedImage.width
      img.height = this.selectedImage.height
      
      // Aplicar alt
      img.alt = this.selectedImage.alt
      
      // Aplicar alineación
      img.style.float = ''
      img.style.margin = ''
      img.style.display = ''
      
      switch (this.selectedImage.alignment) {
        case 'left':
          img.style.float = 'left'
          img.style.margin = '0 10px 10px 0'
          break
        case 'center':
          img.style.display = 'block'
          img.style.margin = '10px auto'
          break
        case 'right':
          img.style.float = 'right'
          img.style.margin = '0 0 10px 10px'
          break
      }
      
      this.updateContent()
      this.closeImageModal()
      
      // Reconfigurar eventos después de aplicar cambios
      this.$nextTick(() => {
        this.setupImageEvents()
      })
    },

    deleteSelectedImage() {
      if (!this.selectedImage.element) return
      
      if (confirm('¿Estás seguro de que quieres eliminar esta imagen?')) {
        this.selectedImage.element.remove()
        this.updateContent()
        this.closeImageModal()
        
        // Reconfigurar eventos después de eliminar imagen
        this.$nextTick(() => {
          this.setupImageEvents()
        })
      }
    },

    closeImageModal() {
      this.showImageModal = false
      this.selectedImage = {
        element: null,
        src: '',
        alt: '',
        width: 300,
        height: 200,
        alignment: 'center',
        originalWidth: 0,
        originalHeight: 0
      }
    },

    // Métodos para configuración de tablas
    setupTableEvents() {
      const editor = this.$refs.contentEditor
      if (!editor) return

      // Limpiar eventos existentes primero
      this.cleanupTableEvents()

      // Configurar eventos SOLO para tablas (no imágenes)
      const tables = editor.querySelectorAll('table')
      tables.forEach(table => {
        // Agregar clase editor-table si no la tiene
        if (!table.classList.contains('editor-table')) {
          table.classList.add('editor-table')
        }
        
        // Marcar como configurada
        table.setAttribute('data-events-configured', 'true')
        
        // Crear o actualizar el botón de configuración SOLO para tablas
        this.addTableConfigButton(table)
      })
    },

    addTableConfigButton(table) {
      // Verificar que realmente sea una tabla
      if (table.tagName !== 'TABLE') {
        return
      }

      // Remover botón existente si lo hay
      const existingButton = table.querySelector('.table-config-btn')
      if (existingButton) {
        existingButton.remove()
      }

      // Crear el botón de configuración
      const configButton = document.createElement('button')
      configButton.className = 'table-config-btn'
      configButton.innerHTML = '<i class="fas fa-cog"></i>'
      configButton.title = 'Configurar tabla'
      
      // Agregar evento al botón usando bind para mantener el contexto
      const clickHandler = (e) => {
        e.preventDefault()
        e.stopPropagation()
        this.selectTable(table)
      }
      
      configButton.addEventListener('click', clickHandler)
      
      // Guardar referencia al handler para poder removerlo después
      configButton._clickHandler = clickHandler

      // Agregar el botón a la tabla
      table.appendChild(configButton)
    },

    cleanupTableEvents() {
      const editor = this.$refs.contentEditor
      if (!editor) return

      // Limpiar botones de configuración SOLO de tablas
      const tables = editor.querySelectorAll('table')
      tables.forEach(table => {
        const configButton = table.querySelector('.table-config-btn')
        if (configButton) {
          // Remover event listener si existe
          if (configButton._clickHandler) {
            configButton.removeEventListener('click', configButton._clickHandler)
          }
          configButton.remove()
        }
      })
      
      // También limpiar cualquier botón de tabla que pueda estar suelto
      const looseTableButtons = editor.querySelectorAll('.table-config-btn')
      looseTableButtons.forEach(button => {
        if (button._clickHandler) {
          button.removeEventListener('click', button._clickHandler)
        }
        button.remove()
      })
    },

    selectTable(tableElement) {
      this.selectedTable.element = tableElement
      
      // Extraer propiedades de la tabla existente
      const rows = tableElement.querySelectorAll('tr').length
      const columns = tableElement.querySelector('tr') ? tableElement.querySelector('tr').children.length : 3
      
      this.selectedTable.rows = rows
      this.selectedTable.columns = columns
      
      // Extraer estilos
      const style = window.getComputedStyle(tableElement)
      this.selectedTable.width = tableElement.style.width || '100%'
      this.selectedTable.borderStyle = style.borderStyle || 'solid'
      this.selectedTable.borderColor = style.borderColor || '#d1d5db'
      
      // Verificar si tiene encabezado (primera fila con th)
      const hasHeader = tableElement.querySelector('th') !== null
      this.selectedTable.hasHeader = hasHeader
      
      // Extraer texto de encabezados
      if (hasHeader) {
        const headerCells = tableElement.querySelectorAll('th')
        this.selectedTable.headerTexts = Array.from(headerCells).map(cell => 
          cell.textContent.trim() || `Encabezado ${this.selectedTable.headerTexts.length + 1}`
        )
        
        // Asegurar que tenemos el número correcto de textos de encabezado
        while (this.selectedTable.headerTexts.length < columns) {
          this.selectedTable.headerTexts.push(`Encabezado ${this.selectedTable.headerTexts.length + 1}`)
        }
        
        // Colores del encabezado
        const headerCell = headerCells[0]
        if (headerCell) {
          const headerStyle = window.getComputedStyle(headerCell)
          this.selectedTable.headerBgColor = headerStyle.backgroundColor || '#f9fafb'
          this.selectedTable.headerTextColor = headerStyle.color || '#374151'
        }
      } else {
        // Si no tiene encabezado, inicializar con valores por defecto
        this.selectedTable.headerTexts = Array.from({ length: columns }, (_, i) => `Encabezado ${i + 1}`)
      }
      
      // Guardar el contenido existente para preservarlo
      this.selectedTable.existingContent = this.extractTableContent(tableElement)
      
      this.updateTablePreview()
      this.showTableModal = true
    },

    generateTableHTML(rows, columns, options = {}) {
      const {
        width = '100%',
        borderStyle = 'solid',
        borderColor = '#d1d5db',
        headerBgColor = '#f9fafb',
        headerTextColor = '#374151',
        hasHeader = true,
        headerTexts = []
      } = options

      let table = `<table class="editor-table" style="border-collapse: collapse; width: ${width}; border: 1px ${borderStyle} ${borderColor}; position: relative;">`
      
      for (let i = 0; i < rows; i++) {
        table += '<tr>'
        for (let j = 0; j < columns; j++) {
          if (i === 0 && hasHeader) {
            const headerText = headerTexts[j] || `Encabezado ${j + 1}`
            table += `<th style="padding: 8px; border: 1px ${borderStyle} ${borderColor}; background-color: ${headerBgColor}; color: ${headerTextColor}; font-weight: bold;">${headerText}</th>`
          } else {
            table += `<td style="padding: 8px; border: 1px ${borderStyle} ${borderColor};">&nbsp;</td>`
          }
        }
        table += '</tr>'
      }
      table += '</table>'
      
      return table
    },

    updateColumnsAndHeaders() {
      // Ajustar el array de textos de encabezado según el número de columnas
      const currentHeaders = this.selectedTable.headerTexts.length
      const newColumns = this.selectedTable.columns
      
      if (newColumns > currentHeaders) {
        // Agregar más textos de encabezado
        for (let i = currentHeaders; i < newColumns; i++) {
          this.selectedTable.headerTexts.push(`Encabezado ${i + 1}`)
        }
      } else if (newColumns < currentHeaders) {
        // Remover textos de encabezado extra
        this.selectedTable.headerTexts = this.selectedTable.headerTexts.slice(0, newColumns)
      }
      
      this.updateTablePreview()
    },

    updateTablePreview() {
      this.tablePreviewHTML = this.generateTableHTMLWithContent(
        this.selectedTable.rows,
        this.selectedTable.columns,
        this.selectedTable.existingContent || [],
        {
          width: this.selectedTable.width,
          borderStyle: this.selectedTable.borderStyle,
          borderColor: this.selectedTable.borderColor,
          headerBgColor: this.selectedTable.headerBgColor,
          headerTextColor: this.selectedTable.headerTextColor,
          hasHeader: this.selectedTable.hasHeader,
          headerTexts: this.selectedTable.headerTexts
        }
      )
    },

    applyTableChanges() {
      if (!this.selectedTable.element) return

      // Preservar el contenido existente de la tabla
      const existingTable = this.selectedTable.element
      const existingContent = this.extractTableContent(existingTable)

      // Generar nueva tabla con el contenido preservado
      const newTableHTML = this.generateTableHTMLWithContent(
        this.selectedTable.rows,
        this.selectedTable.columns,
        existingContent,
        {
          width: this.selectedTable.width,
          borderStyle: this.selectedTable.borderStyle,
          borderColor: this.selectedTable.borderColor,
          headerBgColor: this.selectedTable.headerBgColor,
          headerTextColor: this.selectedTable.headerTextColor,
          hasHeader: this.selectedTable.hasHeader,
          headerTexts: this.selectedTable.headerTexts
        }
      )

      // Reemplazar la tabla existente
      this.selectedTable.element.outerHTML = newTableHTML
      
      // Reconfigurar eventos para la nueva tabla
      this.$nextTick(() => {
        this.setupTableEvents()
      })
      
      this.updateContent()
      this.closeTableModal()
    },

    extractTableContent(table) {
      const content = []
      const rows = table.querySelectorAll('tr')
      
      rows.forEach((row, rowIndex) => {
        const rowContent = []
        const cells = row.querySelectorAll('th, td')
        
        cells.forEach((cell, cellIndex) => {
          rowContent.push({
            content: cell.innerHTML,
            isHeader: cell.tagName === 'TH'
          })
        })
        
        content.push(rowContent)
      })
      
      return content
    },

    generateTableHTMLWithContent(rows, columns, existingContent, options = {}) {
      const {
        width = '100%',
        borderStyle = 'solid',
        borderColor = '#d1d5db',
        headerBgColor = '#f9fafb',
        headerTextColor = '#374151',
        hasHeader = true,
        headerTexts = []
      } = options

      let table = `<table class="editor-table" style="border-collapse: collapse; width: ${width}; border: 1px ${borderStyle} ${borderColor}; position: relative;">`
      
      for (let i = 0; i < rows; i++) {
        table += '<tr>'
        for (let j = 0; j < columns; j++) {
          // Obtener contenido existente si está disponible
          let cellContent = '&nbsp;'
          let isHeader = false
          
          if (existingContent[i] && existingContent[i][j]) {
            cellContent = existingContent[i][j].content || '&nbsp;'
            isHeader = existingContent[i][j].isHeader
          }
          
          if (i === 0 && hasHeader) {
            const headerText = headerTexts[j] || `Encabezado ${j + 1}`
            table += `<th style="padding: 8px; border: 1px ${borderStyle} ${borderColor}; background-color: ${headerBgColor}; color: ${headerTextColor}; font-weight: bold;">${headerText}</th>`
          } else {
            table += `<td style="padding: 8px; border: 1px ${borderStyle} ${borderColor};">${cellContent}</td>`
          }
        }
        table += '</tr>'
      }
      table += '</table>'
      
      return table
    },

    deleteSelectedTable() {
      if (!this.selectedTable.element) return
      
      if (confirm('¿Estás seguro de que quieres eliminar esta tabla?')) {
        this.selectedTable.element.remove()
        this.updateContent()
        this.closeTableModal()
        
        // Reconfigurar eventos después de eliminar tabla
        this.$nextTick(() => {
          this.setupTableEvents()
        })
      }
    },

    closeTableModal() {
      this.showTableModal = false
      this.selectedTable = {
        element: null,
        rows: 3,
        columns: 3,
        width: '100%',
        borderStyle: 'solid',
        borderColor: '#d1d5db',
        headerBgColor: '#f9fafb',
        headerTextColor: '#374151',
        hasHeader: true,
        headerTexts: ['Encabezado 1', 'Encabezado 2', 'Encabezado 3'],
        existingContent: []
      }
      this.tablePreviewHTML = ''
    },
    
    // Métodos para formato de texto
    setFontSize(event) {
      const size = event.target.value
      if (size) {
        this.execCommand('fontSize', size)
      }
    },
    
    setFontFamily(event) {
      const family = event.target.value
      if (family) {
        this.execCommand('fontName', family)
      }
    },
    
    setTextColor(event) {
      const color = event.target.value
      if (color) {
        this.execCommand('foreColor', color)
      }
    },
    
    setBackgroundColor(event) {
      const color = event.target.value
      if (color) {
        this.execCommand('hiliteColor', color)
      }
    }
  }
}
</script>

<style scoped lang="scss">
@import "@/assets/styles/variables.scss";

.blog-editor {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f8fafc;
}

.editor-header {
  background: white;
  border-bottom: 1px solid #e2e8f0;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  
  .header-left {
    display: flex;
    align-items: center;
    gap: 1rem;
    
    .home-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      border: 1px solid $primary-color;
      border-radius: 0.375rem;
      background: white;
      color: $primary-color;
      text-decoration: none;
      font-weight: 500;
      transition: all 0.2s;
      
      &:hover {
        background: $primary-color;
        color: white;
        transform: translateY(-1px);
      }
      
      i {
        font-size: 1rem;
      }
    }
    
    .back-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      border: 1px solid #d1d5db;
      border-radius: 0.375rem;
      background: white;
      color: #374151;
      cursor: pointer;
      transition: all 0.2s;
      
      &:hover {
        background: #f9fafb;
        border-color: #9ca3af;
      }
    }
    
    h1 {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 600;
      color: #1f2937;
    }
  }
  
  .header-right {
    display: flex;
    gap: 1rem;
    
    .btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 0.375rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      
      &.btn-secondary {
        background: #f3f4f6;
        color: #374151;
        
        &:hover {
          background: #e5e7eb;
        }
      }
      
      &.btn-primary {
        background: $primary-color;
        color: white;
        
        &:hover {
          background: darken($primary-color, 10%);
        }
      }
    }
  }
}

.editor-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.editor-sidebar {
  width: 350px;
  background: white;
  border-right: 1px solid #e2e8f0;
  overflow-y: auto;
  padding: 1.5rem;
  
  .sidebar-section {
    margin-bottom: 2rem;
    
    h3 {
      margin: 0 0 1rem 0;
      font-size: 1rem;
      font-weight: 600;
      color: #1f2937;
      border-bottom: 1px solid #e5e7eb;
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
      font-size: 0.875rem;
    }
    
    .form-control {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #d1d5db;
      border-radius: 0.375rem;
      font-size: 0.875rem;
      transition: border-color 0.2s;
      
      &:focus {
        outline: none;
        border-color: $primary-color;
        box-shadow: 0 0 0 3px rgba($primary-color, 0.1);
      }
      
      &[type="text"], &[type="email"] {
        height: 2.5rem;
      }
    }
    
    .radio-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      
      .radio-option {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        cursor: pointer;
        
        input[type="radio"] {
          margin: 0;
        }
        
        .radio-label {
          font-size: 0.875rem;
          color: #374151;
        }
      }
    }
  }
  
  .image-upload-area {
    border: 2px dashed #d1d5db;
    border-radius: 0.5rem;
    padding: 2rem;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s;
    
    &:hover {
      border-color: $primary-color;
      background: #f8fafc;
    }
    
    .upload-placeholder,
    .upload-loading {
      color: #6b7280;
      
      i {
        font-size: 2rem;
        margin-bottom: 0.5rem;
        display: block;
      }
      
      p {
        margin: 0;
        font-size: 0.875rem;
      }
    }
    
    .upload-loading {
      color: $primary-color;
      
      i {
        color: $primary-color;
      }
    }
    
    .image-preview {
      position: relative;
      
      img {
        width: 100%;
        height: 150px;
        object-fit: cover;
        border-radius: 0.375rem;
        background: transparent;
        image-rendering: -webkit-optimize-contrast;
        image-rendering: crisp-edges;
        -webkit-backface-visibility: hidden;
        backface-visibility: hidden;
        transform: translateZ(0);
      }
      
      /* Regla específica para imágenes PNG en el preview principal */
      img[src*=".png"], img[src*=".PNG"] {
        background: transparent;
        border-radius: 0;
        box-shadow: none;
      }
      
      .remove-image {
        position: absolute;
        top: 0.5rem;
        right: 0.5rem;
        background: rgba(0, 0, 0, 0.7);
        color: white;
        border: none;
        border-radius: 50%;
        width: 2rem;
        height: 2rem;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        
        &:hover {
          background: rgba(0, 0, 0, 0.9);
        }
      }
    }
  }
}

.editor-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: white;
}

.editor-toolbar {
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  padding: 0.75rem 1rem;
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  
  .toolbar-group {
    display: flex;
    gap: 0.25rem;
    padding: 0.25rem;
    background: white;
    border-radius: 0.375rem;
    border: 1px solid #e2e8f0;
    
    .toolbar-btn {
      width: 2rem;
      height: 2rem;
      border: none;
      background: transparent;
      border-radius: 0.25rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #6b7280;
      transition: all 0.2s;
      
      &:hover {
        background: #f3f4f6;
        color: #374151;
      }
      
      &:active {
        background: #e5e7eb;
      }
    }
    
    .font-size-select,
    .font-family-select {
      height: 2rem;
      padding: 0 0.5rem;
      border: 1px solid #d1d5db;
      border-radius: 0.25rem;
      background: white;
      font-size: 0.75rem;
      color: #374151;
      cursor: pointer;
      
      &:focus {
        outline: none;
        border-color: $primary-color;
      }
    }
    
    .color-picker-container {
      position: relative;
      display: flex;
      align-items: center;
      
      .color-picker {
        width: 2rem;
        height: 2rem;
        border: 1px solid #d1d5db;
        border-radius: 0.25rem;
        cursor: pointer;
        background: transparent;
        
        &::-webkit-color-swatch-wrapper {
          padding: 0;
        }
        
        &::-webkit-color-swatch {
          border: none;
          border-radius: 0.25rem;
        }
      }
      
      i {
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        font-size: 0.75rem;
        color: #6b7280;
        pointer-events: none;
      }
    }
  }
}

.content-editor {
  flex: 1;
  padding: 2rem;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 1rem;
  line-height: 1.6;
  outline: none;
  overflow-y: auto;
  
  &:empty:before {
    content: attr(placeholder);
    color: #9ca3af;
    pointer-events: none;
  }
  
  h1, h2, h3, h4, h5, h6 {
    margin: 1.5rem 0 1rem 0;
    color: #1f2937;
    font-weight: 600;
  }
  
  h1 { font-size: 2rem; }
  h2 { font-size: 1.75rem; }
  h3 { font-size: 1.5rem; }
  h4 { font-size: 1.25rem; }
  h5 { font-size: 1.125rem; }
  h6 { font-size: 1rem; }
  
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
      padding: 0.75rem;
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
    border-radius: 0.375rem;
    margin: 1rem 0;
  }
  
  a {
    color: $primary-color;
    text-decoration: none;
    
    &:hover {
      text-decoration: underline;
    }
  }
}

// Responsive
@media (max-width: 1024px) {
  .editor-content {
    flex-direction: column;
  }
  
  .editor-sidebar {
    width: 100%;
    max-height: 300px;
  }
}

@media (max-width: 768px) {
  .editor-header {
    padding: 1rem;
    flex-direction: column;
    gap: 1rem;
    
    .header-left, .header-right {
      width: 100%;
      justify-content: space-between;
    }
  }
  
  .editor-sidebar {
    padding: 1rem;
  }
  
  .content-editor {
    padding: 1rem;
  }
}

/* Estilos para imágenes editables en el editor */
.editor-image {
  transition: all 0.2s ease;
  background: transparent;
  image-rendering: -webkit-optimize-contrast;
  image-rendering: crisp-edges;
  -webkit-backface-visibility: hidden;
  backface-visibility: hidden;
  transform: translateZ(0);
  
  &:hover {
    outline: 2px solid #3b82f6;
    outline-offset: 2px;
  }
}

/* Regla específica para imágenes PNG con transparencia en el editor */
.editor-image[src*=".png"], .editor-image[src*=".PNG"] {
  background: transparent;
  border-radius: 0;
  box-shadow: none;
}

/* Estilos para tablas editables en el editor */
.editor-table {
  transition: all 0.2s ease;
  position: relative;
  
  &:hover {
    outline: 2px solid #3b82f6;
    outline-offset: 2px;
    
    .table-config-btn {
      opacity: 1;
      visibility: visible;
    }
  }
}

/* Botón de configuración de tabla - Solo visible en el editor */
.blog-editor .table-config-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 32px;
  height: 32px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  opacity: 0;
  visibility: hidden;
  transition: all 0.2s ease;
  z-index: 10;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  
  &:hover {
    background: #2563eb;
    transform: scale(1.1);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  }
  
  &:active {
    transform: scale(0.95);
  }
  
  i {
    font-size: 12px;
  }
}

/* Modal de configuración de imagen */
.image-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.image-modal {
  background: white;
  border-radius: 8px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  h3 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: #1f2937;
  }
  
  .close-btn {
    background: none;
    border: none;
    font-size: 1.5rem;
    color: #6b7280;
    cursor: pointer;
    padding: 0.25rem;
    border-radius: 4px;
    transition: all 0.2s;
    
    &:hover {
      background: #f3f4f6;
      color: #374151;
    }
  }
}

.modal-content {
  padding: 1.5rem;
  display: flex;
  gap: 2rem;
  flex: 1;
  overflow: hidden;
}

.image-preview {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f9fafb;
  border-radius: 6px;
  padding: 1rem;
  
  .preview-img {
    max-width: 100%;
    max-height: 300px;
    object-fit: contain;
    border-radius: 4px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    background: transparent;
    image-rendering: -webkit-optimize-contrast;
    image-rendering: crisp-edges;
    -webkit-backface-visibility: hidden;
    backface-visibility: hidden;
    transform: translateZ(0);
  }
  
  /* Regla específica para imágenes PNG en el preview */
  .preview-img[src*=".png"], .preview-img[src*=".PNG"] {
    background: transparent;
    border-radius: 0;
    box-shadow: none;
  }
}

.image-controls {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  
  label {
    font-weight: 500;
    color: #374151;
    font-size: 0.875rem;
  }
  
  input[type="number"], input[type="text"], select {
    padding: 0.5rem;
    border: 1px solid #d1d5db;
    border-radius: 4px;
    font-size: 0.875rem;
    
    &:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }
  }
  
  input[type="checkbox"] {
    width: 1rem;
    height: 1rem;
    margin-right: 0.5rem;
  }
  
  span {
    font-size: 0.875rem;
    color: #6b7280;
  }
}

.modal-footer {
  padding: 1.5rem;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  
  .btn {
    padding: 0.5rem 1rem;
    border-radius: 4px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    border: none;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    
    &.btn-primary {
      background: #3b82f6;
      color: white;
      
      &:hover {
        background: #2563eb;
      }
    }
    
    &.btn-secondary {
      background: #6b7280;
      color: white;
      
      &:hover {
        background: #4b5563;
      }
    }
    
    &.btn-danger {
      background: #ef4444;
      color: white;
      
      &:hover {
        background: #dc2626;
      }
    }
  }
}

/* Responsive para modal */
@media (max-width: 768px) {
  .modal-content {
    flex-direction: column;
    gap: 1rem;
  }
  
  .image-preview {
    min-height: 200px;
  }
  
  .modal-footer {
    flex-direction: column;
    
    .btn {
      width: 100%;
      justify-content: center;
    }
  }
}

/* Modal de configuración de tabla */
.table-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.table-modal {
  background: white;
  border-radius: 8px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  width: 95%;
  max-width: 800px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.table-preview {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f9fafb;
  border-radius: 6px;
  padding: 1rem;
  margin-bottom: 1rem;
  
  .table-preview-container {
    max-width: 100%;
    overflow-x: auto;
    
    table {
      margin: 0;
      font-size: 0.875rem;
    }
  }
}

.table-controls {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  max-height: 300px;
  overflow-y: auto;
}

.header-text-controls {
  grid-column: 1 / -1;
  border-top: 1px solid #e5e7eb;
  padding-top: 1rem;
  margin-top: 1rem;
  
  label {
    display: block;
    font-weight: 600;
    margin-bottom: 0.5rem;
    color: #374151;
  }
}

.header-inputs {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 0.5rem;
}

.header-input-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  
  label {
    font-size: 0.875rem;
    font-weight: 500;
    color: #6b7280;
  }
  
  input {
    padding: 0.5rem;
    border: 1px solid #d1d5db;
    border-radius: 4px;
    font-size: 0.875rem;
    
    &:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }
  }
}

// Estilos para input-group del slug
.input-group {
  display: flex;
  
  .form-control {
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
    border-right: none;
  }
  
  .btn {
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
    border-left: 1px solid #d1d5db;
    padding: 0.5rem 0.75rem;
    
    &:hover {
      background-color: #f3f4f6;
      border-color: #d1d5db;
    }
  }
}

/* Responsive para modal de tabla */
@media (max-width: 768px) {
  .table-modal {
    width: 95%;
    max-height: 95vh;
  }
  
  .table-controls {
    grid-template-columns: 1fr;
    max-height: 250px;
  }
  
  .table-preview {
    min-height: 150px;
  }
}

/* Modal de enlaces */
.link-modal-overlay {
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

.link-modal {
  background: white;
  border-radius: 8px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  width: 500px;
  max-width: 90vw;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.link-controls {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.5rem;
}

/* Estilos para selector múltiple de categorías */
.category-multi-select {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.categories-info {
  margin-bottom: 1rem;
  padding: 1rem;
  background: #f0f9ff;
  border: 1px solid #0ea5e9;
  border-radius: 8px;
}

.categories-info h4 {
  margin: 0 0 0.5rem 0;
  color: #0369a1;
  font-size: 0.875rem;
  font-weight: 600;
}

.assigned-categories {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.assigned-category-tag {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  color: white;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 500;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.selected-categories {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  min-height: 40px;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: #f9fafb;
}

.category-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.75rem;
  background: #3b82f6;
  color: white;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 500;
}

.remove-category {
  background: none;
  border: none;
  color: white;
  font-size: 1.25rem;
  font-weight: bold;
  cursor: pointer;
  padding: 0;
  margin-left: 0.25rem;
  line-height: 1;
}

.remove-category:hover {
  opacity: 0.8;
}

/* Responsive para modal de enlaces */
@media (max-width: 768px) {
  .link-modal {
    width: 95%;
    max-height: 95vh;
  }
  
  .link-controls {
    padding: 1rem;
  }
}
</style> 