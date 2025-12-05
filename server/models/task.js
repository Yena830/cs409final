import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema(
  {
    // Basic task information
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: false,
      trim: true,
    },
    type: {
      type: String,
      enum: ['walk', 'feed', 'boarding', 'sitting', 'grooming'],
      required: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    
    // Financial
    budget: {
      type: Number,
      min: 0,
      required: true,
    },
    reward: {
      type: String,
      trim: true,
      // Display format like "$25" (can be computed from budget)
    },
    
    // Scheduling
    date: {
      type: Date,
      required: true,
    },
    time: {
      type: String,
      trim: true,
      // Format like "8-10am" or "Morning (8-10am)"
    },
    dueDate: {
      type: Date,
      // Can be computed from date + time
    },
    
    // Media
    image: {
      type: String,
      trim: true,
      // Task image/photo
    },
    
    // Relationships
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    pet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Pet',
      required: true,
    },
    
    // Status and management
    status: {
      type: String,
      enum: ['open', 'in_progress', 'completed', 'cancelled'],
      default: 'open',
    },
    applicants: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
  },
  {
    timestamps: true,
  }
);

const Task = mongoose.model('Task', taskSchema);

export default Task;


