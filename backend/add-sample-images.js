const { query } = require('./database.js');

// Mapeo de imágenes de ejemplo para diferentes tipos de entradas
const imageMapping = {
  // Unidades médicas
  'oncologia-medica': 'https://webiacontrol-back.onrender.com/uploads/oncologia-medica-sample.jpg',
  'oncologia-quirurgica': 'https://webiacontrol-back.onrender.com/uploads/oncologia-quirurgica-sample.jpg',
  'radiologia-oncologica': 'https://webiacontrol-back.onrender.com/uploads/radiologia-oncologica-sample.jpg',
  'ginecologia-oncologica': 'https://webiacontrol-back.onrender.com/uploads/ginecologia-oncologica-sample.jpg',
  'gastro-oncologia': 'https://webiacontrol-back.onrender.com/uploads/gastro-oncologia-sample.jpg',
  'urologia-oncologica': 'https://webiacontrol-back.onrender.com/uploads/urologia-oncologica-sample.jpg',
  
  // Programas especiales
  'onkos-humano': 'https://webiacontrol-back.onrender.com/uploads/onkos-humano-sample.jpg',
  'diagnostico-rapido': 'https://webiacontrol-back.onrender.com/uploads/diagnostico-rapido-sample.jpg',
  'opinion-experta': 'https://webiacontrol-back.onrender.com/uploads/opinion-experta-sample.jpg',
  'teleoncologia': 'https://webiacontrol-back.onrender.com/uploads/teleoncologia-sample.jpg',
  
  // Terapias sistémicas
  'quimioterapia': 'https://webiacontrol-back.onrender.com/uploads/quimioterapia-sample.jpg',
  'moleculares': 'https://webiacontrol-back.onrender.com/uploads/terapias-moleculares-sample.jpg',
  'inmunoterapia': 'https://webiacontrol-back.onrender.com/uploads/inmunoterapia-sample.jpg',
  'reposicionamiento': 'https://webiacontrol-back.onrender.com/uploads/reposicionamiento-sample.jpg',
  
  // Terapias locorregionales
  'terapias-intra-peritoneales-tips': 'https://webiacontrol-back.onrender.com/uploads/terapias-intra-peritoneales-sample.jpg',
  'terapias-intratumorales-tits': 'https://webiacontrol-back.onrender.com/uploads/terapias-intratumorales-sample.jpg',
  'inmunoterapia-amplificada-ita': 'https://webiacontrol-back.onrender.com/uploads/inmunoterapia-amplificada-sample.jpg',
  
  // Soporte terapéutico
  'vitamina-c': 'https://webiacontrol-back.onrender.com/uploads/vitamina-c-sample.jpg',
  'muerdago': 'https://webiacontrol-back.onrender.com/uploads/muerdago-sample.jpg',
  'nutraceutica': 'https://webiacontrol-back.onrender.com/uploads/nutraceutica-sample.jpg',
  
  // Investigación por cáncer
  'cuello-uterino': 'https://webiacontrol-back.onrender.com/uploads/cuello-uterino-sample.jpg',
  'via-biliar': 'https://webiacontrol-back.onrender.com/uploads/via-biliar-sample.jpg',
  'linfoma': 'https://webiacontrol-back.onrender.com/uploads/linfoma-sample.jpg',
  'mama': 'https://webiacontrol-back.onrender.com/uploads/mama-sample.jpg',
  
  // Investigación por condición
  'carcinomatosis': 'https://webiacontrol-back.onrender.com/uploads/carcinomatosis-sample.jpg',
  'derrame-pleural': 'https://webiacontrol-back.onrender.com/uploads/derrame-pleural-sample.jpg',
  'metastasis-osea': 'https://webiacontrol-back.onrender.com/uploads/metastasis-osea-sample.jpg',
  
  // Investigación por molécula
  'oxalaplatino': 'https://webiacontrol-back.onrender.com/uploads/oxalaplatino-sample.jpg',
  'ciplatino': 'https://webiacontrol-back.onrender.com/uploads/ciplatino-sample.jpg',
  
  // Otros
  'medicos-asociados': 'https://webiacontrol-back.onrender.com/uploads/medicos-asociados-sample.jpg',
  'centros-asociados': 'https://webiacontrol-back.onrender.com/uploads/centros-asociados-sample.jpg',
  'terapia-molecular-antalgica-tma': 'https://webiacontrol-back.onrender.com/uploads/terapia-molecular-antalgica-sample.jpg',
  'convencionales': 'https://webiacontrol-back.onrender.com/uploads/convencionales-sample.jpg',
  
  // Artículos de investigación
  'avances-en-tratamiento-de-c-ncer-de-mama': 'https://webiacontrol-back.onrender.com/uploads/cancer-mama-avances-sample.jpg',
  'importancia-de-la-nutrici-n-en-pacientes-oncol-gicos': 'https://webiacontrol-back.onrender.com/uploads/nutricion-oncologica-sample.jpg',
  'nuevas-terapias-de-inmunoterapia': 'https://webiacontrol-back.onrender.com/uploads/inmunoterapia-avanzada-sample.jpg',
  'prevenci-n-del-c-ncer-factores-de-riesgo-modificables': 'https://webiacontrol-back.onrender.com/uploads/prevencion-cancer-sample.jpg',
  'investigaci-n-en-c-ncer-de-pulm-n-nuevos-horizontes': 'https://webiacontrol-back.onrender.com/uploads/cancer-pulmon-investigacion-sample.jpg',
  
  // Casos y artículos
  'casos': 'https://webiacontrol-back.onrender.com/uploads/casos-clinicos-sample.jpg',
  'articulos': 'https://webiacontrol-back.onrender.com/uploads/articulos-oncologia-sample.jpg',
  'fotovideoteca': 'https://webiacontrol-back.onrender.com/uploads/fotovideoteca-onkos-sample.jpg'
};

async function addSampleImages() {
  try {
    console.log('🚀 Agregando imágenes de ejemplo a las entradas...');
    
    // Obtener entradas que no tienen imagen principal
    const entries = await query(`
      SELECT id, slug, titulo 
      FROM entradas 
      WHERE estado = 'publicado' 
      AND (imagen_principal IS NULL OR imagen_principal = '' OR imagen_principal = 'Sin imagen')
      ORDER BY id
    `);
    
    console.log(`📊 Encontradas ${entries.rows.length} entradas sin imagen principal`);
    
    let updatedCount = 0;
    
    for (const entry of entries.rows) {
      const slug = entry.slug;
      
      if (imageMapping[slug]) {
        const imagePath = imageMapping[slug];
        
        // Actualizar la entrada con la imagen
        await query(`
          UPDATE entradas 
          SET 
            imagen_principal = $1,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $2
        `, [imagePath, entry.id]);
        
        console.log(`✅ Agregada imagen a: ${entry.titulo} -> ${imagePath}`);
        updatedCount++;
      } else {
        // Asignar imagen genérica si no hay mapeo específico
        const genericImage = 'https://webiacontrol-back.onrender.com/uploads/oncologia-generica-sample.jpg';
        
        await query(`
          UPDATE entradas 
          SET 
            imagen_principal = $1,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $2
        `, [genericImage, entry.id]);
        
        console.log(`✅ Agregada imagen genérica a: ${entry.titulo} -> ${genericImage}`);
        updatedCount++;
      }
    }
    
    console.log(`\n🎉 Proceso completado!`);
    console.log(`📈 Entradas actualizadas: ${updatedCount}/${entries.rows.length}`);
    
    // Mostrar resumen de entradas actualizadas
    if (updatedCount > 0) {
      console.log('\n📋 Entradas con imágenes agregadas:');
      for (const entry of entries.rows) {
        const imagePath = imageMapping[entry.slug] || 'https://webiacontrol-back.onrender.com/uploads/oncologia-generica-sample.jpg';
        console.log(`   • ${entry.titulo} -> ${imagePath}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error agregando imágenes:', error);
  } finally {
    process.exit(0);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  addSampleImages();
} 