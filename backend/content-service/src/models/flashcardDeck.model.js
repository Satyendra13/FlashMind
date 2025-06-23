const mongoose = require("mongoose");

const flashcardDeckSchema = new mongoose.Schema(
	{
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		name: { type: String, required: true },
		description: String,
		tags: [String],
		cardCount: { type: Number, default: 0 },
	},
	{ timestamps: true }
);

const FlashcardDeck = mongoose.model("FlashcardDeck", flashcardDeckSchema);

module.exports = FlashcardDeck;
