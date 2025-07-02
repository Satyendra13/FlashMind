require("dotenv").config();

const config = {
	port: process.env.AI_PORT,
	geminiApiKey: process.env.GEMINI_API_KEY,
	frontendUrl: process.env.FRONTEND_URL,
};

module.exports = config;
