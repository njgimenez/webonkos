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

class ProdToLocalSync {
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

      // Obtener datos de PROD
      const prodData = await this.getTableData(prodClient, tableName);
      prodClient.release();

      if (prodData.length === 0) {
        this.logMessage(`⚠️ ${tableName}: No hay datos en PROD`);
        localClient.release();
        return { success: true, recordsProcessed: 0 };
      }

      // Obtener datos existentes en LOCAL
      const localData = await this.getTableData(localClient, tableName);
      const localDataMap = new Map(localData.map(record => [record.id, record]));

      let recordsProcessed = 0;
      let recordsInserted = 0;
      let recordsUpdated = 0;
      let recordsSkipped = 0;

      // Procesar cada registro de PROD
      for (const prodRecord of prodData) {
        try {
          const recordId = prodRecord.id;
          const localRecord = localDataMap.get(recordId);

          if (!localRecord) {
            // Insertar nuevo registro
            await this.insertRecord(localClient, tableName, prodRecord);
            recordsInserted++;
            this.logMessage(`➕ ${tableName}: Insertado registro ID ${recordId}`);
          } else {
            // Verificar si necesita actualización
            if (this.recordsAreDifferent(prodRecord, localRecord)) {
              await this.updateRecord(localClient, tableName, prodRecord);
              recordsUpdated++;
              this.logMessage(`🔄 ${tableName}: Actualizado registro ID ${recordId}`);
            } else {
              recordsSkipped++;
              this.logMessage(`⏭️ ${tableName}: Registro ID ${recordId} sin cambios`);
            }
          }

          recordsProcessed++;

        } catch (error) {
          this.logError(error, `Error procesando registro ID ${prodRecord.id} en ${tableName}`);
        }
      }

      localClient.release();

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

  async syncPacientes() {
    this.logMessage('👥 Sincronizando pacientes (PROD → LOCAL)...');
    
    try {
      const localClient = await this.localPool.connect();
      const prodClient = await this.prodPool.connect();

      // Obtener pacientes de PROD
      const prodPacientes = await prodClient.query(`
        SELECT * FROM pacientes 
        ORDER BY id
      `);
      prodClient.release();

      let inserted = 0;
      let updated = 0;

      for (const paciente of prodPacientes.rows) {
        try {
          // Verificar si existe en LOCAL
          const existing = await localClient.query(
            'SELECT id FROM pacientes WHERE id = $1',
            [paciente.id]
          );

          if (existing.rows.length === 0) {
            // Insertar nuevo paciente
            await localClient.query(`
              INSERT INTO pacientes (id, nombre, dni, telefono, correo, fecha_nacimiento, 
                                   estado_vital, fecha_registro, estado, tipo_documento, numero_documento)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            `, [
              paciente.id, paciente.nombre, paciente.dni, paciente.telefono, paciente.correo,
              paciente.fecha_nacimiento, paciente.estado_vital, paciente.fecha_registro,
              paciente.estado, paciente.tipo_documento, paciente.numero_documento
            ]);
            inserted++;
            this.logMessage(`➕ Paciente insertado: ${paciente.nombre}`);
          } else {
            // Actualizar paciente existente
            await localClient.query(`
              UPDATE pacientes SET 
                nombre = $2, dni = $3, telefono = $4, correo = $5,
                fecha_nacimiento = $6, estado_vital = $7, fecha_registro = $8,
                estado = $9, tipo_documento = $10, numero_documento = $11
              WHERE id = $1
            `, [
              paciente.id, paciente.nombre, paciente.dni, paciente.telefono, paciente.correo,
              paciente.fecha_nacimiento, paciente.estado_vital, paciente.fecha_registro,
              paciente.estado, paciente.tipo_documento, paciente.numero_documento
            ]);
            updated++;
            this.logMessage(`🔄 Paciente actualizado: ${paciente.nombre}`);
          }
        } catch (error) {
          this.logError(error, `Error procesando paciente ${paciente.nombre}`);
        }
      }

      localClient.release();
      this.logMessage(`✅ Pacientes sincronizados: ${inserted} insertados, ${updated} actualizados`);

    } catch (error) {
      this.logError(error, 'Error sincronizando pacientes');
    }
  }

  async syncMedia() {
    this.logMessage('📁 Sincronizando media (PROD → LOCAL)...');
    
    try {
      const localClient = await this.localPool.connect();
      const prodClient = await this.prodPool.connect();

      // Obtener media de PROD
      const prodMedia = await prodClient.query(`
        SELECT * FROM media 
        ORDER BY id
      `);
      prodClient.release();

      let inserted = 0;
      let updated = 0;

      for (const media of prodMedia.rows) {
        try {
          // Verificar si existe en LOCAL
          const existing = await localClient.query(
            'SELECT id FROM media WHERE id = $1',
            [media.id]
          );

          if (existing.rows.length === 0) {
            // Insertar nuevo media
            await localClient.query(`
              INSERT INTO media (id, nombre_archivo, nombre_original, tipo_mime, tamaño_bytes, 
                               url, alt_text, uploaded_by, created_at)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            `, [
              media.id, media.nombre_archivo, media.nombre_original, media.tipo_mime,
              media.tamaño_bytes, media.url, media.alt_text, media.uploaded_by, media.created_at
            ]);
            inserted++;
            this.logMessage(`➕ Media insertado: ${media.nombre_original}`);
          } else {
            // Actualizar media existente
            await localClient.query(`
              UPDATE media SET 
                nombre_archivo = $2, nombre_original = $3, tipo_mime = $4, tamaño_bytes = $5,
                url = $6, alt_text = $7, uploaded_by = $8, created_at = $9
              WHERE id = $1
            `, [
              media.id, media.nombre_archivo, media.nombre_original, media.tipo_mime,
              media.tamaño_bytes, media.url, media.alt_text, media.uploaded_by, media.created_at
            ]);
            updated++;
            this.logMessage(`🔄 Media actualizado: ${media.nombre_original}`);
          }
        } catch (error) {
          this.logError(error, `Error procesando media ${media.nombre_original}`);
        }
      }

      localClient.release();
      this.logMessage(`✅ Media sincronizado: ${inserted} insertados, ${updated} actualizados`);

    } catch (error) {
      this.logError(error, 'Error sincronizando media');
    }
  }

  async syncCitas() {
    this.logMessage('📅 Sincronizando citas (PROD → LOCAL)...');
    
    try {
      const localClient = await this.localPool.connect();
      const prodClient = await this.prodPool.connect();

      // Obtener citas de PROD
      const prodCitas = await prodClient.query(`
        SELECT * FROM citas 
        ORDER BY id
      `);
      prodClient.release();

      let inserted = 0;
      let updated = 0;

      for (const cita of prodCitas.rows) {
        try {
          // Verificar si existe en LOCAL
          const existing = await localClient.query(
            'SELECT id FROM citas WHERE id = $1',
            [cita.id]
          );

          if (existing.rows.length === 0) {
            // Insertar nueva cita
            await localClient.query(`
              INSERT INTO citas (id, paciente_id, medico_id, fecha, motivo, estado, 
                               observaciones, duracion, fecha_creacion)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            `, [
              cita.id, cita.paciente_id, cita.medico_id, cita.fecha, cita.motivo,
              cita.estado, cita.observaciones, cita.duracion, cita.fecha_creacion
            ]);
            inserted++;
            this.logMessage(`➕ Cita insertada: ID ${cita.id}`);
          } else {
            // Actualizar cita existente
            await localClient.query(`
              UPDATE citas SET 
                paciente_id = $2, medico_id = $3, fecha = $4, motivo = $5,
                estado = $6, observaciones = $7, duracion = $8, fecha_creacion = $9
              WHERE id = $1
            `, [
              cita.id, cita.paciente_id, cita.medico_id, cita.fecha, cita.motivo,
              cita.estado, cita.observaciones, cita.duracion, cita.fecha_creacion
            ]);
            updated++;
            this.logMessage(`🔄 Cita actualizada: ID ${cita.id}`);
          }
        } catch (error) {
          this.logError(error, `Error procesando cita ID ${cita.id}`);
        }
      }

      localClient.release();
      this.logMessage(`✅ Citas sincronizadas: ${inserted} insertadas, ${updated} actualizadas`);

    } catch (error) {
      this.logError(error, 'Error sincronizando citas');
    }
  }

  async syncAllData() {
    this.logMessage('🚀 Iniciando sincronización de datos PROD → LOCAL...');
    
    const startTime = Date.now();

    try {
      // Sincronizar pacientes (mayor diferencia: 36 vs 11)
      await this.syncPacientes();

      // Sincronizar media (mayor diferencia: 167 vs 96)
      await this.syncMedia();

      // Sincronizar citas (diferencia: 21 vs 17)
      await this.syncCitas();

      // Sincronizar entradas (diferencia menor: 49 vs 56)
      await this.syncTableData('entradas');

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
      syncType: 'PROD_TO_LOCAL',
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

    const reportPath = path.join(__dirname, 'prod-to-local-sync-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    this.logMessage(`📄 Reporte generado: ${reportPath}`);
    return reportPath;
  }

  async run() {
    try {
      this.logMessage('🚀 Iniciando sincronización PROD → LOCAL...');

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
  const sync = new ProdToLocalSync();
  sync.run()
    .then(result => {
      if (result.success) {
        console.log('🎉 Sincronización PROD → LOCAL completada');
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

module.exports = ProdToLocalSync;