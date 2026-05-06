
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";
import path from "path";
import { fileURLToPath } from "url";


dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Needed for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(express.static(path.join(__dirname, "public")));
app.use(cors());
app.use(express.json());

// Initialize OpenAI client
let client = null;
if (process.env.OPENAI_API_KEY) {
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    console.log("OpenAI client initialized.");
} else {
    console.warn("⚠ No API key found — using dummy itinerary.");
}

// Serve HTML
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "budget.html"));
});

// Generate itinerary
app.post("/generate-itinerary", async (req, res) => {
    console.log("Request body:", req.body);

    const { destination, days, budget, interest, city } = req.body;

    if (!destination || !days) {
        return res.status(400).json({ error: "Destination and number of days are required." });
    }

    try {
        // If API key exists → use OpenAI
        if (client) {
            const prompt = `
Create a detailed ${days}-day travel itinerary for ${destination}.
Budget: ${budget}
Traveller interests: ${interest}
Cities to include: ${city}
Make it structured, fun, and very clear.
`;

            const response = await client.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                    { role: "system", content: "You are a professional travel itinerary planner." },
                    { role: "user", content: prompt }
                ],
            });

            const aiText = response.choices?.[0]?.message?.content || "No itinerary generated.";

            return res.json({ itinerary: aiText });
        }

        // Dummy itinerary
        res.json({
            itinerary: `Day 1: Arrive at ${destination} and explore.\nDay 2: Enjoy ${interest} activities.\nDay 3: Visit nearby cities: ${city}.`
        });

    } catch (err) {
        console.error("Error generating itinerary:", err);
        res.status(500).json({ error: "Error generating itinerary." });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});

