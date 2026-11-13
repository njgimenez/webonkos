<template>
  <div class="category-admin">
    <div class="admin-header">
      <h1>Administración de Categorías</h1>
      <p>Gestiona las categorías y subcategorías del blog</p>
    </div>

    <!-- Formulario para crear nueva categoría -->
    <div class="form-section">
      <h2>{{ isEditing ? 'Editar Categoría' : 'Nueva Categoría' }}</h2>
      
      <form @submit.prevent="saveCategory" class="category-form">
        <div class="form-row">
          <div class="form-group">
            <label for="nombre">Nombre *</label>
            <input
              type="text"
              id="nombre"
              v-model="categoryForm.nombre"
              required
              placeholder="Ej: Investigación, Bitácora"
            />
          </div>
          
          <div class="form-group">
            <label for="descripcion">Descripción</label>
            <input
              type="text"
              id="descripcion"
              v-model="categoryForm.descripcion"
              placeholder="Descripción de la categoría"
            />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="color_hex">Color</label>
            <div class="color-input-group">
              <input
                type="color"
                id="color_hex"
                v-model="categoryForm.color_hex"
                class="color-picker"
              />
              <input
                type="text"
                v-model="categoryForm.color_hex"
                placeholder="#4facfe"
                class="color-text"
              />
            </div>
          </div>
          
          <div class="form-group">
            <label for="orden_menu">Orden en Menú</label>
            <input
              type="number"
              id="orden_menu"
              v-model.number="categoryForm.orden_menu"
              min="1"
              placeholder="1"
            />
          </div>
        </div>

        <!-- Selector de categoría padre para subcategorías -->
        <div class="form-group" v-if="showParentSelector">
          <label for="parent_id">Categoría Padre</label>
          <select id="parent_id" v-model="categoryForm.parent_id" class="form-control">
            <option value="">Seleccionar categoría padre (opcional)</option>
            <optgroup label="Categorías Principales">
              <option 
                v-for="cat in mainCategories" 
                :key="cat.id" 
                :value="cat.id"
              >
                {{ cat.nombre }}
              </option>
            </optgroup>
            <optgroup label="Subcategorías Nivel 1">
              <option 
                v-for="cat in level1Categories" 
                :key="cat.id" 
                :value="cat.id"
              >
                {{ cat.ruta_completa }}
              </option>
            </optgroup>
          </select>
        </div>

        <div class="form-actions">
          <button type="submit" class="btn btn-primary" :disabled="loading">
            {{ loading ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Crear') }}
          </button>
          <button type="button" class="btn btn-secondary" @click="resetForm" v-if="isEditing">
            Cancelar
          </button>
        </div>
      </form>
    </div>

    <!-- Lista de categorías existentes -->
    <div class="categories-section">
      <h2>Categorías Existentes</h2>
      
      <div class="categories-tree">
        <div 
          v-for="category in categoriesTree" 
          :key="category.id"
          class="category-item"
          :class="`level-${category.nivel}`"
        >
          <div class="category-info">
            <div class="category-header">
              <span class="category-color" :style="{ backgroundColor: category.color_hex }"></span>
              <span class="category-name">{{ category.nombre }}</span>
              <span class="category-slug">({{ category.slug }})</span>
              <span class="category-level">Nivel {{ category.nivel }}</span>
            </div>
            <div class="category-details">
              <p v-if="category.descripcion">{{ category.descripcion }}</p>
              <p class="category-path">{{ category.ruta_completa }}</p>
            </div>
          </div>
          
          <div class="category-actions">
            <button 
              class="btn btn-sm btn-outline-primary" 
              @click="editCategory(category)"
              title="Editar"
            >
              ✏️
            </button>
            <button 
              class="btn btn-sm btn-outline-danger" 
              @click="deleteCategory(category)"
              title="Eliminar"
            >
              🗑️
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de confirmación para eliminar -->
    <div v-if="showDeleteModal" class="modal-overlay" @click="closeDeleteModal">
      <div class="modal-content" @click.stop>
        <h3>Confirmar Eliminación</h3>
        <p>¿Estás seguro de que quieres eliminar la categoría <strong>{{ categoryToDelete?.nombre }}</strong>?</p>
        <p class="warning">Esta acción no se puede deshacer y eliminará todas las subcategorías asociadas.</p>
        <div class="modal-actions">
          <button class="btn btn-danger" @click="confirmDelete" :disabled="loading">
            {{ loading ? 'Eliminando...' : 'Eliminar' }}
          </button>
          <button class="btn btn-secondary" @click="closeDeleteModal">Cancelar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'CategoryAdmin',
  data() {
    return {
      loading: false,
      isEditing: false,
      showParentSelector: true,
      showDeleteModal: false,
      categoryToDelete: null,
      categoryForm: {
        id: null,
        nombre: '',
        descripcion: '',
        color_hex: '#4facfe',
        orden_menu: 1,
        parent_id: null
      },
      allCategories: [],
      mainCategories: [],
      level1Categories: []
    }
  },
  computed: {
    categoriesTree() {
      return this.allCategories.sort((a, b) => {
        if (a.nivel !== b.nivel) return a.nivel - b.nivel
        if (a.orden_menu !== b.orden_menu) return a.orden_menu - b.orden_menu
        return a.nombre.localeCompare(b.nombre)
      })
    }
  },
  async mounted() {
    await this.loadCategories()
  },
  methods: {
    async loadCategories() {
      try {
        this.loading = true
        const response = await axios.get('/api/blog/categorias')
        this.allCategories = response.data
        
        // Separar categorías por nivel
        this.mainCategories = this.allCategories.filter(cat => cat.nivel === 0)
        this.level1Categories = this.allCategories.filter(cat => cat.nivel === 1)
        
      } catch (error) {
        console.error('Error cargando categorías:', error)
        this.$toast.error('Error al cargar las categorías')
      } finally {
        this.loading = false
      }
    },

    async saveCategory() {
      try {
        this.loading = true
        
        if (this.isEditing) {
          // Actualizar categoría existente
          await axios.put(`/api/blog/categorias/${this.categoryForm.id}`, this.categoryForm)
          this.$toast.success('Categoría actualizada exitosamente')
        } else {
          // Crear nueva categoría
          await axios.post('/api/blog/categorias', this.categoryForm)
          this.$toast.success('Categoría creada exitosamente')
        }
        
        await this.loadCategories()
        this.resetForm()
        
      } catch (error) {
        console.error('Error guardando categoría:', error)
        this.$toast.error('Error al guardar la categoría')
      } finally {
        this.loading = false
      }
    },

    editCategory(category) {
      this.isEditing = true
      this.categoryForm = {
        id: category.id,
        nombre: category.nombre,
        descripcion: category.descripcion || '',
        color_hex: category.color_hex,
        orden_menu: category.orden_menu,
        parent_id: category.parent_id
      }
      
      // Scroll al formulario
      document.querySelector('.form-section').scrollIntoView({ behavior: 'smooth' })
    },

    deleteCategory(category) {
      this.categoryToDelete = category
      this.showDeleteModal = true
    },

    async confirmDelete() {
      try {
        this.loading = true
        await axios.delete(`/api/blog/categorias/${this.categoryToDelete.id}`)
        this.$toast.success('Categoría eliminada exitosamente')
        await this.loadCategories()
        this.closeDeleteModal()
      } catch (error) {
        console.error('Error eliminando categoría:', error)
        this.$toast.error('Error al eliminar la categoría')
      } finally {
        this.loading = false
      }
    },

    closeDeleteModal() {
      this.showDeleteModal = false
      this.categoryToDelete = null
    },

    resetForm() {
      this.isEditing = false
      this.categoryForm = {
        id: null,
        nombre: '',
        descripcion: '',
        color_hex: '#4facfe',
        orden_menu: 1,
        parent_id: null
      }
    }
  }
}
</script>

<style scoped lang="scss">
.category-admin {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.admin-header {
  margin-bottom: 30px;
  
  h1 {
    color: #2c3e50;
    margin-bottom: 10px;
  }
  
  p {
    color: #7f8c8d;
    font-size: 16px;
  }
}

.form-section {
  background: #f8f9fa;
  padding: 25px;
  border-radius: 10px;
  margin-bottom: 30px;
  border: 1px solid #e9ecef;
  
  h2 {
    color: #2c3e50;
    margin-bottom: 20px;
    font-size: 24px;
  }
}

.category-form {
  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    margin-bottom: 20px;
    
    @media (max-width: 768px) {
      grid-template-columns: 1fr;
    }
  }
  
  .form-group {
    label {
      display: block;
      margin-bottom: 8px;
      font-weight: 600;
      color: #2c3e50;
    }
    
    input, select {
      width: 100%;
      padding: 12px;
      border: 2px solid #e9ecef;
      border-radius: 6px;
      font-size: 14px;
      transition: border-color 0.3s ease;
      
      &:focus {
        outline: none;
        border-color: #4facfe;
        box-shadow: 0 0 0 3px rgba(79, 172, 254, 0.1);
      }
    }
  }
  
  .color-input-group {
    display: flex;
    gap: 10px;
    
    .color-picker {
      width: 60px;
      height: 45px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
    }
    
    .color-text {
      flex: 1;
    }
  }
  
  .form-actions {
    display: flex;
    gap: 15px;
    margin-top: 25px;
  }
}

.categories-section {
  h2 {
    color: #2c3e50;
    margin-bottom: 20px;
    font-size: 24px;
  }
}

.categories-tree {
  .category-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px 20px;
    margin-bottom: 10px;
    background: white;
    border: 1px solid #e9ecef;
    border-radius: 8px;
    transition: all 0.3s ease;
    
    &:hover {
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      transform: translateY(-1px);
    }
    
    &.level-0 {
      border-left: 4px solid #4facfe;
      font-weight: 600;
    }
    
    &.level-1 {
      border-left: 4px solid #fa709a;
      margin-left: 20px;
    }
    
    &.level-2 {
      border-left: 4px solid #43e97b;
      margin-left: 40px;
    }
  }
  
  .category-info {
    flex: 1;
    
    .category-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 5px;
      
      .category-color {
        width: 20px;
        height: 20px;
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 0 0 1px #e9ecef;
      }
      
      .category-name {
        font-weight: 600;
        color: #2c3e50;
      }
      
      .category-slug {
        color: #7f8c8d;
        font-size: 14px;
      }
      
      .category-level {
        background: #e9ecef;
        color: #6c757d;
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 500;
      }
    }
    
    .category-details {
      p {
        margin: 0;
        color: #6c757d;
        font-size: 14px;
        
        &.category-path {
          color: #4facfe;
          font-weight: 500;
        }
      }
    }
  }
  
  .category-actions {
    display: flex;
    gap: 8px;
  }
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 30px;
  border-radius: 10px;
  max-width: 500px;
  width: 90%;
  
  h3 {
    color: #2c3e50;
    margin-bottom: 15px;
  }
  
  p {
    margin-bottom: 10px;
    color: #6c757d;
    
    &.warning {
      color: #e74c3c;
      font-weight: 600;
      background: #fdf2f2;
      padding: 10px;
      border-radius: 6px;
      border-left: 4px solid #e74c3c;
    }
  }
  
  .modal-actions {
    display: flex;
    gap: 15px;
    margin-top: 25px;
    justify-content: flex-end;
  }
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  &.btn-primary {
    background: #4facfe;
    color: white;
    
    &:hover:not(:disabled) {
      background: #3d8bfe;
      transform: translateY(-1px);
    }
  }
  
  &.btn-secondary {
    background: #6c757d;
    color: white;
    
    &:hover:not(:disabled) {
      background: #5a6268;
    }
  }
  
  &.btn-danger {
    background: #e74c3c;
    color: white;
    
    &:hover:not(:disabled) {
      background: #c0392b;
    }
  }
  
  &.btn-outline-primary {
    background: transparent;
    color: #4facfe;
    border: 2px solid #4facfe;
    
    &:hover {
      background: #4facfe;
      color: white;
    }
  }
  
  &.btn-outline-danger {
    background: transparent;
    color: #e74c3c;
    border: 2px solid #e74c3c;
    
    &:hover {
      background: #e74c3c;
      color: white;
    }
  }
  
  &.btn-sm {
    padding: 8px 12px;
    font-size: 12px;
  }
}

.form-control {
  width: 100%;
  padding: 12px;
  border: 2px solid #e9ecef;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: #4facfe;
    box-shadow: 0 0 0 3px rgba(79, 172, 254, 0.1);
  }
}
</style>