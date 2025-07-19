require("dotenv").config();

const config = {
	port: process.env.AI_PORT,
	geminiApiKey: process.env.GEMINI_API_KEY,
	frontendUrl: process.env.FRONTEND_URL,
	llamaApiUrl: process.env.LLAMA_API_URL,
	useLlama: process.env.USE_LLAMA === 'true',
};

module.exports = config;
