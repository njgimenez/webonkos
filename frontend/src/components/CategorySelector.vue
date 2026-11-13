<template>
  <div class="category-selector">
    <!-- Categoría Principal -->
    <div class="form-group">
      <label for="categoria-principal">Categoría Principal *</label>
      <select 
        id="categoria-principal"
        v-model="selectedMainCategory" 
        @change="onMainCategoryChange"
        class="form-control"
        :disabled="loading"
      >
        <option value="">Seleccionar categoría principal</option>
        <option 
          v-for="category in mainCategories" 
          :key="category.id" 
          :value="category.id"
        >
          {{ category.nombre }}
        </option>
      </select>
      <small v-if="selectedMainCategory" class="form-text text-muted">
        {{ getMainCategoryDescription(selectedMainCategory) }}
      </small>
    </div>

    <!-- Subcategoría (Nivel 1) -->
    <div v-if="showSubcategory" class="form-group">
      <label for="subcategoria">Subcategoría</label>
      <select 
        id="subcategoria"
        v-model="selectedSubcategory" 
        @change="onSubcategoryChange"
        class="form-control"
        :disabled="loading || !selectedMainCategory"
      >
        <option value="">Seleccionar subcategoría</option>
        <option 
          v-for="subcategory in subcategories" 
          :key="subcategory.id" 
          :value="subcategory.id"
        >
          {{ subcategory.nombre }}
        </option>
      </select>
      <small v-if="selectedSubcategory" class="form-text text-muted">
        {{ getSubcategoryDescription(selectedSubcategory) }}
      </small>
    </div>

    <!-- Subcategoría Específica (Nivel 2) -->
    <div v-if="showSpecificSubcategory" class="form-group">
      <label for="subcategoria-especifica">Categoría Específica</label>
      <select 
        id="subcategoria-especifica"
        v-model="selectedSpecificSubcategory" 
        @change="onSpecificSubcategoryChange"
        class="form-control"
        :disabled="loading || !selectedSubcategory"
      >
        <option value="">Seleccionar categoría específica</option>
        <option 
          v-for="specificSubcategory in specificSubcategories" 
          :key="specificSubcategory.id" 
          :value="specificSubcategory.id"
        >
          {{ specificSubcategory.nombre }}
        </option>
      </select>
      <small v-if="selectedSpecificSubcategory" class="form-text text-muted">
        {{ getSpecificSubcategoryDescription(selectedSpecificSubcategory) }}
      </small>
    </div>

    <!-- Resumen de selección -->
    <div v-if="selectedCategoryPath" class="selection-summary">
      <h4>Selección actual:</h4>
      <div class="category-path">
        <span 
          v-for="(category, index) in selectedCategoryPath" 
          :key="category.id"
          class="category-breadcrumb"
        >
          <span class="category-name">{{ category.nombre }}</span>
          <i v-if="index < selectedCategoryPath.length - 1" class="fas fa-chevron-right"></i>
        </span>
      </div>
      <p class="category-description">{{ getFinalCategoryDescription() }}</p>
    </div>

    <!-- Loading indicator -->
    <div v-if="loading" class="loading-indicator">
      <i class="fas fa-spinner fa-spin"></i>
      <span>Cargando categorías...</span>
    </div>
  </div>
</template>

<script>
export default {
  name: 'CategorySelector',
  props: {
    value: {
      type: [String, Number],
      default: null
    },
    disabled: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      loading: false,
      mainCategories: [],
      subcategories: [],
      specificSubcategories: [],
      selectedMainCategory: null,
      selectedSubcategory: null,
      selectedSpecificSubcategory: null,
      selectedCategoryPath: []
    }
  },
  computed: {
    showSubcategory() {
      return this.selectedMainCategory && this.subcategories.length > 0
    },
    showSpecificSubcategory() {
      return this.selectedSubcategory && this.specificSubcategories.length > 0
    }
  },
  watch: {
    value: {
      handler(newValue) {
        if (newValue && newValue !== this.getSelectedCategoryId()) {
          this.loadCategoryHierarchy(newValue)
        }
      },
      immediate: true
    }
  },
  async mounted() {
    await this.loadMainCategories()
    
    // Si hay un valor inicial, cargar la jerarquía
    if (this.value) {
      await this.loadCategoryHierarchy(this.value)
    }
  },
  methods: {
    async loadMainCategories() {
      try {
        this.loading = true
        const response = await this.$http.get('/api/blog/categorias/principales')
        this.mainCategories = response.data
      } catch (error) {
        console.error('Error cargando categorías principales:', error)
        this.$emit('error', 'Error cargando categorías principales')
      } finally {
        this.loading = false
      }
    },

    async loadSubcategories(parentId) {
      try {
        this.loading = true
        const response = await this.$http.get(`/api/blog/categorias/${parentId}/subcategorias`)
        this.subcategories = response.data
      } catch (error) {
        console.error('Error cargando subcategorías:', error)
        this.$emit('error', 'Error cargando subcategorías')
        this.subcategories = []
      } finally {
        this.loading = false
      }
    },

    async loadSpecificSubcategories(parentId) {
      try {
        this.loading = true
        const response = await this.$http.get(`/api/blog/categorias/${parentId}/subcategorias`)
        this.specificSubcategories = response.data
      } catch (error) {
        console.error('Error cargando subcategorías específicas:', error)
        this.$emit('error', 'Error cargando subcategorías específicas')
        this.specificSubcategories = []
      } finally {
        this.loading = false
      }
    },

    async loadCategoryHierarchy(categoryId) {
      try {
        this.loading = true
        
        // Obtener la categoría específica
        const response = await this.$http.get(`/api/blog/categorias/${categoryId}`)
        const category = response.data
        
        if (!category) return
        
        // Construir el path desde la categoría específica hacia arriba
        const path = [category]
        let currentCategory = category
        
        // Subir por la jerarquía hasta encontrar la categoría principal
        while (currentCategory.parent_id) {
          const parentResponse = await this.$http.get(`/api/blog/categorias/${currentCategory.parent_id}`)
          const parentCategory = parentResponse.data
          if (parentCategory) {
            path.unshift(parentCategory)
            currentCategory = parentCategory
          } else {
            break
          }
        }
        
        this.selectedCategoryPath = path
        
        // Establecer las selecciones según el path
        if (path.length >= 1) {
          this.selectedMainCategory = path[0].id
          await this.loadSubcategories(path[0].id)
        }
        
        if (path.length >= 2) {
          this.selectedSubcategory = path[1].id
          await this.loadSpecificSubcategories(path[1].id)
        }
        
        if (path.length >= 3) {
          this.selectedSpecificSubcategory = path[2].id
        }
        
      } catch (error) {
        console.error('Error cargando jerarquía de categorías:', error)
        this.$emit('error', 'Error cargando jerarquía de categorías')
      } finally {
        this.loading = false
      }
    },

    async onMainCategoryChange() {
      // Limpiar selecciones dependientes
      this.selectedSubcategory = null
      this.selectedSpecificSubcategory = null
      this.subcategories = []
      this.specificSubcategories = []
      this.selectedCategoryPath = []
      
      if (this.selectedMainCategory) {
        await this.loadSubcategories(this.selectedMainCategory)
        this.updateSelectedCategory()
      } else {
        this.emitChange()
      }
    },

    async onSubcategoryChange() {
      // Limpiar selección específica
      this.selectedSpecificSubcategory = null
      this.specificSubcategories = []
      
      if (this.selectedSubcategory) {
        await this.loadSpecificSubcategories(this.selectedSubcategory)
        this.updateSelectedCategory()
      } else {
        this.updateSelectedCategory()
      }
    },

    onSpecificSubcategoryChange() {
      this.updateSelectedCategory()
    },

    updateSelectedCategory() {
      const selectedId = this.getSelectedCategoryId()
      if (selectedId) {
        this.buildCategoryPath()
        this.emitChange()
      }
    },

    getSelectedCategoryId() {
      // Retornar la categoría más específica seleccionada
      if (this.selectedSpecificSubcategory) {
        return this.selectedSpecificSubcategory
      } else if (this.selectedSubcategory) {
        return this.selectedSubcategory
      } else if (this.selectedMainCategory) {
        return this.selectedMainCategory
      }
      return null
    },

    async buildCategoryPath() {
      const path = []
      
      if (this.selectedMainCategory) {
        const mainCategory = this.mainCategories.find(c => c.id === this.selectedMainCategory)
        if (mainCategory) {
          path.push(mainCategory)
        }
      }
      
      if (this.selectedSubcategory) {
        const subcategory = this.subcategories.find(c => c.id === this.selectedSubcategory)
        if (subcategory) {
          path.push(subcategory)
        }
      }
      
      if (this.selectedSpecificSubcategory) {
        const specificSubcategory = this.specificSubcategories.find(c => c.id === this.selectedSpecificSubcategory)
        if (specificSubcategory) {
          path.push(specificSubcategory)
        }
      }
      
      this.selectedCategoryPath = path
    },

    emitChange() {
      const selectedId = this.getSelectedCategoryId()
      this.$emit('input', selectedId)
      this.$emit('change', {
        categoryId: selectedId,
        categoryPath: this.selectedCategoryPath
      })
    },

    getMainCategoryDescription(categoryId) {
      const category = this.mainCategories.find(c => c.id === categoryId)
      return category ? category.descripcion : ''
    },

    getSubcategoryDescription(categoryId) {
      const category = this.subcategories.find(c => c.id === categoryId)
      return category ? category.descripcion : ''
    },

    getSpecificSubcategoryDescription(categoryId) {
      const category = this.specificSubcategories.find(c => c.id === categoryId)
      return category ? category.descripcion : ''
    },

    getFinalCategoryDescription() {
      if (this.selectedCategoryPath.length > 0) {
        const finalCategory = this.selectedCategoryPath[this.selectedCategoryPath.length - 1]
        return finalCategory.descripcion || ''
      }
      return ''
    }
  }
}
</script>

<style scoped lang="scss">
@import "@/assets/styles/variables.scss";

.category-selector {
  .form-group {
    margin-bottom: 1.5rem;
    
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
      background-color: white;
      
      &:focus {
        outline: none;
        border-color: $primary-color;
        box-shadow: 0 0 0 3px rgba($primary-color, 0.1);
      }
      
      &:disabled {
        background-color: #f9fafb;
        color: #6b7280;
        cursor: not-allowed;
      }
    }
    
    .form-text {
      display: block;
      margin-top: 0.25rem;
      font-size: 0.75rem;
      color: #6b7280;
    }
  }
  
  .selection-summary {
    margin-top: 1.5rem;
    padding: 1rem;
    background: #f8fafc;
    border-radius: 0.5rem;
    border: 1px solid #e2e8f0;
    
    h4 {
      margin: 0 0 0.75rem 0;
      font-size: 0.875rem;
      font-weight: 600;
      color: #374151;
    }
    
    .category-path {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-bottom: 0.75rem;
      
      .category-breadcrumb {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        
        .category-name {
          padding: 0.25rem 0.5rem;
          background: $primary-color;
          color: white;
          border-radius: 0.25rem;
          font-size: 0.75rem;
          font-weight: 500;
        }
        
        i {
          font-size: 0.75rem;
          color: #6b7280;
        }
      }
    }
    
    .category-description {
      margin: 0;
      font-size: 0.875rem;
      color: #6b7280;
      line-height: 1.4;
    }
  }
  
  .loading-indicator {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 1rem;
    color: $primary-color;
    font-size: 0.875rem;
    
    i {
      font-size: 1rem;
    }
  }
}

// Responsive
@media (max-width: 768px) {
  .category-selector {
    .selection-summary {
      .category-path {
        .category-breadcrumb {
          .category-name {
            font-size: 0.7rem;
            padding: 0.2rem 0.4rem;
          }
        }
      }
    }
  }
}
</style>