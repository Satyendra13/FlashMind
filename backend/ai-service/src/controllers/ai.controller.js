const geminiService = require("../services/gemini.service");
const logger = require("../utils/logger");

const generateQuiz = async (req, res) => {
	const { content, options } = req.body;
	logger.info({ message: "Received request to generate quiz", options });

	let prompt = "";
	if (options.customPrompt && options.source === "custom") {
		prompt += `Create ${options.numberOfQuestions} quiz questions based on the following custom requirement.\nCustom Requirement: ${options.customPrompt}\n`;
	} else {
		prompt += `Create ${options.numberOfQuestions} quiz questions from the following content.\nContent: ${content}\n`;
	}
	prompt += `Quiz Type: ${options.quizType}\n`;
	if (options.language && options.language.toLowerCase() === "hindi") {
		prompt += `Generate the quiz in Hindi.\n`;
	} else {
		prompt += `Generate the quiz in English.\n`;
	}
	prompt += `Please return a JSON array where each question has the following structure:\n`;

	if (options.quizType === "multiple_choice") {
		prompt += `{
      "question": "The question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "The correct option",
      "explanation": "Brief explanation of why this is correct"
    }`;
	} else if (options.quizType === "true_false") {
		prompt += `{
      "question": "The statement to evaluate",
      "options": ["True", "False"],
      "correctAnswer": "True" or "False",
      "explanation": "Brief explanation"
    }`;
	} else if (options.quizType === "fill_blank") {
		prompt += `{
      "question": "The question with [BLANK] where the answer should go",
      "options": [],
      "correctAnswer": "The word or phrase that fills the blank",
      "explanation": "Brief explanation"
    }`;
	}

	prompt += `\nMake sure questions are educational, clear, and test understanding of the content.\nReturn only the JSON array, no additional text.`;

	try {
		const questions = await geminiService.generateContent(prompt);
		logger.info(`Successfully generated ${questions.length} quiz questions.`);
		res.status(200).json({ questions });
	} catch (error) {
		logger.error({
			message: "Failed to generate quiz questions",
			error: error.message,
		});
		res
			.status(500)
			.json({ message: "Failed to generate quiz from AI service" });
	}
};

const generateFlashcards = async (req, res) => {
	const { content, options } = req.body;
	logger.info({ message: "Received request to generate flashcards", options });

	const prompt = `
    Create ${options.numberOfCards} flashcards from the following content.
    Difficulty: ${options.difficulty}
    Card Type: ${options.cardType}
    Content: ${content}
    Please return a JSON array where each flashcard has the following structure:
    {
      "frontContent": "Question or prompt",
      "backContent": "Answer or explanation",
      "difficulty": "${options.difficulty}"
    }
    Make sure the flashcards are educational, clear, and appropriate for the difficulty level.
    Return only the JSON array, no additional text.
  `;

	try {
		const flashcards = await geminiService.generateContent(prompt);
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
		- The question
		- The correct answer
		- Three incorrect answers
		- A clear and educational explanation

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
			"question": "The question text",
			"correctAnswer": "The correct answer",
			"incorrectAnswers": ["Incorrect answer 1", "Incorrect answer 2", "Incorrect answer 3"],
			"explanation": "A clear and educational explanation about why the correct answer is correct and others are not."
		}
		]
	`;


	try {
		const explanation = await geminiService.generateContent(prompt);
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
