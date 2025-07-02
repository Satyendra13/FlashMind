require("dotenv").config();

const config = {
	port: process.env.CONTENT_PORT,
	mongodbUri: process.env.MONGODB_URI,
	jwtSecret: process.env.JWT_SECRET,
	frontendUrl: process.env.FRONTEND_URL,
	aiServiceUrl: process.env.AI_SERVICE_URL,
};

module.exports = config;
