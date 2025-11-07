import express from 'express';
import userController from '../controllers/user.controller.js';

const router = express.Router();

router.get('/profile', userController.getProfile);

export default router;