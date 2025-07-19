import User from '../models/User.js';
import Friend from '../models/Friend.js';
import Diary from '../models/DiaryShare.js';
import Invitation from '../models/Invitation.js';
import { sendInvitationEmail } from '../utils/emailService.js';

// Get friends list for a user
export const getFriends = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Find all accepted friend relationships where user is either requester or recipient
    const friends = await Friend.find({
      $or: [{ requester: userId }, { recipient: userId }],
      status: 'accepted'
    }).populate('requester recipient', 'name email profilePicture');
    
    // Format the response to return just the friend user objects
    const formattedFriends = friends.map(friend => {
      const friendData = friend.requester._id.equals(userId) 
        ? friend.recipient 
        : friend.requester;
      return {
        _id: friendData._id,
        name: friendData.name,
        email: friendData.email,
        profilePicture: friendData.profilePicture
      };
    });
    
    return res.status(200).json({ friends: formattedFriends });
  } catch (error) {
    console.error('Error getting friends:', error);
    return res.status(500).json({ error: 'Failed to get friends' });
  }
};

// Share diary with a friend
export const shareDiary = async (req, res) => {
  try {
    const { friendIdentifier, diaryId } = req.body;
    const userId = req.user.id;
    
    if (!friendIdentifier || !diaryId) {
      return res.status(400).json({ error: 'Friend identifier and diary ID are required' });
    }
    
    // Find the friend by email or username
    const friend = await User.findOne({
      $or: [
        { email: friendIdentifier.toLowerCase() },
        { name: friendIdentifier }
      ]
    });
    
    if (!friend) {
      return res.status(404).json({ error: 'Friend not found' });
    }
    
    // Verify friendship
    const friendRelation = await Friend.findOne({
      $or: [
        { requester: userId, recipient: friend._id },
        { requester: friend._id, recipient: userId }
      ],
      status: 'accepted'
    });
    
    if (!friendRelation) {
      return res.status(403).json({ error: 'You can only share with confirmed friends' });
    }
    
    // Find and update the diary
    const diary = await Diary.findOne({ _id: diaryId, user: userId });
    
    if (!diary) {
      return res.status(404).json({ error: 'Diary not found or you do not have permission' });
    }
    
    // Check if already shared
    if (diary.sharedWith.includes(friend._id)) {
      return res.status(400).json({ error: 'Diary already shared with this friend' });
    }
    
    // Add friend to sharedWith array
    diary.sharedWith.push(friend._id);
    await diary.save();
    
    return res.status(200).json({ message: 'Diary shared successfully', diary });
  } catch (error) {
    console.error('Error sharing diary:', error);
    return res.status(500).json({ error: 'Failed to share diary' });
  }
};

// Invite friends
export const inviteFriend = async (req, res) => {
  try {
    const { email } = req.body;
    const userId = req.user.id;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    
    if (existingUser) {
      // If user exists, create friend request instead of invitation
      const existingRequest = await Friend.findOne({
        $or: [
          { requester: userId, recipient: existingUser._id },
          { requester: existingUser._id, recipient: userId }
        ]
      });
      
      if (existingRequest) {
        return res.status(400).json({ 
          error: 'Friend request already exists',
          status: existingRequest.status
        });
      }
      
      // Create new friend request
      const newRequest = new Friend({
        requester: userId,
        recipient: existingUser._id
      });
      
      await newRequest.save();
      return res.status(200).json({ 
        message: 'Friend request sent',
        friendRequest: newRequest
      });
    }
    
    // Create invitation for non-existing user
    const invitation = new Invitation({
      sender: userId,
      email: email.toLowerCase()
    });
    
    await invitation.save();
    
    // Generate invitation link with token
    const invitationLink = `${process.env.APP_URL}/register?token=${invitation.token}`;
    
    // Send email invitation
    await sendInvitationEmail(email, req.user.name, invitationLink);
    
    return res.status(200).json({ 
      message: 'Invitation sent successfully',
      invitation: {
        id: invitation._id,
        email: invitation.email,
        expiresAt: invitation.expiresAt
      }
    });
  } catch (error) {
    console.error('Error inviting friend:', error);
    return res.status(500).json({ error: 'Failed to send invitation' });
  }
};

// Accept friend request
export const acceptFriendRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user.id;
    console.log('Request ID:', requestId);
    console.log('User ID:', userId);
    const friendRequest = await Friend.findOne({
      _id: requestId,
      recipient: userId,
      status: 'pending'
    });
    
    if (!friendRequest) {
      return res.status(404).json({ error: 'Friend request not found' });
    }
    
    friendRequest.status = 'accepted';
    await friendRequest.save();
    
    return res.status(200).json({ 
      message: 'Friend request accepted',
      friendRequest
    });
  } catch (error) {
    console.error('Error accepting friend request:', error);
    return res.status(500).json({ error: 'Failed to accept friend request' });
  }
};

// Reject friend request
export const rejectFriendRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user.id;
    
    const friendRequest = await Friend.findOne({
      _id: requestId,
      recipient: userId,
      status: 'pending'
    });
    
    if (!friendRequest) {
      return res.status(404).json({ error: 'Friend request not found' });
    }
    
    friendRequest.status = 'rejected';
    await friendRequest.save();
    
    return res.status(200).json({ 
      message: 'Friend request rejected',
      friendRequest
    });
  } catch (error) {
    console.error('Error rejecting friend request:', error);
    return res.status(500).json({ error: 'Failed to reject friend request' });
  }
};

// Get pending friend requests
export const getPendingRequests = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const pendingRequests = await Friend.find({
      recipient: userId,
      status: 'pending'
    }).populate('requester', 'name email profilePicture');
    
    return res.status(200).json({ pendingRequests });
  } catch (error) {
    console.error('Error getting pending requests:', error);
    return res.status(500).json({ error: 'Failed to get pending requests' });
  }
};