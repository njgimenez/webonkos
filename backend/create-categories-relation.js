const { query } = require('./database');

async function createCategoriesRelation() {
  try {
    console.log('🚀 Creando tabla de relación entradas-categorías...');

    // Crear tabla de relación muchos a muchos
    await query(`
      CREATE TABLE IF NOT EXISTS entrada_categorias (
        id SERIAL PRIMARY KEY,
        entrada_id INTEGER NOT NULL REFERENCES entradas(id) ON DELETE CASCADE,
        categoria_id INTEGER NOT NULL REFERENCES categorias(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(entrada_id, categoria_id)
      )
    `);

    console.log('✅ Tabla entrada_categorias creada');

    // Crear índices para mejor rendimiento
    await query(`
      CREATE INDEX IF NOT EXISTS idx_entrada_categorias_entrada_id 
      ON entrada_categorias(entrada_id)
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_entrada_categorias_categoria_id 
      ON entrada_categorias(categoria_id)
    `);

    console.log('✅ Índices creados');

    // Migrar datos existentes de categoria_id a la nueva tabla
    await query(`
      INSERT INTO entrada_categorias (entrada_id, categoria_id)
      SELECT id, categoria_id 
      FROM entradas 
      WHERE categoria_id IS NOT NULL
      ON CONFLICT (entrada_id, categoria_id) DO NOTHING
    `);

    console.log('✅ Datos existentes migrados');

    // Agregar columna para mantener compatibilidad (opcional)
    // La columna categoria_id original se mantiene para compatibilidad
    // pero ahora se usa principalmente la tabla de relación

    console.log('🎉 Sistema de múltiples categorías configurado exitosamente!');
    
  } catch (error) {
    console.error('❌ Error creando tabla de relación:', error);
  }
}

createCategoriesRelation();