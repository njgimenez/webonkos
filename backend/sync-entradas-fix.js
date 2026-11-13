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

class EntradasSyncFix {
  constructor() {
    this.localPool = new Pool(localConfig);
    this.prodPool = new Pool(prodConfig);
    this.log = [];
    this.errors = [];
    this.stats = {
      entradasProcessed: 0,
      entradasInserted: 0,
      entradasUpdated: 0,
      entradasSkipped: 0,
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

  async getEntradasStructure() {
    this.logMessage('🏗️ Analizando estructura de tabla entradas...');
    
    try {
      const localClient = await this.localPool.connect();
      const prodClient = await this.prodPool.connect();

      // Obtener estructura de LOCAL
      const localStructure = await localClient.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'entradas' AND table_schema = 'public'
        ORDER BY ordinal_position
      `);

      // Obtener estructura de PROD
      const prodStructure = await prodClient.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'entradas' AND table_schema = 'public'
        ORDER BY ordinal_position
      `);

      localClient.release();
      prodClient.release();

      this.logMessage(`📊 LOCAL tiene ${localStructure.rows.length} columnas`);
      this.logMessage(`📊 PROD tiene ${prodStructure.rows.length} columnas`);

      return {
        local: localStructure.rows,
        prod: prodStructure.rows
      };

    } catch (error) {
      this.logError(error, 'Error analizando estructura');
      return null;
    }
  }

  async syncEntradasFromProdToLocal() {
    this.logMessage('📥 Sincronizando entradas PROD → LOCAL...');
    
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

      let inserted = 0;
      let updated = 0;
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

          this.stats.entradasProcessed++;

        } catch (error) {
          this.logError(error, `Error procesando entrada ${entrada.id}`);
          skipped++;
        }
      }

      localClient.release();
      this.logMessage(`✅ Entradas PROD → LOCAL: ${inserted} insertadas, ${updated} actualizadas, ${skipped} omitidas`);

      this.stats.entradasInserted += inserted;
      this.stats.entradasUpdated += updated;
      this.stats.entradasSkipped += skipped;

    } catch (error) {
      this.logError(error, 'Error sincronizando entradas PROD → LOCAL');
    }
  }

  async syncEntradasFromLocalToProd() {
    this.logMessage('📤 Sincronizando entradas LOCAL → PROD...');
    
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

      let inserted = 0;
      let updated = 0;
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
            this.logMessage(`➕ Entrada insertada: ${entrada.titulo || entrada.id}`);
          } else {
            // Actualizar entrada existente
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
          }

          this.stats.entradasProcessed++;

        } catch (error) {
          this.logError(error, `Error procesando entrada ${entrada.id}`);
          skipped++;
        }
      }

      prodClient.release();
      this.logMessage(`✅ Entradas LOCAL → PROD: ${inserted} insertadas, ${updated} actualizadas, ${skipped} omitidas`);

      this.stats.entradasInserted += inserted;
      this.stats.entradasUpdated += updated;
      this.stats.entradasSkipped += skipped;

    } catch (error) {
      this.logError(error, 'Error sincronizando entradas LOCAL → PROD');
    }
  }

  async syncEntradasBidirectional() {
    this.logMessage('🔄 Iniciando sincronización bidireccional de entradas...');
    
    const startTime = Date.now();

    try {
      // Analizar estructura
      const structure = await this.getEntradasStructure();
      if (!structure) {
        throw new Error('No se pudo analizar la estructura de las tablas');
      }

      // Sincronizar PROD → LOCAL primero
      await this.syncEntradasFromProdToLocal();

      // Sincronizar LOCAL → PROD
      await this.syncEntradasFromLocalToProd();

      const duration = Date.now() - startTime;
      this.logMessage(`✅ Sincronización de entradas completada en ${duration}ms`);
      this.logMessage(`📊 Total: ${this.stats.entradasProcessed} procesadas, ${this.stats.entradasInserted} insertadas, ${this.stats.entradasUpdated} actualizadas`);

      return this.stats;

    } catch (error) {
      this.logError(error, 'Error en sincronización bidireccional');
      return this.stats;
    }
  }

  async generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      syncType: 'ENTRADAS_BIDIRECTIONAL_FIX',
      summary: {
        entradasProcessed: this.stats.entradasProcessed,
        entradasInserted: this.stats.entradasInserted,
        entradasUpdated: this.stats.entradasUpdated,
        entradasSkipped: this.stats.entradasSkipped,
        errors: this.stats.errors,
        success: this.stats.errors === 0
      },
      logs: this.log,
      errors: this.errors
    };

    const reportPath = path.join(__dirname, 'entradas-sync-fix-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    this.logMessage(`📄 Reporte generado: ${reportPath}`);
    return reportPath;
  }

  async run() {
    try {
      this.logMessage('🚀 Iniciando corrección de sincronización de entradas...');

      // Conectar a las bases de datos
      const connected = await this.connect();
      if (!connected) {
        throw new Error('No se pudo conectar a las bases de datos');
      }

      // Ejecutar sincronización
      const results = await this.syncEntradasBidirectional();

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
  const sync = new EntradasSyncFix();
  sync.run()
    .then(result => {
      if (result.success) {
        console.log('🎉 Corrección de entradas completada');
        console.log(`📊 Entradas procesadas: ${result.results.entradasProcessed}`);
        console.log(`📊 Entradas insertadas: ${result.results.entradasInserted}`);
        console.log(`📊 Entradas actualizadas: ${result.results.entradasUpdated}`);
        console.log(`📄 Reporte: ${result.reportPath}`);
      } else {
        console.error('💥 Error en corrección de entradas:', result.error);
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('💥 Error fatal:', error.message);
      process.exit(1);
    });
}

module.exports = EntradasSyncFix;