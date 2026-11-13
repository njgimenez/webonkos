# Crear Token Clásico de GitHub

## Instrucciones Paso a Paso

### 1. Acceder a GitHub
1. Ve a [GitHub.com](https://github.com)
2. Inicia sesión con tu cuenta

### 2. Ir a Configuración de Tokens
1. Click en tu avatar (esquina superior derecha)
2. Selecciona **Settings**
3. En el menú lateral izquierdo, busca **Developer settings**
4. Click en **Personal access tokens**
5. Click en **Tokens (classic)**

### 3. Generar Nuevo Token
1. Click en **Generate new token (classic)**
2. Si te pide confirmar contraseña, ingrésala

### 4. Configurar el Token
- **Note**: `Onkos System Access`
- **Expiration**: `90 days` (recomendado)
- **Scopes**: Selecciona estos permisos:
  - `repo` (Full control of private repositories)
  - `workflow` (Update GitHub Action workflows)

### 5. Generar y Copiar
1. Click en **Generate token**
2. **IMPORTANTE**: Copia el token inmediatamente
3. El token se verá así: `ghp_xxxxxxxxxxxxxxxxxxxx`

### 6. Usar el Token
```bash
# Configurar el token en tu repositorio
git remote set-url origin https://ghp_xxxxxxxxxxxxxxxxxxxx@github.com/usuario/repositorio.git
```

## Diferencias entre Tokens

### Fine-grained Token (Actual)
- Formato: `github_pat_...`
- Más restrictivo
- Problemas con algunos comandos git

### Classic Token (Necesario)
- Formato: `ghp_...`
- Más permisivo
- Compatible con todos los comandos git

## Notas Importantes

1. **Seguridad**: No compartas el token
2. **Expiración**: Los tokens tienen fecha de vencimiento
3. **Permisos**: Solo los necesarios (repo, workflow)
4. **Backup**: Guarda el token en un lugar seguro

## Después de Crear el Token

Una vez que tengas el token clásico:

```bash
# Configurar el token en tu repositorio
git remote set-url origin https://ghp_xxxxxxxxxxxxxxxxxxxx@github.com/usuario/repositorio.git

# Verificar configuración
git remote -v

# Hacer push
git push origin main
```

## Configuración para Render.com

Si estás desplegando en Render.com, configura el token como variable de entorno:

1. Ve a tu proyecto en Render.com
2. Ve a **Environment**
3. Agrega la variable:
   - **Key**: `GITHUB_TOKEN`
   - **Value**: `ghp_xxxxxxxxxxxxxxxxxxxx`

## Solución de Problemas

### Error: "Authentication failed"
- Verificar que el token sea correcto
- Verificar que tenga los permisos necesarios
- Verificar que no haya expirado

### Error: "Repository not found"
- Verificar que el token tenga acceso al repositorio
- Verificar que el repositorio exista
- Verificar que el usuario tenga permisos

### Error: "Token expired"
- Generar un nuevo token
- Actualizar la configuración
- Verificar la fecha de expiración