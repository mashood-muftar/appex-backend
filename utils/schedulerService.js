import schedule from 'node-schedule';
import Supplement from '../models/Supplement.js';
import { sendPushNotification } from './notificationService.js';

// Map to store active scheduled jobs
const activeJobs = new Map();

/**
 * Parse HH:MM time string to get hour and minute as integers
 * @param {string} timeString - Time in HH:MM format
 * @returns {Object} Object with hours and minutes
 */
const parseTime = (timeString) => {
  const [hours, minutes] = timeString.split(':').map(Number);
  return { hours, minutes };
};

/**
 * Get current date and time in UK timezone
 * @returns {Date} Current date in UK timezone
 */
const getCurrentUKDateTime = () => {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/London' }));
};

/**
 * Schedule notifications for a supplement
 * @param {Object} supplement - Supplement document
 * @returns {Promise<Object>} Object containing scheduled jobs
 */
export const scheduleSupplementNotification = async (supplement) => {
  console.log(`📅 SCHEDULING: Starting for supplement ID: ${supplement._id}, Name: ${supplement.name}`);

  const { _id, day, time, name, user } = supplement;
  const jobId = `supplement_${_id}`;

  // Cancel existing jobs if they exist
  if (activeJobs.has(jobId)) {
    const jobs = activeJobs.get(jobId);
    console.log(`🔄 RESCHEDULING: Cancelling existing jobs for supplement ID: ${_id}`);
    jobs.forEach(job => {
      if (job && typeof job.cancel === 'function') {
        job.cancel();
      }
    });
    activeJobs.delete(jobId);
  }

  const { hours, minutes } = parseTime(time);
  const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

  // Create a unique identifier for each job to prevent duplicates
  const reminderIdentifier = `reminder_${_id}_${day}_${hours}_${minutes}`;
  const missedIdentifier = `missed_${_id}_${day}_${hours + 1}_${minutes}`;

  // Cancel any existing jobs with the same identifiers across all active jobs
  for (const [existingJobId, jobs] of activeJobs.entries()) {
    if (existingJobId.includes(reminderIdentifier) || existingJobId.includes(missedIdentifier)) {
      console.log(`🔄 CANCELLING DUPLICATE JOB: ${existingJobId}`);
      jobs.forEach(job => {
        if (job && typeof job.cancel === 'function') {
          job.cancel();
        }
      });
      activeJobs.delete(existingJobId);
    }
  }

  // Create recurrence rule for reminder
  const reminderRule = new schedule.RecurrenceRule();
  reminderRule.dayOfWeek = day;
  reminderRule.hour = hours;
  reminderRule.minute = minutes;
  reminderRule.second = 0;
  reminderRule.tz = 'Europe/London';

  // Create recurrence rule for missed notification (1 hour later)
  let missedHour = hours + 1;
  let missedDay = day;
  if (missedHour >= 24) {
    missedHour -= 24;
    missedDay = (day + 1) % 7;
  }
  const missedRule = new schedule.RecurrenceRule();
  missedRule.dayOfWeek = missedDay;
  missedRule.hour = missedHour;
  missedRule.minute = minutes;
  missedRule.second = 0;
  missedRule.tz = 'Europe/London';

  // Schedule reminder job with debounce mechanism
  const reminderJob = schedule.scheduleJob(reminderIdentifier, reminderRule, async () => {
    console.log(`⏰ REMINDER TRIGGERED: ${getCurrentUKDateTime().toISOString()} for supplement ${name}`);
    try {
      // Get the current supplement to check last notification time and status
      const currentSupplement = await Supplement.findById(_id);
      if (!currentSupplement) {
        console.log(`❌ ERROR: Supplement ${_id} no longer exists`);
        return;
      }
      
      // Check if a notification was sent recently (within last 5 minutes)
      const lastUpdate = currentSupplement.lastStatusUpdate || new Date(0);
      const fiveMinutesAgo = new Date(getCurrentUKDateTime() - 5 * 60 * 1000);
      
      if (lastUpdate > fiveMinutesAgo && currentSupplement.status === 'pending') {
        console.log(`⏭️ SKIPPING DUPLICATE NOTIFICATION: Recently updated supplement ${name}`);
        return;
      }
      
      await Supplement.findByIdAndUpdate(_id, {
        status: 'pending',
        lastStatusUpdate: new Date(),
      });

      const notificationResult = await sendPushNotification(
        user,
        'EMBER ON',
        `Have you taken your ${name} supplement yet? Don't forget to mark as taken at ${formattedTime}.`,
        { supplementId: _id.toString(), type: 'SUPPLEMENT_REMINDER' }
      );

      console.log(notificationResult
        ? `✅ NOTIFICATION SUCCESS: Sent for supplement: ${name}`
        : `❌ NOTIFICATION FAILED: Could not send for supplement: ${name}`);
    } catch (error) {
      console.error(`❌ ERROR: Failed to process reminder notification for ${name}:`, error);
    }
  });

  // Schedule missed job with unique identifier
  const missedJob = schedule.scheduleJob(missedIdentifier, missedRule, async () => {
    console.log(`❓ MISSED CHECK TRIGGERED: ${getCurrentUKDateTime().toISOString()} for supplement ${name}`);
    try {
      const currentSupplement = await Supplement.findById(_id);
      if (!currentSupplement) {
        console.log(`❌ ERROR: Supplement ${_id} no longer exists`);
        return;
      }
      
      if (currentSupplement && currentSupplement.status === 'pending') {
        await Supplement.findByIdAndUpdate(_id, {
          status: 'missed',
          lastStatusUpdate: new Date(),
        });

        const notificationResult = await sendPushNotification(
          user,
          'Missed Supplement',
          `You missed your ${name} supplement`,
          { supplementId: _id.toString(), type: 'SUPPLEMENT_MISSED' }
        );

        console.log(notificationResult
          ? `✅ MISSED NOTIFICATION SUCCESS: Sent for supplement: ${name}`
          : `❌ MISSED NOTIFICATION FAILED: Could not send for supplement: ${name}`);
      } else {
        console.log(`ℹ️ INFO: Supplement ${name} was already taken or not pending, no missed notification needed`);
      }
    } catch (error) {
      console.error(`❌ ERROR: Failed to process missed notification for ${name}:`, error);
    }
  });

  // Verify jobs were scheduled and store them
  if (!reminderJob || !missedJob) {
    console.error(`❌ ERROR: Failed to schedule jobs for supplement ${name}`);
    if (reminderJob) reminderJob.cancel();
    if (missedJob) missedJob.cancel();
    activeJobs.delete(jobId);
    return { reminderJob: null, missedJob: null };
  }

  // Store jobs with unique identifiers
  activeJobs.set(jobId, [reminderJob, missedJob]);

  console.log(`🔜 NEXT REMINDER: ${reminderJob.nextInvocation()?.toISOString() || 'Unknown'}`);
  console.log(`🔜 NEXT MISSED CHECK: ${missedJob.nextInvocation()?.toISOString() || 'Unknown'}`);
  console.log(`✅ SCHEDULING COMPLETE: For supplement ${name}`);

  return { reminderJob, missedJob };
};

/**
 * Initialize all schedules from the database
 * @returns {Promise<void>}
 */
export const initializeAllSchedules = async () => {
  console.log(`🚀 INITIALIZING ALL SCHEDULES: Starting at ${getCurrentUKDateTime().toISOString()} UK time`);

  // Clear all existing jobs
  for (const [jobId, jobs] of activeJobs.entries()) {
    jobs.forEach(job => {
      if (job && typeof job.cancel === 'function') {
        job.cancel();
      }
    });
    activeJobs.delete(jobId);
  }

  try {
    // Get all unique supplements (to avoid duplicates)
    const supplements = await Supplement.find({})
      .populate('user', 'deviceToken notificationSettings')
      .lean();
    
    console.log(`📦 FOUND ${supplements.length} SUPPLEMENTS TO SCHEDULE`);

    // Create a map to detect duplicate supplements
    const supplementMap = new Map();
    const uniqueSupplements = [];
    
    for (const supplement of supplements) {
      const key = `${supplement.user._id}_${supplement.name}_${supplement.day}_${supplement.time}`;
      if (!supplementMap.has(key)) {
        supplementMap.set(key, true);
        uniqueSupplements.push(supplement);
      } else {
        console.log(`⚠️ DUPLICATE SUPPLEMENT DETECTED: ${supplement.name} for user ${supplement.user._id}, skipping...`);
      }
    }
    
    console.log(`📊 SCHEDULING ${uniqueSupplements.length} UNIQUE SUPPLEMENTS`);

    for (const supplement of uniqueSupplements) {
      await scheduleSupplementNotification(supplement);
    }
    console.log(`✅ ALL SCHEDULES INITIALIZED SUCCESSFULLY`);
  } catch (error) {
    console.error(`❌ ERROR INITIALIZING SCHEDULES:`, error);
  }
};

/**
 * Schedule daily status reset at midnight UK time
 * @returns {Object} The scheduled job
 */
export const scheduleStatusReset = () => {
  console.log(`🔄 SETTING UP DAILY RESET: Will run at midnight UK time`);

  const resetRule = new schedule.RecurrenceRule();
  resetRule.hour = 0;
  resetRule.minute = 0;
  resetRule.second = 0;
  resetRule.tz = 'Europe/London';

  const resetJob = schedule.scheduleJob(resetRule, async () => {
    console.log(`🔄 DAILY RESET TRIGGERED: ${getCurrentUKDateTime().toISOString()} UK time`);
    try {
      const today = getCurrentUKDateTime();
      const dayOfWeek = today.getDay();

      const supplements = await Supplement.find({
        day: dayOfWeek,
        $or: [{ status: 'missed' }, { status: 'taken' }],
      });

      console.log(`📦 FOUND ${supplements.length} SUPPLEMENTS TO RESET FOR DAY ${dayOfWeek}`);

      for (const supplement of supplements) {
        const { hours, minutes } = parseTime(supplement.time);
        const currentHour = today.getHours();
        const currentMinute = today.getMinutes();

        if (hours > currentHour || (hours === currentHour && minutes > currentMinute)) {
          await Supplement.findByIdAndUpdate(supplement._id, {
            status: 'pending',
            lastStatusUpdate: new Date(),
          });
          console.log(`✅ RESET SUPPLEMENT: ${supplement.name} to pending status`);
        } else {
          console.log(`ℹ️ NO RESET NEEDED: ${supplement.name}, time is in the past`);
        }
      }
    } catch (error) {
      console.error(`❌ ERROR IN DAILY RESET:`, error);
    }
  });

  return resetJob;
};

/**
 * Schedule status check for a newly created supplement
 * @param {Object} supplement - The supplement document
 * @returns {Promise<Object>} Object containing scheduled jobs
 */
export const scheduleStatusCheck = async (supplement) => {
  console.log(`📝 NEW SUPPLEMENT SCHEDULING: Starting for ${supplement.name} for user ${supplement.user}`);

  try {
    if (!supplement.user.deviceToken) {
      supplement = await Supplement.findById(supplement._id).populate('user', 'deviceToken notificationSettings');
    }

    const jobId = `supplement_${supplement._id}`;
    if (activeJobs.has(jobId)) {
      const jobs = activeJobs.get(jobId);
      jobs.forEach(job => {
        if (job && typeof job.cancel === 'function') {
          job.cancel();
        }
      });
      activeJobs.delete(jobId);
    }

    return await scheduleSupplementNotification(supplement);
  } catch (error) {
    console.error(`❌ ERROR SCHEDULING NEW SUPPLEMENT:`, error);
    throw error;
  }
};
