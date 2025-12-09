import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import path from 'path';
import User from './models/user.js';
import Pet from './models/pet.js';
import Task from './models/task.js';
import connectDB from './db.js';

dotenv.config({ path: path.resolve('./server/.env') });

const saltRounds = 10;

// Helper function to hash password
const hashPassword = async (password) => {
  return await bcrypt.hash(password, saltRounds);
};

// Helper function to get random item from array
const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Helper function to get random items from array
const randomItems = (arr, count) => {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

// Helper function to get random date in the future
const randomFutureDate = (daysFromNow = 30) => {
  const today = new Date();
  const randomDays = Math.floor(Math.random() * daysFromNow);
  const date = new Date(today);
  date.setDate(date.getDate() + randomDays);
  return date;
};

// Helper function to get random date in the past
const randomPastDate = (daysAgo = 30) => {
  const today = new Date();
  const randomDays = Math.floor(Math.random() * daysAgo);
  const date = new Date(today);
  date.setDate(date.getDate() - randomDays);
  return date;
};

const seed = async () => {
  try {
    await connectDB();

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await User.deleteMany({});
    await Pet.deleteMany({});
    await Task.deleteMany({});
    console.log('✅ Cleared existing data');

    // Create 5 owners
    console.log('👥 Creating owners...');
    const owners = [];
    const ownerData = [
      {
        name: 'Sarah Johnson',
        email: 'sarah.johnson@email.com',
        bio: 'Dog lover and pet parent. Looking for reliable help with my energetic pups!',
        profilePhoto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
        password: 'password123',
      },
      {
        name: 'Michael Chen',
        email: 'michael.chen@email.com',
        bio: 'Cat enthusiast and busy professional. Need help caring for my furry friends.',
        profilePhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
        password: 'password123',
      },
      {
        name: 'Emily Rodriguez',
        email: 'emily.rodriguez@email.com',
        bio: 'Animal lover with a passion for pet care. Always looking for trustworthy helpers.',
        profilePhoto: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
        password: 'password123',
      },
      {
        name: 'David Kim',
        email: 'david.kim@email.com',
        bio: 'Pet owner who values quality care and attention. My pets are family!',
        profilePhoto: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400',
        password: 'password123',
      },
      {
        name: 'Jessica Martinez',
        email: 'jessica.martinez@email.com',
        bio: 'Experienced pet parent seeking reliable and caring helpers for my pets.',
        profilePhoto: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400',
        password: 'password123',
      },
    ];

    for (const ownerInfo of ownerData) {
      const hashedPassword = await hashPassword(ownerInfo.password);
      const owner = await User.create({
        name: ownerInfo.name,
        email: ownerInfo.email,
        password: hashedPassword,
        roles: ['owner'],
        bio: ownerInfo.bio,
        profilePhoto: ownerInfo.profilePhoto,
      });
      owners.push(owner);
    }
    console.log(`✅ Created ${owners.length} owners`);

    // Create 5 helpers
    console.log('👥 Creating helpers...');
    const helpers = [];
    const helperData = [
      {
        name: 'Alex Thompson',
        email: 'alex.thompson@email.com',
        bio: 'Experienced pet care professional with 5+ years of experience. Love working with all types of animals!',
        profilePhoto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
        password: 'password123',
      },
      {
        name: 'Jordan Lee',
        email: 'jordan.lee@email.com',
        bio: 'Passionate about animal welfare. Available for walks, feeding, and pet sitting.',
        profilePhoto: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400',
        password: 'password123',
      },
      {
        name: 'Taylor Williams',
        email: 'taylor.williams@email.com',
        bio: 'Flexible schedule and love for pets. Specialized in dog walking and cat care.',
        profilePhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
        password: 'password123',
      },
      {
        name: 'Morgan Brown',
        email: 'morgan.brown@email.com',
        bio: 'Dedicated pet care provider with background in animal behavior. Available for various pet services.',
        profilePhoto: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400',
        password: 'password123',
      },
      {
        name: 'Casey Davis',
        email: 'casey.davis@email.com',
        bio: 'Reliable and caring pet helper. Experienced with both dogs and cats of all sizes.',
        profilePhoto: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400',
        password: 'password123',
      },
    ];

    for (const helperInfo of helperData) {
      const hashedPassword = await hashPassword(helperInfo.password);
      const helper = await User.create({
        name: helperInfo.name,
        email: helperInfo.email,
        password: hashedPassword,
        roles: ['helper'],
        bio: helperInfo.bio,
        profilePhoto: helperInfo.profilePhoto,
      });
      helpers.push(helper);
    }
    console.log(`✅ Created ${helpers.length} helpers`);

    // Create pets for each owner (2-3 pets per owner)
    console.log('🐾 Creating pets...');
    const allPets = [];
    const dogBreeds = ['Golden Retriever', 'Labrador', 'Beagle', 'German Shepherd', 'French Bulldog', 'Poodle', 'Bulldog', 'Rottweiler', 'Yorkshire Terrier', 'Dachshund'];
    const catBreeds = ['Persian', 'Maine Coon', 'Siamese', 'British Shorthair', 'Ragdoll', 'Bengal', 'American Shorthair', 'Scottish Fold', 'Sphynx', 'Abyssinian'];
    
    // Use reliable placeholder images - these are guaranteed to work
    const dogImages = [
      'https://images.unsplash.com/photo-1552053831-71594a27632d?w=600&h=600&fit=crop',
      'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=600&h=600&fit=crop',
      'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600&h=600&fit=crop',
      'https://images.unsplash.com/photo-1537151625747-68eb9b3c4c6c?w=600&h=600&fit=crop',
      'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=600&h=600&fit=crop',
      'https://images.unsplash.com/photo-1518717758536-85ae29035b6d?w=600&h=600&fit=crop',
      'https://images.unsplash.com/photo-1517849845537-4d257902454a?w=600&h=600&fit=crop',
      'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=600&h=600&fit=crop',
      'https://placehold.co/600x600/FFB84D/FFFFFF?text=Dog',
      'https://placehold.co/600x600/FFA07A/FFFFFF?text=Puppy',
    ];

    const catImages = [
      'https://images.unsplash.com/photo-1513360371669-4adf3dd7dff8?w=600&h=600&fit=crop',
      'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600&h=600&fit=crop',
      'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=600&h=600&fit=crop',
      'https://images.unsplash.com/photo-1596854307942-0b5b4f6b3a4b?w=600&h=600&fit=crop',
      'https://images.unsplash.com/photo-1570018144715-43110347808c?w=600&h=600&fit=crop',
      'https://images.unsplash.com/photo-1561948955-570b270e7c36?w=600&h=600&fit=crop',
      'https://images.unsplash.com/photo-1590736969955-71cc94901144?w=600&h=600&fit=crop',
      'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=600&h=600&fit=crop',
      'https://placehold.co/600x600/FFB6C1/FFFFFF?text=Cat',
      'https://placehold.co/600x600/DDA0DD/FFFFFF?text=Kitty',
    ];

    const petNames = {
      dogs: ['Buddy', 'Max', 'Charlie', 'Rocky', 'Cooper', 'Duke', 'Bear', 'Tucker', 'Jack', 'Oliver', 'Bella', 'Luna', 'Lucy', 'Daisy', 'Molly'],
      cats: ['Whiskers', 'Shadow', 'Simba', 'Mittens', 'Tiger', 'Smokey', 'Oreo', 'Ginger', 'Lily', 'Mia', 'Chloe', 'Sophie', 'Princess', 'Zoe', 'Nala'],
    };

    for (const owner of owners) {
      const petCount = Math.floor(Math.random() * 2) + 2; // 2-3 pets
      const hasDog = Math.random() > 0.3; // 70% chance of having at least one dog
      
      for (let i = 0; i < petCount; i++) {
        const isDog = hasDog && (i === 0 || Math.random() > 0.5);
        const type = isDog ? 'dog' : 'cat';
        const breed = isDog ? randomItem(dogBreeds) : randomItem(catBreeds);
        const name = randomItem(petNames[type === 'dog' ? 'dogs' : 'cats']);
        const photos = [isDog ? randomItem(dogImages) : randomItem(catImages)];
        
        const pet = await Pet.create({
          name,
          type,
          breed,
          height: type === 'dog' ? Math.floor(Math.random() * 12) + 8 : Math.floor(Math.random() * 6) + 6, // 8-20 inches for dogs, 6-12 for cats
          weight: type === 'dog' ? Math.floor(Math.random() * 60) + 15 : Math.floor(Math.random() * 10) + 5, // 15-75 lbs for dogs, 5-15 lbs for cats
          age: Math.floor(Math.random() * 15) + 1, // 1-15 years
          gender: randomItem(['male', 'female', 'other']),
          notes: randomItem(['Friendly and playful', 'Calm and gentle', 'Energetic and loves to play', 'Gentle and loving', 'Independent but affectionate', 'Curious and adventurous', 'Great with kids', 'Needs daily exercise']),
          photos,
          owner: owner._id,
        });
        
        allPets.push(pet);
        owner.pets.push(pet._id);
      }
      await owner.save();
    }
    console.log(`✅ Created ${allPets.length} pets`);

    // Create 20 tasks
    console.log('📋 Creating tasks...');
    const tasks = [];
    const taskTypes = ['walk', 'feed', 'boarding', 'sitting', 'grooming'];
    const taskTemplates = {
      walk: [
        { title: 'Daily Morning Dog Walk', desc: 'Need someone to take my dog for a 30-minute morning walk. My pup is energetic and loves to explore!' },
        { title: 'Afternoon Walk Session', desc: 'Looking for help with afternoon walks for my dog. Flexible on timing.' },
        { title: 'Evening Dog Walk', desc: 'Need evening walks around the neighborhood. Dog is friendly and well-behaved.' },
      ],
      feed: [
        { title: 'Daily Cat Feeding', desc: 'Need someone to feed my cat twice daily while I\'m away. Very simple and quick task.' },
        { title: 'Pet Feeding Service', desc: 'Looking for reliable helper to feed my pets according to schedule.' },
        { title: 'Cat Meal Service', desc: 'Need feeding assistance for my cat. Food is prepared, just need someone to serve.' },
      ],
      boarding: [
        { title: 'Weekend Pet Boarding', desc: 'Need overnight boarding for my pet while I travel. Looking for a safe and caring environment.' },
        { title: 'Pet Boarding Needed', desc: 'Seeking temporary boarding for my pet. Must be experienced with this breed.' },
      ],
      sitting: [
        { title: 'Pet Sitting Service', desc: 'Need someone to watch my pet at home while I\'m out of town. Low maintenance pet.' },
        { title: 'Home Pet Sitting', desc: 'Looking for in-home pet sitting. Pet is friendly and just needs company and care.' },
        { title: 'Weekend Pet Sitting', desc: 'Need weekend pet sitting. Pet is well-trained and easy to care for.' },
      ],
      grooming: [
        { title: 'Pet Grooming Service', desc: 'Need grooming service for my pet. Includes bath, nail trim, and brush.' },
        { title: 'Dog Grooming Needed', desc: 'Looking for professional grooming for my dog. Regular maintenance required.' },
      ],
    };
    
    const locations = [
      'Central Park, New York, NY',
      'Brooklyn Heights, NY',
      'Manhattan, NY',
      'Queens, NY',
      'Upper East Side, NY',
      'Lower Manhattan, NY',
      'Williamsburg, Brooklyn',
      'Astoria, Queens',
      'Park Slope, Brooklyn',
      'SoHo, Manhattan',
    ];

    const timeSlots = [
      'Morning (8-10am)',
      'Afternoon (12-2pm)',
      'Evening (6-8pm)',
      'Flexible',
      'Early Morning (6-8am)',
      'Late Afternoon (4-6pm)',
    ];

    const budgets = {
      walk: { min: 20, max: 35 },
      feed: { min: 15, max: 25 },
      boarding: { min: 50, max: 100 },
      sitting: { min: 40, max: 80 },
      grooming: { min: 30, max: 60 },
    };

    // Create tasks with various statuses
    const taskStatuses = ['open', 'open', 'open', 'in_progress', 'completed', 'completed']; // More open tasks
    
    for (let i = 0; i < 20; i++) {
      const owner = randomItem(owners);
      const ownerPets = allPets.filter(p => p.owner.toString() === owner._id.toString());
      if (ownerPets.length === 0) continue;
      
      const pet = randomItem(ownerPets);
      const taskType = randomItem(taskTypes);
      const template = randomItem(taskTemplates[taskType]);
      const location = randomItem(locations);
      const time = randomItem(timeSlots);
      const budgetRange = budgets[taskType];
      const budget = Math.floor(Math.random() * (budgetRange.max - budgetRange.min + 1)) + budgetRange.min;
      const reward = `$${budget}`;
      
      // Determine status
      let status = randomItem(taskStatuses);
      let assignedTo = null;
      let applicants = [];
      
      // For tasks with applicants or assigned
      if (status === 'in_progress' || status === 'completed' || Math.random() > 0.6) {
        const applicantCount = Math.floor(Math.random() * 4) + 1; // 1-4 applicants
        applicants = randomItems(helpers, Math.min(applicantCount, helpers.length));
        applicants = applicants.map(h => h._id);
        
        // Assign helper for in_progress and completed tasks
        if (status === 'in_progress' || status === 'completed') {
          assignedTo = applicants[0]; // First applicant gets assigned
        }
      }
      
      // Set dates based on status
      let taskDate;
      if (status === 'completed') {
        taskDate = randomPastDate(14); // Completed tasks are in the past
      } else if (status === 'in_progress') {
        taskDate = randomPastDate(7); // In progress tasks started recently
      } else {
        taskDate = randomFutureDate(30); // Open tasks are in the future
      }
      
      const task = await Task.create({
        title: template.title,
        description: template.desc,
        type: taskType,
        location,
        budget,
        reward,
        date: taskDate,
        time,
        dueDate: taskType === 'boarding' || taskType === 'sitting' ? new Date(taskDate.getTime() + 86400000 * 2) : null,
        postedBy: owner._id,
        pet: pet._id,
        status,
        applicants,
        assignedTo,
      });
      
      tasks.push(task);
      owner.tasksPosted.push(task._id);
      
      // Update helpers' tasksApplied
      for (const applicantId of applicants) {
        const helper = helpers.find(h => h._id.toString() === applicantId.toString());
        if (helper) {
          helper.tasksApplied.push(task._id);
        }
      }
      
      await owner.save();
    }
    
    // Save all helpers
    for (const helper of helpers) {
      await helper.save();
    }
    
    console.log(`✅ Created ${tasks.length} tasks`);

    console.log('\n🎉 Seeding completed successfully!');
    console.log(`   👥 Users: ${owners.length} owners, ${helpers.length} helpers`);
    console.log(`   🐾 Pets: ${allPets.length} pets`);
    console.log(`   📋 Tasks: ${tasks.length} tasks`);
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

seed();

