const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
  transpileDependencies: true,
  publicPath: process.env.NODE_ENV === 'production' ? '/' : '/',
  
  // Configuración para producción
  productionSourceMap: false,
  
  // Configuración de build optimizada
  configureWebpack: config => {
    if (process.env.NODE_ENV === 'production') {
      // Optimizaciones para producción
      config.optimization = {
        ...config.optimization,
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
  },
  devServer: {
    port: 8080,
    host: '0.0.0.0',
    allowedHosts: 'all',
    historyApiFallback: true, // Importante para el router de Vue
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
        logLevel: 'debug',
        onProxyReq: (proxyReq, req, res) => {
          console.log('🔄 Proxy request:', req.method, req.url)
        },
        onProxyRes: (proxyRes, req, res) => {
          console.log('✅ Proxy response:', proxyRes.statusCode, req.url)
        },
        onError: (err, req, res) => {
          console.error('❌ Proxy error:', err.message)
        }
      },
      '/uploads': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false
      }
    }
  },
  css: {
    loaderOptions: {
      scss: {
        additionalData: `@import "@/assets/styles/variables.scss";`
      }
    }
  }
}) 