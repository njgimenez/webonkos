const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const slugify = require('slugify');
const { query, formatQuery } = require('../database.js');
const { uploadToCloudinary, getCloudinaryUrl } = require('../cloudinary-config.js');

const router = express.Router();

// Configuración de multer para upload de archivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB (aumentado)
  },
  fileFilter: (req, file, cb) => {
    console.log('Archivo recibido:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size
    });

    // Lista de tipos MIME permitidos
    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/bmp',
      'image/tiff',
      'image/svg+xml'
    ];

    // Verificar extensión del archivo
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.tiff', '.svg'];
    const fileExtension = path.extname(file.originalname).toLowerCase();

    if (allowedMimeTypes.includes(file.mimetype) || allowedExtensions.includes(fileExtension)) {
      console.log('Archivo aceptado:', file.originalname);
      cb(null, true);
    } else {
      console.log('Archivo rechazado:', file.originalname, 'MIME:', file.mimetype, 'Ext:', fileExtension);
      cb(new Error(`Formato de archivo no permitido. Tipos permitidos: ${allowedExtensions.join(', ')}`), false);
    }
  }
});

// ==================== UTILIDADES ====================

// GET - Sincronizar esquema de base de datos (Reparación)
router.get('/fix-schema', async (req, res) => {
  try {
    console.log('🚀 Ejecutando reparación de esquema...');

    // 1. Agregar tipo_entrada si no existe
    await query(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='entradas' AND column_name='tipo_entrada') THEN
          ALTER TABLE entradas ADD COLUMN tipo_entrada VARCHAR(20) DEFAULT 'entrada';
        END IF;
      END $$;
    `);

    // 2. Asegurar que entrada_categorias existe
    await query(`
      CREATE TABLE IF NOT EXISTS entrada_categorias (
        id SERIAL PRIMARY KEY,
        entrada_id INTEGER NOT NULL REFERENCES entradas(id) ON DELETE CASCADE,
        categoria_id INTEGER NOT NULL REFERENCES categorias(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(entrada_id, categoria_id)
      );
    `);

    // 3. Reparar especialidades (columna estado)
    await query(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='especialidades' AND column_name='estado') THEN
          ALTER TABLE especialidades ADD COLUMN estado VARCHAR(20) DEFAULT 'activo';
        END IF;
      END $$;
    `);

    // 4. Reparar medicos (columna estado)
    await query(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='medicos' AND column_name='estado') THEN
          ALTER TABLE medicos ADD COLUMN estado VARCHAR(20) DEFAULT 'activo';
        END IF;
      END $$;
    `);

    res.json({ success: true, message: 'Esquema reparado exitosamente' });
  } catch (error) {
    console.error('❌ Error reparando esquema:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== CATEGORÍAS ====================


// GET - Obtener todas las categorías
router.get('/categorias', async (req, res) => {
  try {
    const result = await query(`
      SELECT * FROM categorias 
      WHERE activo = true 
      ORDER BY orden_menu ASC, nivel ASC, nombre ASC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error obteniendo categorías:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET - Obtener categorías principales (nivel 0)
router.get('/categorias/principales', async (req, res) => {
  try {
    const result = await query(`
      SELECT * FROM categorias 
      WHERE activo = true AND nivel = 0
      ORDER BY orden_menu ASC, nombre ASC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error obteniendo categorías principales:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET - Obtener subcategorías por categoría padre
router.get('/categorias/:parentId/subcategorias', async (req, res) => {
  try {
    const result = await query(`
      SELECT * FROM categorias 
      WHERE activo = true AND parent_id = $1
      ORDER BY orden_menu ASC, nombre ASC
    `, [req.params.parentId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error obteniendo subcategorías:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET - Obtener estructura jerárquica completa
router.get('/categorias/estructura', async (req, res) => {
  try {
    const result = await query(`
      WITH RECURSIVE category_tree AS (
        -- Categorías principales (nivel 0)
        SELECT 
          id, nombre, slug, descripcion, color_hex, orden_menu, nivel, 
          parent_id, ruta_completa, activo, created_at, updated_at,
          ARRAY[id] as path,
          0 as depth
        FROM categorias 
        WHERE activo = true AND nivel = 0
        
        UNION ALL
        
        -- Subcategorías recursivas
        SELECT 
          c.id, c.nombre, c.slug, c.descripcion, c.color_hex, c.orden_menu, c.nivel,
          c.parent_id, c.ruta_completa, c.activo, c.created_at, c.updated_at,
          ct.path || c.id,
          ct.depth + 1
        FROM categorias c
        INNER JOIN category_tree ct ON c.parent_id = ct.id
        WHERE c.activo = true
      )
      SELECT * FROM category_tree
      ORDER BY path, orden_menu ASC, nombre ASC
    `);

    // Organizar en estructura jerárquica
    const categories = result.rows;
    const categoryMap = new Map();
    const rootCategories = [];

    // Crear mapa de categorías
    categories.forEach(cat => {
      categoryMap.set(cat.id, { ...cat, children: [] });
    });

    // Construir jerarquía
    categories.forEach(cat => {
      if (cat.parent_id === null) {
        rootCategories.push(categoryMap.get(cat.id));
      } else {
        const parent = categoryMap.get(cat.parent_id);
        if (parent) {
          parent.children.push(categoryMap.get(cat.id));
        }
      }
    });

    res.json(rootCategories);
  } catch (error) {
    console.error('Error obteniendo estructura de categorías:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST - Crear nueva categoría
router.post('/categorias', async (req, res) => {
  try {
    const { nombre, descripcion, color_hex, orden_menu, parent_id } = req.body;
    const slug = slugify(nombre, { lower: true, strict: true });

    let nivel = 0;
    let ruta_completa = nombre;

    // Si tiene parent_id, calcular nivel y ruta_completa
    if (parent_id) {
      const parentResult = await query('SELECT nivel, ruta_completa FROM categorias WHERE id = $1', [parent_id]);
      if (parentResult.rows.length === 0) {
        return res.status(400).json({ error: 'Categoría padre no encontrada' });
      }

      const parent = parentResult.rows[0];
      nivel = parent.nivel + 1;
      ruta_completa = `${parent.ruta_completa} > ${nombre}`;
    }

    const result = await query(`
      INSERT INTO categorias (nombre, slug, descripcion, color_hex, orden_menu, parent_id, nivel, ruta_completa)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [nombre, slug, descripcion, color_hex, orden_menu, parent_id, nivel, ruta_completa]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creando categoría:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT - Actualizar categoría
router.put('/categorias/:id', async (req, res) => {
  try {
    const { nombre, descripcion, color_hex, orden_menu, activo, parent_id } = req.body;
    const slug = nombre ? slugify(nombre, { lower: true, strict: true }) : null;

    let nivel = null;
    let ruta_completa = null;

    // Si se está cambiando el parent_id o el nombre, recalcular nivel y ruta_completa
    if (parent_id !== undefined || nombre) {
      if (parent_id) {
        const parentResult = await query('SELECT nivel, ruta_completa FROM categorias WHERE id = $1', [parent_id]);
        if (parentResult.rows.length === 0) {
          return res.status(400).json({ error: 'Categoría padre no encontrada' });
        }

        const parent = parentResult.rows[0];
        nivel = parent.nivel + 1;
        ruta_completa = `${parent.ruta_completa} > ${nombre || 'Nueva Categoría'}`;
      } else {
        // Si no tiene parent_id, es categoría principal
        nivel = 0;
        ruta_completa = nombre || 'Nueva Categoría';
      }
    }

    const result = await query(`
      UPDATE categorias 
      SET nombre = COALESCE($1, nombre),
          slug = COALESCE($2, slug),
          descripcion = COALESCE($3, descripcion),
          color_hex = COALESCE($4, color_hex),
          orden_menu = COALESCE($5, orden_menu),
          activo = COALESCE($6, activo),
          parent_id = COALESCE($7, parent_id),
          nivel = COALESCE($8, nivel),
          ruta_completa = COALESCE($9, ruta_completa),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $10
      RETURNING *
    `, [nombre, slug, descripcion, color_hex, orden_menu, activo, parent_id, nivel, ruta_completa, req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Categoría no encontrada' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error actualizando categoría:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// DELETE - Eliminar categoría
router.delete('/categorias/:id', async (req, res) => {
  try {
    const result = await query('DELETE FROM categorias WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Categoría no encontrada' });
    }
    res.json({ message: 'Categoría eliminada exitosamente' });
  } catch (error) {
    console.error('Error eliminando categoría:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET - Obtener categoría por ID (debe ir al final para no interferir con rutas específicas)
router.get('/categorias/:id', async (req, res) => {
  try {
    const result = await query('SELECT * FROM categorias WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Categoría no encontrada' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error obteniendo categoría:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ==================== ENTRADAS ====================

// GET - Obtener todas las entradas (con filtros) - ENDPOINT ADMIN
router.get('/admin/entradas', async (req, res) => {
  try {
    const { categoria, estado, destacado, limit = 10, offset = 0, busqueda, tipo_entrada } = req.query;

    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    // Filtrar por categoría usando solo entrada_categorias
    if (categoria) {
      whereClause += ` AND EXISTS (
        SELECT 1 FROM entrada_categorias ec 
        WHERE ec.entrada_id = e.id AND ec.categoria_id = $${paramIndex}
      )`;
      params.push(categoria);
      paramIndex++;
    }

    if (estado) {
      whereClause += ` AND e.estado = $${paramIndex}`;
      params.push(estado);
      paramIndex++;
    }

    if (destacado === 'true') {
      whereClause += ' AND e.destacado = true';
    }

    if (tipo_entrada) {
      whereClause += ` AND e.tipo_entrada = $${paramIndex}`;
      params.push(tipo_entrada);
      paramIndex++;
    }

    if (busqueda) {
      whereClause += ` AND (
        LOWER(e.titulo) LIKE $${paramIndex}
        OR LOWER(e.resumen) LIKE $${paramIndex}
        OR LOWER(e.contenido) LIKE $${paramIndex}
      )`;
      params.push(`%${busqueda.toLowerCase()}%`);
      paramIndex++;
    }

    const result = await query(`
      SELECT e.*, u.nombre as autor_nombre
      FROM entradas e
      LEFT JOIN usuarios u ON e.autor_id = u.id
      ${whereClause}
      ORDER BY e.fecha_publicacion DESC NULLS LAST, e.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `, [...params, limit, offset]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error obteniendo entradas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET - Obtener entradas de blog (solo tipo "entrada") - ENDPOINT PÚBLICO
router.get('/entradas', async (req, res) => {
  try {
    const { categoria_id, categoria_ids, exclude_categoria_ids, destacado, limit = 10, offset = 0, busqueda } = req.query;

    let whereClause = 'WHERE e.estado = $1 AND e.tipo_entrada = $2';
    const params = ['publicado', 'entrada'];
    let paramIndex = 3;

    // Soporte para filtrado por múltiples categorías
    if (categoria_ids) {
      // Si categoria_ids es un array, usar IN
      const categoriaArray = Array.isArray(categoria_ids) ? categoria_ids : categoria_ids.split(',');
      const placeholders = categoriaArray.map((_, index) => `$${paramIndex + index}`).join(',');
      whereClause += ` AND EXISTS (
        SELECT 1 FROM entrada_categorias ec 
        WHERE ec.entrada_id = e.id AND ec.categoria_id IN (${placeholders})
      )`;
      params.push(...categoriaArray);
      paramIndex += categoriaArray.length;
    } else if (categoria_id) {
      // Mantener compatibilidad con filtrado por una sola categoría
      whereClause += ` AND EXISTS (
        SELECT 1 FROM entrada_categorias ec 
        WHERE ec.entrada_id = e.id AND ec.categoria_id = $${paramIndex}
      )`;
      params.push(categoria_id);
      paramIndex++;
    }

    // Soporte para excluir categorías específicas
    if (exclude_categoria_ids) {
      const excludeArray = Array.isArray(exclude_categoria_ids) ? exclude_categoria_ids : exclude_categoria_ids.split(',');
      const excludePlaceholders = excludeArray.map((_, index) => `$${paramIndex + index}`).join(',');
      whereClause += ` AND NOT EXISTS (
        SELECT 1 FROM entrada_categorias ec 
        WHERE ec.entrada_id = e.id AND ec.categoria_id IN (${excludePlaceholders})
      )`;
      params.push(...excludeArray);
      paramIndex += excludeArray.length;
    }

    if (destacado === 'true') {
      whereClause += ' AND e.destacado = true';
    }

    if (busqueda) {
      whereClause += ` AND (
        LOWER(e.titulo) LIKE $${paramIndex}
        OR LOWER(e.resumen) LIKE $${paramIndex}
        OR LOWER(e.contenido) LIKE $${paramIndex}
      )`;
      params.push(`%${busqueda.toLowerCase()}%`);
      paramIndex++;
    }

    const result = await query(`
      SELECT e.*, u.nombre as autor_nombre
      FROM entradas e
      LEFT JOIN usuarios u ON e.autor_id = u.id
      ${whereClause}
      ORDER BY e.fecha_publicacion DESC NULLS LAST, e.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `, [...params, limit, offset]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error obteniendo entradas de blog:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET - Obtener categorías múltiples de una entrada
router.get('/entradas/:id/categorias', async (req, res) => {
  try {
    const result = await query(`
      SELECT c.id, c.nombre, c.slug, c.color_hex
      FROM entrada_categorias ec
      JOIN categorias c ON ec.categoria_id = c.id
      WHERE ec.entrada_id = $1
      ORDER BY c.nombre
    `, [req.params.id]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error obteniendo categorías de entrada:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET - Obtener entrada por slug (ADMIN - todas las entradas)
router.get('/entradas/slug/:slug', async (req, res) => {
  try {
    const result = await query(`
      SELECT e.*, u.nombre as autor_nombre
      FROM entradas e
      LEFT JOIN usuarios u ON e.autor_id = u.id
      WHERE e.slug = $1 AND e.estado = 'publicado'
    `, [req.params.slug]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Entrada no encontrada' });
    }

    // Incrementar contador de vistas
    await query('UPDATE entradas SET vistas = vistas + 1 WHERE id = $1', [result.rows[0].id]);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error obteniendo entrada:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET - Obtener entrada de blog por slug (PÚBLICO - solo tipo "entrada")
router.get('/blog/entradas/slug/:slug', async (req, res) => {
  try {
    const result = await query(`
      SELECT e.*, u.nombre as autor_nombre
      FROM entradas e
      LEFT JOIN usuarios u ON e.autor_id = u.id
      WHERE e.slug = $1 AND e.estado = 'publicado' AND e.tipo_entrada = 'entrada'
    `, [req.params.slug]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Entrada de blog no encontrada' });
    }

    // Incrementar contador de vistas
    await query('UPDATE entradas SET vistas = vistas + 1 WHERE id = $1', [result.rows[0].id]);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error obteniendo entrada de blog:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET - Obtener entrada por ID
router.get('/entradas/:id', async (req, res) => {
  try {
    const result = await query(`
      SELECT e.*, u.nombre as autor_nombre
      FROM entradas e
      LEFT JOIN usuarios u ON e.autor_id = u.id
      WHERE e.id = $1
    `, [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Entrada no encontrada' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error obteniendo entrada:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST - Crear nueva entrada
router.post('/entradas', async (req, res) => {
  try {
    const {
      titulo, contenido, resumen, imagen_principal, categoria_id, categorias,
      estado, fecha_publicacion, meta_title, meta_description, tags, destacado, tipo_entrada
    } = req.body;

    // Generar slug solo si no se proporciona uno o está vacío
    let slug = req.body.slug;
    if (!slug && titulo) {
      slug = slugify(titulo, { lower: true, strict: true });
    }
    const autor_id = req.user ? req.user.id : null; // Asumiendo autenticación

    // Iniciar transacción
    await query('BEGIN');

    try {
      const result = await query(`
        INSERT INTO entradas (
          titulo, slug, contenido, resumen, imagen_principal,
          autor_id, estado, fecha_publicacion, meta_title, meta_description,
          tags, destacado, tipo_entrada
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *
      `, [
        titulo, slug, contenido, resumen, imagen_principal,
        autor_id, estado, fecha_publicacion, meta_title, meta_description,
        JSON.stringify(tags || []), destacado, tipo_entrada || 'entrada'
      ]);

      const entradaId = result.rows[0].id;

      // Manejar múltiples categorías si se proporcionan
      if (categorias && Array.isArray(categorias)) {
        for (const categoriaId of categorias) {
          if (categoriaId) {
            await query(`
              INSERT INTO entrada_categorias (entrada_id, categoria_id)
              VALUES ($1, $2)
              ON CONFLICT (entrada_id, categoria_id) DO NOTHING
            `, [entradaId, categoriaId]);
          }
        }
        console.log('✅ Categorías múltiples agregadas');
      }

      // Confirmar transacción
      await query('COMMIT');

      res.status(201).json(result.rows[0]);
    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error creando entrada:', error);
    res.status(500).json({ error: error.message || 'Error interno del servidor' });
  }
});

// PUT - Actualizar entrada
router.put('/entradas/:id', async (req, res) => {
  try {
    console.log('🔄 Actualizando entrada:', req.params.id);
    console.log('📝 Datos recibidos:', req.body);
    console.log('🎯 Tipo de entrada recibido:', req.body.tipo_entrada);

    const {
      titulo, contenido, resumen, imagen_principal, categorias,
      estado, fecha_publicacion, meta_title, meta_description, tags, destacado, tipo_entrada
    } = req.body;

    console.log('🎯 Tipo de entrada extraído:', tipo_entrada);
    console.log('🏷️ Categorías recibidas:', categorias);

    // Generar slug solo si no se proporciona uno o está vacío
    let slug = req.body.slug;
    if (!slug && titulo) {
      slug = slugify(titulo, { lower: true, strict: true });
    }

    // Iniciar transacción
    await query('BEGIN');

    try {
      // Actualizar la entrada principal
      const result = await query(`
        UPDATE entradas 
        SET titulo = COALESCE($1, titulo),
            slug = $2,
            contenido = COALESCE($3, contenido),
            resumen = COALESCE($4, resumen),
            imagen_principal = COALESCE($5, imagen_principal),
            estado = COALESCE($6, estado),
            fecha_publicacion = COALESCE($7, fecha_publicacion),
            meta_title = COALESCE($8, meta_title),
            meta_description = COALESCE($9, meta_description),
            tags = COALESCE($10, tags),
            destacado = COALESCE($11, destacado),
            tipo_entrada = $12,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $13
        RETURNING *
      `, [
        titulo, slug, contenido, resumen, imagen_principal,
        estado, fecha_publicacion, meta_title, meta_description,
        tags ? JSON.stringify(tags) : null, destacado, tipo_entrada || 'entrada', req.params.id
      ]);

      if (result.rows.length === 0) {
        await query('ROLLBACK');
        return res.status(404).json({ error: 'Entrada no encontrada' });
      }

      // Manejar múltiples categorías si se proporcionan
      if (categorias && Array.isArray(categorias)) {
        // Eliminar categorías existentes
        await query('DELETE FROM entrada_categorias WHERE entrada_id = $1', [req.params.id]);

        // Insertar nuevas categorías
        for (const categoriaId of categorias) {
          if (categoriaId) {
            await query(`
              INSERT INTO entrada_categorias (entrada_id, categoria_id)
              VALUES ($1, $2)
              ON CONFLICT (entrada_id, categoria_id) DO NOTHING
            `, [req.params.id, categoriaId]);
          }
        }
        console.log('✅ Categorías múltiples actualizadas');
      }

      // Confirmar transacción
      await query('COMMIT');

      res.json(result.rows[0]);
    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error actualizando entrada:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// DELETE - Eliminar entrada
router.delete('/entradas/:id', async (req, res) => {
  try {
    const result = await query('DELETE FROM entradas WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Entrada no encontrada' });
    }
    res.json({ message: 'Entrada eliminada exitosamente' });
  } catch (error) {
    console.error('Error eliminando entrada:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ==================== MEDIA ====================

// POST - Upload de archivo (Cloudinary)
router.post('/media/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se proporcionó ningún archivo' });
    }

    const { originalname, filename, mimetype, size, path: filePath } = req.file;
    const uploaded_by = req.user ? req.user.id : null;

    // Verificar si Cloudinary está configurado
    const useCloudinary = process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET;

    if (useCloudinary) {
      // Subir a Cloudinary
      console.log('📤 Subiendo imagen a Cloudinary...');

      const publicId = `onkos-blog/${Date.now()}-${Math.round(Math.random() * 1E9)}`;
      const uploadResult = await uploadToCloudinary(filePath, {
        public_id: publicId,
        folder: 'onkos-blog',
        transformation: {
          quality: 'auto',
          fetch_format: 'auto',
          width: 1200,
          height: 1200,
          crop: 'limit'
        }
      });

      if (uploadResult.success) {
        // Guardar en base de datos con URL de Cloudinary
        const result = await query(`
          INSERT INTO media (nombre_archivo, nombre_original, tipo_mime, tamaño_bytes, url, uploaded_by)
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING *
        `, [
          uploadResult.public_id,
          originalname,
          mimetype,
          uploadResult.bytes,
          uploadResult.url,
          uploaded_by
        ]);

        // Limpiar archivo temporal
        fs.unlinkSync(filePath);

        console.log('✅ Imagen subida exitosamente a Cloudinary');
        res.status(201).json({
          ...result.rows[0],
          cloudinary_url: uploadResult.url,
          public_id: uploadResult.public_id
        });
      } else {
        throw new Error(`Error subiendo a Cloudinary: ${uploadResult.error}`);
      }
    } else {
      // Fallback al sistema local (para desarrollo)
      console.log('⚠️ Cloudinary no configurado, usando sistema local');

      // Optimizar imagen si es necesario
      let optimizedPath = filePath;
      if (mimetype.startsWith('image/')) {
        const optimizedFilename = `optimized-${filename}`;
        const optimizedFilePath = path.join(path.dirname(filePath), optimizedFilename);

        // Configurar Sharp para preservar transparencia en PNG
        const sharpInstance = sharp(filePath)
          .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true });

        // Preservar formato original para PNG y otros formatos con transparencia
        if (mimetype === 'image/png' || mimetype === 'image/gif' || mimetype === 'image/webp') {
          // Para PNG, mantener el formato PNG para preservar transparencia
          if (mimetype === 'image/png') {
            await sharpInstance
              .png({ quality: 90 })
              .toFile(optimizedFilePath);
          }
          // Para GIF, mantener el formato GIF
          else if (mimetype === 'image/gif') {
            await sharpInstance
              .gif()
              .toFile(optimizedFilePath);
          }
          // Para WebP, mantener el formato WebP
          else if (mimetype === 'image/webp') {
            await sharpInstance
              .webp({ quality: 90 })
              .toFile(optimizedFilePath);
          }
        } else {
          // Para JPEG y otros formatos sin transparencia, convertir a JPEG
          await sharpInstance
            .jpeg({ quality: 80 })
            .toFile(optimizedFilePath);
        }

        optimizedPath = optimizedFilePath;
      }

      // En producción, usar URL completa del backend
      const backendUrl = process.env.NODE_ENV === 'production'
        ? (process.env.BACKEND_URL || 'https://webiacontrol-back.onrender.com')
        : '';
      const url = `${backendUrl}/uploads/${path.basename(optimizedPath)}`;

      const result = await query(`
        INSERT INTO media (nombre_archivo, nombre_original, tipo_mime, tamaño_bytes, url, uploaded_by)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `, [path.basename(optimizedPath), originalname, mimetype, size, url, uploaded_by]);

      res.status(201).json(result.rows[0]);
    }
  } catch (error) {
    console.error('Error subiendo archivo:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET - Obtener todos los archivos de media
router.get('/media', async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;

    const result = await query(`
      SELECT m.*, u.nombre as uploaded_by_name
      FROM media m
      LEFT JOIN usuarios u ON m.uploaded_by = u.id
      ORDER BY m.created_at DESC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error obteniendo media:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// DELETE - Eliminar archivo de media
router.delete('/media/:id', async (req, res) => {
  try {
    const result = await query('SELECT * FROM media WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Archivo no encontrado' });
    }

    const filePath = path.join(__dirname, '../uploads', result.rows[0].nombre_archivo);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await query('DELETE FROM media WHERE id = $1', [req.params.id]);
    res.json({ message: 'Archivo eliminado exitosamente' });
  } catch (error) {
    console.error('Error eliminando archivo:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ==================== MENÚ ====================

// GET - Obtener menú completo
router.get('/menu', async (req, res) => {
  try {
    const result = await query(`
      SELECT * FROM menu_items 
      WHERE activo = true 
      ORDER BY orden ASC, id ASC
    `);

    // Organizar en estructura jerárquica
    const menuItems = result.rows;
    const menuTree = [];
    const menuMap = {};

    // Crear mapa de items
    menuItems.forEach(item => {
      menuMap[item.id] = { ...item, children: [] };
    });

    // Construir árbol
    menuItems.forEach(item => {
      if (item.parent_id) {
        if (menuMap[item.parent_id]) {
          menuMap[item.parent_id].children.push(menuMap[item.id]);
        }
      } else {
        menuTree.push(menuMap[item.id]);
      }
    });

    res.json(menuTree);
  } catch (error) {
    console.error('Error obteniendo menú:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST - Crear item de menú
router.post('/menu', async (req, res) => {
  try {
    const { titulo, tipo, url, orden, parent_id, icono, target } = req.body;

    const result = await query(`
      INSERT INTO menu_items (titulo, tipo, url, orden, parent_id, icono, target)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [titulo, tipo, url, orden, parent_id, icono, target]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creando item de menú:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT - Actualizar item de menú
router.put('/menu/:id', async (req, res) => {
  try {
    const { titulo, tipo, url, orden, parent_id, icono, target, activo } = req.body;

    const result = await query(`
      UPDATE menu_items 
      SET titulo = COALESCE($1, titulo),
          tipo = COALESCE($2, tipo),
          url = COALESCE($3, url),
          orden = COALESCE($4, orden),
          parent_id = COALESCE($5, parent_id),
          icono = COALESCE($6, icono),
          target = COALESCE($7, target),
          activo = COALESCE($8, activo)
      WHERE id = $9
      RETURNING *
    `, [titulo, tipo, url, orden, parent_id, icono, target, activo, req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Item de menú no encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error actualizando item de menú:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// DELETE - Eliminar item de menú
router.delete('/menu/:id', async (req, res) => {
  try {
    const result = await query('DELETE FROM menu_items WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Item de menú no encontrado' });
    }
    res.json({ message: 'Item de menú eliminado exitosamente' });
  } catch (error) {
    console.error('Error eliminando item de menú:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router; 