import express from 'express';
import Message from '../models/message.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// 获取用户之间的消息历史
router.get('/conversation/:userId', verifyToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;
    
    const messages = await Message.find({
      $or: [
        { sender: currentUserId, recipient: userId },
        { sender: userId, recipient: currentUserId }
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
    
    // 获取与当前用户相关的所有唯一对话伙伴（排除自己）
    const sentMessages = await Message.find({ 
      sender: currentUserId,
      recipient: { $ne: currentUserId } // 排除发送给自己
    }).distinct('recipient');
      
    const receivedMessages = await Message.find({ 
      recipient: currentUserId,
      sender: { $ne: currentUserId } // 排除发送给自己
    }).distinct('sender');
    
    // 合并发送和接收的用户ID
    const participantIds = [...new Set([...sentMessages, ...receivedMessages])];
    
    // 构建对话列表
    const conversations = [];
    
    for (const participantId of participantIds) {
      // 获取与该参与者最新的消息
      const latestMessage = await Message.findOne({
        $or: [
          { sender: currentUserId, recipient: participantId },
          { sender: participantId, recipient: currentUserId }
        ]
      }).sort({ timestamp: -1 })
        .populate('sender', 'name profilePhoto')
        .populate('recipient', 'name profilePhoto');
      
      if (latestMessage) {
        // 获取未读消息数量
        const unreadCount = await Message.countDocuments({
          sender: participantId,
          recipient: currentUserId,
          read: false
        });
        
        conversations.push({
          participantId,
          lastMessage: latestMessage.content,
          timestamp: latestMessage.timestamp,
          unread: unreadCount
        });
      }
    }
    
    res.json({ success: true, data: conversations });
  } catch (error) {
    console.error('获取对话列表错误:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 删除用户与特定用户的对话记录
router.delete('/conversation/:userId', verifyToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;
    
    // 删除双方之间的所有消息
    const result = await Message.deleteMany({
      $or: [
        { sender: currentUserId, recipient: userId },
        { sender: userId, recipient: currentUserId }
      ]
    });
    
    res.json({ success: true, message: `Deleted ${result.deletedCount} messages` });
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

export default router;