require("dotenv").config();

const config = {
	port: process.env.PORT || 3002,
	geminiApiKey: process.env.GEMINI_API_KEY,
	frontendUrl: process.env.FRONTEND_URL,
};

module.exports = config;
