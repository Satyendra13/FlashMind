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
				userAnswerKey: String,
				isCorrect: Boolean,
				timeSpent: Number,
			},
		],
		explanation: [
			{
				question: {
					en: String,
					hi: String,
				},
				options: [
					{
						key: String,
						en: String,
						hi: String,
					},
				],
				correctAnswerKey: String,
				explanation: {
					en: String,
					hi: String,
				},
			},
		],
		quizTitle: String,
		score: Number,
		totalQuestions: Number,
		correctAnswers: Number,
		timeTaken: Number,
		completedAt: Date,
		isCompleted: { type: Boolean, default: false },
	},
	{ timestamps: true }
);

const QuizSession = mongoose.model("QuizSession", quizSessionSchema);

module.exports = QuizSession;
