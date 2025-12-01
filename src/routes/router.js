import express from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import parentRoutes from './parent.routes.js';
import teacherRoutes from './teacher.routes.js';
import notificationRoutes from './notification.routes.js';
import uploadRoutes from './upload.routes.js';

const router = express.Router();

// Routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/parents', parentRoutes);
router.use('/teachers', teacherRoutes);
router.use('/notifications', notificationRoutes);
router.use('/upload', uploadRoutes);

export default router;