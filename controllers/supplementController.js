// src/controllers/supplementController.js
import Supplement from "../models/Supplement.js";
import SupplementStatus from "../models/SupplementStatus.js";
import { scheduleStatusCheck, scheduleSupplementNotification } from "../utils/schedulerService.js";
import { sendPushNotification } from './notificationService.js';
import mongoose from 'mongoose'



export const getAllSupplements = async (req, res) => {
  try {
    // Get all supplements for the authenticated user
    const supplements = await Supplement.find({ user: req.user.id });
    
    res.json({
      success: true,
      count: supplements.length,
      data: supplements
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

export const getSupplementById = async (req, res) => {
  try {
    const supplement = await Supplement.findOne({
      _id: req.params.id,
      user: req.user.id
    });
    
    if (!supplement) {
      return res.status(404).json({
        success: false,
        message: 'Supplement not found'
      });
    }
    
    res.json({
      success: true,
      data: supplement
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

export const createSupplement = async (req, res) => {
  try {
    const { name, form, reason, day, time } = req.body;

    
  // const { hours, minutes } = parseTime(time);
  // const formattedTime = ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')};

    const notificationResult = await sendPushNotification(
            req.user,
            'EMBER ON',
            Have you taken your ${name} supplement yet? Don't forget to mark as taken at ${time}.,
            { supplementId: _id.toString(), type: 'SUPPLEMENT_REMINDER' }
          );


    if (!name || !form || day === undefined || !time) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
        required: ["name", "form", "day", "time"],
      });
    }

    if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(time)) {
      return res.status(400).json({
        success: false,
        message: "Invalid time format. Please use HH:MM in 24-hour format",
        example: "08:30",
      });
    }

    if (day < 0 || day > 6) {
      return res.status(400).json({
        success: false,
        message: "Invalid day. Must be between 0 (Sunday) and 6 (Saturday)",
      });
    }

    let dates = [];
    const startOfMonth = moment().startOf("month");
    const endOfMonth = moment().endOf("month");

    if (reason === "Every day") {
      let current = startOfMonth.clone();
      while (current <= endOfMonth) {
        dates.push(current.clone());
        current.add(1, "day");
      }
    } else if (reason === "Every other day") {
      let current = startOfMonth.clone();
      while (current <= endOfMonth) {
        dates.push(current.clone());
        current.add(2, "days");
      }
    } else if (reason === "Specific days of the week") {
      let current = startOfMonth.clone();
      while (current <= endOfMonth) {
        if (current.day() === day) {
          dates.push(current.clone());
        }
        current.add(1, "day");
      }
    } else if (reason === "On a recurring cycle") {
      // Example: every 3 days
      let current = startOfMonth.clone();
      while (current <= endOfMonth) {
        dates.push(current.clone());
        current.add(3, "days"); // tu chahe toh frontend se cycle ka number bhej sakta hai
      }
    }

    // Ab supplements DB me save karo
    const supplements = [];
    for (let d of dates) {
      const supplement = new Supplement({
        name,
        form,
        reason,
        day,
        time,
        scheduleDate: d.format("YYYY-MM-DD"),
        status: "pending",
        user: req.user.id,
        lastStatusUpdate: new Date(),
      });
      await supplement.save();
      supplements.push(supplement);
    }

    res.status(201).json({
      success: true,
      message: "Supplements created successfully",
      data: supplements,
    });
  } catch (error) {
    console.error("Error creating supplement:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Add schedule to existing supplement (second screen)
export const addSchedule = async (req, res) => {
  try {
    const { supplementId } = req.params;
    const { startDate, endDate } = req.body;
    
    const supplement = await Supplement.findOne({ 
      _id: supplementId, 
      user: req.user.id 
    });
    
    if (!supplement) {
      return res.status(404).json({
        success: false,
        message: 'Supplement not found'
      });
    }
    
    // Update schedule with date range
    supplement.schedule = {
      startDate: startDate || supplement.schedule.startDate,
      endDate: endDate || supplement.schedule.endDate
    };
    
    await supplement.save();
    

   
    
    res.json({
      success: true,
      data: supplement
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};


export const updateSupplement = async (req, res) => {
  try {
    const supplement = await Supplement.findOne({ 
      _id: req.params.id, 
      user: req.user.id 
    });
    
    if (!supplement) {
      return res.status(404).json({
        success: false,
        message: 'Supplement not found'
      });
    }
    
    // Update basic fields if provided
    const {
      name,
      form,
      reason,
      day,
      time,
      status
    } = req.body;
    
    if (name) supplement.name = name;
    if (form) supplement.form = form;
    if (reason) supplement.reason = reason;
    if (day !== undefined) supplement.day = day;
    if (time) supplement.time = time;
    
    // Update status if provided
    if (status) {
      supplement.status = status;
      supplement.lastStatusUpdate = new Date();
    }
    
    await supplement.save();
    
 
    
    res.json({
      success: true,
      data: supplement
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};



export const getTodaysSupplements = async (req, res) => {
  try {
    const today = new Date();
    const currentDay = today.getDay(); // 0-6 representing Sunday-Saturday
    const currentDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    // Build query to find supplements for today
    const query = {
      user: req.user.id,
      day: currentDay,
      $or: [
        // Case 1: No schedule dates set (always active)
        {
          'schedule.startDate': null,
          'schedule.endDate': null
        },
        // Case 2: Only start date set, and today is after or equal to start date
        {
          'schedule.startDate': { $lte: currentDate },
          'schedule.endDate': null
        },
        // Case 3: Only end date set, and today is before or equal to end date
        {
          'schedule.startDate': null,
          'schedule.endDate': { $gte: currentDate }
        },
        // Case 4: Both dates set, and today is within the range
        {
          'schedule.startDate': { $lte: currentDate },
          'schedule.endDate': { $gte: currentDate }
        }
      ]
    };

    // Get supplements and sort by time
    const supplements = await Supplement.find(query).sort({ time: 1 });

    res.json({
      success: true,
      count: supplements.length,
      day: currentDay,
      date: currentDate.toISOString().split('T')[0], // YYYY-MM-DD format
      data: supplements
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};


export const getTodaySupplements = async (req, res) => {
  try {
    // Make sure we have a valid user ID
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required'
      });
    }
    
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0-6 for Sunday-Saturday
    
    // Find supplements for today based on day and schedule
    const supplements = await Supplement.find({
      user: req.user.id,
      day: dayOfWeek,
      // Only include supplements within their date range (if specified)
      $and: [
        {
          $or: [
            { 'schedule.startDate': { $exists: false } },
            { 'schedule.startDate': null },
            { 'schedule.startDate': { $lte: today } }
          ]
        },
        {
          $or: [
            { 'schedule.endDate': { $exists: false } },
            { 'schedule.endDate': null },
            { 'schedule.endDate': { $gte: today } }
          ]
        }
      ]
    }).select('-__v'); // Optionally exclude the version field
    
    res.json({
      success: true,
      count: supplements.length,
      data: supplements
    });
  } catch (error) {
    console.error('Error in getTodaySupplements:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

export const deleteSupplement = async (req, res) => {
  try {
    const supplement = await Supplement.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id
    });
    
    if (!supplement) {
      return res.status(404).json({
        success: false,
        message: 'Supplement not found'
      });
    }
    
    res.json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get supplements for a specific day
export const getSupplementsByDay = async (req, res) => {
  try {
    const { day } = req.params; // day should be 0-6 representing Sunday-Saturday
    const dayNum = parseInt(day);
    
    if (isNaN(dayNum) || dayNum < 0 || dayNum > 6) {
      return res.status(400).json({
        success: false,
        message: 'Invalid day parameter. Should be 0-6 representing Sunday-Saturday'
      });
    }
    
    const supplements = await Supplement.find({
      user: req.user.id,
      $or: [
        { 'schedule.daysOfWeek': dayNum },
        { frequency: 'Daily' }
      ]
    });
    
    res.json({
      success: true,
      count: supplements.length,
      data: supplements
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Update supplement status
export const updateSupplementStatus = async (req, res) => {
  try {
    const { supplementId } = req.params;
    const { status } = req.body;
    const userId = req.user?._id || req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    if (!['taken', 'missed', 'pending'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status',
      });
    }

    const supplement = await Supplement.findOne({
      _id: supplementId,
      user: userId,
    });

    if (!supplement) {
      return res.status(404).json({
        success: false,
        message: 'Supplement not found',
      });
    }

    supplement.status = status;
    supplement.lastStatusUpdate = new Date();
    await supplement.save();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingStatus = await SupplementStatus.findOne({
      supplementId: supplementId,
      userId: userId,
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
      },
    });

    if (status === 'taken') {
      if (existingStatus) {
        existingStatus.status = 'taken';
        await existingStatus.save();
      } else {
        await SupplementStatus.create({
          supplementId: supplementId,
          userId: userId,
          date: new Date(),
          status: 'taken',
          name: supplement.name,
          day: supplement.day,
        });
      }
    } else {
      if (existingStatus && existingStatus.status === 'taken') {
        await existingStatus.deleteOne();
      }
    }

    res.status(200).json({
      success: true,
      data: supplement,
    });
  } catch (error) {
    console.error('Error in updateSupplementStatus:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};







export const getDailyAdherenceStats = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;

    const today = new Date();
    const currentDay = today.getDay();

    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - currentDay);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const userSupplements = await Supplement.find({
      user: userId,
    });

    const expectedSupplementsByDay = Array(7).fill(0);
    const supplementIdsByDay = Array(7).fill().map(() => []);

    userSupplements.forEach((supplement) => {
      expectedSupplementsByDay[supplement.day]++;
      supplementIdsByDay[supplement.day].push(supplement._id.toString());
    });

    const supplementStatuses = [];

    for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
      const dayDate = new Date(startOfWeek);
      dayDate.setDate(startOfWeek.getDate() + dayIndex);
      dayDate.setHours(0, 0, 0, 0);

      const isPastOrToday = dayDate <= today;
      const dateString = dayDate.toISOString().split('T')[0];

      let takenCount = 0;

      if (isPastOrToday && supplementIdsByDay[dayIndex].length > 0) {
        const dayStatusRecords = await SupplementStatus.find({
          userId: userId,
          supplementId: { $in: supplementIdsByDay[dayIndex] },
          date: {
            $gte: new Date(dateString + 'T00:00:00.000Z'),
            $lte: new Date(dateString + 'T23:59:59.999Z'),
          },
          status: 'taken',
        });

        const uniqueTakenSupplements = new Set(
          dayStatusRecords.map((record) => record.supplementId.toString())
        );
        takenCount = uniqueTakenSupplements.size;
      }

      const totalExpected = expectedSupplementsByDay[dayIndex];
      let missedCount = 0;

      const dayStart = new Date(dayDate);
      dayStart.setHours(0, 0, 0, 0);

      if (isPastOrToday && dayStart < new Date(today.setHours(0, 0, 0, 0))) {
        missedCount = Math.max(0, totalExpected - takenCount);
      }

      const dayNames = [
        'Sunday',
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
      ];

      supplementStatuses.push({
        day: dayNames[dayIndex],
        date: dateString,
        total: totalExpected,
        taken: takenCount,
        missed: missedCount,
        adherenceRate:
          totalExpected > 0
            ? parseFloat(((takenCount / totalExpected) * 100).toFixed(1))
            : 0,
      });
    }

    res.json({
      success: true,
      data: {
        dailyData: supplementStatuses,
        weekRange: {
          start: startOfWeek.toISOString().split('T')[0],
          end: endOfWeek.toISOString().split('T')[0],
        },
      },
    });
  } catch (error) {
    console.error('Error in getDailyAdherenceStats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};


// Helper function to determine number of weeks in a year
function getWeeksInYear(year) {
  const lastDay = new Date(year, 11, 31);
  const lastWeek = getISOWeek(lastDay);
  return lastWeek === 1 ? 52 : lastWeek;
}

// Helper function to get ISO week number
function getISOWeek(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
  const week1 = new Date(d.getFullYear(), 0, 4);
  return 1 + Math.round(((d - week1) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
}






// Check and update supplements that were missed
// export const checkMissedSupplements = async (req, res) => {
//   try {
//     const currentDate = new Date();
//     const currentDay = currentDate.getDay(); // 0-6 for Sunday-Saturday
    
//     // Find supplements that should have been taken but status is still pending
//     const supplements = await Supplement.find({
//       status: 'pending',
//       $or: [
//         { 'schedule.daysOfWeek': currentDay },
//         { frequency: 'Daily' }
//       ]
//     }).populate('user', 'deviceToken notificationSettings');
    
//     let missedCount = 0;
    
//     for (const supplement of supplements) {
//       // Check if the scheduled time has passed
//       let shouldHaveBeenTaken = false;
      
//       if (supplement.schedule && supplement.schedule.timeOfDay) {
//         const [scheduledHour, scheduledMinute] = supplement.schedule.timeOfDay
//           .split(':')
//           .map(num => parseInt(num, 10));
          
//         const scheduledTime = new Date();
//         scheduledTime.setHours(scheduledHour, scheduledMinute, 0, 0);
        
//         // Add buffer time (e.g., 1 hour) after scheduled time before marking as missed
//         const bufferTime = new Date(scheduledTime);
//         bufferTime.setHours(bufferTime.getHours() + 1);
        
//         if (currentDate > bufferTime) {
//           shouldHaveBeenTaken = true;
//         }
//       }
      
//       if (shouldHaveBeenTaken) {
//         // Update status to missed
//         await Supplement.findByIdAndUpdate(
//           supplement._id,
//           { 
//             status: 'missed',
//             lastStatusUpdate: currentDate
//           }
//         );
        
//         // Import here to avoid circular dependency
//         const { sendNotification } = await import('../utils/notificationService.js');
        
//         // Send notification
//         await sendNotification({
//           userId: supplement.user._id,
//           title: 'Missed Supplement',
//           message: `You missed taking ${supplement.name} today.`,
//           type: 'missed_supplement',
//           supplementId: supplement._id
//         });
        
//         missedCount++;
//       }
//     }
    
//     res.json({
//       success: true,
//       message: `Checked ${supplements.length} supplements, marked ${missedCount} as missed`,
//       missedCount
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Server error',
//       error: error.message
//     });
//   }
// };

// Reset supplement statuses for the new day
// export const resetDailySupplementStatuses = async (req, res) => {
//   try {
//     const today = new Date();
//     const dayOfWeek = today.getDay();
    
//     // Find supplements scheduled for today
//     const result = await Supplement.updateMany(
//       {
//         $or: [
//           { 'schedule.daysOfWeek': dayOfWeek },
//           { frequency: 'Daily' }
//         ]
//       },
//       {
//         status: 'pending',
//         lastStatusUpdate: null
//       }
//     );
    
//     res.json({
//       success: true,
//       message: `Reset ${result.modifiedCount} supplements for today`,
//       count: result.modifiedCount
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Server error',
//       error: error.message
//     });
//   }
// };



