import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';

import dotenv from 'dotenv';
import connectDB from './db/connect';
import mongoose from 'mongoose';
import { corsOption } from './cors/corsOption';
import { authRouter } from './routes/authRoutes';
import cookieParser from 'cookie-parser';
import { nodeRouter } from './routes/nodeRoutes';
import { errorHandler } from './middleware/errorHandler';


dotenv.config();
const app = express();

// Middlewares
app.use(cors(corsOption));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(bodyParser.urlencoded({
  extended: false
}));

// DB Connection
connectDB();

// Routes
app.use('/chat/v1/auth', authRouter);
app.use("/map/v1/node", nodeRouter);

//Error Handler
app.use(errorHandler)

// Start server
const PORT = process.env.PORT || 3000;

mongoose.connection.once("open", () => {
    console.log("Connected to MongoDb");
    app.listen(PORT, () => {
        console.log(`Server running on port:${PORT}`);
      });
});

// Handle DB connection errors
mongoose.connection.on("error", (err) => {
    console.error("❌ MongoDB connection error:", err);
});

