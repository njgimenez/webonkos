# Guía de SEO e Indexación para Onkos Web

## 📋 Archivos Creados

### 1. `robots.txt`
- ✅ Creado en `/frontend/public/robots.txt`
- Permite el rastreo de todas las páginas públicas
- Bloquea las páginas de administración
- Incluye referencia al sitemap

### 2. `sitemap.xml`
- ✅ Creado en `/frontend/public/sitemap.xml`
- Incluye todas las páginas principales
- Se puede generar dinámicamente con el script `generate-sitemap.js`

## 🔍 Pasos para Garantizar la Indexación en Google

### 1. Verificar que los archivos estén accesibles

Asegúrate de que estos archivos sean accesibles públicamente:
- `https://onkos.pe/robots.txt`
- `https://onkos.pe/sitemap.xml`

### 2. Google Search Console

1. **Verificar propiedad del sitio:**
   - Ve a [Google Search Console](https://search.google.com/search-console)
   - Agrega tu propiedad: `https://onkos.pe`
   - Verifica la propiedad usando uno de estos métodos:
     - **HTML tag**: Agrega una meta tag en `index.html`
     - **HTML file**: Sube un archivo HTML de verificación
     - **DNS**: Agrega un registro TXT en tu DNS

2. **Enviar sitemap:**
   - En Google Search Console, ve a "Sitemaps"
   - Ingresa: `https://onkos.pe/sitemap.xml`
   - Haz clic en "Enviar"

### 3. Verificar Meta Tags

Asegúrate de que cada página tenga:
- ✅ Título único y descriptivo (`<title>`)
- ✅ Meta descripción (`<meta name="description">`)
- ✅ Meta keywords (opcional pero recomendado)
- ✅ Open Graph tags para redes sociales
- ✅ Canonical URL para evitar contenido duplicado

### 4. Estructura de URLs

Las URLs deben ser:
- ✅ Amigables (slug-based)
- ✅ Jerárquicas y lógicas
- ✅ Sin parámetros innecesarios
- ✅ HTTPS habilitado

### 5. Contenido Optimizado

- ✅ Títulos H1 únicos en cada página
- ✅ Estructura de encabezados (H1, H2, H3)
- ✅ Contenido relevante y de calidad
- ✅ Imágenes con atributos `alt` descriptivos
- ✅ Enlaces internos relevantes

### 6. Performance

- ✅ Velocidad de carga rápida
- ✅ Mobile-friendly (responsive design)
- ✅ Core Web Vitals optimizados

## 🛠️ Mejoras Recomendadas

### 1. Meta Tags Dinámicos

Actualmente las meta tags están solo en `index.html`. Para mejorar el SEO:

**Opción A: Usar vue-meta o vue-head**
```bash
npm install @vueuse/head
```

**Opción B: Crear un composable para SEO**
```javascript
// composables/useSEO.js
export function useSEO(title, description, image) {
  document.title = title
  // Actualizar meta tags dinámicamente
}
```

### 2. Sitemap Dinámico

El sitemap actual es estático. Para incluir las entradas del blog dinámicamente:

1. **Backend**: Crear endpoint `/api/sitemap` que genere el XML
2. **Frontend**: Servir el sitemap desde el backend o generar en build time

### 3. Structured Data (Schema.org)

Agregar datos estructurados para:
- Organización (LocalBusiness/MedicalBusiness)
- Artículos del blog (Article)
- Servicios médicos (MedicalService)
- Profesionales (Physician)

Ejemplo:
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "MedicalBusiness",
  "name": "Onkos Instituto del Cáncer",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Av Brasil 3621",
    "addressLocality": "Magdalena del Mar",
    "addressRegion": "Lima",
    "addressCountry": "PE"
  }
}
</script>
```

### 4. Verificación de Google

Crea un archivo de verificación de Google Search Console:

1. En Google Search Console, selecciona "Verificación HTML"
2. Copia el código de verificación
3. Crea un archivo en `/frontend/public/google[hash].html` con ese código

## 📊 Monitoreo

### Herramientas Recomendadas

1. **Google Search Console**
   - Monitorear indexación
   - Ver errores de rastreo
   - Analizar búsquedas

2. **Google Analytics**
   - Tracking de tráfico
   - Comportamiento de usuarios

3. **PageSpeed Insights**
   - Performance
   - Core Web Vitals

4. **Lighthouse**
   - SEO score
   - Performance
   - Best practices

## ✅ Checklist de Indexación

- [ ] `robots.txt` accesible y correcto
- [ ] `sitemap.xml` accesible y actualizado
- [ ] Google Search Console configurado
- [ ] Sitemap enviado a Google Search Console
- [ ] Meta tags en todas las páginas
- [ ] Títulos únicos y descriptivos
- [ ] URLs amigables
- [ ] HTTPS habilitado
- [ ] Mobile-friendly
- [ ] Velocidad de carga optimizada
- [ ] Structured data implementado
- [ ] Imágenes con alt text
- [ ] Enlaces internos relevantes

## 🚀 Comandos Útiles

### Generar sitemap dinámicamente
```bash
cd frontend/public
node generate-sitemap.js
```

### Verificar robots.txt
```bash
curl https://onkos.pe/robots.txt
```

### Verificar sitemap
```bash
curl https://onkos.pe/sitemap.xml
```

## 📝 Notas Importantes

1. **Actualizar sitemap regularmente**: Cuando se publiquen nuevas entradas del blog
2. **Monitorear Google Search Console**: Revisar errores de rastreo semanalmente
3. **Optimizar contenido**: Asegurar que el contenido sea relevante y de calidad
4. **Backlinks**: Trabajar en obtener enlaces de sitios relevantes
5. **Local SEO**: Asegurar que la información de contacto esté correcta y visible

## 🔗 Enlaces Útiles

- [Google Search Console](https://search.google.com/search-console)
- [Google Rich Results Test](https://search.google.com/test/rich-results)
- [PageSpeed Insights](https://pagespeed.web.dev/)
- [Schema.org](https://schema.org/)
- [Google Search Central](https://developers.google.com/search)

