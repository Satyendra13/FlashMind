require("dotenv").config();

const config = {
	PORT: process.env.API_GATEWAY_PORT || 3000,
	FRONTEND_URL: process.env.FRONTEND_URL,
	AUTH_SERVICE_URL: process.env.AUTH_SERVICE_URL,
	CONTENT_SERVICE_URL: process.env.CONTENT_SERVICE_URL,
	LOG_LEVEL: process.env.LOG_LEVEL || "info",
};

module.exports = config;
