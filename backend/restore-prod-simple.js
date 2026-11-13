const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Configuración de conexión a PROD
const prodConfig = {
  connectionString: 'postgresql://onkos_user:SCef59zkV9OEYV1zSGXla0wDUA3wUVSA@dpg-d2rnp815pdvs73e0eisg-a.oregon-postgres.render.com/onkosdb',
  ssl: { rejectUnauthorized: false }
};

class ProdRestoreSimple {
  constructor() {
    this.log = [];
    this.errors = [];
    this.backupPath = path.join(__dirname, 'backups', 'backup-2025-09-15T20-41-35-377Z');
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
  }

  async connect() {
    try {
      this.logMessage('🔌 Conectando a base de datos PROD...');
      
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

  async loadOriginalData() {
    this.logMessage('📄 Cargando datos originales desde respaldo...');
    
    try {
      const prodDataFile = path.join(this.backupPath, 'prod-data.json');
      
      if (!fs.existsSync(prodDataFile)) {
        throw new Error(`Archivo de datos no encontrado: ${prodDataFile}`);
      }

      const data = JSON.parse(fs.readFileSync(prodDataFile, 'utf8'));
      this.logMessage(`📊 Datos originales cargados: ${Object.keys(data).length} tablas`);
      
      return data;

    } catch (error) {
      this.logError(error, 'Error cargando datos originales');
      throw error;
    }
  }

  async clearTableData(tableName) {
    try {
      const prodClient = await this.prodPool.connect();
      
      // Verificar si la tabla existe
      const tableExists = await prodClient.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_name = $1
        );
      `, [tableName]);

      if (!tableExists.rows[0].exists) {
        this.logMessage(`⚠️ Tabla ${tableName} no existe, omitiendo`);
        prodClient.release();
        return;
      }

      // Limpiar tabla
      await prodClient.query(`DELETE FROM "${tableName}";`);
      this.logMessage(`✅ Tabla ${tableName} limpiada`);
      
      prodClient.release();

    } catch (error) {
      this.logError(error, `Error limpiando tabla ${tableName}`);
    }
  }

  async restoreTableData(tableName, records) {
    if (!records || records.length === 0) {
      this.logMessage(`⚠️ Tabla ${tableName} sin datos, omitiendo`);
      return;
    }

    try {
      const prodClient = await this.prodPool.connect();

      // Verificar si la tabla existe
      const tableExists = await prodClient.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_name = $1
        );
      `, [tableName]);

      if (!tableExists.rows[0].exists) {
        this.logMessage(`⚠️ Tabla ${tableName} no existe, omitiendo`);
        prodClient.release();
        return;
      }

      // Obtener estructura de la tabla
      const columnsResult = await prodClient.query(`
        SELECT column_name, data_type
        FROM information_schema.columns 
        WHERE table_name = $1 AND table_schema = 'public'
        ORDER BY ordinal_position
      `, [tableName]);

      const availableColumns = columnsResult.rows.map(row => row.column_name);
      this.logMessage(`📋 Tabla ${tableName}: ${availableColumns.length} columnas disponibles`);

      let inserted = 0;
      let skipped = 0;

      for (const record of records) {
        try {
          // Filtrar solo las columnas que existen en la tabla
          const filteredRecord = {};
          for (const [key, value] of Object.entries(record)) {
            if (availableColumns.includes(key)) {
              filteredRecord[key] = value;
            }
          }

          const columns = Object.keys(filteredRecord);
          const values = Object.values(filteredRecord);
          const placeholders = values.map((_, index) => `$${index + 1}`);
          
          const insertQuery = `
            INSERT INTO "${tableName}" (${columns.map(col => `"${col}"`).join(', ')})
            VALUES (${placeholders.join(', ')})
            ON CONFLICT (id) DO UPDATE SET
            ${columns.filter(col => col !== 'id').map(col => `"${col}" = EXCLUDED."${col}"`).join(', ')}
          `;
          
          await prodClient.query(insertQuery, values);
          inserted++;

        } catch (error) {
          this.logError(error, `Error insertando registro en ${tableName}`);
          skipped++;
        }
      }

      prodClient.release();
      this.logMessage(`✅ ${tableName}: ${inserted} registros restaurados, ${skipped} omitidos`);

    } catch (error) {
      this.logError(error, `Error restaurando tabla ${tableName}`);
    }
  }

  async restoreProdDatabase() {
    this.logMessage('🔄 Restaurando base de datos PROD...');
    
    try {
      // Cargar datos originales
      const originalData = await this.loadOriginalData();

      // Orden de restauración (respetando dependencias)
      const restoreOrder = [
        'categorias',
        'especialidades', 
        'medicos',
        'pacientes',
        'media',
        'entradas',
        'citas',
        'entrada_categorias',
        'menu_items',
        'roles',
        'usuarios',
        'usuario_rol',
        'permisos',
        'rol_permiso',
        'centro_medico',
        'historial_citas',
        'horarios_medicos'
      ];

      // Limpiar y restaurar cada tabla
      for (const tableName of restoreOrder) {
        if (originalData[tableName]) {
          this.logMessage(`🔄 Procesando tabla: ${tableName}`);
          
          // Limpiar tabla
          await this.clearTableData(tableName);
          
          // Restaurar datos
          await this.restoreTableData(tableName, originalData[tableName]);
        }
      }

      this.logMessage('✅ Restauración de base de datos PROD completada');

    } catch (error) {
      this.logError(error, 'Error restaurando base de datos PROD');
      throw error;
    }
  }

  async verifyRestoration() {
    this.logMessage('🔍 Verificando restauración...');
    
    try {
      const prodClient = await this.prodPool.connect();

      // Obtener conteos de tablas principales
      const tables = ['categorias', 'entradas', 'pacientes', 'media', 'citas'];
      const counts = {};

      for (const tableName of tables) {
        try {
          const result = await prodClient.query(`SELECT COUNT(*) as count FROM "${tableName}"`);
          counts[tableName] = parseInt(result.rows[0].count);
          this.logMessage(`📊 ${tableName}: ${counts[tableName]} registros`);
        } catch (error) {
          this.logMessage(`⚠️ No se pudo contar ${tableName}: ${error.message}`, 'WARNING');
          counts[tableName] = 0;
        }
      }

      prodClient.release();

      // Verificar que los conteos coincidan con el estado original esperado
      const expectedCounts = {
        categorias: 5,      // Estado original de PROD
        entradas: 49,       // Estado original de PROD
        pacientes: 36,      // Estado original de PROD
        media: 167,         // Estado original de PROD
        citas: 21           // Estado original de PROD
      };

      let matches = 0;
      let differences = 0;

      for (const [table, count] of Object.entries(counts)) {
        const expected = expectedCounts[table];
        if (expected !== undefined) {
          if (count === expected) {
            matches++;
            this.logMessage(`✅ ${table}: ${count} (esperado: ${expected})`);
          } else {
            differences++;
            this.logMessage(`⚠️ ${table}: ${count} (esperado: ${expected})`, 'WARNING');
          }
        }
      }

      this.logMessage(`📊 Verificación: ${matches} coincidencias, ${differences} diferencias`);

      return { counts, matches, differences };

    } catch (error) {
      this.logError(error, 'Error verificando restauración');
      return { counts: {}, matches: 0, differences: 0 };
    }
  }

  async generateReport(verification) {
    const report = {
      timestamp: new Date().toISOString(),
      restoreType: 'PROD_TO_ORIGINAL_STATE_SIMPLE',
      backupUsed: this.backupPath,
      verification: verification,
      summary: {
        success: verification.differences === 0,
        tablesRestored: Object.keys(verification.counts).length,
        matches: verification.matches,
        differences: verification.differences
      },
      logs: this.log,
      errors: this.errors
    };

    const reportPath = path.join(__dirname, 'prod-restore-simple-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    this.logMessage(`📄 Reporte de restauración generado: ${reportPath}`);
    return reportPath;
  }

  async run() {
    try {
      this.logMessage('🚀 Iniciando restauración simple de PROD a estado original...');
      
      const startTime = Date.now();

      // Inicializar pool de conexión
      this.prodPool = new Pool(prodConfig);

      // Conectar a la base de datos
      const connected = await this.connect();
      if (!connected) {
        throw new Error('No se pudo conectar a la base de datos PROD');
      }

      // Restaurar base de datos
      await this.restoreProdDatabase();

      // Verificar restauración
      const verification = await this.verifyRestoration();

      const duration = Date.now() - startTime;
      this.logMessage(`✅ Restauración completada en ${duration}ms`);

      // Generar reporte
      const reportPath = await this.generateReport(verification);

      this.logMessage('✅ Proceso de restauración completado exitosamente');
      return { 
        success: true, 
        duration, 
        verification, 
        reportPath 
      };

    } catch (error) {
      this.logError(error, 'Error fatal en restauración');
      await this.generateReport({ counts: {}, matches: 0, differences: 0 });
      return { success: false, error: error.message };
    } finally {
      if (this.prodPool) {
        await this.prodPool.end();
      }
    }
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  const restore = new ProdRestoreSimple();
  restore.run()
    .then(result => {
      if (result.success) {
        console.log('🎉 Restauración de PROD completada');
        console.log(`⏱️ Duración: ${result.duration}ms`);
        console.log(`📊 Tablas restauradas: ${result.verification.matches}/${Object.keys(result.verification.counts).length}`);
        console.log(`📄 Reporte: ${result.reportPath}`);
      } else {
        console.error('💥 Error en restauración:', result.error);
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('💥 Error fatal:', error.message);
      process.exit(1);
    });
}

module.exports = ProdRestoreSimple;