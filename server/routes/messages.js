import express from 'express';
import Message from '../models/message.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import { getIO } from '../server.js'; // Import socket.io instance

const router = express.Router();


router.get('/conversation/:userId', verifyToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;
    
    const messages = await Message.find({
      $and: [
        {
          $or: [
            { sender: currentUserId, recipient: userId },
            { sender: userId, recipient: currentUserId }
          ]
        },
        { deletedBy: { $ne: currentUserId } }
      ]
    }).sort({ timestamp: 1 })
      .populate('sender', 'name profilePhoto')
      .populate('recipient', 'name profilePhoto');
    
    res.json({ success: true, data: messages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/conversations', verifyToken, async (req, res) => {
  try {
    const currentUserId = req.user.id;
    

    const sentMessages = await Message.find({ 
      sender: currentUserId,
      recipient: { $ne: currentUserId },
      deletedBy: { $ne: currentUserId } 
    }).distinct('recipient');
      
    const receivedMessages = await Message.find({ 
      recipient: currentUserId,
      deletedBy: { $ne: currentUserId }
    }).distinct('sender');
    
    const participantIds = [...new Set([...sentMessages, ...receivedMessages])];
    
    const conversations = [];
    
    for (const participantId of participantIds) {
      const latestMessage = await Message.findOne({
        $and: [
          {
            $or: [
              { sender: currentUserId, recipient: participantId },
              { sender: participantId, recipient: currentUserId }
            ]
          },
          { deletedBy: { $ne: currentUserId } }
        ]
      }).sort({ timestamp: -1 })
        .populate('sender', 'name profilePhoto')
        .populate('recipient', 'name profilePhoto');
      
      if (latestMessage) {
        const unreadCount = await Message.countDocuments({
          sender: participantId,
          recipient: currentUserId,
          read: false,
          deletedBy: { $ne: currentUserId }
        });
        
        conversations.push({
          participantId,
          lastMessage: latestMessage.content,
          timestamp: latestMessage.timestamp,
          hasUnread: unreadCount > 0
        });
      }
    }
    
    res.json({ success: true, data: conversations });
  } catch (error) {
    console.error('Error getting conversation list:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});


router.delete('/conversation/:userId', verifyToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;
    
    const result = await Message.updateMany(
      {
        $or: [
          { sender: currentUserId, recipient: userId },
          { sender: userId, recipient: currentUserId }
        ]
      },
      {
        $addToSet: { deletedBy: currentUserId }
      }
    );
    
    res.json({ success: true, message: `Marked ${result.modifiedCount} messages as deleted for user ${currentUserId}` });
  } catch (error) {
    console.error('Error deleting conversation records:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/', verifyToken, async (req, res) => {
  try {
    const { recipient, content } = req.body;
    const sender = req.user.id;
    
    const message = new Message({
      sender,
      recipient,
      content
    });
    
    await message.save();
    
    // Populate sender and recipient for response
    await message.populate('sender', 'name profilePhoto');
    await message.populate('recipient', 'name profilePhoto');
    
    const io = getIO();
    
    io.to(recipient.toString()).emit('receive_message', message);
    
    io.to(sender.toString()).emit('message_sent', message);
    
    res.status(201).json({ success: true, data: message });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/conversation/:userId/read', verifyToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;
    
    const result = await Message.updateMany(
      {
        sender: userId,
        recipient: currentUserId,
        read: false
      },
      {
        read: true
      }
    );
    
    res.json({ success: true, message: `Marked ${result.modifiedCount} messages as read` });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;