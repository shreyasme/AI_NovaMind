import express from "express";
import "dotenv/config";
import cors from "cors";
import mongoose from "mongoose";
import chatRoutes from "./routes/chat.js";
import authRoutes from "./routes/auth.js";
import dotenv from "dotenv";
dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// CORS configuration for production
const corsOptions = {
    origin: process.env.FRONTEND_URL ? process.env.FRONTEND_URL.trim() : '*',
    credentials: true,
    optionsSuccessStatus: 200
};

app.use(express.json());
app.use(cors(corsOptions));

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

app.use("/api", chatRoutes);
app.use("/api/auth", authRoutes);

// Test endpoint
app.get("/test", (req, res) => {
    res.json({ message: "Server is working!" });
});

app.listen(PORT, () => {
    console.log(`server running on ${PORT}`);
    console.log(`Test endpoint: http://localhost:${PORT}/test`);
    console.log(`Chat API: http://localhost:${PORT}/api/chat`);
    console.log(`Image Analysis: http://localhost:${PORT}/api/analyze-image`);
    connectDB();
});

const connectDB = async() => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected with Database!");
    } catch(err) {
        console.log("Failed to connect with Db", err);
    }
}


