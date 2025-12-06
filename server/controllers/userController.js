import User from '../models/user.js';
import upload from '../middleware/uploadMiddleware.js';
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

    // Check if file was uploaded
    if (!req.file) {
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
    // In production, you might want to store the full URL to a cloud storage service
    // For now, we'll construct the full URL based on the server
    const protocol = req.protocol || 'http';
    const host = req.get('host') || 'localhost:3001';
    user.profilePhoto = `${protocol}://${host}/uploads/${req.file.filename}`;
    await user.save();

    // Return updated user without password
    const updatedUser = await User.findById(userId).select('-password');

    res.json({
      success: true,
      data: updatedUser,
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
    const { name, bio, profilePhoto } = req.body;
    if (name) user.name = name;
    if (bio !== undefined) user.bio = bio;
    if (profilePhoto) user.profilePhoto = profilePhoto;

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