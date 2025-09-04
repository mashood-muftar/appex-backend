// src/routes/authRoutes.js
import express from 'express';

import { authenticate } from '../middleware/authMiddleware.js';
import { getProfile, login, register, updateProfile, registerWithInvitation, updateDeviceToken, deleteUser, verifyEmail, resendOTP,addAppointment,getAppointment } from '../controllers/authController.js';
import { uploadSingle } from '../middleware/upload.js';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/register/invitation', registerWithInvitation);
router.post('/verify-otp', verifyEmail);
router.post('/resend-otp', resendOTP);
router.post('/login', login);
router.put('/updateDeviceToken',authenticate,updateDeviceToken)

// Protected routes
router.get('/profile', authenticate, getProfile);
// Protected routes
router.get('/add/appointment', authenticate, addAppointment);
// Protected routes
router.get('/get/appointment', authenticate, getAppointment);
router.put('/profile', authenticate,uploadSingle('profilePicture'), updateProfile);
router.delete(
    '/delete',
    authenticate,
    deleteUser
  );

export default router;
