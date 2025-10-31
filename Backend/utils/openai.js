import "dotenv/config";

const getAIResponse = async(message) => {
    const options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
        },
        body: JSON.stringify({
            model: "llama-3.3-70b-versatile", // Free Groq model
            messages: [{
                role: "user",
                content: message
            }],
            temperature: 0.7,
            max_tokens: 1024
        })
    };

    try {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", options);
        const data = await response.json();
        
        console.log("Groq API Response:", data);
        
        if (data.error) {
            console.error("Groq API Error:", data.error);
            throw new Error(data.error.message || "Groq API error");
        }
        
        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            console.error("Invalid Groq response structure:", data);
            throw new Error("Invalid response from Groq");
        }
        
        return data.choices[0].message.content; //reply
    } catch(err) {
        console.error("Error in getAIResponse:", err);
        throw err;
    }
}

export default getAIResponse;