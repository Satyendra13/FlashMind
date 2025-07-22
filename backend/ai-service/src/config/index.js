require("dotenv").config();

const config = {
	port: process.env.AI_PORT,
	geminiApiKey: process.env.GEMINI_API_KEY,
	frontendUrl: process.env.FRONTEND_URL,
	openrouterApiKey: process.env.OPENROUTER_API_KEY,
	aiProvider: process.env.AI_PROVIDER,
};

module.exports = config;
