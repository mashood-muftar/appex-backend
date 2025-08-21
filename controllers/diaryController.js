// src/controllers/diaryController.js

import User from "../models/User.js";
import Supplement from "../models/Supplement.js";
import SupplementStatus from "../models/SupplementStatus.js";
import { createCsvFile } from "../utils/csvService.js";
import { sendDiaryEmail } from "../utils/emailService.js";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Share diary with a friend via email
 * @route POST /api/diaries/share
 */
export const shareDiary = async (req, res) => {
  try {
    const { friendEmail } = req.body;
    const userId = req.user?._id || req.user?.id;

    // Validate friendEmail
    if (!friendEmail) {
      return res.status(400).json({
        success: false,
        message: 'Valid friend email is required'
      });
    }

    // Get user details
    const user = await User.findById(userId, 'name email');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get current date and one month ago date
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 1);

    // Get supplement status data for the last month
    const supplementStatusData = await SupplementStatus.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId)
        }
      },
      {
        $lookup: {
          from: 'supplements',
          localField: 'supplementId',
          foreignField: '_id',
          as: 'supplementInfo'
        }
      },
      {
        $unwind: '$supplementInfo'
      },
      {
        $sort: { date: -1 }
      },
      {
        $project: {
          _id: 0,
          supplementName: '$supplementInfo.name',
          supplementForm: '$supplementInfo.form',
          date: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          time: { $dateToString: { format: '%H:%M', date: '$date' } },
          status: 1
        }
      }
    ]);

    if (supplementStatusData.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No supplement history found for the last month'
      });
    }

    // Create CSV file
    const fileName = `${user.name.replace(/\s+/g, '_')}_diary_${Date.now()}.csv`;
    const filePath = path.join(__dirname, '../../temp', fileName);
    
    // Ensure temp directory exists
    const tempDir = path.join(__dirname, '../../temp');
    if (!fs.existsSync(tempDir)){
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    // Generate CSV file
    await createCsvFile(supplementStatusData, filePath);

    // Send email with CSV attachment
    const emailResult = await sendDiaryEmail({
      recipientEmail: friendEmail,
      senderName: user.name,
      senderEmail: user.email,
      filePath: filePath,
      fileName: fileName
    });

    // Delete the temporary file after sending
    try {
      fs.unlinkSync(filePath);
    } catch (unlinkError) {
      console.error('Error deleting temporary file:', unlinkError);
    }

    if (!emailResult) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send diary email'
      });
    }

    res.status(200).json({
      success: true,
      message: `Diary successfully shared with ${friendEmail}`
    });
  } catch (error) {
    console.error('Error sharing diary:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get diary data for preview (optional feature for frontend)
export const getDiaryPreview = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    
    // Get current date and one month ago date
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 1);

    // Get supplement status data for the last month
    const supplementStatusData = await SupplementStatus.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $lookup: {
          from: 'supplements',
          localField: 'supplementId',
          foreignField: '_id',
          as: 'supplementInfo'
        }
      },
      {
        $unwind: '$supplementInfo'
      },
      {
        $sort: { date: -1 }
      },
      {
        $project: {
          _id: 0,
          supplementName: '$supplementInfo.name',
          supplementForm: '$supplementInfo.form',
          date: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          time: { $dateToString: { format: '%H:%M', date: '$date' } },
          status: 1
        }
      }
    ]);

    res.status(200).json({
      success: true,
      count: supplementStatusData.length,
      data: supplementStatusData
    });
  } catch (error) {
    console.error('Error getting diary preview:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Import mongoose in the controller
import mongoose from 'mongoose';
