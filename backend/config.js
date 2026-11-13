// Configuración centralizada para el backend
// Prioridad: Variables del sistema (Render.com) > config.env > valores por defecto

require('dotenv').config({ path: './config.env' });
require('dotenv').config(); // Variables del sistema

const config = {
  // Servidor
  server: {
    port: process.env.PORT || 3001,
    env: process.env.NODE_ENV || 'development'
  },

  // Base de datos
  database: {
    // Prioridad: DATABASE_URL (Render.com) > variables individuales
    url: process.env.DATABASE_URL,
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    name: process.env.DB_NAME || 'onkosdb',
    user: process.env.DB_USER || 'master',
    password: process.env.DB_PASSWORD || 'Mazingerz78',
    ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
  },

  // AI
  ai: {
    groqApiKey: process.env.GROQ_API_KEY
  },

  // CORS
  // CORS
  cors: {
    origin: process.env.CORS_ORIGIN
      ? (process.env.CORS_ORIGIN.includes(',')
        ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
        : process.env.CORS_ORIGIN)
      : [
        'http://localhost:8080',
        'http://onkosweb.com:8080',
        'https://onkosweb.onrender.com',
        'https://onkos.pe'
      ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  },

  // Seguridad
  security: {
    jwtSecret: process.env.JWT_SECRET || 'default-secret-change-in-production'
  }
};

// Función para obtener configuración de base de datos
config.getDatabaseConfig = () => {
  if (config.database.url) {
    console.log('Usando DATABASE_URL para conexión a base de datos');
    return {
      connectionString: config.database.url,
      ssl: { rejectUnauthorized: false }
    };
  }

  console.log('Usando variables individuales para conexión local');
  return {
    host: config.database.host,
    port: config.database.port,
    database: config.database.name,
    user: config.database.user,
    password: config.database.password,
    ssl: config.database.ssl
  };
};

// Función para validar configuración
config.validate = () => {
  const errors = [];

  if (!config.ai.groqApiKey) {
    errors.push('GROQ_API_KEY no está configurada');
  }

  if (!config.database.url && !config.database.host) {
    errors.push('No hay configuración de base de datos');
  }

  if (errors.length > 0) {
    console.warn('Advertencias de configuración:');
    errors.forEach(error => console.warn(`   • ${error}`));
    return false;
  }

  return true;
};

// Mostrar configuración al iniciar
console.log('Configuración del backend:');
console.log(`   Entorno: ${config.server.env}`);
console.log(`   Puerto: ${config.server.port}`);
console.log(`   Base de datos: ${config.database.url ? 'DATABASE_URL' : 'Variables individuales'}`);
console.log(`   CORS Origin: ${config.cors.origin}`);

module.exports = config; 