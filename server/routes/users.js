import express from 'express';
import User from '../models/user.js';
import Review from '../models/review.js';
import { addRole, addRoleToCurrentUser, uploadProfilePhoto, updateUserProfile } from '../controllers/userController.js';
import { verifyToken } from '../middleware/authMiddleware.js';
const useCloudinary = process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET;
const uploadMiddleware = useCloudinary 
  ? (await import('../middleware/cloudinaryUploadMiddleware.js')).default
  : (await import('../middleware/uploadMiddleware.js')).default;

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
router.post(
  '/upload-profile-photo',
  verifyToken,
  (req, res, next) => {
    uploadMiddleware.single('image')(req, res, (err) => {
      if (err) {
        console.error('Multer upload error:', err);
        return res.status(400).json({
          success: false,
          message: err.message || 'File upload error',
        });
      }
      next();
    });
  },
  uploadProfilePhoto
);

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

// GET /api/users/:id/reviews - Get reviews received by a user (as reviewee)
// Query parameter: role - 'owner' or 'helper' to filter reviews by role
router.get('/:id/reviews', async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.query; // 'owner' or 'helper'
    
    // Find reviews where the user is the reviewee (received reviews, not given reviews)
    let reviews = await Review.find({ reviewee: id })
      .populate('reviewer', 'name profilePhoto')
      .populate({
        path: 'task',
        select: 'title postedBy assignedTo',
        populate: [
          { path: 'postedBy', select: '_id' },
          { path: 'assignedTo', select: '_id' }
        ]
      })
      .sort({ createdAt: -1 });

    // Filter by role if specified
    if (role === 'helper') {
      // For helper: only show reviews where user is the assigned helper (owner reviewed helper)
      // This means: review.reviewee === id AND task.assignedTo === id
      // The reviewee is already filtered by the query above, so we just need to check task.assignedTo
      reviews = reviews.filter(review => {
        const task = review.task;
        if (!task || !task.assignedTo) return false;
        const assignedToId = task.assignedTo._id ? task.assignedTo._id.toString() : task.assignedTo.toString();
        // Only show reviews where the user was the helper in the task
        return assignedToId === id;
      });
    } else if (role === 'owner') {
      // For owner: only show reviews where user is the task owner (helper reviewed owner)
      // This means: review.reviewee === id AND task.postedBy === id
      // The reviewee is already filtered by the query above, so we just need to check task.postedBy
      reviews = reviews.filter(review => {
        const task = review.task;
        if (!task || !task.postedBy) return false;
        const postedById = task.postedBy._id ? task.postedBy._id.toString() : task.postedBy.toString();
        // Only show reviews where the user was the owner in the task
        return postedById === id;
      });
    }

    // Clean up task data for response (only send title, not full task object)
    const cleanedReviews = reviews.map(review => ({
      ...review.toObject(),
      task: {
        _id: review.task._id,
        title: review.task.title,
      },
    }));

    res.json({
      success: true,
      data: cleanedReviews,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching reviews',
      error: error.message,
    });
  }
});

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