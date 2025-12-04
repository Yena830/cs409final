import express from 'express';
import { createPet, getMyPets, updatePet, deletePet } from '../controllers/petController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// POST /api/pets - Create a new pet
router.post('/', createPet);

// GET /api/pets/my - Get all pets owned by the authenticated user
router.get('/my', getMyPets);

// PUT /api/pets/:id - Update a pet
router.put('/:id', updatePet);

// DELETE /api/pets/:id - Delete a pet
router.delete('/:id', deletePet);

export default router;

