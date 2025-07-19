import Progress from "../models/Progress.js";
import Supplement from "../models/Supplement.js";


export const getProgressBySupplementAndDateRange = async (req, res) => {
  try {
    const { supplementId, startDate, endDate } = req.query;
    
    // Validate inputs
    if (!supplementId) {
      return res.status(400).json({
        success: false,
        message: 'Supplement ID is required'
      });
    }
    
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 3600 * 1000); // Default to last 30 days
    const end = endDate ? new Date(endDate) : new Date();
    
    // Make sure the dates are valid
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format'
      });
    }
    
    // Set time to beginning and end of the day
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    
    // Find progress records
    const progressRecords = await Progress.find({
      user: req.user.id,
      supplement: supplementId,
      date: { $gte: start, $lte: end }
    }).sort({ date: 1 });
    
    // Get supplement details
    const supplement = await Supplement.findById(supplementId);
    
    if (!supplement) {
      return res.status(404).json({
        success: false,
        message: 'Supplement not found'
      });
    }
    
    res.json({
      success: true,
      data: {
        supplement,
        progress: progressRecords
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

export const getProgressForAllSupplements = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 3600 * 1000); // Default to last 30 days
    const end = endDate ? new Date(endDate) : new Date();
    
    // Make sure the dates are valid
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format'
      });
    }
    
    // Set time to beginning and end of the day
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    
    // Get all supplements for the user
    const supplements = await Supplement.find({ user: req.user.id });
    const supplementIds = supplements.map(s => s._id);
    
    // Find progress records for all supplements
    const progressRecords = await Progress.find({
      user: req.user.id,
      supplement: { $in: supplementIds },
      date: { $gte: start, $lte: end }
    }).sort({ date: 1 });
    
    // Group progress by supplement
    const progressBySupplements = {};
    supplements.forEach(supplement => {
      progressBySupplements[supplement._id] = {
        supplement,
        progress: progressRecords.filter(record => 
          record.supplement.toString() === supplement._id.toString()
        )
      };
    });
    
    res.json({
      success: true,
      data: progressBySupplements
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

export const recordProgress = async (req, res) => {
  try {
    const { supplementId, date, taken, takenAt, missedReason, notes } = req.body;
    
    // Validate inputs
    if (!supplementId || !date) {
      return res.status(400).json({
        success: false,
        message: 'Supplement ID and date are required'
      });
    }
    
    // Check if supplement exists
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
    
    // Check if progress record already exists for this date
    let progress = await Progress.findOne({
      user: req.user.id,
      supplement: supplementId,
      date: new Date(date)
    });
    
    if (progress) {
      // Update existing record
      progress.taken = taken !== undefined ? taken : progress.taken;
      progress.takenAt = takenAt || progress.takenAt;
      progress.missedReason = missedReason !== undefined ? missedReason : progress.missedReason;
      progress.notes = notes !== undefined ? notes : progress.notes;
    } else {
      // Create new record
      progress = new Progress({
        user: req.user.id,
        supplement: supplementId,
        date: new Date(date),
        taken: taken !== undefined ? taken : true,
        takenAt: takenAt || new Date(),
        missedReason,
        notes
      });
    }
    
    await progress.save();
    
    res.json({
      success: true,
      data: progress
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

export const getProgressSummary = async (req, res) => {
  try {
    const { days } = req.query;
    const daysToLookBack = parseInt(days) || 30;
    
    // Calculate dates
    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - daysToLookBack);
    
    // Get all supplements for the user
    const supplements = await Supplement.find({ user: req.user.id });
    const supplementIds = supplements.map(s => s._id);
    
    // Get all progress records in the date range
    const progressRecords = await Progress.find({
      user: req.user.id,
      supplement: { $in: supplementIds },
      date: { $gte: startDate, $lte: endDate }
    });
    
    // Calculate compliance metrics
    const summary = {
      totalScheduled: 0,
      totalTaken: 0,
      compliance: 0,
      supplementStats: {}
    };
    
    // Initialize supplement stats
    supplements.forEach(supplement => {
      summary.supplementStats[supplement._id] = {
        name: supplement.name,
        scheduled: 0,
        taken: 0,
        compliance: 0
      };
    });
    
    // Process progress records
    progressRecords.forEach(record => {
      const supplementId = record.supplement.toString();
      
      // Update total counts
      summary.totalScheduled++;
      if (record.taken) {
        summary.totalTaken++;
      }
      
      // Update supplement-specific counts
      summary.supplementStats[supplementId].scheduled++;
      if (record.taken) {
        summary.supplementStats[supplementId].taken++;
      }
    });
    
    // Calculate compliance percentages
    if (summary.totalScheduled > 0) {
      summary.compliance = (summary.totalTaken / summary.totalScheduled) * 100;
    }
    
    // Calculate supplement-specific compliance
    Object.keys(summary.supplementStats).forEach(supplementId => {
      const stats = summary.supplementStats[supplementId];
      if (stats.scheduled > 0) {
        stats.compliance = (stats.taken / stats.scheduled) * 100;
      }
    });
    
    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};