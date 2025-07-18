const mongoose = require("mongoose");

const quizSchema = new mongoose.Schema(
	{
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		title: { type: String, required: true },
		sourceType: { type: String, enum: ["note", "deck", "custom"], required: true },
		sourceId: { type: mongoose.Schema.Types.ObjectId, required: false },
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
				question: {
					en: { type: String, required: true },
					hi: { type: String, required: true },
				},
				options: [
					{
						key: { type: String, required: true },
						en: { type: String, required: true },
						hi: { type: String, required: true },
					},
				],
				correctAnswerKey: { type: String, required: true },
				explanation: {
					en: { type: String },
					hi: { type: String },
				},
			},
		],
		timeLimit: { type: Number, default: 15 },
		isCompleted: { type: Boolean, default: false },
	},
	{ timestamps: true }
);

const Quiz = mongoose.model("Quiz", quizSchema);

module.exports = Quiz;
