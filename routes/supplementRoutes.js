// src/routes/supplementRoutes.js
import express from 'express';
import {
  getAllSupplements,
  getSupplementById,
  createSupplement,
  updateSupplement,
  deleteSupplement,
  getSupplementsByDay,
  updateSupplementStatus,
  getDailyAdherenceStats,
  getTodaySupplements,
  addSchedule,
  getTodaysSupplements,
  getTakenSupplements,
  deleteallortodaysupplement,
  updateSupplementPills
} from '../controllers/supplementController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { getDiaryPreview, shareDiary } from '../controllers/diaryController.js';

const router = express.Router();

// All routes are protected
router.use(authenticate);

router.route('/')
  .get(getAllSupplements)
  .post(createSupplement);

router.route('/day/:day')
  .get(getSupplementsByDay);
router.get('/today', getTodaysSupplements);
router.get('/supplements-today', getTodaySupplements);
router.route('/:id')
  .get(getSupplementById)
  .put(updateSupplement)
  .delete(deleteSupplement);

router.put('/:id/pills', updateSupplementPills);
router.delete('/:id/delete', deleteallortodaysupplement);
router.get('/status/taken', getTakenSupplements);
router.put('/:supplementId/status', updateSupplementStatus);
router.get('/progress/daily', getDailyAdherenceStats);
router.post('/:supplementId/schedule', addSchedule);

router.post('/share', shareDiary);

// Get diary data for preview (optional)
router.get('/preview', getDiaryPreview);

// Admin/scheduled routes
// router.post('/check-missed', checkMissedSupplements);
// router.post('/reset-daily', resetDailySupplementStatuses);

export default router;