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

class LocalToProdSync {
  constructor() {
    this.localPool = new Pool(localConfig);
    this.prodPool = new Pool(prodConfig);
    this.log = [];
    this.errors = [];
    this.stats = {
      tablesProcessed: 0,
      recordsInserted: 0,
      recordsUpdated: 0,
      recordsSkipped: 0,
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

  async syncTableData(tableName, strategy = 'INSERT_OR_UPDATE') {
    this.logMessage(`🔄 Sincronizando datos de tabla: ${tableName}`);
    this.stats.tablesProcessed++;

    try {
      const localClient = await this.localPool.connect();
      const prodClient = await this.prodPool.connect();

      // Obtener datos de LOCAL
      const localData = await this.getTableData(localClient, tableName);
      localClient.release();

      if (localData.length === 0) {
        this.logMessage(`⚠️ ${tableName}: No hay datos en LOCAL`);
        prodClient.release();
        return { success: true, recordsProcessed: 0 };
      }

      // Obtener datos existentes en PROD
      const prodData = await this.getTableData(prodClient, tableName);
      const prodDataMap = new Map(prodData.map(record => [record.id, record]));

      let recordsProcessed = 0;
      let recordsInserted = 0;
      let recordsUpdated = 0;
      let recordsSkipped = 0;

      // Procesar cada registro de LOCAL
      for (const localRecord of localData) {
        try {
          const recordId = localRecord.id;
          const prodRecord = prodDataMap.get(recordId);

          if (!prodRecord) {
            // Insertar nuevo registro
            await this.insertRecord(prodClient, tableName, localRecord);
            recordsInserted++;
            this.logMessage(`➕ ${tableName}: Insertado registro ID ${recordId}`);
          } else {
            // Verificar si necesita actualización
            if (this.recordsAreDifferent(localRecord, prodRecord)) {
              await this.updateRecord(prodClient, tableName, localRecord);
              recordsUpdated++;
              this.logMessage(`🔄 ${tableName}: Actualizado registro ID ${recordId}`);
            } else {
              recordsSkipped++;
              this.logMessage(`⏭️ ${tableName}: Registro ID ${recordId} sin cambios`);
            }
          }

          recordsProcessed++;

        } catch (error) {
          this.logError(error, `Error procesando registro ID ${localRecord.id} en ${tableName}`);
        }
      }

      prodClient.release();

      this.stats.recordsInserted += recordsInserted;
      this.stats.recordsUpdated += recordsUpdated;
      this.stats.recordsSkipped += recordsSkipped;

      this.logMessage(`✅ ${tableName}: ${recordsProcessed} registros procesados (${recordsInserted} insertados, ${recordsUpdated} actualizados, ${recordsSkipped} omitidos)`);
      
      return { 
        success: true, 
        recordsProcessed, 
        recordsInserted, 
        recordsUpdated, 
        recordsSkipped 
      };

    } catch (error) {
      this.logError(error, `Error sincronizando ${tableName}`);
      return { success: false, recordsProcessed: 0 };
    }
  }

  async getTableData(client, tableName) {
    const query = `SELECT * FROM "${tableName}" ORDER BY id`;
    const result = await client.query(query);
    return result.rows;
  }

  recordsAreDifferent(record1, record2) {
    // Comparar registros excluyendo timestamps automáticos
    const excludeFields = ['created_at', 'updated_at', 'fecha_creacion', 'fecha_registro'];
    
    for (const [key, value] of Object.entries(record1)) {
      if (excludeFields.includes(key)) continue;
      
      if (record2[key] !== value) {
        return true;
      }
    }
    
    return false;
  }

  async insertRecord(client, tableName, record) {
    const columns = Object.keys(record);
    const values = Object.values(record);
    const placeholders = values.map((_, index) => `$${index + 1}`);
    
    const query = `
      INSERT INTO "${tableName}" (${columns.map(col => `"${col}"`).join(', ')})
      VALUES (${placeholders.join(', ')})
    `;
    
    await client.query(query, values);
  }

  async updateRecord(client, tableName, record) {
    const id = record.id;
    const updateFields = { ...record };
    delete updateFields.id; // No actualizar el ID
    
    const columns = Object.keys(updateFields);
    const values = Object.values(updateFields);
    const setClause = columns.map((col, index) => `"${col}" = $${index + 1}`).join(', ');
    
    const query = `
      UPDATE "${tableName}" 
      SET ${setClause}
      WHERE id = $${values.length + 1}
    `;
    
    await client.query(query, [...values, id]);
  }

  async syncCategorias() {
    this.logMessage('🏷️ Sincronizando categorías (LOCAL → PROD)...');
    
    try {
      const localClient = await this.localPool.connect();
      const prodClient = await this.prodPool.connect();

      // Obtener categorías de LOCAL
      const localCategorias = await localClient.query(`
        SELECT * FROM categorias 
        ORDER BY id
      `);
      localClient.release();

      let inserted = 0;
      let updated = 0;

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
      this.logMessage(`✅ Categorías sincronizadas: ${inserted} insertadas, ${updated} actualizadas`);

    } catch (error) {
      this.logError(error, 'Error sincronizando categorías');
    }
  }

  async syncEntradaCategorias() {
    this.logMessage('🔗 Sincronizando entrada_categorias (LOCAL → PROD)...');
    
    try {
      const localClient = await this.localPool.connect();
      const prodClient = await this.prodPool.connect();

      // Verificar si la tabla existe en PROD
      const tableExists = await prodClient.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_name = 'entrada_categorias'
        );
      `);

      if (!tableExists.rows[0].exists) {
        // Crear tabla en PROD
        await prodClient.query(`
          CREATE TABLE entrada_categorias (
            id SERIAL PRIMARY KEY,
            entrada_id INTEGER NOT NULL,
            categoria_id INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(entrada_id, categoria_id)
          );
        `);
        this.logMessage('✅ Tabla entrada_categorias creada en PROD');
      }

      // Obtener datos de LOCAL
      const localData = await localClient.query(`
        SELECT * FROM entrada_categorias ORDER BY id
      `);
      localClient.release();

      let inserted = 0;

      for (const record of localData.rows) {
        try {
          await prodClient.query(`
            INSERT INTO entrada_categorias (entrada_id, categoria_id, created_at)
            VALUES ($1, $2, $3)
            ON CONFLICT (entrada_id, categoria_id) DO NOTHING
          `, [record.entrada_id, record.categoria_id, record.created_at]);
          inserted++;
        } catch (error) {
          this.logError(error, `Error insertando entrada_categorias ID ${record.id}`);
        }
      }

      prodClient.release();
      this.logMessage(`✅ entrada_categorias sincronizada: ${inserted} registros insertados`);

    } catch (error) {
      this.logError(error, 'Error sincronizando entrada_categorias');
    }
  }

  async syncAllData() {
    this.logMessage('🚀 Iniciando sincronización de datos LOCAL → PROD...');
    
    const startTime = Date.now();

    try {
      // Sincronizar categorías (tabla crítica)
      await this.syncCategorias();

      // Sincronizar entrada_categorias (tabla faltante)
      await this.syncEntradaCategorias();

      // Sincronizar otras tablas con diferencias menores
      const otherTables = ['entradas', 'citas'];
      
      for (const tableName of otherTables) {
        await this.syncTableData(tableName);
      }

      const duration = Date.now() - startTime;
      this.logMessage(`✅ Sincronización completada en ${duration}ms`);
      this.logMessage(`📊 Estadísticas: ${this.stats.tablesProcessed} tablas, ${this.stats.recordsInserted} insertados, ${this.stats.recordsUpdated} actualizados`);

      return this.stats;

    } catch (error) {
      this.logError(error, 'Error en sincronización general');
      return this.stats;
    }
  }

  async generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      syncType: 'LOCAL_TO_PROD',
      summary: {
        tablesProcessed: this.stats.tablesProcessed,
        recordsInserted: this.stats.recordsInserted,
        recordsUpdated: this.stats.recordsUpdated,
        recordsSkipped: this.stats.recordsSkipped,
        errors: this.stats.errors,
        success: this.stats.errors === 0
      },
      logs: this.log,
      errors: this.errors
    };

    const reportPath = path.join(__dirname, 'local-to-prod-sync-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    this.logMessage(`📄 Reporte generado: ${reportPath}`);
    return reportPath;
  }

  async run() {
    try {
      this.logMessage('🚀 Iniciando sincronización LOCAL → PROD...');

      // Conectar a las bases de datos
      const connected = await this.connect();
      if (!connected) {
        throw new Error('No se pudo conectar a las bases de datos');
      }

      // Ejecutar sincronización
      const results = await this.syncAllData();

      // Generar reporte
      const reportPath = await this.generateReport();

      this.logMessage('✅ Proceso completado exitosamente');
      return { success: true, results, reportPath };

    } catch (error) {
      this.logError(error, 'Error fatal en el proceso');
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
  const sync = new LocalToProdSync();
  sync.run()
    .then(result => {
      if (result.success) {
        console.log('🎉 Sincronización LOCAL → PROD completada');
        console.log(`📊 Registros insertados: ${result.results.recordsInserted}`);
        console.log(`📊 Registros actualizados: ${result.results.recordsUpdated}`);
        console.log(`📄 Reporte: ${result.reportPath}`);
      } else {
        console.error('💥 Error en la sincronización:', result.error);
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('💥 Error fatal:', error.message);
      process.exit(1);
    });
}

module.exports = LocalToProdSync;