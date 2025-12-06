import Task from '../models/task.js';
import User from '../models/user.js';
import Pet from '../models/pet.js';
import Review from '../models/review.js';

// Create a new task
export const createTask = async (req, res) => {
  try {
    const { title, description, type, location, budget, reward, date, time, dueDate, image, pet } = req.body;

    // Validate required fields
    if (!title || !type || !location || !pet) {
      return res.status(400).json({
        success: false,
        message: 'Title, type (category), location, and pet are required',
      });
    }

    // Validate that reward/budget exists
    if (!budget && !reward) {
      return res.status(400).json({
        success: false,
        message: 'Either budget or reward is required',
      });
    }

    // Verify pet exists and belongs to the user
    const petDoc = await Pet.findById(pet);
    if (!petDoc) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found',
      });
    }

    // Check if pet belongs to the task owner
    if (petDoc.owner.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only create tasks for your own pets',
      });
    }

    // Create task
    const task = await Task.create({
      title,
      description: description !== undefined && description !== null ? description : '',
      type,
      location,
      budget: budget || 0,
      reward: reward || (budget ? `$${budget}` : ''),
      date: date ? new Date(date) : new Date(),
      time: time || '',
      dueDate: dueDate ? new Date(dueDate) : null,
      image: image || '',
      postedBy: req.user.id,
      pet,
      status: 'open',
      applicants: [],
      assignedTo: null,
    });

    // Add task to user's tasksPosted array
    await User.findByIdAndUpdate(req.user.id, {
      $push: { tasksPosted: task._id },
    });

    // Populate and return
    const populatedTask = await Task.findById(task._id)
      .populate('pet', 'name type photos')
      .populate('postedBy', 'name profilePhoto rating')
      .populate('assignedTo', 'name profilePhoto rating')
      .populate('applicants', 'name profilePhoto');

    res.status(201).json({
      success: true,
      data: populatedTask,
    });
  } catch (error) {
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: errors.join(', '),
      });
    }
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating task',
    });
  }
};

// Get all tasks
export const getAllTasks = async (req, res) => {
  try {
    const tasks = await Task.find()
      .populate('pet', 'name type photos')
      .populate('postedBy', 'name profilePhoto rating')
      .populate('assignedTo', 'name profilePhoto rating')
      .populate('applicants', 'name profilePhoto')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: tasks,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching tasks',
    });
  }
};

// Get task by ID
export const getTaskById = async (req, res) => {
  try {
    const { id } = req.params;

    const task = await Task.findById(id)
      .populate('pet', 'name type photos')
      .populate('postedBy', 'name profilePhoto rating')
      .populate('assignedTo', 'name profilePhoto rating')
      .populate('applicants', 'name profilePhoto');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    res.json({
      success: true,
      data: task,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching task',
    });
  }
};

// Apply to task (helper only)
export const applyToTask = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Find the task
    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    // Check if task is open
    if (task.status !== 'open') {
      return res.status(400).json({
        success: false,
        message: 'Task is not open for applications',
      });
    }

    // Check if user already applied
    const hasApplied = task.applicants.some(
      applicantId => applicantId.toString() === userId.toString()
    );
    if (hasApplied) {
      return res.status(400).json({
        success: false,
        message: 'You have already applied to this task',
      });
    }

    // Check if user is trying to apply to their own task
    if (task.postedBy.toString() === userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You cannot apply to your own task',
      });
    }

    // Add user to applicants
    task.applicants.push(userId);
    await task.save();

    // Add task to user's tasksApplied array
    await User.findByIdAndUpdate(userId, {
      $push: { tasksApplied: task._id },
    });

    // Populate and return updated task
    const updatedTask = await Task.findById(id)
      .populate('pet', 'name type photos')
      .populate('postedBy', 'name profilePhoto rating')
      .populate('assignedTo', 'name profilePhoto rating')
      .populate('applicants', 'name profilePhoto');

    res.json({
      success: true,
      data: updatedTask,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error applying to task',
    });
  }
};

// Assign helper to task (owner only)
export const assignHelper = async (req, res) => {
  try {
    const { id } = req.params;
    const { helperId } = req.body;
    const userId = req.user.id;

    if (!helperId) {
      return res.status(400).json({
        success: false,
        message: 'helperId is required',
      });
    }

    // Find the task
    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    // Check if user is the task owner
    if (task.postedBy.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the task owner can assign a helper',
      });
    }

    // Check if helperId is in applicants
    const isApplicant = task.applicants.some(
      applicantId => applicantId.toString() === helperId.toString()
    );
    if (!isApplicant) {
      return res.status(400).json({
        success: false,
        message: 'Helper must have applied to the task first',
      });
    }

    // Assign helper and update status
    task.assignedTo = helperId;
    task.status = 'in_progress';
    await task.save();

    // Populate and return updated task
    const updatedTask = await Task.findById(id)
      .populate('pet', 'name type photos')
      .populate('postedBy', 'name profilePhoto rating')
      .populate('assignedTo', 'name profilePhoto rating')
      .populate('applicants', 'name profilePhoto');

    res.json({
      success: true,
      data: updatedTask,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error assigning helper',
    });
  }
};

// Complete task (owner only)
export const completeTask = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Find the task
    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    // Check if user is the task owner
    if (task.postedBy.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the task owner can complete a task',
      });
    }

    // Check if task is in progress
    if (task.status !== 'in_progress') {
      return res.status(400).json({
        success: false,
        message: 'Task must be in progress to be completed',
      });
    }

    // Update status to completed
    task.status = 'completed';
    await task.save();

    // Populate and return updated task
    const updatedTask = await Task.findById(id)
      .populate('pet', 'name type photos')
      .populate('postedBy', 'name profilePhoto rating')
      .populate('assignedTo', 'name profilePhoto rating')
      .populate('applicants', 'name profilePhoto');

    res.json({
      success: true,
      data: updatedTask,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error completing task',
    });
  }
};

// Submit review for a completed task
export const submitReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment, revieweeId } = req.body;
    const reviewerId = req.user.id;

    // Validate required fields
    if (!rating || !revieweeId) {
      return res.status(400).json({
        success: false,
        message: 'Rating and revieweeId are required',
      });
    }

    // Validate rating range
    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5',
      });
    }

    // Find the task
    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    // Check if task is completed
    if (task.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Can only review completed tasks',
      });
    }

    // Check if user is either the task owner or the assigned helper
    const isOwner = task.postedBy.toString() === reviewerId.toString();
    const isHelper = task.assignedTo && task.assignedTo.toString() === reviewerId.toString();

    if (!isOwner && !isHelper) {
      return res.status(403).json({
        success: false,
        message: 'Only the task owner or assigned helper can submit reviews',
      });
    }

    // Check if reviewee is valid (owner reviews helper, helper reviews owner)
    const isReviewingHelper = isOwner && task.assignedTo && task.assignedTo.toString() === revieweeId.toString();
    const isReviewingOwner = isHelper && task.postedBy.toString() === revieweeId.toString();

    if (!isReviewingHelper && !isReviewingOwner) {
      return res.status(400).json({
        success: false,
        message: 'Invalid reviewee. Owner can only review helper, and helper can only review owner',
      });
    }

    // Check if review already exists
    const existingReview = await Review.findOne({
      reviewer: reviewerId,
      reviewee: revieweeId,
      task: id,
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted a review for this task',
      });
    }

    // Create review
    const review = await Review.create({
      reviewer: reviewerId,
      reviewee: revieweeId,
      task: id,
      rating,
      comment: comment || '',
    });

    // Update reviewee's average rating
    const reviews = await Review.find({ reviewee: revieweeId });
    if (reviews.length > 0) {
      const averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
      // Update user's rating (if rating field exists in user model)
      await User.findByIdAndUpdate(revieweeId, {
        $set: { rating: Math.round(averageRating * 10) / 10 }, // Round to 1 decimal place
      });
    }

    // Populate and return review
    const populatedReview = await Review.findById(review._id)
      .populate('reviewer', 'name profilePhoto')
      .populate('reviewee', 'name profilePhoto')
      .populate('task', 'title');

    res.json({
      success: true,
      data: populatedReview,
    });
  } catch (error) {
    if (error.code === 11000) {
      // Duplicate key error
      return res.status(400).json({
        success: false,
        message: 'You have already submitted a review for this task',
      });
    }
    res.status(500).json({
      success: false,
      message: error.message || 'Error submitting review',
    });
  }
};

