require("dotenv").config();
const urlCache = new Map();
const MAX_CACHE_SIZE = 10000;
const isDevelopment = process.env.NODE_ENV === 'development';
const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
if (!CLOUD_NAME) {
  console.error('CLOUDINARY_CLOUD_NAME not set in environment variables!');
}

/**
 * Generate optimized Cloudinary URL with caching
 * @param {string} publicId - Cloudinary public ID
 * @param {object} options - Transformation options
 * @returns {string|null} Cloudinary URL or null
 */
function generateCloudinaryUrl(publicId, options = {}) {
  if (!publicId) {
    if (isDevelopment) {
      console.log('publicId is falsy, returning null');
    }
    return null;
  }

  if (!CLOUD_NAME) {
    return null;
  }
  const cacheKey = `${publicId}_${JSON.stringify(options)}`;
  if (urlCache.has(cacheKey)) {
    if (isDevelopment) {
      console.log('Using cached URL for:', publicId);
    }
    return urlCache.get(cacheKey);
  }
  const cleanPublicId = publicId.trim().replace(/^\/+|\/+$/g, '');
  const {
    width = 400,
    height = 400,
    crop = 'fill',
    gravity = 'face',
    quality = 'auto',
    format = 'auto'
  } = options;

  const transformations = `w_${width},h_${height},c_${crop},g_${gravity},q_${quality},f_${format}`;
  const url = `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${transformations}/${cleanPublicId}`;
  if (urlCache.size >= MAX_CACHE_SIZE) {
    const firstKey = urlCache.keys().next().value;
    urlCache.delete(firstKey);
  }
  urlCache.set(cacheKey, url);
  if (isDevelopment) {
    console.log('Generated and cached URL:', url);
  }
  return url;
}
function generateThumbnailUrl(publicId) {
  return generateCloudinaryUrl(publicId, {
    width: 150,
    height: 150,
    quality: 'auto:low'
  });
}
function generateProfileUrl(publicId) {
  return generateCloudinaryUrl(publicId, {
    width: 400,
    height: 400,
    quality: 'auto:good'
  });
}
function generateFullSizeUrl(publicId) {
  return generateCloudinaryUrl(publicId, {
    width: 1200,
    height: 1200,
    quality: 'auto:best'
  });
}
function clearCache() {
  urlCache.clear();
  console.log('Cloudinary URL cache cleared');
}
function getCacheStats() {
  return {
    size: urlCache.size,
    maxSize: MAX_CACHE_SIZE,
    utilizationPercent: ((urlCache.size / MAX_CACHE_SIZE) * 100).toFixed(2)
  };
}

module.exports = {
  generateCloudinaryUrl,
  generateThumbnailUrl,
  generateProfileUrl,
  generateFullSizeUrl,
  clearCache,
  getCacheStats
};