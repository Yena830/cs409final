import User from '../models/user.js';
const useCloudinary = !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
const uploadMiddleware = useCloudinary 
  ? (await import('../middleware/cloudinaryUploadMiddleware.js')).default
  : (await import('../middleware/uploadMiddleware.js')).default;
import path from 'path';

/**
 * Add a role to the current authenticated user
 * Allows users to upgrade their role (e.g., owner → helper, helper → owner)
 * Route: POST /api/users/add-role
 */
export const addRoleToCurrentUser = async (req, res) => {
  try {
    const { role } = req.body;
    const userId = req.user.id;

    // Validate role
    if (!role || !['owner', 'helper'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be "owner" or "helper"',
      });
    }

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check if user already has this role
    if (user.roles.includes(role)) {
      // Return success even if role already exists
      const updatedUser = await User.findById(userId).select('-password');
      return res.json({
        success: true,
        data: updatedUser,
        message: `User already has the "${role}" role`,
      });
    }

    // Add role if it doesn't exist
    user.roles.push(role);
    await user.save();

    // Return updated user without password
    const updatedUser = await User.findById(userId).select('-password');

    res.json({
      success: true,
      data: updatedUser,
      message: `Successfully added "${role}" role`,
    });
  } catch (error) {
    console.error('Error adding role:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error adding role',
    });
  }
};

/**
 * Remove a role from the current authenticated user.
 * If no roles remain after removal, delete the account.
 * Route: POST /api/users/remove-role
 */
export const removeRoleFromCurrentUser = async (req, res) => {
  try {
    const { role } = req.body;
    const userId = req.user.id;

    if (!role || !['owner', 'helper'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be "owner" or "helper"',
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (!user.roles.includes(role)) {
      return res.json({
        success: true,
        data: await User.findById(userId).select('-password'),
        message: `User does not have the "${role}" role`,
      });
    }

    // Remove role
    user.roles = user.roles.filter(r => r !== role);

    // If no roles remain, delete account
    if (user.roles.length === 0) {
      await User.findByIdAndDelete(userId);
      return res.json({
        success: true,
        data: { deleted: true, id: userId },
        message: 'Account deleted because no roles remain',
      });
    }

    await user.save();
    const updatedUser = await User.findById(userId).select('-password');

    res.json({
      success: true,
      data: updatedUser,
      message: `Successfully removed "${role}" role`,
    });
  } catch (error) {
    console.error('Error removing role:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error removing role',
    });
  }
};

/**
 * Add a role to a user by ID (deprecated - kept for backward compatibility)
 * Allows users to upgrade their role (e.g., owner → helper, helper → owner)
 * Route: PATCH /api/users/:id/add-role
 */
export const addRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    const userId = req.user.id;

    // Validate role
    if (!role || !['owner', 'helper'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be "owner" or "helper"',
      });
    }

    // Check if user is trying to update their own role
    if (id.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own role',
      });
    }

    // Find the user
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check if user already has this role
    if (user.roles.includes(role)) {
      const updatedUser = await User.findById(id).select('-password');
      return res.json({
        success: true,
        data: updatedUser,
        message: `User already has the "${role}" role`,
      });
    }

    // Add role if it doesn't exist
    user.roles.push(role);
    await user.save();

    // Return updated user without password
    const updatedUser = await User.findById(id).select('-password');

    res.json({
      success: true,
      data: updatedUser,
      message: `Successfully added "${role}" role`,
    });
  } catch (error) {
    console.error('Error adding role:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error adding role',
    });
  }
};

/**
 * Upload profile photo for the current authenticated user
 * Route: POST /api/users/upload-profile-photo
 */
export const uploadProfilePhoto = async (req, res) => {
  try {
    const userId = req.user.id;

    console.log('Upload profile photo request:', {
      userId: userId,
      hasFile: !!req.file,
      file: req.file,
      body: req.body,
      headers: req.headers['content-type']
    });

    // Check if file was uploaded
    if (!req.file) {
      console.log('No file in request');
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
      });
    }

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Update user's profile photo field
    // Construct image URL based on storage type
    let photoUrl;
    if (useCloudinary && req.file.path) {
      // Cloudinary directly returns secure_url
      photoUrl = req.file.path;
    } else if (!useCloudinary && req.file.filename) {
      // Local storage needs to construct URL
      const protocol = req.protocol || 'http';
      const host = req.get('host') || 'localhost:3001';
      photoUrl = `${protocol}://${host}/uploads/${req.file.filename}`;
    } else {
      // Fallback
      photoUrl = req.file.path || req.file.filename;
    }
    user.profilePhoto = photoUrl;
    await user.save();

    // Return updated user without password
    const updatedUser = await User.findById(userId).select('-password');

    console.log('Profile photo uploaded successfully:', {
      userId: userId,
      photoUrl: user.profilePhoto,
      filename: req.file.filename
    });

    res.json({
      success: true,
      data: {
        ...updatedUser.toObject(),
        profilePhoto: updatedUser.profilePhoto
      },
      message: 'Profile photo uploaded successfully',
    });
  } catch (error) {
    console.error('Error uploading profile photo:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error uploading profile photo',
    });
  }
};

/**
 * Update user profile (including profile photo URL)
 * Route: PUT /api/users/:id
 */
export const updateUserProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Check if user is trying to update their own profile
    if (id.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own profile',
      });
    }

    // Find the user
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Update user fields
    const { name, bio, location, expectedHourlyRate, profilePhoto, specialties } = req.body;
    if (name) user.name = name;
    if (bio !== undefined) user.bio = bio;
    if (location !== undefined) user.location = location;
    if (expectedHourlyRate !== undefined) user.expectedHourlyRate = expectedHourlyRate;
    if (profilePhoto) user.profilePhoto = profilePhoto;
    if (specialties !== undefined) user.specialties = specialties;

    await user.save();

    // Return updated user without password
    const updatedUser = await User.findById(id).select('-password');

    res.json({
      success: true,
      data: updatedUser,
      message: 'Profile updated successfully',
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating profile',
    });
  }
};
