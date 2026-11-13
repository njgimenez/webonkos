# Scripts del Proyecto - Onkos Instituto del Cáncer

## Estructura de Scripts

El proyecto ha sido simplificado y los scripts obsoletos han sido eliminados. Ahora solo se mantienen los scripts esenciales para el funcionamiento del sistema.

## Scripts Disponibles

### Backend

#### `init-database.js`
**Propósito**: Inicialización completa de la base de datos
```bash
cd backend
node init-database.js
```
**Funciones**:
- Crea todas las tablas necesarias
- Inserta datos de ejemplo
- Configura usuarios y roles
- Verifica la conexión

#### `create-blog-tables.js`
**Propósito**: Crear tablas específicas del blog
```bash
cd backend
node create-blog-tables.js
```
**Funciones**:
- Crea tablas `entradas` y `categorias`
- Configura índices y relaciones
- Establece permisos

#### `seed-data.js`
**Propósito**: Insertar datos de ejemplo
```bash
cd backend
node seed-data.js
```
**Funciones**:
- Inserta médicos y especialidades
- Crea usuarios de ejemplo
- Configura horarios y citas

#### `seed-blog-data.js`
**Propósito**: Insertar datos del blog
```bash
cd backend
node seed-blog-data.js
```
**Funciones**:
- Crea categorías del blog
- Inserta entradas de ejemplo
- Configura contenido inicial

#### `seed-menu-entries.js`
**Propósito**: Configurar menús del sistema
```bash
cd backend
node seed-menu-entries.js
```
**Funciones**:
- Crea entradas de menú
- Configura navegación
- Establece permisos de acceso

#### `add-sample-images.js`
**Propósito**: Agregar imágenes de ejemplo
```bash
cd backend
node add-sample-images.js
```
**Funciones**:
- Sube imágenes a Cloudinary
- Asocia imágenes con entradas
- Configura URLs de imágenes

## Uso Rápido

### Instalación Inicial
```bash
# 1. Clonar repositorio
git clone <repository-url>
cd webIAcontrol

# 2. Instalar dependencias del backend
cd backend
npm install

# 3. Configurar variables de entorno
cp config.env.example config.env
# Editar config.env con tus credenciales

# 4. Inicializar base de datos
node init-database.js

# 5. Iniciar servidor
npm start
```

### Instalación del Frontend
```bash
# 1. Instalar dependencias del frontend
cd frontend
npm install

# 2. Iniciar servidor de desarrollo
npm run serve
```

### Desarrollo Diario
```bash
# Iniciar backend
cd backend
npm start

# Iniciar frontend (en otra terminal)
cd frontend
npm run serve
```

## Comandos NPM Disponibles

### Backend
```bash
cd backend
npm start          # Iniciar servidor
npm run dev        # Modo desarrollo (si está configurado)
```

### Frontend
```bash
cd frontend
npm run serve      # Servidor de desarrollo
npm run build      # Construir para producción
npm run lint       # Linter
```

## Configuración de Base de Datos

### Inicialización Completa
```bash
cd backend
node init-database.js
```

### Solo Tablas del Blog
```bash
cd backend
node create-blog-tables.js
```

### Solo Datos de Ejemplo
```bash
cd backend
node seed-data.js
node seed-blog-data.js
node seed-menu-entries.js
```

## Variables de Entorno Requeridas

### Backend (`backend/config.env`)
```env
# Base de datos
DATABASE_URL=postgresql://usuario:password@host:puerto/database

# Servidor
PORT=3001
NODE_ENV=development

# API Keys
GROQ_API_KEY=[REDACTED]

# Cloudinary (opcional)
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret
```

## Solución de Problemas

### Error: "Port already in use"
```bash
# Detener procesos en puerto 3001
pkill -f "node server.js"
# O cambiar puerto en config.env
```

### Error: "Database connection failed"
```bash
# Verificar PostgreSQL
sudo systemctl status postgresql
sudo systemctl start postgresql

# Verificar configuración
cat backend/config.env
```

### Error: "Module not found"
```bash
# Reinstalar dependencias
cd backend
rm -rf node_modules package-lock.json
npm install
```

### Error: "Permission denied"
```bash
# Dar permisos de ejecución
chmod +x scripts/*.sh
```

## Estructura de Archivos

```
webIAcontrol/
├── backend/
│   ├── init-database.js        # Inicialización completa
│   ├── create-blog-tables.js   # Tablas del blog
│   ├── seed-data.js           # Datos de ejemplo
│   ├── seed-blog-data.js      # Datos del blog
│   ├── seed-menu-entries.js   # Menús del sistema
│   ├── add-sample-images.js   # Imágenes de ejemplo
│   ├── server.js              # Servidor principal
│   ├── config.js              # Configuración
│   ├── database.js            # Conexión BD
│   └── routes/                # Rutas de la API
├── frontend/
│   ├── src/                   # Código fuente
│   └── package.json           # Dependencias
└── docs/                      # Documentación
```

## Notas Importantes

- Los scripts obsoletos han sido eliminados para mantener el proyecto limpio
- Solo se mantienen los scripts esenciales para el funcionamiento
- Todos los scripts están documentados y son fáciles de usar
- La configuración se realiza principalmente a través de `config.env`

## Documentación Relacionada

- [README.md](../README.md) - Documentación principal
- [DATABASE_SETUP.md](./DATABASE_SETUP.md) - Configuración de base de datos
- [create-classic-token.md](./create-classic-token.md) - Configuración de tokens
- [setup-ssh-keys.md](./setup-ssh-keys.md) - Configuración SSH