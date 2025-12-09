import Pet from '../models/pet.js';
import User from '../models/user.js';

const useCloudinary = !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
const uploadMiddleware = useCloudinary 
  ? (await import('../middleware/cloudinaryUploadMiddleware.js')).default
  : (await import('../middleware/uploadMiddleware.js')).default;

// Create a new pet
export const createPet = async (req, res) => {
  try {
    const { name, type, breed, age, gender, height, weight, notes, photos } = req.body;

    // Validate required fields
    if (!name || !type) {
      return res.status(400).json({
        success: false,
        message: 'Name and type are required',
      });
    }

    // Create pet with owner from authenticated user
    const pet = await Pet.create({
      name,
      type,
      breed,
      age,
      gender,
      height,
      weight,
      notes,
      photos: photos || [],
      owner: req.user.id,
    });

    // Add pet to user's pets array
    await User.findByIdAndUpdate(req.user.id, {
      $push: { pets: pet._id },
    });

    res.status(201).json({
      success: true,
      data: pet,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating pet',
    });
  }
};

// Get all pets owned by the authenticated user
export const getMyPets = async (req, res) => {
  try {
    const pets = await Pet.find({ owner: req.user.id }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: pets,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching pets',
    });
  }
};

// Update a pet
export const updatePet = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Find the pet
    const pet = await Pet.findById(id);
    if (!pet) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found',
      });
    }

    // Check if user owns the pet
    if (pet.owner.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not allowed',
      });
    }

    // Update the pet
    const updatedPet = await Pet.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      data: updatedPet,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating pet',
    });
  }
};

// Delete a pet
export const deletePet = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the pet
    const pet = await Pet.findById(id);
    if (!pet) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found',
      });
    }

    // Check if user owns the pet
    if (pet.owner.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not allowed',
      });
    }

    // Remove pet ID from user's pets array
    await User.findByIdAndUpdate(req.user.id, {
      $pull: { pets: pet._id },
    });

    // Delete the pet
    await Pet.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Pet deleted successfully',
      data: { id },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting pet',
    });
  }
};

/**
 * Upload pet photo
 * Route: POST /api/pets/upload-photo
 */
export const uploadPetPhoto = async (req, res) => {
  try {
    console.log('Upload pet photo - Request received');
    console.log('Upload pet photo - File:', req.file);
    console.log('Upload pet photo - Files:', req.files);
    console.log('Upload pet photo - Body:', req.body);
    
    // Check if file was uploaded
    if (!req.file) {
      console.log('Upload pet photo - No file in request');
      return res.status(400).json({
        success: false,
        message: 'No file uploaded. Please select an image file.',
      });
    }

    // 根据存储类型构造图片URL
    let photoUrl;
    if (useCloudinary && req.file.path) {
      // Cloudinary直接返回path
      photoUrl = req.file.path;
    } else if (!useCloudinary && req.file.filename) {
      // 本地存储需要构造URL
      const protocol = req.protocol || 'http';
      const host = req.get('host') || 'localhost:3001';
      photoUrl = `${protocol}://${host}/uploads/${req.file.filename}`;
    } else {
      // Fallback
      photoUrl = req.file.path || req.file.filename;
    }

    console.log('Upload pet photo - Success, URL:', photoUrl);

    res.json({
      success: true,
      data: { photoUrl },
      message: 'Pet photo uploaded successfully',
    });
  } catch (error) {
    console.error('Error uploading pet photo:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error uploading pet photo',
    });
  }
};

