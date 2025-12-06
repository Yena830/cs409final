import express from 'express';
import { createPet, getMyPets, updatePet, deletePet, uploadPetPhoto } from '../controllers/petController.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// POST /api/pets/upload-photo - Upload pet photo
// IMPORTANT: This route must be defined BEFORE /:id routes to avoid route conflicts
router.post('/upload-photo', (req, res, next) => {
  console.log('=== Upload route hit ===');
  console.log('Method:', req.method);
  console.log('Path:', req.path);
  console.log('URL:', req.url);
  console.log('Headers:', req.headers);
  
  upload.single('image')(req, res, (err) => {
    if (err) {
      console.error('Multer upload error:', err);
      return res.status(400).json({
        success: false,
        message: err.message || 'File upload error',
      });
    }
    console.log('Multer processed successfully, file:', req.file);
    next();
  });
}, uploadPetPhoto);

// POST /api/pets - Create a new pet
router.post('/', createPet);

// GET /api/pets/my - Get all pets owned by the authenticated user
router.get('/my', getMyPets);

// PUT /api/pets/:id - Update a pet
router.put('/:id', updatePet);

// DELETE /api/pets/:id - Delete a pet
router.delete('/:id', deletePet);

export default router;

