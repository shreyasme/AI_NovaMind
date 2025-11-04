import "dotenv/config";
import Groq from "groq-sdk";
import fs from "fs";

let groq;

const initializeGroq = () => {
    const apiKey = process.env.GROQ_API_KEY;
    console.log("Groq API Key status:", apiKey ? `Loaded (${apiKey.substring(0, 10)}...)` : "NOT FOUND");
    
    if (!apiKey || apiKey.trim() === '' || apiKey === 'your_groq_api_key_here') {
        throw new Error("GROQ_API_KEY not found in .env file. Get a FREE key at https://console.groq.com/keys");
    }

    if (!groq) {
        groq = new Groq({
            apiKey: apiKey.trim()
        });
        console.log("✅ Groq initialized successfully!");
    }
    
    return groq;
};

// Chat completion with full message history for context
const getAIResponse = async(messages) => {
    const client = initializeGroq();

    // If messages is a string (legacy support), convert to array format
    if (typeof messages === 'string') {
        messages = [{
            role: 'user',
            content: messages
        }];
    }

    try {
        const completion = await client.chat.completions.create({
            model: "llama-3.3-70b-versatile", // FREE and fast!
            messages: messages,
            temperature: 0.7,
            max_tokens: 2048,
            top_p: 0.95
        });

        console.log("Groq API Response received");
        return completion.choices[0].message.content;
    } catch(err) {
        console.error("Error in getAIResponse:", err.message);
        throw err;
    }
}

// Generate image - Groq doesn't support image generation
const generateImage = async(prompt) => {
    throw new Error("Groq doesn't support image generation. For free image generation, consider using Hugging Face's Stable Diffusion.");
}

// Analyze image - Groq has vision models!
const analyzeImage = async(imagePath, question = "What's in this image?") => {
    const client = initializeGroq();

    try {
        console.log("Analyzing image with Groq Vision:", imagePath);
        
        // Read the image file and convert to base64
        const imageBuffer = fs.readFileSync(imagePath);
        const base64Image = imageBuffer.toString('base64');
        
        // Determine image type
        const ext = imagePath.split('.').pop().toLowerCase();
        const mimeType = ext === 'png' ? 'image/png' : 
                        ext === 'gif' ? 'image/gif' :
                        ext === 'webp' ? 'image/webp' : 'image/jpeg';
        
        const completion = await client.chat.completions.create({
            model: "llama-3.2-90b-vision-preview", // Groq's vision model!
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: question
                        },
                        {
                            type: "image_url",
                            image_url: {
                                url: `data:${mimeType};base64,${base64Image}`
                            }
                        }
                    ]
                }
            ],
            temperature: 0.7,
            max_tokens: 1024
        });

        console.log("✅ Image analysis complete!");
        return completion.choices[0].message.content;
    } catch(err) {
        console.error("❌ Error in analyzeImage:", err.message);
        if (err.error) {
            console.error("Error details:", JSON.stringify(err.error, null, 2));
        }
        console.error("Full error:", err);
        throw new Error(`Image analysis failed: ${err.message}`);
    }
}

export default getAIResponse;
export { generateImage, analyzeImage };