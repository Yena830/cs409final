#!/usr/bin/env node

/**
 * Migrate locally uploaded files to Cloudinary and update URLs in database
 * This script will upload all image files from the uploads/ directory to Cloudinary,
 * and update the corresponding image URLs in the database
 */

import fs from 'fs';
import path from 'path';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

// Load environment variables
dotenv.config({ path: path.resolve('./server/.env') });

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Check Cloudinary configuration
if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.error('Error: Please configure Cloudinary environment variables in .env file');
  console.error('Required: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET');
  process.exit(1);
}

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('Error: Please configure MONGODB_URI in .env file');
  process.exit(1);
}

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✓ Successfully connected to MongoDB');
  } catch (error) {
    console.error('✗ Failed to connect to MongoDB:', error.message);
    process.exit(1);
  }
}

// Import models
let User, Pet;
async function importModels() {
  try {
    User = (await import('../models/user.js')).default;
    Pet = (await import('../models/pet.js')).default;
    console.log('✓ Successfully loaded data models');
  } catch (error) {
    console.error('✗ Failed to load data models:', error.message);
    process.exit(1);
  }
}

// Get upload directory path
const uploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');

// Supported image formats
const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.tiff'];

// Store file mapping relationships
const fileMapping = new Map();

async function migrateFiles() {
  try {
    // Check if upload directory exists
    if (!fs.existsSync(uploadDir)) {
      console.log(`Upload directory does not exist: ${uploadDir}`);
      return;
    }

    // Read all files in directory
    const files = fs.readdirSync(uploadDir);
    
    if (files.length === 0) {
      console.log('No files in upload directory');
      return;
    }

    console.log(`Found ${files.length} files, starting migration...`);
    
    let successCount = 0;
    let errorCount = 0;
    
    // Iterate through all files
    for (const file of files) {
      const filePath = path.join(uploadDir, file);
      const ext = path.extname(file).toLowerCase();
      
      // Only process image files
      if (imageExtensions.includes(ext)) {
        try {
          console.log(`Uploading: ${file}`);
          
          // Upload to Cloudinary
          const result = await cloudinary.uploader.upload(filePath, {
            folder: 'pawfectmatch_uploads',
            public_id: path.parse(file).name,
            overwrite: false, // Don't overwrite existing files
            invalidate: true, // Invalidate CDN cache
          });
          
          // Save mapping relationship
          const localUrl = `/uploads/${file}`;
          fileMapping.set(localUrl, result.secure_url);
          
          console.log(`✓ Successfully uploaded: ${file} -> ${result.secure_url}`);
          successCount++;
        } catch (error) {
          console.error(`✗ Upload failed: ${file}`, error.message);
          errorCount++;
        }
      } else {
        console.log(`Skipping non-image file: ${file}`);
      }
    }
    
    console.log(`\nFile migration completed!`);
    console.log(`Success: ${successCount} files`);
    console.log(`Failed: ${errorCount} files`);
    
    return successCount > 0;
    
  } catch (error) {
    console.error('Error during file migration:', error.message);
    return false;
  }
}

async function updateDatabaseUrls() {
  if (fileMapping.size === 0) {
    console.log('No files need database URL updates');
    return;
  }

  console.log(`\nStarting to update image URLs in database...`);
  
  let userUpdates = 0;
  let petUpdates = 0;
  
  try {
    // Update user profile photo URLs
    for (const [localUrl, cloudinaryUrl] of fileMapping.entries()) {
      // Find users containing local URL
      const users = await User.find({ profilePhoto: { $regex: localUrl } });
      
      for (const user of users) {
        const updatedUrl = user.profilePhoto.replace(localUrl, cloudinaryUrl);
        await User.findByIdAndUpdate(user._id, { profilePhoto: updatedUrl });
        console.log(`✓ Updated profile photo URL for user ${user.username}: ${localUrl} -> ${cloudinaryUrl}`);
        userUpdates++;
      }
      
      // Find pets containing local URL
      const pets = await Pet.find({ photos: { $regex: localUrl } });
      
      for (const pet of pets) {
        const updatedPhotos = pet.photos.map(photo => 
          photo.includes(localUrl) ? photo.replace(localUrl, cloudinaryUrl) : photo
        );
        await Pet.findByIdAndUpdate(pet._id, { photos: updatedPhotos });
        console.log(`✓ Updated photo URL for pet ${pet.name}: ${localUrl} -> ${cloudinaryUrl}`);
        petUpdates++;
      }
    }
    
    console.log(`\nDatabase URL update completed!`);
    console.log(`Updated ${userUpdates} user records`);
    console.log(`Updated ${petUpdates} pet records`);
    
  } catch (error) {
    console.error('Error during database URL update:', error.message);
  }
}

async function main() {
  console.log('Starting migration of locally uploaded files to Cloudinary and updating database URLs...\n');
  
  // Connect to database
  await connectDB();
  
  // Import models
  await importModels();
  
  // Migrate files
  const hasMigrated = await migrateFiles();
  
  if (hasMigrated) {
    // Update database URLs
    await updateDatabaseUrls();
  }
  
  // Close database connection
  await mongoose.connection.close();
  
  console.log('\nAll operations completed!');
}

// Execute main function
main().catch(error => {
  console.error('Error during execution:', error);
  process.exit(1);
});