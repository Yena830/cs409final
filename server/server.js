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

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",               
  "https://cs409final-alpha.vercel.app",
  "https://pawfectmatch-cs409.vercel.app"  
];

const app = express();
const PORT = process.env.PORT || 3001;

const server = http.createServer(app);

// Initialize Socket.IO with CORS configuration
const io = new Server(server, {
  cors: {
    origin: allowedOrigins, 
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Add more logging
io.engine.on("connection_error", (err) => {
  console.log("Socket.IO connection error:", err);
});

console.log("Socket.IO server initialized with CORS settings:", {
  origins: allowedOrigins
});

// Export io instance for use by other modules
export const getIO = () => io;

// Middleware
app.use(cors({
  origin: allowedOrigins, 
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


io.on('connection', (socket) => {
  console.log('User connected to WebSocket:', socket.id);
  console.log('Socket handshake details:', socket.handshake);
  

  socket.on('join_room', (userId) => {
    console.log('User joined room:', userId);
    console.log('Available rooms before join:', socket.adapter.rooms);
    socket.join(userId);
    console.log('Available rooms after join:', socket.adapter.rooms);
  });
  
  socket.on('send_message', async (data) => {
    try {
      console.log('Received message via WebSocket:', data);      
    
      const Message = (await import('./models/message.js')).default;
      const message = new Message(data);
      await message.save();
      
      // Populate sender and recipient for response
      await message.populate('sender', 'name profilePhoto');
      await message.populate('recipient', 'name profilePhoto');
      
      console.log('Message saved to database:', message._id);
      console.log('Populated message:', message);
      
      console.log('Sending message to recipient room:', data.recipient);
      console.log('Available rooms:', io.sockets.adapter.rooms);
      console.log('Checking if recipient room exists:', io.sockets.adapter.rooms.has(data.recipient));
      io.to(data.recipient).emit('receive_message', message);
      
      console.log('Sending confirmation to sender:', data.sender);
      io.to(data.sender).emit('message_sent', message);
    } catch (error) {
      console.error('Message sending error:', error);
    }
  });
  
  socket.on('disconnect', (reason) => {
    console.log('User disconnected from WebSocket:', socket.id, 'Reason:', reason);
  });
});

// Start server
const startServer = async () => {
  try {
    await connectDB();
    server.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`WebSocket server ready on ws://localhost:${PORT}`);
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
    
    // Log server status periodically
    setInterval(() => {
      console.log(`Server status: Listening on port ${PORT}`);
      console.log(`Active connections: ${io.engine.clientsCount}`);
    }, 30000); // Every 30 seconds
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();