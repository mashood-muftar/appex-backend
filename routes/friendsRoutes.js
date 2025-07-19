// src/routes/friendsRoutes.js
import express from 'express';
import {
  getFriends,
  shareDiary,
  inviteFriend,
  acceptFriendRequest,
  rejectFriendRequest,
  getPendingRequests
} from '../controllers/friendsController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes are protected
router.use(authenticate);

router.get('/', getFriends);

// Share diary with friend
router.post('/share-diary', shareDiary);

// Invite a friend
router.post('/invite', inviteFriend);

// Accept a friend request
router.patch('/accept/:requestId', acceptFriendRequest);

// Reject a friend request
router.patch('/reject/:requestId', rejectFriendRequest);

// Get pending friend requests
router.get('/pending', getPendingRequests);

export default router;