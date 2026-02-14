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
import { messageRouter } from './routes/messageRoutes';
import { errorHandler } from './middleware/errorHandler';
import { verifyJWT } from './middleware/verifyJwt';
import dns from 'node:dns';
import { conversationRouter } from './routes/conversationRoutes';
import { initializeSocketHandlers } from './socket/socketHandlers';

// Import mock middleware for tests
const isTesting = process.env.NODE_ENV === 'test';
let authMiddleware: any;
if (isTesting) {
    authMiddleware = require('../tests/mockMiddleware').mockVerifyJWT;
}

// For window server
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

// Make io instance available to routes
app.set('io', io);

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

app.use('/bleep/v1/messages', isTesting ? authMiddleware : verifyJWT, messageRouter);

app.use("/bleep/v1/conversations", verifyJWT, conversationRouter );

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
initializeSocketHandlers(io);

// Handle DB connection errors
if (process.env.NODE_ENV !== 'test') {
  mongoose.connection.on("error", (err) => {
    console.error("❌ MongoDB connection error:", err);
  });
}



