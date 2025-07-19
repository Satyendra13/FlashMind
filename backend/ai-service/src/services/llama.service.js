const axios = require("axios");
const config = require("../config");
const logger = require("../utils/logger");

// You may want to add llamaApiUrl to your config/index.js and .env
const llamaApiUrl = config.llamaApiUrl || "http://ai-llama3:11434/api/generate";

const generateContent = async (prompt) => {
	try {
		logger.info("Generating content with Llama 3.3 AI.");
		const response = await axios.post(llamaApiUrl, {
			model: "llama3",
			prompt,
			stream: false
		});
		let text = response.data.response || response.data.text || "";
		text = text.replace(/```json|```/g, "").trim();
		logger.info("Successfully generated content from Llama 3.3 AI.");
		const parsedResponse = JSON.parse(text);
		return Array.isArray(parsedResponse) ? parsedResponse : [];
	} catch (error) {
		logger.error({
			message: "Error in Llama 3.3 AI content generation",
			error: error.message,
		});
		if (error.message.includes("JSON")) {
			logger.error("Failed to parse Llama 3.3 AI response as JSON.");
		}
		return [];
	}
};

module.exports = {
	generateContent,
}; 