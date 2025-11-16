import express from 'express';
import * as authController from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

// Public routes
router.post('/register/parent', authController.registerParent);
router.post('/register/teacher', authController.registerTeacher);
router.post('/login', authController.login);

// Protected route
router.get('/me', authenticate, authController.getCurrentUser);

export default router;

