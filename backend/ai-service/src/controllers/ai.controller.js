const geminiService = require("../services/gemini.service");
const logger = require("../utils/logger");

const generateQuiz = async (req, res) => {
	const { content, options } = req.body;

	if (!content && !(options.customPrompt && options.source === "custom")) {
		return res.status(400).json({ message: "Request must include content or a custom prompt." });
	}
	if (!options || !options.numberOfQuestions || !options.quizType) {
		return res.status(400).json({ message: "Request must include options with numberOfQuestions and quizType." });
	}

	logger.info({ message: "Received request to generate quiz", options });

	// --- PROMPT CONSTRUCTION ---
	// We build a "basePrompt" containing only the rules and JSON format.
	// The full 'content' is passed separately to the service for analysis.
	let basePrompt = "";
	if (options.customPrompt && options.source === "custom") {
		basePrompt += `Based on the following custom requirement.\nCustom Requirement: ${options.customPrompt}\n`;
	} else {
		// The service will handle the content, so we just provide context.
		basePrompt += `From the provided source content.\n`;
	}

	basePrompt += `Quiz Type: ${options.quizType}\n`;
	basePrompt += `For each question, provide both English and Hindi versions for all fields.\n`;
	basePrompt += `Return a valid JSON array where each question has the following structure:\n`;

	// Add the specific JSON structure example for the requested quiz type.
	if (options.quizType === "multiple_choice") {
		basePrompt += `{
			"question": { "en": "The question in English", "hi": "The question in Hindi" },
			"options": [
				{ "key": "a", "en": "Option A in English", "hi": "Option A in Hindi" },
				{ "key": "b", "en": "Option B in English", "hi": "Option B in Hindi" },
				{ "key": "c", "en": "Option C in English", "hi": "Option C in Hindi" },
				{ "key": "d", "en": "Option D in English", "hi": "Option D in Hindi" }
			],
			"correctAnswerKey": "a",
			"explanation": { "en": "Explanation in English", "hi": "Explanation in Hindi" }
		}`;
	} else if (options.quizType === "true_false") {
		basePrompt += `{
			"question": { "en": "The statement in English", "hi": "The statement in Hindi" },
			"options": [
				{ "key": "a", "en": "True", "hi": "सही" },
				{ "key": "b", "en": "False", "hi": "गलत" }
			],
			"correctAnswerKey": "a",
			"explanation": { "en": "Explanation in English", "hi": "Explanation in Hindi" }
		}`;
	} else if (options.quizType === "fill_blank") {
		basePrompt += `{
			"question": { "en": "The question with [BLANK] in English", "hi": "The question with [BLANK] in Hindi" },
			"options": [
				{ "key": "a", "en": "The answer in English", "hi": "The answer in Hindi" }
			],
			"correctAnswerKey": "a",
			"explanation": { "en": "Explanation in English", "hi": "Explanation in Hindi" }
		}`;
	}

	basePrompt += `\nMake sure questions are unique, educational, clear, and test understanding.\nReturn ONLY the JSON array, with no other text, comments, or markdown formatting.`;

	try {
		// --- UPDATED SERVICE CALL ---
		// We now pass the basePrompt, the number of questions, and the raw content
		// as three separate arguments to our intelligent service.
		const questions = await geminiService.generateContent(
			basePrompt,
			options.numberOfQuestions,
			content
		);

		// Handle the case where the AI fails to generate any questions
		if (!questions || questions.length === 0) {
			logger.warn("AI service returned no questions. The content might be unsuitable or the request failed after retries.");
			return res.status(500).json({ message: "The AI service failed to generate questions. Please try again with different content or options." });
		}

		logger.info(`Successfully generated ${questions.length} quiz questions.`);
		res.status(200).json({ questions });

	} catch (error) {
		logger.error({
			message: "Failed to generate quiz questions in controller",
			error: error.message,
		});
		res
			.status(500)
			.json({ message: "A critical error occurred in the AI generation service." });
	}
};

const generateFlashcards = async (req, res) => {
	const { content, options } = req.body;
	logger.info({ message: "Received request to generate flashcards", options });

	let prompt = "";
	if (options.customPrompt) {
		prompt += `Create ${options.numberOfCards} flashcards based on the following custom requirement.\nCustom Requirement: ${options.customPrompt}\n`;
	} else {
		prompt += `Create ${options.numberOfCards} flashcards from the following content.\nContent: ${content}\n`;
	}
	prompt += `Difficulty: ${options.difficulty}\n`;
	prompt += `Card Type: ${options.cardType}\n`;
	if (options.language && options.language.toLowerCase() === "hindi") {
		prompt += `Generate the flashcards in Hindi.\n`;
	} else {
		prompt += `Generate the flashcards in English.\n`;
	}
	prompt += `Please return a JSON array where each flashcard has the following structure:
    {
      "frontContent": "Question or prompt",
      "backContent": "Answer or explanation",
      "difficulty": "${options.difficulty}"
    }
    Make sure the flashcards are educational, clear, and appropriate for the difficulty level.
    Return only the JSON array, no additional text.`;

	try {
		const flashcards = await geminiService.generateContent(
			prompt,
			options.numberOfQuestions,
			content
		);
		logger.info(`Successfully generated ${flashcards.length} flashcards.`);
		res.status(200).json({ flashcards });
	} catch (error) {
		logger.error({
			message: "Failed to generate flashcards",
			error: error.message,
		});
		res
			.status(500)
			.json({ message: "Failed to generate flashcards from AI service" });
	}
};

const generateExplanation = async (req, res) => {
	const { questions, answers } = req.body;
	logger.info({ message: "Received request to generate explanation", questions, answers });

	const prompt = `
		You are an educational AI that helps explain multiple-choice questions.

		Given a list of questions and the correct answers, generate a JSON array where each object contains:
		- The question (both English and Hindi)
		- The correct answer (both English and Hindi)
		- Three incorrect answers (both English and Hindi)
		- A clear and educational explanation (both English and Hindi)

		### Instructions:
		1. The explanation should clarify **why the correct answer is correct** and **why the incorrect answers are wrong**.
		2. Keep explanations suitable for a student-level understanding (e.g., school or college).
		3. Your output must be a **valid JSON array** only — no extra text, no preambles, no markdown.

		### Input:
		Questions and Answers:
		${JSON.stringify({ questions, answers }, null, 2)}

		### Output format (repeat this structure for each item in the list):

		[
		{
			"question": { "en": "The question in English", "hi": "The question in Hindi" },
			"correctAnswer": { "en": "Correct answer in English", "hi": "Correct answer in Hindi" },
			"incorrectAnswers": [
				{ "en": "Incorrect answer 1 in English", "hi": "Incorrect answer 1 in Hindi" },
				{ "en": "Incorrect answer 2 in English", "hi": "Incorrect answer 2 in Hindi" },
				{ "en": "Incorrect answer 3 in English", "hi": "Incorrect answer 3 in Hindi" }
			],
			"explanation": { "en": "Explanation in English", "hi": "Explanation in Hindi" }
		}
		]
	`;


	try {
		const explanation = await geminiService.generateContent(
			prompt,
			options.numberOfQuestions,
			content
		);
		if (explanation.length === 0) {
			logger.error({
				message: "Failed to generate explanation",
				error: "No explanation generated",
			});
			return res.status(500).json({ message: "Failed to generate explanation from AI service" });
		}
		logger.info(`Successfully generated explanation.`);
		res.status(200).json({ explanation });
	} catch (error) {
		logger.error({
			message: "Failed to generate explanation",
			error: error.message,
		});
		res.status(500).json({ message: "Failed to generate explanation from AI service" });
	}
};

module.exports = {
	generateQuiz,
	generateFlashcards,
	generateExplanation,
};
