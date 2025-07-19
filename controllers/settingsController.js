import UserSettings from "../models/UserSettings.js";


export const getUserSettings = async (req, res) => {
  try {
    let settings = await UserSettings.findOne({ user: req.user.id });
    
    // If no settings exist yet, create default settings
    if (!settings) {
      settings = new UserSettings({ user: req.user.id });
      await settings.save();
    }
    
    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

export const updateUserSettings = async (req, res) => {
  try {
    const updates = req.body;
    
    let settings = await UserSettings.findOne({ user: req.user.id });
    
    // If no settings exist yet, create them
    if (!settings) {
      settings = new UserSettings({ 
        user: req.user.id,
        ...updates
      });
      await settings.save();
    } else {
      // Apply updates to existing settings
      if (updates.notificationSettings) {
        settings.notificationSettings = {
          ...settings.notificationSettings.toObject(),
          ...updates.notificationSettings
        };
      }
      
      if (updates.theme) settings.theme = updates.theme;
      if (updates.measurementUnit) settings.measurementUnit = updates.measurementUnit;
      
      await settings.save();
    }
    
    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

export const updateNotificationSettings = async (req, res) => {
  try {
    const { enabledForMissedSupplements, customReminderSounds, reminderFrequency } = req.body;
    
    let settings = await UserSettings.findOne({ user: req.user.id });
    
    // If no settings exist yet, create them
    if (!settings) {
      settings = new UserSettings({ 
        user: req.user.id,
        notificationSettings: {
          enabledForMissedSupplements,
          customReminderSounds,
          reminderFrequency
        }
      });
    } else {
      // Update notification settings
      if (enabledForMissedSupplements !== undefined) {
        settings.notificationSettings.enabledForMissedSupplements = enabledForMissedSupplements;
      }
      
      if (customReminderSounds !== undefined) {
        settings.notificationSettings.customReminderSounds = customReminderSounds;
      }
      
      if (reminderFrequency) {
        settings.notificationSettings.reminderFrequency = reminderFrequency;
      }
    }
    
    await settings.save();
    
    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};