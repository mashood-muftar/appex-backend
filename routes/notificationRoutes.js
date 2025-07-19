// src/routes/notificationRoutes.js
import express from 'express';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUserNotifications
} from '../controllers/notificationController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply auth protection to all routes
router.use(authenticate);

router.route('/')
  .get(getNotifications);
  
router.route('/mark-all-read')
  .put(markAllAsRead);

router.route('/:id')
  .put(markAsRead)
  .delete(deleteNotification);

router.route('/get-user-notifications')
  .get(getUserNotifications);



export default router;