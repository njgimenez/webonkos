const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

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

class DatabaseBackup {
  constructor() {
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

  async createBackupDirectory() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(__dirname, 'backups', `backup-${timestamp}`);
    
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    this.logMessage(`📁 Directorio de respaldo creado: ${backupDir}`);
    return backupDir;
  }

  async backupLocalDatabase(backupDir) {
    this.logMessage('💾 Creando respaldo de base LOCAL...');
    
    try {
      const backupFile = path.join(backupDir, 'local-backup.sql');
      
      // Usar pg_dump para crear respaldo completo
      const command = `pg_dump -h ${localConfig.host} -p ${localConfig.port} -U ${localConfig.user} -d ${localConfig.database} -f "${backupFile}"`;
      
      const { stdout, stderr } = await execAsync(command, {
        env: { ...process.env, PGPASSWORD: localConfig.password }
      });

      if (stderr && !stderr.includes('WARNING')) {
        throw new Error(`pg_dump error: ${stderr}`);
      }

      // Verificar que el archivo se creó
      if (!fs.existsSync(backupFile)) {
        throw new Error('Archivo de respaldo no se creó');
      }

      const stats = fs.statSync(backupFile);
      this.logMessage(`✅ Respaldo LOCAL creado: ${backupFile} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
      
      return {
        success: true,
        file: backupFile,
        size: stats.size,
        sizeMB: (stats.size / 1024 / 1024).toFixed(2)
      };

    } catch (error) {
      this.logError(error, 'Error creando respaldo LOCAL');
      return { success: false, error: error.message };
    }
  }

  async backupProdDatabase(backupDir) {
    this.logMessage('💾 Creando respaldo de base PROD...');
    
    try {
      const backupFile = path.join(backupDir, 'prod-backup.sql');
      
      // Usar pg_dump con connection string
      const command = `pg_dump "${prodConfig.connectionString}" -f "${backupFile}"`;
      
      const { stdout, stderr } = await execAsync(command);

      if (stderr && !stderr.includes('WARNING')) {
        throw new Error(`pg_dump error: ${stderr}`);
      }

      // Verificar que el archivo se creó
      if (!fs.existsSync(backupFile)) {
        throw new Error('Archivo de respaldo no se creó');
      }

      const stats = fs.statSync(backupFile);
      this.logMessage(`✅ Respaldo PROD creado: ${backupFile} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
      
      return {
        success: true,
        file: backupFile,
        size: stats.size,
        sizeMB: (stats.size / 1024 / 1024).toFixed(2)
      };

    } catch (error) {
      this.logError(error, 'Error creando respaldo PROD');
      return { success: false, error: error.message };
    }
  }

  async createDataBackup(backupDir) {
    this.logMessage('📊 Creando respaldo de datos en JSON...');
    
    try {
      const localPool = new Pool(localConfig);
      const prodPool = new Pool(prodConfig);

      // Respaldo LOCAL
      const localClient = await localPool.connect();
      const localTables = await localClient.query(`
        SELECT tablename FROM pg_tables 
        WHERE schemaname = 'public' 
        ORDER BY tablename
      `);
      
      const localData = {};
      for (const table of localTables.rows) {
        const result = await localClient.query(`SELECT * FROM "${table.tablename}"`);
        localData[table.tablename] = result.rows;
      }
      localClient.release();
      await localPool.end();

      // Respaldo PROD
      const prodClient = await prodPool.connect();
      const prodTables = await prodClient.query(`
        SELECT tablename FROM pg_tables 
        WHERE schemaname = 'public' 
        ORDER BY tablename
      `);
      
      const prodData = {};
      for (const table of prodTables.rows) {
        const result = await prodClient.query(`SELECT * FROM "${table.tablename}"`);
        prodData[table.tablename] = result.rows;
      }
      prodClient.release();
      await prodPool.end();

      // Guardar respaldos JSON
      const localJsonFile = path.join(backupDir, 'local-data.json');
      const prodJsonFile = path.join(backupDir, 'prod-data.json');
      
      fs.writeFileSync(localJsonFile, JSON.stringify(localData, null, 2));
      fs.writeFileSync(prodJsonFile, JSON.stringify(prodData, null, 2));

      this.logMessage(`✅ Respaldos JSON creados: ${localJsonFile}, ${prodJsonFile}`);
      
      return {
        success: true,
        localFile: localJsonFile,
        prodFile: prodJsonFile
      };

    } catch (error) {
      this.logError(error, 'Error creando respaldo de datos');
      return { success: false, error: error.message };
    }
  }

  async createBackupManifest(backupDir, results) {
    const manifest = {
      timestamp: new Date().toISOString(),
      backupType: 'FULL_DATABASE_BACKUP',
      local: results.local,
      prod: results.prod,
      data: results.data,
      summary: {
        totalFiles: 0,
        totalSizeMB: 0,
        success: true
      }
    };

    // Calcular estadísticas
    if (results.local?.success) {
      manifest.summary.totalFiles++;
      manifest.summary.totalSizeMB += parseFloat(results.local.sizeMB);
    }

    if (results.prod?.success) {
      manifest.summary.totalFiles++;
      manifest.summary.totalSizeMB += parseFloat(results.prod.sizeMB);
    }

    if (results.data?.success) {
      manifest.summary.totalFiles += 2; // local-data.json + prod-data.json
    }

    manifest.summary.totalSizeMB = manifest.summary.totalSizeMB.toFixed(2);

    const manifestFile = path.join(backupDir, 'backup-manifest.json');
    fs.writeFileSync(manifestFile, JSON.stringify(manifest, null, 2));
    
    this.logMessage(`📋 Manifesto de respaldo creado: ${manifestFile}`);
    return manifestFile;
  }

  async run() {
    try {
      this.logMessage('🚀 Iniciando proceso de respaldo de bases de datos...');
      
      const startTime = Date.now();
      
      // Crear directorio de respaldo
      const backupDir = await this.createBackupDirectory();
      
      // Crear respaldos
      const results = {
        local: await this.backupLocalDatabase(backupDir),
        prod: await this.backupProdDatabase(backupDir),
        data: await this.createDataBackup(backupDir)
      };

      // Crear manifesto
      const manifestFile = await this.createBackupManifest(backupDir, results);

      const duration = Date.now() - startTime;
      this.logMessage(`✅ Proceso de respaldo completado en ${duration}ms`);
      this.logMessage(`📁 Directorio de respaldo: ${backupDir}`);

      return {
        success: true,
        duration,
        backupDir,
        results,
        manifestFile
      };

    } catch (error) {
      this.logError(error, 'Error fatal en proceso de respaldo');
      return { success: false, error: error.message };
    }
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  const backup = new DatabaseBackup();
  backup.run()
    .then(result => {
      if (result.success) {
        console.log('🎉 Respaldo completado exitosamente');
        console.log(`📁 Directorio: ${result.backupDir}`);
        console.log(`📊 Archivos: ${result.results.local?.success ? '✅ LOCAL' : '❌ LOCAL'} ${result.results.prod?.success ? '✅ PROD' : '❌ PROD'}`);
        console.log(`📄 Manifesto: ${result.manifestFile}`);
      } else {
        console.error('💥 Error en respaldo:', result.error);
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('💥 Error fatal:', error.message);
      process.exit(1);
    });
}

module.exports = DatabaseBackup;