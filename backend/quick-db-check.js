#!/usr/bin/env node

/**
 * Script rápido para verificar diferencias básicas entre bases de datos
 * Versión simplificada del comparador completo
 */

const { Client } = require('pg');

const DB_URLS = {
    production: 'postgresql://onkos_user:SCef59zkV9OEYV1zSGXla0wDUA3wUVSA@dpg-d2rnp815pdvs73e0eisg-a.oregon-postgres.render.com/onkosdb',
    local: 'postgresql://master:Mazingerz78@localhost:5432/onkosdb'
};

async function quickCheck() {
    console.log('🔍 Verificación rápida de bases de datos...\n');
    
    let prodClient, localClient;
    
    try {
        // Conectar a ambas bases de datos
        prodClient = new Client({
            connectionString: DB_URLS.production,
            ssl: { rejectUnauthorized: false }
        });
        localClient = new Client({
            connectionString: DB_URLS.local
        });
        
        await prodClient.connect();
        await localClient.connect();
        console.log('✅ Conectado a ambas bases de datos\n');
        
        // Obtener conteos básicos
        const prodTables = await prodClient.query(`
            SELECT COUNT(*) as count FROM information_schema.tables 
            WHERE table_schema = 'public'
        `);
        
        const localTables = await localClient.query(`
            SELECT COUNT(*) as count FROM information_schema.tables 
            WHERE table_schema = 'public'
        `);
        
        const prodColumns = await prodClient.query(`
            SELECT COUNT(*) as count FROM information_schema.columns 
            WHERE table_schema = 'public'
        `);
        
        const localColumns = await localClient.query(`
            SELECT COUNT(*) as count FROM information_schema.columns 
            WHERE table_schema = 'public'
        `);
        
        // Mostrar resumen
        console.log('📊 RESUMEN RÁPIDO:');
        console.log('='.repeat(40));
        console.log(`📈 Producción: ${prodTables.rows[0].count} tablas, ${prodColumns.rows[0].count} columnas`);
        console.log(`💻 Local:      ${localTables.rows[0].count} tablas, ${localColumns.rows[0].count} columnas`);
        
        const tableMatch = prodTables.rows[0].count === localTables.rows[0].count;
        const columnMatch = prodColumns.rows[0].count === localColumns.rows[0].count;
        
        console.log('\n🔍 ESTADO:');
        if (tableMatch && columnMatch) {
            console.log('✅ Las bases de datos parecen estar sincronizadas');
            console.log('💡 Para un análisis detallado, ejecuta: npm run compare-db');
        } else {
            console.log('⚠️  Se detectaron diferencias en la estructura');
            console.log('💡 Ejecuta: npm run compare-db para ver detalles completos');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        if (prodClient) await prodClient.end();
        if (localClient) await localClient.end();
    }
}

quickCheck();