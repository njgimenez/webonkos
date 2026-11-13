const { query } = require('./database.js');

async function createBlogTables() {
  try {
    console.log('🚀 Creando tablas del sistema de blog/CMS...');

    // Tabla categorias
    await query(`
      CREATE TABLE IF NOT EXISTS categorias (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        slug VARCHAR(100) UNIQUE NOT NULL,
        descripcion TEXT,
        color_hex VARCHAR(7) DEFAULT '#667eea',
        orden_menu INTEGER DEFAULT 0,
        activo BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Tabla categorias creada');

    // Tabla entradas
    await query(`
      CREATE TABLE IF NOT EXISTS entradas (
        id SERIAL PRIMARY KEY,
        titulo VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        contenido TEXT NOT NULL,
        resumen TEXT,
        imagen_principal VARCHAR(500),
        categoria_id INTEGER REFERENCES categorias(id) ON DELETE SET NULL,
        autor_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
        estado VARCHAR(20) DEFAULT 'borrador' CHECK (estado IN ('borrador', 'publicado', 'archivado')),
        fecha_publicacion TIMESTAMP,
        meta_title VARCHAR(255),
        meta_description TEXT,
        tags JSONB DEFAULT '[]',
        vistas INTEGER DEFAULT 0,
        destacado BOOLEAN DEFAULT false,
        orden INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Tabla entradas creada');

    // Tabla media
    await query(`
      CREATE TABLE IF NOT EXISTS media (
        id SERIAL PRIMARY KEY,
        nombre_archivo VARCHAR(255) NOT NULL,
        nombre_original VARCHAR(255) NOT NULL,
        tipo_mime VARCHAR(100) NOT NULL,
        tamaño_bytes BIGINT NOT NULL,
        url VARCHAR(500) NOT NULL,
        alt_text VARCHAR(255),
        uploaded_by INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Tabla media creada');

    // Tabla menu_items
    await query(`
      CREATE TABLE IF NOT EXISTS menu_items (
        id SERIAL PRIMARY KEY,
        titulo VARCHAR(100) NOT NULL,
        tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('pagina', 'categoria', 'entrada', 'enlace_externo')),
        url VARCHAR(500),
        orden INTEGER DEFAULT 0,
        parent_id INTEGER REFERENCES menu_items(id) ON DELETE CASCADE,
        activo BOOLEAN DEFAULT true,
        icono VARCHAR(50),
        target VARCHAR(10) DEFAULT '_self',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Tabla menu_items creada');

    // Crear índices para mejor rendimiento
    await query('CREATE INDEX IF NOT EXISTS idx_entradas_categoria ON entradas(categoria_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_entradas_estado ON entradas(estado)');
    await query('CREATE INDEX IF NOT EXISTS idx_entradas_fecha_publicacion ON entradas(fecha_publicacion)');
    await query('CREATE INDEX IF NOT EXISTS idx_entradas_slug ON entradas(slug)');
    await query('CREATE INDEX IF NOT EXISTS idx_categorias_slug ON categorias(slug)');
    await query('CREATE INDEX IF NOT EXISTS idx_menu_items_parent ON menu_items(parent_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_menu_items_orden ON menu_items(orden)');
    
    console.log('✅ Índices creados');

    // Insertar categorías por defecto
    const categoriasDefault = [
      {
        nombre: 'Oncología',
        slug: 'oncologia',
        descripcion: 'Artículos sobre oncología y tratamientos del cáncer',
        color_hex: '#667eea',
        orden_menu: 1
      },
      {
        nombre: 'Tratamientos',
        slug: 'tratamientos',
        descripcion: 'Información sobre diferentes tratamientos oncológicos',
        color_hex: '#f093fb',
        orden_menu: 2
      },
      {
        nombre: 'Investigación',
        slug: 'investigacion',
        descripcion: 'Avances en investigación oncológica',
        color_hex: '#4facfe',
        orden_menu: 3
      },
      {
        nombre: 'Prevención',
        slug: 'prevencion',
        descripcion: 'Consejos y guías de prevención del cáncer',
        color_hex: '#43e97b',
        orden_menu: 4
      },
      {
        nombre: 'Noticias',
        slug: 'noticias',
        descripcion: 'Noticias y actualizaciones del centro',
        color_hex: '#fa709a',
        orden_menu: 5
      }
    ];

    for (const categoria of categoriasDefault) {
      await query(`
        INSERT INTO categorias (nombre, slug, descripcion, color_hex, orden_menu)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (slug) DO NOTHING
      `, [categoria.nombre, categoria.slug, categoria.descripcion, categoria.color_hex, categoria.orden_menu]);
    }
    console.log('✅ Categorías por defecto insertadas');

    // Insertar items de menú por defecto
    const menuItemsDefault = [
      {
        titulo: 'Blog',
        tipo: 'pagina',
        url: '/blog',
        orden: 1,
        icono: 'fas fa-blog'
      },
      {
        titulo: 'Oncología',
        tipo: 'categoria',
        url: '/blog/categoria/oncologia',
        orden: 2,
        icono: 'fas fa-heartbeat'
      },
      {
        titulo: 'Tratamientos',
        tipo: 'categoria',
        url: '/blog/categoria/tratamientos',
        orden: 3,
        icono: 'fas fa-pills'
      },
      {
        titulo: 'Investigación',
        tipo: 'categoria',
        url: '/blog/categoria/investigacion',
        orden: 4,
        icono: 'fas fa-microscope'
      }
    ];

    for (const item of menuItemsDefault) {
      await query(`
        INSERT INTO menu_items (titulo, tipo, url, orden, icono)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT DO NOTHING
      `, [item.titulo, item.tipo, item.url, item.orden, item.icono]);
    }
    console.log('✅ Items de menú por defecto insertados');

    console.log('🎉 Sistema de blog/CMS configurado exitosamente!');
    
  } catch (error) {
    console.error('❌ Error creando tablas del blog:', error);
  }
}

createBlogTables(); 