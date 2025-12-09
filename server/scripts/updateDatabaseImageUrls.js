#!/usr/bin/env node

/**
 * Update image URLs in database
 * Replace local URLs with Cloudinary URLs
 */

import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

// Load environment variables
dotenv.config({ path: path.resolve('./server/.env') });

// Import models
import Pet from '../models/pet.js';
import User from '../models/user.js';

async function updateDatabaseUrls() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Database connection successful');

    // Read mapping file
    const mappingFilePath = path.join(process.cwd(), 'uploads', 'cloudinary_mapping.json');
    
    if (!fs.existsSync(mappingFilePath)) {
      console.error('Mapping file does not exist, please run migrate:local-to-cloudinary script first');
      process.exit(1);
    }
    
    const mappingData = JSON.parse(fs.readFileSync(mappingFilePath, 'utf8'));
    console.log(`Loaded ${mappingData.length} mapping relationships`);

    // Create mapping object for quick lookup
    const urlMap = {};
    mappingData.forEach(item => {
      // Extract filename from local file path
      const fileName = path.basename(item.localPath);
      urlMap[fileName] = item.cloudinaryUrl;
    });

    // Update image URLs in Pet model
    console.log('\nStarting to update image URLs in Pet model...');
    const pets = await Pet.find({});
    let petUpdatedCount = 0;
    
    for (const pet of pets) {
      let updated = false;
      
      // Update cover photo
      if (pet.coverPhoto) {
        const fileName = pet.coverPhoto.split('/').pop();
        if (urlMap[fileName]) {
          pet.coverPhoto = urlMap[fileName];
          updated = true;
          console.log(`Updated cover photo for pet "${pet.name}": ${fileName} -> ${urlMap[fileName]}`);
        }
      }
      
      // Update album photos
      if (pet.photos && pet.photos.length > 0) {
        for (let i = 0; i < pet.photos.length; i++) {
          const fileName = pet.photos[i].split('/').pop();
          if (urlMap[fileName]) {
            pet.photos[i] = urlMap[fileName];
            updated = true;
            console.log(`Updated album photo for pet "${pet.name}": ${fileName} -> ${urlMap[fileName]}`);
          }
        }
      }
      
      if (updated) {
        await pet.save();
        petUpdatedCount++;
      }
    }
    
    console.log(`Pet model update completed, updated ${petUpdatedCount} documents`);

    // Update image URLs in User model
    console.log('\nStarting to update image URLs in User model...');
    const users = await User.find({});
    let userUpdatedCount = 0;
    
    for (const user of users) {
      let updated = false;
      
      // Update profile photo
      if (user.profilePhoto) {
        const fileName = user.profilePhoto.split('/').pop();
        if (urlMap[fileName]) {
          user.profilePhoto = urlMap[fileName];
          updated = true;
          console.log(`Updated profile photo for user "${user.username}": ${fileName} -> ${urlMap[fileName]}`);
        }
      }
      
      if (updated) {
        await user.save();
        userUpdatedCount++;
      }
    }
    
    console.log(`User model update completed, updated ${userUpdatedCount} documents`);

    console.log('\n=== Database URL update completed ===');
    console.log(`Total updates:`);
    console.log(`  Pet documents: ${petUpdatedCount}`);
    console.log(`  User documents: ${userUpdatedCount}`);
    
    // Close database connection
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
    
  } catch (error) {
    console.error('Error updating database URLs:', error);
    process.exit(1);
  }
}

// Execute update
updateDatabaseUrls();