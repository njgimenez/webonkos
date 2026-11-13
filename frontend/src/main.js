import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import axios from 'axios'
import './assets/styles/main.scss'

// Configurar axios globalmente
axios.defaults.headers.common['Content-Type'] = 'application/json'

// Configurar baseURL según el entorno
if (process.env.NODE_ENV === 'production') {
  // En producción, usar la variable de entorno VUE_APP_API_URL
  axios.defaults.baseURL = process.env.VUE_APP_API_URL || 'https://webiacontrol-back.onrender.com'
  console.log('🚀 Producción - BaseURL:', axios.defaults.baseURL)
} else {
  // En desarrollo, usar proxy
  axios.defaults.baseURL = ''
  console.log('🔧 Desarrollo - Usando proxy')
}
  
// Interceptor para debug
axios.interceptors.request.use(config => {
  console.log('🌐 Request URL:', config.url)
  console.log('🌐 BaseURL:', config.baseURL)
  console.log('🌐 Full URL:', config.baseURL + config.url)
  
  // En desarrollo, forzar el uso del proxy para peticiones API
  if (process.env.NODE_ENV === 'development' && config.url && config.url.startsWith('/api/')) {
    // Asegurar que use la URL relativa para el proxy
    config.url = config.url
    console.log('🔧 Forzando proxy para:', config.url)
    
    // Forzar el uso del proxy eliminando cualquier baseURL absoluta
    if (config.baseURL && config.baseURL.startsWith('http')) {
      config.baseURL = ''
      console.log('🔧 Removida baseURL absoluta')
    }
    
    // Forzar el uso del proxy para el dominio onkos.pe
    if (window.location.hostname === 'onkos.pe') {
      config.baseURL = ''
      console.log('🔧 Forzando proxy para onkos.pe')
    }
  }
  
  return config
})

const app = createApp(App)

// Hacer axios disponible globalmente como $http
app.config.globalProperties.$http = axios

app.use(router)
app.mount('#app') 