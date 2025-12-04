import express from 'express';
import Task from '../models/task.js';

const router = express.Router();

// GET /api/tasks - Get all tasks
router.get('/', async (req, res) => {
  try {
    const tasks = await Task.find()
      .populate('postedBy', 'name email')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 });
    res.json({ message: 'OK', data: tasks });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching tasks', error: error.message });
  }
});

// GET /api/tasks/:id - Get a single task by ID
router.get('/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('postedBy', 'name email')
      .populate('assignedTo', 'name email');
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.json({ message: 'OK', data: task });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching task', error: error.message });
  }
});

// POST /api/tasks - Create a new task
router.post('/', async (req, res) => {
  try {
    const task = new Task(req.body);
    const savedTask = await task.save();
    const populatedTask = await Task.findById(savedTask._id)
      .populate('postedBy', 'name email')
      .populate('assignedTo', 'name email');
    res.status(201).json({ message: 'OK', data: populatedTask });
  } catch (error) {
    res.status(400).json({ message: 'Error creating task', error: error.message });
  }
});

// PUT /api/tasks/:id - Update a task by ID
router.put('/:id', async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate('postedBy', 'name email')
      .populate('assignedTo', 'name email');
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.json({ message: 'OK', data: task });
  } catch (error) {
    res.status(400).json({ message: 'Error updating task', error: error.message });
  }
});

// DELETE /api/tasks/:id - Delete a task by ID
router.delete('/:id', async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.json({ message: 'OK', data: { id: req.params.id, deleted: true } });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting task', error: error.message });
  }
});

export default router;

