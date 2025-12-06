/**
 * Script to recalculate ownerRating and helperRating for all users
 * Run with: node server/scripts/recalculateRatings.js
 */

import mongoose from 'mongoose';
import User from '../models/user.js';
import Review from '../models/review.js';
import Task from '../models/task.js';
import dotenv from 'dotenv';

dotenv.config();

const recalculateRatings = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pawfectmatch');
    console.log('Connected to MongoDB');

    // Get all users
    const users = await User.find();
    console.log(`Found ${users.length} users`);

    for (const user of users) {
      const userId = user._id;

      // Get all tasks where user was owner
      const ownerTasks = await Task.find({ postedBy: userId }).select('_id');
      const ownerTaskIds = ownerTasks.map(t => t._id);

      // Get all tasks where user was helper
      const helperTasks = await Task.find({ assignedTo: userId }).select('_id');
      const helperTaskIds = helperTasks.map(t => t._id);

      // Calculate ownerRating (reviews where user was the owner)
      const ownerReviews = await Review.find({
        reviewee: userId,
        task: { $in: ownerTaskIds }
      });

      let ownerRating = 0;
      if (ownerReviews.length > 0) {
        ownerRating = ownerReviews.reduce((sum, r) => sum + r.rating, 0) / ownerReviews.length;
        ownerRating = Math.round(ownerRating * 10) / 10;
      }

      // Calculate helperRating (reviews where user was the helper)
      const helperReviews = await Review.find({
        reviewee: userId,
        task: { $in: helperTaskIds }
      });

      let helperRating = 0;
      if (helperReviews.length > 0) {
        helperRating = helperReviews.reduce((sum, r) => sum + r.rating, 0) / helperReviews.length;
        helperRating = Math.round(helperRating * 10) / 10;
      }

      // Update user
      await User.findByIdAndUpdate(userId, {
        $set: {
          ownerRating,
          helperRating
        }
      });

      console.log(`Updated ${user.name}: ownerRating=${ownerRating}, helperRating=${helperRating}`);
    }

    console.log('Rating recalculation completed!');
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error recalculating ratings:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

recalculateRatings();

