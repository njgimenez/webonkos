# 🔧 Instrucciones para Configurar CORS en Render.com

## ⚠️ Problema Identificado

El backend está bloqueando las solicitudes desde `https://onkos.pe/` debido a la configuración de CORS. El backend solo permite solicitudes desde:
- `http://localhost:8080`
- `http://onkosweb.com:8080`
- `https://onkosweb.onrender.com`

Pero **NO** desde `https://onkos.pe` (tu dominio personalizado).

---

## ✅ Solución Implementada Localmente

Se actualizó el archivo `backend/config.js` para incluir `https://onkos.pe` en la lista de orígenes permitidos.

---

## 🚀 Pasos para Actualizar en Render.com

### Opción 1: Usar Variable de Entorno (RECOMENDADO)

1. **Ir al Dashboard de Render.com**
   - Accede a: https://dashboard.render.com/
   - Selecciona tu servicio de backend: `webiacontrol-back`

2. **Configurar Variable de Entorno CORS_ORIGIN**
   - En el menú lateral, haz clic en **"Environment"**
   - Busca la variable `CORS_ORIGIN` (si no existe, créala)
   - Establece el valor como:
     ```
     https://onkosweb.onrender.com,https://onkos.pe
     ```
   - **Importante:** Separar los dominios con comas, SIN espacios

3. **Guardar y Redesplegar**
   - Haz clic en **"Save Changes"**
   - Render.com automáticamente redesplegará el backend
   - Espera 2-3 minutos para que el servicio se reinicie

### Opción 2: Desplegar el Código Actualizado

Si prefieres que el código maneje la configuración:

1. **Hacer commit de los cambios locales**
   ```bash
   git add backend/config.js
   git commit -m "fix: agregar https://onkos.pe a CORS origins"
   git push origin mejoras
   ```

2. **Trigger Manual Deploy en Render.com**
   - Ve a tu servicio de backend en Render.com
   - Haz clic en **"Manual Deploy"** → **"Deploy latest commit"**
   - Espera a que el despliegue se complete

---

## 🧪 Verificar que Funciona

Después de aplicar la solución, verifica:

1. **Abrir la consola del navegador** en `https://onkos.pe/`
2. **Intentar hacer login** o cargar las entradas del blog
3. **Verificar que NO aparezcan errores de CORS** en la consola
4. **Confirmar que los datos se cargan correctamente**

### Comandos de Verificación

Puedes probar desde la terminal:

```bash
# Verificar que el backend responde
curl https://webiacontrol-back.onrender.com/api/health

# Verificar headers CORS (debería incluir onkos.pe)
curl -I -X OPTIONS https://webiacontrol-back.onrender.com/api/health \
  -H "Origin: https://onkos.pe" \
  -H "Access-Control-Request-Method: GET"
```

---

## 📋 Configuración Recomendada en Render.com

### Variables de Entorno Esenciales

Asegúrate de tener configuradas estas variables en Render.com:

| Variable | Valor Recomendado |
|----------|-------------------|
| `NODE_ENV` | `production` |
| `PORT` | (Automático por Render) |
| `DATABASE_URL` | (Tu PostgreSQL URL) |
| `GROQ_API_KEY` | (Tu API Key de Groq) |
| `CORS_ORIGIN` | `https://onkosweb.onrender.com,https://onkos.pe` |
| `JWT_SECRET` | (Un string secreto seguro) |
| `CLOUDINARY_CLOUD_NAME` | (Tu Cloudinary cloud name) |
| `CLOUDINARY_API_KEY` | (Tu Cloudinary API key) |
| `CLOUDINARY_API_SECRET` | (Tu Cloudinary API secret) |

---

## 🔍 Troubleshooting

### Si aún no funciona después de desplegar:

1. **Verificar logs en Render.com**
   - Ve a tu servicio → Pestaña "Logs"
   - Busca la línea que dice: `CORS Origin: ...`
   - Debe incluir `https://onkos.pe`

2. **Limpiar caché del navegador**
   - Presiona `Ctrl + Shift + R` (Windows/Linux)
   - O `Cmd + Shift + R` (Mac)
   - Para forzar recarga sin caché

3. **Verificar que el dominio está bien configurado**
   - Asegúrate de que `onkos.pe` apunta correctamente a `onkosweb.onrender.com`
   - Verifica en tu proveedor de DNS

4. **Revisar la consola del navegador**
   - Abre DevTools (F12)
   - Ve a la pestaña "Network"
   - Busca las solicitudes al backend
   - Verifica los headers de respuesta

---

## 📝 Notas Adicionales

- **Tiempo de propagación:** Los cambios en Render.com pueden tardar 2-3 minutos
- **Caché de DNS:** Si cambiaste configuración de DNS, puede tardar hasta 24 horas
- **HTTPS:** Asegúrate de que ambos dominios usen HTTPS (no mezclar HTTP/HTTPS)
- **Wildcards:** Si quieres permitir subdominios, considera usar `*.onkos.pe`

---

## 🎯 Resumen

**Cambio realizado:**
- ✅ Agregado `https://onkos.pe` a la lista de orígenes CORS permitidos

**Acción requerida:**
- 🔄 Desplegar el código actualizado en Render.com
- O configurar la variable `CORS_ORIGIN` en Render.com

**Resultado esperado:**
- ✅ Las solicitudes desde `https://onkos.pe/` funcionarán correctamente
- ✅ El login y las entradas del blog se cargarán sin problemas
- ✅ No más errores de CORS en la consola del navegador
