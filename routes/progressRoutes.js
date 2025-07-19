// src/routes/progressRoutes.js
import express from 'express';
import {
  getProgressBySupplementAndDateRange,
  getProgressForAllSupplements,
  recordProgress,
  getProgressSummary
} from '../controllers/progressController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes are protected
router.use(authenticate);

router.get('/supplement', getProgressBySupplementAndDateRange);
router.get('/all', getProgressForAllSupplements);
router.post('/record', recordProgress);
router.get('/summary', getProgressSummary);

export default router;