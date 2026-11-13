# 🔄 Sistema de Sincronización de Bases de Datos

Este sistema permite sincronizar bidireccionalmente las bases de datos LOCAL y PROD de Onkos, manteniendo la integridad de los datos y proporcionando respaldos de seguridad.

## 📋 Scripts Disponibles

### 1. **Análisis de Diferencias**
```bash
node analyze-databases-sync.js
```
- Compara estructuras y datos entre LOCAL y PROD
- Genera reportes HTML y JSON detallados
- Identifica diferencias y conflictos potenciales

### 2. **Respaldo de Seguridad**
```bash
node backup-databases.js
```
- Crea respaldos completos de ambas bases de datos
- Genera archivos SQL y JSON
- Incluye manifesto de respaldo

### 3. **Sincronización de Estructura**
```bash
node sync-database-structure.js
```
- Sincroniza esquemas de tablas entre bases
- Agrega columnas faltantes
- Crea tablas que no existen

### 4. **Sincronización de Datos**

#### LOCAL → PROD
```bash
node sync-data-local-to-prod.js
```
- Sincroniza categorías (15 → 5)
- Crea tabla `entrada_categorias` en PROD
- Actualiza entradas y citas

#### PROD → LOCAL
```bash
node sync-data-prod-to-local.js
```
- Sincroniza pacientes (11 → 36)
- Sincroniza media (96 → 167)
- Actualiza citas y entradas

### 5. **Sincronización Completa**
```bash
node sync-databases-complete.js
```
- Ejecuta todo el proceso de sincronización
- Incluye respaldos automáticos
- Validación final

### 6. **Validación**
```bash
node validate-sync.js
```
- Verifica integridad de datos
- Compara conteos de registros
- Valida estructura de tablas

### 7. **Orquestador Principal**
```bash
node sync-orchestrator.js
```
- Menú interactivo con todas las opciones
- Ejecución paso a paso
- Visualización de reportes

## 🚀 Proceso Recomendado

### **Opción A: Sincronización Automática Completa**
```bash
# 1. Crear respaldos
node backup-databases.js

# 2. Ejecutar sincronización completa
node sync-databases-complete.js

# 3. Validar resultado
node validate-sync.js
```

### **Opción B: Sincronización Manual Paso a Paso**
```bash
# 1. Analizar diferencias
node analyze-databases-sync.js

# 2. Crear respaldos
node backup-databases.js

# 3. Sincronizar estructura
node sync-database-structure.js

# 4. Sincronizar datos LOCAL → PROD
node sync-data-local-to-prod.js

# 5. Sincronizar datos PROD → LOCAL
node sync-data-prod-to-local.js

# 6. Validar sincronización
node validate-sync.js
```

### **Opción C: Usar Orquestador Interactivo**
```bash
node sync-orchestrator.js
```

## 📊 Diferencias Identificadas

### **Estructura:**
- **LOCAL** tiene columnas adicionales en `categorias`: `parent_id`, `nivel`, `ruta_completa`
- **LOCAL** tiene tabla `entrada_categorias` que no existe en PROD
- **PROD** tiene columna `categoria_id` en `entradas` que LOCAL no tiene

### **Datos:**
- **categorias**: LOCAL=15, PROD=5 (diferencia: 10)
- **pacientes**: LOCAL=11, PROD=36 (diferencia: 25)
- **media**: LOCAL=96, PROD=167 (diferencia: 71)
- **entradas**: LOCAL=56, PROD=49 (diferencia: 7)
- **citas**: LOCAL=17, PROD=21 (diferencia: 4)

## ⚠️ Consideraciones Importantes

### **Antes de Ejecutar:**
1. **Crear respaldos** de ambas bases de datos
2. **Verificar conectividad** a ambas bases
3. **Revisar el análisis** de diferencias
4. **Planificar ventana de mantenimiento**

### **Durante la Ejecución:**
1. **No interrumpir** el proceso una vez iniciado
2. **Monitorear logs** para detectar errores
3. **Verificar espacio en disco** para respaldos

### **Después de la Ejecución:**
1. **Validar sincronización** con el script de validación
2. **Probar funcionalidad** de la aplicación
3. **Verificar integridad** de datos críticos

## 📁 Archivos Generados

### **Reportes:**
- `database-sync-analysis.json` - Análisis detallado
- `database-sync-analysis.html` - Reporte visual
- `structure-sync-report.json` - Sincronización de estructura
- `local-to-prod-sync-report.json` - Datos LOCAL → PROD
- `prod-to-local-sync-report.json` - Datos PROD → LOCAL
- `complete-sync-report.json` - Sincronización completa
- `validation-report.json` - Validación final

### **Respaldos:**
- `backups/backup-YYYY-MM-DDTHH-mm-ss/` - Directorio de respaldos
- `local-backup.sql` - Respaldo SQL de LOCAL
- `prod-backup.sql` - Respaldo SQL de PROD
- `local-data.json` - Datos JSON de LOCAL
- `prod-data.json` - Datos JSON de PROD
- `backup-manifest.json` - Manifesto de respaldo

## 🔧 Configuración

### **Credenciales de Base de Datos:**
```javascript
// LOCAL
const localConfig = {
  host: 'localhost',
  port: 5432,
  database: 'onkosdb',
  user: 'master',
  password: 'Mazingerz78'
};

// PROD
const prodConfig = {
  connectionString: 'postgresql://onkos_user:SCef59zkV9OEYV1zSGXla0wDUA3wUVSA@dpg-d2rnp815pdvs73e0eisg-a.oregon-postgres.render.com/onkosdb',
  ssl: { rejectUnauthorized: false }
};
```

## 🆘 Solución de Problemas

### **Error de Conexión:**
- Verificar credenciales
- Comprobar conectividad de red
- Verificar configuración SSL para PROD

### **Error de Permisos:**
- Verificar permisos de usuario en ambas bases
- Comprobar permisos de escritura en directorio de respaldos

### **Error de Integridad:**
- Revisar foreign keys
- Verificar datos huérfanos
- Ejecutar validación detallada

## 📞 Soporte

Para problemas o dudas:
1. Revisar logs de error en los reportes
2. Verificar configuración de conexiones
3. Consultar documentación de PostgreSQL
4. Contactar al administrador del sistema

---

**⚠️ IMPORTANTE:** Siempre crear respaldos antes de ejecutar cualquier sincronización. Este proceso modifica datos en ambas bases de datos.