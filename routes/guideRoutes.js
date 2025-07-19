// src/routes/guideRoutes.js
import express from 'express';
import { 
  getAllGuides,
  getGuideById,
  createGuide,
  updateGuide,
  deleteGuide
} from '../controllers/guideController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.get('/', getAllGuides);
router.get('/:id', getGuideById);

// Protected admin routes
router.post('/', createGuide);
router.put('/:id', authenticate, updateGuide);
router.delete('/:id', authenticate, deleteGuide);

export default router;