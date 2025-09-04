import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Invitation from '../models/Invitation.js';
import Appointment from '../models/Appointment.js';
import Friend from '../models/Friend.js';
import { sendOTPEmail } from '../utils/emailService.js';
import cloudinary from '../config/cloudinary.js';
import { Readable } from 'stream';


// Create
export const addAppointment = async (req, res) => {
  try {
    const { title, description, date, time, location } = req.body;
    if (!title || !date || !time) {
      return res.status(400).json({ success: false, message: "Title, date and time are required" });
    }
    // const appointment = new Appointment({ user: req.user._id, title, description, date, time, location });
    const appointment = new Appointment({ title, description, date, time, location });
    await appointment.save();
    res.status(201).json({ success: true, data: appointment });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

// Get all
export const getAppointment = async (req, res) => {
  try {
    const appointments = await Appointment.find({ user: req.user._id });
    res.json({ success: true, count: appointments.length, data: appointments });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

// Helper function to generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

export const register = async (req, res) => {
  try {
    const { name, email, password, deviceToken } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists',
      });
    }

    // Create new user
    const user = new User({
      name,
      email: email.toLowerCase(),
      password,
      deviceToken: deviceToken || null,
      isVerified: false,
    });

    // Generate OTP
    const otp = user.generateOTP();
    await user.save();

    // Send verification email
    const emailSent = await sendOTPEmail(user.email, user.name, otp);
    if (!emailSent) {
      console.error('Failed to send verification email');
    }

    res.status(201).json({
      success: true,
      message: 'Account created. Please verify your email with the OTP sent.',
      data: { emailSent },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

export const registerWithInvitation = async (req, res) => {
  try {
    const { name, email, password, token, deviceToken } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required',
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already in use',
      });
    }

    // Create new user
    const user = new User({
      name,
      email: email.toLowerCase(),
      password,
      deviceToken: deviceToken || null,
      isVerified: false,
    });

    // Generate OTP
    const otp = user.generateOTP();
    await user.save();

    // Handle invitation if token is provided
    if (token) {
      const invitation = await Invitation.findOne({
        token,
        email: email.toLowerCase(),
        expiresAt: { $gt: new Date() },
      });

      if (!invitation) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired invitation token',
        });
      }

      // Create friendship
      const friend = new Friend({
        userId: invitation.inviterId,
        friendId: user._id,
        status: 'accepted', // Auto-accept for invitation-based registration
      });
      await friend.save();

      // Optionally delete the invitation after use
      await Invitation.deleteOne({ token });
    }

    // Send verification email
    const emailSent = await sendOTPEmail(user.email, user.name, otp);
    if (!emailSent) {
      console.error('Failed to send verification email');
    }

    return res.status(201).json({
      success: true,
      message: 'Account created. Please verify your email with the OTP sent.',
      data: { emailSent },
    });
  } catch (error) {
    console.error('Error registering user:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to register user',
      error: error.message,
    });
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP are required',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified',
      });
    }

    if (!user.verifyOTP(otp)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP',
      });
    }

    user.isVerified = true;
    user.verificationOTP = { code: null, expiresAt: null };
    await user.save();

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Email verified successfully',
      data: {
        token,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          profilePicture: user.profilePicture,
          deviceToken: user.deviceToken,
          isVerified: user.isVerified,
          createdAt: user.createdAt,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

export const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'User is already verified',
      });
    }

    const otp = user.generateOTP();
    await user.save();

    const emailSent = await sendOTPEmail(user.email, user.name, otp);
    if (!emailSent) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP email',
      });
    }

    res.status(200).json({
      success: true,
      message: 'OTP resent successfully',
      data: { emailSent: true },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password, deviceToken } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    if (!user.isVerified) {
      const otp = user.generateOTP();
      await user.save();
      await sendOTPEmail(user.email, user.name, otp);
      return res.status(403).json({
        success: false,
        message: 'Email not verified. A new OTP has been sent.',
        data: { email: user.email },
      });
    }

    if (deviceToken) {
      user.deviceToken = deviceToken;
      await user.save();
    }

    const token = generateToken(user._id);
    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.verificationOTP;

    res.json({
      success: true,
      data: { user: userResponse, token },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};


export const updateDeviceToken = async (req, res) => {
  try {
    const { deviceToken } = req.body;
    console.log('req.user',req.user);
    
    if (!deviceToken) {
      return res.status(400).json({
        success: false,
        message: 'Device token is required'
      });
    }
    
    // Update user's device token
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { deviceToken },
      { new: true }
    ).select('-password');
    
    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      data: {
        user: updatedUser
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


export const deleteUser = async (req, res) => {
  try {
    // look up by the ID our auth middleware put on req.user.id
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // remove the document (fires any pre/post hooks)
    await user.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Your account has been deleted'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};




export const getProfile = async (req, res) => {
  try {
    // req.user is set by auth middleware
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const updates = req.body;
    
    // Disallow password update through this route
    if (updates.password) {
      delete updates.password;
    }
    
    // Handle profile picture upload
    if (req.file) {
      try {
        // Upload to Cloudinary directly from buffer
        const uploadFromBuffer = (buffer) => {
          return new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
              {
                folder: 'profile_pictures',
                transformation: [{ width: 500, height: 500, crop: 'fill' }]
              },
              (error, result) => {
                if (error) return reject(error);
                resolve(result);
              }
            );
            
            // Create a readable stream from buffer and pipe to cloudinary
            const stream = Readable.from(buffer);
            stream.pipe(uploadStream);
          });
        };
        
        // Upload file buffer to Cloudinary
        const result = await uploadFromBuffer(req.file.buffer);
        
        // Add the Cloudinary URL to the updates
        updates.profilePicture = result.secure_url;
        
        // If user already has a profile picture, delete the old one from Cloudinary
        const user = await User.findById(req.user.id);
        if (user.profilePicture && user.profilePicture.includes('cloudinary')) {
          // Extract public_id from the URL (this may need adjustment based on your URL structure)
          const publicId = user.profilePicture.split('/').slice(-1)[0].split('.')[0];
          await cloudinary.uploader.destroy(`profile_pictures/${publicId}`);
        }
      } catch (uploadError) {
        return res.status(400).json({
          success: false,
          message: 'Error uploading image',
          error: uploadError.message
        });
      }
    }
    
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      data: updatedUser
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
