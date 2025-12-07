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

// 获取用户的所有对话列表
router.get('/conversations', verifyToken, async (req, res) => {
  try {
    const currentUserId = req.user.id;
    
    // 获取与当前用户相关的所有唯一对话伙伴（排除自己和已删除的对话）
    const sentMessages = await Message.find({ 
      sender: currentUserId,
      recipient: { $ne: currentUserId }, // 排除发送给自己
      deletedBy: { $ne: currentUserId } // 排除已删除的对话
    }).distinct('recipient');
      
    const receivedMessages = await Message.find({ 
      recipient: currentUserId,
      sender: { $ne: currentUserId }, // 排除发送给自己
      deletedBy: { $ne: currentUserId } // 排除已删除的对话
    }).distinct('sender');
    
    // 合并发送和接收的用户ID
    const participantIds = [...new Set([...sentMessages, ...receivedMessages])];
    
    // 构建对话列表
    const conversations = [];
    
    for (const participantId of participantIds) {
      // 获取与该参与者最新的消息
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
        // 获取未读消息数量
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
    console.error('获取对话列表错误:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 删除用户与特定用户的对话记录（逻辑删除）
router.delete('/conversation/:userId', verifyToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;
    
    // 将对话标记为对当前用户已删除，而不是物理删除
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
    console.error('删除对话记录错误:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 发送新消息
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
    
    res.status(201).json({ success: true, data: message });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 标记与特定用户的对话为已读
router.put('/conversation/:userId/read', verifyToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;
    
    // 将来自特定用户发送给当前用户的所有未读消息标记为已读
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