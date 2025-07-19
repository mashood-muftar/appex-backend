import Schedule from "../models/Schedule.js";
import Supplement from "../models/Supplement.js";

export const getAllSchedules = async (req, res) => {
  try {
    // Get all schedules for the authenticated user
    const schedules = await Schedule.find({ user: req.user.id })
      .populate('supplement', 'name form dosage');
    
    res.json({
      success: true,
      count: schedules.length,
      data: schedules
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

export const getScheduleById = async (req, res) => {
  try {
    const schedule = await Schedule.findOne({
      _id: req.params.id,
      user: req.user.id
    }).populate('supplement', 'name form dosage');
    
    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Schedule not found'
      });
    }
    
    res.json({
      success: true,
      data: schedule
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

export const createSchedule = async (req, res) => {
  try {
    const { supplementId, time, timeType } = req.body;
    
    // Basic validation
    if (!supplementId || !time) {
      return res.status(400).json({ message: 'Supplement ID and time are required' });
    }
    
    // Check if supplement exists and belongs to user
    const supplement = await Supplement.findOne({
      _id: supplementId,
      user: req.user._id
    });
    
    if (!supplement) {
      return res.status(404).json({ message: 'Supplement not found' });
    }
    
    // Create new schedule
    const schedule = new Schedule({
      supplement: supplementId,
      user: req.user._id,
      time,
      timeType: timeType || 'Regular'
    });
    
    await schedule.save();
    
    res.status(201).json({
      success: true,
      schedule
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

export const updateSchedule = async (req, res) => {
  try {
    const { time, timeType, active } = req.body;
    
    // Find and update the schedule
    const schedule = await Schedule.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { time, timeType, active },
      { new: true, runValidators: true }
    );
    
    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }
    
    res.status(200).json({ 
      success: true,
      schedule 
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

export const deleteSchedule = async (req, res) => {
  try {
    const schedule = await Schedule.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id
    });
    
    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Schedule not found'
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

export const markScheduleCompleted = async (req, res) => {
  try {
    const { taken, notes } = req.body;
    const date = req.body.date ? new Date(req.body.date) : new Date();
    
    const schedule = await Schedule.findOne({
      _id: req.params.id,
      user: req.user._id
    });
    
    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }
    
    // Add completion record
    schedule.completed.push({
      date,
      taken: taken || false,
      notes: notes || ''
    });
    
    await schedule.save();
    
    res.status(200).json({ 
      success: true,
      schedule 
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

export const getSchedulesByDate = async (req, res) => {
  try {
    const { date } = req.query;
    const queryDate = date ? new Date(date) : new Date();
    
    // Get day of week (0-6, where 0 is Sunday)
    const dayOfWeek = queryDate.getDay();
    
    // Find supplements scheduled for this day
    const supplements = await Supplement.find({
      user: req.user._id,
      'schedule.daysOfWeek': dayOfWeek
    });
    
    // Get all schedules for these supplements
    const supplementIds = supplements.map(s => s._id);
    const schedules = await Schedule.find({
      user: req.user._id,
      supplement: { $in: supplementIds },
      active: true
    }).populate('supplement', 'name form reason dosage');
    
    res.status(200).json({ schedules });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
