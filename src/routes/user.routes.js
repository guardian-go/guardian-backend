import express from 'express';
import * as userController from '../controllers/user.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

// Protected route - requires authentication
router.get('/profile', authenticate, userController.getProfile);

export default router;