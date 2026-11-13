const { Pool } = require('pg');
const config = require('./config');

// Configuración de la conexión a PostgreSQL
const pool = new Pool(config.getDatabaseConfig());

// Función para probar la conexión
const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log('Conexión a PostgreSQL establecida correctamente');
    client.release();
    return true;
  } catch (error) {
    console.error('Error conectando a PostgreSQL:', error.message);
    return false;
  }
};

// Función para formatear query con parámetros
const formatQuery = (text, params) => {
  if (!params || params.length === 0) {
    return text;
  }
  
  let formattedQuery = text;
  params.forEach((param, index) => {
    const placeholder = `$${index + 1}`;
    const value = typeof param === 'string' ? `'${param}'` : param;
    formattedQuery = formattedQuery.replace(new RegExp(`\\${placeholder}`, 'g'), value);
  });
  
  return formattedQuery;
};

// Función para ejecutar consultas
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    
    // Mostrar query formateada
    const formattedQuery = formatQuery(text, params);
    console.log('Query ejecutada:');
    console.log('Query formateada:', formattedQuery);
    console.log('Duración:', `${duration}ms`);
    console.log('Filas afectadas:', res.rowCount);
    console.log('---');
    
    return res;
  } catch (error) {
    console.error('Error en query:', error);
    const formattedQuery = formatQuery(text, params);
    console.error('Query que falló:', formattedQuery);
    throw error;
  }
};

// Función para obtener un cliente
const getClient = () => {
  return pool.connect();
};

module.exports = {
  query,
  getClient,
  testConnection,
  pool,
  formatQuery
}; 