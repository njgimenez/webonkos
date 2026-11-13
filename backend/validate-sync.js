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

class SyncValidator {
  constructor() {
    this.log = [];
    this.errors = [];
    this.validationResults = {
      structure: { passed: 0, failed: 0, issues: [] },
      data: { passed: 0, failed: 0, issues: [] },
      integrity: { passed: 0, failed: 0, issues: [] }
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

  async connect() {
    try {
      this.logMessage('🔌 Conectando a bases de datos para validación...');
      
      this.localPool = new Pool(localConfig);
      this.prodPool = new Pool(prodConfig);
      
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

  async validateStructure() {
    this.logMessage('🏗️ Validando estructura de tablas...');
    
    try {
      const localClient = await this.localPool.connect();
      const prodClient = await this.prodPool.connect();

      // Obtener estructura de LOCAL
      const localStructure = await this.getDatabaseStructure(localClient);
      localClient.release();

      // Obtener estructura de PROD
      const prodStructure = await this.getDatabaseStructure(prodClient);
      prodClient.release();

      // Comparar estructuras
      const comparison = this.compareStructures(localStructure, prodStructure);
      
      this.validationResults.structure.passed = comparison.matching;
      this.validationResults.structure.failed = comparison.differences;
      this.validationResults.structure.issues = comparison.issues;

      this.logMessage(`✅ Estructura: ${comparison.matching} coincidencias, ${comparison.differences} diferencias`);
      
      return comparison;

    } catch (error) {
      this.logError(error, 'Error validando estructura');
      return { matching: 0, differences: 0, issues: [error.message] };
    }
  }

  async getDatabaseStructure(client) {
    const structure = {};

    // Obtener tablas
    const tablesResult = await client.query(`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename
    `);

    for (const table of tablesResult.rows) {
      const tableName = table.tablename;
      
      // Obtener columnas
      const columnsResult = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = $1 AND table_schema = 'public'
        ORDER BY ordinal_position
      `, [tableName]);

      // Obtener constraints
      const constraintsResult = await client.query(`
        SELECT constraint_name, constraint_type, column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu 
          ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_name = $1 AND tc.table_schema = 'public'
      `, [tableName]);

      structure[tableName] = {
        columns: columnsResult.rows,
        constraints: constraintsResult.rows
      };
    }

    return structure;
  }

  compareStructures(localStructure, prodStructure) {
    const issues = [];
    let matching = 0;
    let differences = 0;

    const localTables = Object.keys(localStructure);
    const prodTables = Object.keys(prodStructure);
    const allTables = [...new Set([...localTables, ...prodTables])];

    for (const tableName of allTables) {
      const localTable = localStructure[tableName];
      const prodTable = prodStructure[tableName];

      if (!localTable) {
        issues.push(`Tabla ${tableName} existe solo en PROD`);
        differences++;
        continue;
      }

      if (!prodTable) {
        issues.push(`Tabla ${tableName} existe solo en LOCAL`);
        differences++;
        continue;
      }

      // Comparar columnas
      const columnComparison = this.compareColumns(localTable.columns, prodTable.columns);
      if (columnComparison.differences > 0) {
        issues.push(`Tabla ${tableName}: ${columnComparison.differences} diferencias en columnas`);
        differences += columnComparison.differences;
      } else {
        matching++;
      }
    }

    return { matching, differences, issues };
  }

  compareColumns(localColumns, prodColumns) {
    const localCols = new Map(localColumns.map(col => [col.column_name, col]));
    const prodCols = new Map(prodColumns.map(col => [col.column_name, col]));
    
    let differences = 0;
    const allColumns = [...new Set([...localCols.keys(), ...prodCols.keys()])];

    for (const colName of allColumns) {
      const localCol = localCols.get(colName);
      const prodCol = prodCols.get(colName);

      if (!localCol || !prodCol) {
        differences++;
        continue;
      }

      if (localCol.data_type !== prodCol.data_type ||
          localCol.is_nullable !== prodCol.is_nullable) {
        differences++;
      }
    }

    return { differences };
  }

  async validateData() {
    this.logMessage('📊 Validando datos...');
    
    try {
      const localClient = await this.localPool.connect();
      const prodClient = await this.prodPool.connect();

      // Obtener conteos de tablas
      const localCounts = await this.getTableCounts(localClient);
      const prodCounts = await this.getTableCounts(prodClient);

      localClient.release();
      prodClient.release();

      // Comparar conteos
      const comparison = this.compareDataCounts(localCounts, prodCounts);
      
      this.validationResults.data.passed = comparison.matching;
      this.validationResults.data.failed = comparison.differences;
      this.validationResults.data.issues = comparison.issues;

      this.logMessage(`✅ Datos: ${comparison.matching} tablas coinciden, ${comparison.differences} diferencias`);
      
      return comparison;

    } catch (error) {
      this.logError(error, 'Error validando datos');
      return { matching: 0, differences: 0, issues: [error.message] };
    }
  }

  async getTableCounts(client) {
    const counts = {};
    
    const tablesResult = await client.query(`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename
    `);

    for (const table of tablesResult.rows) {
      try {
        const countResult = await client.query(`SELECT COUNT(*) as count FROM "${table.tablename}"`);
        counts[table.tablename] = parseInt(countResult.rows[0].count);
      } catch (error) {
        counts[table.tablename] = 0;
      }
    }

    return counts;
  }

  compareDataCounts(localCounts, prodCounts) {
    const issues = [];
    let matching = 0;
    let differences = 0;

    const allTables = [...new Set([...Object.keys(localCounts), ...Object.keys(prodCounts)])];

    for (const tableName of allTables) {
      const localCount = localCounts[tableName] || 0;
      const prodCount = prodCounts[tableName] || 0;

      if (localCount === prodCount) {
        matching++;
      } else {
        differences++;
        issues.push(`${tableName}: LOCAL=${localCount}, PROD=${prodCount}`);
      }
    }

    return { matching, differences, issues };
  }

  async validateIntegrity() {
    this.logMessage('🔗 Validando integridad referencial...');
    
    try {
      const localClient = await this.localPool.connect();
      const prodClient = await this.prodPool.connect();

      const localIntegrity = await this.checkReferentialIntegrity(localClient);
      const prodIntegrity = await this.checkReferentialIntegrity(prodClient);

      localClient.release();
      prodClient.release();

      const issues = [];
      let passed = 0;
      let failed = 0;

      // Verificar integridad en ambas bases
      if (localIntegrity.violations.length === 0) {
        passed++;
      } else {
        failed++;
        issues.push(`LOCAL: ${localIntegrity.violations.length} violaciones de integridad`);
      }

      if (prodIntegrity.violations.length === 0) {
        passed++;
      } else {
        failed++;
        issues.push(`PROD: ${prodIntegrity.violations.length} violaciones de integridad`);
      }

      this.validationResults.integrity.passed = passed;
      this.validationResults.integrity.failed = failed;
      this.validationResults.integrity.issues = issues;

      this.logMessage(`✅ Integridad: ${passed} bases OK, ${failed} con problemas`);
      
      return { passed, failed, issues };

    } catch (error) {
      this.logError(error, 'Error validando integridad');
      return { passed: 0, failed: 0, issues: [error.message] };
    }
  }

  async checkReferentialIntegrity(client) {
    const violations = [];

    try {
      // Verificar foreign keys
      const fkQuery = `
        SELECT 
          tc.table_name,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
      `;

      const fkResult = await client.query(fkQuery);

      for (const fk of fkResult.rows) {
        const checkQuery = `
          SELECT COUNT(*) as count
          FROM "${fk.table_name}" t1
          LEFT JOIN "${fk.foreign_table_name}" t2 
            ON t1."${fk.column_name}" = t2."${fk.foreign_column_name}"
          WHERE t1."${fk.column_name}" IS NOT NULL 
            AND t2."${fk.foreign_column_name}" IS NULL
        `;

        const checkResult = await client.query(checkQuery);
        const violationCount = parseInt(checkResult.rows[0].count);

        if (violationCount > 0) {
          violations.push({
            table: fk.table_name,
            column: fk.column_name,
            foreignTable: fk.foreign_table_name,
            foreignColumn: fk.foreign_column_name,
            violations: violationCount
          });
        }
      }

    } catch (error) {
      violations.push({ error: error.message });
    }

    return { violations };
  }

  async generateValidationReport() {
    const report = {
      timestamp: new Date().toISOString(),
      validationType: 'POST_SYNC_VALIDATION',
      summary: {
        structure: this.validationResults.structure,
        data: this.validationResults.data,
        integrity: this.validationResults.integrity,
        overallSuccess: this.validationResults.structure.failed === 0 && 
                       this.validationResults.data.failed === 0 && 
                       this.validationResults.integrity.failed === 0
      },
      logs: this.log,
      errors: this.errors
    };

    const reportPath = path.join(__dirname, 'validation-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    this.logMessage(`📄 Reporte de validación generado: ${reportPath}`);
    return reportPath;
  }

  async run() {
    try {
      this.logMessage('🚀 Iniciando validación de sincronización...');
      
      const startTime = Date.now();

      // Conectar a las bases de datos
      const connected = await this.connect();
      if (!connected) {
        throw new Error('No se pudo conectar a las bases de datos');
      }

      // Ejecutar validaciones
      await this.validateStructure();
      await this.validateData();
      await this.validateIntegrity();

      const duration = Date.now() - startTime;
      this.logMessage(`✅ Validación completada en ${duration}ms`);

      // Generar reporte
      const reportPath = await this.generateValidationReport();

      const overallSuccess = this.validationResults.structure.failed === 0 && 
                           this.validationResults.data.failed === 0 && 
                           this.validationResults.integrity.failed === 0;

      return {
        success: overallSuccess,
        duration,
        results: this.validationResults,
        reportPath
      };

    } catch (error) {
      this.logError(error, 'Error fatal en validación');
      await this.generateValidationReport();
      return { success: false, error: error.message };
    } finally {
      if (this.localPool) await this.localPool.end();
      if (this.prodPool) await this.prodPool.end();
    }
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  const validator = new SyncValidator();
  validator.run()
    .then(result => {
      if (result.success) {
        console.log('🎉 Validación exitosa - Bases de datos sincronizadas correctamente');
        console.log(`📊 Estructura: ${result.results.structure.passed} OK, ${result.results.structure.failed} problemas`);
        console.log(`📊 Datos: ${result.results.data.passed} OK, ${result.results.data.failed} problemas`);
        console.log(`📊 Integridad: ${result.results.integrity.passed} OK, ${result.results.integrity.failed} problemas`);
        console.log(`📄 Reporte: ${result.reportPath}`);
      } else {
        console.error('💥 Validación falló - Revisar sincronización');
        console.error(`❌ Error: ${result.error}`);
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('💥 Error fatal:', error.message);
      process.exit(1);
    });
}

module.exports = SyncValidator;