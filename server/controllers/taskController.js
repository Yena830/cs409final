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
      .populate('pet', 'name type breed age gender height weight notes photos')
      .populate('postedBy', 'name profilePhoto ownerRating')
      .populate('assignedTo', 'name profilePhoto helperRating')
      .populate('applicants', 'name profilePhoto helperRating location specialties bio expectedHourlyRate');

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
      .populate('pet', 'name type breed age gender height weight notes photos')
      .populate('postedBy', 'name profilePhoto ownerRating')
      .populate('assignedTo', 'name profilePhoto helperRating')
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
      .populate('pet', 'name type breed age gender height weight notes photos')
      .populate('postedBy', 'name profilePhoto ownerRating')
      .populate('assignedTo', 'name profilePhoto helperRating')
      .populate('applicants', 'name profilePhoto helperRating location specialties bio expectedHourlyRate');

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

    // Check if task is open or pending (both allow applications)
    if (task.status !== 'open' && task.status !== 'pending') {
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

    // Check if this is the first applicant (before adding)
    const isFirstApplicant = task.applicants.length === 0;
    const currentStatus = task.status;
    
    // Add user to applicants
    task.applicants.push(userId);
    
    // If this is the first applicant and task is still 'open', change status to 'pending'
    if (isFirstApplicant && task.status === 'open') {
      task.status = 'pending';
      console.log(`Task ${id} status changed from 'open' to 'pending' (first applicant)`);
    }
    
    await task.save();
    
    // Verify the status was saved correctly
    const savedTask = await Task.findById(id);
    console.log(`Task ${id} status after save: ${savedTask.status}, applicants count: ${savedTask.applicants.length}`);

    // Add task to user's tasksApplied array
    await User.findByIdAndUpdate(userId, {
      $push: { tasksApplied: task._id },
    });

    // Populate and return updated task
    const updatedTask = await Task.findById(id)
      .populate('pet', 'name type breed age gender height weight notes photos')
      .populate('postedBy', 'name profilePhoto ownerRating')
      .populate('assignedTo', 'name profilePhoto helperRating')
      .populate('applicants', 'name profilePhoto helperRating location specialties bio expectedHourlyRate');

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
      .populate('pet', 'name type breed age gender height weight notes photos')
      .populate('postedBy', 'name profilePhoto ownerRating')
      .populate('assignedTo', 'name profilePhoto helperRating')
      .populate('applicants', 'name profilePhoto helperRating location specialties bio expectedHourlyRate');

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

// Complete task (helper only) - marks task as pending_confirmation
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

    // Check if user is the assigned helper
    if (!task.assignedTo || task.assignedTo.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the assigned helper can mark a task as complete',
      });
    }

    // Check if task is in progress
    if (task.status !== 'in_progress') {
      return res.status(400).json({
        success: false,
        message: 'Task must be in progress to be marked as complete',
      });
    }

    // Update status to pending_confirmation
    task.status = 'pending_confirmation';
    await task.save();

    // Populate and return updated task
    const updatedTask = await Task.findById(id)
      .populate('pet', 'name type breed age gender height weight notes photos')
      .populate('postedBy', 'name profilePhoto rating')
      .populate('assignedTo', 'name profilePhoto rating')
      .populate('applicants', 'name profilePhoto helperRating location specialties bio expectedHourlyRate');

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

// Confirm task completion (owner only) - marks task as completed
export const confirmTask = async (req, res) => {
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
        message: 'Only the task owner can confirm task completion',
      });
    }

    // Check if task is pending_confirmation
    if (task.status !== 'pending_confirmation') {
      return res.status(400).json({
        success: false,
        message: 'Task must be pending confirmation to be confirmed',
      });
    }

    // Update status to completed
    task.status = 'completed';
    await task.save();

    // Populate and return updated task
    const updatedTask = await Task.findById(id)
      .populate('pet', 'name type breed age gender height weight notes photos')
      .populate('postedBy', 'name profilePhoto ownerRating')
      .populate('assignedTo', 'name profilePhoto helperRating')
      .populate('applicants', 'name profilePhoto helperRating location specialties bio expectedHourlyRate');

    res.json({
      success: true,
      data: updatedTask,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error confirming task',
    });
  }
};

// Cancel task (owner or assigned helper) or withdraw application (applicant only)
export const cancelTask = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    const userIdStr = userId.toString();
    const postedById = task.postedBy?.toString();
    const assignedToId = task.assignedTo?._id
      ? task.assignedTo._id.toString()
      : task.assignedTo?.toString();
    const applicantsIds = Array.isArray(task.applicants)
      ? task.applicants.map(a => (a?._id ? a._id.toString() : a?.toString()))
      : [];

    const isOwner = postedById === userIdStr;
    const isAssignedHelper = assignedToId === userIdStr;
    const isApplicant = applicantsIds.includes(userIdStr);

    console.log('cancelTask auth check:', {
      taskId: id,
      status: task.status,
      userId: userIdStr,
      postedById,
      assignedToId,
      applicantsIds,
      isOwner,
      isAssignedHelper,
      isApplicant,
    });

    // Only the task owner, assigned helper, or an applicant can cancel
    if (!isOwner && !isAssignedHelper && !isApplicant) {
      return res.status(403).json({
        success: false,
        message: 'Only the task owner or participating helper can cancel this task',
      });
    }

    // If user is only an applicant (not owner or assigned helper), withdraw application instead
    if (isApplicant && !isOwner && !isAssignedHelper) {
      // Prevent withdrawing from completed or cancelled tasks
      if (task.status === 'completed' || task.status === 'cancelled') {
        return res.status(400).json({
          success: false,
          message: 'Cannot withdraw application from this task',
        });
      }

      // Remove user from applicants list
      task.applicants = task.applicants.filter(
        applicantId => applicantId.toString() !== userIdStr
      );

      // If no applicants left and task is pending, change status back to open
      if (task.applicants.length === 0 && task.status === 'pending') {
        task.status = 'open';
        console.log(`Task ${id} status changed from 'pending' to 'open' (no applicants left)`);
      }

      await task.save();

      // Remove task from user's tasksApplied array
      await User.findByIdAndUpdate(userId, {
        $pull: { tasksApplied: task._id },
      });

      const updatedTask = await Task.findById(id)
        .populate('pet', 'name type breed age gender height weight notes photos')
        .populate('postedBy', 'name profilePhoto ownerRating')
        .populate('assignedTo', 'name profilePhoto helperRating')
        .populate('applicants', 'name profilePhoto helperRating location specialties bio');

      return res.json({
        success: true,
        data: updatedTask,
        message: 'Application withdrawn successfully',
      });
    }

    // For owner or assigned helper: cancel the entire task
    // Prevent cancelling completed tasks
    if (task.status === 'completed' || task.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'This task cannot be cancelled',
      });
    }

    task.status = 'cancelled';
    await task.save();

    const updatedTask = await Task.findById(id)
      .populate('pet', 'name type breed age gender height weight notes photos')
      .populate('postedBy', 'name profilePhoto ownerRating')
      .populate('assignedTo', 'name profilePhoto helperRating')
      .populate('applicants', 'name profilePhoto helperRating location specialties bio');

    res.json({
      success: true,
      data: updatedTask,
      message: 'Task cancelled successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error cancelling task',
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

    // Update reviewee's average rating based on role
    // Get all tasks where the reviewee was involved (as owner or helper)
    const revieweeTasks = await Task.find({
      $or: [
        { postedBy: revieweeId },
        { assignedTo: revieweeId }
      ]
    }).select('_id postedBy assignedTo');
    
    // Determine which rating field to update based on the role in this task
    // isReviewingHelper is already defined above, so we reuse it
    const updateField = isReviewingHelper ? 'helperRating' : 'ownerRating';
    
    // Get all reviews where reviewee was reviewed in the same role
    const taskIdsForRole = revieweeTasks
      .filter(t => {
        if (isReviewingHelper) {
          // For helper rating: only count tasks where user was the helper
          return t.assignedTo && t.assignedTo.toString() === revieweeId.toString();
        } else {
          // For owner rating: only count tasks where user was the owner
          return t.postedBy && t.postedBy.toString() === revieweeId.toString();
        }
      })
      .map(t => t._id);
    
    // Find all reviews for this role
    const reviewsForRole = await Review.find({
      reviewee: revieweeId,
      task: { $in: taskIdsForRole }
    });
    
    console.log('Rating calculation debug:', {
      revieweeId: revieweeId.toString(),
      updateField,
      taskIdsForRole: taskIdsForRole.map(id => id.toString()),
      reviewsForRoleCount: reviewsForRole.length,
      reviewsForRole: reviewsForRole.map(r => ({
        id: r._id.toString(),
        rating: r.rating,
        task: r.task.toString(),
        reviewee: r.reviewee.toString()
      }))
    });
    
    // Always update rating, even if it's 0 (for new reviews)
    const averageRating = reviewsForRole.length > 0
      ? reviewsForRole.reduce((sum, r) => sum + r.rating, 0) / reviewsForRole.length
      : 0;
    
    const roundedRating = Math.round(averageRating * 10) / 10;
    
    console.log('Calculated rating:', {
      averageRating,
      roundedRating,
      updateField
    });
    
    // Update the appropriate rating field
    await User.findByIdAndUpdate(revieweeId, {
      $set: { [updateField]: roundedRating }, // Round to 1 decimal place
    });
    
    // Verify the update
    const updatedUser = await User.findById(revieweeId);
    console.log('Updated user rating:', {
      userId: revieweeId.toString(),
      helperRating: updatedUser.helperRating,
      ownerRating: updatedUser.ownerRating,
      updateField,
      newValue: updatedUser[updateField]
    });

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
