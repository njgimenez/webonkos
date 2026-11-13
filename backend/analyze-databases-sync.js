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
  ssl: {
    rejectUnauthorized: false
  }
};

class DatabaseAnalyzer {
  constructor() {
    this.localPool = new Pool(localConfig);
    this.prodPool = new Pool(prodConfig);
    this.analysis = {
      timestamp: new Date().toISOString(),
      local: {},
      prod: {},
      differences: {},
      recommendations: []
    };
  }

  async connect() {
    try {
      console.log('🔌 Conectando a bases de datos...');
      
      // Probar conexión LOCAL
      const localClient = await this.localPool.connect();
      const localResult = await localClient.query('SELECT version()');
      console.log('✅ LOCAL conectado:', localResult.rows[0].version.split(' ')[0]);
      localClient.release();

      // Probar conexión PROD
      const prodClient = await this.prodPool.connect();
      const prodResult = await prodClient.query('SELECT version()');
      console.log('✅ PROD conectado:', prodResult.rows[0].version.split(' ')[0]);
      prodClient.release();

      return true;
    } catch (error) {
      console.error('❌ Error conectando:', error.message);
      return false;
    }
  }

  async getTableInfo(pool, dbName) {
    const client = await pool.connect();
    
    try {
      // Obtener lista de tablas
      const tablesQuery = `
        SELECT 
          schemaname,
          tablename,
          tableowner
        FROM pg_tables 
        WHERE schemaname = 'public'
        ORDER BY tablename;
      `;
      
      const tablesResult = await client.query(tablesQuery);
      const tables = tablesResult.rows;

      console.log(`📊 ${dbName}: ${tables.length} tablas encontradas`);

      const tableInfo = {};

      for (const table of tables) {
        const tableName = table.tablename;
        
        // Obtener estructura de la tabla
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
        
        const structureResult = await client.query(structureQuery, [tableName]);
        
        // Contar registros
        const countResult = await client.query(`SELECT COUNT(*) as count FROM "${tableName}";`);
        const recordCount = parseInt(countResult.rows[0].count);

        // Obtener constraints (primary keys, foreign keys)
        const constraintsQuery = `
          SELECT 
            tc.constraint_name,
            tc.constraint_type,
            kcu.column_name
          FROM information_schema.table_constraints tc
          JOIN information_schema.key_column_usage kcu 
            ON tc.constraint_name = kcu.constraint_name
          WHERE tc.table_name = $1 AND tc.table_schema = 'public'
          ORDER BY tc.constraint_type, kcu.column_name;
        `;
        
        const constraintsResult = await client.query(constraintsQuery, [tableName]);

        tableInfo[tableName] = {
          structure: structureResult.rows,
          recordCount: recordCount,
          constraints: constraintsResult.rows,
          owner: table.tableowner
        };

        console.log(`  📋 ${tableName}: ${recordCount} registros`);
      }

      return tableInfo;
    } finally {
      client.release();
    }
  }

  async analyzeDataDifferences() {
    console.log('\n🔍 Analizando diferencias en datos...');
    
    const localClient = await this.localPool.connect();
    const prodClient = await this.prodPool.connect();

    try {
      const localTables = Object.keys(this.analysis.local);
      const prodTables = Object.keys(this.analysis.prod);
      const allTables = [...new Set([...localTables, ...prodTables])];

      for (const tableName of allTables) {
        const localExists = localTables.includes(tableName);
        const prodExists = prodTables.includes(tableName);

        if (!localExists) {
          this.analysis.differences[tableName] = {
            type: 'missing_in_local',
            localCount: 0,
            prodCount: this.analysis.prod[tableName]?.recordCount || 0,
            message: `Tabla existe solo en PROD (${this.analysis.prod[tableName]?.recordCount || 0} registros)`
          };
          continue;
        }

        if (!prodExists) {
          this.analysis.differences[tableName] = {
            type: 'missing_in_prod',
            localCount: this.analysis.local[tableName]?.recordCount || 0,
            prodCount: 0,
            message: `Tabla existe solo en LOCAL (${this.analysis.local[tableName]?.recordCount || 0} registros)`
          };
          continue;
        }

        const localCount = this.analysis.local[tableName].recordCount;
        const prodCount = this.analysis.prod[tableName].recordCount;

        if (localCount !== prodCount) {
          this.analysis.differences[tableName] = {
            type: 'count_difference',
            localCount: localCount,
            prodCount: prodCount,
            difference: Math.abs(localCount - prodCount),
            message: `Diferencia en conteo: LOCAL=${localCount}, PROD=${prodCount}`
          };
        }
      }
    } finally {
      localClient.release();
      prodClient.release();
    }
  }

  generateRecommendations() {
    console.log('\n💡 Generando recomendaciones...');
    
    const recommendations = [];

    // Analizar tablas faltantes
    const missingInLocal = Object.entries(this.analysis.differences)
      .filter(([_, diff]) => diff.type === 'missing_in_local');
    
    const missingInProd = Object.entries(this.analysis.differences)
      .filter(([_, diff]) => diff.type === 'missing_in_prod');

    if (missingInLocal.length > 0) {
      recommendations.push({
        priority: 'HIGH',
        action: 'sync_prod_to_local',
        tables: missingInLocal.map(([table, _]) => table),
        description: 'Sincronizar tablas de PROD a LOCAL'
      });
    }

    if (missingInProd.length > 0) {
      recommendations.push({
        priority: 'HIGH',
        action: 'sync_local_to_prod',
        tables: missingInProd.map(([table, _]) => table),
        description: 'Sincronizar tablas de LOCAL a PROD'
      });
    }

    // Analizar diferencias de conteo
    const countDifferences = Object.entries(this.analysis.differences)
      .filter(([_, diff]) => diff.type === 'count_difference');

    if (countDifferences.length > 0) {
      recommendations.push({
        priority: 'MEDIUM',
        action: 'investigate_data_differences',
        tables: countDifferences.map(([table, _]) => table),
        description: 'Investigar diferencias en datos existentes'
      });
    }

    this.analysis.recommendations = recommendations;
  }

  async generateReport() {
    console.log('\n📄 Generando reporte...');
    
    const reportPath = path.join(__dirname, 'database-sync-analysis.json');
    const htmlReportPath = path.join(__dirname, 'database-sync-analysis.html');

    // Guardar reporte JSON
    fs.writeFileSync(reportPath, JSON.stringify(this.analysis, null, 2));
    console.log(`📊 Reporte JSON guardado: ${reportPath}`);

    // Generar reporte HTML
    const htmlReport = this.generateHTMLReport();
    fs.writeFileSync(htmlReportPath, htmlReport);
    console.log(`🌐 Reporte HTML guardado: ${htmlReportPath}`);

    return { jsonPath: reportPath, htmlPath: htmlReportPath };
  }

  generateHTMLReport() {
    const { local, prod, differences, recommendations } = this.analysis;
    
    return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Análisis de Sincronización de Bases de Datos</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; padding: 20px; background: #667eea; color: white; border-radius: 8px; }
        .section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        .table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        .table th, .table td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
        .table th { background: #f8f9fa; font-weight: bold; }
        .status-ok { color: #28a745; }
        .status-warning { color: #ffc107; }
        .status-error { color: #dc3545; }
        .priority-high { background: #f8d7da; border-left: 4px solid #dc3545; }
        .priority-medium { background: #fff3cd; border-left: 4px solid #ffc107; }
        .priority-low { background: #d1ecf1; border-left: 4px solid #17a2b8; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔍 Análisis de Sincronización de Bases de Datos</h1>
            <p>Generado: ${new Date().toLocaleString('es-ES')}</p>
        </div>

        <div class="section">
            <h2>📊 Resumen General</h2>
            <table class="table">
                <tr><th>Base de Datos</th><th>Tablas</th><th>Total Registros</th></tr>
                <tr>
                    <td><strong>LOCAL</strong></td>
                    <td>${Object.keys(local).length}</td>
                    <td>${Object.values(local).reduce((sum, table) => sum + table.recordCount, 0).toLocaleString()}</td>
                </tr>
                <tr>
                    <td><strong>PROD</strong></td>
                    <td>${Object.keys(prod).length}</td>
                    <td>${Object.values(prod).reduce((sum, table) => sum + table.recordCount, 0).toLocaleString()}</td>
                </tr>
            </table>
        </div>

        <div class="section">
            <h2>⚠️ Diferencias Encontradas</h2>
            ${Object.keys(differences).length === 0 ? 
                '<p class="status-ok">✅ No se encontraron diferencias significativas</p>' :
                Object.entries(differences).map(([table, diff]) => `
                    <div class="priority-${diff.type === 'missing_in_local' || diff.type === 'missing_in_prod' ? 'high' : 'medium'}">
                        <h3>${table}</h3>
                        <p><strong>Tipo:</strong> ${diff.type}</p>
                        <p><strong>Descripción:</strong> ${diff.message}</p>
                        <p><strong>LOCAL:</strong> ${diff.localCount} registros | <strong>PROD:</strong> ${diff.prodCount} registros</p>
                    </div>
                `).join('')
            }
        </div>

        <div class="section">
            <h2>💡 Recomendaciones</h2>
            ${recommendations.length === 0 ? 
                '<p class="status-ok">✅ No se requieren acciones inmediatas</p>' :
                recommendations.map(rec => `
                    <div class="priority-${rec.priority.toLowerCase()}">
                        <h3>${rec.description}</h3>
                        <p><strong>Prioridad:</strong> ${rec.priority}</p>
                        <p><strong>Acción:</strong> ${rec.action}</p>
                        <p><strong>Tablas afectadas:</strong> ${rec.tables.join(', ')}</p>
                    </div>
                `).join('')
            }
        </div>

        <div class="section">
            <h2>📋 Detalle por Tabla</h2>
            <table class="table">
                <tr><th>Tabla</th><th>LOCAL (Registros)</th><th>PROD (Registros)</th><th>Estado</th></tr>
                ${[...new Set([...Object.keys(local), ...Object.keys(prod)])].map(table => {
                    const localCount = local[table]?.recordCount || 0;
                    const prodCount = prod[table]?.recordCount || 0;
                    const status = localCount === prodCount ? 'status-ok' : 'status-warning';
                    const statusText = localCount === prodCount ? '✅ Sincronizado' : '⚠️ Diferencia';
                    return `<tr><td>${table}</td><td>${localCount.toLocaleString()}</td><td>${prodCount.toLocaleString()}</td><td class="${status}">${statusText}</td></tr>`;
                }).join('')}
            </table>
        </div>
    </div>
</body>
</html>`;
  }

  async run() {
    try {
      console.log('🚀 Iniciando análisis de bases de datos...\n');

      // Conectar a las bases de datos
      const connected = await this.connect();
      if (!connected) {
        throw new Error('No se pudo conectar a las bases de datos');
      }

      // Analizar LOCAL
      console.log('\n📊 Analizando base LOCAL...');
      this.analysis.local = await this.getTableInfo(this.localPool, 'LOCAL');

      // Analizar PROD
      console.log('\n📊 Analizando base PROD...');
      this.analysis.prod = await this.getTableInfo(this.prodPool, 'PROD');

      // Analizar diferencias
      await this.analyzeDataDifferences();

      // Generar recomendaciones
      this.generateRecommendations();

      // Generar reportes
      const reportPaths = await this.generateReport();

      console.log('\n✅ Análisis completado exitosamente!');
      console.log(`📄 Reporte JSON: ${reportPaths.jsonPath}`);
      console.log(`🌐 Reporte HTML: ${reportPaths.htmlPath}`);

      return this.analysis;

    } catch (error) {
      console.error('❌ Error durante el análisis:', error);
      throw error;
    } finally {
      await this.localPool.end();
      await this.prodPool.end();
    }
  }
}

// Ejecutar análisis
if (require.main === module) {
  const analyzer = new DatabaseAnalyzer();
  analyzer.run()
    .then(analysis => {
      console.log('\n🎯 Resumen del análisis:');
      console.log(`- Tablas en LOCAL: ${Object.keys(analysis.local).length}`);
      console.log(`- Tablas en PROD: ${Object.keys(analysis.prod).length}`);
      console.log(`- Diferencias encontradas: ${Object.keys(analysis.differences).length}`);
      console.log(`- Recomendaciones: ${analysis.recommendations.length}`);
    })
    .catch(error => {
      console.error('💥 Error fatal:', error.message);
      process.exit(1);
    });
}

module.exports = DatabaseAnalyzer;