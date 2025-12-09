import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import Message from '../models/message.js';
import User from '../models/user.js';

// Load environment variables
dotenv.config({ path: path.resolve('./server/.env') });

const MONGODB_URI = process.env.MONGODB_URI;

const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI || 'mongodb://localhost:27017/pawfectmatch');
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

const checkMessagesDetailed = async () => {
  await connectDB();
  
  try {
    // Find users by email
    const user1 = await User.findOne({ email: 'wyh0257@outlook.com' });
    const user2 = await User.findOne({ email: '1111@test.com' });
    
    if (!user1 || !user2) {
      console.log('❌ One or both users not found');
      process.exit(1);
    }
    
    console.log('User 1:', user1.name, user1.email, user1._id);
    console.log('User 2:', user2.name, user2.email, user2._id);
    
    // Find all messages between these two users (in both directions), including deleted ones
    const allMessages = await Message.find({
      $or: [
        { sender: user1._id, recipient: user2._id },
        { sender: user2._id, recipient: user1._id }
      ]
    }).sort({ timestamp: 1 })
      .populate('sender', 'name email')
      .populate('recipient', 'name email');
    
    console.log(`\n📊 Total messages in database: ${allMessages.length}\n`);
    
    // Check messages visible to each user (not deleted by that user)
    const user1VisibleMessages = allMessages.filter(msg => 
      !msg.deletedBy || !msg.deletedBy.includes(user1._id)
    );
    
    const user2VisibleMessages = allMessages.filter(msg => 
      !msg.deletedBy || !msg.deletedBy.includes(user2._id)
    );
    
    console.log(`👀 Messages visible to ${user1.name}: ${user1VisibleMessages.length}`);
    console.log(`👀 Messages visible to ${user2.name}: ${user2VisibleMessages.length}\n`);
    
    // Show all messages with detailed deletion info
    allMessages.forEach((msg, index) => {
      console.log(`--- Message ${index + 1} ---`);
      console.log(`ID: ${msg._id}`);
      console.log(`From: ${msg.sender.name} (${msg.sender.email})`);
      console.log(`To: ${msg.recipient.name} (${msg.recipient.email})`);
      console.log(`Content: ${msg.content}`);
      console.log(`Timestamp: ${msg.timestamp}`);
      console.log(`Read: ${msg.read}`);
      
      // Check deletion status
      if (msg.deletedBy && msg.deletedBy.length > 0) {
        const deletedByNames = msg.deletedBy.map(id => {
          if (id.equals(user1._id)) return user1.name;
          if (id.equals(user2._id)) return user2.name;
          return id.toString();
        });
        console.log(`❌ Deleted by: ${deletedByNames.join(', ')}`);
      } else {
        console.log(`✅ Not deleted`);
      }
      
      // Check visibility for each user
      const visibleToUser1 = !msg.deletedBy || !msg.deletedBy.includes(user1._id);
      const visibleToUser2 = !msg.deletedBy || !msg.deletedBy.includes(user2._id);
      
      console.log(`👁️  Visible to ${user1.name}: ${visibleToUser1 ? 'Yes' : 'No'}`);
      console.log(`👁️  Visible to ${user2.name}: ${visibleToUser2 ? 'Yes' : 'No'}`);
      console.log('');
    });
    
    // Check for patterns in disappearing messages
    console.log('🔍 Checking for potential causes of disappearing messages...\n');
    
    // Check if any messages were sent but not received (possible WebSocket issues)
    const recentMessages = allMessages.slice(-5); // Last 5 messages
    console.log('🕒 Recent messages (last 5):');
    recentMessages.forEach((msg, index) => {
      console.log(`  ${index + 1}. "${msg.content}" - Sent at ${msg.timestamp}`);
    });
    
    mongoose.connection.close();
  } catch (error) {
    console.error('Error checking messages:', error);
    mongoose.connection.close();
  }
};

checkMessagesDetailed();