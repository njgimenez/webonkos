const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Importar los scripts individuales
const DatabaseStructureSync = require('./sync-database-structure');
const LocalToProdSync = require('./sync-data-local-to-prod');
const ProdToLocalSync = require('./sync-data-prod-to-local');

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

class CompleteDatabaseSync {
  constructor() {
    this.log = [];
    this.errors = [];
    this.results = {
      structure: null,
      localToProd: null,
      prodToLocal: null,
      validation: null
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
  }

  async createBackup() {
    this.logMessage('💾 Creando respaldos de seguridad...');
    
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupDir = path.join(__dirname, 'backups', `sync-${timestamp}`);
      
      // Crear directorio de respaldo
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }

      // Crear respaldo de LOCAL
      this.logMessage('📦 Creando respaldo de LOCAL...');
      const localBackup = await this.createDatabaseBackup('local', backupDir);
      
      // Crear respaldo de PROD
      this.logMessage('📦 Creando respaldo de PROD...');
      const prodBackup = await this.createDatabaseBackup('prod', backupDir);

      this.logMessage(`✅ Respaldos creados en: ${backupDir}`);
      return { backupDir, localBackup, prodBackup };

    } catch (error) {
      this.logError(error, 'Error creando respaldos');
      throw error;
    }
  }

  async createDatabaseBackup(type, backupDir) {
    const config = type === 'local' ? localConfig : prodConfig;
    const pool = new Pool(config);
    
    try {
      const client = await pool.connect();
      
      // Obtener lista de tablas
      const tablesResult = await client.query(`
        SELECT tablename FROM pg_tables 
        WHERE schemaname = 'public' 
        ORDER BY tablename
      `);
      
      const tables = tablesResult.rows.map(row => row.tablename);
      const backupData = {};

      // Exportar datos de cada tabla
      for (const tableName of tables) {
        const dataResult = await client.query(`SELECT * FROM "${tableName}"`);
        backupData[tableName] = dataResult.rows;
      }

      client.release();
      await pool.end();

      // Guardar respaldo
      const backupFile = path.join(backupDir, `${type}-backup.json`);
      fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));
      
      this.logMessage(`✅ Respaldo ${type} guardado: ${backupFile}`);
      return backupFile;

    } catch (error) {
      await pool.end();
      throw error;
    }
  }

  async validateSync() {
    this.logMessage('🔍 Validando sincronización...');
    
    try {
      const localPool = new Pool(localConfig);
      const prodPool = new Pool(prodConfig);

      const validation = {
        tablesValidated: 0,
        mismatches: [],
        success: true
      };

      // Obtener lista de tablas de ambas bases
      const localClient = await localPool.connect();
      const prodClient = await prodPool.connect();

      const localTables = await localClient.query(`
        SELECT tablename FROM pg_tables 
        WHERE schemaname = 'public' 
        ORDER BY tablename
      `);

      const prodTables = await prodClient.query(`
        SELECT tablename FROM pg_tables 
        WHERE schemaname = 'public' 
        ORDER BY tablename
      `);

      const allTables = [...new Set([
        ...localTables.rows.map(r => r.tablename),
        ...prodTables.rows.map(r => r.tablename)
      ])];

      // Validar cada tabla
      for (const tableName of allTables) {
        try {
          const localCount = await this.getTableCount(localClient, tableName);
          const prodCount = await this.getTableCount(prodClient, tableName);
          
          validation.tablesValidated++;
          
          if (localCount !== prodCount) {
            validation.mismatches.push({
              table: tableName,
              localCount,
              prodCount,
              difference: Math.abs(localCount - prodCount)
            });
            validation.success = false;
            this.logMessage(`⚠️ ${tableName}: LOCAL=${localCount}, PROD=${prodCount}`);
          } else {
            this.logMessage(`✅ ${tableName}: ${localCount} registros (sincronizado)`);
          }
        } catch (error) {
          this.logError(error, `Error validando tabla ${tableName}`);
        }
      }

      localClient.release();
      prodClient.release();
      await localPool.end();
      await prodPool.end();

      this.logMessage(`🔍 Validación completada: ${validation.tablesValidated} tablas, ${validation.mismatches.length} diferencias`);
      return validation;

    } catch (error) {
      this.logError(error, 'Error en validación');
      return { success: false, error: error.message };
    }
  }

  async getTableCount(client, tableName) {
    try {
      const result = await client.query(`SELECT COUNT(*) as count FROM "${tableName}"`);
      return parseInt(result.rows[0].count);
    } catch (error) {
      return 0; // Tabla no existe
    }
  }

  async runCompleteSync() {
    const startTime = Date.now();
    this.logMessage('🚀 Iniciando sincronización completa de bases de datos...');

    try {
      // Fase 1: Crear respaldos
      this.logMessage('\n📋 FASE 1: Creando respaldos de seguridad');
      const backup = await this.createBackup();

      // Fase 2: Sincronizar estructura
      this.logMessage('\n📋 FASE 2: Sincronizando estructura de tablas');
      const structureSync = new DatabaseStructureSync();
      this.results.structure = await structureSync.run();

      if (!this.results.structure.success) {
        throw new Error('Error en sincronización de estructura');
      }

      // Fase 3: Sincronizar datos LOCAL → PROD
      this.logMessage('\n📋 FASE 3: Sincronizando datos LOCAL → PROD');
      const localToProdSync = new LocalToProdSync();
      this.results.localToProd = await localToProdSync.run();

      if (!this.results.localToProd.success) {
        throw new Error('Error en sincronización LOCAL → PROD');
      }

      // Fase 4: Sincronizar datos PROD → LOCAL
      this.logMessage('\n📋 FASE 4: Sincronizando datos PROD → LOCAL');
      const prodToLocalSync = new ProdToLocalSync();
      this.results.prodToLocal = await prodToLocalSync.run();

      if (!this.results.prodToLocal.success) {
        throw new Error('Error en sincronización PROD → LOCAL');
      }

      // Fase 5: Validar sincronización
      this.logMessage('\n📋 FASE 5: Validando sincronización');
      this.results.validation = await this.validateSync();

      const duration = Date.now() - startTime;
      this.logMessage(`\n✅ Sincronización completa finalizada en ${duration}ms`);

      // Generar reporte final
      await this.generateFinalReport(backup);

      return {
        success: true,
        duration,
        results: this.results,
        backup
      };

    } catch (error) {
      this.logError(error, 'Error en sincronización completa');
      await this.generateFinalReport();
      return { success: false, error: error.message };
    }
  }

  async generateFinalReport(backup = null) {
    const report = {
      timestamp: new Date().toISOString(),
      syncType: 'COMPLETE_BIDIRECTIONAL',
      summary: {
        structureSync: this.results.structure?.success || false,
        localToProdSync: this.results.localToProd?.success || false,
        prodToLocalSync: this.results.prodToLocal?.success || false,
        validation: this.results.validation?.success || false,
        overallSuccess: this.results.structure?.success && 
                       this.results.localToProd?.success && 
                       this.results.prodToLocal?.success && 
                       this.results.validation?.success,
        totalErrors: this.errors.length
      },
      phases: {
        structure: this.results.structure,
        localToProd: this.results.localToProd,
        prodToLocal: this.results.prodToLocal,
        validation: this.results.validation
      },
      backup: backup,
      logs: this.log,
      errors: this.errors
    };

    const reportPath = path.join(__dirname, 'complete-sync-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    this.logMessage(`📄 Reporte final generado: ${reportPath}`);
    return reportPath;
  }

  async run() {
    try {
      return await this.runCompleteSync();
    } catch (error) {
      this.logError(error, 'Error fatal en sincronización completa');
      return { success: false, error: error.message };
    }
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  const sync = new CompleteDatabaseSync();
  sync.run()
    .then(result => {
      if (result.success) {
        console.log('\n🎉 ¡Sincronización completa exitosa!');
        console.log(`⏱️ Duración total: ${result.duration}ms`);
        console.log(`📊 Estructura: ${result.results.structure?.success ? '✅' : '❌'}`);
        console.log(`📊 LOCAL→PROD: ${result.results.localToProd?.success ? '✅' : '❌'}`);
        console.log(`📊 PROD→LOCAL: ${result.results.prodToLocal?.success ? '✅' : '❌'}`);
        console.log(`📊 Validación: ${result.results.validation?.success ? '✅' : '❌'}`);
        console.log(`💾 Respaldos: ${result.backup?.backupDir}`);
      } else {
        console.error('\n💥 Error en sincronización completa:', result.error);
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\n💥 Error fatal:', error.message);
      process.exit(1);
    });
}

module.exports = CompleteDatabaseSync;