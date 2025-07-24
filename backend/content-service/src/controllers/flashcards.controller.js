const FlashcardDeck = require("../models/flashcardDeck.model");
const Flashcard = require("../models/flashcard.model");
const Note = require("../models/note.model");
const aiClient = require("../services/ai.client");
const logger = require("../utils/logger");

const generateFlashcards = async (req, res) => {
	try {
		const {
			source = "note",
			sourceId,
			title,
			numberOfCards = 10,
			difficulty = "medium",
			cardType = "basic",
			language = "english",
			customPrompt,
			totalFlashcard,
		} = req.body;
		logger.info(
			`Generating flashcards for user: ${req.userId}, source: ${source}`
		);

		let content = "";
		let deckName = "";
		let deckDescription = "";
		let deckTags = [];
		let effectiveNumberOfCards = numberOfCards;
		let effectiveTotalFlashcard = totalFlashcard;

		if (source === "custom") {
			if (!customPrompt?.trim() || !title?.trim()) {
				logger.warn(
					`Custom flashcard generation failed for user: ${req.userId}. Title and custom prompt are required.`
				);
				return res.status(400).json({
					message: "Title and custom prompt are required for custom flashcards"
				});
			}
			content = customPrompt;
			deckName = title;
			deckDescription = `AI-generated flashcards from custom requirements`;
			deckTags = ["custom"];
		} else {
			if (!sourceId) {
				logger.warn(
					`Flashcard generation failed for user: ${req.userId}. Note ID is required.`
				);
				return res.status(400).json({ message: "Note ID is required" });
			}

			const note = await Note.findOne({ _id: sourceId, userId: req.userId });
			if (!note) {
				logger.warn(
					`Note not found with id: ${sourceId} for flashcard generation.`
				);
				return res.status(404).json({ message: "Note not found" });
			}
			content = note.primaryLanguage && note.primaryLanguage?.toLowerCase() === "english" ? note.englishNoteContent : note.primaryLanguage && note.primaryLanguage?.toLowerCase() === "hindi" ? note.hindiNoteContent : note.content;
			deckName = `${note.title} - Flashcards`;
			deckDescription = `AI-generated flashcards from ${note.title}`;
			deckTags = [note.folder];
			// Ignore numberOfCards and totalFlashcard from frontend for note
			effectiveNumberOfCards = 0;
			effectiveTotalFlashcard = 0;
		}

		let deck = await FlashcardDeck.findOne({
			userId: req.userId,
			name: deckName,
		});
		if (!deck) {
			deck = new FlashcardDeck({
				userId: req.userId,
				name: deckName,
				description: deckDescription,
				tags: deckTags,
			});
			await deck.save();
			logger.info(
				`Created new deck for generated flashcards, deckId: ${deck._id}`
			);
		}

		const aiFlashcards = await aiClient.generateFlashcardsFromAI(content, {
			numberOfCards: effectiveNumberOfCards,
			difficulty,
			cardType,
			language,
			customPrompt: source === "custom" ? customPrompt : undefined,
			totalFlashcard: effectiveTotalFlashcard,
		});

		if (aiFlashcards.length === 0) {
			logger.warn("AI service returned 0 flashcards. Creating a fallback.");
			aiFlashcards.push({
				frontContent: `What is the main topic of "${deckName}"?`,
				backContent: content.substring(0, 200) + "...",
				difficulty: difficulty,
			});
		}

		const flashcardsToSave = aiFlashcards.map(
			(aiCard) =>
				new Flashcard({
					userId: req.userId,
					noteId: source === "note" ? sourceId : null,
					deckId: deck._id,
					frontContent: aiCard.frontContent,
					backContent: aiCard.backContent,
					cardType,
					difficulty: aiCard.difficulty || difficulty,
					nextReview: new Date(),
				})
		);
		const savedFlashcards = await Flashcard.insertMany(flashcardsToSave);

		deck.cardCount = await Flashcard.countDocuments({ deckId: deck._id });
		await deck.save();
		logger.info(
			`Generated and saved ${savedFlashcards.length} flashcards for deckId: ${deck._id}`
		);

		res
			.status(201)
			.json({
				message: "Flashcards generated successfully",
				deck,
				flashcards: savedFlashcards,
			});
	} catch (error) {
		logger.error({
			message: "Server error generating flashcards",
			error: error.message,
		});
		res.status(500).json({ message: "Server error generating flashcards" });
	}
};

const getDecks = async (req, res) => {
	try {
		logger.info(`Fetching all decks for user: ${req.userId}`);
		const decks = await FlashcardDeck.find({ userId: req.userId }).sort({
			createdAt: -1,
		});
		logger.info(`Found ${decks.length} decks for user: ${req.userId}`);
		res.json(decks);
	} catch (error) {
		logger.error({
			message: `Error fetching decks for user: ${req.userId}`,
			error: error.message,
		});
		res.status(500).json({ message: "Server error fetching decks" });
	}
};

const getDeckById = async (req, res) => {
	try {
		logger.info(
			`Fetching deck with id: ${req.params.id} for user: ${req.userId}`
		);
		const deck = await FlashcardDeck.findOne({
			_id: req.params.id,
			userId: req.userId,
		});
		if (!deck) {
			logger.warn(
				`Deck not found with id: ${req.params.id} for user: ${req.userId}`
			);
			return res.status(404).json({ message: "Deck not found" });
		}
		logger.info(`Successfully fetched deck with id: ${req.params.id}`);
		res.json(deck);
	} catch (error) {
		logger.error({
			message: `Error fetching deck with id: ${req.params.id}`,
			error: error.message,
		});
		res.status(500).json({ message: "Server error fetching deck" });
	}
};

const getAllFlashcards = async (req, res) => {
	try {
		const { deckId } = req.query;
		const query = { userId: req.userId };
		if (deckId) query.deckId = deckId;

		logger.info(
			`Fetching flashcards for user: ${req.userId} with query: ${JSON.stringify(
				query
			)}`
		);
		const flashcards = await Flashcard.find(query)
			.populate("deckId", "name")
			.sort({ createdAt: -1 });
		logger.info(`Found ${flashcards.length} flashcards.`);
		res.json(flashcards);
	} catch (error) {
		logger.error({
			message: `Error fetching flashcards for user: ${req.userId}`,
			error: error.message,
		});
		res.status(500).json({ message: "Server error fetching flashcards" });
	}
};

const getFlashcardById = async (req, res) => {
	try {
		logger.info(
			`Fetching flashcard with id: ${req.params.id} for user: ${req.userId}`
		);
		const flashcard = await Flashcard.findOne({
			_id: req.params.id,
			userId: req.userId,
		}).populate("deckId", "name");
		if (!flashcard) {
			logger.warn(
				`Flashcard not found with id: ${req.params.id} for user: ${req.userId}`
			);
			return res.status(404).json({ message: "Flashcard not found" });
		}
		logger.info(`Successfully fetched flashcard with id: ${req.params.id}`);
		res.json(flashcard);
	} catch (error) {
		logger.error({
			message: `Error fetching flashcard with id: ${req.params.id}`,
			error: error.message,
		});
		res.status(500).json({ message: "Server error fetching flashcard" });
	}
};

const updateFlashcard = async (req, res) => {
	try {
		const { frontContent, backContent, difficulty } = req.body;
		logger.info(
			`Updating flashcard with id: ${req.params.id} for user: ${req.userId}`
		);
		const flashcard = await Flashcard.findOneAndUpdate(
			{ _id: req.params.id, userId: req.userId },
			{ frontContent, backContent, difficulty },
			{ new: true }
		);
		if (!flashcard) {
			logger.warn(`Flashcard not found for update with id: ${req.params.id}`);
			return res.status(404).json({ message: "Flashcard not found" });
		}
		logger.info(`Flashcard updated successfully with id: ${req.params.id}`);
		res.json({ message: "Flashcard updated successfully", flashcard });
	} catch (error) {
		logger.error({
			message: `Error updating flashcard with id: ${req.params.id}`,
			error: error.message,
		});
		res.status(500).json({ message: "Server error updating flashcard" });
	}
};

const deleteFlashcard = async (req, res) => {
	try {
		logger.info(
			`Deleting flashcard with id: ${req.params.id} for user: ${req.userId}`
		);
		const flashcard = await Flashcard.findOneAndDelete({
			_id: req.params.id,
			userId: req.userId,
		});
		if (!flashcard) {
			logger.warn(`Flashcard not found for deletion with id: ${req.params.id}`);
			return res.status(404).json({ message: "Flashcard not found" });
		}
		if (flashcard.deckId) {
			const deck = await FlashcardDeck.findById(flashcard.deckId);
			if (deck) {
				deck.cardCount = await Flashcard.countDocuments({ deckId: deck._id });
				await deck.save();
				logger.info(`Updated card count for deckId: ${deck._id}`);
			}
		}
		logger.info(`Flashcard deleted successfully with id: ${req.params.id}`);
		res.json({ message: "Flashcard deleted successfully" });
	} catch (error) {
		logger.error({
			message: `Error deleting flashcard with id: ${req.params.id}`,
			error: error.message,
		});
		res.status(500).json({ message: "Server error deleting flashcard" });
	}
};

const reviewFlashcard = async (req, res) => {
	try {
		const { isCorrect } = req.body;
		logger.info(
			`Recording review for flashcard: ${req.params.id}, isCorrect: ${isCorrect}`
		);
		const flashcard = await Flashcard.findOne({
			_id: req.params.id,
			userId: req.userId,
		});
		if (!flashcard) {
			logger.warn(`Flashcard not found for review with id: ${req.params.id}`);
			return res.status(404).json({ message: "Flashcard not found" });
		}

		flashcard.reviewCount += 1;
		if (isCorrect) flashcard.correctCount += 1;
		flashcard.lastReviewed = new Date();

		const accuracy = flashcard.correctCount / flashcard.reviewCount;
		let nextReviewDays = 1;
		if (accuracy >= 0.8)
			nextReviewDays = Math.min(flashcard.reviewCount * 2, 30);
		else if (accuracy >= 0.6)
			nextReviewDays = Math.min(flashcard.reviewCount, 7);

		flashcard.nextReview = new Date(
			Date.now() + nextReviewDays * 24 * 60 * 60 * 1000
		);
		await flashcard.save();
		logger.info(`Review recorded successfully for flashcard: ${req.params.id}`);
		res.json({ message: "Review recorded successfully", flashcard });
	} catch (error) {
		logger.error({
			message: `Error recording review for flashcard: ${req.params.id}`,
			error: error.message,
		});
		res.status(500).json({ message: "Server error recording review" });
	}
};

const createDeck = async (req, res) => {
	try {
		const { name, description, tags = [] } = req.body;
		logger.info(`Creating new deck for user: ${req.userId}`);
		if (!name) {
			logger.warn(
				`Deck creation failed for user: ${req.userId}. Missing name.`
			);
			return res.status(400).json({ message: "Deck name is required" });
		}
		const deck = new FlashcardDeck({
			userId: req.userId,
			name,
			description,
			tags,
		});
		await deck.save();
		logger.info(`Deck created successfully with id: ${deck._id}`);
		res.status(201).json({ message: "Deck created successfully", deck });
	} catch (error) {
		logger.error({
			message: `Error creating deck for user: ${req.userId}`,
			error: error.message,
		});
		res.status(500).json({ message: "Server error creating deck" });
	}
};

const deleteDeck = async (req, res) => {
	try {
		logger.info(
			`Deleting deck with id: ${req.params.id} for user: ${req.userId}`
		);
		const deck = await FlashcardDeck.findOneAndDelete({
			_id: req.params.id,
			userId: req.userId,
		});
		if (!deck) {
			logger.warn(`Deck not found for deletion with id: ${req.params.id}`);
			return res.status(404).json({ message: "Deck not found" });
		}
		const deleteResult = await Flashcard.deleteMany({ deckId: req.params.id });
		logger.info(
			`Deleted ${deleteResult.deletedCount} associated flashcards for deckId: ${req.params.id}`
		);
		res.json({
			message: "Deck and all associated flashcards deleted successfully",
		});
	} catch (error) {
		logger.error({
			message: `Error deleting deck with id: ${req.params.id}`,
			error: error.message,
		});
		res.status(500).json({ message: "Server error deleting deck" });
	}
};

module.exports = {
	generateFlashcards,
	getDecks,
	getDeckById,
	getAllFlashcards,
	getFlashcardById,
	updateFlashcard,
	deleteFlashcard,
	reviewFlashcard,
	createDeck,
	deleteDeck,
};
