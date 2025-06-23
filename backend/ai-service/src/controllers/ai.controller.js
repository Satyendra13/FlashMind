const geminiService = require("../services/gemini.service");
const logger = require("../utils/logger");

const generateQuiz = async (req, res) => {
	const { content, options } = req.body;
	logger.info({ message: "Received request to generate quiz", options });

	let prompt = `
    Create ${options.numberOfQuestions} quiz questions from the following content.
    Quiz Type: ${options.quizType}
    Content: ${content}
    Please return a JSON array where each question has the following structure:
  `;

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

	prompt += `
    Make sure questions are educational, clear, and test understanding of the content.
    Return only the JSON array, no additional text.
  `;

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

module.exports = {
	generateQuiz,
	generateFlashcards,
};
