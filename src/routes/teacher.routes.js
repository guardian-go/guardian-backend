import express from 'express';
import * as teacherController from '../controllers/teacher.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// All teacher routes require authentication and Teacher role
router.use(authenticate);
router.use(authorize('Teacher'));

// Teacher profile routes (access own data only)
router.get('/me', teacherController.getMyProfile);
router.put('/me', teacherController.updateMyProfile);

// Teacher notification routes (access own notifications only)
router.get('/me/notifications', teacherController.getMyNotifications);
router.post('/me/notifications/send', teacherController.sendNotificationToParent);
router.post('/me/notifications/send-multiple', teacherController.sendNotificationToMultipleParents);

// Teacher student routes
router.get('/me/students', teacherController.getMyStudents);
router.post('/me/students', teacherController.createStudent);
router.get('/me/students/:studentId', teacherController.getStudentById);
router.post('/me/students/:studentId/release', teacherController.releaseStudent);

export default router;

