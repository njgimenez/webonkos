#!/usr/bin/env node

/**
 * Script para comparar la estructura de dos bases de datos PostgreSQL
 * Compara tablas, columnas, tipos de datos, índices, constraints, etc.
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// URLs de conexión a las bases de datos
const DB_URLS = {
    production: 'postgresql://onkos_user:SCef59zkV9OEYV1zSGXla0wDUA3wUVSA@dpg-d2rnp815pdvs73e0eisg-a.oregon-postgres.render.com/onkosdb',
    local: 'postgresql://master:Mazingerz78@localhost:5432/onkosdb'
};

class DatabaseComparator {
    constructor() {
        this.results = {
            production: {},
            local: {},
            differences: []
        };
    }

    /**
     * Conecta a una base de datos
     */
    async connectToDatabase(url, name) {
        const client = new Client({
            connectionString: url,
            ssl: url.includes('render.com') ? { rejectUnauthorized: false } : false
        });
        
        try {
            await client.connect();
            console.log(`✅ Conectado a ${name}`);
            return client;
        } catch (error) {
            console.error(`❌ Error conectando a ${name}:`, error.message);
            throw error;
        }
    }

    /**
     * Obtiene información de las tablas
     */
    async getTables(client) {
        const query = `
            SELECT 
                schemaname,
                tablename,
                tableowner,
                hasindexes,
                hasrules,
                hastriggers,
                rowsecurity
            FROM pg_tables 
            WHERE schemaname = 'public'
            ORDER BY tablename;
        `;
        
        const result = await client.query(query);
        return result.rows;
    }

    /**
     * Obtiene información de las columnas de una tabla
     */
    async getColumns(client, tableName) {
        const query = `
            SELECT 
                column_name,
                data_type,
                character_maximum_length,
                is_nullable,
                column_default,
                ordinal_position
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = $1
            ORDER BY ordinal_position;
        `;
        
        const result = await client.query(query, [tableName]);
        return result.rows;
    }

    /**
     * Obtiene información de los índices
     */
    async getIndexes(client, tableName) {
        const query = `
            SELECT 
                i.relname as indexname,
                pg_get_indexdef(i.oid) as indexdef,
                idx.indisunique,
                idx.indisprimary
            FROM pg_class i
            JOIN pg_index idx ON i.oid = idx.indexrelid
            JOIN pg_class t ON idx.indrelid = t.oid
            JOIN pg_namespace n ON t.relnamespace = n.oid
            WHERE n.nspname = 'public' 
            AND t.relname = $1
            AND i.relkind = 'i';
        `;
        
        const result = await client.query(query, [tableName]);
        return result.rows;
    }

    /**
     * Obtiene información de las foreign keys
     */
    async getForeignKeys(client, tableName) {
        const query = `
            SELECT 
                tc.constraint_name,
                tc.table_name,
                kcu.column_name,
                ccu.table_name AS foreign_table_name,
                ccu.column_name AS foreign_column_name
            FROM information_schema.table_constraints AS tc 
            JOIN information_schema.key_column_usage AS kcu
                ON tc.constraint_name = kcu.constraint_name
                AND tc.table_schema = kcu.table_schema
            JOIN information_schema.constraint_column_usage AS ccu
                ON ccu.constraint_name = tc.constraint_name
                AND ccu.table_schema = tc.table_schema
            WHERE tc.constraint_type = 'FOREIGN KEY' 
            AND tc.table_schema = 'public'
            AND tc.table_name = $1;
        `;
        
        const result = await client.query(query, [tableName]);
        return result.rows;
    }

    /**
     * Obtiene información de las primary keys
     */
    async getPrimaryKeys(client, tableName) {
        const query = `
            SELECT 
                kcu.column_name
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu
                ON tc.constraint_name = kcu.constraint_name
                AND tc.table_schema = kcu.table_schema
            WHERE tc.constraint_type = 'PRIMARY KEY'
            AND tc.table_schema = 'public'
            AND tc.table_name = $1;
        `;
        
        const result = await client.query(query, [tableName]);
        return result.rows;
    }

    /**
     * Obtiene información completa de una base de datos
     */
    async getDatabaseStructure(client, dbName) {
        console.log(`\n📊 Analizando estructura de ${dbName}...`);
        
        const structure = {
            tables: {},
            summary: {
                totalTables: 0,
                totalColumns: 0,
                totalIndexes: 0,
                totalForeignKeys: 0
            }
        };

        // Obtener lista de tablas
        const tables = await this.getTables(client);
        structure.summary.totalTables = tables.length;

        for (const table of tables) {
            const tableName = table.tablename;
            console.log(`  📋 Procesando tabla: ${tableName}`);
            
            structure.tables[tableName] = {
                info: table,
                columns: await this.getColumns(client, tableName),
                indexes: await this.getIndexes(client, tableName),
                foreignKeys: await this.getForeignKeys(client, tableName),
                primaryKeys: await this.getPrimaryKeys(client, tableName)
            };

            structure.summary.totalColumns += structure.tables[tableName].columns.length;
            structure.summary.totalIndexes += structure.tables[tableName].indexes.length;
            structure.summary.totalForeignKeys += structure.tables[tableName].foreignKeys.length;
        }

        return structure;
    }

    /**
     * Compara las estructuras de las dos bases de datos
     */
    compareStructures(prodStructure, localStructure) {
        console.log('\n🔍 Comparando estructuras...');
        
        const differences = [];
        const prodTables = Object.keys(prodStructure.tables);
        const localTables = Object.keys(localStructure.tables);

        // Comparar tablas
        const allTables = [...new Set([...prodTables, ...localTables])];
        
        for (const tableName of allTables) {
            const prodTable = prodStructure.tables[tableName];
            const localTable = localStructure.tables[tableName];

            if (!prodTable) {
                differences.push({
                    type: 'MISSING_TABLE',
                    table: tableName,
                    location: 'production',
                    message: `La tabla '${tableName}' no existe en producción`
                });
                continue;
            }

            if (!localTable) {
                differences.push({
                    type: 'MISSING_TABLE',
                    table: tableName,
                    location: 'local',
                    message: `La tabla '${tableName}' no existe en local`
                });
                continue;
            }

            // Comparar columnas
            this.compareColumns(tableName, prodTable.columns, localTable.columns, differences);
            
            // Comparar índices
            this.compareIndexes(tableName, prodTable.indexes, localTable.indexes, differences);
            
            // Comparar foreign keys
            this.compareForeignKeys(tableName, prodTable.foreignKeys, localTable.foreignKeys, differences);
        }

        return differences;
    }

    /**
     * Compara las columnas de una tabla
     */
    compareColumns(tableName, prodColumns, localColumns, differences) {
        const prodColNames = prodColumns.map(col => col.column_name);
        const localColNames = localColumns.map(col => col.column_name);
        const allColNames = [...new Set([...prodColNames, ...localColNames])];

        for (const colName of allColNames) {
            const prodCol = prodColumns.find(col => col.column_name === colName);
            const localCol = localColumns.find(col => col.column_name === colName);

            if (!prodCol) {
                differences.push({
                    type: 'MISSING_COLUMN',
                    table: tableName,
                    column: colName,
                    location: 'production',
                    message: `La columna '${colName}' no existe en producción`
                });
                continue;
            }

            if (!localCol) {
                differences.push({
                    type: 'MISSING_COLUMN',
                    table: tableName,
                    column: colName,
                    location: 'local',
                    message: `La columna '${colName}' no existe en local`
                });
                continue;
            }

            // Comparar propiedades de la columna
            if (prodCol.data_type !== localCol.data_type) {
                differences.push({
                    type: 'COLUMN_TYPE_MISMATCH',
                    table: tableName,
                    column: colName,
                    production: prodCol.data_type,
                    local: localCol.data_type,
                    message: `Tipo de dato diferente para '${colName}': producción=${prodCol.data_type}, local=${localCol.data_type}`
                });
            }

            if (prodCol.is_nullable !== localCol.is_nullable) {
                differences.push({
                    type: 'COLUMN_NULLABLE_MISMATCH',
                    table: tableName,
                    column: colName,
                    production: prodCol.is_nullable,
                    local: localCol.is_nullable,
                    message: `Nullable diferente para '${colName}': producción=${prodCol.is_nullable}, local=${localCol.is_nullable}`
                });
            }
        }
    }

    /**
     * Compara los índices de una tabla
     */
    compareIndexes(tableName, prodIndexes, localIndexes, differences) {
        const prodIndexNames = prodIndexes.map(idx => idx.indexname);
        const localIndexNames = localIndexes.map(idx => idx.indexname);
        const allIndexNames = [...new Set([...prodIndexNames, ...localIndexNames])];

        for (const indexName of allIndexNames) {
            const prodIndex = prodIndexes.find(idx => idx.indexname === indexName);
            const localIndex = localIndexes.find(idx => idx.indexname === indexName);

            if (!prodIndex) {
                differences.push({
                    type: 'MISSING_INDEX',
                    table: tableName,
                    index: indexName,
                    location: 'production',
                    message: `El índice '${indexName}' no existe en producción`
                });
                continue;
            }

            if (!localIndex) {
                differences.push({
                    type: 'MISSING_INDEX',
                    table: tableName,
                    index: indexName,
                    location: 'local',
                    message: `El índice '${indexName}' no existe en local`
                });
                continue;
            }
        }
    }

    /**
     * Compara las foreign keys de una tabla
     */
    compareForeignKeys(tableName, prodFKs, localFKs, differences) {
        const prodFKNames = prodFKs.map(fk => fk.constraint_name);
        const localFKNames = localFKs.map(fk => fk.constraint_name);
        const allFKNames = [...new Set([...prodFKNames, ...localFKNames])];

        for (const fkName of allFKNames) {
            const prodFK = prodFKs.find(fk => fk.constraint_name === fkName);
            const localFK = localFKs.find(fk => fk.constraint_name === fkName);

            if (!prodFK) {
                differences.push({
                    type: 'MISSING_FOREIGN_KEY',
                    table: tableName,
                    constraint: fkName,
                    location: 'production',
                    message: `La foreign key '${fkName}' no existe en producción`
                });
                continue;
            }

            if (!localFK) {
                differences.push({
                    type: 'MISSING_FOREIGN_KEY',
                    table: tableName,
                    constraint: fkName,
                    location: 'local',
                    message: `La foreign key '${fkName}' no existe en local`
                });
                continue;
            }
        }
    }

    /**
     * Genera un reporte en formato HTML
     */
    generateHTMLReport(differences, prodStructure, localStructure) {
        const html = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reporte de Comparación de Bases de Datos</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background-color: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #333; text-align: center; }
        h2 { color: #555; border-bottom: 2px solid #ddd; padding-bottom: 10px; }
        .summary { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
        .summary-card { background: #f8f9fa; padding: 15px; border-radius: 5px; border-left: 4px solid #007bff; }
        .summary-card h3 { margin: 0 0 10px 0; color: #007bff; }
        .difference { margin: 10px 0; padding: 15px; border-radius: 5px; border-left: 4px solid #dc3545; background: #f8d7da; }
        .difference.missing { border-left-color: #ffc107; background: #fff3cd; }
        .difference.mismatch { border-left-color: #dc3545; background: #f8d7da; }
        .difference-type { font-weight: bold; color: #721c24; }
        .difference.missing .difference-type { color: #856404; }
        .no-differences { text-align: center; color: #28a745; font-size: 18px; padding: 40px; background: #d4edda; border-radius: 5px; }
        .timestamp { text-align: center; color: #666; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔍 Reporte de Comparación de Bases de Datos</h1>
        
        <div class="summary">
            <div class="summary-card">
                <h3>📊 Base de Datos de Producción</h3>
                <p><strong>Tablas:</strong> ${prodStructure.summary.totalTables}</p>
                <p><strong>Columnas:</strong> ${prodStructure.summary.totalColumns}</p>
                <p><strong>Índices:</strong> ${prodStructure.summary.totalIndexes}</p>
                <p><strong>Foreign Keys:</strong> ${prodStructure.summary.totalForeignKeys}</p>
            </div>
            <div class="summary-card">
                <h3>💻 Base de Datos Local</h3>
                <p><strong>Tablas:</strong> ${localStructure.summary.totalTables}</p>
                <p><strong>Columnas:</strong> ${localStructure.summary.totalColumns}</p>
                <p><strong>Índices:</strong> ${localStructure.summary.totalIndexes}</p>
                <p><strong>Foreign Keys:</strong> ${localStructure.summary.totalForeignKeys}</p>
            </div>
        </div>

        <h2>🔍 Diferencias Encontradas</h2>
        
        ${differences.length === 0 ? 
            '<div class="no-differences">✅ ¡Excelente! No se encontraron diferencias entre las bases de datos.</div>' :
            differences.map(diff => `
                <div class="difference ${diff.type.includes('MISSING') ? 'missing' : 'mismatch'}">
                    <div class="difference-type">${this.getDifferenceTypeLabel(diff.type)}</div>
                    <div>${diff.message}</div>
                    ${diff.production && diff.local ? `<div><strong>Producción:</strong> ${diff.production} | <strong>Local:</strong> ${diff.local}</div>` : ''}
                </div>
            `).join('')
        }

        <div class="timestamp">
            Reporte generado el ${new Date().toLocaleString('es-ES')}
        </div>
    </div>
</body>
</html>`;

        return html;
    }

    /**
     * Obtiene la etiqueta legible para el tipo de diferencia
     */
    getDifferenceTypeLabel(type) {
        const labels = {
            'MISSING_TABLE': '📋 Tabla Faltante',
            'MISSING_COLUMN': '📝 Columna Faltante',
            'MISSING_INDEX': '🔍 Índice Faltante',
            'MISSING_FOREIGN_KEY': '🔗 Foreign Key Faltante',
            'COLUMN_TYPE_MISMATCH': '⚠️ Tipo de Columna Diferente',
            'COLUMN_NULLABLE_MISMATCH': '⚠️ Nullable Diferente'
        };
        return labels[type] || type;
    }

    /**
     * Ejecuta la comparación completa
     */
    async run() {
        console.log('🚀 Iniciando comparación de bases de datos...\n');
        
        let prodClient, localClient;
        
        try {
            // Conectar a ambas bases de datos
            prodClient = await this.connectToDatabase(DB_URLS.production, 'Producción');
            localClient = await this.connectToDatabase(DB_URLS.local, 'Local');

            // Obtener estructuras
            this.results.production = await this.getDatabaseStructure(prodClient, 'Producción');
            this.results.local = await this.getDatabaseStructure(localClient, 'Local');

            // Comparar estructuras
            this.results.differences = this.compareStructures(this.results.production, this.results.local);

            // Mostrar resumen en consola
            this.printSummary();

            // Generar reporte HTML
            const htmlReport = this.generateHTMLReport(
                this.results.differences,
                this.results.production,
                this.results.local
            );

            const reportPath = path.join(__dirname, 'database-comparison-report.html');
            fs.writeFileSync(reportPath, htmlReport);
            console.log(`\n📄 Reporte HTML generado: ${reportPath}`);

            // Guardar también un reporte JSON
            const jsonReportPath = path.join(__dirname, 'database-comparison-report.json');
            fs.writeFileSync(jsonReportPath, JSON.stringify(this.results, null, 2));
            console.log(`📄 Reporte JSON generado: ${jsonReportPath}`);

        } catch (error) {
            console.error('❌ Error durante la comparación:', error.message);
            process.exit(1);
        } finally {
            // Cerrar conexiones
            if (prodClient) await prodClient.end();
            if (localClient) await localClient.end();
            console.log('\n🔌 Conexiones cerradas');
        }
    }

    /**
     * Imprime un resumen en la consola
     */
    printSummary() {
        console.log('\n' + '='.repeat(60));
        console.log('📊 RESUMEN DE LA COMPARACIÓN');
        console.log('='.repeat(60));
        
        console.log(`\n📈 Producción:`);
        console.log(`   Tablas: ${this.results.production.summary.totalTables}`);
        console.log(`   Columnas: ${this.results.production.summary.totalColumns}`);
        console.log(`   Índices: ${this.results.production.summary.totalIndexes}`);
        console.log(`   Foreign Keys: ${this.results.production.summary.totalForeignKeys}`);

        console.log(`\n💻 Local:`);
        console.log(`   Tablas: ${this.results.local.summary.totalTables}`);
        console.log(`   Columnas: ${this.results.local.summary.totalColumns}`);
        console.log(`   Índices: ${this.results.local.summary.totalIndexes}`);
        console.log(`   Foreign Keys: ${this.results.local.summary.totalForeignKeys}`);

        console.log(`\n🔍 Diferencias encontradas: ${this.results.differences.length}`);
        
        if (this.results.differences.length > 0) {
            console.log('\n⚠️  Lista de diferencias:');
            this.results.differences.forEach((diff, index) => {
                console.log(`   ${index + 1}. ${diff.message}`);
            });
        } else {
            console.log('\n✅ ¡Las bases de datos tienen la misma estructura!');
        }
    }
}

// Ejecutar el script si se llama directamente
if (require.main === module) {
    const comparator = new DatabaseComparator();
    comparator.run().catch(console.error);
}

module.exports = DatabaseComparator;