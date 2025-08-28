import express from "express";
import {
  shareDiary,
  getDiaryPreview
} from "../controllers/diaryController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

// All routes are protected
router.use(authenticate);

// Share diary with a friend
router.post("/share", shareDiary);

// Get diary preview
router.get("/preview", getDiaryPreview);

export default router;
