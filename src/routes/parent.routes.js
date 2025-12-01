import express from 'express';
import * as parentController from '../controllers/parent.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// All parent routes require authentication and Parent role
router.use(authenticate);
router.use(authorize('Parent'));

// Parent profile routes (access own data only)
router.get('/me', parentController.getMyProfile);
router.put('/me', parentController.updateMyProfile);

// Parent notification routes (access own notifications only)
router.get('/me/notifications', parentController.getMyNotifications);
router.post('/me/notifications/send', parentController.sendNotificationToTeacher);

// Attach an existing student to this parent
router.post('/me/children/attach', parentController.attachStudent);

export default router;

