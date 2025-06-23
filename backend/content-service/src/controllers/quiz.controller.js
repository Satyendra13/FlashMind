const Quiz = require("../models/quiz.model");
const QuizSession = require("../models/quizSession.model");
const Note = require("../models/note.model");
const FlashcardDeck = require("../models/flashcardDeck.model");
const Flashcard = require("../models/flashcard.model");
const aiClient = require("../services/ai.client");
const logger = require("../utils/logger");

const generateQuiz = async (req, res) => {
	try {
		const {
			source,
			sourceId,
			quizType = "multiple_choice",
			numberOfQuestions = 10,
			timeLimit = 15,
		} = req.body;
		logger.info(
			`Generating quiz from source: ${source}, sourceId: ${sourceId} for user: ${req.userId}`
		);

		if (!source || !sourceId) {
			logger.warn(
				`Quiz generation failed for user: ${req.userId}. Missing source type or ID.`
			);
			return res
				.status(400)
				.json({ message: "Source type and ID are required" });
		}

		let content = "";
		let title = "";
		if (source === "note") {
			const note = await Note.findOne({ _id: sourceId, userId: req.userId });
			if (!note) {
				logger.warn(`Note not found with id: ${sourceId} for quiz generation.`);
				return res.status(404).json({ message: "Note not found" });
			}
			content = note.content;
			title = `Quiz: ${note.title}`;
		} else if (source === "deck") {
			const deck = await FlashcardDeck.findOne({
				_id: sourceId,
				userId: req.userId,
			});
			if (!deck) {
				logger.warn(`Deck not found with id: ${sourceId} for quiz generation.`);
				return res.status(404).json({ message: "Deck not found" });
			}
			const flashcards = await Flashcard.find({ deckId: sourceId });
			content = flashcards
				.map((card) => `Q: ${card.frontContent}\nA: ${card.backContent}`)
				.join("\n\n");
			title = `Quiz: ${deck.name}`;
		}

		if (!content) {
			logger.warn(`No content found for sourceId: ${sourceId}.`);
			return res
				.status(400)
				.json({ message: "No content found to generate quiz from" });
		}

		const aiQuestions = await aiClient.generateQuizFromAI(content, {
			numberOfQuestions,
			quizType,
		});

		if (aiQuestions.length === 0) {
			logger.warn("AI service returned 0 questions. Creating a fallback.");
			aiQuestions.push({
				question: `What is the main topic covered in this ${source}?`,
				options:
					quizType === "multiple_choice"
						? ["Topic A", "Topic B", "Topic C", "Topic D"]
						: quizType === "true_false"
						? ["True", "False"]
						: [],
				correctAnswer:
					quizType === "multiple_choice"
						? "Topic A"
						: quizType === "true_false"
						? "True"
						: "Main topic",
				explanation: "This question tests basic understanding of the content.",
			});
		}

		const quiz = new Quiz({
			userId: req.userId,
			title,
			sourceType: source,
			sourceId,
			quizType,
			totalQuestions: aiQuestions.length,
			questions: aiQuestions,
			timeLimit,
		});
		await quiz.save();
		logger.info(
			`Generated and saved quiz with id: ${quiz._id} for user: ${req.userId}`
		);
		res.status(201).json({ message: "Quiz generated successfully", quiz });
	} catch (error) {
		logger.error({
			message: "Server error generating quiz",
			error: error.message,
		});
		res.status(500).json({ message: "Server error generating quiz" });
	}
};

const getAllQuizzes = async (req, res) => {
	try {
		logger.info(`Fetching all quizzes for user: ${req.userId}`);
		const quizzes = await Quiz.find({ userId: req.userId })
			.sort({ createdAt: -1 })
			.select("-questions");
		logger.info(`Found ${quizzes.length} quizzes for user: ${req.userId}`);
		res.json(quizzes);
	} catch (error) {
		logger.error({
			message: `Error fetching quizzes for user: ${req.userId}`,
			error: error.message,
		});
		res.status(500).json({ message: "Server error fetching quizzes" });
	}
};

const getQuizById = async (req, res) => {
	try {
		logger.info(
			`Fetching quiz with id: ${req.params.id} for user: ${req.userId}`
		);
		const quiz = await Quiz.findOne({ _id: req.params.id, userId: req.userId });
		if (!quiz) {
			logger.warn(
				`Quiz not found with id: ${req.params.id} for user: ${req.userId}`
			);
			return res.status(404).json({ message: "Quiz not found" });
		}
		logger.info(`Successfully fetched quiz with id: ${req.params.id}`);
		res.json(quiz);
	} catch (error) {
		logger.error({
			message: `Error fetching quiz with id: ${req.params.id}`,
			error: error.message,
		});
		res.status(500).json({ message: "Server error fetching quiz" });
	}
};

const startQuizSession = async (req, res) => {
	try {
		logger.info(
			`Starting quiz session for quizId: ${req.params.id}, user: ${req.userId}`
		);
		const quiz = await Quiz.findOne({ _id: req.params.id, userId: req.userId });
		if (!quiz) {
			logger.warn(`Quiz not found for starting session, id: ${req.params.id}`);
			return res.status(404).json({ message: "Quiz not found" });
		}
		const session = new QuizSession({
			userId: req.userId,
			quizId: quiz._id,
			answers: [],
			totalQuestions: quiz.questions.length,
		});
		await session.save();
		logger.info(`Quiz session started, sessionId: ${session._id}`);
		res.json({ message: "Quiz session started", sessionId: session._id, quiz });
	} catch (error) {
		logger.error({
			message: `Error starting quiz session for quizId: ${req.params.id}`,
			error: error.message,
		});
		res.status(500).json({ message: "Server error starting quiz" });
	}
};

const completeQuizSession = async (req, res) => {
	try {
		const { answers, sessionId } = req.body;
		logger.info(
			`Completing quiz session: ${sessionId} for quizId: ${req.params.id}`
		);
		if (!sessionId) {
			logger.warn(
				`Quiz completion failed for quizId: ${req.params.id}. Missing session ID.`
			);
			return res.status(400).json({ message: "Session ID is required" });
		}
		const quiz = await Quiz.findOne({ _id: req.params.id, userId: req.userId });
		if (!quiz) {
			logger.warn(`Quiz not found for completion, id: ${req.params.id}`);
			return res.status(404).json({ message: "Quiz not found" });
		}
		const session = await QuizSession.findOne({
			_id: sessionId,
			quizId: quiz._id,
			userId: req.userId,
		});
		if (!session) {
			logger.warn(
				`Quiz session not found for completion, sessionId: ${sessionId}`
			);
			return res.status(404).json({ message: "Quiz session not found" });
		}

		let correctAnswers = 0;
		const processedAnswers = quiz.questions.map((question, index) => {
			const userAnswer = answers[index] || "";
			const isCorrect =
				userAnswer.toLowerCase().trim() ===
				question.correctAnswer.toLowerCase().trim();
			if (isCorrect) correctAnswers++;
			return { questionIndex: index, userAnswer, isCorrect, timeSpent: 0 };
		});

		const score = Math.round((correctAnswers / quiz.questions.length) * 100);
		session.answers = processedAnswers;
		session.score = score;
		session.totalQuestions = quiz.questions.length;
		session.correctAnswers = correctAnswers;
		session.timeTaken = quiz.timeLimit * 60;
		session.completedAt = new Date();
		await session.save();
		logger.info(
			`Quiz session completed successfully, sessionId: ${sessionId}, score: ${score}`
		);
		res.json({
			message: "Quiz completed successfully",
			sessionId: session._id,
			score,
			correctAnswers,
			totalQuestions: quiz.questions.length,
			timeTaken: quiz.timeLimit * 60,
		});
	} catch (error) {
		logger.error({
			message: `Error completing quiz session for quizId: ${req.params.id}`,
			error: error.message,
		});
		res.status(500).json({ message: "Server error completing quiz" });
	}
};

const getQuizResults = async (req, res) => {
	try {
		logger.info(
			`Fetching results for quizId: ${req.params.id}, user: ${req.userId}`
		);
		const sessions = await QuizSession.find({
			quizId: req.params.id,
			userId: req.userId,
		}).sort({ completedAt: -1 });
		if (sessions.length === 0) {
			logger.info(`No quiz results found for quizId: ${req.params.id}`);
			return res.status(404).json({ message: "No quiz results found" });
		}
		logger.info(
			`Found ${sessions.length} results for quizId: ${req.params.id}`
		);
		res.json(sessions);
	} catch (error) {
		logger.error({
			message: `Error fetching quiz results for quizId: ${req.params.id}`,
			error: error.message,
		});
		res.status(500).json({ message: "Server error fetching quiz results" });
	}
};

const deleteQuiz = async (req, res) => {
	try {
		logger.info(
			`Deleting quiz with id: ${req.params.id} for user: ${req.userId}`
		);
		const quiz = await Quiz.findOneAndDelete({
			_id: req.params.id,
			userId: req.userId,
		});
		if (!quiz) {
			logger.warn(`Quiz not found for deletion with id: ${req.params.id}`);
			return res.status(404).json({ message: "Quiz not found" });
		}
		const deleteResult = await QuizSession.deleteMany({
			quizId: req.params.id,
		});
		logger.info(
			`Deleted ${deleteResult.deletedCount} associated quiz sessions for quizId: ${req.params.id}`
		);
		res.json({ message: "Quiz deleted successfully" });
	} catch (error) {
		logger.error({
			message: `Error deleting quiz with id: ${req.params.id}`,
			error: error.message,
		});
		res.status(500).json({ message: "Server error deleting quiz" });
	}
};

const getSessionHistory = async (req, res) => {
	try {
		logger.info(`Fetching session history for user: ${req.userId}`);
		const sessions = await QuizSession.find({ userId: req.userId })
			.populate("quizId", "title")
			.sort({ completedAt: -1 })
			.limit(20);
		logger.info(
			`Found ${sessions.length} history items for user: ${req.userId}`
		);
		res.json(sessions);
	} catch (error) {
		logger.error({
			message: `Error fetching session history for user: ${req.userId}`,
			error: error.message,
		});
		res.status(500).json({ message: "Server error fetching quiz history" });
	}
};

module.exports = {
	generateQuiz,
	getAllQuizzes,
	getQuizById,
	startQuizSession,
	completeQuizSession,
	getQuizResults,
	deleteQuiz,
	getSessionHistory,
};
