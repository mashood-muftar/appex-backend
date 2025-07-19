// src/routes/scheduleRoutes.js
import express from 'express';
import { 
  getAllSchedules,
  getScheduleById,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  markScheduleCompleted,
  getSchedulesByDate
} from '../controllers/scheduleController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes are protected
router.use(authenticate);

router.route('/')
  .get(getAllSchedules)
  .post(createSchedule);

router.route('/:id')
  .get(getScheduleById)
  .put(updateSchedule)
  .delete(deleteSchedule);

router.post('/:id/complete', markScheduleCompleted);

// Special route to get schedules for a specific date
router.get('/date/:date', getSchedulesByDate);

export default router;