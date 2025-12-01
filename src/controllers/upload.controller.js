import { uploadBase64 } from '../services/cloudinary.service.js';

// Upload image from base64
export const uploadImage = async (req, res) => {
    try {
        const { image, folder } = req.body;

        if (!image) {
            return res.status(400).json({
                success: false,
                message: 'Image data is required'
            });
        }

        // Validate base64 format
        if (!image.startsWith('data:image/')) {
            return res.status(400).json({
                success: false,
                message: 'Invalid image format. Please provide a valid base64 image string.'
            });
        }

        const result = await uploadBase64(image, folder || 'guardian-app');

        if (result.success) {
            res.status(200).json({
                success: true,
                url: result.url,
                public_id: result.public_id
            });
        } else {
            res.status(500).json({
                success: false,
                message: result.error || 'Failed to upload image'
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to upload image'
        });
    }
};

