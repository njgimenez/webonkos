const { Pool } = require('pg');
const config = require('./config');

const pool = new Pool({
  user: config.database.user,
  host: config.database.host,
  database: config.database.name,
  password: config.database.password,
  port: config.database.port,
  ssl: config.database.ssl
});

async function removeCategoriaIdDuplication() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Iniciando migración para eliminar duplicidad de categoria_id...');
    
    // 1. Verificar entradas que tienen categoria_id pero no están en entrada_categorias
    console.log('\n📊 Verificando entradas con categoria_id que no están en entrada_categorias...');
    const orphanedEntries = await client.query(`
      SELECT e.id, e.titulo, e.categoria_id, c.nombre as categoria_nombre
      FROM entradas e
      LEFT JOIN categorias c ON e.categoria_id = c.id
      WHERE e.categoria_id IS NOT NULL 
      AND NOT EXISTS (
        SELECT 1 FROM entrada_categorias ec 
        WHERE ec.entrada_id = e.id AND ec.categoria_id = e.categoria_id
      )
    `);
    
    console.log(`📋 Encontradas ${orphanedEntries.rows.length} entradas con categoria_id que no están en entrada_categorias:`);
    orphanedEntries.rows.forEach(entry => {
      console.log(`  - ID ${entry.id}: "${entry.titulo}" -> Categoría ${entry.categoria_id} (${entry.categoria_nombre})`);
    });
    
    // 2. Migrar las entradas huérfanas a entrada_categorias
    if (orphanedEntries.rows.length > 0) {
      console.log('\n🔄 Migrando entradas huérfanas a entrada_categorias...');
      
      for (const entry of orphanedEntries.rows) {
        await client.query(`
          INSERT INTO entrada_categorias (entrada_id, categoria_id)
          VALUES ($1, $2)
          ON CONFLICT (entrada_id, categoria_id) DO NOTHING
        `, [entry.id, entry.categoria_id]);
        
        console.log(`  ✅ Migrada entrada ${entry.id} con categoría ${entry.categoria_id}`);
      }
    }
    
    // 3. Verificar que todas las entradas con categoria_id ahora están en entrada_categorias
    console.log('\n🔍 Verificando migración...');
    const remainingOrphans = await client.query(`
      SELECT COUNT(*) as count
      FROM entradas e
      WHERE e.categoria_id IS NOT NULL 
      AND NOT EXISTS (
        SELECT 1 FROM entrada_categorias ec 
        WHERE ec.entrada_id = e.id AND ec.categoria_id = e.categoria_id
      )
    `);
    
    if (remainingOrphans.rows[0].count === '0') {
      console.log('✅ Todas las entradas han sido migradas correctamente');
    } else {
      console.log(`❌ Aún quedan ${remainingOrphans.rows[0].count} entradas sin migrar`);
      return;
    }
    
    // 4. Crear backup de la columna categoria_id antes de eliminarla
    console.log('\n💾 Creando backup de categoria_id...');
    await client.query(`
      ALTER TABLE entradas ADD COLUMN categoria_id_backup INTEGER;
    `);
    
    await client.query(`
      UPDATE entradas SET categoria_id_backup = categoria_id;
    `);
    
    console.log('✅ Backup creado en columna categoria_id_backup');
    
    // 5. Eliminar la columna categoria_id
    console.log('\n🗑️ Eliminando columna categoria_id...');
    await client.query(`
      ALTER TABLE entradas DROP COLUMN categoria_id;
    `);
    
    console.log('✅ Columna categoria_id eliminada');
    
    // 6. Verificar el estado final
    console.log('\n📊 Estado final:');
    const totalEntries = await client.query('SELECT COUNT(*) as count FROM entradas');
    const totalCategoriaRelations = await client.query('SELECT COUNT(*) as count FROM entrada_categorias');
    
    console.log(`  - Total entradas: ${totalEntries.rows[0].count}`);
    console.log(`  - Total relaciones entrada-categoría: ${totalCategoriaRelations.rows[0].count}`);
    
    // 7. Mostrar algunas entradas con sus categorías
    console.log('\n📋 Ejemplos de entradas con sus categorías:');
    const sampleEntries = await client.query(`
      SELECT e.id, e.titulo, 
             STRING_AGG(c.nombre, ', ' ORDER BY c.nombre) as categorias
      FROM entradas e
      LEFT JOIN entrada_categorias ec ON e.id = ec.entrada_id
      LEFT JOIN categorias c ON ec.categoria_id = c.id
      GROUP BY e.id, e.titulo
      ORDER BY e.id
      LIMIT 5
    `);
    
    sampleEntries.rows.forEach(entry => {
      console.log(`  - ID ${entry.id}: "${entry.titulo}" -> [${entry.categorias || 'Sin categorías'}]`);
    });
    
    console.log('\n🎉 Migración completada exitosamente!');
    console.log('📝 La tabla entradas ya no tiene campo categoria_id');
    console.log('📝 Todas las categorías se manejan únicamente a través de entrada_categorias');
    console.log('💾 Backup disponible en categoria_id_backup (puede eliminarse después de verificar)');
    
  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Ejecutar la migración
removeCategoriaIdDuplication()
  .then(() => {
    console.log('\n✅ Script completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error en el script:', error);
    process.exit(1);
  });