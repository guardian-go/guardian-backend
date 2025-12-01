import express from 'express';
import * as notificationController from '../controllers/notification.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

// All notification routes require authentication
router.use(authenticate);

// Notification routes (users can only access their own notifications)
router.get('/me', notificationController.getMyNotifications);
router.put('/:id/read', notificationController.markNotificationAsRead);

export default router;

