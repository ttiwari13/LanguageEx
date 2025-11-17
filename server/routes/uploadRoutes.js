const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('../configs/cloudinary');
const protect = require('../middlewares/authMiddleware');
const User = require('../models/User');
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    console.log('📎 File received:', file.originalname, file.mimetype);
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images allowed'), false);
    }
  }
});
router.post('/profile-image', protect, upload.single('image'), async (req, res) => {
  try {

    if (!req.file) {
      console.log('No file in request');
      return res.status(400).json({ message: 'No file uploaded' });
    }
    const userId = req.user.id;
    const oldPublicId = await User.getProfileImagePublicId(userId);
    const uploadPromise = new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'language-app/profiles',
          public_id: `user_${userId}_${Date.now()}`,
          resource_type: 'image',
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            reject(error);
          } else {
            console.log('Cloudinary upload success:', result.public_id);
            resolve(result);
          }
        }
      );
      uploadStream.end(req.file.buffer);
    });

    const cloudinaryResult = await uploadPromise;
    if (oldPublicId) {
      try {
        console.log('Deleting old image:', oldPublicId);
        await cloudinary.uploader.destroy(oldPublicId);
        console.log('Old image deleted');
      } catch (error) {
        console.error('Error deleting old image:', error);
      }
    }
    await User.updateProfileImage(userId, cloudinaryResult.public_id);
    console.log('Saved to database');

    res.status(200).json({
      message: 'Profile image updated successfully',
      imageUrl: cloudinaryResult.secure_url,
      publicId: cloudinaryResult.public_id,
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ 
      message: 'Failed to upload image',
      error: error.message 
    });
  }
});

router.delete('/profile-image', protect, async (req, res) => {
  try {
    const userId = req.user.id;

    const publicId = await User.getProfileImagePublicId(userId);

    if (publicId) {
      await cloudinary.uploader.destroy(publicId);
      await User.removeProfileImage(userId);
    }

    res.status(200).json({ message: 'Profile image deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ message: 'Failed to delete image' });
  }
});

module.exports = router;