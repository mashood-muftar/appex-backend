// src/routes/settingsRoutes.js
import express from 'express';
import { 
  getUserSettings, 
  updateUserSettings,
  updateNotificationSettings
} from '../controllers/settingsController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes are protected
router.use(authenticate);

router.route('/')
  .get(getUserSettings)
  .put(updateUserSettings);

router.put('/notifications', updateNotificationSettings);

export default router;