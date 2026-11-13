#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Importar todos los scripts
const DatabaseBackup = require('./backup-databases');
const DatabaseStructureSync = require('./sync-database-structure');
const LocalToProdSync = require('./sync-data-local-to-prod');
const ProdToLocalSync = require('./sync-data-prod-to-local');
const CompleteDatabaseSync = require('./sync-databases-complete');
const SyncValidator = require('./validate-sync');

class SyncOrchestrator {
  constructor() {
    this.log = [];
    this.errors = [];
    this.results = {};
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

  showMenu() {
    console.log('\n🚀 ORQUESTADOR DE SINCRONIZACIÓN DE BASES DE DATOS');
    console.log('================================================');
    console.log('1. 📊 Análisis de diferencias');
    console.log('2. 💾 Crear respaldos de seguridad');
    console.log('3. 🏗️ Sincronizar solo estructura');
    console.log('4. 📤 Sincronizar datos LOCAL → PROD');
    console.log('5. 📥 Sincronizar datos PROD → LOCAL');
    console.log('6. 🔄 Sincronización completa bidireccional');
    console.log('7. 🔍 Validar sincronización');
    console.log('8. 📋 Ver reportes existentes');
    console.log('9. ❌ Salir');
    console.log('================================================');
  }

  async showReports() {
    console.log('\n📋 REPORTES DISPONIBLES:');
    console.log('========================');
    
    const reportFiles = [
      'database-sync-analysis.json',
      'structure-sync-report.json',
      'local-to-prod-sync-report.json',
      'prod-to-local-sync-report.json',
      'complete-sync-report.json',
      'validation-report.json'
    ];

    const reportsDir = __dirname;
    let foundReports = 0;

    for (const reportFile of reportFiles) {
      const reportPath = path.join(reportsDir, reportFile);
      if (fs.existsSync(reportPath)) {
        const stats = fs.statSync(reportPath);
        const sizeKB = (stats.size / 1024).toFixed(2);
        const modified = stats.mtime.toLocaleString('es-ES');
        console.log(`📄 ${reportFile} (${sizeKB} KB) - ${modified}`);
        foundReports++;
      }
    }

    if (foundReports === 0) {
      console.log('❌ No se encontraron reportes');
    } else {
      console.log(`\n✅ ${foundReports} reportes encontrados`);
    }
  }

  async runAnalysis() {
    console.log('\n📊 Ejecutando análisis de diferencias...');
    try {
      const { exec } = require('child_process');
      const { promisify } = require('util');
      const execAsync = promisify(exec);

      const { stdout, stderr } = await execAsync('node analyze-databases-sync.js', { cwd: __dirname });
      
      if (stderr) {
        console.error('⚠️ Advertencias:', stderr);
      }
      
      console.log('✅ Análisis completado');
      console.log('📄 Revisa los archivos: database-sync-analysis.json y database-sync-analysis.html');
      
    } catch (error) {
      this.logError(error, 'Error ejecutando análisis');
    }
  }

  async runBackup() {
    console.log('\n💾 Creando respaldos de seguridad...');
    try {
      const backup = new DatabaseBackup();
      const result = await backup.run();
      
      if (result.success) {
        console.log('✅ Respaldos creados exitosamente');
        console.log(`📁 Directorio: ${result.backupDir}`);
        console.log(`📊 Tamaño total: ${result.results.local?.sizeMB || 0} MB (LOCAL) + ${result.results.prod?.sizeMB || 0} MB (PROD)`);
      } else {
        console.error('❌ Error creando respaldos:', result.error);
      }
      
    } catch (error) {
      this.logError(error, 'Error en respaldos');
    }
  }

  async runStructureSync() {
    console.log('\n🏗️ Sincronizando estructura de tablas...');
    try {
      const structureSync = new DatabaseStructureSync();
      const result = await structureSync.run();
      
      if (result.success) {
        console.log('✅ Estructura sincronizada exitosamente');
        console.log(`📊 Cambios aplicados: ${result.results.changesApplied}`);
      } else {
        console.error('❌ Error sincronizando estructura:', result.error);
      }
      
    } catch (error) {
      this.logError(error, 'Error en sincronización de estructura');
    }
  }

  async runLocalToProd() {
    console.log('\n📤 Sincronizando datos LOCAL → PROD...');
    try {
      const localToProdSync = new LocalToProdSync();
      const result = await localToProdSync.run();
      
      if (result.success) {
        console.log('✅ Datos LOCAL → PROD sincronizados exitosamente');
        console.log(`📊 Registros insertados: ${result.results.recordsInserted}`);
        console.log(`📊 Registros actualizados: ${result.results.recordsUpdated}`);
      } else {
        console.error('❌ Error sincronizando LOCAL → PROD:', result.error);
      }
      
    } catch (error) {
      this.logError(error, 'Error en sincronización LOCAL → PROD');
    }
  }

  async runProdToLocal() {
    console.log('\n📥 Sincronizando datos PROD → LOCAL...');
    try {
      const prodToLocalSync = new ProdToLocalSync();
      const result = await prodToLocalSync.run();
      
      if (result.success) {
        console.log('✅ Datos PROD → LOCAL sincronizados exitosamente');
        console.log(`📊 Registros insertados: ${result.results.recordsInserted}`);
        console.log(`📊 Registros actualizados: ${result.results.recordsUpdated}`);
      } else {
        console.error('❌ Error sincronizando PROD → LOCAL:', result.error);
      }
      
    } catch (error) {
      this.logError(error, 'Error en sincronización PROD → LOCAL');
    }
  }

  async runCompleteSync() {
    console.log('\n🔄 Ejecutando sincronización completa bidireccional...');
    try {
      const completeSync = new CompleteDatabaseSync();
      const result = await completeSync.run();
      
      if (result.success) {
        console.log('🎉 Sincronización completa exitosa');
        console.log(`⏱️ Duración total: ${result.duration}ms`);
        console.log(`📊 Estructura: ${result.results.structure?.success ? '✅' : '❌'}`);
        console.log(`📊 LOCAL→PROD: ${result.results.localToProd?.success ? '✅' : '❌'}`);
        console.log(`📊 PROD→LOCAL: ${result.results.prodToLocal?.success ? '✅' : '❌'}`);
        console.log(`📊 Validación: ${result.results.validation?.success ? '✅' : '❌'}`);
      } else {
        console.error('❌ Error en sincronización completa:', result.error);
      }
      
    } catch (error) {
      this.logError(error, 'Error en sincronización completa');
    }
  }

  async runValidation() {
    console.log('\n🔍 Validando sincronización...');
    try {
      const validator = new SyncValidator();
      const result = await validator.run();
      
      if (result.success) {
        console.log('✅ Validación exitosa - Bases sincronizadas correctamente');
        console.log(`📊 Estructura: ${result.results.structure.passed} OK, ${result.results.structure.failed} problemas`);
        console.log(`📊 Datos: ${result.results.data.passed} OK, ${result.results.data.failed} problemas`);
        console.log(`📊 Integridad: ${result.results.integrity.passed} OK, ${result.results.integrity.failed} problemas`);
      } else {
        console.error('❌ Validación falló - Revisar sincronización');
        console.error(`❌ Error: ${result.error}`);
      }
      
    } catch (error) {
      this.logError(error, 'Error en validación');
    }
  }

  async run() {
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const question = (query) => new Promise(resolve => rl.question(query, resolve));

    try {
      while (true) {
        this.showMenu();
        const choice = await question('\nSelecciona una opción (1-9): ');

        switch (choice.trim()) {
          case '1':
            await this.runAnalysis();
            break;
          case '2':
            await this.runBackup();
            break;
          case '3':
            await this.runStructureSync();
            break;
          case '4':
            await this.runLocalToProd();
            break;
          case '5':
            await this.runProdToLocal();
            break;
          case '6':
            await this.runCompleteSync();
            break;
          case '7':
            await this.runValidation();
            break;
          case '8':
            await this.showReports();
            break;
          case '9':
            console.log('\n👋 ¡Hasta luego!');
            rl.close();
            return;
          default:
            console.log('\n❌ Opción inválida. Por favor selecciona 1-9.');
        }

        if (choice.trim() !== '9') {
          await question('\nPresiona Enter para continuar...');
        }
      }
    } catch (error) {
      this.logError(error, 'Error en orquestador');
    } finally {
      rl.close();
    }
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  const orchestrator = new SyncOrchestrator();
  orchestrator.run()
    .catch(error => {
      console.error('💥 Error fatal:', error.message);
      process.exit(1);
    });
}

module.exports = SyncOrchestrator;