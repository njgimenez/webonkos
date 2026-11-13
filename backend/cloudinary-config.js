const cloudinary = require('cloudinary').v2;
const path = require('path');

// Configuración de Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

// Configuración de transformaciones por defecto
const defaultTransformations = {
  quality: 'auto',
  fetch_format: 'auto',
  width: 1200,
  height: 1200,
  crop: 'limit',
  gravity: 'auto'
};

/**
 * Subir imagen a Cloudinary
 * @param {string} filePath - Ruta del archivo local
 * @param {Object} options - Opciones adicionales
 * @returns {Promise<Object>} - Resultado de la subida
 */
async function uploadToCloudinary(filePath, options = {}) {
  try {
    const uploadOptions = {
      folder: 'onkos-blog',
      public_id: options.public_id || path.basename(filePath, path.extname(filePath)),
      transformation: options.transformation || defaultTransformations,
      resource_type: 'auto',
      ...options
    };

    const result = await cloudinary.uploader.upload(filePath, uploadOptions);
    
    console.log(`✅ Imagen subida a Cloudinary: ${result.public_id}`);
    return {
      success: true,
      url: result.secure_url,
      public_id: result.public_id,
      format: result.format,
      width: result.width,
      height: result.height,
      bytes: result.bytes
    };
  } catch (error) {
    console.error('❌ Error subiendo a Cloudinary:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Generar URL de imagen con transformaciones
 * @param {string} publicId - ID público de la imagen
 * @param {Object} transformations - Transformaciones a aplicar
 * @returns {string} - URL de la imagen transformada
 */
function getCloudinaryUrl(publicId, transformations = {}) {
  const defaultTransforms = {
    quality: 'auto',
    fetch_format: 'auto',
    ...transformations
  };

  return cloudinary.url(publicId, {
    transformation: defaultTransforms,
    secure: true
  });
}

/**
 * Eliminar imagen de Cloudinary
 * @param {string} publicId - ID público de la imagen
 * @returns {Promise<Object>} - Resultado de la eliminación
 */
async function deleteFromCloudinary(publicId) {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    console.log(`🗑️ Imagen eliminada de Cloudinary: ${publicId}`);
    return {
      success: true,
      result
    };
  } catch (error) {
    console.error('❌ Error eliminando de Cloudinary:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Obtener información de una imagen en Cloudinary
 * @param {string} publicId - ID público de la imagen
 * @returns {Promise<Object>} - Información de la imagen
 */
async function getCloudinaryInfo(publicId) {
  try {
    const result = await cloudinary.api.resource(publicId);
    return {
      success: true,
      info: result
    };
  } catch (error) {
    console.error('❌ Error obteniendo info de Cloudinary:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  cloudinary,
  uploadToCloudinary,
  getCloudinaryUrl,
  deleteFromCloudinary,
  getCloudinaryInfo,
  defaultTransformations
};