# 🔍 Comparador de Bases de Datos PostgreSQL

Este script te permite comparar la estructura de dos bases de datos PostgreSQL para identificar diferencias en tablas, columnas, índices, foreign keys, etc.

## 📋 Características

- ✅ Compara tablas y sus propiedades
- ✅ Compara columnas (tipo, nullable, default, etc.)
- ✅ Compara índices y constraints
- ✅ Compara foreign keys y primary keys
- ✅ Genera reportes en HTML y JSON
- ✅ Interfaz de consola amigable
- ✅ Soporte para SSL (Render.com)

## 🚀 Uso

### Opción 1: Usando npm scripts

```bash
# Desde el directorio backend
npm run compare-db
```

### Opción 2: Usando el script bash

```bash
# Desde el directorio backend
./scripts/compare-db.sh
```

### Opción 3: Ejecutar directamente

```bash
# Desde el directorio backend
node compare-databases.js
```

## 📊 Bases de Datos Configuradas

El script está configurado para comparar:

- **Producción**: `postgresql://onkos_user:SCef59zkV9OEYV1zSGXla0wDUA3wUVSA@dpg-d2rnp815pdvs73e0eisg-a.oregon-postgres.render.com/onkosdb`
- **Local**: `postgresql://master:Mazingerz78@localhost:5432/onkosdb`

## 📄 Reportes Generados

Después de ejecutar la comparación, se generan dos archivos:

1. **`database-comparison-report.html`** - Reporte visual con formato HTML
2. **`database-comparison-report.json`** - Datos estructurados en formato JSON

## 🔍 Tipos de Diferencias Detectadas

- **📋 Tabla Faltante**: Tabla que existe en una BD pero no en la otra
- **📝 Columna Faltante**: Columna que existe en una tabla pero no en la otra
- **🔍 Índice Faltante**: Índice que existe en una tabla pero no en la otra
- **🔗 Foreign Key Faltante**: Constraint de FK que existe en una tabla pero no en la otra
- **⚠️ Tipo de Columna Diferente**: Columna con tipo de dato diferente
- **⚠️ Nullable Diferente**: Columna con configuración nullable diferente

## 🛠️ Personalización

Para cambiar las URLs de conexión, edita el archivo `compare-databases.js` y modifica la variable `DB_URLS`:

```javascript
const DB_URLS = {
    production: 'tu_url_de_produccion_aqui',
    local: 'tu_url_local_aqui'
};
```

## 📋 Requisitos

- Node.js instalado
- Dependencia `pg` (ya incluida en package.json)
- Acceso a ambas bases de datos
- Para bases de datos en la nube (como Render), se configura SSL automáticamente

## 🔧 Solución de Problemas

### Error de conexión SSL
Si tienes problemas con SSL en bases de datos locales, el script detecta automáticamente si es necesario usar SSL.

### Error de permisos
Asegúrate de que el usuario de la base de datos tenga permisos para leer las tablas del esquema `public`.

### Timeout de conexión
Si las conexiones tardan mucho, puedes modificar el timeout en el código del script.

## 📝 Ejemplo de Salida

```
🚀 Iniciando comparación de bases de datos...

✅ Conectado a Producción
✅ Conectado a Local

📊 Analizando estructura de Producción...
  📋 Procesando tabla: users
  📋 Procesando tabla: posts
  📋 Procesando tabla: comments

📊 Analizando estructura de Local...
  📋 Procesando tabla: users
  📋 Procesando tabla: posts

🔍 Comparando estructuras...

============================================================
📊 RESUMEN DE LA COMPARACIÓN
============================================================

📈 Producción:
   Tablas: 3
   Columnas: 15
   Índices: 5
   Foreign Keys: 2

💻 Local:
   Tablas: 2
   Columnas: 10
   Índices: 3
   Foreign Keys: 1

🔍 Diferencias encontradas: 2

⚠️  Lista de diferencias:
   1. La tabla 'comments' no existe en local
   2. La columna 'created_at' no existe en local

📄 Reporte HTML generado: database-comparison-report.html
📄 Reporte JSON generado: database-comparison-report.json

🔌 Conexiones cerradas
🎉 Comparación completada!
```