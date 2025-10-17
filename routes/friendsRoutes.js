// src/routes/friendsRoutes.js
import express from 'express';
import {
  getFriends,
  shareDiary,
  inviteFriend,
  acceptFriendRequest,
  rejectFriendRequest,
  getPendingRequests,
  getContacts,
  getContact,
  createContact,
  updateContact,
  deleteContact,
  updateContactStatus,
  bulkCreateContacts
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

router.get('/contact', getContacts);
router.get('/contact/:id', getContact);
router.post('/contact/', createContact);
router.put('/contact/:id', updateContact);
router.delete('/contact/:id', deleteContact);
router.patch('/contact/:id/status', updateContactStatus);
router.post('/contact/bulk', bulkCreateContacts);


export default router;
