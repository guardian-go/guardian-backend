import express from 'express';
import * as uploadController from '../controllers/upload.controller.js';

const router = express.Router();

// Upload route - can be used without auth for registration
router.post('/image', uploadController.uploadImage);

export default router;

