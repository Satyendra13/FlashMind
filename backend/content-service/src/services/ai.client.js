const axios = require("axios");
const config = require("../config");
const logger = require("../utils/logger");

const apiClient = axios.create({
	baseURL: `${config.aiServiceUrl}/api/ai`,
	timeout: 60000,
});

const generateQuizFromAI = async (content, options) => {
	try {
		logger.info("Sending request to AI service to generate quiz.");
		const response = await apiClient.post("/quiz", { content, options });
		logger.info("Received quiz data from AI service.");
		return response.data.questions || [];
	} catch (error) {
		logger.error({
			message: "Error calling AI service for quiz generation",
			error: error.message,
		});
		return [];
	}
};

const generateFlashcardsFromAI = async (content, options) => {
	try {
		logger.info("Sending request to AI service to generate flashcards.");
		const response = await apiClient.post("/flashcards", { content, options });
		logger.info("Received flashcards data from AI service.");
		return response.data.flashcards || [];
	} catch (error) {
		logger.error({
			message: "Error calling AI service for flashcard generation",
			error: error.message,
		});
		return [];
	}
};

module.exports = {
	generateQuizFromAI,
	generateFlashcardsFromAI,
};
