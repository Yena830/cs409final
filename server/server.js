import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import connectDB from './db.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import taskRoutes from './routes/tasks.js';
import petRoutes from './routes/pet.js';
import messageRoutes from './routes/messages.js';
import http from 'http';
import { Server } from 'socket.io';

// Load environment variables
dotenv.config({ path: path.resolve('./server/.env') });

const app = express();
const PORT = process.env.PORT || 3001;

// 创建 HTTP 服务器
const server = http.createServer(app);

// 初始化 Socket.IO，配置 CORS
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000", // 前端地址
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: "http://localhost:3000", // 前端地址
  credentials: true
}));
app.use(express.json());

// Serve static files from uploads directory
const uploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
app.use('/uploads', express.static(uploadDir));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/pets', petRoutes);
app.use('/api/messages', messageRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// WebSocket 连接处理
io.on('connection', (socket) => {
  // 用户加入房间
  socket.on('join_room', (userId) => {
    socket.join(userId);
  });
  
  // 处理发送消息
  socket.on('send_message', async (data) => {
    try {
      // 保存消息到数据库
      const Message = (await import('./models/message.js')).default;
      const message = new Message(data);
      await message.save();
      
      // Populate sender and recipient for response
      await message.populate('sender', 'name profilePhoto');
      await message.populate('recipient', 'name profilePhoto');
      
      // 广播消息给接收者
      socket.to(data.recipient).emit('receive_message', message);
      
      // 发送确认给发送者
      socket.emit('message_sent', message);
    } catch (error) {
      console.error('发送消息错误:', error);
    }
  });
});

// Start server
const startServer = async () => {
  try {
    await connectDB();
    server.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    }).on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use.`);
        console.error('   Please stop the other process or use a different port.');
        console.error(`   To find and kill the process: lsof -ti:${PORT} | xargs kill -9`);
      } else {
        console.error('❌ Server error:', error.message);
      }
      process.exit(1);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();