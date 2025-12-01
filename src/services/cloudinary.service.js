import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

// Ensure .env is loaded (in case this module is imported before dotenv.config() in server.js)
dotenv.config();

// Validate Cloudinary configuration
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

if (!cloudName || !apiKey || !apiSecret) {
    console.error('⚠️  Cloudinary configuration missing!');
    console.error('Please add these to your .env file:');
    console.error('CLOUDINARY_CLOUD_NAME=your_cloud_name');
    console.error('CLOUDINARY_API_KEY=your_api_key');
    console.error('CLOUDINARY_API_SECRET=your_api_secret');
    console.error('\nCurrent values:');
    console.error(`CLOUDINARY_CLOUD_NAME: ${cloudName ? '✓ Set' : '✗ Missing'}`);
    console.error(`CLOUDINARY_API_KEY: ${apiKey ? '✓ Set' : '✗ Missing'}`);
    console.error(`CLOUDINARY_API_SECRET: ${apiSecret ? '✓ Set' : '✗ Missing'}`);
} else {
    console.log('✓ Cloudinary configured successfully');
}

// Configure Cloudinary
cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
});

// Upload image from base64 string
export const uploadBase64 = async (base64String, folder = 'guardian-app') => {
    try {
        // Check if Cloudinary is configured
        if (!cloudName || !apiKey || !apiSecret) {
            return {
                success: false,
                error: 'Cloudinary is not configured. Please add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET to your .env file.'
            };
        }

        const result = await cloudinary.uploader.upload(base64String, {
            folder: folder,
            transformation: [
                { width: 800, height: 800, crop: 'limit', quality: 'auto' }
            ]
        });
        return {
            success: true,
            url: result.secure_url,
            public_id: result.public_id
        };
    } catch (error) {
        console.error('Cloudinary upload error:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

// Delete image from Cloudinary
export const deleteImage = async (publicId) => {
    try {
        const result = await cloudinary.uploader.destroy(publicId);
        return {
            success: true,
            result
        };
    } catch (error) {
        console.error('Cloudinary delete error:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

export default cloudinary;

