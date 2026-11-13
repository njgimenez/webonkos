const { query } = require('./database.js');
const slugify = require('slugify');

function toSlug(title) {
  return slugify(title, { lower: true, strict: true });
}

async function getCategoriaIdBySlug(slug) {
  const res = await query('SELECT id FROM categorias WHERE slug = $1', [slug]);
  if (res.rows.length === 0) {
    throw new Error(`Categoría no encontrada: ${slug}`);
  }
  return res.rows[0].id;
}

async function seedMenuEntries() {
  try {
    console.log('🚀 Sembrando entradas base del menú...');

    // Mapear categorías por tipo
    const categorias = {
      oncologia: await getCategoriaIdBySlug('oncologia'),
      tratamientos: await getCategoriaIdBySlug('tratamientos'),
      investigacion: await getCategoriaIdBySlug('investigacion'),
      prevencion: await getCategoriaIdBySlug('prevencion'),
      noticias: await getCategoriaIdBySlug('noticias')
    };

    // Definir entradas por grupo de menú
    const entradas = [
      // Nosotros
      { titulo: 'Nosotros', categoria_id: categorias.oncologia },

      // Unidades
      { titulo: 'Oncología Médica', categoria_id: categorias.oncologia },
      { titulo: 'Oncología Quirúrgica', categoria_id: categorias.oncologia },
      { titulo: 'Radiología Oncológica', categoria_id: categorias.oncologia },
      { titulo: 'Ginecología Oncológica', categoria_id: categorias.oncologia },
      { titulo: 'Gastro Oncología', categoria_id: categorias.oncologia },
      { titulo: 'Urología Oncológica', categoria_id: categorias.oncologia },

      // Programas
      { titulo: 'Onkos Humano', categoria_id: categorias.noticias },
      { titulo: 'Médicos Asociados', categoria_id: categorias.noticias },
      { titulo: 'Centros Asociados', categoria_id: categorias.noticias },
      { titulo: 'Diagnóstico Rápido', categoria_id: categorias.noticias },
      { titulo: 'Opinión Experta', categoria_id: categorias.noticias },
      { titulo: 'Teleoncología', categoria_id: categorias.noticias },

      // Terapias Sistémicas
      { titulo: 'Quimioterapia', categoria_id: categorias.tratamientos },
      { titulo: 'Moleculares', categoria_id: categorias.tratamientos },
      { titulo: 'Inmunoterapia', categoria_id: categorias.tratamientos },
      { titulo: 'Reposicionamiento', categoria_id: categorias.tratamientos },

      // Terapias Locorregionales
      { titulo: 'Terapias Intra Peritoneales (TIPs)', categoria_id: categorias.tratamientos },
      { titulo: 'Terapias Intratumorales (TITS)', categoria_id: categorias.tratamientos },
      { titulo: 'Inmunoterapia Amplificada (ITA)', categoria_id: categorias.tratamientos },

      // Dolor
      { titulo: 'Terapia Molecular Antálgica (TMA)', categoria_id: categorias.tratamientos },
      { titulo: 'Convencionales', categoria_id: categorias.tratamientos },

      // Soporte
      { titulo: 'Vitamina C', categoria_id: categorias.tratamientos },
      { titulo: 'Muérdago', categoria_id: categorias.tratamientos },
      { titulo: 'Nutracéutica', categoria_id: categorias.tratamientos },

      // Investigación - Por Cáncer
      { titulo: 'Cuello Uterino', categoria_id: categorias.investigacion },
      { titulo: 'Vía Biliar', categoria_id: categorias.investigacion },
      { titulo: 'Linfoma', categoria_id: categorias.investigacion },
      { titulo: 'Mama', categoria_id: categorias.investigacion },

      // Investigación - Por Condición
      { titulo: 'Carcinomatosis', categoria_id: categorias.investigacion },
      { titulo: 'Derrame Pleural', categoria_id: categorias.investigacion },
      { titulo: 'Metástasis Ósea', categoria_id: categorias.investigacion },

      // Investigación - Por Molécula
      { titulo: 'Oxalaplatino', categoria_id: categorias.investigacion },
      { titulo: 'Cíplatino', categoria_id: categorias.investigacion },

      // Bitácora
      { titulo: 'Casos', categoria_id: categorias.noticias },
      { titulo: 'Artículos', categoria_id: categorias.noticias },
      { titulo: 'Fotovideoteca', categoria_id: categorias.noticias }
    ];

    let creadas = 0;

    for (const e of entradas) {
      const slug = toSlug(e.titulo);
      const contenido = `
        <h2>${e.titulo}</h2>
        <p>Contenido inicial para "${e.titulo}". Puedes editar este contenido desde el módulo de Administración del Blog.</p>
        <p>Este artículo está vinculado al elemento del menú con el mismo título.</p>
      `;
      const resumen = `Página informativa: ${e.titulo}.`;

      await query(
        `INSERT INTO entradas (
           titulo, slug, contenido, resumen, categoria_id, estado, destacado, tags, fecha_publicacion
         )
         VALUES ($1, $2, $3, $4, $5, 'publicado', false, $6, NOW())
         ON CONFLICT (slug) DO NOTHING`,
        [e.titulo, slug, contenido, resumen, e.categoria_id, JSON.stringify([])]
      );
      creadas++;
    }

    console.log(`✅ Sembrado completado. Intentadas: ${entradas.length}.`);
  } catch (err) {
    console.error('❌ Error sembrando entradas de menú:', err);
  }
}

seedMenuEntries();