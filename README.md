# PawfectMatch

A platform connecting pet owners with trusted local helpers for safe, loving pet care.

## 🌐 Live Demo

**Production Site**: [https://pawfectmatch-cs409.vercel.app/](https://pawfectmatch-cs409.vercel.app/)

## Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v18 or higher recommended)
- **npm** (comes with Node.js)
- **MongoDB** (local installation or MongoDB Atlas account)
- **Git**

## Project Structure

### Backend (JavaScript)
- **Location**: `server/` directory
- **Technology**: Node.js + Express.js + MongoDB (Mongoose)
- **Language**: **Pure JavaScript** (`.js` files)
- **Files**: 
  - `server.js` - Main server entry point
  - `db.js` - MongoDB connection
  - `controllers/` - Request handlers
  - `models/` - Mongoose schemas
  - `routes/` - API routes
  - `middleware/` - Authentication middleware

### Frontend (TypeScript)
- **Location**: `src/` directory
- **Technology**: React + TypeScript + Vite
- **Language**: TypeScript (`.tsx` and `.ts` files)

## Environment Setup

**Important**: Create a `.env` file in the `server/` directory with the following variables:

### Required Variables
```env
MONGODB_URI=your_mongodb_connection_string_here
JWT_SECRET=your_jwt_secret_key_here
PORT=3001
```

### Optional Variables
```env
# File upload configuration
UPLOAD_DIR=./uploads  # Default: ./uploads (used if Cloudinary is not configured)

# Cloudinary configuration (recommended for production)
# If provided, images will be uploaded to Cloudinary instead of local storage
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

### Frontend Environment Variables (Optional)
Create a `.env` file in the project root for frontend configuration:

```env
VITE_API_URL=http://localhost:3001/api  # Default: http://localhost:3001/api
```

## Running the code

### Install dependencies
```bash
npm i
```

### Start development server (Frontend)
```bash
npm run dev
```

### Start backend server
```bash
npm run server
```

### Build for production
```bash
npm run build
```

### Available Scripts
- `npm run dev` - Start Vite development server (frontend)
- `npm run build` - Build frontend for production
- `npm run server` - Start backend server
- `npm run migrate:uploads` - Migrate uploads to Cloudinary
- `npm run migrate:uploads-complete` - Complete migration and replace URLs
- `npm run migrate:update-db-urls` - Update database image URLs

### Running the Full Application Locally

To run the complete application, you need to start both the frontend and backend servers:

1. **Terminal 1 - Backend Server:**
   ```bash
   npm run server
   ```
   The backend will run on `http://localhost:3001`

2. **Terminal 2 - Frontend Development Server:**
   ```bash
   npm run dev
   ```
   The frontend will run on `http://localhost:5173` (or another port if 5173 is occupied)

3. Open your browser and navigate to the frontend URL (usually `http://localhost:5173`)

### Database Setup

1. **MongoDB Setup:**
   - Option 1: Use [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (cloud database, recommended for beginners)
   - Option 2: Install MongoDB locally
   
2. **Get Connection String:**
   - For MongoDB Atlas: Create a cluster and get your connection string
   - For local MongoDB: Use `mongodb://localhost:27017/pawfectmatch`

3. **Update `.env` file:**
   ```env
   MONGODB_URI=your_connection_string_here
   ```

### Seeding the Database (Optional)

To populate the database with sample data for testing:

```bash
node server/seed.js
```

This will create:
- 5 sample pet owners
- 5 sample helpers
- Multiple pets for each owner
- 20 sample tasks with various statuses

**Note:** This will clear all existing data in the database. All users will have the password `password123` for testing purposes.

## Deployment

### Production Deployment

This project is deployed on **Vercel**:
- **Frontend**: [https://pawfectmatch-cs409.vercel.app/](https://pawfectmatch-cs409.vercel.app/)
- The frontend is automatically deployed via Vercel when changes are pushed to the main branch
- Backend server needs to be deployed separately (e.g., on Railway, Render, or similar platforms)

### Deployment Considerations

#### File Uploads
The application supports two upload methods:

1. **Cloudinary (Recommended for Production)**
   - Configure Cloudinary credentials in `.env` file
   - Images are automatically uploaded to Cloudinary when credentials are provided
   - Better scalability, reliability, and CDN delivery
   - No need to configure file serving

2. **Local Storage (Development/Backup)**
   - Used when Cloudinary credentials are not provided
   - Files stored in `uploads/` directory (configurable via `UPLOAD_DIR`)
   - For production, ensure the directory is outside your codebase
   - Configure your web server to serve files from the upload directory

### Environment Variables for Production
Create a `.env` file in the `server/` directory with appropriate values for production:

```env
MONGODB_URI=your_production_mongodb_connection_string
JWT_SECRET=your_secure_jwt_secret_key
PORT=3001

# Recommended: Use Cloudinary for production
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Alternative: Local storage (if not using Cloudinary)
UPLOAD_DIR=/var/www/uploads  # Directory outside of codebase
```

## Tech Stack

**Backend:**
- Node.js
- Express.js
- MongoDB / Mongoose
- JWT Authentication
- bcrypt for password hashing
- Socket.IO (real-time messaging)
- Cloudinary (image upload and storage)
- Multer (file upload handling)

**Frontend:**
- React 18
- TypeScript
- Vite
- React Router DOM (routing)
- Tailwind CSS (styling)
- Radix UI Components (accessible UI primitives)
- React Hook Form (form management)
- Socket.IO Client (real-time messaging)
- Sonner (toast notifications)
- Lucide React (icons)

## Features

- 🔐 User authentication and authorization
- 🐾 Pet profile management
- 📋 Task posting and management
- 💬 Real-time messaging between users
- ⭐ Review and rating system
- 🔍 Helper search and discovery
- 📸 Image upload with Cloudinary integration
- 📱 Responsive design

## API Endpoints Overview

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (requires authentication)

### Users
- `GET /api/users` - Get all users
- `GET /api/users/helpers` - Get all helpers
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/profile` - Update current user profile
- `POST /api/users/profile-photo` - Upload profile photo
- `POST /api/users/role` - Add role to current user
- `DELETE /api/users/role/:role` - Remove role from current user

### Tasks
- `GET /api/tasks` - Get all tasks
- `GET /api/tasks/:id` - Get task by ID
- `POST /api/tasks` - Create a new task (owner only)
- `POST /api/tasks/:id/apply` - Apply to a task (helper only)
- `PUT /api/tasks/:id/assign` - Assign helper to task (owner only)
- `PUT /api/tasks/:id/complete` - Mark task as completed
- `PUT /api/tasks/:id/confirm` - Confirm task completion
- `POST /api/tasks/:id/review` - Submit review for completed task
- `PUT /api/tasks/:id/cancel` - Cancel a task

### Pets
- `GET /api/pets` - Get all pets
- `GET /api/pets/:id` - Get pet by ID
- `POST /api/pets` - Create a new pet (owner only)
- `PUT /api/pets/:id` - Update pet (owner only)
- `DELETE /api/pets/:id` - Delete pet (owner only)

### Messages
- `GET /api/messages/conversations` - Get all conversations
- `GET /api/messages/conversation/:userId` - Get conversation with specific user
- `POST /api/messages` - Send a message
- `PUT /api/messages/conversation/:userId/read` - Mark conversation as read
- `DELETE /api/messages/conversation/:userId` - Delete conversation

**Note:** Most endpoints require JWT authentication. Include the token in the `Authorization` header as `Bearer <token>`.

## Troubleshooting

### Common Issues

1. **Port Already in Use**
   - If port 3001 is already in use, either:
     - Stop the process using that port: `lsof -ti:3001 | xargs kill -9`
     - Change the `PORT` in your `.env` file

2. **MongoDB Connection Error**
   - Verify your `MONGODB_URI` in the `.env` file is correct
   - Check if MongoDB is running (for local installations)
   - For MongoDB Atlas, ensure your IP is whitelisted

3. **Frontend Can't Connect to Backend**
   - Ensure backend server is running on the correct port
   - Check `VITE_API_URL` in frontend `.env` file matches backend URL
   - Verify CORS settings in `server/server.js` allow your frontend origin

4. **Image Upload Issues**
   - If using Cloudinary, verify all three credentials are set correctly
   - Check file size limits (default: 5MB)
   - Ensure file format is supported (jpg, png, jpeg, gif)

5. **Socket.IO Connection Issues**
   - Ensure backend server is running
   - Check that allowed origins in `server/server.js` include your frontend URL
   - Verify WebSocket support in your deployment environment

## Version

Current version: **0.1.0**

## Contributing

This is a private project. For questions or issues, please contact the development team.

## License

This project is private and proprietary.