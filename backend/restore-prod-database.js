const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

// Configuración de conexión a PROD
const prodConfig = {
  connectionString: 'postgresql://onkos_user:SCef59zkV9OEYV1zSGXla0wDUA3wUVSA@dpg-d2rnp815pdvs73e0eisg-a.oregon-postgres.render.com/onkosdb',
  ssl: { rejectUnauthorized: false }
};

class ProdRestore {
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

  async createBackupBeforeRestore() {
    this.logMessage('💾 Creando respaldo de seguridad antes de restaurar...');
    
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupDir = path.join(__dirname, 'backups', `pre-restore-${timestamp}`);
      
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }

      const backupFile = path.join(backupDir, 'prod-before-restore.sql');
      
      const command = `pg_dump "${prodConfig.connectionString}" -f "${backupFile}"`;
      
      const { stdout, stderr } = await execAsync(command);

      if (stderr && !stderr.includes('WARNING')) {
        throw new Error(`pg_dump error: ${stderr}`);
      }

      if (!fs.existsSync(backupFile)) {
        throw new Error('Archivo de respaldo no se creó');
      }

      const stats = fs.statSync(backupFile);
      this.logMessage(`✅ Respaldo pre-restauración creado: ${backupFile} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
      
      return backupFile;

    } catch (error) {
      this.logError(error, 'Error creando respaldo pre-restauración');
      throw error;
    }
  }

  async clearProdDatabase() {
    this.logMessage('🗑️ Limpiando base de datos PROD...');
    
    try {
      const prodClient = await this.prodPool.connect();

      // Obtener lista de tablas
      const tablesResult = await prodClient.query(`
        SELECT tablename FROM pg_tables 
        WHERE schemaname = 'public' 
        ORDER BY tablename
      `);

      const tables = tablesResult.rows.map(row => row.tablename);
      this.logMessage(`📋 Encontradas ${tables.length} tablas para limpiar`);

      // Deshabilitar constraints temporalmente
      await prodClient.query('SET session_replication_role = replica;');

      // Limpiar cada tabla
      for (const tableName of tables) {
        try {
          await prodClient.query(`TRUNCATE TABLE "${tableName}" CASCADE;`);
          this.logMessage(`✅ Tabla ${tableName} limpiada`);
        } catch (error) {
          this.logError(error, `Error limpiando tabla ${tableName}`);
        }
      }

      // Rehabilitar constraints
      await prodClient.query('SET session_replication_role = DEFAULT;');

      prodClient.release();
      this.logMessage('✅ Base de datos PROD limpiada');

    } catch (error) {
      this.logError(error, 'Error limpiando base de datos PROD');
      throw error;
    }
  }

  async restoreFromBackup() {
    this.logMessage('🔄 Restaurando desde respaldo original...');
    
    try {
      const backupFile = path.join(this.backupPath, 'prod-backup.sql');
      
      if (!fs.existsSync(backupFile)) {
        throw new Error(`Archivo de respaldo no encontrado: ${backupFile}`);
      }

      this.logMessage(`📄 Restaurando desde: ${backupFile}`);

      const command = `psql "${prodConfig.connectionString}" -f "${backupFile}"`;
      
      const { stdout, stderr } = await execAsync(command);

      if (stderr && !stderr.includes('WARNING') && !stderr.includes('NOTICE')) {
        this.logMessage(`⚠️ Advertencias durante restauración: ${stderr}`, 'WARNING');
      }

      this.logMessage('✅ Restauración desde respaldo completada');

    } catch (error) {
      this.logError(error, 'Error restaurando desde respaldo');
      throw error;
    }
  }

  async verifyRestoration() {
    this.logMessage('🔍 Verificando restauración...');
    
    try {
      const prodClient = await this.prodPool.connect();

      // Obtener conteos de tablas principales
      const tables = ['categorias', 'entradas', 'pacientes', 'media', 'citas', 'entrada_categorias'];
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
        citas: 21,          // Estado original de PROD
        entrada_categorias: 0  // No existía en PROD original
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
      restoreType: 'PROD_TO_ORIGINAL_STATE',
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

    const reportPath = path.join(__dirname, 'prod-restore-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    this.logMessage(`📄 Reporte de restauración generado: ${reportPath}`);
    return reportPath;
  }

  async run() {
    try {
      this.logMessage('🚀 Iniciando restauración de PROD a estado original...');
      
      const startTime = Date.now();

      // Inicializar pool de conexión
      this.prodPool = new Pool(prodConfig);

      // Conectar a la base de datos
      const connected = await this.connect();
      if (!connected) {
        throw new Error('No se pudo conectar a la base de datos PROD');
      }

      // Crear respaldo de seguridad antes de restaurar
      const preRestoreBackup = await this.createBackupBeforeRestore();

      // Limpiar base de datos actual
      await this.clearProdDatabase();

      // Restaurar desde respaldo original
      await this.restoreFromBackup();

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
        preRestoreBackup,
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
  const restore = new ProdRestore();
  restore.run()
    .then(result => {
      if (result.success) {
        console.log('🎉 Restauración de PROD completada');
        console.log(`⏱️ Duración: ${result.duration}ms`);
        console.log(`📊 Tablas restauradas: ${result.verification.matches}/${Object.keys(result.verification.counts).length}`);
        console.log(`💾 Respaldo pre-restauración: ${result.preRestoreBackup}`);
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

module.exports = ProdRestore;