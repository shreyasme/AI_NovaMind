import express from "express";
import Thread from "../models/Thread.js";
import getAIResponse, { analyzeImage } from "../utils/openai.js";
import multer from "multer";
import fs from "fs";
import path from "path";

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads/';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'));
        }
    }
});

//test
router.post("/test", async(req, res) => {
    try {
        const thread = new Thread({
            threadId: "abc",
            title: "Testing New Thread2"
        });

        const response = await thread.save();
        res.send(response);
    } catch(err) {
        console.log(err);
        res.status(500).json({error: "Failed to save in DB"});
    }
});

//Get all threads for a specific user
router.get("/thread", async(req, res) => {
    const { userId } = req.query; // Get userId from query parameters
    
    if (!userId) {
        return res.status(400).json({error: "userId is required"});
    }
    
    try {
        const threads = await Thread.find({ userId }).sort({updatedAt: -1});
        //descending order of updatedAt...most recent data on top
        res.json(threads);
    } catch(err) {
        console.log('Error fetching threads:', err);
        res.status(500).json({error: "Failed to fetch threads"});
    }
});

router.get("/thread/:threadId", async(req, res) => {
    const {threadId} = req.params;
    const { userId } = req.query;

    if (!userId) {
        return res.status(400).json({error: "userId is required"});
    }

    try {
        const thread = await Thread.findOne({threadId, userId});

        if(!thread) {
            return res.status(404).json({error: "Thread not found"});
        }

        res.json(thread.messages);
    } catch(err) {
        console.log(err);
        res.status(500).json({error: "Failed to fetch chat"});
    }
});

router.delete("/thread/:threadId", async (req, res) => {
    const {threadId} = req.params;
    const { userId } = req.query;

    if (!userId) {
        return res.status(400).json({error: "userId is required"});
    }

    try {
        const deletedThread = await Thread.findOneAndDelete({threadId, userId});

        if(!deletedThread) {
            return res.status(404).json({error: "Thread not found"});
        }

        res.status(200).json({success : "Thread deleted successfully"});

    } catch(err) {
        console.log(err);
        res.status(500).json({error: "Failed to delete thread"});
    }
});

router.post("/chat", async(req, res) => {
    const {threadId, message, userId, userEmail} = req.body;

    if(!threadId || !message || !userId || !userEmail) {
        return res.status(400).json({error: "missing required fields: threadId, message, userId, userEmail"});
    }

    try {
        let thread = await Thread.findOne({threadId, userId});

        if(!thread) {
            //create a new thread in Db
            thread = new Thread({
                threadId,
                userId,
                userEmail,
                title: message.substring(0, 50) + (message.length > 50 ? "..." : ""), // Truncate title
                messages: [{role: "user", content: message}]
            });
        } else {
            thread.messages.push({role: "user", content: message});
        }

        // Send the full conversation history to AI for context
        const conversationHistory = thread.messages.map(msg => ({
            role: msg.role,
            content: msg.content
        }));

        console.log("Sending to AI:", conversationHistory.length, "messages");
        const assistantReply = await getAIResponse(conversationHistory);
        
        if (!assistantReply) {
            return res.status(500).json({error: "No response from AI"});
        }

        thread.messages.push({role: "assistant", content: assistantReply});
        thread.updatedAt = new Date();

        await thread.save();
        res.json({reply: assistantReply});
    } catch(err) {
        console.error("Error in /chat route:", err);
        res.status(500).json({error: err.message || "something went wrong"});
    }
});

// Image upload and analysis route
router.post("/analyze-image", upload.single('image'), async(req, res) => {
    console.log("📸 Image upload request received");
    console.log("Request body:", req.body);
    console.log("File:", req.file);
    
    const { threadId, question, userId, userEmail } = req.body;

    if (!req.file) {
        console.error("❌ No image file uploaded");
        return res.status(400).json({ error: "No image file uploaded" });
    }

    if (!threadId || !userId || !userEmail) {
        console.error("❌ Missing required fields");
        return res.status(400).json({ error: "Missing required fields: threadId, userId, userEmail" });
    }

    try {
        const imagePath = req.file.path;
        
        console.log("✅ Analyzing uploaded image from path:", imagePath);
        
        const userQuestion = question || "What's in this image? Please describe it in detail.";
        const analysis = await analyzeImage(imagePath, userQuestion);

        // Save to thread
        let thread = await Thread.findOne({ threadId, userId });
        
        if (!thread) {
            thread = new Thread({
                threadId,
                userId,
                userEmail,
                title: "Image Analysis",
                messages: []
            });
        }

        thread.messages.push({
            role: "user",
            content: `[Image uploaded] ${userQuestion}`
        });

        thread.messages.push({
            role: "assistant",
            content: analysis
        });

        thread.updatedAt = new Date();
        await thread.save();

        // Clean up uploaded file after analysis
        setTimeout(() => {
            fs.unlink(imagePath, (err) => {
                if (err) console.error("Error deleting file:", err);
                else console.log("Cleaned up image file:", imagePath);
            });
        }, 1000);

        res.json({ reply: analysis });
    } catch(err) {
        console.error("Error in /analyze-image route:", err);
        res.status(500).json({ error: err.message || "Failed to analyze image" });
    }
});


export default router;