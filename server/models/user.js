import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      unique: true,
      required: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    roles: {
      type: [String],
      default: ['owner'],
    },
    bio: {
      type: String,
      default: '',
    },
    profilePhoto: {
      type: String,
      default: '',
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    ownerRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    helperRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    pets: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Pet',
    }],
    tasksPosted: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
    }],
    tasksApplied: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
    }],
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model('User', userSchema);

export default User;


