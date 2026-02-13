import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { createServer } from 'http';
import { Server } from 'socket.io';

import dotenv from 'dotenv';
import connectDB from './db/connect';
import mongoose from 'mongoose';
import { corsOption } from './cors/corsOption';
import { authRouter } from './routes/authRoutes';
import cookieParser from 'cookie-parser';
import { nodeRouter } from './routes/nodeRoutes';
import { messageRouter } from './routes/messageRoutes';
import { errorHandler } from './middleware/errorHandler';
import { verifyJWT } from './middleware/verifyJwt';
import dns from 'node:dns';
import { isAdmin } from './middleware/isAdmin';
import { conversationRouter } from './routes/conversationRoutes';

// Import mock middleware for tests
const isTesting = process.env.NODE_ENV === 'test';
let authMiddleware: any;
if (isTesting) {
    authMiddleware = require('../tests/mockMiddleware').mockVerifyJWT;
}else{
  authMiddleware = verifyJWT
}

dns.setServers([
  '8.8.8.8',
  '8.8.4.4',
  '1.1.1.1'
]);

dotenv.config();
export const app = express();

// Create HTTP server and Socket.IO
const server = createServer(app);
const io = new Server(server, {
  cors: corsOption
});

// Middlewares
app.use(cors(corsOption));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(bodyParser.urlencoded({
  extended: false
}));

// Add back to app.ts
app.use((req, res, next) => {
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = req.body[key].trim();
      }
    });
  }
  next();
});


app.use(express.static('public'));

// DB Connection
connectDB();

// Routes
app.use('/bleep/v1/auth', authRouter);
app.use("/map/v1/node", nodeRouter);
// Use mock middleware in test environment, real middleware otherwise
app.use('/bleep/v1/messages', authMiddleware, messageRouter);

app.use("/bleep/v1/conversations", authMiddleware, isAdmin, conversationRouter );

//Error Handler
app.use(errorHandler)

// Start server
const PORT = process.env.PORT || 3000;

mongoose.connection.once("open", () => {
    console.log("Connected to MongoDb");
    // Only start server if not in test environment
    if (process.env.NODE_ENV !== 'test') {
        server.listen(PORT, () => {
            console.log(`Server running on port:${PORT}`);
          });
    }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

// Handle DB connection errors

if (process.env.NODE_ENV !== 'test') {
  mongoose.connection.on("error", (err) => {
    console.error("❌ MongoDB connection error:", err);
  });
}



