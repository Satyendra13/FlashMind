const { GoogleGenerativeAI } = require("@google/generative-ai");
const config = require("../config");
const logger = require("../utils/logger");

const genAI = new GoogleGenerativeAI(config.geminiApiKey);

const generateContent = async (prompt) => {
	try {
		const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
		logger.info("Generating content with Gemini AI.");

		const result = await model.generateContent(prompt);
		const response = await result.response;
		let text = response.text();
		text = text.replace(/```json|```/g, "").trim();

		logger.info("Successfully generated content from AI.");
		const parsedResponse = JSON.parse(text);
		return Array.isArray(parsedResponse) ? parsedResponse : [];
	} catch (error) {
		logger.error({
			message: "Error in Gemini AI content generation",
			error: error.message,
		});
		if (error.message.includes("JSON")) {
			logger.error("Failed to parse AI response as JSON.");
		}
		return [];
	}
};

module.exports = {
	generateContent,
};
