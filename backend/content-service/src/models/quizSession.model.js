const mongoose = require("mongoose");

const quizSessionSchema = new mongoose.Schema(
	{
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		quizId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Quiz",
			required: true,
		},
		answers: [
			{
				questionIndex: Number,
				userAnswer: String,
				isCorrect: Boolean,
				timeSpent: Number,
			},
		],
		score: Number,
		totalQuestions: Number,
		correctAnswers: Number,
		timeTaken: Number,
		completedAt: Date,
	},
	{ timestamps: true }
);

const QuizSession = mongoose.model("QuizSession", quizSessionSchema);

module.exports = QuizSession;
