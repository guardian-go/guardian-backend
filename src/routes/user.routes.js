import express from 'express';
import * as userController from '../controllers/user.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

// Protected routes - require authentication
router.post('/me/fcm-token', authenticate, userController.updateFcmToken);

export default router;