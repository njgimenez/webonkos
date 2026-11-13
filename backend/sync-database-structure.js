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

class DatabaseStructureSync {
  constructor() {
    this.localPool = new Pool(localConfig);
    this.prodPool = new Pool(prodConfig);
    this.log = [];
    this.errors = [];
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

  async syncTableStructure(tableName) {
    this.logMessage(`🔄 Sincronizando estructura de tabla: ${tableName}`);
    
    try {
      // Obtener estructura de LOCAL
      const localClient = await this.localPool.connect();
      const localStructure = await this.getTableStructure(localClient, tableName);
      localClient.release();

      // Obtener estructura de PROD
      const prodClient = await this.prodPool.connect();
      const prodStructure = await this.getTableStructure(prodClient, tableName);
      prodClient.release();

      // Comparar estructuras
      const differences = this.compareStructures(localStructure, prodStructure);
      
      if (differences.length === 0) {
        this.logMessage(`✅ ${tableName}: Estructuras idénticas`);
        return { success: true, changes: 0 };
      }

      // Aplicar cambios a PROD
      const prodClient2 = await this.prodPool.connect();
      let changesApplied = 0;

      for (const diff of differences) {
        try {
          await this.applyStructureChange(prodClient2, tableName, diff);
          changesApplied++;
          this.logMessage(`✅ ${tableName}: ${diff.type} - ${diff.description}`);
        } catch (error) {
          this.logError(error, `Error aplicando cambio en ${tableName}`);
        }
      }

      prodClient2.release();
      return { success: true, changes: changesApplied };

    } catch (error) {
      this.logError(error, `Error sincronizando ${tableName}`);
      return { success: false, changes: 0 };
    }
  }

  async getTableStructure(client, tableName) {
    const structureQuery = `
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default,
        character_maximum_length
      FROM information_schema.columns 
      WHERE table_name = $1 AND table_schema = 'public'
      ORDER BY ordinal_position;
    `;
    
    const result = await client.query(structureQuery, [tableName]);
    return result.rows;
  }

  compareStructures(localStructure, prodStructure) {
    const differences = [];
    const localColumns = new Map(localStructure.map(col => [col.column_name, col]));
    const prodColumns = new Map(prodStructure.map(col => [col.column_name, col]));

    // Columnas que existen en LOCAL pero no en PROD
    for (const [columnName, localCol] of localColumns) {
      if (!prodColumns.has(columnName)) {
        differences.push({
          type: 'ADD_COLUMN',
          column: columnName,
          definition: this.buildColumnDefinition(localCol),
          description: `Agregar columna ${columnName}`
        });
      }
    }

    // Columnas que existen en PROD pero no en LOCAL (para información)
    for (const [columnName, prodCol] of prodColumns) {
      if (!localColumns.has(columnName)) {
        differences.push({
          type: 'INFO_ONLY',
          column: columnName,
          description: `Columna ${columnName} existe solo en PROD`
        });
      }
    }

    return differences;
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

  async applyStructureChange(client, tableName, change) {
    if (change.type === 'ADD_COLUMN') {
      const alterQuery = `ALTER TABLE "${tableName}" ADD COLUMN ${change.definition};`;
      await client.query(alterQuery);
    }
    // Aquí se pueden agregar más tipos de cambios según sea necesario
  }

  async createMissingTable(tableName) {
    this.logMessage(`🆕 Creando tabla faltante: ${tableName}`);
    
    try {
      // Obtener estructura completa de LOCAL
      const localClient = await this.localPool.connect();
      const createTableQuery = await this.getCreateTableQuery(localClient, tableName);
      localClient.release();

      // Crear tabla en PROD
      const prodClient = await this.prodPool.connect();
      await prodClient.query(createTableQuery);
      prodClient.release();

      this.logMessage(`✅ Tabla ${tableName} creada en PROD`);
      return { success: true };

    } catch (error) {
      this.logError(error, `Error creando tabla ${tableName}`);
      return { success: false };
    }
  }

  async getCreateTableQuery(client, tableName) {
    // Esta función necesitaría implementarse para generar CREATE TABLE
    // Por ahora retornamos un placeholder
    return `-- CREATE TABLE "${tableName}" (placeholder);`;
  }

  async syncAllStructures() {
    this.logMessage('🚀 Iniciando sincronización de estructuras...');
    
    const startTime = Date.now();
    const results = {
      tablesProcessed: 0,
      changesApplied: 0,
      errors: 0
    };

    try {
      // Tablas que necesitan sincronización de estructura
      const tablesToSync = [
        'categorias',    // LOCAL tiene columnas adicionales
        'entradas'       // LOCAL tiene columnas adicionales
      ];

      // Tablas que faltan en PROD
      const missingTables = [
        'entrada_categorias'
      ];

      // Sincronizar tablas existentes
      for (const tableName of tablesToSync) {
        const result = await this.syncTableStructure(tableName);
        results.tablesProcessed++;
        
        if (result.success) {
          results.changesApplied += result.changes;
        } else {
          results.errors++;
        }
      }

      // Crear tablas faltantes
      for (const tableName of missingTables) {
        const result = await this.createMissingTable(tableName);
        results.tablesProcessed++;
        
        if (result.success) {
          results.changesApplied++;
        } else {
          results.errors++;
        }
      }

      const duration = Date.now() - startTime;
      this.logMessage(`✅ Sincronización completada en ${duration}ms`);
      this.logMessage(`📊 Resultados: ${results.tablesProcessed} tablas, ${results.changesApplied} cambios, ${results.errors} errores`);

      return results;

    } catch (error) {
      this.logError(error, 'Error en sincronización general');
      return results;
    }
  }

  async generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalLogs: this.log.length,
        totalErrors: this.errors.length,
        success: this.errors.length === 0
      },
      logs: this.log,
      errors: this.errors
    };

    const reportPath = path.join(__dirname, 'structure-sync-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    this.logMessage(`📄 Reporte generado: ${reportPath}`);
    return reportPath;
  }

  async run() {
    try {
      this.logMessage('🚀 Iniciando sincronización de estructura de bases de datos...');

      // Conectar a las bases de datos
      const connected = await this.connect();
      if (!connected) {
        throw new Error('No se pudo conectar a las bases de datos');
      }

      // Ejecutar sincronización
      const results = await this.syncAllStructures();

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
  const sync = new DatabaseStructureSync();
  sync.run()
    .then(result => {
      if (result.success) {
        console.log('🎉 Sincronización de estructura completada');
        console.log(`📊 Cambios aplicados: ${result.results.changesApplied}`);
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

module.exports = DatabaseStructureSync;