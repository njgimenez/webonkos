# Onkos Instituto del Cáncer - Sistema Web

Sistema web completo para el Onkos Instituto del Cáncer, incluyendo blog, panel administrativo y chatbot con IA.

## Características

- **Blog público** con sistema de categorías y filtros
- **Panel administrativo** para gestión de contenido
- **Chatbot inteligente** con IA (Groq)
- **Sistema de imágenes** con Cloudinary
- **Base de datos PostgreSQL** con migraciones automáticas
- **API REST** completa
- **Frontend Vue.js** responsive

## Estructura del Proyecto

```
webIAcontrol/
├── backend/                 # API Node.js/Express
│   ├── routes/             # Rutas de la API
│   ├── config.js           # Configuración centralizada
│   ├── database.js         # Conexión a PostgreSQL
│   ├── server.js           # Servidor principal
│   └── cloudinary-config.js # Configuración de imágenes
├── frontend/               # Aplicación Vue.js
│   ├── src/
│   │   ├── components/     # Componentes reutilizables
│   │   ├── views/          # Vistas principales
│   │   └── router/         # Configuración de rutas
│   └── package.json
└── docs/                   # Documentación
```

## Instalación y Configuración

### Prerrequisitos

- Node.js 18+
- PostgreSQL 12+
- Cuenta en Cloudinary (opcional)
- API Key de Groq (opcional)

### 1. Clonar el repositorio

```bash
git clone <repository-url>
cd webIAcontrol
```

### 2. Configurar Backend

```bash
cd backend
npm install
```

Crear archivo `config.env` basado en `config.env.example`:

```env
# API Key de Groq AI
GROQ_API_KEY=[REDACTED]

# Puerto del servidor backend
PORT=3001

# Entorno de ejecución
NODE_ENV=development

# URL de conexión a PostgreSQL
DATABASE_URL=postgresql://usuario:password@host:puerto/database

# Configuración de Cloudinary (opcional)
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret
```

### 3. Configurar Frontend

```bash
cd frontend
npm install
```

### 4. Inicializar Base de Datos

```bash
cd backend
node init-database.js
```

### 5. Ejecutar el Sistema

**Backend:**
```bash
cd backend
npm start
```

**Frontend:**
```bash
cd frontend
npm run serve
```

## API Endpoints

### Blog Público
- `GET /api/blog/entradas` - Obtener entradas del blog
- `GET /api/blog/categorias` - Obtener categorías
- `GET /api/blog/entradas/slug/:slug` - Obtener entrada por slug

### Panel Administrativo
- `GET /api/blog/admin/entradas` - Obtener todas las entradas (admin)
- `POST /api/blog/admin/entradas` - Crear nueva entrada
- `PUT /api/blog/admin/entradas/:id` - Actualizar entrada
- `DELETE /api/blog/admin/entradas/:id` - Eliminar entrada

### Chatbot
- `POST /api/ai/chat` - Enviar mensaje al chatbot

## Configuración de Producción

### Variables de Entorno Requeridas

```env
NODE_ENV=production
DATABASE_URL=postgresql://...
GROQ_API_KEY=[REDACTED]
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

### Despliegue en Render.com

1. Conectar repositorio a Render
2. Configurar variables de entorno
3. Usar `render.yaml` para configuración automática

## Estructura de Base de Datos

### Tablas Principales

- `entradas` - Entradas del blog
- `categorias` - Categorías del blog
- `usuarios` - Usuarios del sistema
- `medicos` - Información de médicos
- `especialidades` - Especialidades médicas

## Desarrollo

### Scripts Disponibles

```bash
# Backend
npm start          # Iniciar servidor
npm run dev        # Modo desarrollo

# Frontend
npm run serve      # Servidor de desarrollo
npm run build      # Construir para producción
npm run lint       # Linter
```

### Estructura de Rutas

- `/` - Página principal
- `/blog` - Blog público
- `/admin/blog` - Panel administrativo
- `/doctores` - Información de médicos
- `/servicios` - Servicios médicos
- `/contacto` - Información de contacto

## Tecnologías Utilizadas

### Backend
- Node.js + Express
- PostgreSQL
- Groq AI SDK
- Cloudinary
- Multer (upload de archivos)

### Frontend
- Vue.js 3
- Vue Router
- Axios
- SCSS
- Font Awesome

### DevOps
- Render.com
- PostgreSQL (Render)
- Cloudinary CDN

## Contribución

1. Fork el proyecto
2. Crear rama para feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -m 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abrir Pull Request

## Licencia

Este proyecto es privado y pertenece al Onkos Instituto del Cáncer.

## Soporte

Para soporte técnico, contactar al equipo de desarrollo.

---

**Onkos Instituto del Cáncer**  
Av Brasil 3621, Magdalena del Mar, Lima - Perú  
Teléfono: (+51) 933 598 495