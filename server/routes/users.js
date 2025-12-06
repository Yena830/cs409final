import express from 'express';
import User from '../models/user.js';
import { addRole, addRoleToCurrentUser, uploadProfilePhoto, updateUserProfile } from '../controllers/userController.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

// ===========================================
// Static routes (no parameters)
// ===========================================

// GET /api/users - Get all users
router.get('/', async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json({ message: 'OK', data: users });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
});

// GET /api/users/helpers - Get all users with helper role
router.get('/helpers', async (req, res) => {
  try {
    // Query users where roles array contains 'helper'
    // Must use $in operator as specified
    const helpers = await User.find({ roles: { $in: ['helper'] } })
      .select('-password') // Exclude password
      .sort({ createdAt: -1 });
    res.json({ success: true, data: helpers });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching helpers', 
      error: error.message 
    });
  }
});

// POST /api/users/add-role - Add a role to the current authenticated user (protected)
router.post('/add-role', verifyToken, addRoleToCurrentUser);

// POST /api/users/upload-profile-photo - Upload profile photo for current user (protected)
router.post('/upload-profile-photo', verifyToken, upload.single('image'), uploadProfilePhoto);

// POST /api/users - Create a new user
router.post('/', async (req, res) => {
  try {
    const user = new User(req.body);
    const savedUser = await user.save();
    res.status(201).json({ message: 'OK', data: savedUser });
  } catch (error) {
    res.status(400).json({ message: 'Error creating user', error: error.message });
  }
});

// ===========================================
// Parameterized routes with specific paths (must come before single :id route)
// ===========================================

// PATCH /api/users/:id/add-role - Add a role to a user (protected)
router.patch('/:id/add-role', verifyToken, addRole);

// ===========================================
// Single parameter routes (must come last)
// ===========================================

// GET /api/users/:id - Get a single user by ID
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'OK', data: user });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user', error: error.message });
  }
});

// PUT /api/users/:id - Update a user by ID
router.put('/:id', verifyToken, updateUserProfile);

// DELETE /api/users/:id - Delete a user by ID
router.delete('/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'OK', data: { id: req.params.id, deleted: true } });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting user', error: error.message });
  }
});

export default router;