// Configuración de despliegue para Render.com
// Este archivo se usa para configurar el entorno de producción

module.exports = {
  // Configuración del servidor
  server: {
    port: process.env.PORT || 3001,
    env: process.env.NODE_ENV || 'production'
  },
  
  // Configuración de la base de datos
  database: {
    url: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  },
  
  // Configuración de CORS
  cors: {
    origin: process.env.CORS_ORIGIN || 'https://onkosweb.com',
    credentials: true
  },
  
  // Configuración de AI
  ai: {
    groqApiKey: process.env.GROQ_API_KEY
  },
  
  // Configuración de seguridad
  security: {
    jwtSecret: process.env.JWT_SECRET || 'default-secret-change-in-production'
  }
}; 