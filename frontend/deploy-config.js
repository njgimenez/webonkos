// Configuración para el despliegue en Render.com
// Este archivo se usa para configurar el frontend en producción

const config = {
  // URL del backend en Render.com
  apiUrl: process.env.VUE_APP_API_URL || 'https://webiacontrol-back.onrender.com',
  
  // URL base del frontend
  baseUrl: process.env.VUE_APP_BASE_URL || 'https://onkos.pe',
  
  // Entorno
  env: process.env.NODE_ENV || 'production',
  
  // Configuración de build
  build: {
    // Directorio de salida
    outputDir: 'dist',
    
    // Assets públicos
    publicPath: '/',
    
    // Configuración de producción
    productionSourceMap: false,
    
    // Optimizaciones
    configureWebpack: {
      optimization: {
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all'
            }
          }
        }
      }
    }
  }
};

module.exports = config; 