require("dotenv").config();

function generateCloudinaryUrl(publicId) {
  if (!publicId) return null;

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const cleanPublicId = publicId.trim().replace(/^\/+|\/+$/g, '');

  return `https://res.cloudinary.com/${cloudName}/image/upload/w_400,h_400,c_fill,g_face/${cleanPublicId}`;
}

module.exports = { generateCloudinaryUrl };
