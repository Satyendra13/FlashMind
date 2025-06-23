const mongoose = require("mongoose");

const flashcardSchema = new mongoose.Schema(
	{
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		noteId: { type: mongoose.Schema.Types.ObjectId, ref: "Note" },
		deckId: { type: mongoose.Schema.Types.ObjectId, ref: "FlashcardDeck" },
		frontContent: { type: String, required: true },
		backContent: { type: String, required: true },
		cardType: {
			type: String,
			enum: ["basic", "cloze", "multiple_choice"],
			default: "basic",
		},
		difficulty: {
			type: String,
			enum: ["easy", "medium", "hard"],
			default: "medium",
		},
		reviewCount: { type: Number, default: 0 },
		correctCount: { type: Number, default: 0 },
		lastReviewed: Date,
		nextReview: Date,
	},
	{ timestamps: true }
);

const Flashcard = mongoose.model("Flashcard", flashcardSchema);

module.exports = Flashcard;
