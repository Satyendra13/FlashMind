const mongoose = require("mongoose");

const quizSchema = new mongoose.Schema(
	{
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		title: { type: String, required: true },
		sourceType: { type: String, enum: ["note", "deck"], required: true },
		sourceId: { type: mongoose.Schema.Types.ObjectId, required: true },
		quizType: {
			type: String,
			enum: ["multiple_choice", "true_false", "fill_blank", "mixed"],
			default: "multiple_choice",
		},
		totalQuestions: {
			type: Number,
			default: 0,
		},
		questions: [
			{
				question: { type: String, required: true },
				options: [String],
				correctAnswer: { type: String, required: true },
				explanation: String,
			},
		],
		timeLimit: { type: Number, default: 15 },
	},
	{ timestamps: true }
);

const Quiz = mongoose.model("Quiz", quizSchema);

module.exports = Quiz;
