const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Configuración de conexiones
const localConfig = {
  host: 'localhost',
  port: 5432,
  database: 'onkosdb',
  user: 'master',
  password: 'Mazingerz78'
};

const prodConfig = {
  connectionString: 'postgresql://onkos_user:SCef59zkV9OEYV1zSGXla0wDUA3wUVSA@dpg-d2rnp815pdvs73e0eisg-a.oregon-postgres.render.com/onkosdb',
  ssl: { rejectUnauthorized: false }
};

class ControlledSync {
  constructor() {
    this.localPool = new Pool(localConfig);
    this.prodPool = new Pool(prodConfig);
    this.log = [];
    this.errors = [];
    this.stats = {
      entradasUpdated: 0,
      entradasInserted: 0,
      categoriasUpdated: 0,
      categoriasInserted: 0,
      relacionesInserted: 0,
      estructuraUpdated: 0,
      errors: 0
    };
  }

  logMessage(message, type = 'INFO') {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${type}] ${message}`;
    console.log(logEntry);
    this.log.push(logEntry);
  }

  logError(error, context = '') {
    const message = context ? `${context}: ${error.message}` : error.message;
    this.logMessage(message, 'ERROR');
    this.errors.push({ error: error.message, context, stack: error.stack });
    this.stats.errors++;
  }

  async connect() {
    try {
      this.logMessage('🔌 Conectando a bases de datos...');
      
      const localClient = await this.localPool.connect();
      await localClient.query('SELECT 1');
      localClient.release();
      this.logMessage('✅ LOCAL conectado');

      const prodClient = await this.prodPool.connect();
      await prodClient.query('SELECT 1');
      prodClient.release();
      this.logMessage('✅ PROD conectado');

      return true;
    } catch (error) {
      this.logError(error, 'Error de conexión');
      return false;
    }
  }

  // PASO 1: PROD → LOCAL - Actualizar entradas y traer nuevas
  async syncEntradasProdToLocal() {
    this.logMessage('📥 PASO 1: Sincronizando entradas PROD → LOCAL...');
    
    try {
      const localClient = await this.localPool.connect();
      const prodClient = await this.prodPool.connect();

      // Obtener entradas de PROD
      const prodEntradas = await prodClient.query(`
        SELECT * FROM entradas 
        ORDER BY id
      `);
      prodClient.release();

      this.logMessage(`📊 PROD tiene ${prodEntradas.rows.length} entradas`);

      let updated = 0;
      let inserted = 0;
      let skipped = 0;

      for (const entrada of prodEntradas.rows) {
        try {
          // Verificar si existe en LOCAL
          const existing = await localClient.query(
            'SELECT id FROM entradas WHERE id = $1',
            [entrada.id]
          );

          if (existing.rows.length === 0) {
            // Insertar nueva entrada (excluyendo categoria_id si no existe en LOCAL)
            const { categoria_id, ...entradaData } = entrada;
            
            const columns = Object.keys(entradaData);
            const values = Object.values(entradaData);
            const placeholders = values.map((_, index) => `$${index + 1}`);
            
            const insertQuery = `
              INSERT INTO entradas (${columns.map(col => `"${col}"`).join(', ')})
              VALUES (${placeholders.join(', ')})
            `;
            
            await localClient.query(insertQuery, values);
            inserted++;
            this.logMessage(`➕ Entrada insertada: ${entrada.titulo || entrada.id}`);
          } else {
            // Actualizar entrada existente (excluyendo categoria_id)
            const { categoria_id, id, ...updateData } = entrada;
            
            const columns = Object.keys(updateData);
            const values = Object.values(updateData);
            const setClause = columns.map((col, index) => `"${col}" = $${index + 1}`).join(', ');
            
            const updateQuery = `
              UPDATE entradas 
              SET ${setClause}
              WHERE id = $${values.length + 1}
            `;
            
            await localClient.query(updateQuery, [...values, id]);
            updated++;
            this.logMessage(`🔄 Entrada actualizada: ${entrada.titulo || entrada.id}`);
          }

        } catch (error) {
          this.logError(error, `Error procesando entrada ${entrada.id}`);
          skipped++;
        }
      }

      localClient.release();
      this.logMessage(`✅ Entradas PROD → LOCAL: ${inserted} insertadas, ${updated} actualizadas, ${skipped} omitidas`);

      this.stats.entradasInserted += inserted;
      this.stats.entradasUpdated += updated;

    } catch (error) {
      this.logError(error, 'Error sincronizando entradas PROD → LOCAL');
    }
  }

  // PASO 2: LOCAL → PROD - Actualizar categorías
  async syncCategoriasLocalToProd() {
    this.logMessage('📤 PASO 2: Sincronizando categorías LOCAL → PROD...');
    
    try {
      const localClient = await this.localPool.connect();
      const prodClient = await this.prodPool.connect();

      // Obtener categorías de LOCAL
      const localCategorias = await localClient.query(`
        SELECT * FROM categorias 
        ORDER BY id
      `);
      localClient.release();

      this.logMessage(`📊 LOCAL tiene ${localCategorias.rows.length} categorías`);

      let updated = 0;
      let inserted = 0;

      for (const categoria of localCategorias.rows) {
        try {
          // Verificar si existe en PROD
          const existing = await prodClient.query(
            'SELECT id FROM categorias WHERE id = $1',
            [categoria.id]
          );

          if (existing.rows.length === 0) {
            // Insertar nueva categoría
            await prodClient.query(`
              INSERT INTO categorias (id, nombre, slug, descripcion, color_hex, orden_menu, activo, created_at, updated_at, parent_id, nivel, ruta_completa)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            `, [
              categoria.id, categoria.nombre, categoria.slug, categoria.descripcion,
              categoria.color_hex, categoria.orden_menu, categoria.activo,
              categoria.created_at, categoria.updated_at, categoria.parent_id,
              categoria.nivel, categoria.ruta_completa
            ]);
            inserted++;
            this.logMessage(`➕ Categoría insertada: ${categoria.nombre}`);
          } else {
            // Actualizar categoría existente
            await prodClient.query(`
              UPDATE categorias SET 
                nombre = $2, slug = $3, descripcion = $4, color_hex = $5,
                orden_menu = $6, activo = $7, updated_at = $8, parent_id = $9,
                nivel = $10, ruta_completa = $11
              WHERE id = $1
            `, [
              categoria.id, categoria.nombre, categoria.slug, categoria.descripcion,
              categoria.color_hex, categoria.orden_menu, categoria.activo,
              categoria.updated_at, categoria.parent_id, categoria.nivel, categoria.ruta_completa
            ]);
            updated++;
            this.logMessage(`🔄 Categoría actualizada: ${categoria.nombre}`);
          }

        } catch (error) {
          this.logError(error, `Error procesando categoría ${categoria.nombre}`);
        }
      }

      prodClient.release();
      this.logMessage(`✅ Categorías LOCAL → PROD: ${inserted} insertadas, ${updated} actualizadas`);

      this.stats.categoriasInserted += inserted;
      this.stats.categoriasUpdated += updated;

    } catch (error) {
      this.logError(error, 'Error sincronizando categorías LOCAL → PROD');
    }
  }

  // PASO 3: LOCAL → PROD - Sincronizar relaciones entrada_categorias
  async syncEntradaCategorias() {
    this.logMessage('🔗 PASO 3: Sincronizando relaciones entrada_categorias...');
    
    try {
      const localClient = await this.localPool.connect();
      const prodClient = await this.prodPool.connect();

      // Obtener relaciones de LOCAL
      const localRelaciones = await localClient.query(`
        SELECT * FROM entrada_categorias 
        ORDER BY id
      `);
      localClient.release();

      this.logMessage(`📊 LOCAL tiene ${localRelaciones.rows.length} relaciones`);

      let inserted = 0;

      for (const relacion of localRelaciones.rows) {
        try {
          // Insertar o actualizar relación en PROD
          await prodClient.query(`
            INSERT INTO entrada_categorias (entrada_id, categoria_id, created_at)
            VALUES ($1, $2, $3)
            ON CONFLICT (entrada_id, categoria_id) DO UPDATE SET
            created_at = EXCLUDED.created_at
          `, [relacion.entrada_id, relacion.categoria_id, relacion.created_at]);
          
          inserted++;
          this.logMessage(`🔗 Relación sincronizada: entrada ${relacion.entrada_id} → categoría ${relacion.categoria_id}`);

        } catch (error) {
          this.logError(error, `Error procesando relación ${relacion.id}`);
        }
      }

      prodClient.release();
      this.logMessage(`✅ Relaciones sincronizadas: ${inserted} procesadas`);

      this.stats.relacionesInserted += inserted;

    } catch (error) {
      this.logError(error, 'Error sincronizando relaciones entrada_categorias');
    }
  }

  // PASO 4: PROD - Eliminar campo categoria_id de tabla entradas
  async removeCategoriaIdFromEntradas() {
    this.logMessage('🗑️ PASO 4: Eliminando campo categoria_id de tabla entradas en PROD...');
    
    try {
      const prodClient = await this.prodPool.connect();

      // Verificar si la columna existe
      const columnExists = await prodClient.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'entradas' AND column_name = 'categoria_id' AND table_schema = 'public'
        );
      `);

      if (columnExists.rows[0].exists) {
        // Eliminar la columna
        await prodClient.query(`ALTER TABLE entradas DROP COLUMN categoria_id;`);
        this.logMessage('✅ Columna categoria_id eliminada de tabla entradas');
        this.stats.estructuraUpdated++;
      } else {
        this.logMessage('⚠️ Columna categoria_id no existe en tabla entradas');
      }

      prodClient.release();

    } catch (error) {
      this.logError(error, 'Error eliminando columna categoria_id');
    }
  }

  // PASO 5: LOCAL → PROD - Actualizar solo entradas nuevas que no coincidan
  async syncNewEntradasLocalToProd() {
    this.logMessage('📤 PASO 5: Sincronizando entradas nuevas de LOCAL → PROD...');
    
    try {
      const localClient = await this.localPool.connect();
      const prodClient = await this.prodPool.connect();

      // Obtener entradas de LOCAL
      const localEntradas = await localClient.query(`
        SELECT * FROM entradas 
        ORDER BY id
      `);
      localClient.release();

      this.logMessage(`📊 LOCAL tiene ${localEntradas.rows.length} entradas`);

      let updated = 0;
      let inserted = 0;
      let skipped = 0;

      for (const entrada of localEntradas.rows) {
        try {
          // Verificar si existe en PROD
          const existing = await prodClient.query(
            'SELECT id FROM entradas WHERE id = $1',
            [entrada.id]
          );

          if (existing.rows.length === 0) {
            // Insertar nueva entrada
            const columns = Object.keys(entrada);
            const values = Object.values(entrada);
            const placeholders = values.map((_, index) => `$${index + 1}`);
            
            const insertQuery = `
              INSERT INTO entradas (${columns.map(col => `"${col}"`).join(', ')})
              VALUES (${placeholders.join(', ')})
            `;
            
            await prodClient.query(insertQuery, values);
            inserted++;
            this.logMessage(`➕ Entrada nueva insertada: ${entrada.titulo || entrada.id}`);
          } else {
            // Solo actualizar si hay diferencias significativas
            const prodEntrada = await prodClient.query(
              'SELECT * FROM entradas WHERE id = $1',
              [entrada.id]
            );

            if (prodEntrada.rows.length > 0) {
              const prodData = prodEntrada.rows[0];
              const hasChanges = this.entradaHasChanges(entrada, prodData);
              
              if (hasChanges) {
                const { id, ...updateData } = entrada;
                const columns = Object.keys(updateData);
                const values = Object.values(updateData);
                const setClause = columns.map((col, index) => `"${col}" = $${index + 1}`).join(', ');
                
                const updateQuery = `
                  UPDATE entradas 
                  SET ${setClause}
                  WHERE id = $${values.length + 1}
                `;
                
                await prodClient.query(updateQuery, [...values, id]);
                updated++;
                this.logMessage(`🔄 Entrada actualizada: ${entrada.titulo || entrada.id}`);
              } else {
                skipped++;
                this.logMessage(`⏭️ Entrada sin cambios: ${entrada.titulo || entrada.id}`);
              }
            }
          }

        } catch (error) {
          this.logError(error, `Error procesando entrada ${entrada.id}`);
          skipped++;
        }
      }

      prodClient.release();
      this.logMessage(`✅ Entradas LOCAL → PROD: ${inserted} insertadas, ${updated} actualizadas, ${skipped} omitidas`);

      this.stats.entradasInserted += inserted;
      this.stats.entradasUpdated += updated;

    } catch (error) {
      this.logError(error, 'Error sincronizando entradas nuevas LOCAL → PROD');
    }
  }

  entradaHasChanges(localEntrada, prodEntrada) {
    // Comparar campos importantes excluyendo timestamps
    const excludeFields = ['created_at', 'updated_at', 'fecha_creacion'];
    
    for (const [key, value] of Object.entries(localEntrada)) {
      if (excludeFields.includes(key)) continue;
      
      if (prodEntrada[key] !== value) {
        return true;
      }
    }
    
    return false;
  }

  // PASO 6: LOCAL → PROD - Actualizar estructuras
  async syncEstructurasLocalToProd() {
    this.logMessage('🏗️ PASO 6: Actualizando estructuras de LOCAL → PROD...');
    
    try {
      const localClient = await this.localPool.connect();
      const prodClient = await this.prodPool.connect();

      // Obtener estructura de categorías en LOCAL
      const localStructure = await localClient.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'categorias' AND table_schema = 'public'
        ORDER BY ordinal_position
      `);

      // Obtener estructura de categorías en PROD
      const prodStructure = await prodClient.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'categorias' AND table_schema = 'public'
        ORDER BY ordinal_position
      `);

      const localColumns = new Map(localStructure.rows.map(col => [col.column_name, col]));
      const prodColumns = new Map(prodStructure.rows.map(col => [col.column_name, col]));

      // Verificar columnas faltantes en PROD
      for (const [columnName, localCol] of localColumns) {
        if (!prodColumns.has(columnName)) {
          // Agregar columna faltante
          const columnDef = this.buildColumnDefinition(localCol);
          await prodClient.query(`ALTER TABLE categorias ADD COLUMN ${columnDef};`);
          this.logMessage(`➕ Columna agregada: ${columnName}`);
          this.stats.estructuraUpdated++;
        }
      }

      localClient.release();
      prodClient.release();

      this.logMessage('✅ Estructuras actualizadas');

    } catch (error) {
      this.logError(error, 'Error actualizando estructuras');
    }
  }

  buildColumnDefinition(column) {
    let definition = `"${column.column_name}" ${column.data_type}`;
    
    if (column.character_maximum_length) {
      definition += `(${column.character_maximum_length})`;
    }
    
    if (column.is_nullable === 'NO') {
      definition += ' NOT NULL';
    }
    
    if (column.column_default) {
      definition += ` DEFAULT ${column.column_default}`;
    }
    
    return definition;
  }

  async generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      syncType: 'CONTROLLED_SYNC',
      summary: {
        entradasUpdated: this.stats.entradasUpdated,
        entradasInserted: this.stats.entradasInserted,
        categoriasUpdated: this.stats.categoriasUpdated,
        categoriasInserted: this.stats.categoriasInserted,
        relacionesInserted: this.stats.relacionesInserted,
        estructuraUpdated: this.stats.estructuraUpdated,
        errors: this.stats.errors,
        success: this.stats.errors === 0
      },
      logs: this.log,
      errors: this.errors
    };

    const reportPath = path.join(__dirname, 'controlled-sync-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    this.logMessage(`📄 Reporte generado: ${reportPath}`);
    return reportPath;
  }

  async run() {
    try {
      this.logMessage('🚀 Iniciando sincronización controlada...');
      
      const startTime = Date.now();

      // Conectar a las bases de datos
      const connected = await this.connect();
      if (!connected) {
        throw new Error('No se pudo conectar a las bases de datos');
      }

      // Ejecutar pasos de sincronización
      await this.syncEntradasProdToLocal();
      await this.syncCategoriasLocalToProd();
      await this.syncEntradaCategorias();
      await this.removeCategoriaIdFromEntradas();
      await this.syncNewEntradasLocalToProd();
      await this.syncEstructurasLocalToProd();

      const duration = Date.now() - startTime;
      this.logMessage(`✅ Sincronización controlada completada en ${duration}ms`);

      // Generar reporte
      const reportPath = await this.generateReport();

      this.logMessage('✅ Proceso completado exitosamente');
      return { success: true, duration, stats: this.stats, reportPath };

    } catch (error) {
      this.logError(error, 'Error fatal en sincronización controlada');
      await this.generateReport();
      return { success: false, error: error.message };
    } finally {
      await this.localPool.end();
      await this.prodPool.end();
    }
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  const sync = new ControlledSync();
  sync.run()
    .then(result => {
      if (result.success) {
        console.log('🎉 Sincronización controlada completada');
        console.log(`⏱️ Duración: ${result.duration}ms`);
        console.log(`📊 Entradas: ${result.stats.entradasInserted} insertadas, ${result.stats.entradasUpdated} actualizadas`);
        console.log(`📊 Categorías: ${result.stats.categoriasInserted} insertadas, ${result.stats.categoriasUpdated} actualizadas`);
        console.log(`📊 Relaciones: ${result.stats.relacionesInserted} insertadas`);
        console.log(`📊 Estructura: ${result.stats.estructuraUpdated} cambios`);
        console.log(`📄 Reporte: ${result.reportPath}`);
      } else {
        console.error('💥 Error en sincronización controlada:', result.error);
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('💥 Error fatal:', error.message);
      process.exit(1);
    });
}

module.exports = ControlledSync;